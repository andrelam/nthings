const winston = require("winston");
const { format, createLogger, transports } = require("winston");
const { splat, combine, timestamp, label, printf } = format;

const level = process.env.LOG_LEVEL || 'warning';

const customFormat = printf(({ level, message, timestamp, ...meta }) => {
  return `${timestamp} [${meta.module}] ${level}: ${message}`;
});

const logger = winston.createLogger({
  level: level,
  format: combine(timestamp({format: "YYYY.MM.DD HH:mm:ss"}), customFormat),
  transports: [
    process.env.LOG_FILE ? new transports.File({filename: process.env.LOG_FILE}) : new transports.Console(),
  ],
});

module.exports = logger;
