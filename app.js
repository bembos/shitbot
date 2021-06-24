var createError = require('http-errors');
var express = require('express');
var path = require('path');
const { env } = require('process');

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

//Parser
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//Method override
const overrideHelper = require('./helpers/methodOverride'); 
const methodOverride = require('method-override')
app.use(methodOverride(overrideHelper.methodInBody))

//Redis stuff
const Redis = require('ioredis');
const redis = new Redis({
    host: env('REDIS_HOST'),
    port: env('REDIS_PORT'),
    password: env('REDIS_PASSWORD'),
	limiter: {
		max: 100,
		duration: 10000
		}
});

//Set up crypto pancake swap listener
const PancakeSwapManager = require('./crypto/pancakeSwapManager/pancakeSwapManager');
const pancakeSwapManager = new PancakeSwapManager();
pancakeSwapManager.initialize(redis)

//Routes
var indexRouter = require('./routes/index');

// view engine setup
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', './layout/layout.ejs')


app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//Middleware to get current url
const urlHelper = require('./middleware/path');

app.use('/', urlHelper.currentUrl, indexRouter);

app.listen(3000);

module.exports = app;
