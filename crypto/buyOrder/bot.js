//Ethers.js
const ethers = require('ethers'); 
const buyOrderService = require('../../services/buyOrder');

class Bot{

    //Helper to use this inside callbacks
    self = this;

    //Initializes buy order with user's stuff
    constructor(botData, router, provider){
        this.bot = botData.bot;
        this.user = botData.user;
        this.buyOrder = botData.buyOrder;
        this.router = router;
        this.provider = provider;
    }

    //Function used to listen
    onMint = function (sender, tokenIn, tokenOut){

        //Perform trade
        const provider     = new ethers.providers.WebSocketProvider(self.provider);
        const tokenIn      = await Fetcher.fetchTokenData(ChainId.MAINNET, tokenIn, provider);
        const tokenOut     = await Fetcher.fetchTokenData(ChainId.MAINNET, tokenOut, provider);
        const pair         = await Fetcher.fetchPairData(tokenIn, tokenOut, provider);

        const decimals = tokenIn.decimals;

        const sellRoute = new Route([pair], tokenIn)
        const trade = new Trade(sellRoute, new TokenAmount(tokenIn, ethers.utils.parseUnits(self.buyOrder.amountGiven, decimals), TradeType.EXACT_INPUT))

        //Set up parameters
        const slippageTolerance = new Percent(self.buyOrder.slippage, '100') 
        const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw
        const path = [tokenIn, tokenOut]
        const to = self.bot.walletAddress
        const deadline = Math.floor(Date.now() / 1000) + 60 * 20 
        const value = trade.inputAmount.raw 

        //Set up router
        const router = new ethers.Contract(
            self.router,
            [
              'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts);',
            ],
            self.account
          );


        //Perform trade
        const tx = router.swapExactETHForTokens(amountOutMin, path, to, deadline, {value: value});
        const receipt = await tx.wait();

        //Get status
        const status = receipt.status == 0 ? 2 : 3;

        //Update buy order
        await buyOrderService.update({
            buyOrder : self.buyOrder.id,
            label : self.buyOrder.label,
            address: self.buyOrder.address,
            slippage: self.buyOrder.slippage,
            amountGiven: self.buyOrder.amountGiven,
            statusId: status
        })

        //Removes all listener for safety
        self.mintContract.removeAllListeners();
    }

    //Starts listening to mint event
    start(){

        //Initializes the contract
        const provider = new ethers.providers.WebSocketProvider(this.provider);
        const wallet = ethers.Wallet(this.bot.walletPrivate);
        this.account = wallet.connect(provider);

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

module.exports = Bot;