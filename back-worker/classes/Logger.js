"use strict";

module.exports = function(label, silent){
  var winston = require('winston');
  var { createLogger, format, transports } = require('winston');

  var logger = winston.createLogger({
    transports: [ new winston.transports.Console() ]
    , format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  });

  return {
    log: message => {
    	if(silent) return;
      var date = new Date().toLocaleString("fr-FR", {timeZone: "Europe/Paris"});
      logger.log({
        level: 'info'
        , message: `[${date}][${label}] ${message}`
      })
    }
    , error: message => {
    	if(silent) return;
      var date = new Date().toLocaleString("fr-FR", {timeZone: "Europe/Paris"});      
      logger.error({
        level: 'error'
        , message: `[${date}][${label}] ${message}`
      })
    }
    , warn: message => {
    	if(silent) return;
      var date = new Date().toLocaleString("fr-FR", {timeZone: "Europe/Paris"});      
      logger.warn({
        level: 'warn'
        , message: `[${date}][${label}] ${message}`
      })
    }     
  }
}