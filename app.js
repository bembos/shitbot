var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

//Set up the app
var app = express();



//Express 
let ejs = require('ejs');
var expressLayouts = require('express-ejs-layouts');

//Session
const session = require('express-session');

//Database session store
var MySQLStore = require('express-mysql-session')(session);
var options = {
	host: 'localhost',
	port: 3306,
	user: 'root',
	password: 'sonsof11',
	database: 'shitbot'
};
var sessionStore = new MySQLStore(options);

app.use(session({ secret : 'secret', resave : true, saveUninitialized : true , store: sessionStore}));

//Passport authentication
const passport = require('passport');
app.use(passport.initialize());
app.use(passport.session());
require('./config/passport')(passport);

//Flash messages stuff
var flash = require('connect-flash');
app.use(flash({ sessionKeyName: 'flashMessage' }));
app.use((req,res,next)=> {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error  = req.flash('error'); 
    next();
})

//Routes
var indexRouter = require('./routes/index');

// view engine setup
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', './layout/layout.ejs')

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

app.listen(3000);

module.exports = app;
