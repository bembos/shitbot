//Services
const buyOrderConfigurationService = require('../services/buyOrderConfiguration');

exports.index = async (req, res, next) => {
  
    //Retrieve user with configuration
    var user = await buyOrderConfigurationService.retrieveWithConfiguration(req.user);
  
    res.render('buy-orders/configuration', {configuration: user.buyOrderConfiguration, csrfToken: req.csrfToken()});
  };
  
exports.configure = async (req, res, next) => {
  
    var user = await buyOrderConfigurationService.retrieveWithConfiguration(req.user);
  
    //Check if the configuration being updated is the users
    if (req.body.configuration != user.buyOrderConfiguration.id){
      req.flash('error_msg', 'Error updating')
  
      res.redirect('/buy-orders/configuration')
    }
    
    //Update bot configuration
    bot = await buyOrderConfigurationService.updateConfiguration(req.body);
  
    req.flash('success_msg' , 'Updated Correctly');
  
    res.redirect('/buy-orders/configuration');
  };
  