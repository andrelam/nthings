const fs = require('fs');
const express = require('express');
require('dotenv').config();
const app = express();
const mongoose = require('mongoose');
const passport = require('passport');
const logger = require('./utils/logger');

port = process.env.SERVER_PORT || 10000;

const mongoConnection = "mongodb://" + ( process.env.MONGODB_USER ? process.env.MONGODB_USER : "" ) +
			( process.env.MONGODB_PASS ? ":" + process.env.MONGODB_PASS : "" ) +
                        ( process.env.MONGODB_USER || process.env.MONGODB_PASS ? "@" : "" ) +
			( process.env.MONGODB_HOST ? process.env.MONGODB_HOST : "localhost" ) + ":" +
			( process.env.MONGODB_PORT ? process.env.MONGODB_PORT : "27017" ) + "/" +
			( process.env.MONGODB_NAME ? process.env.MONGODB_NAME : "nthings" );

mongoose.Promise = global.Promise;

mongoose.connect(mongoConnection)
.then(() => {
	logger.info('MongoDB connected', {"module": "DB"});
}).catch((err) => {
	logger.error('MongoDB could not connect: ' + err, {"module": "DB"});
	process.exit(1);
}); // connect to our database

var db = mongoose.connection;

const connectWithRetry = () => {
	logger.info('MongoDB connection with retry', {"module": "DB"});
	return mongoose.connect(mongoConnection);
};

db.on('error', err => {
	logger.error('MongoDB could not connect: ' + err, {"module": "DB"});
	process.exit(1);
//	setTimeout(connectWithRetry, 1000);
});

db.on('connected', () => {
	logger.info('MongoDB connected', {"module": "DB"});
});

require('./utils/express')(app);
require('./utils/passport')(passport);

// required for passport
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions


app.listen(port);
logger.info('Express app started on port ' + port, { "module": "SERVER" });

/**
 * Expose
 */

module.exports = app;

