//Code constraint Service handler
const tradeWindowService = require('../services/codeConstraint');

exports.index = async (req, res, next) => {
  
    //Retrieve user with bot and trade windows
    var user = await tradeWindowService.retrieveUserWithTradeWindows(req.user);
    
    //If this grows will probably need to check for blockchain
    var tradeWindows = user.bot.tradeWindows;
  
    res.render('trade-windows/index', {tradeWindows: tradeWindows});
};

exports.logs = async (req, res, next) => {
  
    //Retrieve trade windows with logs
    var tradeWindow = await tradeWindowService.retrieveTradeWindowWithLogs(req.params.tradeWindow);

    res.render('trade-windows/log-messages/index', {logMessages: tradeWindow.logMessages});
};


exports.transactions = async (req, res, next) => {
  
    //Retrieve trade windows with transactions
    var tradeWindow  = await tradeWindowService.retrieveTradeWindowWithTransactions(req.params.tradeWindow);
  
    res.render('trade-windows/transactions/index', {transactions: tradeWindow.transactions});
};
