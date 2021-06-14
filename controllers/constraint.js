//Bot Service handler
const constraintService = require('../services/constraint');

exports.index = async (req, res, next) => {
  
  //Retrieve user with general Constraints
  var user = await constraintService.retrieveUserWithGeneralConstraints(req.user);

  //Retrieve user's general constraints 
  var general = user.generalConstraints ? user.generalConstraints :  await constraintService.createGeneralContraintsForUser(user);

  res.render('constraints/index', {general: general});
};

exports.configureGeneralConstraints = async (req, res, next) => {
  
  var user = await botService.retrieveUserWithGeneralConstraints(req.user);

  //Check if the bot being updated is the users
  if (req.params.general != user.generalConstraints.id){
    req.flash('error_msg', 'Error updating')

    res.redirect('constraints')
  }

  //Update constraints configuration
  general = await constraintService.updateGeneralConstraints(req, req.params.general);

  req.flash('success_msg' , 'Updated Correctly');

  res.render('constraints/index', {general: general});
};

