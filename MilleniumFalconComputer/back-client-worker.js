"use strict";

const Db = require('./classes/Db.js');
const Logger = require('./classes/Logger.js');
const PathFinder = require('./classes/PathFinder.js');
const DbWorker = require('./classes/DbWorker.js');
const Toolbox = new (require('./classes/Toolbox.js'))();
const Config = require('./config.json');
const Path = require('path');
const Md5File = require('md5-file/promise');
const Md5 = require('md5');
const AppDir = Path.dirname(require.main.filename);

const HardTimeoutSec = (parseInt(process.env.HARD_TIMEOUT_SEC, 10) || process.env.HARD_TIMEOUT_SEC) || Config.HardTimeoutSec || 60;
const SoftTimeoutSec = (parseInt(process.env.SOFT_TIMEOUT_SEC, 10) || process.env.SOFT_TIMEOUT_SEC) || Config.SoftTimeoutSec || 30;
const MFalconConfigPath = process.env.MFALCON_CONFIG_PATH || Config.MFalconConfigPath || './dataset/millenium-falcon.json';
const BufferDbPath = process.env.BUFFER_DB_PATH || Config.BufferDbPath || './dataset/buffer.db';
const IsApiCall = (process.argv[2]) ? true : false;

var DataSet = {};
var BufferDb;
var DbAndMFalconConfigHash;

var main = async () => {
	try{
		var winston = Logger(`BackClientWorkerMain`, 1);

		winston.log(`Loading Millenium Falcon configuration from ${MFalconConfigPath}.`);
		DataSet.MFalcon = require(Path.join(AppDir, MFalconConfigPath));

		winston.log(`Initialising buffer database from ${BufferDbPath}.`);
		BufferDb = new Db();
		await BufferDb.openDb(BufferDbPath);

		winston.log(`Generating universe db and Millenium Falcon hash.`);
		DbAndMFalconConfigHash = await Md5File(DataSet.MFalcon.routes_db);
		DbAndMFalconConfigHash = Md5(DbAndMFalconConfigHash+JSON.stringify([DataSet.MFalcon.departure, DataSet.MFalcon.arrival, DataSet.MFalcon.autonomy]));
		winston.log(`Db and Millenium Falcon hash is ${DbAndMFalconConfigHash}.`);	

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

		var empireConfigPath = MFalconConfigPath.split('/');
		delete empireConfigPath[empireConfigPath.length-1];
		empireConfigPath = `${empireConfigPath.join('/')}/empire.json`;
		winston.log(`Retrieving Empire intel from ${empireConfigPath}.`);
		DataSet.Empire = require(Path.join(AppDir, empireConfigPath));

		winston.log(`Since we were called from CLI, executing BackDbWorker.`);
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

		winston.log(`BufferDb has got ${availableRoutes} available for processing. Continuing.`);

		winston.log(`Pulling linksMap from db.`);
		var rawLinksMap = (await BufferDb.selectRequest(`SELECT * FROM links_map WHERE db_and_mfalcon_config_md5=?`, [DbAndMFalconConfigHash]))[0].links_map;

		winston.log(`Parsing linksMap from db.`);
		var linksMap = JSON.parse(rawLinksMap);
		winston.log(`LinksMap got ${linksMap.length} entries.`);

		winston.log(`Intialising PathFinder from ${DataSet.MFalcon.departure} to ${DataSet.MFalcon.arrival} with an autonomy of ${DataSet.MFalcon.autonomy}`);
		var pathFinder = new PathFinder(DataSet.MFalcon);

		winston.log(`Pulling available routes from buffer db.`);
		var routes = await BufferDb.selectRequest(`SELECT * FROM routes WHERE db_and_mfalcon_config_md5=?`, [DbAndMFalconConfigHash]);

		winston.log('List of available routes : ');
		for(let i = 0; i < routes.length; i++)
			winston.log(routes[i].route);

		winston.log(`Finding out the best available waypoints on the ${routes.length} available routes.`);
		var routeList = [];
		for(let i = 0; i < routes.length; i++){
			let routeRes = await pathFinder.computeOptimalWaypoints(DataSet.Empire, routes[i].route.split('->'), linksMap);
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
				formattedRoutesList.push(FormatResult(routeList[i]));
			
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

		winston.log(`Safeguarding with a hard timeout of ${HardTimeoutSec} seconds.`);
		var hardTimeoutHandle = setTimeout(() => { 
			winston.log(`Hitted hard timeout of ${HardTimeoutSec} seconds. Killing instance.`);
			process.exit();
		}, HardTimeoutSec*1000);

		winston.log(`Signalling to the API that we are ready to recive empire data.`);
		process.once('message', empireIntel => { winston.log(`Got empire intel data.`); DataSet.Empire = empireIntel; });
		process.send('ready');

		winston.log(`Setting up a timeout to avoid phantom processes, in case of api worker management errors.`);
		var timeoutHandle = setTimeout(() => {
			winston.error(`Timeout waiting for ipc input from the api. Killed.`);
			process.exit();
		}, 5000);	

		winston.log(`Waiting for the client empire intel.`);
		while(!DataSet.Empire) await Toolbox.sleep(50);
		clearTimeout(timeoutHandle);

		winston.log(`Got empire data ! Ready to ruuuuumble !`);

		winston.log(`Polling BufferDb until we got a result from back db worker.`);
		var availableRoutes = 0;
		while(!availableRoutes){
			availableRoutes = (await BufferDb.selectRequest(`SELECT count(*) as cnt FROM routes WHERE db_and_mfalcon_config_md5=?`, [DbAndMFalconConfigHash]))[0].cnt;
			await Toolbox.sleep(1000);
			if(!availableRoutes)
				winston.log(`BufferDb has got no available routes for processing. Waiting...`);
		}
		winston.log(`BufferDb has got ${availableRoutes} available for processing. Continuing.`);

		winston.log(`Pulling linksMap from db.`);
		var rawLinksMap = (await BufferDb.selectRequest(`SELECT * FROM links_map WHERE db_and_mfalcon_config_md5=?`, [DbAndMFalconConfigHash]))[0].links_map;

		winston.log(`Parsing linksMap from db.`);
		var linksMap = JSON.parse(rawLinksMap);
		winston.log(`LinksMap got ${linksMap.length} entries.`);

		winston.log(`Intialising PathFinder from ${DataSet.MFalcon.departure} to ${DataSet.MFalcon.arrival} with an autonomy of ${DataSet.MFalcon.autonomy}`);
		var pathFinder = new PathFinder(DataSet.MFalcon);

		winston.log(`Pulling available routes from buffer db.`);
		var routes = await BufferDb.selectRequest(`SELECT * FROM routes WHERE db_and_mfalcon_config_md5=?`, [DbAndMFalconConfigHash]);

		winston.log('List of available routes : ');
		for(let i = 0; i < routes.length; i++)
			winston.log(routes[i].route);

		winston.log(`Finding out the best available waypoints on the ${routes.length} available routes.`);
		var routeList = [];
		for(let i = 0; i < routes.length; i++){
			let routeRes = await pathFinder.computeOptimalWaypoints(DataSet.Empire, routes[i].route.split('->'), linksMap);
			if(!routeRes) continue;

			winston.log('Found a suitable route ! Adding it and sorting resulting array.');
			routeList.push(routeRes);
			routeList.sort((rA, rB) => {
				var rALastNode = rA[rA.length-1];
				var rBLastNode = rB[rB.length-1];
				return (rALastNode.hitCount - rBLastNode.hitCount) || (rALastNode.travelTime - rBLastNode.travelTime);
			});
		}

		winston.log(`Clearing hard timeout.`);
		clearTimeout(hardTimeoutHandle);

		winston.log(`Processing finished. Formatting results for front end !`);
		var formattedRoutesList = [];
		if(routeList.length == 0) winston.warn(`Found no route suitable with an empire countdown of ${DataSet.Empire.countdown}.`);
		else{
			winston.log(`Found ${routeList.length} routes suitable with an empire countdown of ${DataSet.Empire.countdown}.`);
			
			for(let i = 0; i < routeList.length; i++)
				formattedRoutesList.push(FormatResult(routeList[i]));
			
			for(let i = 0; i < formattedRoutesList.length; i++){
				var currRoute = formattedRoutesList[i];
				winston.log(`Route #${i} - ${currRoute.score.travelTime} days : ${currRoute.score.chanceToMakeIt}% -- ${currRoute.identifier}`);
			}
		}

		winston.log(`Sending results to api process.`);
		process.send(formattedRoutesList);

		winston.log(`Process will exit in 5 seconds.`);
		await Toolbox.sleep(5000);
	}catch(err){ throw err; }
}

var FormatResult = route => {
	var formattedRoute = {
		identifier: ""
		,score: {
			travelTime: route[route.length-1].travelTime
			, chanceToMakeIt: 0
			, hitCount: route[route.length-1].hitCount
		},
		rawRoute: route
	};
	// Computing odds to make it
	var chanceToBeCaptured = 0;
	if(formattedRoute.score.hitCount != 0){
		var probaArray = [];
		for(let i = 1; i <= formattedRoute.score.hitCount; i++)
			if(i == 1) probaArray.push(0.1);
			else probaArray.push(Math.pow(9, i-1) / Math.pow(10, i));
		chanceToBeCaptured = probaArray.reduce((acc, curr) => acc+curr);
		formattedRoute.score.chanceToMakeIt = (1-chanceToBeCaptured)*100;
	}else formattedRoute.score.chanceToMakeIt = 100;

	// Generating route identifier
	var identifierArray = [];
	for(let i = 0; i < route.length; i++){
		let currStep = route[i];
		if(currStep.type == "passingBy") identifierArray.push(currStep.planet);
		if(currStep.type == "refueling") identifierArray[identifierArray.length-1] += "[R]";
		if(currStep.type == "waiting") identifierArray[identifierArray.length-1] += `[W${currStep.duration}]`;
	}
	formattedRoute.identifier = identifierArray.join('->');

	return formattedRoute;
}

main();