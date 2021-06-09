var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

//Express stuff
let ejs = require('ejs');
var expressLayouts = require('express-ejs-layouts');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', './layout/layout.ejs')

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/page', (req, res) => {
    res.render('page');
})

app.use('/', indexRouter);
app.use('/users', usersRouter);

app.listen(3000);

module.exports = app;
