"use strict";

module.exports = function(){
	var Logger = require('./Logger.js');
	var sqlite3 = require('sqlite3').verbose();
	var db = null;
	var self = this;

	this.winston = Logger(`DbReader`);

	var openDb = function(filePath){
		return new Promise((resolve, reject) => {
			self.winston.log(`Opening database at ${filePath}.`);
			db = new sqlite3.Database(filePath, sqlite3.OPEN_READONLY, function(err){
				if(err){ 
					self.winston.error(`Error opening database at ${filePath}.`);
					reject(err);
					return;
				}
				resolve();
			});
		});
	}

	this.readRouteEntries = function(filePath){
		return new Promise(async function(resolve, reject){
			try{ await openDb(filePath); }catch(err){ reject(err); return; }
			var req = 'SELECT * from routes';
			self.winston.log(`Reading entries in routes table with '${req}' request.`);
			db.all(req, {}, function(err, routeRows){
				if(err){
					self.winston.error(`Error querying routes entries with '${req}' request.`);
					reject(err); 
					return;
				}
				resolve(routeRows);
				self.winston.log(`Closing database at ${filePath}.`);
				db.close(err => { if(err) self.winston.error('Error closing database. Continue anyway.'); });
			});
		});
	}
}