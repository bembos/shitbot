export class BotManager {
    
    //Fields
    activeBots = [];

    //Attaches a BotListener callback function to the given event emitter. Saves the reference in array
    attach(botDb, botListener) {
        bosListener.start();

        this.activeBots[botDb] = botListener;
    }

    //Retrieves botlistener instance from active bots array and detaches the event
    detach(botDb) {
        bosListener.stop();

        delete this.activeBots[botDb];

    }
}

