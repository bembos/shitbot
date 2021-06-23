const ethers = require('ethers');
const NewPairListener  = require('../Listener/newPairListener');
const BotManager  = require('../Passivebot/botManager');

class PancakeSwapManager {

    static botManager;

    getInstance() {

        return botManager;
    }

    initialize(redisConnection, currencyTokenAddress, stableTokenAddress, factoryAddress, provider) {

        let currencyTokenAddress = env('WBNB_ADDRESS') ;
        let stableTokenAddress = env('USDT_ADDRESS');
        let factoryAddress = env('PANCAKE_FACTORY');
        let router = env('PANCAKE_ROUTER');

        this.provider = ethers.providers.WebSocketProvider(env('WEBSOCKET_PROVIDER'));
        
        this.newPairListener = new NewPairListener(currencyTokenAddress, stableTokenAddress, factoryAddress, this.provider)

        this.botManager = new BotManager(this.newPairListener, redisConnection, router, provider);
    }
}

module.exports = PancakeSwapManager;