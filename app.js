/**
 * This is the main express app for utils.highcharts.local
 */

import express from 'express';
import path from 'path';
import logger from 'morgan';
import cookieParser from 'cookie-parser';
import favicon from 'serve-favicon';
import bodyParser from 'body-parser';
import cors from 'cors';
import lessMiddleware from 'less-middleware';
import hbs from 'hbs';
import session from 'express-session';
import { highchartsDir } from './lib/arguments.js';
import { dirname, posix } from './lib/functions.js';

import dotenv from 'dotenv';
dotenv.config();

const app = express(),
  __dirname = dirname(import.meta);

hbs.registerPartials(`${__dirname}/views/partials`);

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
  posix(path.dirname(
    import.meta.resolve('highcharts/package.json')
  )).replace(/^file:\/\/(?:\/\w:)?/gsu, ''),
  { maxAge: '10m' }
));
app.use('/mapdata', express.static(
  posix(path.dirname(
    import.meta.resolve('@highcharts/map-collection/package.json')
  )).replace(/^file:\/\/(?:\/\w:)?/gsu, ''),
  { maxAge: '10m' }
));
app.use('/samples/graphics', express.static(
  posix(path.join(highchartsDir, 'samples/graphics'))
));

app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
}));


// Routes
app.use('/', (await import('./routes/index.js')).default);
app.use('/code', (await import('./routes/code.js')).default);
app.use('/draft', (await import('./routes/draft.js')).default);
app.use('/pulls', (await import('./routes/pulls.js')).default);

// Bisect
app.use('/bisect/', (await import('./routes/bisect/index.js')).default);
app.use('/bisect/commits', (await import('./routes/bisect/commits.js')).default);
app.use('/bisect/commits-post', (await import('./routes/bisect/commits-post.js')).default);
app.use('/bisect/bisect', (await import('./routes/bisect/bisect.js')).default);
app.use('/bisect/main', (await import('./routes/bisect/main.js')).default);
app.use('/bisect/main-post', (await import('./routes/bisect/main-post.js')).default);
app.use('/bisect/view', (await import('./routes/bisect/view.js')).default);

// Samples
app.use('/samples/', (await import('./routes/samples/index.js')).default);
app.use('/samples/data', (await import('./routes/samples/data.js')).default);
app.use('/samples/contents', (await import('./routes/samples/contents.js')).default);
app.use('/samples/mobile', (await import('./routes/samples/mobile.js')).default);
app.use('/samples/nightly', (await import('./routes/samples/nightly.js')).default);
app.use('/samples/list-samples', (await import('./routes/samples/list-samples.js')).default);
app.use('/samples/jsfiddle-post', (await import('./routes/samples/share.js')).default);
app.use('/samples/server-env', (await import('./routes/samples/server-env.js')).default);
app.use('/samples/readme', (await import('./routes/samples/readme.js')).default);
app.use('/samples/settings', (await import('./routes/samples/settings.js')).default);
app.use('/samples/settings-post', (await import('./routes/samples/settings-post.js')).default);
app.use('/samples/view', (await import('./routes/samples/view.js')).default);
app.use('/samples/view-source', (await import('./routes/samples/view-source.js')).default);
app.use('/samples/compare-comment', (await import('./routes/samples/compare-comment.js')).default);
app.use('/samples/compare-iframe', (await import('./routes/samples/compare-iframe.js')).default);
app.use('/samples/compare-update-report', (await import('./routes/samples/compare-update-report.js')).default);
app.use('/samples/compare-report', (await import('./routes/samples/compare-report.js')).default);
app.use('/samples/compare-reset', (await import('./routes/samples/compare-reset.js')).default);
app.use('/samples/compare-view', (await import('./routes/samples/compare-view.js')).default);

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

export default app;
