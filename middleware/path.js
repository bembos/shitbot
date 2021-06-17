//Saves the current path in the request to be used in views

exports.currentUrl = (req,res,next) => {
    res.locals.originalUrl = req.originalUrl;
    return next();
}

