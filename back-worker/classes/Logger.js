"use strict";

module.exports = function(label, logLevel){
  const MaxLogLevel = process.env.LOG_LEVEL || require('../config.json').LogLevel || 5;

  if(logLevel === undefined) logLevel = 0;

  return {
    log: message => {
		if(logLevel > MaxLogLevel) return;
		var date = new Date().toLocaleString("fr-FR", {timeZone: "Europe/Paris"});
		console.log(`info-[${date}][${label}] ${message}`);
    }
    , error: message => {
		if(logLevel > MaxLogLevel) return;
		var date = new Date().toLocaleString("fr-FR", {timeZone: "Europe/Paris"});      
		console.log(`error-[${date}][${label}] ${message}`);
    }
    , warn: message => {
		if(logLevel > MaxLogLevel) return;
		var date = new Date().toLocaleString("fr-FR", {timeZone: "Europe/Paris"});      
		console.log(`warn-[${date}][${label}] ${message}`);
    }     
  }
}