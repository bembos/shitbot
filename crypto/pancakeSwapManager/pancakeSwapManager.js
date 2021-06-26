const NewPairListener = require('../Listener/newPairListener');
const PassiveBotManager = require('../Passivebot/botManager');
const BuyOrderBotManager = require('../buyOrder/botManager');

class PancakeSwapManager {

    passiveBotManager;
    buyOrderBotManager;

    static getPassiveBotManager() {
        return passiveBotManager;
    }

    static getBuyOrderManager() {
        return buyOrderBotManager;
    }

    initialize(redisConnection) {

        let currencyTokenAddress = process.env.WBNB_ADDRESS;
        let stableTokenAddress = process.env.USDT_ADDRESS;
        let factoryAddress = process.env.PANCAKE_FACTORY;
        let router = process.env.PANCAKE_ROUTER;
        let provider = process.env.WEBSOCKET_PROVIDER;
        let burnAddress = proicess.env.BURN_ADDRESS;
        
        this.newPairListener = new NewPairListener(currencyTokenAddress, stableTokenAddress, factoryAddress, provider, burnAddress)

        this.passiveBotManager = new PassiveBotManager(this.newPairListener, redisConnection, router, provider);
        this.buyOrderBotManager = new BuyOrderBotManager(router, provider);
    }
}

module.exports = PancakeSwapManager