const NewPairListener = require('../Listener/newPairListener');
const PassiveBotManager = require('../Passivebot/botManager');
const BuyOrderBotManager = require('../buyOrder/botManager');
const { env } = require('process');

class PancakeSwapManager {

    static passiveBotManager;
    static buyOrderBotManager;

    static getPassiveBotManager() {
        return passiveBotManager;
    }

    static getBuyOrderManager() {
        return buyOrderBotManager;
    }

    initialize(redisConnection) {

        let currencyTokenAddress = env('WBNB_ADDRESS') ;
        let stableTokenAddress = env('USDT_ADDRESS');
        let factoryAddress = env('PANCAKE_FACTORY');
        let router = env('PANCAKE_ROUTER');

        this.provider = env('WEBSOCKET_PROVIDER');
        
        this.newPairListener = new NewPairListener(currencyTokenAddress, stableTokenAddress, factoryAddress, this.provider)

        this.passiveBotManager = new PassiveBotManager(this.newPairListener, redisConnection, router, provider);
        this.buyOrderBotManager = new BuyOrderBotManager(router, provider);
    }
}

module.exports = PancakeSwapManager