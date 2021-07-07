//Bot Service handler
const userService = require('../services/user');

exports.index = async (req, res, next) => {
  
  //Retrieve user with bot
  var user = await userService.retrieveUserWithBot(req.user);

  //Retrieve user's bot configuration
  var bot = user.bot ? user.bot :  await userService.createBotForUser(user);

  res.render('users/index', {bot: bot, csrfToken: req.csrfToken()});
};

exports.configure = async (req, res, next) => {

  var user = await userService.retrieveUserWithBot(req.user);

  //Check if the bot being updated is the users
  if (req.params.bot != user.bot.id){
    req.flash('error_msg', 'Error updating')

    res.redirect('/user')
  }
  
  //Update bot configuration
  bot = await userService.updateUser(req, req.params.bot);

  req.flash('success_msg' , 'Updated Correctly');

  res.redirect('/user');
};
