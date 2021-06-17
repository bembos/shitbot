const validator = require('../helpers/validate');

//Validation rule for logging in
exports.generalConfiguration = (req, res, next) => {
    const validationRule = {
        "minCap": "required_with:maxCap",
        "minLiq": "required_with:maxLiq"
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