//Ethers.js
const { ethers } = require('ethers'); 
const { ChainId, Token, Fetcher, Route, Trade, TradeType, TokenAmount, Percent } = require('@uniswap/sdk');


class Bot {

    onNewtoken;

    constructor(provider, router, botData, queue){
        this.provider = provider;
        this.router = router;
        this.bot = botData;
        this.user = botData.user;
        this.generalConfCons = botData.generalConfCons;
        this.contractCodeCons = botData.contractCodeCons;
        this.queue = queue;
    }
    
    onNewToken = function (currencyTokenAddress, newTokenAddress, contractProcessedData) {

        //If it is successfuly validated
        if (this.validate(contractProcessedData)) {
            
            //Initialize data
            const provider = this.provider
            const wallet   =  ethers.Wallet(this.bot.walletPrivate);
            const account  = wallet.connect(provider);

            const currencyToken = await Fetcher.fetchTokenData(ChainId.MAINNET, currencyTokenAddress, provider);
            const newToken      = await Fetcher.fetchTokenData(ChainId.MAINNET, newTokenAddress, provider);
            const pair          = await Fetcher.fetchPairData(WBNBToken, newToken, provider);

            const newTokenroute = new Route([pair], currencyToken)
            const newTokenTrade = new Trade(newTokenroute, new TokenAmount(currencyToken, ethers.utils.parseUnits(this.bot.initialAmount, 'ether').toString(), TradeType.EXACT_INPUT))


            //Define parameters for trading
            const slippageTolerance = new Percent(bot.slippage, '100') // 50 bips, or 0.50%
            const amountOutMin = newTokenTrade.minimumAmountOut(slippageTolerance).raw // needs to be converted to e.g. hex
            const path = [currencyTokenAddress, newTokenAddress]
            const to = this.bot.walletAddress // should be a checksummed recipient address
            const deadline = Math.floor(Date.now() / 1000) + 60 * 20 // 20 minutes from the current Unix time
            const value = newTokenTrade.inputAmount.raw // // needs to be converted to e.g. hex


            //Define the router to perform the trade
            const router = new ethers.Contract(
                this.router,
                [
                  'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts);',
                  'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts);'
                ],
                account
              );

            //Perform the trade
            const tx = router.swapExactETHForTokens(amountOutMin, path, to, deadline, {value: value}).send();
            const receipt = await tx.wait();

            //Construct trade structure


            //Pass the trade to the job queue
            

        }
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