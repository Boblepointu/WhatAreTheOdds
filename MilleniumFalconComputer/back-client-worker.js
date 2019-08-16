"use strict";

const BufferDb = require('./classes/BufferDb.js');
const UniverseDb = require('./classes/UniverseDb.js');
const Logger = require('./classes/Logger.js');
const PathFinder = require('./classes/PathFinder.js');
const DbWorker = require('./classes/DbWorker.js');
const Toolbox = new (require('./classes/Toolbox.js'))();
const Path = require('path');
const AppDir = Path.dirname(require.main.filename);


const Params = Toolbox.getAppParams();
const IsApiCall = (process.argv[2]) ? true : false;

var main = async () => {
	try{
		var winston = Logger(`BackClientWorkerMain`, 1);

		winston.log(`Loading Millenium Falcon configuration from ${Params.MFalconConfigPath}.`);
		var dataSet = {};
		dataSet.MFalcon = require(Path.join(AppDir, Params.MFalconConfigPath));

		winston.log(`Generating universe db and Millenium Falcon hash.`);
		var workSetHash = await Toolbox.getWorkSetHash(dataSet.MFalcon);
		winston.log(`Db and Millenium Falcon hash is ${workSetHash}.`);

		winston.log(`Opening buffer database from ${Params.BufferDbPath}.`);
		var bufferDb = new BufferDb(Params.BufferDbPath);
		await bufferDb.open();
		await bufferDb.setWorkSetHash(workSetHash);

		if(!IsApiCall) await CliCall(dataSet, bufferDb);
		else await ApiCall(dataSet, bufferDb);

	}catch(err){ 
		console.log('FATAL---->');
		console.log(err);
		process.exit();
	}
};

var CliCall = async (dataSet, bufferDb) => {
	try{
		var winston = Logger(`BackClientWorkerMain->CLI`, 1);
		winston.log(`We were called from the command line. Starting process.`);

		var empireConfigPath = Params.MFalconConfigPath.split('/');
		delete empireConfigPath[empireConfigPath.length-1];
		empireConfigPath = `${empireConfigPath.join('/')}/empire.json`;
		winston.log(`Retrieving Empire intel from ${empireConfigPath}.`);
		dataSet.Empire = require(Path.join(AppDir, empireConfigPath));

		winston.log(`Since we were called from CLI, executing BackDbWorker.`);
		var backDbWorker = new DbWorker();
		await backDbWorker.spawn();
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
		winston.log(`BufferDb has got ${routeCount} available routes for processing. Continuing.`);

		winston.log(`Opening universe database.`);
		var universeDb = new UniverseDb(Params.UniverseWorkDbPath);
		await universeDb.open();

		winston.log(`Intialising PathFinder from ${dataSet.MFalcon.departure} to ${dataSet.MFalcon.arrival} with an autonomy of ${dataSet.MFalcon.autonomy}`);
		var pathFinder = new PathFinder();

		winston.log(`Pulling available routes from buffer db.`);
		var routes = await bufferDb.getRoutes();

		winston.log('List of available routes : ');
		for(let i = 0; i < routes.length; i++)
			winston.log(routes[i].route_slug);

		winston.log(`Finding out the best available waypoints on the ${routes.length} available routes.`);
		var routeList = [];


		for(let i = 0; i < routes.length; i++){
			let routeRes = await pathFinder.computeOptimalWaypoints(universeDb, dataSet.MFalcon, dataSet.Empire, routes[i].route_slug.split('->'));
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
		if(routeList.length == 0) winston.warn(`Found no route suitable with an empire countdown of ${dataSet.Empire.countdown}.`);
		else{
			winston.log(`Found ${routeList.length} routes suitable with an empire countdown of ${dataSet.Empire.countdown}.`);
			
			for(let i = 0; i < routeList.length; i++)
				formattedRoutesList.push(Toolbox.formatRoute(routeList[i]));
			
			for(let i = 0; i < formattedRoutesList.length; i++){
				var currRoute = formattedRoutesList[i];
				winston.log(`Route #${i} - ${currRoute.score.travelTime} days : ${currRoute.score.chanceToMakeIt}% -- ${currRoute.identifier}`);
			}
		}
	}catch(err){ throw err; }
}

var ApiCall = async (dataSet, bufferDb) => {
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
			dataSet.Empire = empireIntel;
		});
		process.send('ready');

		winston.log(`Setting up a timeout to avoid phantom processes, in case of api worker management errors.`);
		var timeoutHandle = setTimeout(() => {
			winston.error(`Timeout waiting for ipc input for empire intel from the api process. Killed.`);
			process.exit();
		}, 5000);

		winston.log(`Waiting for the client empire intel.`);
		while(!dataSet.Empire) await Toolbox.sleep(50);
		clearTimeout(timeoutHandle);

		winston.log(`Got empire data ! Ready to ruuuuumble !`);

		winston.log(`Opening universe database.`);
		var universeDb = new UniverseDb(Params.UniverseWorkDbPath);
		await universeDb.open();

		winston.log(`Intialising PathFinder from ${dataSet.MFalcon.departure} to ${dataSet.MFalcon.arrival} with an autonomy of ${dataSet.MFalcon.autonomy}`);
		var pathFinder = new PathFinder();

		winston.log(`Pulling available routes from buffer db.`);
		var routes = await bufferDb.getRoutes();

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
			let routeRes = await pathFinder.computeOptimalWaypoints(universeDb, dataSet.MFalcon, dataSet.Empire, routes[i].route_slug.split('->'));
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
		if(routeList.length == 0) winston.warn(`Found no route suitable with an empire countdown of ${dataSet.Empire.countdown}.`);
		else{
			winston.log(`Found ${routeList.length} routes suitable with an empire countdown of ${dataSet.Empire.countdown}.`);
			
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