//Ethers.js
const ethers = require('ethers'); 
const { Token } = require('@uniswap/sdk');

//Services
const buyOrderService = require('../../services/buyOrder');
const buyOrderStatusService = require('../../services/buyOrderStatus');
const buyOrderLogMessageService = require('../../services/buyOrderLogMessage');

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

        this.mintContract.removeAllListeners('Mint');

        //Sleep the required amount of time        
        if (this.buyOrder.timeBeforeBuy) { await sleepHelper.sleep( this.buyOrder.timeBeforeBuy * 1000) };

        let tokenOutAddress = this.buyOrder.address;

        //Define parameters for trading
        const path       = [this.currencyTokenAddress, tokenOutAddress]
        const to         = this.bot.walletAddress 
        const gasfees    = this.buyOrder.gasfees.toString();
        
        let amountIn     = ethers.utils.parseUnits(this.buyOrder.amountGiven.toString(), this.currencyDecimals);
        let amounts      = await swapRouter.getAmountsOut(amountIn, path);
        let amountOutMin = amounts[1].sub(amounts[1].mul(this.buyOrder.slippage).div(100));
        let tx;
        let receipt;

        receipt = { status : 0 };
         
        try {
             //Perform trade
             tx      = await this.swapRouter.swapExactETHForTokens(amountOutMin, path, to, Date.now() + 1000 * 60 * 10, {value: amountIn, gasLimit: '800000', gasPrice: ethers.utils.parseUnits(gasfees, 'gwei')})
             receipt = await tx.wait();
        } catch (error) {
            console.log(error);

            await buyOrderLogMessageService.create({
                content: "Error " + error,
                buyOrderId: this.buyOrder.id
            })
        }
               
        //Get status
        let status 

        if (receipt.status == 0) {
            status = await buyOrderStatusService.find("Failed");

            await buyOrderLogMessageService.create({
                content: "Failed to buy",
                buyOrderId: this.buyOrder.id
            })
        }
        else if (this.buyOrder.autoMultiplier == 0){
            status = await buyOrderStatusService.find("Completed");
        }
        else {
            status = await buyOrderStatusService.find("Waiting to Sell");
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

        //If there is no auto multiplier return
        if (this.buyOrder.autoMultiplier == 0 || status.label == "Failed") { 
            this.events.emit('finished');
            return; 
        } 

        //Retrieve current tokens and format
        let currentTokens = await this.newTokenRouter.balanceOf(this.bot.walletAddress);
        let tokenDecimals = await this.newTokenRouter.decimals();

        await buyOrderLogMessageService.create({
                content: "Bought " + currentTokens,
                buyOrderId: this.buyOrder.id
            })
    
        //Approve selling the token
        try {
            await this.newTokenRouter.approve(this.router, currentTokens.mul(2));
        } catch (error) {
            console.log(error);
        }

        //Create needed 
        let currencyToken = new Token(ChainId.BSCMAINNET, this.currencyTokenAddress, this.currencyDecimals)
        let newToken      = new Token(ChainId.BSCMAINNET, this.buyOrder.address, tokenDecimals)

        //Start sell swap
        this.asyncSellSwap(currencyToken, newToken, currentTokens, this.swapRouter, this.buyOrder.maxTime, this.buyOrder.autoMultiplier, this.buyOrder.amountGiven, gasfees);
    }

    //Async function which will try to sell every couple of seconds
    async asyncSellSwap(currencyToken, newToken, currentTokens, swapRouter,  maxTime, multiplier, initialAmount, gasfees) {        
        
        await buyOrderLogMessageService.create({
                content: "Waiting to sell",
                buyOrderId: this.buyOrder.id
            })
            
        //Initialize variable
        let currentTime = 0;
        let success = 0;

        //Enter while loop that sleeps
        while (currentTime < maxTime) {

            //Increase condition time and sleep
            currentTime = currentTime + 3;
            await sleepHelper.sleep(3000);
            
            let amounts      = await swapRouter.getAmountsOut(currentTokens, [newToken.address, currencyToken.address]);
            let amountOutMin = ethers.utils.formatUnits(amounts[1], currencyToken.decimals);
 
            await buyOrderLogMessageService.create({
                content: "Wanted: " + multiplier * initialAmount + '\nCurrent trade: ' + amountOutMin,
                buyOrderId: this.buyOrder.id
            })

            //If the amount given is the desired amount
            if (amountOutMin >= multiplier * initialAmount) {


                //Initialize sell parameters
                let amountIn     = currentTokens;
                let amounts      = await swapRouter.getAmountsOut(amountIn, [newToken.address, currencyToken.address]);
                let amountOutMin = amounts[1].sub(amounts[1].mul(this.buyOrder.slippage).div(100));

                //Perform swap
                let receipt;
                try { 
                    let tx = await swapRouter.swapExactTokensForETH(amountIn,  amountOutMin, [newToken.address, currencyToken.address], this.bot.walletAddress , Date.now() + 1000 * 60 * 10, {gasLimit: '800000', gasPrice: ethers.utils.parseUnits(gasfees, 'gwei')})
                    receipt = await tx.wait();
                } catch (error) {
                    await buyOrderLogMessageService.create({
                        content: "Error: " + error,
                        buyOrderId: this.buyOrder.id
                    })
                    currentTime = maxTime;
                    sucesss = 0;
                }

                if (success != 0) {
                    await buyOrderLogMessageService.create({
                        content: "Sold the tokens",
                        buyOrderId: this.buyOrder.id
                    })
    
                    //Break loop
                    currentTime = maxTime;
                    success = 1;
                }
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
                await buyOrderLogMessageService.create({
                        content: "Couldn't sell in last effort: Error " + error,
                        buyOrderId: this.buyOrder.id
                    })
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

        await buyOrderLogMessageService.create({
            content: "The transaction has finished",
            buyOrderId: this.buyOrder.id
        })
        
        this.events.emit('finished');
    }


    //Starts listening to mint event
    start(){
        this.mintContract = new ethers.Contract(
                                buyOrder.pairAddress,
                                ['event Mint(address indexed sender, uint amount0, uint amount1)'],
                                this.account
                            );

        //Set up routers
        this.swapRouter = new ethers.Contract(
            this.router,
            ['function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
                'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
                'function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)'],
            this.account
            );

        //Create router to sell
        this.newTokenRouter = new ethers.Contract(
            buyOrder.address,
            ['function balanceOf(address account) public view returns (uint256)',
                'function approve(address _spender, uint256 _value) public returns (bool success)',
                'function decimals() external pure returns (uint8)'],
            this.account
        )
        
        //Set up the the funnctions
        this.mintContract.on('Mint', this.onMint.bind(this));
    }

    //Stops listening
    stop() {
        this.mintContract.removeAllListeners('Mint');
    }
}

module.exports = Bot;