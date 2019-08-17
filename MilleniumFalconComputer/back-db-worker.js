"use strict";

const Logger = require('./classes/Logger.js');
const PathFinder = require('./classes/PathFinder.js');
const UniverseDb = require('./classes/UniverseDb.js');
const BufferDb = require('./classes/BufferDb.js');
const Toolbox = new (require('./classes/Toolbox.js'))();

const Params = Toolbox.getAppParams();

const main = async () => {
	try{
		var winston = Logger(`BackDbWorkerMain`, 1);

		winston.log(`Retrieving Millenium Falcon attributes & Universe graph (${Params.MFalconConfigPath}).`);
		var DataSet = { MFalcon: require(Params.MFalconConfigPath) };

		winston.log(`Generating universe db and Millenium Falcon hash.`);
		var WorkSetHash = await Toolbox.getWorkSetHash(DataSet.MFalcon);
		winston.log(`Db and Millenium Falcon hash is ${WorkSetHash}.`);

		winston.log(`If work universe database exist, delete it.`);
		try{ await Toolbox.deleteFile(Params.UniverseWorkDbPath); }
		catch(err){}

		winston.log(`Copying universe database to work on temp file.`);
		await Toolbox.copyFile(DataSet.MFalcon.routes_db, Params.UniverseWorkDbPath);

		winston.log(`Opening universe work database.`);
		var universeWorkDb = new UniverseDb(Params.UniverseWorkDbPath);
		await universeWorkDb.open();

		winston.log(`Preparing universe work database for exploitation.`);
		await universeWorkDb.prepareForExploitation();

		winston.log(`Opening/Creating buffer database.`);
		var bufferDb = new BufferDb(Params.BufferDbPath);
		await bufferDb.open();
		await bufferDb.setWorkSetHash(WorkSetHash);
		var workSetStatus = await bufferDb.getWorkSetStatus();

		winston.log(`Starting heavy pathfinding work.`);
		var pathFinder = new PathFinder();

		if(!workSetStatus.precomputed){
			winston.log(`WorkSet isn't precomputed. Doing it.`);
			var travelable = await pathFinder.precompute(universeWorkDb, bufferDb, DataSet.MFalcon);
			workSetStatus.precomputed = 1;
			workSetStatus.travelable = travelable ? 1 : 0;
			winston.log(`Marking this workset as ${travelable ? 'travelable' : ' not travelable'} and precomputed.`);
			await bufferDb.updateWorkSetStatus(workSetStatus);
		}

		if(!workSetStatus.travelable){
			winston.error(`This workset isn't travelable. No route will be found. Exiting here.`);
			return;
		}

		if(!workSetStatus.explored){
			winston.log(`WorkSet isn't fully explored. Doing it.`);
			await pathFinder.explore(universeWorkDb, bufferDb, DataSet.MFalcon);
			workSetStatus.explored = 1;
			winston.log(`Marking this workset as explored.`);
			await bufferDb.updateWorkSetStatus(workSetStatus);
			winston.log(`WorkSet universe is now fully explored (in the limit of the configuration 'MaxPrecalculatedRoutes' entry).`);
		}

		await bufferDb.close();

		winston.log(`WorkSet is fully precomputed and explored ! Houray \\o/ ! Exiting here.`);
		return;
	}catch(err){
		console.log('FATAL ---->');
		console.log(err);
		process.exit();
	}
};

main();