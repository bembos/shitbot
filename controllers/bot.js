//Bot Service handler
const botService = require('../services/bot');

exports.index = async (req, res, next) => {
  
  //Retrieve user with bot
  var user = await botService.retrieveUserWithBot(req.user);

  res.render('bot', {bot: bot, csrfToken: req.csrfToken()});
};

exports.configureBot = async (req, res, next) => {

  var user = await botService.retrieveUserWithBot(req.user);

  //Check if the bot being updated is the users
  if (req.params.bot != user.bot.id){
    req.flash('error_msg', 'Error updating')

    res.redirect('/bot')
  }
  
  //Update bot configuration
  bot = await botService.updateBot(req, req.params.bot);

  req.flash('success_msg' , 'Updated Correctly');

  res.redirect('/bot');
};

//Starts the bot
exports.start = async (req, res, next) => {

  await botService.start(req);

  req.flash('sucess_msg', 'Bot Successfuly started'); 

  res.redirect('/bot');
}


//Stops the bot
exports.stop = async (req, res, next) => {

  await botService.stop(req);

  req.flash('sucess_msg', 'Bot Successfuly stopped'); 

  res.redirect('/bot');
}