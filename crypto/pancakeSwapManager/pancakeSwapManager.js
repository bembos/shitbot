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

    initialize() {

        let currencyTokenAddress = process.env.WBNB_ADDRESS;
        let stableTokenAddress = process.env.BUSD_ADDRESS;
        let currencyDecimals = process.env.BUSD_DECIMALS;
        let factoryAddress = process.env.PANCAKE_FACTORY;
        let router = process.env.PANCAKE_ROUTER;
        let provider = process.env.WEBSOCKET_PROVIDER;
        let burnAddress = process.env.BURN_ADDRESS;
        let walletToPowerTrades = process.env.WALLET_PRIVATE;
        
        this.newPairListener = new NewPairListener(currencyTokenAddress, stableTokenAddress, factoryAddress, provider, burnAddress, walletToPowerTrades, router)

        this.passiveBotManager = new PassiveBotManager(this.newPairListener, router, provider);
        this.buyOrderBotManager = new BuyOrderBotManager();
    }
}

//Singleton class to acess Pancake swap manager
class PancakeSwapManager {

    static initialize() {
        PancakeSwapManager.instance = new PancakeSwapIntegration();
        PancakeSwapManager.instance.initialize();
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