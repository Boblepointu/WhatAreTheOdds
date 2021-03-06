"use strict";

var DbWorker = function(){
	const Spawn = require('child_process').spawn;
	const Path = require('path');
	const AppDir = Path.dirname(require.main.filename);
	const Logger = require('./Logger.js');
	const winston = new Logger('DbWorker');
	
	var childHandler;

	var dataListener = data => { console.log(data.toString().replace(/\n$/, "")); };
	var closeListener = code => {
		winston.log(`DbWorker process exited.`);

		childHandler.stdout.removeListener('data', dataListener);
		childHandler.stderr.removeListener('data', dataListener);
		childHandler.removeListener('close', closeListener);

		winston.log(`DbWorker finished work.`);
	};

	this.spawn = () => {
		return new Promise((resolve, reject) => {
			try{
				var cwd = `${AppDir}`;
				winston.log(`Spawning db worker thread into (${cwd})`);
				childHandler = Spawn('node', ['back-db-worker.js'], { cwd: cwd, stdio: [ 'pipe', 'pipe', 'pipe', 'ipc' ] });

				childHandler.stdout.once('data', resolve);

				childHandler.stdout.on('data', dataListener);
				childHandler.stderr.on('data', dataListener);
				childHandler.on('close', closeListener);
			}catch(err){ reject(err); }
		});
	};
}

module.exports = DbWorker;