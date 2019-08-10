"use strict";

module.exports = function(){
	var Logger = require('./Logger.js');
	var sqlite3 = require('sqlite3').verbose();
	var db = null;

	var winston = Logger(`DbReader`, 5);

	this.createDb = filePath => {
		return new Promise((resolve, reject) => {
			winston.log(`Creating database at ${filePath}.`);
			db = new sqlite3.Database(filePath, sqlite3.OPEN_CREATE, function(err){
				if(err){ 
					winston.error(`Error creating database at ${filePath}.`);
					reject(err);
					return;
				}
				resolve();
			});
		});
	}

	this.openDb = filePath => {
		return new Promise((resolve, reject) => {
			winston.log(`Opening database at ${filePath}.`);
			db = new sqlite3.Database(filePath, sqlite3.OPEN_READWRITE, function(err){
				if(err){ 
					winston.error(`Error opening database at ${filePath}.`);
					reject(err);
					return;
				}
				resolve();
			});
		});
	}

	this.insertRequest = (req, params) => {
		return new Promise((resolve, reject) => {
			try{
				winston.log(`Executing insert request ${(req.length <= 30) ? req : req.substring(0, 30)+'[..]'+req.substring(req.length-30)}.`);
				var statement = db.prepare(req);
				statement.run(params, err => {
					if(err){
						winston.error(`Error inserting database with request "${req}" and params "${params.join(', ')}".`);
						reject(err);
						return;
					}
					resolve();
				})
			}catch(err){ reject(err); }
		});
	}

	this.execRequest = (req) => {
		return new Promise((resolve, reject) => {
			try{
				winston.log(`Executing select request ${(req.length <= 30) ? req : req.substring(0, 30)+'[..]'+req.substring(req.length-30)}.`);
				db.all(req, function(err, rows){
					if(err){
						winston.error(`Error querying database with request "${req}" and params "${params.join(', ')}".`);
						reject(err);
						return;
					}
					resolve(rows);
				});
			}catch(err){ reject(err); }
		});
	}

	this.selectRequest = (req, params) => {
		return new Promise((resolve, reject) => {
			try{
				winston.log(`Executing select request ${(req.length <= 30) ? req : req.substring(0, 30)+'[..]'+req.substring(req.length-30)}.`);
				var statement = db.prepare(req);
				statement.all(params, function(err, rows){
					if(err){
						winston.error(`Error querying database with request "${req}" and params "${params.join(', ')}".`);
						reject(err);
						return;
					}
					resolve(rows);
				});
			}catch(err){ reject(err); }
		});
	}

	this.closeDb = filePath => {
		return new Promise((resolve, reject) => {
			winston.log(`Closing database.`);
			db.close();
			resolve();
		});
	}	
}