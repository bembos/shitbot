var express = require('express');
var router = express.Router();

//Middlewares
const {auth, guest} = require('../middleware/auth');

//Controllers
const botController = require('../controllers/bot.js');
const authController = require('../controllers/auth.js');
const userController = require('../controllers/user.js');
const buyOrderController = require('../controllers/buyOrder.js');
const constraintController = require('../controllers/constraint.js');
const tradeWindowController = require('../controllers/tradeWindow.js');
const codeConstraintController = require('../controllers/codeConstraint.js');
const buyOrderConfigurationController = require('../controllers/buyOrderConfiguration.js');

//Validation
const authValidation = require('../validators/auth');

//Auth routes
router.get('/login', guest, authController.login);
router.post('/login', guest, authValidation.login, authController.authenticate);
router.post('/logout', auth, authController.logout);

//User routes
router.get('/user', auth, userController.index);
router.post('/user/configuration/:bot', auth, userController.configure)

//Bot routes
router.get('/bot', auth, botController.index);
router.post('/bot/configuration/:bot', auth, botController.configureBot)
router.post('/bot/start', auth, botController.start)
router.post('/bot/stop', auth, botController.stop)

//Constraint routes
router.get('/constraints', auth, constraintController.index);
router.post('/constraints/general', auth, constraintController.configureGeneralConstraints);

//Contract Code constraint routes
router.get('/constraints/contract-code', auth, codeConstraintController.index);
router.get('/constraints/contract-code/create', auth, codeConstraintController.showCreate);
router.post('/constraints/contract-code/create', auth, codeConstraintController.create);
router.get('/constraints/contract-code/edit/:constraint', auth, codeConstraintController.showEdit);
router.put('/constraints/contract-code/edit', auth, codeConstraintController.edit);
router.delete('/constraints/contract-code/delete', auth, codeConstraintController.delete);

//Buy Orders
router.get('/buy-orders/configuration', auth, buyOrderConfigurationController.index);
router.post('/buy-orders/configuration', auth, buyOrderConfigurationController.configure)

router.get('/buy-orders', auth, buyOrderController.index);
router.get('/buy-orders/create', auth, buyOrderController.showCreate);
router.post('/buy-orders/create', auth, buyOrderController.create);
router.get('/buy-orders/edit/:buyOrder', auth, buyOrderController.showEdit);
router.put('/buy-orders/edit', auth, buyOrderController.edit);
router.delete('/buy-orders/delete', auth, buyOrderController.delete);

//Trade Window
router.get('/trade-windows', auth, tradeWindowController.index);
router.get('/trade-windows/:tradeWindow/log-messages', auth, tradeWindowController.logs);
router.get('/trade-windows/:tradeWindow/transactions', auth, tradeWindowController.transactions);

module.exports = router;
