const Bot = require('./bot');

class BotManager {
    
    //Fields
    activeBots = [];

    //Constructs a new instance of the bot manager with the pair emitter
    constructor(router, provider) {
        this.router = router;
        this.provider = provider;
    }

    //Attaches a BotListener callback function to the given event emitter. Saves the reference in array
    start(botData) {

        let bot = new Bot(botData, this.router, this.provider);

        bot.start();

        this.activeBots[botData.bot.id] = bot;
    }

    //Retrieves botlistener instance from active bots array and detaches the event
    stop(botData) {

        let bot  = this.activeBots[botData.bot.id];

        bot.stop();

        delete bot;

        delete this.activeBots[botData.bot.id];

    }
}

module.exports = BotManager;
