"use strict";


const BuildGraph = require('./classes/GraphBuilder.js');
const Logger = require('./classes/Logger.js');
const PathFinder = require('./classes/PathFinder.js');
const Toolbox = new (require('./classes/Toolbox.js'))();
const Config = require('./config.json');

const HeapSizeLevel1 = process.env.HEAP_SIZE_LEVEL_1 || Config.HeapSizeLevel1 || 10;
const HeapSizeLevel2 = process.env.HEAP_SIZE_LEVEL_2 || Config.HeapSizeLevel2 || 10;
const Depth = process.env.DEPTH || Config.Depth || 50;
const MFalconConfigPath = process.env.MFALCON_CONFIG_PATH || Config.MFalconConfigPath || './dataset/live/millenium-falcon.json';
const HardTimeoutSec = process.env.HARD_TIMEOUT_SEC || Config.HardTimeoutSec || 60;
const SoftTimeoutSec = process.env.SOFT_TIMEOUT_SEC || Config.SoftTimeoutSec || 30;
const IsApiCall = (process.argv[2]) ? true : false;

const main = async function(){
	var winston = Logger(`Main`);
	try{
		winston.log('Validating given arguments are valids.')
		if(!Toolbox.areAppArgumentsValid(HeapSizeLevel1, HeapSizeLevel2, Depth, MFalconConfigPath, HardTimeoutSec, SoftTimeoutSec)){
			winston.error('Some config/env vars arn\'t valid. Fatal, killing process.');
			process.exit();
		}

		winston.log(`Retrieving Millenium Falcon attributes & Universe graph from memory (${MFalconConfigPath}).`);
		var DataSet = await Toolbox.readData(MFalconConfigPath);
		var MFalcon = DataSet.MFalcon;
		var Universe = DataSet.Universe;
		var Empire;

		if(!IsApiCall){
			winston.log(`We were called from the command line. Starting process.`);

			var empireConfigPath = MFalconConfigPath.split('/');
			delete empireConfigPath[empireConfigPath.length-1];
			empireConfigPath = `${empireConfigPath.join('/')}/empire.json`;

			winston.log(`Reading Empire intel data from file (${empireConfigPath}).`);
			Empire = require(empireConfigPath);

			if(!AreInputValids(Empire, MFalcon, Universe)){
				winston.error('FATAL => Your input (empire || millenium-falcon || universe) json are invalid ! Stopping here.');
				process.exit();
			}

			winston.log(`Building graph for given Universe.`);
			var graph = await BuildGraph(Universe, Empire.bounty_hunters);
			winston.log(`Finding out the best pathes !`);
			var pathFinder = new PathFinder(MFalcon, Empire, graph, HeapSizeLevel1, HeapSizeLevel2, Depth, SoftTimeoutSec);
			var resultArray = pathFinder.computePath();

			winston.log(`Got ${resultArray.length} results !`);
			for(var i in resultArray){
				var currRoute = resultArray[i];
				winston.log(`Route #${i} : ${currRoute.score.chanceToMakeIt}% -- ${currRoute.identifier}`);
			}
		}else{
			winston.log(`We were called from the api. Starting process.`);

			winston.log(`Safeguarding with a hard timeout of ${HardTimeoutSec} seconds.`);
			var hardTimeoutHandle = setTimeout(() => { 
				winston.log(`Hitted hard timeout of ${HardTimeoutSec} seconds. Killing instance.`);
				process.exit();
			}, HardTimeoutSec*1000);

			winston.log(`Signalling to the API that we are ready.`);
			process.once('message', empireIntel => { winston.log(`Got empire intel data.`); Empire = empireIntel; });
			process.send('ready');

			winston.log(`Setting up a timeout to avoid phantom processes, in case of api worker managemetn errors.`);
			var timeoutHandle = setTimeout(() => {
				winston.error(`Timeout waiting for ipc input from the api. Killed.`);
				process.exit();
			}, 5000);

			winston.log(`Waiting for the client empire intel.`);
			while(!Empire) await Toolbox.sleep(50);
			clearTimeout(timeoutHandle);

			if(!Toolbox.areInputsValid(Empire, MFalcon, Universe)){
				winston.error('FATAL => Your input (Empire || MFalcon || Universe) json are invalid ! Killed.');
				process.exit();
			}

			winston.log(`Got empire data ! Ready to ruuuuumble !`);

			winston.log(`Building graph for given Universe.`);
			var graph = await BuildGraph(Universe, Empire.bounty_hunters);
			var pathFinder = new PathFinder(MFalcon, Empire, graph, HeapSizeLevel1, HeapSizeLevel2, Depth, SoftTimeoutSec);
			winston.log(`Finding out the best pathes !`);
			var resultArray = pathFinder.computePath();

			winston.log(`Clearing hard timeout.`);
			clearTimeout(hardTimeoutHandle);

			winston.log(`Got ${resultArray.length} results !`);
			for(var i in resultArray){
				var currRoute = resultArray[i];
				winston.log(`Route #${i} : ${currRoute.score.chanceToMakeIt}% -- ${currRoute.identifier}`);
			}
			
			winston.log(`Sending results to api process.`);
			process.send(resultArray);

			winston.log(`Process will exit in 5 seconds.`);
			await Toolbox.sleep(5000);
		}
	}catch(err){
		console.log(err);
		process.exit();
	}		
}

main();