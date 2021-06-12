//Bot Service handler
const botService = require('../services/bot');

//Bot homepage
exports.getIndex = async (req, res, next) => {
  
  //Retrieve user with bot
  var user = await botService.retrieveUserWithBot(req.user);

  //Retrieve user's bot configuration
  var bot = user.bot ? user.bot :  await botService.createBotFor(user);

  res.render('bot', {bot: bot});
};


