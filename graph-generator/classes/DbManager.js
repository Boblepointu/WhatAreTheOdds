"use strict";

module.exports = function(){
	var Logger = require('./Logger.js');
	var sqlite3 = require('sqlite3').verbose();
	var db = null;
	var self = this;

	this.winston = Logger(`DbReader`);

	this.createDb = function(filePath){
		return new Promise((resolve, reject) => {
			self.winston.log(`Creating database at ${filePath}.`);
			db = new sqlite3.Database(filePath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, function(err){
				if(err){ 
					self.winston.error(`Error opening database at ${filePath}.`);
					reject(err);
					return;
				}
				resolve();
			});
		});
	}

	this.createRouteTable = function(){
		return new Promise((resolve, reject) => {
			db.run("CREATE TABLE routes (origin TEXT, destination TEXT, travel_time INTEGER)", function(err){
				if(err){ 
					self.winston.error(`Error creating routes table.`);
					reject(err);
					return;
				}
				resolve();
			});
		});
	}

	this.removeRouteTable = function(){
		return new Promise((resolve, reject) => {
			db.run("DROP TABLE routes", function(err){
				if(err){ 
					self.winston.error(`Error deleting routes table.`);
					reject(err);
					return;
				}
				resolve();
			});
		});
	}

	this.insertRoute = function(route){
		return new Promise((resolve, reject) => {
			db.run(`INSERT INTO routes VALUES ("${route.origin}", "${route.destination}", "${route.travelTime}")`, function(err){
				if(err){ 
					self.winston.error(`Error inserting new route.`);
					reject(err);
					return;
				}
				resolve();
			});
		});
	}

	this.insertRoutesBatch = function(routeArray){
		return new Promise((resolve, reject) => {
			db.serialize(function() {
				db.run("begin transaction");
				//var stmt = db.prepare("insert into routes values (?, ?, ?)");

				for(var i in routeArray){
					var stmt = db.prepare("insert into routes values (?, ?, ?)");
					stmt.run(routeArray[i].origin, routeArray[i].destination, routeArray[i].travelTime);
					stmt.finalize();
				}

				db.run("commit", function(err){
					if(err){ 
						self.winston.error(`Error inserting new route.`);
						reject(err);
						return;
					}
					resolve();
				});
			});
		});
	}	
}