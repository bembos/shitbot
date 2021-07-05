//Ethers.js
const ethers = require('ethers'); 
const buyOrderService = require('../../services/buyOrder');

//Utilities
const methods = require('../utilities/methods');

class Bot{

    //Initializes buy order with user's stuff
    constructor(botData, router, provider, currencyToken, currencyDecimals){
        this.bot = botData.bot;
        this.user = botData.user;
        this.buyOrder = botData.buyOrder;
        this.router = router;
        this.provider = provider;
        this.currencyToken = currencyToken;
        this.currencyDecimals = currencyDecimals;

        let etherProvider = new ethers.providers.WebSocketProvider(provider);
        let wallet        = new ethers.Wallet(this.bot.walletPrivate);
        this.account      = wallet.connect(etherProvider);
    }

    //Function used to listen
    onMint = async function (sender, amount0, amount1){

        let tokenOutAddress = this.buyOrder.address;

        //Define router
        //Set up router
        const swapRouter = new ethers.Contract(
            this.router,
            ['function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
             'function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)'],
            this.account
          );

        //Define parameters for trading
        const path = [this.currencyToken, tokenOutAddress]
        const to   = this.bot.walletAddress 

        let amountIn     = ethers.utils.parseUnits(this.buyOrder.amountGiven.toString(), this.currencyDecimals);
        let amounts      = await swapRouter.getAmountsOut(amountIn, path);
        let amountOutMin = amounts[1].sub(amounts[1].mul(this.buyOrder.slippage).div(100));
        let tx;
        let receipt;

        receipt = { status : 0 };

        try {
             //Perform trade
             tx = await swapRouter.swapExactETHForTokens(amountOutMin, path, to, Date.now() + 1000 * 60 * 10, {value: amountIn, gasLimit: '250000', gasPrice: ethers.utils.parseUnits('10', 'gwei') })
             receipt = await tx.wait();
        } catch (error) {
            console.log(error);
            console.log(receipt);
        }
       
        console.log('Buy Order receipt: ' + receipt);
        
        //Get status
        const status = receipt.status == 0 ? 2 : 3;

        //Update buy order
        await buyOrderService.update({
            buyOrder : this.buyOrder.id,
            label : this.buyOrder.label,
            address: this.buyOrder.address,
            slippage: this.buyOrder.slippage,
            amountGiven: this.buyOrder.amountGiven,
            statusId: status
        })

        //Removes all listener for safety
        this.mintContract.removeAllListeners();
    }

    //Starts listening to mint event
    start(){
        this.mintContract = new ethers.Contract(
                                buyOrder.pairAddress,
                                ['event Mint(address indexed sender, uint amount0, uint amount1);'],
                                this.account
                            );

        //Set up the the funnctions
        this.mintContract.on('Mint', this.onMint.bind(this));
    }

    //Stops listening
    stop() {
        this.mintContract.removeAllListeners();
    }
}

module.exports = Bot;