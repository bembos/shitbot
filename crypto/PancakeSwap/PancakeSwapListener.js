
//Ethers.js
const { ethers } = require('ethers'); 

//Basic event class
const event = require('events');
const { env } = require('process');

export class PancakeSwapListener {

    newTokenEvent = new event.EventEmitter();
    factory;

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

        //Emit a new event
        newTokenEvent.emit('newToken', tokenIn, tokenOut);
    }

    //Starts listening to pancake factory
    start() {

        //Set up provider
        const provider = new ethers.providers.WebSocketProvider(env(''));

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

