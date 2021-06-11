exports.auth = (req,res,next) => {
    res.locals.auth = req.isAuthenticated();
    if (req.isAuthenticated()) return next();
    
    req.flash('error_msg' , 'please login to view this resource');
    res.redirect('/login');
}


exports.guest = (req, res, next) => {
    res.locals.auth = req.isAuthenticated();
    if (!req.isAuthenticated())  return next();
    
    req.flash('error_msg' , 'please login to view this resource');
    res.redirect('/bot');
}