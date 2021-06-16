//Code constraint Service handler
const buyOrderService = require('../services/buyOrder');

exports.index = async (req, res, next) => {
  
    //Retrieve user with code constraints
    var user = await buyOrderService.retrieveUserWithBuyOrders(req.user);
  
    var buyOrders = user.contractCodeConstaints;
  
    res.render('buy-orders/index', {buyOrders: buyOrders});
};

exports.showCreate = async (req, res, next) => {
  
    //Retrieve user with code constraints
    var user = req.user;
    
    res.render('constraints/create', {user: user});
};

exports.create = async (req, res, next) => {
    
    //Create new instance
    await buyOrderService.create(req);
    
    res.redirect('/buy-orders/index');
};

exports.showEdit = async (req, res, next) => {
  
    var buyOrder = await buyOrderService.find(req.params.buyOrder);
    
    res.render('buy-orders/edit', {buyOrder: buyOrder});
};

exports.edit = async (req, res, next) => {
    
    //Create new instance
    await buyOrderService.update(req);
    
    res.redirect('/buy-orders/index');
};

exports.delete = async (req, res, next) => {
    
    //Create new instance
    await buyOrderService.delete(req.body.buyOrder);
    
    res.redirect('/buy-orders/index');
};