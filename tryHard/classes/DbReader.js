"use strict";

module.exports = function(){
	var Logger = require('./Logger.js');
	var sqlite3 = require('sqlite3').verbose();
	var db = null;

	this.winston = Logger(`DbReader`, 5);

	this.openDb = filePath => {
		return new Promise((resolve, reject) => {
			this.winston.log(`Opening database at ${filePath}.`);
			db = new sqlite3.Database(filePath, sqlite3.OPEN_READONLY, function(err){
				if(err){ 
					this.winston.error(`Error opening database at ${filePath}.`);
					reject(err);
					return;
				}
				resolve();
			});
		});
	}

	this.execRequest = sqlRequest => {
		return new Promise((resolve, reject) => {
			try{
				this.winston.log(`Executing request ${(sqlRequest.length <= 30) ? sqlRequest : sqlRequest.substring(0, 30)+'[..]'+sqlRequest.substring(sqlRequest.length-30)}.`);
				db.all(sqlRequest, {}, function(err, rows){
					if(err){
						this.winston.error(`Error querying database with request "${sqlRequest}".`);
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
			this.winston.log(`Closing database.`);
			db.close();
			resolve();
		});
	}	
}