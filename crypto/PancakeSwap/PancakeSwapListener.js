import { response } from 'express';

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

export class PancakeSwapListener {

    //Fields for later use
    newTokenEvent ;
    factory;

    constructor()
    {
        this.WBNBToken = await Fetcher.fetchTokenData(ChainId.MAINNET, WBNBTokenAddress);
        this.usdtToken = await Fetcher.fetchTokenData(ChainId.MAINNET, env('USDT_ADDRESS'));
        this.WBNBpair = await Fetcher.fetchPairData(usdtToken, WBNBToken);
        this.WBNBroute = new Route([WBNBpair], this.WBNBToken)
        this.WBNBtrade = new Trade(WBNBroute, new TokenAmount(this.WBNBToken, ethers.utils.parseUnits('0.1', 'ether').toString(), TradeType.EXACT_INPUT));

        this.newTokenEvent = new event.EventEmitter();
    }

    processData = async function (WBNBTokenAddress, newTokenAddress, pairAddress) {

        let sourceCode = "";
        let marketCap = 0;
        let liquidity = 0;
        let renounced = false;
        let locked = false;

        //Retrieve source code if verified using bscscan
        let response = await axios.get(`https://api.bscscan.com/api?module=contract&action=getsourcecode&address=${newTokenAddress}&apikey=${env('BSCSCAN_APIKEY')}`);

        //If there was any problem with the request or the source code isn't verified return null
        if (response.status == "0" || response,result[0].sourceCode == "") {
            return null;
        }

        sourcecode = response.result[0].sourceCode;

        //If Basic check pass initialze data
        const newToken = await Fetcher.fetchTokenData(ChainId.MAINNET, newTokenAddress);
        const pair = await Fetcher.fetchPairData(WBNBToken, newToken);
        const currentWBNBPrice = this.WBNBtrade.executionPrice.toSignificant(6);

        const newTokenroute = new Route([pair], this.WBNBToken)
        const newTokenTrade = new Trade(newTokenroute, new TokenAmount(this.WBNBToken, ethers.utils.parseUnits('0.1', 'ether').toString(), TradeType.EXACT_INPUT))
        const newTokenInBNB = newTokenTrade.executionPrice.toSignificant(6);

        //**Process liquidity**//
        
        //Retrive the reserves of the pair in bot tokens
        const WBNBReserve = pair.reserve0;
        const newTokenReserve = pair.reserve1;

        //Retrieve execution price of both tokens and calculate liquidity pool 
        let bNBReserveTotal = WBNBReserve * currentWBNBPrice;
        let newTokenReserveTotal = newTokenInBNB * newTokenReserve * currentWBNBPrice;
        liquidity = newTokenReserveTotal + bNBReserveTotal;

        //Process market cap
        let response = await axios.get(`https://api.bscscan.com/api?module=stats&action=tokensupply&contractaddress=${newTokenAddress}&apikey=${env('BSCSCAN_APIKEY')}`);
        let totalSupply = response.result;
        marketCap = totalSupply * newTokenInBNB * currentWBNBPrice;

        return new ContractProcessedData(marketCap, liquidity, sourceCode);
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
        if(token0 === env("WBNB_ADDRESS")) {
            tokenIn = token0; 
            tokenOut = token1;
        }
        
        if(token1 == env("WBNB_ADDRESS")) {
            tokenIn = token1; 
            tokenOut = token0;
        }

        //If there isn't a token that is bought with WBNB return
        if(typeof tokenIn === 'undefined') {
            return;
        }

        let contractProcessedData = await this.processData(tokenIn, pairAddress);

        //Emit a new event if basic checks are successful
        if (contractProcessedData) newTokenEvent.emit('newToken', tokenIn, tokenOut, contractProcessedData);
    }

    //Starts listening to pancake factory
    start() {

        //Set up provider
        const provider = new ethers.providers.WebSocketProvider(env('WEBSOCKET_PROVIDER'));

        //Set up a contract with the pancake swap factory
        factory = new ethers.Contract(
            env('PANCAKE_FACTORY'),
            ['event PairCreated(address indexed token0, address indexed token1, address pair, uint)'],
            provider
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

