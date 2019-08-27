"use strict";

module.exports = function(DbPath){
	var Db = require('./Db.js');
	var Logger = require('./Logger.js');
	var winston = Logger(`UniverseDb`, 4);

	var db;

	this.open = async () => {
		winston.log(`Opening universe database at ${DbPath}.`);
		db = new Db();
		await db.openDb(DbPath);
	}

	this.getTravelTimes = async (from, to) => {
		winston.log(`Getting travel times from ${from} to ${to}.`);
		var tTimesO = await db.selectRequest(`SELECT travel_time FROM routes WHERE (origin=? AND destination=?) OR (origin=? AND destination=?) ORDER BY travel_time ASC`, [from, to, to, from]);
		return tTimesO.map(row => row.travel_time);
	}

	this.markPulledFromIds = async ids => {
		winston.log(`Updating links containing ids as pulled.`);
		let idsStr = `"${ids.join('","')}"`;
		await db.updateRequest(`UPDATE routes SET pulled=1 WHERE id IN (${idsStr})`);
	}

	this.getNotPulledLinksWithPlanets = async planets => {
		winston.log(`Querying links containing planets.`);
		let planetsStr = `"${planets.join('","')}"`;
		return (await db.selectRequest(
			`SELECT * FROM routes 
				WHERE (destination IN (${planetsStr}) OR origin IN (${planetsStr})) AND pulled=0`));
	}

	this.getLinksWithPlanets = async planets => {
		winston.log(`Querying links containing planets.`);
		let planetsStr = `"${planets.join('","')}"`;
		return (await db.selectRequest(
			`SELECT * FROM routes 
				WHERE destination IN (${planetsStr}) OR origin IN (${planetsStr})`));
	}

	this.getLinksWithPlanet = async (planet, maxTravelTime) => {
		winston.log(`Querying links containing planet ${planet}.`);
		return (await db.selectRequest(
			`SELECT * FROM routes 
				WHERE (destination=? OR origin=?) AND travel_time<=?`, [planet, planet, maxTravelTime]));
	}

	this.getNextLinks = async (route, from) => {
		winston.log(`Querying next possible links for route ${route.join('->')}, from ${from}.`);

		var wrkRoute = route.slice(0);
		wrkRoute.splice(wrkRoute.indexOf(from));
		wrkRoute.push(route[route.indexOf(from)+1]);

		var wrkRouteStr = "(";
		wrkRoute.forEach(planet => wrkRouteStr+=`'${planet}',`);
		wrkRouteStr = wrkRouteStr.substring(0, wrkRouteStr.length-1);
		wrkRouteStr+=")";
		var loopLinks = (await db.selectRequest(
			`SELECT * FROM routes 
				WHERE 
					(destination=? AND origin IN ${wrkRouteStr}) 
					OR 
					(origin=? AND destination IN ${wrkRouteStr})`, [from, from]));
		var curatedLoopLinks = loopLinks.map(link => {
			let result = [];
			link.origin != from ? result[0] = link.origin : 0;
			link.destination != from ? result[0] = link.destination : 0;
			result[1] = link.travel_time;
			result[2] = (route[route.indexOf(from)+1] == result[0]) ? false : true;
			return result;
		});

		return curatedLoopLinks;
	}	

	this.getLinksCount = async () => {
		winston.log(`Querying links count.`);
		return (await db.selectRequest(`SELECT count(*) as cnt FROM routes`))[0].cnt;
	}	

	this.prepareForExploitation = async () => {
		winston.log(`Adding a primary key to routes table.`);
		await db.execMultipleRequest(`
			BEGIN TRANSACTION;
				CREATE TABLE "routes_tmp" (
					"id"	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
					"origin"	TEXT NOT NULL,
					"destination"	TEXT NOT NULL,
					"travel_time"	INTEGER NOT NULL,
					"pulled"	BOOLEAN NOT NULL DEFAULT 0
				);
				INSERT INTO routes_tmp (origin, destination, travel_time) 
					SELECT origin, destination, travel_time FROM routes;
				DROP TABLE routes;
				ALTER TABLE routes_tmp RENAME TO routes;
				CREATE INDEX IF NOT EXISTS "routes_origin_index" ON "routes" ("origin");
				CREATE INDEX IF NOT EXISTS "routes_destination_index" ON "routes" ("destination");
			COMMIT;
		`);
	}

	this.close = async () => {
		winston.log(`Closing universe database at ${DbPath}.`);
		await db.closeDb();
	}
}