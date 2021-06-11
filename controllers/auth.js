//Passport authentication
const passport = require('passport');

exports.getLogin = (req, res, next) => {
  res.render('auth/login');
};

exports.postLogin = (req, res, next) => {
  passport.authenticate('local',{
    successRedirect : '/bot',
    failureRedirect : '/login',
    failureFlash : true,
    })(req,res,next);
};

exports.postLogout = (req, res, next) => {
  req.logout();
  req.flash('success_msg','Now logged out');
  res.redirect('/login');
};


