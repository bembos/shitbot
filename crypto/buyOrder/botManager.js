const { currencyEquals } = require('@uniswap/sdk');
const Bot = require('./bot');

class BotManager {
    
    //Fields
    activeBots = [];

    //Constructs a new instance of the bot manager with the pair emitter
    constructor() { }

    //Attaches a BotListener callback function to the given event emitter. Saves the reference in array
    start(botData) {

        let chain = botData.blockchainData;

        let bot = new Bot(botData, chain.router, chain.provider, chain.currency, chain.decimals);

        let botNewTokenListener = () => {
            this.stop({buyOrder: bot.buyOrder});
            bot.events.removeAllListeners('finished');
        }

        bot.events.on('finished', botNewTokenListener);

        bot.start();

        this.activeBots.push({id: botData.buyOrder.id, bot: bot});
    }

    //Retrieves botlistener instance from active bots array and detaches the event
    stop(botData) {

        let activeBot = this.activeBots.find(activeBot => activeBot.id == botData.buyOrder.id);

        if (activeBot) {

            let bot = activeBot.bot;

            bot.stop();

            this.activeBots = this.activeBots.filter((activeBot)=> {activeBot.id != botData.buyOrder.id});
        }
    }
}

module.exports = BotManager;
