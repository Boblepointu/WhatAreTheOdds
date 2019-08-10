var ClientWorker = function(onError, onDone){
	const Spawn = require('child_process').spawn;
	const Path = require('path');
	const AppDir = Path.dirname(require.main.filename);
	const Logger = require('./Logger.js');
	const winston = new Logger('ClientWorker');
	
	var childHandler;
	var Empire;
	var computationFinished = false;

	var dataListener = data => { console.log(data.toString().replace(/\n$/, "")); };
	var closeListener = code => {
		winston.log(`Child process exited.`);

		childHandler.stdout.removeListener('data', dataListener);
		childHandler.stderr.removeListener('data', dataListener);
		childHandler.removeListener('close', dataListener);
		childHandler.removeListener('message', resultListener);

		if(!computationFinished){
			var err = `Child process died before sending a computation result. Something is wrong.`;
			winston.error(err);
			this.emit('error', err);
		}else winston.log(`Child finished work.`);
	};
	var resultListener = data => {
		winston.log(`Got a computation result ! Found ${data.length} routes to make it (relatively) safely !`);
		computationFinished = true;
		childHandler.kill();
		this.emit('done', data);
	};

	winston.log(`Binding given listeners for error and done.`);
	this.on('error', onError);
	this.on('done', onDone);

	this.spawn = empire => {
		return new Promise((resolve, reject) => {
			try{
				Empire = empire;

				var cwd = `${AppDir}`;
				winston.log(`Spawning worker thread into (${cwd})`);
				childHandler = Spawn('node', ['back-client-worker.js', 'CALLFROMAPI'], { cwd: cwd, stdio: [ 'pipe', 'pipe', 'pipe', 'ipc' ] });

				childHandler.stdout.on('data', dataListener);
				childHandler.stderr.on('data', dataListener);
				childHandler.on('close', closeListener);
				childHandler.once('message', data => {
					if(data.toString() == 'ready'){
						winston.log(`Child is ready to compute ! Sending empire intel and begin computation.`);
						childHandler.send(Empire);
						resolve();
						childHandler.once('message', resultListener);
					}else{
						winston.error(`Child didn't initialise correctly ! Force closing.`);
						childHandler.kill();
						reject();
					}
				});
			}catch(err){ reject(err); }
		});
	};
}

const Util = require('util');
const EventEmitter = require('events').EventEmitter;

Util.inherits(ClientWorker, EventEmitter);

module.exports = ClientWorker;