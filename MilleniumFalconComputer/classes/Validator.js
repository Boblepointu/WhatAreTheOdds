"use strict";

module.exports = function(){
	const Validator = require('validator');
	const Fs = require("fs");
	const Path = require('path');
	const Toolbox = new (require('./Toolbox.js'))();
	const Logger = require('./Logger.js');
	const Db = require('./Db.js');
	const Config = require('../config.json');

	this.areEmpireIntelValid = Empire => {
		return new Promise((resolve, reject) => {
			try{
				if(!Empire){
					reject('No parameters given !');
					return;
				}
				if(!Empire.countdown){
					reject('To compute, we need data about the empire countdown.');
					return;
				}
				if(Empire.countdown){
					try{ parseInt(Empire.countdown); }
					catch(err){
						reject('The given countdown isn\'t an integer !');
						return;
					}
				}
				if(Empire.countdown < 1){
					reject('Empire countdown is < 1 ! Can\'t make it in these conditions !');
					return;
				}				
				if(!Empire.bounty_hunters){
					reject('Bounty hunters intel is necessary, even as an empty array.');
					return;
				}
				if(Empire.bounty_hunters){
					if(!Array.isArray(Empire.bounty_hunters)){
						reject('Bounty hunters intel is not presented as an array.');
						return;
					}
					for(var i in Empire.bounty_hunters){
						if(!Empire.bounty_hunters[i].planet){
							reject('Every bounty hunters intel need a planet.');
							return;
						}
						if(typeof Empire.bounty_hunters[i].planet != "string"){
							reject('All bounty hunter planet arguments must be a string !');
							return;
						}
						if(!Number.isInteger(Empire.bounty_hunters[i].day)){
							reject('All bounty hunter day arguments must be an integer !');
							return;
						}
						if(Empire.bounty_hunters[i].day === undefined){
							reject('Every bounty hunters intel need a day.');
							return;
						}						
						if(!Number.isInteger(Empire.bounty_hunters[i].day)){
							reject('The day parameter of every bounty hunters intel must be given as an int.');
							return;
						}
						if(Empire.bounty_hunters[i].day < 0){
							reject('The day parameter of every bounty hunters intel must be positive.');
							return;
						}			
						if(typeof Empire.bounty_hunters[i].planet != "string"){
							reject('The planet parameter of every bounty hunters intel must be given as a string.');
							return;
						}
						if(Empire.bounty_hunters[i].planet.length == 0){
							reject('The planet parameter of every bounty hunters intel must have more than 0 character.');
							return;
						}			
					}
				}
				resolve();
			}catch(err){ reject(err); }
		});
	}

	this.sanitizeEmpireIntel = Empire => {
		try{
			var sanitized = {};

			sanitized.countdown = Empire.countdown;
			sanitized.bounty_hunters = [];
			for(var i in Empire.bounty_hunters)
				sanitized.bounty_hunters.push({
					planet: Empire.bounty_hunters[i].planet
					, day: Empire.bounty_hunters[i].day
				});

			return sanitized;
		}catch(err){ throw err; }
	}	
}