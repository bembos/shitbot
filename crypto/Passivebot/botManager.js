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
    async start(botData) {

        //If there are no bots
        if (this.activeBots.length == 0) {
            await this.newPairEventEmitter.start();
        }

        //Create a new queue
        let queue = new Queue('userQueue' + botData.bot.id, this.redisConnection);

        //Initializes a new bot
        let bot = new Bot(this.provider, this.router, botData, queue);

        //Set up queue processor;
        queue.process('sellSwap', job => {
            bot.processSellOrder(job);
        });
        
        //Set up current number of transactions open
        let transactions = { number : 0 }

        //Saves relationship
        this.activeBots.push({id: botData.bot.id, data: {'bot' : bot, 'queue': queue, 'transactions' : transactions}})

        //Listen to pair created event
        this.newPairEventEmitter.newTokenEvent.on('newToken', (data, tokenTracking, liquidityTracking) => { 
            setImmediate((transactions) => {
                bot.onNewToken(data, transactions, tokenTracking, liquidityTracking);
            })
        });   
          
    }

    //Retrieves botlistener instance from active bots array, detaches event and deletes queue
    stop(botData) {


        let activeBot= this.activeBots.find(activeBot => activeBot.id == botData.bot.id);
        let queue = activeBot.data.queue;
        let bot = activeBot.data.bot;

        //Remove event
        this.newPairEventEmitter.newTokenEvent.removeListener('newToken', bot.onNewToken);
        
        queue.obliterate();
     
        //Delete bot in array
        this.activeBots = this.activeBots.filter((activeBot)=> {activeBot.id != botData.bot.id});

        //If there are no more bots
        if (this.activeBots.length == 0) {
            this.newPairEventEmitter.stop();
        }
    }
}

module.exports = BotManager;