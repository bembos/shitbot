//Passport authentication
const passport = require('passport');

exports.login = (req, res, next) => {
  res.render('auth/login', {csrfToken: req.csrfToken()});
};

exports.authenticate = (req, res, next) => {
  passport.authenticate('local',{
    successRedirect : '/user',
    failureRedirect : '/login',
    failureFlash : true,
    })(req,res,next);
};

exports.logout = (req, res, next) => {
  req.logout();

  req.flash('success_msg','Now logged out');
  
  res.redirect('/login');
};


