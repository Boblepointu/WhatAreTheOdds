"use strict";

const Logger = require('./classes/Logger.js');
const PathFinder = require('./classes/PathFinder.js');
const UniverseDb = require('./classes/UniverseDb.js');
const BufferDb = require('./classes/BufferDb.js');
const Toolbox = new (require('./classes/Toolbox.js'))();

const Params = Toolbox.getAppParams();

const main = async () => {
	var winston = Logger(`BackDbWorkerMain`, 1);

	winston.log(`Retrieving Millenium Falcon attributes & Universe graph (${Params.MFalconConfigPath}).`);
	var DataSet = { MFalcon: require(Params.MFalconConfigPath) };

	winston.log(`Generating universe db and Millenium Falcon hash.`);
	var WorkSetHash = await Toolbox.getWorkSetHash(DataSet.MFalcon);
	winston.log(`Db and Millenium Falcon hash is ${WorkSetHash}.`);

	winston.log(`If work universe database exist, delete it. Should have been deleted at last close.`);
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

	var pathFinder = new PathFinder();

	if(!workSetStatus.precomputed){
		winston.log(`WorkSet isn't precomputed. Doing it.`);
		var isTravelable = await pathFinder.precomputeUniverse(universeWorkDb, bufferDb, DataSet.MFalcon);
		workSetStatus.precomputed = 1;
		workSetStatus.travelable = isTravelable ? 1 : 0;
		await bufferDb.updateWorkSetStatus(workSetStatus);
	}

	if(!workSetStatus.travelable){
		winston.error(`This workset isn't travelable. No route will be found. Exiting here.`);
		return;
	}

	if(!workSetStatus.quickly_explored){
		winston.log(`WorkSet isn't quicky explored. Doing it.`);
		await pathFinder.explore(
			universeWorkDb
			, bufferDb
			, DataSet.MFalcon
			, true
			, async route => await bufferDb.insertRoute(route));
		workSetStatus.quickly_explored = 1;
		await bufferDb.updateWorkSetStatus(workSetStatus);
		winston.log(`WorkSet universe is now quickly explored.`);
	}

	if(!workSetStatus.fully_explored){
		winston.log(`WorkSet isn't fully explored. Doing it.`);
		await pathFinder.explore(
			universeWorkDb
			, bufferDb
			, DataSet.MFalcon
			, false
			, async route => await bufferDb.insertRoute(route));
		workSetStatus.fully_explored = 1;
		await bufferDb.updateWorkSetStatus(workSetStatus);
		winston.log(`WorkSet universe is now fully explored.`);
	}

	winston.log(`WorkSet is fully precomputed ! Houray \\o/ ! Exiting here.`);
	return;
};

main();