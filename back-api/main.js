"use strict";

const Cluster = require("cluster");
const Os = require("os");
const Logger = require('./classes/Logger.js');
const Config = require('./config.json');

if(Cluster.isMaster){
	const winston = new Logger('MasterNode-BackAPI');

	var spawnedChildsCount = 0;
	var cpuCount = Os.cpus().length;

	winston.log(`Spawning as much api worker as available cores (${cpuCount}).`);
	for(let i = 0; i < cpuCount; i++) 
		Cluster.fork();

	Object.values(Cluster.workers).forEach(worker => {
		worker.on('message', message => {
			if(message == "newSpawn") spawnedChildsCount++;
			if(message == "newDeath") spawnedChildsCount--;
			if(message == "getStatus") worker.send(spawnedChildsCount);
		});
	});

	Cluster.on("exit", (worker, code, signal) => { winston.warn(`Worker ${worker.process.pid} died.`); });
}else{
	const express = require('express');
	const bodyParser = require('body-parser');
	const { spawn } = require('child_process');
	
	const port = process.env.PORT || Config.Port || 3000;
	const maxSimultaneousComputation = process.env.MAX_SIMULTANEOUS_COMPUTATION || Config.MaxSimultaneousComputation || 10;
	const allowAllAccessControlOrigins = process.env.ALLOW_ALL_ACCESS_CONTROL_ORIGIN || Config.AllowAllAccessControlOrigins || false;
	const MaxSentRouteToClient = process.env.MAX_SENT_ROUTE_TO_CLIENT || Config.MaxSentRouteToClient || 10;

	const winston = new Logger('SlaveNode-BackAPI');

	const getSpawnedChildsCount = function(){
		return new Promise((resolve, reject) => {
			var eventReceiver = function(spawnedChildsCount){
				process.removeListener('message', eventReceiver);
				resolve(spawnedChildsCount);
			}
			process.on("message", eventReceiver);
			process.send("getStatus");
		});
	}
	const sanitizeComputeInput = function(req, res){
		if(!req.body.data){
			res.status(400);
			res.end('No parameters given !');
			return false;
		}
		if(!req.body.data.countdown){
			res.status(400);
			res.end('To compute, we need data about the empire countdown.');
			return false;
		}
		if(req.body.data.countdown){
			try{ parseInt(req.body.data.countdown); }
			catch(err){
				res.status(400);
				res.end('The given countdown isn\'t an integer !');
				return false;
			}
		}
		if(!req.body.data.bounty_hunters){
			res.status(400);
			res.end('Bounty hunters intel is necessary, even as an empty array.');
			return false;
		}
		if(req.body.data.bounty_hunters){
			if(!Array.isArray(req.body.data.bounty_hunters)){
				res.status(400);
				res.end('Bounty hunters intel is not presented as an array.');
				return false;
			}
			for(var i in req.body.data.bounty_hunters){
				if(!req.body.data.bounty_hunters[i].planet){
					res.status(400);
					res.end('Every bounty hunters intel need a planet.');
					return false;
				}
				if(!req.body.data.bounty_hunters[i].day && req.body.data.bounty_hunters[i].day != 0){
					res.status(400);
					res.end('Every bounty hunters intel need a day.');
					return false;
				}
				try{ parseInt(req.body.data.bounty_hunters[i].day); }
				catch(err){
					res.status(400);
					res.end('The day parameter of every bounty hunters intel must be given as an int.');
					return false;
				}
				if(req.body.data.bounty_hunters[i].day < 0){
					res.status(400);
					res.end('The day parameter of every bounty hunters intel must be positive.');
					return false;
				}			
				if(typeof req.body.data.bounty_hunters[i].planet != "string"){
					res.status(400);
					res.end('The planet parameter of every bounty hunters intel must be given as a string.');
					return false;
				}
				if(req.body.data.bounty_hunters[i].planet.length == 0){
					res.status(400);
					res.end('The planet parameter of every bounty hunters intel must have more than 0 character.');
					return false;
				}			
			}
		}

		var toReturn = {};

		toReturn.countdown = req.body.data.countdown;
		toReturn.bounty_hunters = [];
		for(var i in req.body.data.bounty_hunters)
			toReturn.bounty_hunters.push({
				planet: req.body.data.bounty_hunters[i].planet
				, day: req.body.data.bounty_hunters[i].day
			});

		return toReturn;
	}

	const app = express();
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({ extended: true }));
	app.use('/', express.static('public'));

	if(allowAllAccessControlOrigins)
		app.use(function(req, res, next) {
		  res.header("Access-Control-Allow-Origin", "*");
		  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
		  next();
		});

	app.post('/compute', async (req, res) => {
		try{
			winston.log(`Got a new request for computation.`);

			winston.log(`Verifying if we can handle more simultaneous computations.`);
			var spawnedChildsCount = await getSpawnedChildsCount();

			winston.log(`There is ${spawnedChildsCount} childs spawned, and the max simultaneous workers is ${maxSimultaneousComputation}`);
			if(spawnedChildsCount >= maxSimultaneousComputation){
				res.status(503);
				res.end('Server is already computing as much as it can. Please retry later.');
				return;
			}

			winston.log(`Incrementing spawn count on cluster master.`);
			process.send('newSpawn');

			winston.log(`Sanitizing input parameters.`);
			var input = sanitizeComputeInput(req, res);
			winston.log(`Given input parameters are valids.`);

			var cwd = `${__dirname}/worker/`;
			var responseSent = false;
			winston.log(`Spawning worker thread into (${cwd})`);
			var child = spawn('node', ['main.js', 'CALLFROMAPI'], { cwd: cwd, stdio: [ 'pipe', 'pipe', 'pipe', 'ipc' ] });

			var spawnLog = function(data){
				var stringed = data.toString();
				if(stringed.length > 0)	console.log(stringed);
			}
			
			child.stdout.on('data', spawnLog);
			child.stderr.on('data', spawnLog);
			child.on('close', code => { 
				winston.log(`Child process exited. Freeing slot !`); 
				process.send('newDeath');
				if(!responseSent){
					winston.error(`Child process died before sending a response to our client. Something is wrong. Closing http request.`);
					res.status(500);
					res.end('Worker process died unexpectedly. Contact admins and say them the HeapSize is too high !');
					responseSent = true;					
				}

			});
			child.on('message', function(data){
				var stringed = data.toString();
				if(stringed == 'ready'){
					winston.log(`Child is ready to compute ! Sending empire intel.`);
					child.send(input);
				}else{
					winston.log(`Got a computation result ! Found ${data.length} routes to make it safely !`);
					winston.log(`Sending the ten best routes.`);
					if(!responseSent)
						res.send(JSON.stringify(data.slice(0, MaxSentRouteToClient)));
					responseSent = true;
					child.kill();
				}
			});
		}catch(err){
			winston.log(err);
			res.status(500);
			res.end('Unexpected server error.');
		}
	});

	app.listen(port, function () {
		winston.log(`Onboard Quantum computer ready and accessible on port ${port} !`);
	});
}