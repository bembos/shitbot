//Bot Service handler
const constraintService = require('../services/constraint');

exports.index = async (req, res, next) => {
  
  //Retrieve user with general Constraints
  var user = await constraintService.retrieveUserWithGeneralConstraints(req.user);

  //Retrieve user's general constraints 
  var general = user.generalConstraints ? user.generalConstraints :  await constraintService.createGeneralContraintsForUser(user);

  res.render('constraints/index', {general: general, csrfToken: req.csrfToken()});
};

exports.configureGeneralConstraints = async (req, res, next) => {
  
  var user = await constraintService.retrieveUserWithGeneralConstraints(req.user);

  //Check if the bot being updated is the users
  if (req.body.general != user.generalConstraints.id){

    req.flash('error_msg', 'Auth Error')

    res.redirect('/constraints')
  }

  //Update constraints configuration
  general = await constraintService.updateGeneralConstraints(req, req.body.general);

  req.flash('success_msg' , 'Updated Correctly');

  res.redirect('/constraints');
};

