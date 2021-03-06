var createError = require('http-errors');
var express = require('express');
var path = require('path');

//Set up env
require('dotenv').config()

//csrf token
var csrf = require('csurf')
var csrfProtection = csrf({ cookie: true })

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
	host: process.env.DB_HOST,
	port: parseInt(process.env.DB_PORT),
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_DATABASE
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
app.use((req, res, next)=> {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error  = req.flash('error'); 
    next();
})

//Parser
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//Method override
const overrideHelper = require('./helpers/methodOverride'); 
const methodOverride = require('method-override')
app.use(methodOverride(overrideHelper.methodInBody))


//Set up crypto pancake swap listener
const PancakeSwapManager = require('./crypto/pancakeSwapManager/pancakeSwapManager');
PancakeSwapManager.initialize();

// view engine setup
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', './layout/layout.ejs')

const cookieParser = require('cookie-parser');
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//Middleware to get current url
const urlHelper = require('./middleware/path');

//Routes
var indexRouter = require('./routes/index');
var errorRouter = require('./routes/error');

app.use('/', urlHelper.currentUrl, csrfProtection, indexRouter);
app.use(errorRouter);

app.listen(process.env.PORT || 3000);

module.exports = app;
