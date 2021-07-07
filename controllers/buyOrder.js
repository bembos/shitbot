//Code constraint Service handler
const buyOrderService = require('../services/buyOrder');
const botBuyOrderService = require('../services/botBuyOrder');

//Format date utility
const moment = require('moment');

exports.index = async (req, res, next) => {
  
    //Retrieve user with code constraints
    var user = await buyOrderService.retrieveUserWithBuyOrders(req.user);
  
    var buyOrders = user.buyOrders;
  
    res.render('buy-orders/index', {buyOrders: buyOrders, moment: moment, csrfToken: req.csrfToken()});
};

exports.showCreate = async (req, res, next) => {
  
    //Retrieve user with code constraints
    var user = req.user;
    
    res.render('buy-orders/create', {user: user, csrfToken: req.csrfToken()});
};

exports.create = async (req, res, next) => {
    
    //
    await botBuyOrderService.start(req);
    
    res.redirect('/buy-orders');
};

exports.showEdit = async (req, res, next) => {
  
    var buyOrder = await buyOrderService.find(req.params.buyOrder);
    
    res.render('buy-orders/edit', {buyOrder: buyOrder, csrfToken: req.csrfToken()});
};

exports.edit = async (req, res, next) => {
    
    //Create new instance
    await buyOrderService.update(req.body);
    
    res.redirect('/buy-orders');
};

exports.delete = async (req, res, next) => {
    
    //Create new instance
    await botBuyOrderService.stop(req.body.buyOrder);
    
    res.redirect('/buy-orders');
};