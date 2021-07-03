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

    //Fields to use
    onNewTokenHandler;

    constructor(provider, router, botData){
        this.provider = provider;
        this.router = router;
        this.bot = botData.bot;
        this.user = botData.user;
        this.generalConfCons = botData.generalConfCons;
        this.contractCodeCons = botData.contractCodeCons;

        //Save handlers
        this.onNewTokenHandler = this.onNewToken.bind(this);
        this.asyncSellSwap.bind(this);

        //Set up account
        let etherProvider = new ethers.providers.WebSocketProvider(provider);
        let wallet        = new ethers.Wallet(this.bot.walletPrivate);
        this.account      = wallet.connect(etherProvider);
    }
    
    //Function called when a new token is given to the bot
    onNewToken = async function (contractProcessedData, tokenTracking, liquidityTracking, transactions) {

        console.log(transactions.number)

        //Check number of trades
        if (transactions.number > this.bot.maxTransaction) return;

        //If it is successfuly validated
        if (await this.validate(contractProcessedData, tokenTracking, liquidityTracking)) {

            console.log('passed validation: ' + contractProcessedData.uniswapNewtoken.address)

            //Increase a number of transactions
            transactions.number = transactions.number + 1
   
            const currencyToken = contractProcessedData.uniswapCurrencyToken;
            const newToken      = contractProcessedData.uniswapNewtoken;

            const pair = await methods.contructPair(contractProcessedData.pairToken0, currencyToken.address, currencyToken.decimals, 
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
            let amountToTrade   = this.bot.initialAmount.toString();
            let newTokenroute   = new Route([pair], currencyToken)
            let newTokenTrade   = new Trade(newTokenroute, new TokenAmount(currencyToken, ethers.utils.parseUnits(amountToTrade, currencyToken.decimals)), TradeType.EXACT_INPUT)
         

            //Define parameters for trading
            const slippageTolerance = new Percent(this.bot.slippage, '100') 
            const amountOutMin      = newTokenTrade.minimumAmountOut(slippageTolerance).raw
            const path              = [currencyToken.address, newToken.address]
            const to                = this.bot.walletAddress 
            const deadline          = Math.floor(Date.now() / 1000) + 60 * 20
            const value             = newTokenTrade.inputAmount.raw

            //Define the router to perform the trade
            const swapRouter = new ethers.Contract(
                this.router,
                ['function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
                 'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)'],
                this.account
              );

            //Perform the trade
            let receipt;
            
            /*
            try {
                const tx = swapRouter.swapExactETHForTokens(amountOutMin, path, to, deadline, {value: value});
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
*/
            //Get account balance. hould work as it is previously used
            const router = new ethers.Contract(
                newToken.address,
                ['function balanceOf(address account) public view override returns (uint256)'],
                this.account
            )

            //Retrieve current tokens and format
            let currentTokens = await router.balanceOf(this.bot.walletAddress);
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
                receivedAmount : parseFloat(currentTokens),
                transactionStatusId : 1,
                tradeWindowId : tradeWindow.id
            })

            this.asyncSellSwap(contractProcessedData, currentTokens, swapRouter, tradeWindow, transactions, this.bot.maxTime, this.bot.autoMultiplier, this.bot.initialAmount);
        }
    }

    //Validates the new token received based on user's rules
    async validate(contractProcessedData, tokenTracking, liquidityTracking) {

        //Validate Time based constraints
        if (this.generalConfCons.timeBased) {

            console.log('Sleep')

            //Sleep the required amount of time
            await sleepHelper.sleep(this.generalConfCons.timeForChecks * 1000);

            console.log('Woke up')

            //Check owner renounced
            if (this.generalConfCons.ownerRenounced) {

                //Perform owner checkup
                let tokenContract = new ethers.Contract(
                    contractProcessedData.uniswapNewtoken.address,
                    ['function owner() public view returns (address)'],
                    this.account
                );
                
                let owner;

                //Retrieve owner and compare to dead address. Should work
                try {
                    owner = await tokenContract.owner();                    
                } catch (error) {
                    console.log(error);
                    return false;
                }
                
                if (owner != "0x0000000000000000000000000000000000000000") return false;
            }

            //Check for maxLiqTokInAddress
            if (this.generalConfCons.maxLiqTokInAddress != 0 && liquidityTracking.holders.length) {

                let maxLiquidityHolder;

                liquidityTracking.holders.forEach(holder => {
                    if (!holder.contract && !maxHolder) {
                        maxLiquidityHolder = holder;
                    }
                });

                if (maxLiquidityHolder.value / liquidityTracking.totalSupply * 100 > this.generalConfCons.maxLiqTokInAddress) return false;
            }

            //Check for maxTokInAddress
            if (this.generalConfCons.maxTokInAddress != 0 && tokenTracking.holders.length) {

                let maxHolder;

                tokenTracking.holders.forEach(holder => {
                    if (!holder.contract && !maxHolder) {
                        maxHolder = holder;
                    }
                });

                if (maxHolder.value / tokenTracking.totalSupply * 100 > this.generalConfCons.maxTokInAddress) return false;
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

            if (contractMarketCap > this.generalConfCons.minCap || contractMarketCap < this.generalConfCons.maxCap) return false;
            
        }

        //2. Liquidity
        if (this.generalConfCons.liquidity) {

            let contractLiquidity = contractProcessedData.liquidity;

            if (contractLiquidity > this.generalConfCons.minLiq || contractLiquidity < this.generalConfCons.maxLiq) return false;
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

    //Async function which will try to sell every couple of seconds
    async asyncSellSwap(contractProcessedData, currentTokens, swapRouter, tradeWindow, transactions, maxTime, multiplier, initialAmount) {        
        
        console.log('Entered Sales for ' + contractProcessedData.uniswapNewtoken.address)
        //Initialize variable
        let currentTime = 0;
        let status = 3;

        //Enter while loop that sleeps
        while (currentTime < maxTime) {

            console.log('Sleeping ' + contractProcessedData.uniswapNewtoken.address);
            //Increase condition time and sleep
            currentTime = currentTime + 5;
            await sleepHelper.sleep(5000);
            
            console.log('Woke up ' + contractProcessedData.uniswapNewtoken.address);

            //Check execution price
            const currencyToken = contractProcessedData.uniswapCurrencyToken;
            const newToken      = contractProcessedData.uniswapNewtoken;

            const pair = await methods.contructPair(contractProcessedData.token0, currencyToken.address, currencyToken.decimals, 
                                                                            newToken.address, newToken.decimals,
                                                                            ChainId.BSCMAINNET, contractProcessedData.pairAddress,
                                                                            contractProcessedData.liquidityDecimals, this.account);

            const route = new Route([pair], newToken)
            const trade = new Trade(route, new TokenAmount(newToken, ethers.utils.parseUnits(/*currentTokens*/ '10', newToken.decimals)), TradeType.EXACT_INPUT)                                  

            const currencyIfSwapped = trade.executionPrice.toSignificant(6);

            //If the amount given is the desired amount
            if (/*currencyIfSwapped >= multiplier * initialAmount*/true) {

                console.log('ENTERED SALES IN : ' + newToken.address)
                
                //Approve the token
                let abi = ["function approve(address _spender, uint256 _value) public returns (bool success)"];
                let contract = new ethers.Contract(newToken.address, abi, this.account);

                try {
                    await contract.approve(this.router, ethers.utils.parseUnits(currentTokens, newToken.decimals));
                } catch (error) {
                    console.log(error);
                    transactions.number = transactions.number - 1
                    break;
                }

                console.log('Approved token')
                
                //Create log
                await logMessageService.create({
                    content : "Trading of token " + newToken.address + " was approved",
                    tradeWindowId : tradeWindow.id,
                })

                //Set up parameters
                const slippageTolerance = new Percent(this.bot.slippage, '100')
                const amountOutMin      = trade.minimumAmountOut(slippageTolerance).raw 
                const path              = [newToken.address, currencyToken.address]
                const to                = this.bot.walletAddress 
                const deadline          = Math.floor(Date.now() / 1000) + 60 * 20 
                const value             = trade.inputAmount.raw 

                /*
                //Perform trade
                let receipt;
                try { 
                    const tx = swapRouter.swapExactTokensForETH(ethers.utils.parseUnits(currentTokens, newToken.decimals), amountOutMin, path, to, deadline, {value: value});
                    receipt = await tx.wait();
                } catch (error) {
                    console.log(error);
                    transactions.number = transactions.number - 1;
                    return;
                }
                
                if (receipt.status == 0) {

                    //Create log
                    await logMessageService.create({
                        content : "Failed to swap back " + newTokenAddress + " to currency token (bsc = bnb)",
                        tradeWindowId : tradeWindowId,
                    })
                    return;
                }
    */  
                //Create log
                await logMessageService.create({
                        content : "Bought " + multiplier * initialAmount + " of " + currencyToken.address,
                        tradeWindowId : tradeWindow.id,
                })

                //Create transaction
                await transactionService.create({
                    tokenGiven : newToken.address,
                    givenAmount : parseFloat(currentTokens),
                    tokenReceived : currencyToken.address,
                    receivedAmount : multiplier * initialAmount,
                    transactionStatusId : 2,
                    tradeWindowId : tradeWindow.id
                })

                //Reduce number of transactions
                transactions.number = transactions.number - 1;

                //Break loop
                currentTime = maxTime;
                status = 2;
            }
        }

        //If transaction failed create failed status entities
        if (status == 3) {

            console.log('COULDNT BUY')

            //Create log
            await logMessageService.create({
                content : "Timed out " + contractProcessedData.uniswapNewtoken.address,
                tradeWindowId : tradeWindow.id,
            })

            //Create transaction
            await transactionService.create({
                tokenGiven : contractProcessedData.uniswapNewtoken.address,
                givenAmount : 0,
                tokenReceived : contractProcessedData.uniswapCurrencyToken.address,
                receivedAmount : 0,
                transactionStatusId : 3,
                tradeWindowId : tradeWindow.id
            })

            transactions.number = transactions.number - 1;
        }

        console.log('Finished ' + contractProcessedData.uniswapNewtoken.address)
    }
}

module.exports = Bot;