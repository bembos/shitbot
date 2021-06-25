//Ethers.js
const { ethers } = require('ethers'); 
const { ChainId, Token, Fetcher, Route, Trade, TradeType, TokenAmount, Percent } = require('@uniswap/sdk');

//Services
const tradeWindowService = require('../../services/tradeWindow');
const logMessageService = require('../../services/logMessage');
const transactionService = require('../../services/transaction');

class Bot {

    //Helper to use this inside a listener function
    self = this;

    constructor(provider, router, botData, queue){
        this.provider = provider;
        this.router = router;
        this.bot = botData.bot;
        this.user = botData.user;
        this.generalConfCons = botData.generalConfCons;
        this.contractCodeCons = botData.contractCodeCons;
        this.queue = queue;
    }
    
    //Function called when a new token is given to the bot
    onNewToken = async function (currencyTokenAddress, newTokenAddress, contractProcessedData, transactions) {

        //Check number of trades
        if (transactions.number > bot.maxTransaction) return;

        //If it is successfuly validated
        if (this.validate(contractProcessedData)) {

            //Increase a number of transactions
            transactions.number = transactions.number + 1;
            
            //Initialize data
            const provider = new ethers.providers.WebSocketProvider(self.provider);;
            const wallet   = ethers.Wallet(this.bot.walletPrivate);
            const account  = wallet.connect(provider);

            const currencyToken = contractProcessedData.currencyToken;
            const newToken      = contractProcessedData.newToken;
            const pair          = contractProcessedData.pair;

            //Create a trade window
            let tradeWindow = await tradeWindowService.create({
                tokenAddress : newTokenAddress,
                tokenName : newToken.name,
                botId : self.bot.id
            })

            //Initialize trade
            const newTokenroute = new Route([pair], currencyToken)
            const newTokenTrade = new Trade(newTokenroute, new TokenAmount(currencyToken, ethers.utils.parseUnits(self.bot.initialAmount, 'ether'), TradeType.EXACT_INPUT))

            //Define parameters for trading
            const slippageTolerance = new Percent(bot.slippage, '100') // 50 bips, or 0.50%
            const amountOutMin = newTokenTrade.minimumAmountOut(slippageTolerance).raw // needs to be converted to e.g. hex
            const path = [currencyTokenAddress, newTokenAddress]
            const to = self.bot.walletAddress // should be a checksummed recipient address
            const deadline = Math.floor(Date.now() / 1000) + 60 * 20 // 20 minutes from the current Unix time
            const value = newTokenTrade.inputAmount.raw // // needs to be converted to e.g. hex

            //Define the router to perform the trade
            const router = new ethers.Contract(
                self.router,
                [
                  'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts);',
                ],
                account
              );

            //Perform the trade
            const tx = router.swapExactETHForTokens(amountOutMin, path, to, deadline, {value: value});
            const receipt = await tx.wait();

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

            //Get account balance
            router = new ethers.Contract(
                newTokenAddress,
                [
                    "function balanceOf(address owner) view returns (uint256)",
                ],
                account
            )

            const currentTokens = await contract.balanceOf(self.bot.walletAddress);

            //Create log
            await logMessageService.create({
                content : "Bought " + currentTokens + " of " + newToken.name,
                tradeWindowId : tradeWindow.id,
            })

            //Create transaction
            await transactionService.create({
                tokenGiven : currencyToken.name,
                givenAmount : self.bot.initialAmount,
                tokenReceived : newToken.name,
                receivedAmount : currentTokens,
                transactionStatusId : 1,
                tradeWindowId : tradeWindow.id
            })

            //Pass the trade to the job queue
            self.queue.add('sellSwap', {
                currencyToken: currencyTokenAddress,
                newTokenAddress: newTokenAddress,
                tradeWindowId: tradeWindow.id,
                multiplier: self.bot.autoMultiplier,
                initialAmount: self.bot.initialAmount,
                slippage: self.bot.slippage,
                walletAddress: self.bot.walletAddress,
                walletPrivate: self.bot.walletPrivate,
                currentTokens: currentTokens,
                routerAddress: self.router,
                maxTime: self.bot.maxTime,
                provider: providerAddress,
                transactions : transactions
            });
        }
    }

    //Function that tries to trade the token for a profit
    processSellOrder =  async function (job) {

        //Retrieve data
        tradeData = job.data;

        //Set Initial parameters (serializable)
        const currencyTokenAddress = tradeData.currencyToken;
        const newTokenAddress = tradeData.newTokenAddress;

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
        const provider = ethers.providers.WebSocketProvider(tradeData.provider)
        const wallet   = ethers.Wallet(walletPrivate);
        const account  = wallet.connect(provider);

        const router = new ethers.Contract(
            routerAddress,
            [
              'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts);'
            ],
            account
        );
        
        //Fetch again token data
        const newtoken      = await Fetcher.fetchTokenData(ChainId.MAINNET, newTokenAddress, provider);
        const currencyToken = await Fetcher.fetchTokenData(ChainId.MAINNET, currencyTokenAddress, provider);
        const pair          = await Fetcher.fetchPairData(currencyToken, newToken, provider);

        const decimals = newtoken.decimals;

        const sellRoute = new Route([pair], newToken)
        const trade = new Trade(sellRoute, new TokenAmount(newToken, ethers.utils.parseUnits(currentTokens, decimals), TradeType.EXACT_INPUT))

        //Create a timeout for the sell timer

        //Send a request for the price every 5 seconds
        let sellTimer = setInterval(async () => {
            //Check current price
            const currencyIfSwapped = trade.executionPrice.toSignificant(6);

            //If the amount given is the desired amount
            if (currencyIfSwapped >= multiplier * initialAmount) {

                //Approve the token
                let abi = ["function approve(address _spender, uint256 _value) public returns (bool success)"];
                let contract = new ethers.Contract(newTokenAddress, abi, account);
                await contract.approve(router, ethers.utils.parseUnits(currentTokens, decimals));

                //Create log
                await logMessageService.create({
                    content : "Trading of token " + newToken.name + " was approved",
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
                    content : "Bought " + multiplier * initialAmount + " of " + currencyToken.name,
                    tradeWindowId : tradeWindowId,
                })

                //Create transaction
                await transactionService.create({
                    tokenGiven : newToken.name,
                    givenAmount : currentTokens,
                    tokenReceived : currencyToken.name,
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
                content : "Bought " + currentTokens + " of " + newToken.name,
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

    //Validates the new token received based on user's rules
    validate(contractProcessedData) {

        //Validate General Configuration Contraints

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

            includesCode = contractCode.includes(cons.sourceCode);

            if ((includesCode && cons.avoid) || (!includesCode && !cons.avoid)) return false;    
        }

        return true;
    }
}

module.exports = Bot;