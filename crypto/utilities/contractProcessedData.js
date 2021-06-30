class ContractProcessedData {

    constructor(currencyTokenAddress, newTokenAddress, marketCap, liquidity, sourceCode) {
        this.currencyTokenAddress = currencyTokenAddress;
        this.newTokenAddress = newTokenAddress;
        this.marketCap = marketCap;
        this.liquidity = liquidity;
        this.sourceCode = sourceCode;
    }
} 

module.exports = ContractProcessedData;