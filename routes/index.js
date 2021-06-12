var express = require('express');
var router = express.Router();

//Middlewares
const {auth, guest} = require('../middleware/auth');

//Controllers
const authController = require('../controllers/auth.js');
const botController = require('../controllers/bot.js');

//Validation
const authValidation = require('../validators/auth');

//Auth routes
router.get('/login', guest, authController.getLogin);
router.post('/login', guest, authValidation.login, authController.postLogin);
router.post('/logout', auth, authController.postLogout);

//Bot routes
router.get('/bot', auth, botController.getIndex);

module.exports = router;
