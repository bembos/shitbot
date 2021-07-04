//Ethers.js
const { ethers } = require('ethers'); 
const { Route, Pair, Trade, TradeType, TokenAmount, Percent } = require('@uniswap/sdk');

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

            //Create a trade window
            let tradeWindow = await tradeWindowService.create({
                tokenAddress : newToken.address,
                tokenName : newToken.address,
                botId : this.bot.id
            })

            //Define the router to perform the trade
            const swapRouter = new ethers.Contract(
                this.router,
                ['function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
                 'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
                 'function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)'],
                this.account
              );

            const liquidityRouter = new ethers.Contract(
                contractProcessedData.pairAddress,
                ['function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)'],
                this.account
            );

            //Define router to approve amount  to send
            const currencyRouter = new ethers.Contract(
                currencyToken.address,
                [
                  'function approve(address spender, uint amount) public returns(bool)',
                ],
                this.account
              );

            //Define parameters for trading
            const path = [currencyToken.address, newToken.address]
            const to   = this.bot.walletAddress 

            let amountIn     = ethers.utils.parseUnits(this.bot.initialAmount.toString(), currencyToken.decimals);
            let amounts      = await swapRouter.getAmountsOut(amountIn, path);
            let amountOutMin = amounts[1].sub(amounts[1].mul(this.bot.slippage).div(100));
            let tx;
            let receipt;
            
            //Before trading approve amount to trade using pancake router
            try {
                tx = await currencyRouter.approve(this.router, amountIn, { gasLimit: '250000', gasPrice: ethers.utils.parseUnits('8', 'gwei')  });
                receipt = await tx.wait()
            } catch (error) {
                console.log(error);
                transactions.number = transactions.number - 1;
                return;
            }

            console.log("approved");

            //Perform the trade
            try {
                tx = await swapRouter.swapExactETHForTokens(amountOutMin, path, to, Date.now() + 1000 * 60 * 10, {value: amountIn, gasLimit: '250000', gasPrice: ethers.utils.parseUnits('8', 'gwei') })
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

            console.log('-------------------------------------------------------')
            console.log('BOUGHT: ' + newToken.address);
            console.log('-------------------------------------------------------')

            //Get account balance. hould work as it is previously used
            const newTokenRouter = new ethers.Contract(
                newToken.address,
                ['function balanceOf(address account) public view returns (uint256)',
                 'function approve(address _spender, uint256 _value) public returns (bool success)'],
                this.account
            )

            //Retrieve current tokens and format
            let currentTokens = await newTokenRouter.balanceOf(this.bot.walletAddress);

            console.log("current tokens before format: " + currentTokens);
            console.log("current tokens after format: " + ethers.utils.formatUnits(currentTokens, newToken.decimals));

            //Create log
            await logMessageService.create({
                content : "Bought " + ethers.utils.formatUnits(currentTokens, newToken.decimals) + " of " + newToken.address,
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

            this.asyncSellSwap(contractProcessedData, currentTokens, swapRouter, newTokenRouter, liquidityRouter, tradeWindow, transactions, this.bot.maxTime, this.bot.autoMultiplier, this.bot.initialAmount);
        }
    }

    //Validates the new token received based on user's rules
    async validate(contractProcessedData, tokenTracking, liquidityTracking) {

        //Validate Time based constraints
        if (this.generalConfCons.timeBased) {

            //Sleep the required amount of time
            await sleepHelper.sleep(this.generalConfCons.timeForChecks * 1000);

            //Check owner renounced
            if (this.generalConfCons.ownerRenounced) {
                console.log("Entered owner");
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
                console.log("Passed owner");
            }

            //Check for maxLiqTokInAddress
            if (this.generalConfCons.maxLiqTokInAddress != 0 && liquidityTracking.holders.length) {
                console.log("Entered max liquidity token");

                let maxLiquidityHolder;

                liquidityTracking.holders.forEach(holder => {
                    if (!holder.contract && !maxLiquidityHolder) {
                        maxLiquidityHolder = holder;
                    }
                });

                if (maxLiquidityHolder.value / liquidityTracking.totalSupply * 100 > this.generalConfCons.maxLiqTokInAddress) return false;
                console.log("Passed max liquidity token");
            }

            //Check for maxTokInAddress
            if (this.generalConfCons.maxTokInAddress != 0 && tokenTracking.holders.length) {
                console.log("Entered max token");

                let maxHolder;

                tokenTracking.holders.forEach(holder => {
                    if (!holder.contract && !maxHolder) {
                        maxHolder = holder;
                    }
                });

                if (maxHolder.value / tokenTracking.totalSupply * 100 > this.generalConfCons.maxTokInAddress) return false;
                console.log("Passed max token");
            }

            //Check for minNumberOfTxs
            if (this.generalConfCons.minNumberOfTxs != 0) {
                console.log("Entered min number of txs");

                if (this.generalConfCons.minNumberOfTxs > tokenTracking.numberTxs) return false;
                console.log("Passed min number of txs");
            }

            //Check for minNumberOfHolders
            if (this.generalConfCons.minNumberOfHolders != 0) {
                console.log("Entered min number of Holders");

                if (this.generalConfCons.minNumberOfHolders > tokenTracking.holders.length) return false;
                console.log("Passed min number of Holders");
            }
        }

        //1. Market cap
        if (this.generalConfCons.marketCap) {

            console.log('Entered market cap')
            let contractMarketCap = contractProcessedData.marketCap;

            if (contractMarketCap > this.generalConfCons.minCap || contractMarketCap < this.generalConfCons.maxCap) return false;
            console.log('Left market cap')
            
        }

        //2. Liquidity
        if (this.generalConfCons.liquidity) {

            console.log('Entered Liquidity')
            let contractLiquidity = contractProcessedData.liquidity;

            if (contractLiquidity > this.generalConfCons.minLiq || contractLiquidity < this.generalConfCons.maxLiq) return false;
            console.log('Left liquidity')
        }

        //3. Coding
        let contractCode = contractProcessedData.sourceCode;
        console.log('Entered code')
        //Iterate over all contract constraints to check in code
        for (let cons of this.contractCodeCons) {

            let includesCode = contractCode.includes(cons.sourceCode);

            if ((includesCode && cons.avoid) || (!includesCode && !cons.avoid)) return false;    
        }

        return true;
    }

    //Async function which will try to sell every couple of seconds
    async asyncSellSwap(contractProcessedData, currentTokens, swapRouter, newTokenRouter, liquidityRouter, tradeWindow, transactions, maxTime, multiplier, initialAmount) {        
        
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

            let amounts      = await swapRouter.getAmountsOut(currentTokens, [newToken.address, currencyToken.address]);
            let amountOutMin = ethers.utils.formatUnits(amounts[1].sub(amounts[1].mul(this.bot.slippage).div(100)), currencyToken.decimals);

            console.log("currency if swapped: " + amountOutMin)
            console.log("expected price: " +  multiplier * initialAmount)

            //If the amount given is the desired amount
            if (amountOutMin >= multiplier * initialAmount) {

                console.log('ENTERED SALES IN : ' + newToken.address)
                /*
                //Approve the token
                try {
                    await newTokenRouter.approve(this.router, currentTokens);
                } catch (error) {
                    console.log(error);
                    currentTime = maxTime;
                    status = 3;

                    await logMessageService.create({
                        content : "Couldn't approve " + newToken.address,
                        tradeWindowId : tradeWindow.id,
                    })
                }*/

                console.log('Approved sell')
                
                //Create log
                await logMessageService.create({
                    content : "Trading of token " + newToken.address + " was approved",
                    tradeWindowId : tradeWindow.id,
                })

                //Initialize sell parameters
                let amountIn     = currentTokens;
                let amounts      = await swapRouter.getAmountsOut(amountIn, [newToken.address, currencyToken.address]);
                let amountOutMin = amounts[1].sub(amounts[1].mul(this.bot.slippage).div(100));

                //Perform swap
                let receipt;
                try { 
                    let tx = await routerV2.swapExactTokensForETH(amountIn,  amountOutMin, [newToken.address, currencyToken.address], this.bot.walletAddress , Date.now() + 1000 * 60 * 10, { gasLimit: '250000', gasPrice: ethers.utils.parseUnits('6', 'gwei')  })
                    receipt = await tx.wait();
                } catch (error) {
                    console.log("COULDN't SELL:" + newToken.address)
                    console.log(error);
                    currentTime = maxTime;
                    status = 3;

                    await logMessageService.create({
                        content : "Failed to sell" + newTokenAddress,
                        tradeWindowId : tradeWindowId,
                    })
                }

                console.log('-------------------------------------------------------')
                console.log('SOLD: ' + newToken.address);
                console.log('-------------------------------------------------------')
    
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
        /*
        if (status == 3) {

            //Try one last time to sell
            let amountIn = currentTokens;
            let amounts = await swapRouter.getAmountsOut(amountIn, [newToken.address, currencyToken.address]);
            let amountOutMin = amounts[1].sub(amounts[1].mul(this.bot.slippage).div(100));

            //Perform swap
            let receipt;
            try { 
                let tx = await swapRouter.swapExactTokensForETH(amountIn,  amountOutMin, [newToken.address, currencyToken.address], this.bot.walletAddress , Date.now() + 1000 * 60 * 10, { gasLimit: '250000', gasPrice: ethers.utils.parseUnits('10', 'gwei')  })
                receipt = await tx.wait();
            } catch (error) {
                console.log("COULDN't SELL in last effort:" + newToken.address)
                console.log(error);
                transactions.number = transactions.number - 1;

                await logMessageService.create({
                    content : "Failed to sell at timeout" + newTokenAddress,
                    tradeWindowId : tradeWindowId,
                })

                return;
            }

            console.log('SOLD AT LESS')

            //Create log
            await logMessageService.create({
                content : "Timed out/Sold at deadline " + contractProcessedData.uniswapNewtoken.address,
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
        }*/

        console.log('Finished ' + contractProcessedData.uniswapNewtoken.address)
    }
}

module.exports = Bot;