"use strict";

var ApiWorker = function(){
	const Spawn = require('child_process').spawn;
	const Path = require('path');
	const AppDir = Path.dirname(require.main.filename);
	const Logger = require('./Logger.js');
	const winston = new Logger('ApiWorker');
	
	var childHandler;

	var dataListener = data => { console.log(data.toString().replace(/\n$/, "")); };
	var closeListener = code => {
		winston.log(`ApiWorker process exited.`);

		childHandler.stdout.removeListener('data', dataListener);
		childHandler.stderr.removeListener('data', dataListener);
		childHandler.removeListener('close', closeListener);

		winston.log(`ApiWorker finished work.`);
	};

	this.spawn = () => {
		return new Promise((resolve, reject) => {
			try{
				winston.log(`Spawning api worker thread into (${AppDir})`);
				childHandler = Spawn('node', ['back-api-worker.js'], { cwd: AppDir, stdio: [ 'pipe', 'pipe', 'pipe', 'ipc' ] });

				childHandler.stdout.once('data', resolve);

				childHandler.stdout.on('data', dataListener);
				childHandler.stderr.on('data', dataListener);
				childHandler.on('close', closeListener);
			}catch(err){ reject(err); }
		});
	};
}

module.exports = ApiWorker;