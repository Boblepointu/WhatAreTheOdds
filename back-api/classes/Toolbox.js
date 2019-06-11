module.exports = function(){
	const Logger = require('./Logger.js');
	const winston = new Logger('Toolbox');

	this.areEmpireIntelValid = function(Empire){
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

	this.sanitizeEmpireIntel = function(Empire){
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

	this.getSpawnedChildsCount = function(){
		return new Promise((resolve, reject) => {
			var eventReceiver = spawnedChildsCount => resolve(spawnedChildsCount);
			process.once("message", eventReceiver);
			process.send("getStatus");
		});
	}

	this.areAppArgumentsValid = function(Port, MaxSimultaneousComputation, AllowAllAccessControlOrigins, MaxSentRouteToClient){
		try{
			if(!Number.isInteger(Port)){
				winston.error(`Port must be an integer. Got ${Port}.`);
				return false;
			}
			if(!Number.isInteger(MaxSimultaneousComputation)){
				winston.error(`MaxSimultaneousComputation must be an integer. Got ${MaxSimultaneousComputation}.`);
				return false;
			}
			if(!Number.isInteger(AllowAllAccessControlOrigins)){
				winston.error(`AllowAllAccessControlOrigins must be an integer (0 or 1). Got ${AllowAllAccessControlOrigins}.`);
				return false;
			}
			if(AllowAllAccessControlOrigins != 0 && AllowAllAccessControlOrigins != 1){
				winston.error(`AllowAllAccessControlOrigins must be an integer (0 or 1). Got ${AllowAllAccessControlOrigins}.`);
				return false;
			}
			if(!Number.isInteger(MaxSentRouteToClient)){
				winston.error(`MaxSentRouteToClient must be an integer. Got ${MaxSentRouteToClient}.`);
				return false;
			}

			return true;
		}catch(err){ throw err; }
	}
}