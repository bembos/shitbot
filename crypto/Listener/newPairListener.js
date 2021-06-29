//Ethers.js
const ethers = require('ethers');
const { Token, Fetcher, Route, Trade, TradeType, TokenAmount } = require('@uniswap/sdk');


//Basic event class
const event = require('events');
const { env } = require('process');

//Axios to make api calls
const axios = require('axios');

//Utilities
const ContractProcessedData = require('../utilities/contractProcessedData');
const ChainId = require('../utilities/chainId');

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
        let etherProvider = new ethers.providers.WebSocketProvider(providerAddress);
        let wallet        = new ethers.Wallet(walletAddress);
        this.provider     = wallet.connect(etherProvider);

        //Reference to listener functions
        this.listenerHandler = this.onNewContract.bind(this);
    }

    async processData(newTokenAddress, liquidityHolders, tokenHolders) {

        let sourceCode = "";
        let marketCap = 0;
        let liquidity = 0;

        //Retrieve source code if verified using bscscan
        let response = await axios.get(`https://api-testnet.bscscan.com/api?module=contract&action=getabi&address=${newTokenAddress}&apikey=${process.env.BSCSCAN_APIKEY}`);

        //If there was any problem with the request or the source code isn't verified or maximum amount of request reached return null
        if (response.data.status == "0" || response.data.result[0].sourceCode == "")  {
            console.log('Code not validated');
            return;
        }
        
        sourceCode = response.data.sourceCode;
        
        //If Basic check pass initialze data
        const newToken = await Fetcher.fetchTokenData(ChainId.MAINNET, newTokenAddress, self.provider);
        const pair     = await Fetcher.fetchPairData(self.currencyToken, newToken, self.provider);

        const newTokenroute       = new Route([pair], newToken)
        const newTokenTrade       = new Trade(newTokenroute, new TokenAmount(self.currencyToken, ethers.utils.parseUnits('1', newToken.decimals), TradeType.EXACT_INPUT))
        const currencyInNewToken = newTokenTrade.executionPrice.toSignificant(6); //1 New token en BNB

        //**Initializes Variables for processing */
        let liquidityToken = pair.liquidityToken;

        let liquidityContract = new ethers.Contract(
            liquidityToken,
            ['function totalSupply() public view override returns (uint256) ',
             'function balanceOf(address account) public view override returns (uint256)'],
            this.provider
          );

        let tokenContract = new ethers.Contract(
            this.newTokenAddress,
            ['function totalSupply() public view override returns (uint256) ', 
             'function balanceOf(address account) public view override returns (uint256)',
             'function owner() public view virtual returns (address)'],
            this.provider
        );

        let currentStablePriceRouter = new ethers.Contract(
            this.router,
            ['function getAmountsOut(uint amountIn, address[] memory path) public view virtual override returns (uint[] memory amounts)'],
            this.provider
        );

        let owner;
        let totalLiquidityTokens;
        let liquidityBurned;
        let tokenTotalSupply;
        let tokenBurned;
        let liquidityOwnerBalance;
        let tokenOwnerBalance;
        let currencyInStablePrice;
        
        //Perform calls to the contract. If the contract doesn't have one of the functions its probably a scam. Log the errors for testing
        try {
            //Owners
            owner = await tokenContract.owner();  
            //Get total liquidity tokens
            totalLiquidityTokens = await liquidityContract.totalSupply().toNumber();
            liquidityBurned      = await liquidityContract.balanceOf(burnAddress).toNumber();   
            //Check if owner has liquidity tokens
            liquidityOwnerBalance = await liquidityContract.getBalanceOf(owner);
            //Get total tokens
            tokenTotalSupply = await tokenContract.totalSupply().toNumber();
            tokenBurned      = await tokenContract.balanceOf(burnAddress).toNumber();
            //Check if owner has tokens
            tokenOwnerBalance = await tokenContract.getBalanceOf(owner);

            let result = await currentStablePriceRouter.getAmountsOut(
                1,
                [ethers.utils.getAddress(this.currencyTokenAddress), ethers.utils.getAddress(this.stableTokenAddress)], 
                { 
                    gasPrice: "10000000000", 
                    gasLimit: "15000000000"
                }
            )
    
            currentStablePriceRouter = result[1].toNumber();

        } catch (error) {
            console.log(error);
            return null;
        }

        //**Process liquidity**//
        
        //Retrive the reserves of the pair in bot tokens
        const currencyReserve = pair.reserve0;
        const newTokenReserve = pair.reserve1;

        //Retrieve execution price of both tokens and calculate liquidity pool 
        let currencyReserveTotal = currencyReserve * currencyInStablePrice;
        let newTokenReserveTotal = currencyInNewToken * newTokenReserve * currencyInStablePrice; 
        liquidity = newTokenReserveTotal + currencyReserveTotal;

        console.log("liquidity: " + liquidity);

        totalLiquidityTokens         = totalLiquidityTokens - liquidityBurned;
        liquidityHolders.totalSupply = totalLiquidityTokens; 

        //If the owner has balance add it as a holder
        if (liquidityOwnerBalance) {
            liquidityHolders.holders.push({address: owner, value: liquidityOwnerBalance});
        }

        //**Process marketcap *//
        tokenTotalSupply     = tokenTotalSupply - tokenBurned;
        marketCap                = tokenTotalSupply * currencyInNewToken * currencyInStablePrice;
        tokenHolders.totalSupply = tokenTotalSupply

        console.log("marketCap: " + marketCap, "total supply: " + tokenTotalSupply)
        
        //If the owner has balance add it as a holder
        if (tokenOwnerBalance) {
            tokenHolders.holders.push({address: owner, value: tokenOwnerBalance});
        }

        console.log('Token Holders: ' + tokenHolders.holders, 'Liquidity Holders: ' + liquidityHolders.holders)

        return [new ContractProcessedData(self.currencyToken, newToken, pair, marketCap, liquidity, sourceCode, self.providerAddress)];
    }

    transferTracking(tokenHolders, liquidityHolders, tokenOut, pairAddress) {

        //Set up token transfer listener
        let tokenRouter = new ethers.Contract(
            TokenOut,
            ['event Transfer(address indexed from, address indexed to, uint value);'],
            this.provider
        );

        tokenRouter.on('Transfer', (from, to, value) => {

            //Increae number of transactions
            tokenHolders.numberTxs = tokenHolders.numberTxs + 1;

            //Special case if token are sent to a burn address
            if (to == this.burnAddress){
                tokenHolders.totalSupply = tokenHolders.totalSupply - value;
            }

            //If the transfer was from this address
            if (from == tokenOut) {

                //Initialize helper var
                let found = false;

                //Iterate over all holders
                tokenHolders.holders.forEach( (holder) => {
                    if (holder.address == to){
                        found = true;
                        holder.amount = holder.amount + value;
                    }
                });

                //If the address isn't in the holders array
                if (!found) {
                    tokenHolders.holders.push({ address : to, value : value});

                    tokenHolders.numberHolders = tokenHolders.numberHolders + 1;
                }
            }

            //If the transfer was to this address
            if (to == tokenOut) {
                
                //Iterate over all holders
                tokenHolders.holders.forEach( (holder, index) => {
                    if (holder.address == from){
                        found = true;
                        holder.amount = holder.amount - value;

                        //Remove from array
                        if (holder.amount < 0) {
                            tokenHolders.numberHolders - 1; 
                            tokenHolders.holders.splice(index,1);
                        }
                    }
                });
            }

            //Sort in descending order
            tokenHolders.holders.sort((holderA, holderB) => holderB.value - holderA.value);
        });

        //Set up liquidity transfer listener
        let liquidityRouter = new ethers.Contract(
            pairAddress,
            ['event Transfer(address indexed from, address indexed to, uint value);'],
            this.provider
        );

        liquidityRouter.on('Transfer', (from, to, value) => {

            //Special case to check if address sent to is a contract and therefore locked
            if (this.provider.getCode(to) == "0x"){
                tokenHolders.totalSupply = tokenHolders.totalSupply - value;
            }

            //Special case if token are sent to a burn address
            if (to == this.burnAddress){
                tokenHolders.totalSupply = tokenHolders.totalSupply - value;
            }

            //If the transfer was from this address
            if (from == tokenOut) {

                //Initialize helper var
                let found = false;

                //Iterate over all holders
                liquidityHolders.holders.forEach( (holder) => {
                    if (holder.address == to){
                        found = true;
                        holder.amount = holder.amount + value;
                    }
                });

                //If the address isn't in the holders array
                if (!found) {
                    liquidityHolders.holders.push({ address : to, value : value});
                }
            }

            //If the transfer was to this address
            if (to == tokenOut) {
                
                //Iterate over all holders
                liquidityHolders.holders.forEach( (holder, index) => {
                    if (holder.address == from){
                        found = true;
                        holder.amount = holder.amount - value;

                        //Remove from array
                        if (holder.amount < 0) {
                            liquidityHolders.holders.splice(index,1);
                        }
                    }
                });
            }
        });

        //Sort both arrays
        liquidityHolders.holders.sort((holderA, holderB) => holderB.value - holderA.value);

        //After 10 minutes stop listening to transfer events
        setTimeout(() => {
            tokenRouter.removeAllListeners();
            liquidityRouter.removeAllListeners();
        }, 600000)

        return [tokenHolders, liquidityHolders];
    }

    //Handles new contracts being created on pancake swap
    onNewContract = async function (token0, token1, pairAddress) {
        
        console.log(`
              New pair detected
              =================
              token0: ${token0}
              token1: ${token1}
              pairAddress: ${pairAddress}
            `);

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
            console.log("Non bnb token")
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
            holders : []
        }

        //Set up liquidity holder transfers
        let liquidityHolders = { 
            address : pairAddress,
            totalSupply : 0,
            holders : []
        }

        //Process the data
        let contractProcessedData = await this.processData(tokenOut, tokenHolders, liquidityHolders);

        //Testing
        console.log(contractProcessedData);

        //Process new token contract if basic checks are successful
        if (contractProcessedData) {

            //Initialize transfer tracking
            //transferTracking(tokenIn, TokenOut, pairAddress);

            //newTokenEvent.emit('newToken', contractProcessedData, tokenTracking, liquidityTracking);
        } 
    }

    //Starts listening to pancake factory
    async start() {
        console.log('Listening');

        this.newTokenEvent = new event.EventEmitter();
        this.newTokenEvent.setMaxListeners(0);
        
        //Set up a contract with the pancake swap factory
        this.factory = new ethers.Contract(
            this.factoryAddress,
            ['event PairCreated(address indexed token0, address indexed token1, address pair, uint)'],
            this.provider
          );
        
        //TESTING PURPOSES ONLY
            /*
        let tokenHolders = { address : tokenOut, numberTxs : 0,  totalSupply : 0, holders : [] }

        let liquidityHolders = {  address : pairAddress, totalSupply : 0, holders : [] }

        this.processData('0x9A7C2C28407249669d091b13217aFF403B363928', tokenHolders, liquidityHolders);
*/
        //END TESTING
        
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