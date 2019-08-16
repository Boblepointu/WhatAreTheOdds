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
				CREATE TABLE IF NOT EXISTS "planets_hops" (
					"id"	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
					"planet"	TEXT NOT NULL,
					"hops"	INTEGER NOT NULL,
					"workset_hash_id"	INTEGER NOT NULL,
					FOREIGN KEY("workset_hash_id") REFERENCES "workset_hashs"("id")
				);
				CREATE TABLE IF NOT EXISTS "workset_status" (
					"precomputed"	BOOLEAN NOT NULL,
					"quickly_explored"	BOOLEAN NOT NULL,
					"fully_explored"	BOOLEAN NOT NULL,
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
			`INSERT INTO planets_hops(planet, hops, workset_hash_id) VALUES ${toInsert}`, []);
	}

	this.insertRoute = async route => {
		var routeSlug = route.join('->');
		winston.log(`Verifying route does'nt already exist.`);
		var cnt = (await db.selectRequest(
					`SELECT count(*) as cnt FROM routes WHERE route_slug=? AND workset_hash_id=?`, [routeSlug, worksetHashId]))[0].cnt;
		if(cnt){
			winston.log(`Route ${routeSlug} already exist in database for this workset. Do nothing.`);
			return;
		}
		winston.log(`Inserting new route ${routeSlug}.`);
		await db.insertRequest(
			`INSERT INTO routes(route_slug, workset_hash_id) VALUES (?, ?)`, [routeSlug, worksetHashId]);
	}

	this.getWorkSetStatus = async () => {
		winston.log(`Getting workset status.`);
		var result = await db.selectRequest(`SELECT * FROM workset_status WHERE workset_hash_id=?`, [worksetHashId]);
		if(!result.length) await this.updateWorkSetStatus({ precomputed: 0, quickly_explored: 0, fully_explored: 0, travelable: 0 });
		return (await db.selectRequest(`SELECT * FROM workset_status WHERE workset_hash_id=?`, [worksetHashId]))[0];
	}

	this.updateWorkSetStatus = async workSetStatus => {
		winston.log(`Updating workset status => Precomputed : ${workSetStatus.precomputed}, QuicklyExplored : ${workSetStatus.quickly_explored}, FullyExplored : ${workSetStatus.fully_explored}, Travelable : ${workSetStatus.travelable}.`);
		var isExisting = (await db.selectRequest(`SELECT count(*) as cnt FROM workset_status WHERE workset_hash_id=?`, [worksetHashId]))[0].cnt;
		if(!isExisting) await db.insertRequest(
			`INSERT INTO workset_status (precomputed, quickly_explored, fully_explored, travelable, workset_hash_id) 
				VALUES (?, ?, ?, ?, ?)`, [workSetStatus.precomputed, workSetStatus.quickly_explored, workSetStatus.fully_explored, workSetStatus.travelable, worksetHashId]);
		else await db.updateRequest(
			`UPDATE workset_status 
				SET precomputed=?, quickly_explored=?, fully_explored=?, travelable=? WHERE workset_hash_id=?`
				, [workSetStatus.precomputed, workSetStatus.quickly_explored, workSetStatus.fully_explored, workSetStatus.travelable, worksetHashId]);
	}	

	this.getHops = async planet => {
		winston.log(`Getting back hops count for ${planet}.`);
		var result = await db.selectRequest(`SELECT hops FROM planets_hops WHERE planet=? AND workset_hash_id=?`, [planet, worksetHashId]);
		if(result.length) return result[0].hops;
		return 0;
	}

	this.getAllHops = async () => {
		winston.log(`Getting back all hops count.`);
		return await db.selectRequest(`SELECT planet, hops FROM planets_hops WHERE workset_hash_id=?`, [worksetHashId]);
	}	

	this.close = async () => {
		winston.log(`Closing buffer database at ${DbPath}.`);
		await db.closeDb();
	}
}