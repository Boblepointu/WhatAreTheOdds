"use strict";

const Cluster = require("cluster");
const CpuCount = (require("os")).cpus().length;
const Toolbox = new (require('./classes/Toolbox.js'))();
const Logger = require('./classes/Logger.js');
const Config = require('./config.json');

const Port = (parseInt(process.env.PORT, 10) || process.env.PORT) || Config.Port || 3000;
const MaxSimultaneousComputation = (parseInt(process.env.MAX_SIMULTANEOUS_COMPUTATION, 10) || process.env.MAX_SIMULTANEOUS_COMPUTATION) 
																		|| Config.MaxSimultaneousComputation || 10;
const AllowAllAccessControlOrigins = (parseInt(process.env.ALLOW_ALL_ACCESS_CONTROL_ORIGIN, 10) || process.env.ALLOW_ALL_ACCESS_CONTROL_ORIGIN) 
																		|| Config.AllowAllAccessControlOrigins || false;
const MaxSentRouteToClient = (parseInt(process.env.MAX_SENT_ROUTE_TO_CLIENT, 10) || process.env.MAX_SENT_ROUTE_TO_CLIENT)
																		|| Config.MaxSentRouteToClient || 10;

if(Cluster.isMaster){
	const winston = new Logger('BackApiMasterNode');

	var spawnedChildsCount = 0;

	winston.log(`Spawning as much api worker as available cores (${CpuCount}).`);
	for(let i = 0; i < CpuCount; i++) Cluster.fork();

	winston.log(`Adding listeners to keep track of total spawned workers.`);
	Object.values(Cluster.workers).forEach(worker => {
		worker.on('message', message => {
			if(message == "newSpawn") spawnedChildsCount++;
			if(message == "newDeath") spawnedChildsCount--;
			if(message == "getStatus") worker.send(spawnedChildsCount);
		});
	});

	Cluster.on("exit", (worker, code, signal) => { winston.warn(`Worker ${worker.process.pid} died.`); });
}else{
	const Express = require('express');
	const App = Express();
	const BodyParser = require('body-parser');
	const ClientWorker = require('./classes/ClientWorker.js');

	const winston = new Logger('BackApiSlaveNode');

	winston.log(`Adding body parsing capabilities to express.`);
	App.use(BodyParser.json());
	App.use(BodyParser.urlencoded({ extended: true }));

	winston.log(`Serving frontend folder.`);
	App.use('/', Express.static('public'));

	if(AllowAllAccessControlOrigins){
		winston.log(`Allowing access control origin for anybody.`);
		App.use((req, res, next) => {
		  res.header("Access-Control-Allow-Origin", "*");
		  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
		  next();
		});
	}

	var getSpawnedChildsCount = () => {
		return new Promise((resolve, reject) => {
			var eventReceiver = spawnedChildsCount => resolve(spawnedChildsCount);
			process.once("message", eventReceiver);
			process.send("getStatus");
		});
	};

	App.post('/compute', async (req, res) => {
		try{
			winston.log(`Got a new request for computation.`);

			var Empire = req.body.data;

			winston.log(`Verifying if we can handle more simultaneous computations.`);
			var spawnedChildsCount = await getSpawnedChildsCount();

			winston.log(`There is ${spawnedChildsCount} childs spawned, and the max simultaneous workers is ${MaxSimultaneousComputation}`);
			if(spawnedChildsCount >= MaxSimultaneousComputation){
				winston.warn(`Refused a request for compute; worker count of ${MaxSimultaneousComputation} limit apply.`);
				res.status(503);
				res.end('Server is already computing as much as it can. Please retry later.');
				return;
			}

			winston.log(`Validating empire intel inputs.`);
			try{ await Toolbox.areEmpireIntelValid(Empire); }
			catch(err){
				winston.error(err);
				res.status(500);
				res.end(err.toString());
				return;
			}

			winston.log(`Given empire input parameters are valids.`);

			winston.log(`Sanitizing input parameters.`);
			Empire = Toolbox.sanitizeEmpireIntel(Empire);

			var worker;

			var onError = err => {
				winston.error('Worker died prematurily.');
				res.status(500);
				res.end(err);
				worker.removeListener('error', onError);
				worker.removeListener('done', onDone);
				winston.log(`Decrementing cluster worker count.`);
				process.send('newDeath');
			};
			var onDone = routes => { 
				winston.log(`Sending the ${MaxSentRouteToClient} best routes.`);
				res.end(JSON.stringify(routes.slice(0, MaxSentRouteToClient)));
				worker.removeListener('error', onError);
				worker.removeListener('done', onDone);
				winston.log(`Decrementing cluster worker count.`);
				process.send('newDeath');
			};

			worker = new ClientWorker(onError, onDone);
			await worker.spawn(Empire);
			
			winston.log(`Incrementing cluster worker count.`);
			process.send('newSpawn');
		}catch(err){
			winston.error(err);
			res.status(500);
			res.end('Unexpected error.');
		}
	});

	App.listen(Port, () => { winston.log(`Onboard Quantum computer ready and accessible on port ${Port} !`); });
}