//Ethers.js
const ethers = require('ethers');
const { ChainId, Token, Fetcher, Route, Trade, TradeType, TokenAmount } = require('@uniswap/sdk');


//Basic event class
const event = require('events');
const { env } = require('process');

//Axios to make api calls
const axios = require('axios');

//Utilities
const { ContractProcessedData} = require('../utilities/contractProcessedData');

class NewPairListener {

    //Helper to access this in function
    self = this;

    //Properties to be accessed later
    newTokenEvent;

    //Set up required initial fields 
    constructor(currencyTokenAddress, stableTokenAddress, factoryAddress, providerAddress) {
        this.currencyTokenAddress = currencyTokenAddress;
        this.stableTokenAddress = stableTokenAddress;
        this.providerAddress = providerAddress
        this.factoryAddress = factoryAddress;
        this.provider =  ethers.providers.WebSocketProvider(providerAddress);;
    }

    async processData(newTokenAddress) {

        let sourceCode = "";
        let marketCap = 0;
        let liquidity = 0;

        //Retrieve source code if verified using bscscan
        let response = await axios.get(`https://api.bscscan.com/api?module=contract&action=getsourcecode&address=${newTokenAddress}&apikey=${env('BSCSCAN_APIKEY')}`);

        //If there was any problem with the request or the source code isn't verified return null
        if (response.status == "0" || response,result[0].sourceCode == "")  return null;
        
        sourcecode = response.result[0].sourceCode;
        
        //If Basic check pass initialze data
        const currencyTrade  = new Trade(self.curencyRoute, new TokenAmount(self.currencyToken, ethers.utils.parseUnits('0.1', 'ether'), TradeType.EXACT_INPUT));
        const currencyInStablePrice = currencyTrade.executionPrice.toSignificant(6);

        const newToken = await Fetcher.fetchTokenData(ChainId.MAINNET, newTokenAddress, self.provider);
        const pair     = await Fetcher.fetchPairData(self.currencyToken, newToken, self.provider);

        const newTokenroute      = new Route([pair], self.currencyToken)
        const newTokenTrade      = new Trade(newTokenroute, new TokenAmount(self.currencyToken, ethers.utils.parseUnits('0.1', 'ether'), TradeType.EXACT_INPUT))
        const newTokenInCurrency = newTokenTrade.executionPrice.toSignificant(6);

        //**Process liquidity**//
        
        //Retrive the reserves of the pair in bot tokens
        const currencyReserve = pair.reserve0;
        const newTokenReserve = pair.reserve1;

        //Retrieve execution price of both tokens and calculate liquidity pool 
        let currencyReserveTotal = currencyReserve * currencyInStablePrice;
        let newTokenReserveTotal = newTokenInCurrency * newTokenReserve * currencyInStablePrice;
        liquidity = newTokenReserveTotal + currencyReserveTotal;

        //Process market cap
        let response    = await axios.get(`https://api.bscscan.com/api?module=stats&action=tokensupply&contractaddress=${newTokenAddress}&apikey=${env('BSCSCAN_APIKEY')}`);
        let totalSupply = response.result;
        marketCap       = totalSupply * newTokenInCurrency * currencyInStablePrice;

        return new ContractProcessedData(self.currencyToken, newToken, pair, marketCap, liquidity, sourceCode, self.providerAddress);
    }

    //Handles new contracts being created on pancake swap
    onNewContract = async function  (token0, token1, pairAddress) {
        
        console.log(`
              New pair detected
              =================
              token0: ${token0}
              token1: ${token1}
              pairAddress: ${pairAddress}
            `);

        //Order the new tokens created
        let tokenIn, tokenOut;
        if(token0 === self.currencyTokenAddress) {
            tokenIn = token0; 
            tokenOut = token1;
        }
        
        if(token1 == self.currencyTokenAddress) {
            tokenIn = token1; 
            tokenOut = token0;
        }

        //If there isn't a token that is bought with WBNB return
        if(typeof tokenIn === 'undefined') {
            return;
        }

        let contractProcessedData = await processData(tokenOut);

        //Emit a new event if basic checks are successful
        if (contractProcessedData) newTokenEvent.emit('newToken', tokenIn, tokenOut, contractProcessedData);
    }

    //Starts listening to pancake factory
    start() {
        
        //Initialize
        this.currencyToken  = await Fetcher.fetchTokenData(ChainId.MAINNET, this.currencyTokenAddress, this.provider);
        let stableToken     = await Fetcher.fetchTokenData(ChainId.MAINNET, this.stableTokenAddress, this.provider);
        let currencyPair    = await Fetcher.fetchPairData(stableToken, this.currencyToken, this.provider);
        this.curencyRoute    = new Route([currencyPair], this.WBNBToken)

        this.newTokenEvent = new event.EventEmitter();

        //Set up a contract with the pancake swap factory
        factory = new ethers.Contract(
            this.factoryAddress,
            ['event PairCreated(address indexed token0, address indexed token1, address pair, uint)'],
            this.provider
          );
        
        //Set up the the funnctions
        factory.on('PairCreated', this.onNewContract);
    }

    //Stops litening to pancake factory
    stop() {

        //If factory hasn't been initialized return
        if (!factory) return 

        //Removes the listener
        this.factory.removeListener('PairCreated', this.onNewContract);
    }
}

module.exports = NewPairListener;