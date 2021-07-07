//Code constraint Service handler
const tradeWindowService = require('../services/tradeWindow');

//Format date utility
const moment = require('moment');

exports.index = async (req, res, next) => {
  
    //Retrieve user with bot and trade windows
    var user = await tradeWindowService.retrieveUserWithTradeWindows(req.user);
    
    //If this grows will probably need to check for blockchain
    var tradeWindows = user.bot.tradeWindows;
  
    res.render('trade-windows/index', {tradeWindows: tradeWindows, moment: moment, csrfToken: req.csrfToken()});
};

exports.logs = async (req, res, next) => {
  
    //Retrieve trade windows with logs
    var tradeWindow = await tradeWindowService.retrieveTradeWindowWithLogs(req.params.tradeWindow);

    res.render('trade-windows/log-messages/index', {logMessages: tradeWindow.logMessages, moment: moment, csrfToken: req.csrfToken()});
};


exports.transactions = async (req, res, next) => {
  
    //Retrieve trade windows with transactions
    var tradeWindow  = await tradeWindowService.retrieveTradeWindowWithTransactions(req.params.tradeWindow);
  
    res.render('trade-windows/transactions/index', {transactions: tradeWindow.transactions, moment: moment, csrfToken: req.csrfToken()});
};
