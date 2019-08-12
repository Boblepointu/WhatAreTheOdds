"use strict";

module.exports = function(){
	const Validator = require('validator');
	const Fs = require("fs");
	const Path = require('path');
	const Toolbox = new (require('./Toolbox.js'))();
	const Logger = require('./Logger.js');
	const Db = require('./Db.js');
	const Config = require('../config.json');
	
	this.validateAllInputs = async () => {
		var winston = Logger(`Validator->validateAllInputs`, 1);
		var badParamArray = [];
		winston.log(`1. Validating all parameters`);
		winston.log(`1.1 back-api.js parameters`);

		var Params = Toolbox.getAppParams();

		if(!Number.isInteger(Params.Port))
			badParamArray.push(`[back-api.js] Port parameter isn't integer. Check either env var PORT or Port entry in config.json`);
		else winston.log(`+ Port param ok`);
		if(!Number.isInteger(Params.MaxSimultaneousComputation))
			badParamArray.push(`[back-api.js] MaxSimultaneousComputation parameter isn't integer. Check either env var MAX_SIMULTANEOUS_COMPUTATION or MaxSimultaneousComputation entry in config.json`);
		else winston.log(`+ MaxSimultaneousComputation param ok`);
		if(!Number.isInteger(Params.AllowAllAccessControlOrigins))
			badParamArray.push(`[back-api.js] AllowAllAccessControlOrigins parameter isn't integer. Check either env var ALLOW_ALL_ACCESS_CONTROL_ORIGIN or AllowAllAccessControlOrigins entry in config.json`);
		else winston.log(`+ AllowAllAccessControlOrigins param ok`);
		if(!Number.isInteger(Params.MaxSentRouteToClient))
			badParamArray.push(`[back-api.js] MaxSentRouteToClient parameter isn't integer. Check either env var MAX_SENT_ROUTE_TO_CLIENT or MaxSentRouteToClient entry in config.json`);	
		else winston.log(`+ MaxSentRouteToClient param ok`);

		winston.log(`1.2 back-client-worker.js parameters`);

		if(!Number.isInteger(Params.HardTimeoutSec))
			badParamArray.push(`[back-client-worker.js] HardTimeoutSec parameter isn't integer. Check either env var HARD_TIMEOUT_SEC or HardTimeoutSec entry in config.json`);
		else winston.log(`+ HardTimeoutSec param ok`);
		if(!Number.isInteger(Params.SoftTimeoutSec))
			badParamArray.push(`[back-client-worker.js] SoftTimeoutSec parameter isn't integer. Check either env var SOFT_TIMEOUT_SEC or SoftTimeoutSec entry in config.json`);
		else winston.log(`+ SoftTimeoutSec param ok`);
		if(!Fs.existsSync(Params.MFalconConfigPath))
			badParamArray.push(`[back-client-worker.js] MFalconConfigPath is invalid. The file don't exist, or the path is invalid. Check either env var MFALCON_CONFIG_PATH or MFalconConfigPath entry in config.json`);
		else winston.log(`+ MFalconConfigPath param ok`);
		/*if(!Fs.existsSync(BufferDbPath))
			badParamArray.push(`[back-client-worker.js] BufferDbPath is invalid. The file don't exist, or the path is invalid. Check either env var BUFFER_DB_PATH or BufferDbPath entry in config.json`);
		else winston.log(`+ BufferDbPath param ok`);*/

		winston.log(`1.3 back-db-worker.js parameters`);

		if(!Fs.existsSync(Params.MFalconConfigPath))
			badParamArray.push(`[back-db-worker.js] MFalconConfigPath is invalid. The file don't exist, or the path is invalid. Check either env var MFALCON_CONFIG_PATH or MFalconConfigPath entry in config.json`);
		else winston.log(`+ MFalconConfigPath param ok`);
		/*if(!Fs.existsSync(BufferDbPath))
			badParamArray.push(`[back-db-worker.js] BufferDbPath is invalid. The file don't exist, or the path is invalid. Check either env var BUFFER_DB_PATH or BufferDbPath entry in config.json`);
		else winston.log(`+ BufferDbPath param ok`);*/

		if(badParamArray.length){
			winston.error(`Some parameters are wrong. The app can't run in these conditions. Please clean parameters before going further. Here a list :`);
			for(let i = 0; i < badParamArray.length; i++)
				winston.error(`---> ${badParamArray[i]}`);

			process.exit();
		}

		winston.log(`2. Validating all input files`);
		winston.log(`2.1 MilleniumFalcon config file`);
		var MFalcon = require(Path.join('..', Params.MFalconConfigPath));

		if(!MFalcon.departure)
			badParamArray.push(`[millenium-falcon.json] File doesn't contain a departure entry`);
		else if(!Validator.isAlphanumeric(MFalcon.departure))
			badParamArray.push(`[millenium-falcon.json] Departure entry isn't alphanumeric`);
		else winston.log(`+ Departure in millenium-falcon.json ok`);

		if(!MFalcon.arrival)
			badParamArray.push(`[millenium-falcon.json] File doesn't contain an arrival entry`);
		else if(!Validator.isAlphanumeric(MFalcon.arrival))
			badParamArray.push(`[millenium-falcon.json] Arrival entry isn't alphanumeric`);
		else winston.log(`+ Arrival in millenium-falcon.json ok`);

		if(!MFalcon.autonomy)
			badParamArray.push(`[millenium-falcon.json] File doesn't contain an autonomy entry`);
		else if(!Number.isInteger(MFalcon.autonomy))
			badParamArray.push(`[millenium-falcon.json] Autonomy entry isn't numeric`);
		else if(MFalcon.autonomy < 1)
			badParamArray.push(`[millenium-falcon.json] Autonomy entry is < 0`);
		else winston.log(`+ Autonomy in millenium-falcon.json ok`);

		if(!MFalcon.routes_db)
			badParamArray.push(`[millenium-falcon.json] File doesn't contain an routes_db entry`);
		else if(!Fs.existsSync(MFalcon.routes_db))
			badParamArray.push(`[millenium-falcon.json] routes_db file at '${MFalcon.routes_db}' doesn't exist`);
		else winston.log(`+ Routes_db in millenium-falcon.json ok`);

		winston.log(`2.2 Universe database`);
		try{
			var UniverseDb = new Db();
			await UniverseDb.openDb(MFalcon.routes_db);
		}catch(err){
			console.log(err);
			badParamArray.push(`[universe-db(${MFalcon.routes_db})] Can't open universe database. Are you sure it's a sqlite3 db ?`);
			return badParamArray;
		}

		winston.log(`+ Universe db open ok`);

		try{
			var routesTableExist = (await UniverseDb.selectRequest(`SELECT name FROM sqlite_master WHERE type='table' AND name='routes'`, []))[0] ? true : false;
			if(!routesTableExist){
				badParamArray.push(`[universe-db(${MFalcon.routes_db})] Doesn't contain a routes table`);
				return badParamArray;
			}
			else winston.log(`+ Route table in db ok`);
		}catch(err){
			console.log(err);
			badParamArray.push(`[universe-db(${MFalcon.routes_db})] Can't query universe database.`);
		}

		try{
			var routesTableColumns = await UniverseDb.selectRequest(`PRAGMA table_info(routes)`, []);
			
			if(routesTableColumns.length != 3){
				badParamArray.push(`[universe-db(${MFalcon.routes_db})] Routes table doesn't contain 3 column`);
				return badParamArray;
			}
			else winston.log(`+ Route table column count ok`);

			if(routesTableColumns[0].name != "origin"){
				badParamArray.push(`[universe-db(${MFalcon.routes_db})] Routes table first column isn't named origin`);
				return badParamArray;
			}
			else winston.log(`+ Route table column origin ok`);

			if(routesTableColumns[1].name != "destination"){
				badParamArray.push(`[universe-db(${MFalcon.routes_db})] Routes table second column isn't named destination`);
				return badParamArray;
			}
			else winston.log(`+ Route table column destination ok`);

			if(routesTableColumns[2].name != "travel_time"){
				badParamArray.push(`[universe-db(${MFalcon.routes_db})] Routes table third column isn't named travel_time`);
				return badParamArray;
			}
			else winston.log(`+ Route table column travel_time ok`);

			if(routesTableColumns[0].type != "TEXT"){
				badParamArray.push(`[universe-db(${MFalcon.routes_db})] Routes table first column isn't of type TEXT`);
				return badParamArray;
			}
			else winston.log(`+ Route table column origin type ok`);

			if(routesTableColumns[1].type != "TEXT"){
				badParamArray.push(`[universe-db(${MFalcon.routes_db})] Routes table second column isn't of type TEXT`);
				return badParamArray;
			}
			else winston.log(`+ Route table column arrival type ok`);

			if(routesTableColumns[2].type != "UNSIGNED INTEGER" && routesTableColumns[2].type != "INTEGER"){
				badParamArray.push(`[universe-db(${MFalcon.routes_db})] Routes table third column isn't of type UNSIGNED INTEGER`);
				return badParamArray;
			}
			else winston.log(`+ Route table column travel_time type ok`);
		}catch(err){
			console.log(err);
			badParamArray.push(`[universe-db(${MFalcon.routes_db})] Can't query universe database.`);
		}

		try{
			var routesTable = await UniverseDb.selectRequest(`SELECT * FROM routes`, []);
			if(routesTable.length == 0){
				badParamArray.push(`[universe-db(${MFalcon.routes_db})] Routes table is empty`);
				return badParamArray;
			}
			else winston.log(`+ Route table content count ok`);

			var containOnlyAlphanumerics = true;
			for(let i = 0; i < routesTable.length; i++)
				if(!Validator.isAlphanumeric(routesTable[i].origin) || !Validator.isAlphanumeric(routesTable[i].destination))
					containOnlyAlphanumerics = false;
			if(!containOnlyAlphanumerics)
				badParamArray.push(`[universe-db(${MFalcon.routes_db})] Routes table origin and destination doesn't contain only alphanumeric entries`);
			else winston.log(`+ Route table content format ok`);
		}catch(err){
			console.log(err);
			badParamArray.push(`[universe-db(${MFalcon.routes_db})] Can't query universe database.`);
		}

		if(badParamArray.length){
			winston.log('Errors to fix before lauching :');
			for(let i = 0; i < badParamArray.length; i++)
				winston.log(`--> ${badParamArray[i]}`);
			process.exit();
		}

		return;
	}

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