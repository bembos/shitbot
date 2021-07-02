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
    timerHolder = [];

    constructor(provider, router, botData){
        this.provider = provider;
        this.router = router;
        this.bot = botData.bot;
        this.user = botData.user;
        this.generalConfCons = botData.generalConfCons;
        this.contractCodeCons = botData.contractCodeCons;

        //Save handlers
        this.onNewTokenHandler = this.onNewToken.bind(this);
        this.sellTimerHandle   = this.sellTimer.bind(this);
        this.selltimeoutHandle = this.selltimeout.bind(this);

        //Set up account
        let etherProvider = new ethers.providers.WebSocketProvider(provider);
        let wallet        = new ethers.Wallet(this.bot.walletPrivate);
        this.account      = wallet.connect(etherProvider);
    }
    
    //Function called when a new token is given to the bot
    onNewToken = async function (contractProcessedData, tokenTracking, liquidityTracking, transactions) {

        console.log('on new token: ' + contractProcessedData.uniswapNewtoken.address);

        //Check number of trades
        if (transactions.number > this.bot.maxTransaction) return;

        //If it is successfuly validated
        if (await this.validate(contractProcessedData, tokenTracking, liquidityTracking)) {

            console.log('passed validation: ' + contractProcessedData.uniswapNewtoken.address)

            //Increase a number of transactions
            transactions.number = transactions.number + 1
   
            const currencyToken = contractProcessedData.uniswapCurrencyToken;
            const newToken      = contractProcessedData.uniswapNewtoken;

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
            const slippageTolerance = new Percent(this.bot.slippage, '100') 
            const amountOutMin      = newTokenTrade.minimumAmountOut(slippageTolerance).raw 
            const path              = [currencyToken.address, newToken.address]
            const to                = this.bot.walletAddress 
            const deadline          = Math.floor(Date.now() / 1000) + 60 * 20
            const value             = newTokenTrade.inputAmount.raw

            //Define the router to perform the trade
            const swapRouter = new ethers.Contract(
                this.router,
                ['function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts);'],
                this.account
              );

            //Perform the trade
            let receipt;
            
            console.log('before buying: ' + contractProcessedData.uniswapNewtoken.address)
   
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
                receivedAmount : currentTokens,
                transactionStatusId : 1,
                tradeWindowId : tradeWindow.id
            })

            //Send a request for the price every 5 seconds
            let intervalId = setInterval(this.sellTimerHandle(contractProcessedData, currentTokens, swapRouter, tradeWindow, transactions), 5000)

            //Sets a timeout function given the user's configuration
            let timeoutId = setTimeout(this.selltimeoutHandle(currentTokens, newToken, tradeWindow, transactions), maxTime * 1000)
            
            //Save timer and timeout reference id
            this.timerHolder.push({address: newToken.address, intervalId: intervalId, timeoutId : timeoutId});
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

        console.log(contractCode);

        //Iterate over all contract constraints to check in code
        for (let cons of this.contractCodeCons) {

            console.log('Checking for: ' + cons.sourceCode);

            let includesCode = contractCode.includes(cons.sourceCode);

            if ((includesCode && cons.avoid) || (!includesCode && !cons.avoid)) return false;    
        }

        return true;
    }

    sellTimer = async function (contractProcessedData, currentTokens, router, tradeWindow, transactions) {

        //Check execution price
        const currencyToken = contractProcessedData.uniswapCurrencyToken;
        const newToken      = contractProcessedData.uniswapNewtoken;

        const pair = methods.contructPair(contractProcessedData.token0, currencyToken.address, currencyToken.decimals, 
                                                                        newToken.address, newToken.decimals,
                                                                        ChainId.BSCMAINNET, contractProcessedData.pairAddress,
                                                                        contractProcessedData.liquidityDecimals, this.account);

        const route = new Route([pair], newToken.address)

        const trade = new Trade(route, new TokenAmount(newToken.address, ethers.utils.parseUnits(currentTokens, newToken.decimals)), TradeType.EXACT_INPUT)                                  

        const currencyIfSwapped = trade.executionPrice.toSignificant(6);

        //If the amount given is the desired amount
        if (currencyIfSwapped >= multiplier * initialAmount) {

            //Approve the token
            let abi = ["function approve(address _spender, uint256 _value) public returns (bool success)"];
            let contract = new ethers.Contract(newToken.address, abi, this.account);
            await contract.approve(this.router, ethers.utils.parseUnits(currentTokens, newToken.decimals));

            //Create log
            await logMessageService.create({
                content : "Trading of token " + newToken.address + " was approved",
                tradeWindowId : tradeWindow.id,
            })

            //Set up parameters
            const slippageTolerance = new Percent(this.bot.slippage, '100')
            const amountOutMin      = trade.minimumAmountOut(slippageTolerance).raw 
            const path              = [currencyToken.address, newToken.address]
            const to                = this.bot.walletAddress 
            const deadline          = Math.floor(Date.now() / 1000) + 60 * 20 
            const value             = trade.inputAmount.raw 

            //Perform trade
            let receipt;
            try {
                const tx      = router.swapExactETHForTokens(amountOutMin, path, to, deadline, {value: value});
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

            let holder = this.timerHolder.find((obj) => obj.address = newToken.address);
            let index = this.timerHolder.findIndex((obj) => obj.address = newToken.address);

            //End interval and  timer
            clearInterval(holder.intervalId)
            clearTimeout(holder.timeoutId)

            //Remove from array
            this.timerHolder.splice(index, 1);
        }
    }

    //Function that tries to trade the token for a profit
    selltimeout =  async function (currentTokens, newToken, tradeWindow, transactions) {
        
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

        //Clear inteval and remove from array
        let holder = this.timerHolder.find((obj) => obj.address = newToken.address);
        let index = this.timerHolder.findIndex((obj) => obj.address = newToken.address);

        clearInterval(holder.intervalId)

        //Remove from array
        this.timerHolder.splice(index, 1);
    }
}

module.exports = Bot;