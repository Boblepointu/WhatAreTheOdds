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
						"minimum_travel_time"	INTEGER NOT NULL,
						"additional_waypoints"	TEXT NOT NULL,
						"workset_hash_id"	INTEGER NOT NULL,
						FOREIGN KEY("workset_hash_id") REFERENCES "workset_hashs"("id") ON DELETE CASCADE
					);
					CREATE TABLE IF NOT EXISTS "routes_queues" (
						"id"	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
						"route_slug"	TEXT NOT NULL,
						"route_hop_count"	INTEGER NOT NULL,
						"additional_waypoints"	TEXT NOT NULL,
						"last_planet_id"	INTEGER NOT NULL,
						"workset_hash_id"	INTEGER NOT NULL,
						FOREIGN KEY("workset_hash_id") REFERENCES "workset_hashs"("id") ON DELETE CASCADE,
						FOREIGN KEY("last_planet_id") REFERENCES "planets_hops"("id") ON DELETE CASCADE
					);		
					CREATE INDEX IF NOT EXISTS "routes_queues_route_slug_index" ON "routes_queues" ("route_slug");
					CREATE INDEX IF NOT EXISTS "routes_queues_route_hop_count_index" ON "routes_queues" ("route_hop_count");
					CREATE TABLE IF NOT EXISTS "planets_hops" (
						"id"	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
						"planet"	TEXT NOT NULL,
						"hops_to_destination"	INTEGER NOT NULL,
						"workset_hash_id"	INTEGER NOT NULL,
						FOREIGN KEY("workset_hash_id") REFERENCES "workset_hashs"("id") ON DELETE CASCADE
					);
					CREATE INDEX IF NOT EXISTS "planets_hops_planet_index" ON "planets_hops" ("planet");
					CREATE TABLE IF NOT EXISTS "workset_status" (
						"precomputed"	BOOLEAN NOT NULL,
						"explored"	BOOLEAN NOT NULL,
						"travelable"	BOOLEAN NOT NULL,
						"workset_hash_id"	INTEGER NOT NULL UNIQUE,
						FOREIGN KEY("workset_hash_id") REFERENCES "workset_hashs"("id") ON DELETE CASCADE
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

	this.addAdditionalWaypointForRouteQueues = async (routeQueueId, planet, forkPlanet) => {
		console.log(`Adding additional waypoint for route ${routeQueueId} from ${planet} to ${forkPlanet}`);
		await db.insertRequest(`INSERT INTO additional_waypoints_routes_queues(planet, fork_planet, route_queues_id)
									VALUES(?, ?, ?)`, [planet, forkPlanet, routeQueueId]);
	}	

	this.addRoutesToQueue = async routes => {
		winston.log(`Inserting ${routes.length} new routes to queue.`);
		var routesValues = [];

		for(let i = 0; i < routes.length; i++){
			let lastPlanet = routes[i].route[routes[i].route.length-1];
			let routeSlug = routes[i].route.join('->');
			let routeHopCount = routes[i].route.length;
			let cnt = (await db.selectRequest(`SELECT count(*) as cnt FROM routes_queues WHERE route_slug=? AND workset_hash_id=?`, [routeSlug, worksetHashId]))[0].cnt;
			if(cnt) continue;
			let lastPlanetId = (await db.selectRequest(`SELECT id FROM planets_hops WHERE planet=? AND workset_hash_id=?`, [lastPlanet, worksetHashId]))[0].id;
			routesValues.push(`("${routeSlug}", ${routeHopCount}, '${JSON.stringify(routes[i].additional_waypoints)}', ${lastPlanetId}, ${worksetHashId})`);
		}
		if(routesValues.length)
			await db.insertRequest(`INSERT INTO routes_queues (route_slug, route_hop_count, additional_waypoints, last_planet_id, workset_hash_id) VALUES ${routesValues.join(',')}`);
	}



	this.pullRoutesFromQueue = async numRoute => {
		winston.log(`Getting back bests (closest to destination) ${numRoute} routes from queue.`);
		
		var routes = await db.selectRequest(`
			SELECT rq.id as id
					, rq.route_slug as route_slug
					, ph.hops_to_destination as hops_to_destination
					, rq.additional_waypoints as additional_waypoints
				FROM routes_queues rq
				INNER JOIN planets_hops ph
					ON ph.id = rq.last_planet_id
				WHERE rq.workset_hash_id=?
				ORDER BY ph.hops_to_destination, rq.route_hop_count ASC
				LIMIT 0,${numRoute}`, [worksetHashId]);

		if(!routes.length) return [];

		await db.deleteRequest(`DELETE FROM routes_queues WHERE id IN (${routes.map(row => row.id).join(',')}) AND workset_hash_id=?`,[worksetHashId]);
		let curatedRoutes = routes.map(row => {
			row.route = row.route_slug.split('->');
			//console.log(row)
			row.additional_waypoints = JSON.parse(row.additional_waypoints);
			delete row.id;
			delete row.route_slug;
			delete row.hops_to_destination;
			return row;
		});
		return curatedRoutes;
	}

	this.cleanupQueue = async () => {
		winston.log(`Cleaning up queue for this workset.`);
		await db.deleteRequest(`DELETE FROM routes_queues WHERE workset_hash_id=?`, [worksetHashId]);
	}

	this.isRouteAlreadyInDb = async route => {
		winston.log(`Checking if route is already in buffer db.`);
		var cnt = (await db.selectRequest(`SELECT count(*) as cnt FROM routes WHERE route_slug=? AND workset_hash_id=?`, [route.join('->'), worksetHashId]))[0].cnt;
		return cnt ? true : false;
	}	

	this.getRouteQueueCount = async () => {
		winston.log(`Getting back route count from queue.`);
		return (await db.selectRequest(`SELECT count(*) as cnt FROM routes_queues WHERE workset_hash_id=?`, [worksetHashId]))[0].cnt;
	}

	this.getRoutes = async maximumTravelTime => {
		winston.log(`Getting back all precalculed routes.`);
		return await db.selectRequest(`SELECT * FROM routes WHERE minimum_travel_time<=? AND workset_hash_id=?`, [maximumTravelTime, worksetHashId]);
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
/*
					CREATE TABLE IF NOT EXISTS "additional_waypoints_routes" (
						"id"	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
						"json_data"	TEXT NOT NULL,
						"route_id"	INTEGER NOT NULL,
						FOREIGN KEY("route_id") REFERENCES "routes"("id") ON DELETE CASCADE
					);
*/
	this.insertRoute = async (route, minimumTravelTime) => {
		if(await this.isRouteAlreadyInDb(route.route)) return;
		var routeSlug = route.route.join('->');
		winston.log(`Inserting new route ${routeSlug}.`);
		await db.insertRequest(
			`INSERT INTO routes(route_slug, minimum_travel_time, additional_waypoints, workset_hash_id) VALUES (?, ?, ?, ?)`, [routeSlug, minimumTravelTime, JSON.stringify(route.additional_waypoints), worksetHashId]);
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

	this.close = async () => {
		winston.log(`Closing buffer database at ${DbPath}.`);
		await db.closeDb();
	}
}