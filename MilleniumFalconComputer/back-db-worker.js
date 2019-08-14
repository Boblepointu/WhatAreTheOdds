"use strict";

const Logger = require('./classes/Logger.js');
const PathFinder = require('./classes/PathFinder.js');
const Db = require('./classes/Db.js');
const Toolbox = new (require('./classes/Toolbox.js'))();

const Params = Toolbox.getAppParams();

const main = async () => {
	var winston = Logger(`BackDbWorkerMain`, 1);

	winston.log(`Retrieving Millenium Falcon attributes & Universe graph (${Params.MFalconConfigPath}).`);
	var DataSet = { MFalcon: require(Params.MFalconConfigPath) };

	winston.log(`Generating universe db and Millenium Falcon hash.`);
	var WorkSetHash = await Toolbox.getWorkSetHash(DataSet.MFalcon);
	winston.log(`Db and Millenium Falcon hash is ${WorkSetHash}.`);

	winston.log(`Opening universe database.`);
	var UniverseDb = new Db();
	await UniverseDb.openDb(DataSet.MFalcon.routes_db);

	winston.log(`Opening buffer database.`);
	var BufferDb = new Db();
	await BufferDb.openDb(Params.BufferDbPath);

	var pathFinder = new PathFinder(UniverseDb, DataSet.MFalcon);

	winston.log(`Checking if this universe is already explored.`);
	var cnt = (await BufferDb.selectRequest(`SELECT count(*) as cnt FROM fully_explored_universes WHERE workset_hash=?`, [WorkSetHash]))[0].cnt;
	if(cnt != 0){
		winston.log(`This universe has already been fully explored ! Stopping here this worker.`);
		process.exit();
	}

	winston.log(`Building in memory universe graph.`);
	await pathFinder.buildGraph();

	winston.log(`Pulling already found routes.`);
	var foundRoutes = await BufferDb.selectRequest(`SELECT * FROM routes WHERE workset_hash=?`, [WorkSetHash]);
	var foundRoutesMap = {};
	for(var i = 0; i < foundRoutes.length; i++)
		foundRoutesMap[foundRoutes[i].route] = true;

	winston.log(`Finding routes in this universe.`);
	await pathFinder.findRoutes(async (route) => {
		try{
			var routeStr = route.join('->');
			if(foundRoutesMap[routeStr]) return;

			winston.log(`Found a new route (${routeStr}). Saving it into buffer db.`);
			await BufferDb.insertRequest(`INSERT INTO routes (route_slug, workset_hash) VALUES (?, ?)`, [routeStr, WorkSetHash]);
		}catch(err){ winston.error(err); }
	});

	winston.log(`This universe has fully been explored !`);
	await BufferDb.insertRequest(`INSERT INTO fully_explored_universes (workset_hash) VALUES (?)`, [WorkSetHash]);
};

main();