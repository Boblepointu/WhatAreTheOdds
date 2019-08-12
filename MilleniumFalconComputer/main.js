"use strict";

const Logger = require('./classes/Logger.js');
const Toolbox = new (require('./classes/Toolbox.js'))();
const Db = require('./classes/Db.js');
const DbWorker = require('./classes/DbWorker.js');
const ApiWorker = require('./classes/ApiWorker.js');
const Validator = new (require('./classes/Validator.js'))();
const Fs = require("fs");
const Md5File = require('md5-file/promise');
const Md5 = require('md5');

const Params = Toolbox.getAppParams();

var main = async () => {
	var winston = Logger(`Main`, 1);

	Toolbox.displayMFalcon();

	console.log(``);
	console.log(`=====Initialising Millenium Falcon computer=====`);
	console.log(``);
	try{
		// First we validate each input, config and databases
		await Validator.validateAllInputs();

		var MFalcon = require(Params.MFalconConfigPath);

		// We launch the DB worker and wait for a minimum of one route
		winston.log(`Initialising buffer database from ${Params.BufferDbPath}.`);
		var BufferDb = new Db();
		
		// Creating, opening, populating BufferDb if not existing
		if(!Fs.existsSync(Params.BufferDbPath)){
			winston.log(`BufferDb does not exist. Creating and populating.`)
			await BufferDb.createDb(Params.BufferDbPath);
			await BufferDb.openDb(Params.BufferDbPath);
			await BufferDb.execMultipleRequest(Fs.readFileSync('./buffer.db.sql', 'utf8'));
		}else await BufferDb.openDb(Params.BufferDbPath);
		
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
		process.exit();
	}
}

main();