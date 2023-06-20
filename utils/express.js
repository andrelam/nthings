const path = require('path');
const express = require('express');
const session = require('express-session');
const csrf = require('csrf-csrf');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const ejs = require('ejs');
const flash = require('connect-flash');
const pkg = require('../package.json');
const logger = require('./logger');
const favicon = require('serve-favicon');
const helmet = require('helmet');
const i18nextMiddleware = require('i18next-http-middleware');
const i18n = require('./lang');

const env = process.env.NODE_ENV || 'development';

const { doubleCsrfProtection } = csrf.doubleCsrf( {
  getSecret: () => process.env.SESSION_SECRET,
  cookieName: "x-csrf-token",
  cookieOptions: {
    httpOnly: true,
    sameSite: "lax",
    maxAge: ( process.env.CSRF_TOKEN_COOKIE_EXPIRES ? parseInt(process.env.CSRF_TOKEN_COOKIE_EXPIRES) : 2400000)
  },
  size: 64,
  ignoredMethods: ["GET", "HEAD", "OPTIONS"],
  getTokenFromRequest: (req) => req.headers["x-csrf-token"],
});


/**
 * Expose
 */

module.exports = function (app, passport) {

  app.use(helmet());

  // Compression middleware (should be placed before express.static)
  app.use(compression({
    threshold: 512
  }));

  // i18n
  app.use(i18nextMiddleware.handle(i18n));

  // Static files middleware
  app.use(express.static(path.join(__dirname, '/../public'))); //Expose /public

  app.use(favicon(path.join(__dirname, '/../public', 'favicon.ico')));

  // set views path, template engine and default layout
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, '/../views'));

  // expose package.json to views
  app.use(function (req, res, next) {
    res.locals.pkg = pkg;
    res.locals.env = env;
    next();
  });

  // bodyParser should be above methodOverride
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(methodOverride(function (req, res) {
    if (req.body && typeof req.body === 'object' && '_method' in req.body) {
      // look in urlencoded POST bodies and delete it
      var method = req.body._method;
      delete req.body._method;
      return method;
    }
  }));

  // CookieParser should be above session
  app.use(cookieParser());
  app.use(cookieSession({ secret: process.env.SESSION_SECRET }));
  app.use(session({
    resave: true,
    saveUninitialized: true,
    secret: process.env.SESSION_SECRET,
    name: 'sessionId',
	cookie: { 
              maxAge: (process.env.COOKIE_EXPIRES ? parseInt(process.env.COOKIE_EXPIRES) : 2400000),
              httpOnly: true,
              secure: true,
              sameSite: 'lax' }
  }));

  app.use(doubleCsrfProtection);

  app.use(function(req, res, next) {
	  res.cookie("x-csrf-token", req.csrfToken());
	  return next();
  });

  // error handler
  app.use(function (err, req, res, next) {
    if (err.code !== 'EBADCSRFTOKEN') {
        logger.error('CSRF attempt detected: ' + err, { "module": "HTTP" });
        return next(err);
    }
    // handle CSRF token errors here
    res.status(403);
	logger.warn('Returning HTTP 403 and redirecting to home page', { "module": "HTTP" });
	req.logout();
	res.redirect('/');
  });

  // connect flash for flash messages - should be declared after sessions
  app.use(flash());

};
