"use strict";

const Db = require('./classes/Db.js');
const Logger = require('./classes/Logger.js');
const PathFinder = require('./classes/PathFinder.js');
const DbWorker = require('./classes/DbWorker.js');
const Toolbox = new (require('./classes/Toolbox.js'))();
const Path = require('path');
const AppDir = Path.dirname(require.main.filename);


const Params = Toolbox.getAppParams();
const IsApiCall = (process.argv[2]) ? true : false;

var DataSet = {};
var BufferDb;
var WorkSetHash;

var main = async () => {
	try{
		var winston = Logger(`BackClientWorkerMain`, 1);

		winston.log(`Loading Millenium Falcon configuration from ${Params.MFalconConfigPath}.`);
		DataSet.MFalcon = require(Path.join(AppDir, Params.MFalconConfigPath));

		winston.log(`Initialising buffer database from ${Params.BufferDbPath}.`);
		BufferDb = new Db();
		await BufferDb.openDb(Params.BufferDbPath);

		winston.log(`Generating universe db and Millenium Falcon hash.`);
		WorkSetHash = await Toolbox.getWorkSetHash(DataSet.MFalcon);
		winston.log(`Db and Millenium Falcon hash is ${WorkSetHash}.`);	

		if(!IsApiCall) await CliCall();
		else await ApiCall();

	}catch(err){ 
		console.log('FATAL---->');
		console.log(err);
		process.exit();
	}
};

var CliCall = async () => {
	try{
		var winston = Logger(`BackClientWorkerMain->CLI`, 1);
		winston.log(`We were called from the command line. Starting process.`);

		var empireConfigPath = Params.MFalconConfigPath.split('/');
		delete empireConfigPath[empireConfigPath.length-1];
		empireConfigPath = `${empireConfigPath.join('/')}/empire.json`;
		winston.log(`Retrieving Empire intel from ${empireConfigPath}.`);
		DataSet.Empire = require(Path.join(AppDir, empireConfigPath));

		winston.log(`Since we were called from CLI, executing BackDbWorker.`);
		var backDbWorker = new DbWorker();
		await backDbWorker.spawn();
		winston.log(`BackDbWorker spawned.`);

		winston.log(`Polling BufferDb until we got a result from back db worker.`);
		var availableRoutes = 0;
		while(!availableRoutes){
			availableRoutes = (await BufferDb.selectRequest(`SELECT count(*) as cnt FROM routes WHERE workset_hash=?`, [WorkSetHash]))[0].cnt;
			var isUniverseValid = await BufferDb.selectRequest(`SELECT * FROM fully_explored_universes WHERE workset_hash=?`, [WorkSetHash]);
			if(isUniverseValid.length && !isUniverseValid[0].travelable){
				winston.error(`This universe is marked as untravelable. Nothing will be found whatever empire data you'll pass. Exiting !`);
				process.exit();
			}
			if(!availableRoutes)
				await Toolbox.sleep(1000);
		}
		winston.log(`BufferDb has got ${availableRoutes} available routes for processing. Continuing.`);

		winston.log(`Opening universe database.`);
		var UniverseDb = new Db();
		await UniverseDb.openDb(DataSet.MFalcon.routes_db);

		winston.log(`Intialising PathFinder from ${DataSet.MFalcon.departure} to ${DataSet.MFalcon.arrival} with an autonomy of ${DataSet.MFalcon.autonomy}`);
		var pathFinder = new PathFinder(UniverseDb, DataSet.MFalcon);

		winston.log(`Pulling available routes from buffer db.`);
		var routes = await BufferDb.selectRequest(`SELECT * FROM routes WHERE workset_hash=?`, [WorkSetHash]);

		winston.log('List of available routes : ');
		for(let i = 0; i < routes.length; i++)
			winston.log(routes[i].route_slug);

		winston.log(`Finding out the best available waypoints on the ${routes.length} available routes.`);
		var routeList = [];
		for(let i = 0; i < routes.length; i++){
			let routeRes = await pathFinder.computeOptimalWaypoints(DataSet.Empire, routes[i].route_slug.split('->'));
			if(!routeRes) continue;

			winston.log('Found a suitable route ! Adding it and sorting resulting array.');
			routeList.push(routeRes);
			routeList.sort((rA, rB) => {
				var rALastNode = rA[rA.length-1];
				var rBLastNode = rB[rB.length-1];
				return (rALastNode.hitCount - rBLastNode.hitCount) || (rALastNode.travelTime - rBLastNode.travelTime);
			});
		}

		winston.log(`Processing finished. Formatting results for front end !`);
		var formattedRoutesList = [];
		if(routeList.length == 0) winston.warn(`Found no route suitable with an empire countdown of ${DataSet.Empire.countdown}.`);
		else{
			winston.log(`Found ${routeList.length} routes suitable with an empire countdown of ${DataSet.Empire.countdown}.`);
			
			for(let i = 0; i < routeList.length; i++)
				formattedRoutesList.push(Toolbox.formatRoute(routeList[i]));
			
			for(let i = 0; i < formattedRoutesList.length; i++){
				var currRoute = formattedRoutesList[i];
				winston.log(`Route #${i} - ${currRoute.score.travelTime} days : ${currRoute.score.chanceToMakeIt}% -- ${currRoute.identifier}`);
			}
		}
	}catch(err){ throw err; }
}

var ApiCall = async () => {
	try{
		var winston = Logger(`BackClientWorkerMain->API`, 1);
		winston.log(`We were called from the api. Starting process.`);

		winston.log(`Safeguarding with a hard timeout of ${Params.HardTimeoutSec} seconds.`);
		var hardTimeoutHandle = setTimeout(() => { 
			winston.error(`Hitted hard timeout of ${Params.HardTimeoutSec} seconds. Killing instance.`);
			process.exit();
		}, Params.HardTimeoutSec*1000);

		winston.log(`Signalling to the API that we are ready to receive empire data.`);
		process.once('message', empireIntel => { 
			winston.log(`Got empire intel data.`); 
			DataSet.Empire = empireIntel;
		});
		process.send('ready');

		winston.log(`Setting up a timeout to avoid phantom processes, in case of api worker management errors.`);
		var timeoutHandle = setTimeout(() => {
			winston.error(`Timeout waiting for ipc input for empire intel from the api process. Killed.`);
			process.exit();
		}, 5000);

		winston.log(`Waiting for the client empire intel.`);
		while(!DataSet.Empire) await Toolbox.sleep(50);
		clearTimeout(timeoutHandle);

		winston.log(`Got empire data ! Ready to ruuuuumble !`);

		winston.log(`Polling BufferDb until we got a result from back db worker.`);
		var availableRoutes = 0;
		while(!availableRoutes){
			availableRoutes = (await BufferDb.selectRequest(`SELECT count(*) as cnt FROM routes WHERE workset_hash=?`, [WorkSetHash]))[0].cnt;
			if(!availableRoutes){
				await Toolbox.sleep(1000);
				winston.log(`BufferDb has got no available routes for processing. Waiting...`);
			}
		}
		winston.log(`BufferDb has got ${availableRoutes} available routes for processing. Continuing.`);

		winston.log(`Opening universe database.`);
		var UniverseDb = new Db();
		await UniverseDb.openDb(DataSet.MFalcon.routes_db);

		winston.log(`Intialising PathFinder from ${DataSet.MFalcon.departure} to ${DataSet.MFalcon.arrival} with an autonomy of ${DataSet.MFalcon.autonomy}`);
		var pathFinder = new PathFinder(UniverseDb, DataSet.MFalcon);

		winston.log(`Pulling available routes from buffer db.`);
		var routes = await BufferDb.selectRequest(`SELECT * FROM routes WHERE workset_hash=?`, [WorkSetHash]);

		winston.log('List of available routes : ');
		for(let i = 0; i < routes.length; i++)
			winston.log(routes[i].route_slug);


		winston.log(`Safeguarding with a soft timeout of ${Params.SoftTimeoutSec} seconds.`);
		var softTimeoutReached = false;
		var softTimeoutHandle = setTimeout(() => { 
			winston.log(`Hitted soft timeout of ${Params.SoftTimeoutSec} seconds. Finishing current compute and returning what we got.`);
			softTimeoutReached = true;
		}, Params.SoftTimeoutSec*1000);
		winston.log(`Finding out the best available waypoints on the ${routes.length} available routes.`);
		var routeList = [];
		for(let i = 0; i < routes.length; i++){
			let routeRes = await pathFinder.computeOptimalWaypoints(DataSet.Empire, routes[i].route_slug.split('->'));
			if(!routeRes) continue;

			winston.log('Found a suitable route ! Adding it and sorting resulting array.');
			routeList.push(routeRes);
			routeList.sort((rA, rB) => {
				var rALastNode = rA[rA.length-1];
				var rBLastNode = rB[rB.length-1];
				return (rALastNode.hitCount - rBLastNode.hitCount) || (rALastNode.travelTime - rBLastNode.travelTime);
			});
			if(softTimeoutReached) break;
		}

		winston.log(`Clearing soft timeout.`);
		clearTimeout(softTimeoutHandle);
		winston.log(`Clearing hard timeout.`);
		clearTimeout(hardTimeoutHandle);

		winston.log(`Processing finished. Formatting results for front end !`);
		var formattedRoutesList = [];
		if(routeList.length == 0) winston.warn(`Found no route suitable with an empire countdown of ${DataSet.Empire.countdown}.`);
		else{
			winston.log(`Found ${routeList.length} routes suitable with an empire countdown of ${DataSet.Empire.countdown}.`);
			
			for(let i = 0; i < routeList.length; i++)
				formattedRoutesList.push(Toolbox.formatRoute(routeList[i]));
			
			for(let i = 0; i < formattedRoutesList.length; i++){
				var currRoute = formattedRoutesList[i];
				winston.log(`Route #${i} - ${currRoute.score.travelTime} days : ${currRoute.score.chanceToMakeIt}% -- ${currRoute.identifier}`);
			}
		}

		winston.log(`Sending results to api process.`);
		process.send(formattedRoutesList);

		winston.log(`Process will exit in 5 seconds (arbitrary time to let the time to send the computed data to api process via ipc).`);
		await Toolbox.sleep(5000);
	}catch(err){ throw err; }
}

main();