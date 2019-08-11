"use strict";

module.exports = function(){
	const Path = require('path');
	const AppDir = Path.dirname(require.main.filename);	
	const Logger = require('./Logger.js');
	const winston = new Logger('Toolbox');

	this.sleep = function(ms){
		return new Promise((resolve, reject) => {
			setTimeout(resolve, ms);
		});
	}

	this.readData = async function(mFalconPath){
		var mFalcon = require(Path.join(AppDir, mFalconPath));
		return {
			MFalcon: mFalcon/*,
			Universe: await (new DbReader()).readRouteEntries(mFalcon.routes_db)*/
		}
	}

	this.areInputsValid = function(Empire, MFalcon, Universe){
		if(!Universe){
			winston.error('No Universe parameters given !');
			return false;
		}
		for(var i in Universe){
			if(!Universe[i].origin){
				winston.error('No origin column in universe db !');
				return false;
			}
			if(typeof Universe[i].origin != "string"){
				winston.error('Origin column in universe db isn\'t yielding strings !');
				return false;
			}		
			if(!Universe[i].destination){
				winston.error('No destination column in universe db !');
				return false;
			}
			if(typeof Universe[i].destination != "string"){
				winston.error('Destination column in universe db isn\'t yielding strings !');
				return false;
			}		
			if(!Universe[i].travel_time){
				winston.error('No travel_time column in universe db !');
				return false;
			}		
			if(!Number.isInteger(Universe[i].travel_time)){
				winston.error('Travel time column in db isn\'t yielding integers !');
				return false;
			}
		}

		if(!MFalcon){
			winston.error('No MFalcon parameters given !');
			return false;		
		}

		if(!MFalcon.departure){
			winston.error('No departure entry in MFalcon data !');
			return false;		
		}

		if(typeof MFalcon.departure != "string"){
			winston.error('Departure entry in MFalcon data is not a string !');
			return false;		
		}	

		if(!MFalcon.arrival){
			winston.error('No arrival entry in MFalcon data !');
			return false;		
		}

		if(typeof MFalcon.arrival != "string"){
			winston.error('Arrival entry in MFalcon data is not a string !');
			return false;		
		}

		if(!MFalcon.routes_db){
			winston.error('No routes_db entry in MFalcon data !');
			return false;		
		}

		if(!MFalcon.autonomy){
			winston.error('No autonomy entry in MFalcon data !');
			return false;		
		}

		if(!Number.isInteger(MFalcon.autonomy)){
			winston.error('Autonomy entry in MFalcon data is not an integer !');
			return false;		
		}	

		if(!Empire){
			winston.error('No Empire intel given !');
			return false;
		}
		if(!Empire.countdown){
			winston.error('To compute, we need data about the empire countdown.');
			return false;
		}
		if(!Number.isInteger(Empire.countdown)){
			winston.error('The given countdown isn\'t an integer !');
			return false;
		}
		if(!Empire.bounty_hunters){
			winston.error('Bounty hunters intel is necessary, even as an empty array.');
			return false;
		}
		if(Empire.bounty_hunters){
			if(!Array.isArray(Empire.bounty_hunters)){
				winston.error('Bounty hunters intel is not presented as an array.');
				return false;
			}
			for(var i in Empire.bounty_hunters){
				if(!Empire.bounty_hunters[i].planet){
					winston.error('Every bounty hunters intel need a planet.');
					return false;
				}
				if(typeof Empire.bounty_hunters[i].planet != "string"){
					winston.error('All bounty hunter planet arguments must be a string !');
					return false;
				}
				if(!Number.isInteger(Empire.bounty_hunters[i].day)){
					winston.error('All bounty hunter day arguments must be an integer !');
					return false;
				}				
				if(!Empire.bounty_hunters[i].day && Empire.bounty_hunters[i].day != 0){
					winston.error('Every bounty hunters intel need a day.');
					return false;
				}
				try{ parseInt(Empire.bounty_hunters[i].day); }
				catch(err){
					winston.error('The day parameter of every bounty hunters intel must be given as an int.');
					return false;
				}
				if(Empire.bounty_hunters[i].day < 0){
					winston.error('The day parameter of every bounty hunters intel must be positive.');
					return false;
				}			
				if(typeof Empire.bounty_hunters[i].planet != "string"){
					winston.error('The planet parameter of every bounty hunters intel must be given as a string.');
					return false;
				}
				if(Empire.bounty_hunters[i].planet.length == 0){
					winston.error('The planet parameter of every bounty hunters intel must have more than 0 character.');
					return false;
				}			
			}
		}
		return true;
	}

	this.areAppArgumentsValid = function(HeapSizeLevel1, HeapSizeLevel2, Depth, MFalconConfigPath, HardTimeoutSec, SoftTimeoutSec){
		try{
			if(!Number.isInteger(HeapSizeLevel1)){
				winston.error(`HeapSizeLevel1 must be an integer. Got ${HeapSizeLevel1}.`);
				return false;
			}
			if(!Number.isInteger(HeapSizeLevel2)){
				winston.error(`HeapSizeLevel2 must be an integer. Got ${HeapSizeLevel2}.`);
				return false;
			}
			if(!Number.isInteger(Depth)){
				winston.error(`Depth must be an integer. Got ${Depth}.`);
				return false;
			}
			if(typeof MFalconConfigPath != "string"){
				winston.error(`Depth must be a string. Got ${MFalconConfigPath}.`);
				return false;
			}
			if(!Number.isInteger(HardTimeoutSec)){
				winston.error(`HardTimeoutSec must be an integer. Got ${HardTimeoutSec}.`);
				return false;
			}
			if(!Number.isInteger(SoftTimeoutSec)){
				winston.error(`SoftTimeoutSec must be an integer. Got ${SoftTimeoutSec}.`);
				return false;
			}

			return true;
		}catch(err){ throw err; }
	}

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
}