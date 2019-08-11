"use strict";

module.exports = function(){
	var Logger = require('./Logger.js');
	//var sqlite3 = require('sqlite3').verbose();
	var sqlite3 = require('better-sqlite3');
	var db = null;
	var verbose = null;
	//var verbose = console.log;

	var winston = Logger(`DbReader`, 5);

	this.createDb = filePath => {
		return new Promise((resolve, reject) => {
			winston.log(`Creating database at ${filePath}.`);
			try{
				db = new sqlite3(filePath, { verbose: verbose });
				db.close();
				resolve();
			}catch(err){
				winston.error(`Error creating database at ${filePath}.`);
				reject(err);
			}
		});
	}

	this.openDb = filePath => {
		return new Promise((resolve, reject) => {
			winston.log(`Creating database at ${filePath}.`);
			try{
				db = new sqlite3(filePath, { verbose: verbose, fileMustExist: true });
				resolve();
			}catch(err){
				winston.error(`Error opening database at ${filePath}.`);
				reject(err);
			}
		});
	}

	this.insertRequest = (req, params) => {
		return new Promise((resolve, reject) => {
			try{
				winston.log(`Executing insert request ${(req.length <= 30) ? req : req.substring(0, 30)+'[..]'+req.substring(req.length-30)}.`);
				var statement = db.prepare(req);

				(db.transaction(() => {
					try{
						statement.run(params);
						resolve();
					}catch(err){
						winston.error(`Error inserting database with request "${req}" and params "${params.join(', ')}".`);
						reject(err);
					}
				}))();
			}catch(err){ reject(err); }
		});
	}

	this.execMultipleRequest = req => {
		return new Promise((resolve, reject) => {
			try{
				winston.log(`Executing multiple requests ${(req.length <= 30) ? req : req.substring(0, 30)+'[..]'+req.substring(req.length-30)}.`);
				db.exec(req);
				resolve();
			}catch(err){
				winston.error(`Error querying database with request "${req}".`);
				reject(err);
			}
		});
	}

	this.execRequest = (req, params) => {
		return new Promise((resolve, reject) => {
			try{
				winston.log(`Executing select request ${(req.length <= 30) ? req : req.substring(0, 30)+'[..]'+req.substring(req.length-30)}.`);
				var statement = db.prepare(req);
				var results = statement.all(params);
				resolve(results);
			}catch(err){
				winston.error(`Error querying database with request "${req}" and params "${params.join(', ')}".`);
				reject(err);
			}
		});
	}

	this.selectRequest = (req, params) => {
		return new Promise((resolve, reject) => {
			try{
				winston.log(`Executing select request ${(req.length <= 30) ? req : req.substring(0, 30)+'[..]'+req.substring(req.length-30)}.`);
				var statement = db.prepare(req);
				var results = statement.all(params);
				resolve(results);
			}catch(err){
				winston.error(`Error querying database with request "${req}" and params "${params.join(', ')}".`);
				reject(err);
			}
		});
	}

	this.closeDb = filePath => {
		return new Promise((resolve, reject) => {
			try{
				winston.log(`Closing database.`);
				db.close();
				resolve();
			}catch(err){
				winston.error(`Error closing database.`)
				reject(err);
			}
		});
	}	
}