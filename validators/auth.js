const validator = require('../helpers/validate');

//Validation rule for logging in
exports.login = (req, res, next) => {
    const validationRule = {
        "email": "required|email",
        "password": "required|string"
    }
    validator(req.body, validationRule, {}, (err, status) => {
        if (!status) {
            req.flash('error_msg','Invalid Information')
            return res.status(412).render('auth/login');
        } else {
            next();
        }
    });
}