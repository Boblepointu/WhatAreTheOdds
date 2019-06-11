"use strict";

const DbReader = require('./classes/DbReader.js');
const BuildGraph = require('./classes/GraphBuilder.js');
const Logger = require('./classes/Logger.js');
const PathFinder = require('./classes/PathFinder.js');
const Config = require('./config.json');

const HeapSizeLevel1 = process.env.HEAP_SIZE_LEVEL_1 || Config.HeapSizeLevel1 || 10;
const HeapSizeLevel2 = process.env.HEAP_SIZE_LEVEL_2 || Config.HeapSizeLevel2 || 10;
const Depth = process.env.DEPTH || Config.Depth || 50;
const MFalconConfigPath = process.env.MFALCON_CONFIG_PATH || Config.MFalconConfigPath || './dataset/live/millenium-falcon.json';
const HardTimeoutSec = process.env.HARD_TIMEOUT_SEC || Config.HardTimeoutSec || 60;
const SoftTimeoutSec = process.env.SOFT_TIMEOUT_SEC || Config.SoftTimeoutSec || 30;

const AreInputValids = function(Empire, MFalcon){
	var winston = Logger(`SanitizeInputs`);
	if(!MFalcon){
		winston.error('No MFalcon parameters given !');
		return false;		
	}

	if(!MFalcon.departure){
		winston.error('No departure entry in MFalcon data !');
		return false;		
	}	

	if(!MFalcon.arrival){
		winston.error('No arrival entry in MFalcon data !');
		return false;		
	}

	if(!MFalcon.routes_db){
		winston.error('No routes_db entry in MFalcon data !');
		return false;		
	}

	if(!MFalcon.autonomy){
		winston.error('No autonomy entry in MFalcon data !');
		return false;		
	}

	if(!Empire){
		winston.error('No Empire intel given !');
		return false;
	}
	if(!Empire.countdown){
		winston.error('To compute, we need data about the empire countdown.');
		return false;
	}
	if(Empire.countdown){
		try{ parseInt(Empire.countdown); }
		catch(err){
			winston.error('The given countdown isn\'t an integer !');
			return false;
		}
	}
	if(!Empire.bounty_hunters){
		winston.error('Bounty hunters intel is necessary, even as an empty array.');
		return false;
	}
	if(Empire.bounty_hunters){
		if(!Array.isArray(Empire.bounty_hunters)){
			winston.error('Bounty hunters intel is not presented as an array.');
			return false;
		}
		for(var i in Empire.bounty_hunters){
			if(!Empire.bounty_hunters[i].planet){
				winston.error('Every bounty hunters intel need a planet.');
				return false;
			}
			if(typeof Empire.bounty_hunters[i].planet != "string"){
				winston.error('All bounty hunter planet arguments must be a string !');
				return false;
			}
			if(!Number.isInteger(Empire.bounty_hunters[i].day)){
				winston.error('All bounty hunter day arguments must be an integer !');
				return false;
			}				
			if(!Empire.bounty_hunters[i].day && Empire.bounty_hunters[i].day != 0){
				winston.error('Every bounty hunters intel need a day.');
				return false;
			}
			try{ parseInt(Empire.bounty_hunters[i].day); }
			catch(err){
				winston.error('The day parameter of every bounty hunters intel must be given as an int.');
				return false;
			}
			if(Empire.bounty_hunters[i].day < 0){
				winston.error('The day parameter of every bounty hunters intel must be positive.');
				return false;
			}			
			if(typeof Empire.bounty_hunters[i].planet != "string"){
				winston.error('The planet parameter of every bounty hunters intel must be given as a string.');
				return false;
			}
			if(Empire.bounty_hunters[i].planet.length == 0){
				winston.error('The planet parameter of every bounty hunters intel must have more than 0 character.');
				return false;
			}			
		}
	}
	return true;
}

const GetData = async function(mainPath){
	var mFalcon = require(mainPath);
	return {
		MFalcon: mFalcon,
		Universe: await (new DbReader()).readRouteEntries(mFalcon.routes_db)
	}
}

const Sleep = function(ms){
	return new Promise((resolve, reject) => {
		setTimeout(resolve, ms);
	});
}

const main = async function(){
	var winston = Logger(`Main`);
	try{
		winston.log(`Retrieving dataset '${MFalconConfigPath}'`);
		var DataSet = await GetData(MFalconConfigPath);
		var MFalcon = DataSet.MFalcon;
		var Universe = DataSet.Universe;
		var Empire;

		if(!process.argv[2]){
			var empireConfigPath = MFalconConfigPath.split('/');
			delete empireConfigPath[empireConfigPath.length-1];
			empireConfigPath = `${empireConfigPath.join('/')}/empire.json`;

			Empire = require(empireConfigPath);

			if(!AreInputValids(Empire, MFalcon)){
				winston.error('FATAL => Your input (empire || millenium-falcon) json are invalid ! Stopping here.');
				process.exit();
			}

			var graph = await BuildGraph(Universe, Empire.bounty_hunters);
			winston.log(`We were inited from the command line.`);
			var pathFinder = new PathFinder(MFalcon, Empire, graph, HeapSizeLevel1, HeapSizeLevel2, Depth, SoftTimeoutSec);
			var resultArray = pathFinder.computePath();
			//console.log(resultArray);
		}else{
			winston.log(`Safeguarding with a hard timeout of ${HardTimeoutSec} seconds.`);
			var hardTimeoutHandle = setTimeout(() => { 
				winston.log(`Hitted hard timeout of ${HardTimeoutSec} seconds. Killing instance.`);
				process.exit();
			}, HardTimeoutSec*1000);

			winston.log(`We were inited from the back api.`);
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

			if(!AreInputValids(Empire, MFalcon)){
				winston.error('FATAL => Your input (empire || millenium-falcon) json are invalid ! Stopping here.');
				process.exit();
			}

			winston.log(`Got empire data ! Ready to ruuuuumble !`);

			var graph = await BuildGraph(Universe, Empire.bounty_hunters);
			var pathFinder = new PathFinder(MFalcon, Empire, graph, HeapSizeLevel1, HeapSizeLevel2, Depth, SoftTimeoutSec);
			var resultArray = pathFinder.computePath();
			
			winston.log(`Sending results to api process.`);
			process.send(resultArray);
			clearTimeout(hardTimeoutHandle);

			winston.log(`Process will exit in 5 seconds.`);
			setInterval(process.exit, 5000);
		}
	}catch(err){
		console.log(err);
		process.exit();
	}		
}

main();