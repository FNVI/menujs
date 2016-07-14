
var express = require('express');
var app = express();
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');


var passport = require('passport');  
var session = require('express-session');





require('./routes/passport')(passport);


//var users = require('./routes/users');
//var about = require('./routes/about');
//var about = require('./routes/aboutnew');
//var tags = require('./routes/tags');
//var food = require('./routes/food');
//var deletefile = require('./routes/delete');
//var editfile = require('./routes/edit');
//var edited = require('./routes/edited');
//var addfile = require('./routes/add');
//var search = require('./routes/search');
//
//var kitchen = require('./routes/kitchen');
//var waitress = require('./routes/waitress');
//
//var stuff = require('./routes/stuff');
//
//var menu = require('./routes/menu');





// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(require('less-middleware')(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({ secret: 'anyrandomstringyoulike' })); // session secret
app.use(passport.initialize());
app.use(passport.session());

require('./routes/index.js')(app,passport);





//app.use('/menu', menu);
//app.use('/stuff', stuff);
//app.use('/food/edit', editfile);
//app.use('/food/edited', edited);
//app.use('/food/add', addfile);
//app.use('/food/delete', deletefile);
//app.use('/food/search', search);
//app.use('/users', users);
//app.use('/about', about);
//app.use('/aboutnew', about);
//app.use('/api/tags', tags);
//app.use('/food', food);
//app.use('/kitchen', kitchen);
//app.use('/waitress', waitress);






// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
