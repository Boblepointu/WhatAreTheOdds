"use strict";

const DbReader = require('./classes/DbReader.js');
const BuildGraph = require('./classes/GraphBuilder.js');
const Logger = require('./classes/Logger.js');
const PathFinder = require('./classes/PathFinder.js');
const Config = require('./config.json');

const HeapSizeLevel1 = process.env.HEAP_SIZE_LEVEL_1 || Config.HeapSizeLevel1 || 10;
const HeapSizeLevel2 = process.env.HEAP_SIZE_LEVEL_2 || Config.HeapSizeLevel2 || 10;
const DepthLevel2 = process.env.DEPTH_LEVEL_2 || Config.DepthLevel2 || 1000;
const DataSetName = process.env.DATASET || Config.DataSet || 'live';
const HardTimeoutSec = process.env.HARD_TIMEOUT_SEC || Config.HardTimeoutSec || 60;

const GetData = async function(testEntry){
	var mainPath = `./dataset/${testEntry}/`;
	return {
		MFalcon: require(`${mainPath}millenium-falcon.json`),
		Empire: require(`${mainPath}empire.json`),
		Universe: await (new DbReader()).readRouteEntries(`${mainPath}universe.db`)
	}
}

const Sleep = function(ms){
	return new Promise((resolve, reject) => {
		setTimeout(resolve, ms);
	});
}

const main = async function(){
	var winston = Logger(`Main`);

	winston.log(`Retrieving dataset '${DataSetName}'`);
	var DataSet = await GetData(DataSetName);
	var MFalcon = DataSet.MFalcon;
	var Empire = DataSet.Empire;
	var Universe = DataSet.Universe;

	if(!process.argv[0]){
		var graph = await BuildGraph(Universe, Empire.bounty_hunters);
		winston.log(`We were inited from the command line.`);
		var pathFinder = new PathFinder(MFalcon, Empire, graph, HeapSizeLevel1, HeapSizeLevel2, DepthLevel2);
		var resultArray = pathFinder.computePath();
		//console.log(resultArray);
	}else{
		winston.log(`Safeguarding with a hard timeout of ${HardTimeoutSec} seconds.`);
		var hardTimeoutHandle = setTimeout(() => { 
			winston.log(`Hitted hard timeout of ${HardTimeoutSec} seconds. Killing instance.`);
			process.exit();
		}, HardTimeoutSec*1000);

		winston.log(`We were inited from the back api.`);
		Empire = undefined;
		process.on('message', empireIntel => { Empire = empireIntel; });
		process.send('ready');

		var timeoutHandle = setTimeout(() => {
			winston.log(`Timeout waiting for ipc input from the api. Killed.`);
			process.exit();
		}, 5000);

		winston.log(`Waiting for the client empire intel.`);
		while(!Empire)
			await Sleep(50);
		clearTimeout(timeoutHandle);
		winston.log(`Got empire data ! Ready to ruuuuumble !`);

		var graph = await BuildGraph(Universe, Empire.bounty_hunters);
		var pathFinder = new PathFinder(MFalcon, Empire, graph, HeapSizeLevel1, HeapSizeLevel2, DepthLevel2);
		var resultArray = pathFinder.computePath();

		winston.log(`Sending results to api process.`);
		process.send(resultArray);
		clearTimeout(hardTimeoutHandle);

		winston.log(`Process will exit in 5 seconds.`);
		setTimeout(()=>{}, 5000);
	}
}

main();