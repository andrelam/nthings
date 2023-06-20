// models/user.js
// load the things we need
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt');

var nodemailer = require('nodemailer');
var emailTempl = require('email-templates');
var path       = require('path');
var templConf  = path.resolve(__dirname, '../views/mail', 'confirm');
var templReset = path.resolve(__dirname, '../views/mail', 'reset');
//var config     = require('../config/setup.js');
var logger     = require('../utils/logger');

var userSchema = mongoose.Schema( {
  username  : { type: String, required: true, unique: true, trim: true },
  email     : { type: String, required: true, unique: true, trim: true },
  password  : { type: String, required: true },
  name      : { type: String, required: true, trim: true },
  resetToken: { type: String, required: false },
  resetValid: { type: Date, required: false },
  validated : { type: Boolean, default: false },
  superUser : { type: Boolean, default: false },
  lastLogin : { type: Date, required: false }
});

// methods ======================
// generating a hash
userSchema.methods.generateHash = function(password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
userSchema.methods.validPassword = function(password) {
  return bcrypt.compareSync(password, this.password);
};

userSchema.methods.sendMail = function(reset) {
  if (process.env.CONFIG_MAIL) {
    const smtp = nodemailer.createTransport(JSON.parse(process.env.CONFIG_MAIL));

    var template;
    var title;

    if (reset) {
      template = 'reset';
      titulo = 'Reinicialize sua senha';
    } else {
      template = 'confirm';
      titulo = 'Confirme seu registro';
    };

    var html;

    var user = this;

    var email = new emailTempl( 
      { views: {
        root: path.resolve(__dirname, '../views/mail'),
        options: {
          extension: 'ejs'
        }
      }
    });

    email
      .render(template, user)
    .then(html => {
      var mailOptions = {
        to     : user.email.toLowerCase(),
        from   : config.nodemailer.defaultFrom,
        subject: titulo,
        html   : html
      };
      smtp.sendMail(mailOptions, function(err) {
        if (err)
          logger.error('Error while sending email to ' + user.email.toLowerCase() + ': ' + err, {"module": "MAIL"});
      });
      return;
    })
    .catch(err => {
      logger.error('Error while rendering template ' + template + ' to be sent to user ' + user.username.toLowerCase() + ': ' + err, {"module": "MAIL"});
    });

  }

  return;
};

// create the model for users and expose it to our app
module.exports = mongoose.model('User', userSchema);
