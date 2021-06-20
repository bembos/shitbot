export class BotManager {
    
    //Fields
    activeBots = [];
    newPairEventEmitter = null;

    //Constructs a new instance of the bot manager with the pair emitter
    constructor(newPairEventEmitter) {
        this.newPairEventEmitter = newPairEventEmitter;
    }

    //Attaches a BotListener callback function to the given event emitter. Saves the reference in array
    attach(bot, botListener) {
        this.newPairEventEmitter.newTokenEvent.listen('newToken', botListener.onNewToken);

        this.activeBots[bot] = botListener;
    }

    //Retrieves botlistener instance from active bots array and detaches the event
    detach(bot) {
        let botListener = this.activeBots[bot];

        this.newPairEventEmitter.newTokenEvent.removeListener('newToken', botListener.onNewToken);

        delete this.activeBots[bot];
    }
}

