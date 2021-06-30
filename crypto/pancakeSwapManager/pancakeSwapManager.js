const NewPairListener = require('../Listener/newPairListener');
const PassiveBotManager = require('../Passivebot/botManager');
const BuyOrderBotManager = require('../buyOrder/botManager');

class PancakeSwapIntegration {

    passiveBotManager;
    buyOrderBotManager;

    getPassiveBotManager() {
        return this.passiveBotManager;
    }

    getBuyOrderManager() {
        return this.buyOrderBotManager;
    }

    initialize(redisConnection) {

        let currencyTokenAddress = process.env.WBNB_ADDRESS;
        let stableTokenAddress = process.env.BUSD_ADDRESS;
        let factoryAddress = process.env.PANCAKE_FACTORY;
        let router = process.env.PANCAKE_ROUTER;
        let provider = process.env.WEBSOCKET_PROVIDER;
        let burnAddress = process.env.BURN_ADDRESS;
        let walletToPowerTrades = process.env.WALLET_PRIVATE;
        
        this.newPairListener = new NewPairListener(currencyTokenAddress, stableTokenAddress, factoryAddress, provider, burnAddress, walletToPowerTrades, router)

        this.passiveBotManager = new PassiveBotManager(this.newPairListener, redisConnection, router, provider);
        this.buyOrderBotManager = new BuyOrderBotManager(router, provider);
    }
}

//Singleton class to acess Pancake swap manager
class PancakeSwapManager {

    static initialize(redisConnection) {
        PancakeSwapManager.instance = new PancakeSwapIntegration();
        PancakeSwapManager.instance.initialize(redisConnection);
    }

    static getPassiveBotManager() {
        if (PancakeSwapManager.instance == null) {
            throw new Error('PancakeSwapManager not initialized');
        }
        return PancakeSwapManager.instance.getPassiveBotManager();
    }

    static getBuyOrderManager() {
        if (PancakeSwapManager.instance == null) {
            throw new Error('PancakeSwapManager not initialized');
        }
        return PancakeSwapManager.instance.getBuyOrderManager();
    }
}

module.exports = PancakeSwapManager