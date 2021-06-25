var express = require('express');
var router = express.Router();

//Controllers
const errorController = require('../controllers/error.js');

//Auth routes
router.use(errorController.get404);

module.exports = router;
