const Queue = require('bull');
const Bot = require('./bot');

class BotManager {
    
    //Fields
    activeBots = [];
    newPairEventEmitter = null;

    //Constructs a new instance of the bot manager with the pair emitter
    constructor(newPairEventEmitter, redisConnection, router, provider) {
        this.router = router;
        this.provider = provider;
        this.newPairEventEmitter = newPairEventEmitter;
        this.redisConnection = redisConnection;
    }

    //Creates a new bot class, new queue and saves the relation
    start(botData) {

        //If there are no bots
        if (this.activeBots.length == 0) {
            this.newPairEventEmitter.start();
        }

        //Create a new queue
        let queue = new Queue('userQueue' . botData.id, this.redisConnection);

        //Initializes a new bot
        let bot = new Bot(this.provider, this.router, botData, queue);

        //Set up queue processor;
        queue.process('sellSwap', job => {
            bot.processSellOrder(job);
        });

        //Listen to pair created event
        this.newPairEventEmitter.newTokenEvent.listen('newToken', bot.onNewToken);

        //Saves relationship
        this.activeBots[botData.bot.id] = {'bot' : bot, 'queue': queue};
    }

    //Retrieves botlistener instance from active bots array, detaches event and deletes queue
    stop(botData) {

        let bot = this.activeBots[botData.bot.id].bot;
        let queue = this.activeBots[botData.bot.id].queue;

        //Remove event
        this.newPairEventEmitter.newTokenEvent.removeListener('newToken', bot.onNewToken);
        
        //Clear queue
        queue.empty();

        delete queue;
        delete bot;

        delete this.activeBots[botData.bot.id];

        //If there are no more bots
        if (this.activeBots.length == 0) {
            this.newPairEventEmitter.stop();
        }
    }
}

module.exports = BotManager;