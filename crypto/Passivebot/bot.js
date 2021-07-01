//Ethers.js
const { ethers } = require('ethers'); 
const { Route, Trade, TradeType, TokenAmount, Percent } = require('@uniswap/sdk');

//Services
const tradeWindowService = require('../../services/tradeWindow');
const logMessageService = require('../../services/logMessage');
const transactionService = require('../../services/transaction');

//Utilities
const sleepHelper = require('../utilities/sleep');
const ChainId = require('../utilities/chainId');
const methods = require('../utilities/methods');

class Bot {

    //Helper to use this inside a listener function
    onNewTokenHandler;

    constructor(provider, router, botData, queue){
        this.provider = provider;
        this.router = router;
        this.bot = botData.bot;
        this.user = botData.user;
        this.generalConfCons = botData.generalConfCons;
        this.contractCodeCons = botData.contractCodeCons;
        this.queue = queue;

        //Save handler
        this.onNewTokenHandler = this.onNewToken.bind(this);

        //Set up account
        let etherProvider = new ethers.providers.WebSocketProvider(provider);
        let wallet        = new ethers.Wallet(this.bot.walletPrivate);
        this.account      = wallet.connect(etherProvider);
    }
    
    //Function called when a new token is given to the bot
    onNewToken = async function (contractProcessedData, tokenTracking, liquidityTracking, transactions) {

        console.log('on new token: ' + contractProcessedData.newToken.address);

        //Check number of trades
        if (transactions.number > bot.maxTransaction) return;

        //If it is successfuly validated
        if (await this.validate(contractProcessedData, tokenTracking, liquidityTracking)) {

            console.log('passed validation: ' + contractProcessedData.newToken.address)

            //Increase a number of transactions
            transactions.number = transactions.number + 1
   
            const currencyToken = contractProcessedData.currencyToken;
            const newToken      = contractProcessedData.newToken;

            const pair = methods.contructPair(contractProcessedData.token0, currencyToken.address, currencyToken.decimals, 
                                                                            newToken.address, newToken.decimals,
                                                                            ChainId.BSCMAINNET, contractProcessedData.pairAddress,
                                                                            contractProcessedData.liquidityDecimals, this.account);

            //Create a trade window
            let tradeWindow = await tradeWindowService.create({
                tokenAddress : newToken.address,
                tokenName : newToken.address,
                botId : this.bot.id
            })

            //Initialize trade
            const newTokenroute = new Route([pair], currencyToken)
            const newTokenTrade = new Trade(newTokenroute, new TokenAmount(currencyToken, ethers.utils.parseUnits(this.bot.initialAmount, 'ether'), TradeType.EXACT_INPUT))

            //Define parameters for trading
            const slippageTolerance = new Percent(this.bot.slippage, '100') // 50 bips, or 0.50%
            const amountOutMin = newTokenTrade.minimumAmountOut(slippageTolerance).raw // needs to be converted to e.g. hex
            const path = [currencyToken.address, newToken.address]
            const to = this.bot.walletAddress // should be a checksummed recipient address
            const deadline = Math.floor(Date.now() / 1000) + 60 * 20 // 20 minutes from the current Unix time
            const value = newTokenTrade.inputAmount.raw // // needs to be converted to e.g. hex

            //Define the router to perform the trade
            const router = new ethers.Contract(
                this.router,
                ['function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts);'],
                this.account
              );

            //Perform the trade
            let receipt;
            
            console.log('before buying: ' + contractProcessedData.newToken.address)

            /*
            try {
                const tx = router.swapExactETHForTokens(amountOutMin, path, to, deadline, {value: value});

                receipt = await tx.wait();

            } catch (error) {

                console.log(error);

                transactions.number = transactions.number - 1;

                return;
            }
            
            //If buy failed
            if (receipt.status == 0) {

                //TESTING STUFF
                console.log(receipt);

                await logMessageService.create({
                    content : "Failed to buy " + newToken.address,
                    tradeWindowId : tradeWindow.id,
                })

                //reduce number of transactions
                transactions.number = transaction.number - 1;

                return;
            }

            
            //Get account balance.
            //Should work as it is previously used
            router = new ethers.Contract(
                newToken.address,
                ['function balanceOf(address account) public view override returns (uint256)'],
                this.account
            )

            const currentTokens = await contract.balanceOf(this.bot.walletAddress);
            currentTokens = ethers.utils.formatUnits(currentTokens, currencyToken.decimals);

            //Create log
            await logMessageService.create({
                content : "Bought " + currentTokens + " of " + newToken.address,
                tradeWindowId : tradeWindow.id,
            })

            //Create transaction
            await transactionService.create({
                tokenGiven : currencyToken.address,
                givenAmount : this.bot.initialAmount,
                tokenReceived : newToken.address,
                receivedAmount : currentTokens,
                transactionStatusId : 1,
                tradeWindowId : tradeWindow.id
            })

            //Pass the trade to the job queue
            this.queue.add('sellSwap', {
                currencyTokenAddress: currencyToken.address,
                currencyDecimals: currencyToken.decimals,
                pairAddress: contractProcessedData.pairAddress,
                token0: contractProcessedData.token0,
                newTokenAddress: newToken.address,
                newTokenDecimals: newToken.decimals,
                liquidityDecimals: contractProcessedData.liquidityDecimals,
                tradeWindowId: tradeWindow.id,
                multiplier: this.bot.autoMultiplier,
                initialAmount: this.bot.initialAmount,
                slippage: this.bot.slippage,
                walletAddress: this.bot.walletAddress,
                walletPrivate: this.bot.walletPrivate,
                currentTokens: currentTokens,
                routerAddress: this.router,
                maxTime: this.bot.maxTime,
                provider: this.provider,
                transactions : transactions,
            });*/
        }
    }

    //Validates the new token received based on user's rules
    async validate(contractProcessedData, tokenTracking, liquidityTracking) {

        //Validate Time based constraints
        if (this.generalConfCons.timeBased) {

            //Sleep the required amount of time
            await sleepHelper.sleep(generalConfCons.timeForChecks * 1000);

            //Check owner renounced
            if (this.generalConfCons.ownerRenounced) {

                //Perform owner checkup
                let tokenContract = new ethers.Contract(
                    contractProcessedData.uniswapNewtoken.address,
                    ['function owner() public view returns (address)'],
                    this.account
                );

                //Retrieve owner and compare to dead address
                let owner = await tokenContract.owner();
                
                if (owner != "0x0000000000000000000000000000000000000000") return false;
            }

            //Check for maxLiqTokInAddress
            if (this.generalConfCons.maxLiqTokInAddress != 0 && liquidityTracking.holders.length) {
                let maxLiquidityHolder = liquidityTracking.holders[0];

                if (maxLiquidityHolder.value > this.generalConfCons.maxLiqTokInAddress) return false;
            }

            //Check for maxTokInAddress
            if (this.generalConfCons.maxTokInAddress != 0 && tokenTracking.holders.length) {
                let maxHolder = tokenTracking.holders[0];

                if (maxHolder.value > this.generalConfCons.maxTokInAddress) return false;
            }

            //Check for minNumberOfTxs
            if (this.generalConfCons.minNumberOfTxs != 0) {

                if (this.generalConfCons.minNumberOfTxs > tokenTracking.numberTxs) return false;
            }

            //Check for minNumberOfHolders
            if (this.generalConfCons.minNumberOfHolders != 0) {

                if (this.generalConfCons.minNumberOfHolders > tokenTracking.holders.length) return false;
            }
        }

        //1. Market cap
        if (this.generalConfCons.marketCap) {

            let contractMarketCap = contractProcessedData.marketCap;

            if (contractMarketCap < this.generalConfCons.minCap || contractMarketCap > this.generalConfCons.maxCap) return false;
            
        }

        //2. Liquidity
        if (this.generalConfCons.liquidity) {

            let contractLiquidity = contractProcessedData.liquidity;

            if (contractLiquidity < this.generalConfCons.minLiq || contractLiquidity > this.generalConfCons.maxLiq) return false;
            
        }

        //3. Coding
        let contractCode = contractProcessedData.sourceCode;

        //Iterate over all contract constraints to check in code
        for (let cons of this.contractCodeCons) {

            let includesCode = contractCode.includes(cons.sourceCode);

            if ((includesCode && cons.avoid) || (!includesCode && !cons.avoid)) return false;    
        }

        return true;
    }

    //Function that tries to trade the token for a profit
    processSellOrder =  async function (job) {

        //Retrieve data
        tradeData = job.data;

        //Set Initial parameters (serializable)
        const currencyTokenAddress = tradeData.currencyTokenAddress;
        const newTokenAddress = tradeData.newTokenAddress;
        const pairAddress = tradeData.pairAddress;
        const token0 = tradeData.token0;
        const currencyDecimals = tradeData.currencyDecimals;
        const newTokenDecimals = tradeData.newTokenDecimals;
        const liquidityDecimals = tradeData.liquidityDecimals;
        const tradeWindowId = tradeData.tradeWindowId;
        const multiplier = tradeData.multiplier;
        const initialAmount = tradeData.initialAmount;
        const slippage = tradeData.slippage;
        const walletAddress = tradeData.walletAddress;
        const walletPrivate = tradeData.walletPrivate;
        const currentTokens = tradeData.currentTokens;
        const routerAddress = tradeData.routerAddress;
        const maxTime = tradeData.maxTime ? tradeData.maxTime : 300;

        //Initialize required parameters
        const etherProvider = new ethers.providers.WebSocketProvider(tradeData.provider);
        const wallet        = new ethers.Wallet(walletPrivate);
        const account       = wallet.connect(etherProvider);

        //Initialize routers
        const router = new ethers.Contract(
            routerAddress,
            [
              'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts);'
            ],
            account
        );
        
        //Send a request for the price every 5 seconds
        let sellTimer = setInterval(async () => {
            //Check execution price
            const pair = methods.contructPair(token0, currencyTokenAddress, currencyDecimals, 
                                              newTokenAddress, newTokenDecimals,
                                              ChainId.BSCMAINNET, pairAddress,
                                              liquidityDecimals, account);
            
            const route = new Route([pair], newTokenAddress)

            const trade = new Trade(route, new TokenAmount(newTokenAddress, ethers.utils.parseUnits(currentTokens, newTokenDecimals)), TradeType.EXACT_INPUT)                                  

            const currencyIfSwapped = trade.executionPrice.toSignificant(6);

            //If the amount given is the desired amount
            if (currencyIfSwapped >= multiplier * initialAmount) {

                //Approve the token
                let abi = ["function approve(address _spender, uint256 _value) public returns (bool success)"];
                let contract = new ethers.Contract(newTokenAddress, abi, account);
                await contract.approve(router, ethers.utils.parseUnits(currentTokens, newTokenDecimals));

                //Create log
                await logMessageService.create({
                    content : "Trading of token " + newToken.address + " was approved",
                    tradeWindowId : tradeWindowId,
                })

                //Set up parameters
                const slippageTolerance = new Percent(slippage, '100') // 50 bips, or 0.50%
                const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw // needs to be converted to e.g. hex
                const path = [newTokenAddress, currencyTokenAddress]
                const to = walletAddress // should be a checksummed recipient address
                const deadline = Math.floor(Date.now() / 1000) + 60 * 20 // 20 minutes from the current Unix time
                const value = trade.inputAmount.raw // // needs to be converted to e.g. hex

                //Perform trade
                const tx = router.swapExactETHForTokens(amountOutMin, path, to, deadline, {value: value});
                const receipt = await tx.wait();

                if (receipt.status == 0) {

                    //Create log
                    await logMessageService.create({
                        content : "Failed to swap back " + newTokenAddress + " to currency token (bsc = bnb)",
                        tradeWindowId : tradeWindowId,
                    })

                    return;
                }

                //Create log
                await logMessageService.create({
                    content : "Bought " + multiplier * initialAmount + " of " + currencyToken.address,
                    tradeWindowId : tradeWindowId,
                })

                //Create transaction
                await transactionService.create({
                    tokenGiven : newToken.address,
                    givenAmount : currentTokens,
                    tokenReceived : currencyToken.address,
                    receivedAmount : multiplier * initialAmount,
                    transactionStatusId : 2,
                    tradeWindowId : tradeWindowId
                })

                //Reduce number of transactions
                transactions.number = transactions.number - 1;

                //End interval and  timer
                clearInterval(sellTimer)
                clearTimeout(timeout)
            }

        }, 5000)

        //Sets a timeout function given the user's configuration
        let timeout = setTimeout(async () => { 

            //Create log
            await logMessageService.create({
                content : "Bought " + currentTokens + " of " + newToken.address,
                tradeWindowId : tradeWindow.id,
            })

            //Create transaction
            await transactionService.create({
                tokenGiven : "Failed",
                givenAmount : 0,
                tokenReceived : "Failed",
                receivedAmount : 0,
                transactionStatusId : 3,
                tradeWindowId : tradeWindow.id
            })

            //Reduce number of transactions
            transactions.number = transactions.number - 1;

            clearInterval(sellTimer)
        
        }, maxTime * 1000)
    }
}

module.exports = Bot;