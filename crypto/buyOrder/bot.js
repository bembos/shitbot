//Ethers.js
const ethers = require('ethers'); 
const { Token } = require('@uniswap/sdk');

//Services
const buyOrderService = require('../../services/buyOrder');
const buyOrderStatusService = require('../../services/buyOrderStatus');

//Utilities
const sleepHelper = require('../utilities/sleep');
const ChainId = require('../utilities/chainId');
const event = require('events');

class Bot{

    events;

    //Initializes buy order with user's stuff
    constructor(botData, router, provider, currencyToken, currencyDecimals){
        this.bot = botData.bot;
        this.user = botData.user;
        this.buyOrder = botData.buyOrder;
        this.router = router;
        this.provider = provider;
        this.currencyTokenAddress = currencyToken;
        this.currencyDecimals = currencyDecimals;

        let etherProvider = new ethers.providers.WebSocketProvider(provider);
        let wallet        = new ethers.Wallet(this.bot.walletPrivate);
        this.account      = wallet.connect(etherProvider);

        this.events = new event.EventEmitter();
        this.events.setMaxListeners(0);
    }

    //Function used to listen
    onMint = async function (sender, amount0, amount1){

        /*this.mintContract.removeAllListeners('Mint');*/

        //Sleep the required amount of time        
        if (this.buyOrder.timeBeforeBuy) { await sleepHelper.sleep( this.buyOrder.timeBeforeBuy * 1000) };

        let tokenOutAddress = this.buyOrder.address;

        //Set up routers
        const swapRouter = new ethers.Contract(
            this.router,
            ['function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
             'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
             'function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)'],
            this.account
          );

        //Create router to sel
        const newTokenRouter = new ethers.Contract(
            tokenOutAddress,
            ['function balanceOf(address account) public view returns (uint256)',
             'function approve(address _spender, uint256 _value) public returns (bool success)',
             'function decimals() external pure returns (uint8)'],
            this.account
        )

       
        //Define parameters for trading
        const path       = [this.currencyTokenAddress, tokenOutAddress]
        const to         = this.bot.walletAddress 
        const gasfees    = this.buyOrder.gasfees.toString();
        /*
        let amountIn     = ethers.utils.parseUnits(this.buyOrder.amountGiven.toString(), this.currencyDecimals);
        let amounts      = await swapRouter.getAmountsOut(amountIn, path);
        let amountOutMin = amounts[1].sub(amounts[1].mul(this.buyOrder.slippage).div(100));
        let tx;*/
        let receipt;

        receipt = { status : 1 };
         /*
        try {
             //Perform trade
             tx = await swapRouter.swapExactETHForTokens(amountOutMin, path, to, Date.now() + 1000 * 60 * 10, {value: amountIn, gasLimit: '800000', gasPrice: ethers.utils.parseUnits(gasfees, 'gwei')})
             receipt = await tx.wait();
        } catch (error) {
            console.log(error);
        }*/
               
        //Get status
        let status 

        if (receipt.status == 0) {
            status = await buyOrderStatusService.find("Failed");
        }
        else if (this.buyOrder.autoMultiplier == 0){
            status = await buyOrderStatusService.find("Completed");
        }
        else {
            status = await buyOrderStatusService.find("Waiting to Sell");
        }

        console.log(status.label);

        //Update buy order
        await buyOrderService.update({
            buyOrder : this.buyOrder.id,
            label : this.buyOrder.label,
            address: this.buyOrder.address,
            slippage: this.buyOrder.slippage,
            amountGiven: this.buyOrder.amountGiven,
            autoMultiplier : this.buyOrder.autoMultiplier,
            maxTime: this.buyOrder.maxTime,
            buyOrderStatusId: status.id,
            timeBeforeBuy: this.buyOrder.timeBeforeBuy,
            gasfees : this.buyOrder.gasfees
        })

        //If there is no auto multiplier return
        if (this.buyOrder.autoMultiplier == 0 || status.label == "Failed") { 
            this.events.emit('finished');
            return; 
        } 

        //Retrieve current tokens and format
        let currentTokens = await newTokenRouter.balanceOf(this.bot.walletAddress);
        let tokenDecimals = await newTokenRouter.decimals();

        console.log("tokens received: " + currentTokens);
/*
        //Approve selling the token
        try {
            await newTokenRouter.approve(this.router, currentTokens);
        } catch (error) {
            console.log(error);
        }*/

        //Create needed 
        let currencyToken = new Token(ChainId.BSCMAINNET, this.currencyTokenAddress, this.currencyDecimals)
        let newToken      = new Token(ChainId.BSCMAINNET, this.buyOrder.address, tokenDecimals)

        //Start sell swap
        this.asyncSellSwap(currencyToken, newToken, currentTokens, swapRouter, this.buyOrder.maxTime, this.buyOrder.autoMultiplier, this.buyOrder.amountGiven, gasfees);
    }

    //Async function which will try to sell every couple of seconds
    async asyncSellSwap(currencyToken, newToken, currentTokens, swapRouter,  maxTime, multiplier, initialAmount, gasfees) {        
        
        console.log('Entered Sales for ' + newToken.address)

        //Initialize variable
        let currentTime = 0;
        let success = 1;

        //Enter while loop that sleeps
        while (/*currentTime < maxTime*/false) {

            console.log('Sleeping ' + newToken.address);
            //Increase condition time and sleep
            currentTime = currentTime + 5;
            await sleepHelper.sleep(5000);
            
            console.log('Woke up ' + newToken.address);

            let amounts      = await swapRouter.getAmountsOut(currentTokens, [newToken.address, currencyToken.address]);
            let amountOutMin = ethers.utils.formatUnits(amounts[1].sub(amounts[1].mul(13).div(100)), currencyToken.decimals);

            console.log("time passed: " + currentTime)
            console.log("currency if swapped: " + amountOutMin)
            console.log("expected price: " +  multiplier * initialAmount)

            //If the amount given is the desired amount
            if (amountOutMin >= multiplier * initialAmount) {

                console.log('ENTERED SALES IN : ' + newToken.address)

                //Initialize sell parameters
                let amountIn     = currentTokens;
                let amounts      = await swapRouter.getAmountsOut(amountIn, [newToken.address, currencyToken.address]);
                let amountOutMin = amounts[1].sub(amounts[1].mul(this.buyOrder.slippage).div(100));

                //Perform swap
                let receipt;
                try { 
                    let tx = await routerV2.swapExactTokensForETH(amountIn,  amountOutMin, [newToken.address, currencyToken.address], this.bot.walletAddress , Date.now() + 1000 * 60 * 10, {gasLimit: '800000', gasPrice: ethers.utils.parseUnits(gasfees, 'gwei')})
                    receipt = await tx.wait();
                } catch (error) {
                    console.log("COULDN't SELL:" + newToken.address)
                    console.log(error);
                    currentTime = maxTime;
                    sucesss = 0;
                }

                console.log('-------------------------------------------------------')
                console.log('SOLD: ' + newToken.address);
                console.log('-------------------------------------------------------')
 
                //Break loop
                currentTime = maxTime;
                success = 1;
            }
        }

        //If transaction failed create failed status entities
        if (!success) {

            //Try one last time to sell
            let amountIn = currentTokens;
            let amounts = await swapRouter.getAmountsOut(amountIn, [newToken.address, currencyToken.address]);
            let amountOutMin = amounts[1].sub(amounts[1].mul(this.bot.slippage).div(100));

            //Perform swap
            let receipt;
            try { 
                let tx = await swapRouter.swapExactTokensForETH(amountIn,  amountOutMin, [newToken.address, currencyToken.address], this.bot.walletAddress , Date.now() + 1000 * 60 * 10, {gasLimit: '800000', gasPrice: ethers.utils.parseUnits(gasfees, 'gwei')})
                receipt = await tx.wait();
            } catch (error) {
                console.log("COULDN't SELL in last effort:" + newToken.address)
                console.log(error);
            }
        }

        let status;

        if (success) {
            status = await buyOrderStatusService.find("Completed"); 
        } else{
            status = await buyOrderStatusService.find("Failed"); 
        }

        //Update buy order
        await buyOrderService.update({
            buyOrder : this.buyOrder.id,
            label : this.buyOrder.label,
            address: this.buyOrder.address,
            slippage: this.buyOrder.slippage,
            amountGiven: this.buyOrder.amountGiven,
            autoMultiplier : this.buyOrder.autoMultiplier,
            maxTime: this.buyOrder.maxTime,
            buyOrderStatusId: status.id,
            timeBeforeBuy: this.buyOrder.timeBeforeBuy,
            gasfees : this.buyOrder.gasfees
        })

        this.events.emit('finished');

        console.log('Finished ' + newToken.address)
    }


    //Starts listening to mint event
    start(){
        /*
        this.mintContract = new ethers.Contract(
                                buyOrder.pairAddress,
                                ['event Mint(address indexed sender, uint amount0, uint amount1)'],
                                this.account
                            );
        */
       console.log('a')
        this.onMint("str", "str", "str");

        console.log('b');
        //Set up the the funnctions
        //this.mintContract.on('Mint', this.onMint.bind(this));
    }

    //Stops listening
    stop() {
        /*this.mintContract.removeAllListeners('Mint');*/
    }
}

module.exports = Bot;