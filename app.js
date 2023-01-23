/**
 * This is the main express app for utils.highcharts.local
 */

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var cors = require('cors');
var lessMiddleware = require('less-middleware');
var hbs = require('hbs');
var session = require('express-session');
var { highchartsDir } = require('./lib/arguments.js');

require('dotenv').config();

var app = express();

hbs.registerPartials(__dirname + '/views/partials');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(cors());

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(lessMiddleware(path.join(__dirname, 'public')));

// Static
app.use(express.static(
  path.join(__dirname, 'public'),
  { maxAge: 60000 }
));
app.use('/temp', express.static( // non-cached temporary json files
  path.join(__dirname, 'temp')
));
app.use('/reference', express.static(
  path.dirname(require.resolve('highcharts/package.json')),
  { maxAge: '10m' }
));
app.use('/mapdata', express.static(
  path.dirname(require.resolve('@highcharts/map-collection/package.json')),
  /*
  path.dirname(require.resolve(path.join(
    __dirname,
    '../map-collection/Export/1.1.4'
  ))),
  // */
  { maxAge: '10m' }
));
app.use('/samples/graphics', express.static(
  path.join(highchartsDir, 'samples/graphics')
));

app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
}));


// Routes
app.use('/', require('./routes/index'));
app.use('/code', require('./routes/code'));
app.use('/draft', require('./routes/draft'));
app.use('/pulls', require('./routes/pulls'));

// Bisect
app.use('/bisect/', require('./routes/bisect/index'));
app.use('/bisect/commits', require('./routes/bisect/commits'));
app.use('/bisect/commits-post', require('./routes/bisect/commits-post'));
app.use('/bisect/bisect', require('./routes/bisect/bisect'));
app.use('/bisect/main', require('./routes/bisect/main'));
app.use('/bisect/main-post', require('./routes/bisect/main-post'));
app.use('/bisect/view', require('./routes/bisect/view'));

// Samples
app.use('/samples/', require('./routes/samples/index'));
app.use('/samples/data', require('./routes/samples/data'));
app.use('/samples/contents', require('./routes/samples/contents'));
app.use('/samples/mobile', require('./routes/samples/mobile'));
app.use('/samples/nightly', require('./routes/samples/nightly'));
app.use('/samples/list-samples', require('./routes/samples/list-samples'));
app.use('/samples/jsfiddle-post', require('./routes/samples/share'));
app.use('/samples/server-env', require('./routes/samples/server-env'));
app.use('/samples/readme', require('./routes/samples/readme'));
app.use('/samples/settings', require('./routes/samples/settings'));
app.use('/samples/settings-post', require('./routes/samples/settings-post'));
app.use('/samples/view', require('./routes/samples/view'));
app.use('/samples/view-source', require('./routes/samples/view-source'));
app.use(
  '/samples/compare-comment',
  require('./routes/samples/compare-comment')
);
app.use('/samples/compare-iframe', require('./routes/samples/compare-iframe'));
app.use(
  '/samples/compare-update-report',
  require('./routes/samples/compare-update-report')
);
app.use('/samples/compare-report', require('./routes/samples/compare-report'));
app.use('/samples/compare-reset', require('./routes/samples/compare-reset'));
app.use('/samples/compare-view', require('./routes/samples/compare-view'));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) { // eslint-disable-line no-unused-vars
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error', {
  	url: req.url
  });
});

module.exports = app;
