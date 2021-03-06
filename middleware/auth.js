exports.auth = (req,res,next) => {
    res.locals.auth = req.isAuthenticated();

    res.locals.originalUrl = req.originalUrl;

    if (req.isAuthenticated()) return next();

    req.flash('error_msg' , 'Please login');

    res.redirect('/login');
}


exports.guest = (req, res, next) => {
    res.locals.auth = req.isAuthenticated();

    if (!req.isAuthenticated())  return next();
    
    res.redirect('/bot');
}