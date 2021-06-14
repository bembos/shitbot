var express = require('express');
var router = express.Router();

//Middlewares
const {auth, guest} = require('../middleware/auth');

//Controllers
const botController = require('../controllers/bot.js');
const authController = require('../controllers/auth.js');
const constraintController = require('../controllers/constraint.js');
const codeConstraintController = require('../controllers/constraint.js');

//Validation
const authValidation = require('../validators/auth');

//Auth routes
router.get('/login', guest, authController.login);
router.post('/login', guest, authValidation.login, authController.authenticate);
router.post('/logout', auth, authController.logout);

//Bot routes
router.get('/bot', auth, botController.index);
router.post('/bot/configuration/:bot', auth, botController.configureBot)

//Constraint routes
router.get('/constraints', auth, constraintController.index);
router.post('/constraints/general/:general', auth, constraintController.configureGeneralConstraints);

//Contract Code constraint routes
router.get('/constraints/contract-code', auth, codeConstraintController.index);
router.get('/constraints/contract-code/showCreate', auth, codeConstraintController.showCreate);
router.post('/constraints/contract-code/create', auth, codeConstraintController.create);
router.get('/constraints/contract-code/edit/:constraint', auth, codeConstraintController.showEdit);
router.put('/constraints/contract-code/edit/:constraint', auth, codeConstraintController.edit);
router.delete('/constraints/contract-code/edit/:constraint', auth, codeConstraintController.delete);


module.exports = router;
