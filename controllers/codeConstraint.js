//Code constraint Service handler
const codeConstraintService = require('../services/codeConstraint');

exports.index = async (req, res, next) => {
  
    //Retrieve user with code constraints
    var user = await codeConstraintService.retrieveUserWithCodeConstraints(req.user);
  
    var constraints = user.contractCodeConstaints;
  
    res.render('constraints/contract-code/index', {constraints: constraints});
};

exports.showCreate = async (req, res, next) => {
  
    //Retrieve user with code constraints
    var user = req.user;
    
    res.render('constraints/contract-code/create', {user: user});
};

exports.create = async (req, res, next) => {
    
    //Create new instance
    await codeConstraintService.create(req);
    
    res.redirect('/constraints/contract-code');
};

exports.showEdit = async (req, res, next) => {
  
    var constraint = await codeConstraintService.find(req.params.constraint);

    //If it isn't the user updating it, return back with an error
    if (constraint.userId != req.user.id) {
        res.redirect('/constraints/contract-code/');
    }
    
    res.render('constraints/contract-code/edit', {constraint: constraint});
};

exports.edit = async (req, res, next) => {
    
    //Create new instance
    await codeConstraintService.update(req);
    
    res.redirect('/constraints/contract-code');
};

exports.delete = async (req, res, next) => {
    
    //Create new instance
    await codeConstraintService.delete(req.body.constraint);
    
    res.redirect('/constraints/contract-code');
};