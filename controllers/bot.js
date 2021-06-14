//Bot Service handler
const botService = require('../services/bot');

exports.index = async (req, res, next) => {
  
  //Retrieve user with bot
  var user = await botService.retrieveUserWithBot(req.user);

  //Retrieve user's bot configuration
  var bot = user.bot ? user.bot :  await botService.createBotForUser(user);

  res.render('bot', {bot: bot});
};

exports.configureBot = async (req, res, next) => {

  var user = await botService.retrieveUserWithBot(req.user);

  //Check if the bot being updated is the users
  if (req.params.bot != user.bot.id){
    req.flash('error_msg', 'Error updating')

    res.redirect('bot')
  }
  
  //Update bot configuration
  bot = await botService.updateBot(req, req.params.bot);

  req.flash('success_msg' , 'Updated Correctly');

  res.render('bot', {bot: bot});
};

