"use strict";

module.exports = function(label, logLevel){
  const winston = require('winston');
  const { createLogger, format, transports } = require('winston');
  const MaxLogLevel = process.env.LOG_LEVEL || require('../config.json').LogLevel || 5;

  if(logLevel === undefined) logLevel = 0;

  var logger = winston.createLogger({
    transports: [ new winston.transports.Console() ]
    , format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  });

  return {
    log: message => {
		if(logLevel > MaxLogLevel) return;
		var date = new Date().toLocaleString("fr-FR", {timeZone: "Europe/Paris"});
		logger.log({
			level: 'info'
			, message: `[${date}][${label}] ${message}`
		})
    }
    , error: message => {
		if(logLevel > MaxLogLevel) return;
		var date = new Date().toLocaleString("fr-FR", {timeZone: "Europe/Paris"});      
		logger.error({
			level: 'error'
			, message: `[${date}][${label}] ${message}`
		})
    }
    , warn: message => {
		if(logLevel > MaxLogLevel) return;
		var date = new Date().toLocaleString("fr-FR", {timeZone: "Europe/Paris"});      
		logger.warn({
			level: 'warn'
			, message: `[${date}][${label}] ${message}`
		})
    }     
  }
}