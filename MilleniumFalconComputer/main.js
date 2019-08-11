"use strict";

const Logger = require('./classes/Logger.js');
const Toolbox = new (require('./classes/Toolbox.js'))();
const Config = require('./config.json');
const Db = require('./classes/Db.js');
const DbWorker = require('./classes/DbWorker.js');
const ApiWorker = require('./classes/ApiWorker.js');
const Validator = require('validator');
const Fs = require("fs");
const Md5File = require('md5-file/promise');
const Md5 = require('md5');

var ValidateEverything = async () =>{
	var winston = Logger(`ValidateEverything`, 1);
	var badParamArray = [];
	winston.log(`1. Validating all parameters`);
	winston.log(`1.1 back-api.js parameters`);

	var Port = (parseInt(process.env.PORT, 10) || process.env.PORT) || Config.Port || 3000;
	var MaxSimultaneousComputation = (parseInt(process.env.MAX_SIMULTANEOUS_COMPUTATION, 10) || process.env.MAX_SIMULTANEOUS_COMPUTATION) || Config.MaxSimultaneousComputation || 10;
	var AllowAllAccessControlOrigins = (parseInt(process.env.ALLOW_ALL_ACCESS_CONTROL_ORIGIN, 10) || process.env.ALLOW_ALL_ACCESS_CONTROL_ORIGIN) || Config.AllowAllAccessControlOrigins || false;
	var MaxSentRouteToClient = (parseInt(process.env.MAX_SENT_ROUTE_TO_CLIENT, 10) || process.env.MAX_SENT_ROUTE_TO_CLIENT) || Config.MaxSentRouteToClient || 10;

	if(!Number.isInteger(Port))
		badParamArray.push(`[back-api.js] Port parameter isn't integer. Check either env var PORT or Port entry in config.json`);
	else winston.log(`+ Port param ok`);
	if(!Number.isInteger(MaxSimultaneousComputation))
		badParamArray.push(`[back-api.js] MaxSimultaneousComputation parameter isn't integer. Check either env var MAX_SIMULTANEOUS_COMPUTATION or MaxSimultaneousComputation entry in config.json`);
	else winston.log(`+ MaxSimultaneousComputation param ok`);
	if(!Number.isInteger(AllowAllAccessControlOrigins))
		badParamArray.push(`[back-api.js] AllowAllAccessControlOrigins parameter isn't integer. Check either env var ALLOW_ALL_ACCESS_CONTROL_ORIGIN or AllowAllAccessControlOrigins entry in config.json`);
	else winston.log(`+ AllowAllAccessControlOrigins param ok`);
	if(!Number.isInteger(MaxSentRouteToClient))
		badParamArray.push(`[back-api.js] MaxSentRouteToClient parameter isn't integer. Check either env var MAX_SENT_ROUTE_TO_CLIENT or MaxSentRouteToClient entry in config.json`);	
	else winston.log(`+ MaxSentRouteToClient param ok`);

	winston.log(`1.2 back-client-worker.js parameters`);

	var HardTimeoutSec = (parseInt(process.env.HARD_TIMEOUT_SEC, 10) || process.env.HARD_TIMEOUT_SEC) || Config.HardTimeoutSec || 60;
	var SoftTimeoutSec = (parseInt(process.env.SOFT_TIMEOUT_SEC, 10) || process.env.SOFT_TIMEOUT_SEC) || Config.SoftTimeoutSec || 30;
	var MFalconConfigPath = process.env.MFALCON_CONFIG_PATH || Config.MFalconConfigPath || './dataset/millenium-falcon.json';
	var BufferDbPath = process.env.BUFFER_DB_PATH || Config.BufferDbPath || './dataset/buffer.db';	

	if(!Number.isInteger(HardTimeoutSec))
		badParamArray.push(`[back-client-worker.js] HardTimeoutSec parameter isn't integer. Check either env var HARD_TIMEOUT_SEC or HardTimeoutSec entry in config.json`);
	else winston.log(`+ HardTimeoutSec param ok`);
	if(!Number.isInteger(SoftTimeoutSec))
		badParamArray.push(`[back-client-worker.js] SoftTimeoutSec parameter isn't integer. Check either env var SOFT_TIMEOUT_SEC or SoftTimeoutSec entry in config.json`);
	else winston.log(`+ SoftTimeoutSec param ok`);
	if(!Fs.existsSync(MFalconConfigPath))
		badParamArray.push(`[back-client-worker.js] MFalconConfigPath is invalid. The file don't exist, or the path is invalid. Check either env var MFALCON_CONFIG_PATH or MFalconConfigPath entry in config.json`);
	else winston.log(`+ MFalconConfigPath param ok`);
	/*if(!Fs.existsSync(BufferDbPath))
		badParamArray.push(`[back-client-worker.js] BufferDbPath is invalid. The file don't exist, or the path is invalid. Check either env var BUFFER_DB_PATH or BufferDbPath entry in config.json`);
	else winston.log(`+ BufferDbPath param ok`);*/

	winston.log(`1.3 back-db-worker.js parameters`);

	var MFalconConfigPath = process.env.MFALCON_CONFIG_PATH || Config.MFalconConfigPath || './dataset/millenium-falcon.json';
	var BufferDbPath = process.env.BUFFER_DB_PATH || Config.BufferDbPath || './dataset/buffer.db';

	if(!Fs.existsSync(MFalconConfigPath))
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
	var MFalcon = require(MFalconConfigPath);

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

var main = async () => {
	var winston = Logger(`Main`, 1);

	console.log(`
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMWXklcdXMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMNKko:'.   ,xXMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMWXOdc,.         .oNMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMWN0xol;.             'dXWMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMWKko:'.                'dXMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMWXOdc,.                   'dXWMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMWX0xl;.                      'dXMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMN0xl;..                        'dXWMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMW0l,.                           'dXMMMMMMMMMMMMMMMMMMMMMMWWMMMM
MMMMMMMMMMMMO'                            'oXWMMWXkONMMMMMMMMMMMMMMNk:;xXMM
MMMMMMMMMMMWd.                          'oXMMMWXd' .;kNMMMMMMMMMMNk;    ,kW
MMMMMMMMMWO:.                         'dXWMMMXd'      ;OWMMMMMMNk;       :X
MMMMWXKKk:.                        'dOXMMMMXd'        .dNMMMMNk;        .kW
MMMKc...                         'dXWMMMMXd'        .c0WMMMNk;         .dWM
MM0;                           'dXMMMMWXd'        .c0WMMMNk;          .oNMM
MK;                      .';:lxXWMMMXOd'        .c0WMMMNk;            cXMMM
Xc                    .:x0NWMMMMMMMMKkl.      .c0WMMMNk;             :KMMMM
d.                  .lKWMMMMWNNNWMMMMMWXo.  .c0WMMMNk;              ,0MMMMM
,                  ,OWMMMNkl;,'';lxXWMMMW0ll0WMMMNk;               'OMMMMMM
.                 '0MMMWk,         'xKNMMMWWMMMNk;                .kNKOkOXW
                 .dWMMWk.           .'dWMMMMMNk;                 .lx:.   .o
                 .OMMMN:              ;KMMMWO;                   .'        
                 .kMMMNl              :XMMM0'                             .
                  lNMMMK;           ,lOMMMWo.                           .;O
.                 .dNMMMXd,.      'oKWWMMWk.                          .;kNM
c                  .lXMMMMN0xooox0NMMMMMXd.                         .;kNMMM
O.                   'oKWMMMMMMMMMMMWNKd,                    .....':kNMMMMM
Wd.                    .;lxOKXXXK0xo;'.                     lXNNNXNWMMMMMMM
MNo.                        .....                          cXMMMMMMMMMMMMMM
MMNo.                                                    .lXMMMMMMMMMMMMMMM
MMMNx'                                               '::ckNMMMMMMMMMMMMMMMM
MMMMWKc.                                           ,xXMMMMMMMMMMMMMMMMMMMMM
MMMMMMNk;                                        'xXMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMNk:.                                    .xWMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMW0o,.                                .;0MMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMN0d:..                         .;oONMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMWX0xl:,..           ...';ldOXWMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMWNKOxolc:::cloxO0KNWMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM`);


	console.log(``);
	console.log(`=====Initialising Millenium Falcon computer=====`);
	console.log(``);
	try{
		// First we validate each input, config and databases
		await ValidateEverything();

		var MFalconConfigPath = process.env.MFALCON_CONFIG_PATH || Config.MFalconConfigPath || './dataset/millenium-falcon.json';
		var MFalcon = require(MFalconConfigPath);

		// We launch the DB worker and wait for a minimum of one route
		var BufferDbPath = process.env.BUFFER_DB_PATH || Config.BufferDbPath || './dataset/buffer.db';
		winston.log(`Initialising buffer database from ${BufferDbPath}.`);
		var BufferDb = new Db();
		
		// Creating, populating BufferDb if not existing
		if(!Fs.existsSync(BufferDbPath)){
			winston.log(`BufferDb does not exist. Creating and populating.`)
			await BufferDb.createDb(BufferDbPath);
			await BufferDb.openDb(BufferDbPath);
			await BufferDb.execMultipleRequest(Fs.readFileSync('./buffer.db.sql', 'utf8'));
		}else await BufferDb.openDb(BufferDbPath);
		
		// Creating indexes on UniverseDb
		winston.log(`Opening UniverseDb from ${MFalcon.routes_db}.`);
		var UniverseDb = new Db();
		await UniverseDb.openDb(MFalcon.routes_db);
		winston.log(`Creating indexes on UniverseDb.`);
		await UniverseDb.execMultipleRequest(`CREATE INDEX IF NOT EXISTS "full_index" ON "routes" ("origin", "destination")`);
		await UniverseDb.closeDb();

		// Generating hashes
		winston.log(`Generating universe db and Millenium Falcon hash.`);
		var DbAndMFalconConfigHash = await Md5File(MFalcon.routes_db);
		DbAndMFalconConfigHash = Md5(DbAndMFalconConfigHash+JSON.stringify([MFalcon.departure, MFalcon.arrival, MFalcon.autonomy]));
		winston.log(`Db and Millenium Falcon hash is ${DbAndMFalconConfigHash}.`);

		winston.log(`Executing BackDbWorker.`);
		var backDbWorker;

		var onError = err => {
			winston.error('BackDbWorker died prematurily.');
			backDbWorker.removeListener('error', onError);
			backDbWorker.removeListener('done', onDone);
		};
		var onDone = routes => {
			winston.log(`BackDbWorker gracefully closed. All routes in this universe has been found !`);
			backDbWorker.removeListener('error', onError);
			backDbWorker.removeListener('done', onDone);
		};

		backDbWorker = new DbWorker(onError, onDone);
		await backDbWorker.spawn();

		winston.log(`BackDbWorker spawned.`);

		winston.log(`Polling BufferDb until we got a result from back db worker.`);
		var availableRoutes = 0;
		while(!availableRoutes){
			availableRoutes = (await BufferDb.selectRequest(`SELECT count(*) as cnt FROM routes WHERE db_and_mfalcon_config_md5=?`, [DbAndMFalconConfigHash]))[0].cnt;
			await Toolbox.sleep(1000);
		}

		winston.log(`BufferDb has got ${availableRoutes} available routes for processing. Continuing.`);

		winston.log(`Closing BufferDb.`);
		await BufferDb.closeDb();

		// We launch API
		winston.log(`Executing BackApiWorker.`);
		var apiDbWorker;

		var onError = err => {
			winston.error('BackApiWorker died prematurily.');
			backDbWorker.removeListener('error', onError);
			backDbWorker.removeListener('done', onDone);
		};
		var onDone = routes => { 
			winston.log(`BackApiWorker gracefully closed. All routes in this universe has been found !`);
			backDbWorker.removeListener('error', onError);
			backDbWorker.removeListener('done', onDone);
		};

		apiDbWorker = new ApiWorker(onError, onDone);
		await apiDbWorker.spawn();
	}catch(err){
		console.log('FATAL --->');
		console.log(err);
	}
}

main();