"use strict";

module.exports = function(DbPath){
	var Fs = require('fs');
	var Db = require('./Db.js');
	var Logger = require('./Logger.js');
	var winston = Logger(`BufferDb`, 4);

	var db;
	var worksetHashId;

	this.open = async () => {
		winston.log(`Opening buffer database at ${DbPath}.`);
		db = new Db();
		// Creating, opening, populating BufferDb if not existing
		if(!Fs.existsSync(DbPath)){
			winston.log(`BufferDb does not exist. Creating and populating.`)
			await db.createDb(DbPath);
			await db.openDb(DbPath);
			await db.execMultipleRequest(`
				BEGIN TRANSACTION;
				CREATE TABLE IF NOT EXISTS "routes" (
					"id"	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
					"route_slug"	TEXT NOT NULL,
					"workset_hash_id"	INTEGER NOT NULL,
					FOREIGN KEY("workset_hash_id") REFERENCES "workset_hashs"("id")
				);
				CREATE TABLE IF NOT EXISTS "routes_queues" (
					"id"	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
					"route_slug"	TEXT NOT NULL,
					"route_hop_count"	INTEGER NOT NULL,
					"last_planet_id"	INTEGER NOT NULL,
					"workset_hash_id"	INTEGER NOT NULL,
					FOREIGN KEY("workset_hash_id") REFERENCES "workset_hashs"("id"),
					FOREIGN KEY("last_planet_id") REFERENCES "planets_hops"("id")
				);
				CREATE INDEX IF NOT EXISTS "routes_queues_route_slug_index" ON "routes_queues" ("route_slug");
				CREATE INDEX IF NOT EXISTS "routes_queues_route_hop_count_index" ON "routes_queues" ("route_hop_count");
				CREATE TABLE IF NOT EXISTS "planets_hops" (
					"id"	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
					"planet"	TEXT NOT NULL,
					"hops_to_destination"	INTEGER NOT NULL,
					"workset_hash_id"	INTEGER NOT NULL,
					FOREIGN KEY("workset_hash_id") REFERENCES "workset_hashs"("id")
				);
				CREATE INDEX IF NOT EXISTS "planets_hops_planet_index" ON "planets_hops" ("planet");
				CREATE TABLE IF NOT EXISTS "workset_status" (
					"precomputed"	BOOLEAN NOT NULL,
					"explored"	BOOLEAN NOT NULL,
					"travelable"	BOOLEAN NOT NULL,
					"workset_hash_id"	INTEGER NOT NULL UNIQUE,
					FOREIGN KEY("workset_hash_id") REFERENCES "workset_hashs"("id")
				);
				CREATE TABLE IF NOT EXISTS "workset_hashs" (
					"id"	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
					"workset_hash"	TEXT NOT NULL
				);
				COMMIT;				
			`);
		}else await db.openDb(DbPath);
	}

	this.setWorkSetHash = async WorkSetHash => {
		winston.log(`Setting workset hash for this instance to ${WorkSetHash}.`);
		var workSetHashExist = (await db.selectRequest(
				`SELECT count(*) as cnt FROM workset_hashs WHERE workset_hash=?`, [WorkSetHash]))[0].cnt;
		if(!workSetHashExist) await db.insertRequest(`INSERT INTO workset_hashs(workset_hash) VALUES (?)`, [WorkSetHash]);
		worksetHashId = (await db.selectRequest(`SELECT id FROM workset_hashs WHERE workset_hash=?`, [WorkSetHash]))[0].id
	}

	this.addRoutesToQueue = async routes => {
		winston.log(`Inserting ${routes.length} new routes to queue.`);
		var routesValues = [];

		for(let i = 0; i < routes.length; i++){
			let lastPlanet = routes[i][routes[i].length-1];
			let routeSlug = routes[i].join('->');
			let routeHopCount = routes[i].length;
			let cnt = (await db.selectRequest(`SELECT count(*) as cnt FROM routes_queues WHERE route_slug=? AND workset_hash_id=?`, [routeSlug, worksetHashId]))[0].cnt;
			if(cnt) continue;
			let lastPlanetId = (await db.selectRequest(`SELECT id FROM planets_hops WHERE planet=? AND workset_hash_id=?`, [lastPlanet, worksetHashId]))[0].id;
			routesValues.push(`("${routeSlug}", ${routeHopCount}, ${lastPlanetId}, ${worksetHashId})`);
		}
		if(routesValues.length)
			await db.insertRequest(`INSERT INTO routes_queues (route_slug, route_hop_count, last_planet_id, workset_hash_id) VALUES ${routesValues.join(',')}`);
	}

	this.pullRouteFromQueue = async () => {
		winston.log(`Getting back best (closest to destination) route from queue.`);
		
		var result = (await db.selectRequest(`
			SELECT rq.id as id, rq.route_slug as route_slug, ph.hops_to_destination as hops_to_destination
				FROM routes_queues rq
				INNER JOIN planets_hops ph
					ON ph.id = rq.last_planet_id
				WHERE rq.workset_hash_id=?
				ORDER BY ph.hops_to_destination, rq.route_hop_count ASC
				LIMIT 0,1`, [worksetHashId]))[0];

		if(!result) return false;

		await db.deleteRequest(`DELETE FROM routes_queues WHERE id=? AND workset_hash_id=?`,[result.id, worksetHashId]);
		result.route = result.route_slug.split('->');
		delete result.route_slug;
		return result;
	}

	this.isRouteAlreadyInDb = async route => {
		winston.log(`Checking if route is already in buffer db.`);
		var cnt = (await db.selectRequest(`SELECT count(*) as cnt FROM routes WHERE route_slug=? AND workset_hash_id=?`, [route.join('->'), worksetHashId]))[0].cnt;
		return cnt ? true : false;
	}	

	this.getRouteQueueCount = async () => {
		winston.log(`Getting back route count from queue.`);
		console.log('count')
		return (await db.selectRequest(`SELECT count(*) as cnt FROM routes_queues WHERE workset_hash_id=?`, [worksetHashId]))[0].cnt;
	}

	this.getRoutes = async () => {
		winston.log(`Getting back all precalculed routes.`);
		return await db.selectRequest(`SELECT * FROM routes WHERE workset_hash_id=?`, [worksetHashId]);
	}

	this.getRouteCount = async () => {
		winston.log(`Getting back route count.`);
		return (await db.selectRequest(`SELECT count(*) as cnt FROM routes WHERE workset_hash_id=?`, [worksetHashId]))[0].cnt;
	}

	this.setMultiPlanetHops = async (planets, hops) => {
		winston.log(`Setting hops to ${hops} for ${planets.length} planets.`);
		var valuesToInsert = [];
		planets.forEach(planet => valuesToInsert.push(`("${planet}", ${hops}, ${worksetHashId})`));
		var toInsert = valuesToInsert.join(',');
		await db.insertRequest(
			`INSERT INTO planets_hops(planet, hops_to_destination, workset_hash_id) VALUES ${toInsert}`, []);
	}

	this.insertRoute = async route => {
		var routeSlug = route.join('->');
		winston.log(`Verifying route does'nt already exist.`);
		var cnt = (await db.selectRequest(
					`SELECT count(*) as cnt FROM routes WHERE route_slug=? AND workset_hash_id=?`, [routeSlug, worksetHashId]))[0].cnt;
		if(cnt){
			console.log(`Route ${routeSlug} already exist in database for this workset. Do nothing.`);
			return;
		}
		winston.log(`Inserting new route ${routeSlug}.`);
		await db.insertRequest(
			`INSERT INTO routes(route_slug, workset_hash_id) VALUES (?, ?)`, [routeSlug, worksetHashId]);
	}

	this.getWorkSetStatus = async () => {
		winston.log(`Getting workset status.`);
		var result = await db.selectRequest(`SELECT * FROM workset_status WHERE workset_hash_id=?`, [worksetHashId]);
		if(!result.length) await this.updateWorkSetStatus({ precomputed: 0, explored: 0, travelable: 0 });
		return (await db.selectRequest(`SELECT * FROM workset_status WHERE workset_hash_id=?`, [worksetHashId]))[0];
	}

	this.updateWorkSetStatus = async workSetStatus => {
		winston.log(`Updating workset status => Precomputed : ${workSetStatus.precomputed}, Explored : ${workSetStatus.explored}, Travelable : ${workSetStatus.travelable}.`);
		var isExisting = (await db.selectRequest(`SELECT count(*) as cnt FROM workset_status WHERE workset_hash_id=?`, [worksetHashId]))[0].cnt;
		if(!isExisting) await db.insertRequest(
			`INSERT INTO workset_status (precomputed, explored, travelable, workset_hash_id) 
				VALUES (?, ?, ?, ?)`, [workSetStatus.precomputed, workSetStatus.explored, workSetStatus.travelable, worksetHashId]);
		else await db.updateRequest(
			`UPDATE workset_status 
				SET precomputed=?, explored=?, travelable=? WHERE workset_hash_id=?`
				, [workSetStatus.precomputed, workSetStatus.explored, workSetStatus.travelable, worksetHashId]);
	}	

	this.getHops = async planet => {
		winston.log(`Getting back hops count for ${planet}.`);
		var result = await db.selectRequest(`SELECT hops_to_destination FROM planets_hops WHERE planet=? AND workset_hash_id=?`, [planet, worksetHashId]);
		if(result.length) return result[0].hops_to_destination;
		return 0;
	}

	this.getAllHops = async () => {
		winston.log(`Getting back all hops count.`);
		return await db.selectRequest(`SELECT planet, hops_to_destination FROM planets_hops WHERE workset_hash_id=?`, [worksetHashId]);
	}	

	this.close = async () => {
		winston.log(`Closing buffer database at ${DbPath}.`);
		await db.closeDb();
	}
}