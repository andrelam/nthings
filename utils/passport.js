// utils/passport.js

// load all the things we need
var LocalStrategy = require('passport-local').Strategy;

// load up the user model
var User = require('../models/user');
var LoginHistory = require('../models/loginHistory');

var crypto = require('crypto');
var logger = require('./logger');


// expose this function to our app using module.exports
module.exports = function(passport) {

  // =========================================================================
  // passport session setup ==================================================
  // =========================================================================
  // required for persistent login sessions
  // passport needs ability to serialize and unserialize users out of session

  // used to serialize the user for the session
  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  // used to deserialize the user
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

  // =========================================================================
  // LOCAL SIGNUP ============================================================
  // =========================================================================
  // we are using named strategies since we have one for login and one for signup
  // by default, if there was no name, it would just be called 'local'

  passport.use('local-signup', new LocalStrategy({
    // by default, local strategy uses username and password
    usernameField : 'username',
    passwordField : 'password',
    passReqToCallback : true // allows us to pass back the entire request to the callback
  },
    function(req, username, password, done) {

      // asynchronous
      // User.findOne wont fire unless data is sent back
      process.nextTick(function() {

        // find a user whose username is the same as the forms username
        // we are checking to see if the user trying to login already exists
        User.findOne({ 'username' : username.toLowerCase() }, function(err, user) {
          // if there are any errors, return the error
          if (err) {
            logger.error('Error querying username ' + username.toLowerCase() + ': ' + err, { "module": "AUTH" });
            return done(err);
          }

          // check to see if there's already a user with that username
          if (user) {
            logger.info('Attempt to re-create user ' + username.toLowerCase(), { "module": "AUTH" });
            return done(null, false, req.flash('signupMessage', req.i18n.t('auth.usernameAlreadyExists')));
          } else {
            logger.debug('Creating user ' + username.toLowerCase(), { "module": "AUTH" });
            // if there is no user with that username
            // create the user
            var newUser      = new User();
            // set the user's local credentials
            newUser.username   = username.toLowerCase();
            newUser.password   = newUser.generateHash(password);
            newUser.email      = req.body.email;
            newUser.name       = req.body.name;
            newUser.resetToken = randomValueBase64(32);
            newUser.validated  = false;
            newUser.superUser  = false;

            // save the user
            newUser.save(function(err) {
              if (err) {
                logger.error('Error while creating user ' + username.toLowerCase() + ': ' + err, { "module": "AUTH" });
                throw err;
              }
              logger.info('Created user ' + username.toLowerCase(), { "module": "AUTH" });
              newUser.sendMail(false);
              return done(null, false, req.flash('validationMessage', req.i18n.t('auth.confirmEmailSent', { email: newUser.email.toLowerCase() })));
            });
          }
        });
      });
    })
  );

  passport.use('local-login', new LocalStrategy({
  // by default, local strategy uses username and password
    usernameField : 'username',
    passwordField : 'password',
    passReqToCallback : true // allows us to pass back the entire request to the callback
  },
    function(req, username, password, done) { // callback with username and password from our form

      // we are checking to see if the user trying to login already exists
      User.findOne({ 'username' : username.toLowerCase() }, function(err, user) {
        // if there are any errors, return the error before anything else
        if (err) {
          logger.error('Error while looking up for user ' + username.toLowerCase() + ': ' + err, { "module": "AUTH" });
          return done(err);
        }

        // if no user is found, return the message
        if (!user) {
          logger.info('Attempt to log with non-existant user ' + username.toLowerCase(), { "module": "AUTH" });
          return done(null, false, req.flash('loginMessage', req.i18n.t('auth.invalidUserOrPassword')));
        }

        if (!user.validated) {
          logger.warn('Attempt to log with user ' + username.toLowerCase() + ' without previous validation', { "module": "AUTH" });
          return done(null, false, req.flash('loginMessage', req.i18n.t('auth.emailNotConfirmed', { email: user.email.toLowerCase() })));
        }

        var loginHistory = new LoginHistory();

        // if the user is found but the password is wrong
        if (!user.validPassword(password)) {
          logger.warn('Attempt to log with user ' + username.toLowerCase() + ' with wrong password', { "module": "AUTH" });
          loginHistory.newLogin(user, false);
          return done(null, false, req.flash('loginMessage', req.i18n.t('auth.invalidUserOrPassword')));
        }

        // update last login data
        user.resetToken = undefined;
        user.resetValid = undefined;
        user.lastLogin = Date.now();

        user.save(function(err) {
        if (err) {
          logger.error('Error while saving user ' + username.toLowerCase() + ': ' + err, { "module": "AUTH" });
          return done(null, false, req.flash('loginMessage', req.i18n.t('auth.invalidUserOrPassword')));
        }
      });

      logger.info('New login by user ' + username.toLowerCase(), { "module": "AUTH" });
      loginHistory.newLogin(user, true);

      // all is well, return successful user
      return done(null, user);
    });

  }));

};


function randomValueBase64 (len) {
	return crypto.randomBytes(Math.ceil(len * 3 / 4))
		.toString('base64')   // convert to base64 format
		.slice(0, len)        // return required number of characters
		.replace(/\+/g, '0')  // replace '+' with '0'
		.replace(/\//g, '0'); // replace '/' with '0'
}

