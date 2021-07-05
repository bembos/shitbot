//Ethers.js
const ethers = require('ethers');
const { Token, Route, Trade, TradeType, TokenAmount, Pair } = require('@uniswap/sdk');


//Basic event class
const event = require('events');
const { env } = require('process');

//Axios to make api calls
const axios = require('axios');

//Utilities
const ContractProcessedData = require('../utilities/contractProcessedData');
const ChainId = require('../utilities/chainId');
const sleepHelper = require('../utilities/sleep');

class NewPairListener {

    //Helper to access this in function
    self = this;

    //Properties to be accessed later
    newTokenEvent;
    listenerHandler;
    
    //Set up required initial fields 
    constructor(currencyTokenAddress, stableTokenAddress, factoryAddress, providerAddress, burnAddress, walletAddress, router) {
        this.currencyTokenAddress = currencyTokenAddress;
        this.stableTokenAddress = stableTokenAddress;
        this.providerAddress = providerAddress
        this.factoryAddress = factoryAddress;
        this.burnAddress = burnAddress;
        this.router = router;

        //Set up the wallet
        this.provider = new ethers.providers.WebSocketProvider(providerAddress);
        let wallet    = new ethers.Wallet(walletAddress);
        this.account  = wallet.connect(this.provider);

        //Set up event listener
        this.newTokenEvent = new event.EventEmitter();
        this.newTokenEvent.setMaxListeners(0);
        

        //Reference to listener functions
        this.listenerHandler = this.onNewContract.bind(this);
    }

    async processData(newTokenAddress, pairAddress, tokenHolders, liquidityHolders) {

        //Accurate checks wait 1 sec before analizing
        //await sleepHelper.sleep(1000);

        let sourceCode = "";
        let marketCap = 0;
        let liquidity = 0;

        //Retrieve source code if verified using bscscan
        let response = await axios.get(`https://api.bscscan.com/api?module=contract&action=getsourcecode&address=${newTokenAddress}&apikey=${process.env.BSCSCAN_APIKEY}`);

        //If there was any problem with the request or the source code isn't verified or maximum amount of request reached return null
        if (response.data.status == "0" || response.data.result[0].SourceCode == "")  {
            console.log('Code not validated');
            return;
        }

        sourceCode = response.data.result[0].SourceCode

        //**Initializes Variables for processing */
        let pancakeSwapRouter = new ethers.Contract(
            this.router,
            ['function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)'],
            this.account
        );

        let liquidityContract = new ethers.Contract(
            pairAddress,
            ['function token0() external view returns (address)',
             'function totalSupply() public view returns (uint256)',
             'function balanceOf(address account) public view returns (uint256)',
             'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
             'function decimals() external pure returns (uint8)'],
            this.account
          );

        let tokenContract = new ethers.Contract(
            newTokenAddress,
            ['function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)',
             'function totalSupply() public view returns (uint256) ', 
             'function balanceOf(address account) public view returns (uint256)',
             'function owner() public view returns (address)',
             'function decimals() external pure returns (uint8)'],
            this.account
        );

        let owner;
        let totalLiquidityTokens;
        let liquidityBurned;
        let tokenTotalSupply;
        let tokenBurned;
        let liquidityOwnerBalance;
        let tokenOwnerBalance;
        let currencyInStablePrice;
        let newTokenInCurrencyPrice;
        let parsedReserves = [];
        let uniswapCurrencyToken;
        let uniswapToken;
        let uniswapPair;
        let token0;
        let liquidityDecimals;
        let pairAddressTokens;
        
        //Perform calls to the contract. If the contract doesn't have one of the functions its probably a scam. Log the errors for testing
        try {
            //Owners
            owner = await tokenContract.owner();  

            //Get decimals and set it in the holder
            liquidityDecimals = await liquidityContract.decimals();
            let tokenDecimals = await tokenContract.decimals();
            liquidityHolders.decimals = liquidityDecimals;
            tokenHolders.decimals = tokenDecimals;

            //Get total liquidity tokens
            totalLiquidityTokens = await liquidityContract.totalSupply();
            totalLiquidityTokens = ethers.utils.formatUnits(totalLiquidityTokens, liquidityDecimals);

            liquidityBurned      = await liquidityContract.balanceOf('0x000000000000000000000000000000000000dEaD');
            liquidityBurned      = ethers.utils.formatUnits(liquidityBurned, tokenDecimals);
            
            //Check if owner has liquidity tokens
            liquidityOwnerBalance = await liquidityContract.balanceOf(owner);
            liquidityOwnerBalance = ethers.utils.formatUnits(liquidityOwnerBalance, liquidityDecimals);

            //Liquidiy reserves
            token0 = await liquidityContract.token0();
            let reserves = await liquidityContract.getReserves()

            parsedReserves[0] = ethers.utils.formatUnits(reserves[0], liquidityDecimals);
            parsedReserves[1] = ethers.utils.formatUnits(reserves[1], liquidityDecimals);

            //Check order just in case
            if (token0 != this.currencyTokenAddress) {
                let temp = parsedReserves[0]
                parsedReserves[0] = parsedReserves[1];
                parsedReserves[1] = temp; 
            }

            //Get total tokens
            tokenTotalSupply = await tokenContract.totalSupply();
            tokenTotalSupply = ethers.utils.formatUnits(tokenTotalSupply, tokenDecimals);

            //Test getting tokens of contract
            pairAddressTokens = await tokenContract.balanceOf(pairAddress);
            pairAddressTokens = ethers.utils.formatUnits(pairAddressTokens, tokenDecimals);

            //Token burned
            tokenBurned      = await tokenContract.balanceOf('0x000000000000000000000000000000000000dEaD');
            tokenBurned      = ethers.utils.formatUnits(tokenBurned, tokenDecimals);

            //Check if owner has tokens
            tokenOwnerBalance = await tokenContract.balanceOf(owner);
            tokenOwnerBalance = ethers.utils.formatUnits(tokenOwnerBalance, tokenDecimals);

            //Get how much 1 token of currency (BNB) is in stable (usd)
            let result = await pancakeSwapRouter.getAmountsOut(
                1,
                [ethers.utils.getAddress(this.currencyTokenAddress), ethers.utils.getAddress(this.stableTokenAddress)]
            )

            currencyInStablePrice = result[1].toNumber();

            uniswapCurrencyToken = new Token(ChainId.BSCMAINNET, this.currencyTokenAddress, 18)
            uniswapToken         = new Token(ChainId.BSCMAINNET, newTokenAddress, tokenDecimals)
          
            const tokens = [uniswapCurrencyToken, uniswapToken]
            const [tokenA, tokenB] = tokens[0].sortsBefore(tokens[1]) ? tokens : [tokens[1], tokens[0]]

            uniswapPair = new Pair(new TokenAmount(tokenA, reserves[0]), new TokenAmount(tokenB, reserves[1]))
            
            const route = new Route([uniswapPair], uniswapToken)

            const trade = new Trade(route, new TokenAmount(uniswapToken, ethers.utils.parseUnits('1', tokenDecimals)), TradeType.EXACT_INPUT)
            
            newTokenInCurrencyPrice = trade.executionPrice.toFixed(20);
        } catch (error) {
            return null;
        }

        //**Process liquidity**//
        
        //Retrive the reserves of the pair in bot tokens
        const currencyReserve = parsedReserves[0];
        const newTokenReserve = parsedReserves[1];

        //Retrieve execution price of both tokens and calculate liquidity pool 
        let currencyReserveTotal = currencyReserve * currencyInStablePrice;
        let newTokenReserveTotal = /*newTokenReserve * newTokenInCurrencyPrice * currencyInStablePrice*/ 0; 
        liquidity = newTokenReserveTotal + currencyReserveTotal;
       
        totalLiquidityTokens         = totalLiquidityTokens - liquidityBurned;
        liquidityHolders.totalSupply = totalLiquidityTokens; 

        //If the owner has balance add it as a holder
        if (liquidityOwnerBalance) {
            liquidityHolders.holders.push({address: owner, value: liquidityOwnerBalance});
        }

        //**Process marketcap *//
        tokenTotalSupply         = tokenTotalSupply - tokenBurned;
        marketCap                = tokenTotalSupply * newTokenInCurrencyPrice * currencyInStablePrice;
        tokenHolders.totalSupply = tokenTotalSupply
        
        //If the owner has balance add it as a holder
        if (tokenOwnerBalance) {
            tokenHolders.holders.push({address: owner, value: tokenOwnerBalance, contract: false});
        }

        //If the contract has tokens add it as a holder
        if (pairAddressTokens) {
            tokenHolders.holders.push({address: pairAddress, value: pairAddressTokens, contract: true})
        }

        console.log('\nAddress: ' + newTokenAddress)
        console.log('Market cap: ' + marketCap);
        console.log('Liquidity: ' + liquidity + '\n');

        return new ContractProcessedData(uniswapCurrencyToken, uniswapToken, pairAddress, token0, marketCap, liquidity, liquidityDecimals, sourceCode);
    }

    transferTracking(tokenHolders, liquidityHolders, tokenOut, pairAddress) {

        //Set up token transfer listener
        let tokenRouter = new ethers.Contract(
            tokenOut,
            ['event Transfer(address indexed from, address indexed to, uint value)'],
            this.account
        );

        tokenRouter.on('Transfer', (from, to, value) => {

            //Fomrat value
            value = ethers.utils.formatUnits(value, tokenHolders.decimals);

            //Increae number of transactions
            tokenHolders.numberTxs = tokenHolders.numberTxs + 1;

            //Special case if token are sent to a burn address
            if (to == '0x0000000000000000000000000000000000000000' || to == '0x000000000000000000000000000000000000dEaD'){
                tokenHolders.totalSupply = tokenHolders.totalSupply - value;
                return;
            }

            //If the transfer was from the pair address
            if (from == pairAddress) {

                //Initialize helper var
                let found = false;
                let contract = false;

                //If it sent to a contract
                if (this.provider.getCode(to) == "0x") contract = true;

                //Iterate over all holders
                tokenHolders.holders.forEach( (holder) => {
                    if (holder.address == to){
                        found = true;
                        holder.amount = holder.amount + value;
                    }
                });

                //If the address isn't in the holders array
                if (!found) {
                    tokenHolders.holders.push({ address : to, value : value, contract: contract});

                    tokenHolders.numberHolders = tokenHolders.numberHolders + 1;
                }

                return;
            }

            //If the transfer was to this address
            if (to == pairAddress) {
                
                //Iterate over all holders
                tokenHolders.holders.forEach( (holder, index) => {
                    if (holder.address == from){
                        //Initialize helper var
                        let found = false;

                        found = true;
                        holder.amount = holder.amount - value;

                        //Remove from array
                        if (holder.amount == 0) {
                            tokenHolders.numberHolders - 1; 
                            tokenHolders.holders.splice(index,1);
                        }
                    }
                });

                return;
            }

            //Sort in descending order
            tokenHolders.holders.sort((holderA, holderB) => holderB.value - holderA.value);
        });

        //Set up liquidity transfer listener
        let liquidityRouter = new ethers.Contract(
            pairAddress,
            ['event Transfer(address indexed from, address indexed to, uint value)'],
            this.account
        );

        liquidityRouter.on('Transfer', (from, to, value) => {

            //Format value
            value = ethers.utils.formatUnits(value, liquidityHolders.decimals);

            //Special case if token are sent to a burn address
            if (to == '0x0000000000000000000000000000000000000000' || to == '0x000000000000000000000000000000000000dEaD'){
                tokenHolders.totalSupply = tokenHolders.totalSupply - value;
                return;
            }
               
            //If the transfer was to this address, then just reduce the tokens that someone has
            if (to == pairAddress) {
                
                //Iterate over all holders
                liquidityHolders.holders.forEach( (holder, index) => {
                    if (holder.address == from){
                        found = true;
                        holder.amount = holder.amount - value;

                        //Remove from array
                        if (holder.amount == 0) {
                            liquidityHolders.holders.splice(index,1);
                        }
                    }
                });
            }
            //If it is from any other address just add it and remove it from other people
            else {
                let found = false;
                let contract = false;

                //If it sent to a contract
                if (this.provider.getCode(to) == "0x") contract = true;

                //Iterate over all holders
                liquidityHolders.holders.forEach( (holder) => {
                    if (holder.address == to){
                        found = true;
                        holder.amount = holder.amount + value;
                    }

                    if (holder.address == from) {
                        holder.amount = holder.amount + value;            
                    }
                });

                //If the address isn't in the holders array
                if (!found) {
                    liquidityHolders.holders.push({ address : to, value : value, contract: contract});
                }
            }
        });

        //Sort both arrays
        liquidityHolders.holders.sort((holderA, holderB) => holderB.value - holderA.value);

        //After 10 minutes stop listening to transfer events
        setTimeout(() => {

            tokenRouter.removeAllListeners('Transfer');
            liquidityRouter.removeAllListeners('Transfer');
        }, 30000)

        return [tokenHolders, liquidityHolders];
    }

    //Handles new contracts being created on pancake swap
    onNewContract = async function (token0, token1, pairAddress) {

        //Order the new tokens created
        let tokenIn, tokenOut;

        if(token0 === this.currencyTokenAddress) {
            tokenIn = token0; 
            tokenOut = token1;
        }
        
        if(token1 == this.currencyTokenAddress) {
            tokenIn = token1; 
            tokenOut = token0;
        }

        //If there isn't a token that is bought with WBNB return
        if(typeof tokenIn === 'undefined') {
            return;
        }

        /** Basics checks Passed initialize holders data */

        //This variable should have a lifespan of about 10 min. For that reasons it is handled in memory. 
        //If the amount of transactions grow too much, pass it to the database
        //Set up token holders transfers
        let tokenHolders = {
            address : tokenOut,
            numberTxs : 0,
            totalSupply : 0,
            decimals : 0,
            holders : []
        }

        //Set up liquidity holder transfers
        let liquidityHolders = { 
            address : pairAddress,
            totalSupply : 0,
            decimals : 0,
            holders : []
        }

        //Process the data
        let contractProcessedData = await this.processData(tokenOut, pairAddress, tokenHolders, liquidityHolders);

        //Process new token contract if basic checks are successful
        if (contractProcessedData) {

            //Initialize transfer tracking
            this.transferTracking(tokenHolders, liquidityHolders, tokenOut, pairAddress);

            this.newTokenEvent.emit('newToken', contractProcessedData, tokenHolders, liquidityHolders);
        } 
    }

    //Starts listening to pancake factory
    async start() {
        console.log('Listening');

        //Set up a contract with the pancake swap factory
        this.factory = new ethers.Contract(
            this.factoryAddress,
            ['event PairCreated(address indexed token0, address indexed token1, address pair, uint)'],
            this.account
          );
        
        //Set up the the funnctions
        this.factory.on('PairCreated', this.listenerHandler);
    }

    //Stops litening to pancake factory
    stop() {
        console.log('Stopped Listening');

        //If factory hasn't been initialized return
        if (!this.factory) return 
        
        //Removes the listener
        this.factory.removeListener('PairCreated', this.listenerHandler);
    }
}

module.exports = NewPairListener;