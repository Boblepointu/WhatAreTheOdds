"use strict";

const Logger = require('./classes/Logger.js');
const Toolbox = new (require('./classes/Toolbox.js'))();
const UniverseDb = require('./classes/UniverseDb.js');
const BufferDb = require('./classes/BufferDb.js');
const DbWorker = require('./classes/DbWorker.js');
const ApiWorker = require('./classes/ApiWorker.js');
const JasmineRuntime = require('./classes/JasmineRuntime.js');
const Fs = require("fs");

const Params = Toolbox.getAppParams();

var main = async () => {
	var winston = Logger(`Main`, 1);

	Toolbox.displayMFalcon();

	console.log(``);
	console.log(`=====Initialising Millenium Falcon computer=====`);
	console.log(``);
	try{
		// First we launch runtime testings.
		var testResults = await JasmineRuntime('specRunTime_InputParams.js');
		if(!testResults){
			console.log(testResults)
			winston.error(`RunTime tests throw errors. Something is wrong, the app can't work in these conditions. Exiting.`);
			process.exit();
		}

		winston.log(`Loading Millenium Falcon configuration file at ${Params.MFalconConfigPath}.`);
		var MFalcon = require(Params.MFalconConfigPath);

		winston.log(`Generating workset hash.`);
		var WorkSetHash = await Toolbox.getWorkSetHash(MFalcon);
		winston.log(`Universe db and Millenium Falcon config file workset hash is ${WorkSetHash}.`);

		if(Params.DryRun){
			winston.log(`Dry run asked. Deleting buffer database.`);
			try{ await Toolbox.deleteFile(Params.BufferDbPath); }
			catch(err){}			
		}

		winston.log(`Loading, creating, initialising as needed buffer database from ${Params.BufferDbPath}.`);
		var bufferDb = new BufferDb(Params.BufferDbPath);
		await bufferDb.open();
		await bufferDb.setWorkSetHash(WorkSetHash);

		winston.log(`Executing BackDbWorker.`);
		await (new DbWorker()).spawn();
		winston.log(`BackDbWorker spawned.`);

		winston.log(`Waiting for end of precomputation.`);
		var workSetStatus = await bufferDb.getWorkSetStatus();
		while(!workSetStatus.precomputed){
			workSetStatus = await bufferDb.getWorkSetStatus();
			await Toolbox.sleep(1000);
		}

		if(!workSetStatus.travelable){
			winston.error(`This workset universe isn't travelable. That's a fatal. Exiting here.`);
			process.exit();
		}

		winston.log(`Waiting at least one route.`);
		var routeCount = await bufferDb.getRouteCount();
		while(!routeCount){
			routeCount = await bufferDb.getRouteCount();
			await Toolbox.sleep(1000);
		}
		winston.log(`BufferDb has got ${routeCount} precomputed routes for processing. Continuing.`);

		winston.log(`Closing BufferDb.`);
		await bufferDb.close();

		winston.log(`Executing BackApiWorker.`);
		await (new ApiWorker()).spawn();
		winston.log(`BackApiWorker spawned.`);
	}catch(err){
		console.log('FATAL --->');
		console.log(err);
		process.exit();
	}
}

main();