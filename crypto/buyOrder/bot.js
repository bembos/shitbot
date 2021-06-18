//Ethers.js
const { ethers } = require('ethers'); 

const { env } = require('process');

export class Bot{

    //Fields
    mintContract;

    //Initializes buy order with user's stuff
    constructor(buyOrder, bot, user){
        this.bot = bot
        this.user = user
        this.buyOrder = buyOrder
    }

    //Function used to listen
    onMint = function (sender, token1, token2){
        
        //Transform BNB into WBNB

        //Perform trade

        //Transform BNB into WBNB

        //Removes all listener for safety
        this.mintContract.removeAllListeners();
    }

    //Starts listening to mint event
    start(){

        //Initializes the contract
        const provider = new ethers.providers.WebSocketProvider(env(''));
        const wallet = ethers.Wallet(bot.wallet);
        const account = wallet.connect(provider);

        this.mintContract = new ethers.Contract(
                                buyOrder.address,
                                ['event Mint(address indexed sender, uint amount0, uint amount1);'],
                                account
                            );

        //Set up the the funnctions
        this.mintContract.on('Mint', this.onMint);
    }

    //Stops listening
    stop() {
        this.mintContract.removeAllListeners();
    }
}