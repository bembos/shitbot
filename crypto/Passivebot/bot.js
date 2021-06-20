export class Bot {

    constructor(bot, user, generalCons, contractCodeCons){
        this.bot = bot;
        this.user = user;
        this.generalCons = generalCons;
        this.contractCodeCons = contractCodeCons;
    }
    
    onNewToken = function (WBNB, newToken) {

    }

    //Validates the new token received based on user's rules
    validate() {

    }
}