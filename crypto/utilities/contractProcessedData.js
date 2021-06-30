class ContractProcessedData {

    constructor(uniswapCurrencyToken, uniswapNewtoken, pairAddress, pairToken0, marketCap, liquidity, sourceCode) {
        this.uniswapCurrencyToken = uniswapCurrencyToken;
        this.uniswapNewtoken = uniswapNewtoken;
        this.pairAddress = pairAddress
        this.pairToken0 = pairToken0;
        this.marketCap = marketCap;
        this.liquidity = liquidity;
        this.sourceCode = sourceCode;
    }
} 

module.exports = ContractProcessedData;