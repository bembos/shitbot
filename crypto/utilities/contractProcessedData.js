export class ContractProcessedData {

    constructor(currencyToken, newToken, pair, marketCap, liquidity, sourceCode) {
        this.currencyToken = currencyToken;
        this.newToken = newToken;
        this.pair = pair;
        this.marketCap = marketCap;
        this.liquidity = liquidity;
        this.sourceCode = sourceCode;
    }
} 