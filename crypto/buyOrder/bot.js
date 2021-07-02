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
        let pairAddress = this.buyOrder.pairAddress;
        let token0;
        let newtokenDecimals;
        let liquidityDecimals;

        //Make required contract calls (token 0, decimals)
        let liquidityContract = new ethers.Contract(
            pairAddress,
            ['function token0() external view returns (address)',
             'function decimals() external pure returns (uint8)'],
            this.account
          );

        let tokenContract = new ethers.Contract(
            newTokenAddress,
            ['function decimals() external pure returns (uint8)'],
            this.account
        );

        try {
            //Get decimals
            liquidityDecimals = await liquidityContract.decimals();
            newtokenDecimals = await tokenContract.decimals();

            //Token 0
            token0 = await liquidityContract.token0();

        } catch (error) {
            console.log(error);

            //Set up status as failed
            await buyOrderService.update({
                buyOrder : this.buyOrder.id,
                label : this.buyOrder.label,
                address: this.buyOrder.address,
                slippage: this.buyOrder.slippage,
                amountGiven: this.buyOrder.amountGiven,
                statusId: 2
            });
        }

        const pair = await methods.contructPair(token0, this.currencyToken, this.currencyDecimals, 
                                                        tokenOutAddress, newTokenDecimals,
                                                        ChainId.BSCMAINNET, pairAddress,
                                                        liquidityDecimals, this.account);

        const sellRoute = new Route([pair], this.currencyToken)
        const trade = new Trade(sellRoute, new TokenAmount(this.currencyToken, ethers.utils.parseUnits(this.buyOrder.amountGiven, this.currencyDecimals), TradeType.EXACT_INPUT))

        //Set up parameters
        const slippageTolerance = new Percent(this.buyOrder.slippage, '100') 
        const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw
        const path = [this.currencyToken, tokenOutAddress]
        const to = this.bot.walletAddress
        const deadline = Math.floor(Date.now() / 1000) + 60 * 20 
        const value = trade.inputAmount.raw 

        //Set up router
        const router = new ethers.Contract(
            this.router,
            ['function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts);'],
            this.account
          );

        //Perform trade
        const tx = router.swapExactETHForTokens(amountOutMin, path, to, deadline, {value: value});
        const receipt = await tx.wait();
        
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
                                buyOrder.address,
                                ['event Mint(address indexed sender, uint amount0, uint amount1);'],
                                account
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