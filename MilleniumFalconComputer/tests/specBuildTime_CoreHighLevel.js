"use strict";

process.env.LOG_LEVEL = 0;

const Fs = require('fs');
const Md5 = require('md5');
const PathFinder = require('../classes/PathFinder.js');
const Db = require('../classes/Db.js');
const Toolbox = new (require('../classes/Toolbox.js'))();

describe("Test set 1", function() {
	var UniverseDbPath = './tests/datasets/test0001/universe.db';
	var BufferDbPath = './tests/datasets/test0001/buffer.db';
	var BufferDbSqlPath = './buffer.db.sql';
	var MFalcon = require('./datasets/test0001/millenium-falcon.json');
	var Empire = require('./datasets/test0001/empire.json');
	var WorkSetHash = "DUMMY";
	var TestSetValidRoutesResultsMd5 = 'b66c01b131dbdd675ee1b11084e95b04';
	var TestSetValidPathResultsMd5 = 'd751713988987e9331980363e24189ce';
	

	try{ Fs.unlinkSync(BufferDbPath); }catch(err){}

	it("can create buffer db", async function() {
		try{
			var BufferDb = new Db();
			await BufferDb.createDb(BufferDbPath);
			await BufferDb.openDb(BufferDbPath);
			await BufferDb.execMultipleRequest(Fs.readFileSync(BufferDbSqlPath, 'utf8'));
			await BufferDb.closeDb();
		}catch(e){
			expect(true).toBe(false);
		}
	});
	it("can open universe database", async function() {
		try{
			var UniverseDb = new Db();
			await UniverseDb.openDb(UniverseDbPath);
			await UniverseDb.closeDb();
		}catch(e){
			expect(true).toBe(false);
		}
	});
	it("can open buffer database", async function() {
		try{
			var BufferDb = new Db();
			await BufferDb.openDb(BufferDbPath);
			await BufferDb.closeDb();
		}catch(e){
			expect(true).toBe(false);
		}
	});	
	it("can build in memory graph", async function() {
		try{
			var UniverseDb = new Db();
			await UniverseDb.openDb(UniverseDbPath);			
			var pathFinder = new PathFinder(UniverseDb, MFalcon);
			await pathFinder.buildGraph();
			await UniverseDb.closeDb();
		}catch(e){
			expect(true).toBe(false);
		}
	});
	it("can find expected routes", async function() {
		try{
			var UniverseDb = new Db();
			await UniverseDb.openDb(UniverseDbPath);
			var BufferDb = new Db();
			await BufferDb.openDb(BufferDbPath);

			var foundRoutesMap = {};
			var pathFinder = new PathFinder(UniverseDb, MFalcon);
			await pathFinder.buildGraph();
			await pathFinder.findRoutes(async (route) => {
					await BufferDb.insertRequest(`INSERT INTO routes (route_slug, workset_hash) VALUES (?, ?)`, [route.join('->'), WorkSetHash]);
			});

			var routeFounds = await BufferDb.selectRequest(`SELECT * FROM routes`, []);

			await UniverseDb.closeDb();
			await BufferDb.closeDb();

			if(Md5(JSON.stringify(routeFounds)) != TestSetValidRoutesResultsMd5) expect(false).toBe(true);
		}catch(e){
			console.log(e)
			expect(true).toBe(false);
		}
	});
	it("can find expected path", async function() {
		try{
			var UniverseDb = new Db();
			await UniverseDb.openDb(UniverseDbPath);
			var BufferDb = new Db();
			await BufferDb.openDb(BufferDbPath);

			var foundRoutesMap = {};
			var pathFinder = new PathFinder(UniverseDb, MFalcon);

			var routes = await BufferDb.selectRequest(`SELECT * FROM routes WHERE workset_hash=?`, [WorkSetHash]);

			var routeList = [];
			for(let i = 0; i < routes.length; i++){
				let routeRes = await pathFinder.computeOptimalWaypoints(Empire, routes[i].route_slug.split('->'));
				if(!routeRes) continue;

				routeList.push(routeRes);
				routeList.sort((rA, rB) => {
					var rALastNode = rA[rA.length-1];
					var rBLastNode = rB[rB.length-1];
					return (rALastNode.hitCount - rBLastNode.hitCount) || (rALastNode.travelTime - rBLastNode.travelTime);
				});
			}

			var formattedRoutesList = [];

			for(let i = 0; i < routeList.length; i++)
				formattedRoutesList.push(Toolbox.formatRoute(routeList[i]));
			
			for(let i = 0; i < formattedRoutesList.length; i++)
				var currRoute = formattedRoutesList[i];

			await UniverseDb.closeDb();
			await BufferDb.closeDb();
			if(Md5(JSON.stringify(formattedRoutesList)) != TestSetValidPathResultsMd5) expect(false).toBe(true);
		}catch(e){
			console.log(e)
			expect(true).toBe(false);
		}
	});
});

describe("Test set 2", function() {
	var UniverseDbPath = './tests/datasets/test0002/universe.db';
	var BufferDbPath = './tests/datasets/test0002/buffer.db';
	var BufferDbSqlPath = './buffer.db.sql';
	var MFalcon = require('./datasets/test0002/millenium-falcon.json');
	var Empire = require('./datasets/test0002/empire.json');
	var WorkSetHash = "DUMMY";
	var TestSetValidRoutesResultsMd5 = 'b66c01b131dbdd675ee1b11084e95b04';
	var TestSetValidPathResultsMd5 = 'e6389eefaf7ed4de06d93005c202e928';

	try{ Fs.unlinkSync(BufferDbPath); }catch(err){}

	it("can create buffer db", async function() {
		try{
			var BufferDb = new Db();
			await BufferDb.createDb(BufferDbPath);
			await BufferDb.openDb(BufferDbPath);
			await BufferDb.execMultipleRequest(Fs.readFileSync(BufferDbSqlPath, 'utf8'));
			await BufferDb.closeDb();
		}catch(e){
			expect(true).toBe(false);
		}
	});
	it("can open universe database", async function() {
		try{
			var UniverseDb = new Db();
			await UniverseDb.openDb(UniverseDbPath);
			await UniverseDb.closeDb();
		}catch(e){
			expect(true).toBe(false);
		}
	});
	it("can open buffer database", async function() {
		try{
			var BufferDb = new Db();
			await BufferDb.openDb(BufferDbPath);
			await BufferDb.closeDb();
		}catch(e){
			expect(true).toBe(false);
		}
	});	
	it("can build in memory graph", async function() {
		try{
			var UniverseDb = new Db();
			await UniverseDb.openDb(UniverseDbPath);			
			var pathFinder = new PathFinder(UniverseDb, MFalcon);
			await pathFinder.buildGraph();
			await UniverseDb.closeDb();
		}catch(e){
			expect(true).toBe(false);
		}
	});
	it("can find expected routes", async function() {
		try{
			var UniverseDb = new Db();
			await UniverseDb.openDb(UniverseDbPath);
			var BufferDb = new Db();
			await BufferDb.openDb(BufferDbPath);

			var foundRoutesMap = {};
			var pathFinder = new PathFinder(UniverseDb, MFalcon);
			await pathFinder.buildGraph();
			await pathFinder.findRoutes(async (route) => {
					await BufferDb.insertRequest(`INSERT INTO routes (route_slug, workset_hash) VALUES (?, ?)`, [route.join('->'), WorkSetHash]);
			});

			var routeFounds = await BufferDb.selectRequest(`SELECT * FROM routes`, []);

			await UniverseDb.closeDb();
			await BufferDb.closeDb();

			if(Md5(JSON.stringify(routeFounds)) != TestSetValidRoutesResultsMd5) expect(false).toBe(true);
		}catch(e){
			console.log(e)
			expect(true).toBe(false);
		}
	});
	it("can find expected path", async function() {
		try{
			var UniverseDb = new Db();
			await UniverseDb.openDb(UniverseDbPath);
			var BufferDb = new Db();
			await BufferDb.openDb(BufferDbPath);

			var foundRoutesMap = {};
			var pathFinder = new PathFinder(UniverseDb, MFalcon);

			var routes = await BufferDb.selectRequest(`SELECT * FROM routes WHERE workset_hash=?`, [WorkSetHash]);

			var routeList = [];
			for(let i = 0; i < routes.length; i++){
				let routeRes = await pathFinder.computeOptimalWaypoints(Empire, routes[i].route_slug.split('->'));
				if(!routeRes) continue;

				routeList.push(routeRes);
				routeList.sort((rA, rB) => {
					var rALastNode = rA[rA.length-1];
					var rBLastNode = rB[rB.length-1];
					return (rALastNode.hitCount - rBLastNode.hitCount) || (rALastNode.travelTime - rBLastNode.travelTime);
				});
			}

			var formattedRoutesList = [];

			for(let i = 0; i < routeList.length; i++)
				formattedRoutesList.push(Toolbox.formatRoute(routeList[i]));
			
			for(let i = 0; i < formattedRoutesList.length; i++)
				var currRoute = formattedRoutesList[i];

			await UniverseDb.closeDb();
			await BufferDb.closeDb();
			if(Md5(JSON.stringify(formattedRoutesList)) != TestSetValidPathResultsMd5) expect(false).toBe(true);
		}catch(e){
			console.log(e)
			expect(true).toBe(false);
		}
	});
});

describe("Test set 3", function() {
	var UniverseDbPath = './tests/datasets/test0003/universe.db';
	var BufferDbPath = './tests/datasets/test0003/buffer.db';
	var BufferDbSqlPath = './buffer.db.sql';
	var MFalcon = require('./datasets/test0003/millenium-falcon.json');
	var Empire = require('./datasets/test0003/empire.json');
	var WorkSetHash = "DUMMY";
	var TestSetValidRoutesResultsMd5 = 'b66c01b131dbdd675ee1b11084e95b04';
	var TestSetValidPathResultsMd5 = '461375c0483809075acebcd669f380e0';

	try{ Fs.unlinkSync(BufferDbPath); }catch(err){}

	it("can create buffer db", async function() {
		try{
			var BufferDb = new Db();
			await BufferDb.createDb(BufferDbPath);
			await BufferDb.openDb(BufferDbPath);
			await BufferDb.execMultipleRequest(Fs.readFileSync(BufferDbSqlPath, 'utf8'));
			await BufferDb.closeDb();
		}catch(e){
			expect(true).toBe(false);
		}
	});
	it("can open universe database", async function() {
		try{
			var UniverseDb = new Db();
			await UniverseDb.openDb(UniverseDbPath);
			await UniverseDb.closeDb();
		}catch(e){
			expect(true).toBe(false);
		}
	});
	it("can open buffer database", async function() {
		try{
			var BufferDb = new Db();
			await BufferDb.openDb(BufferDbPath);
			await BufferDb.closeDb();
		}catch(e){
			expect(true).toBe(false);
		}
	});	
	it("can build in memory graph", async function() {
		try{
			var UniverseDb = new Db();
			await UniverseDb.openDb(UniverseDbPath);			
			var pathFinder = new PathFinder(UniverseDb, MFalcon);
			await pathFinder.buildGraph();
			await UniverseDb.closeDb();
		}catch(e){
			expect(true).toBe(false);
		}
	});
	it("can find expected routes", async function() {
		try{
			var UniverseDb = new Db();
			await UniverseDb.openDb(UniverseDbPath);
			var BufferDb = new Db();
			await BufferDb.openDb(BufferDbPath);

			var foundRoutesMap = {};
			var pathFinder = new PathFinder(UniverseDb, MFalcon);
			await pathFinder.buildGraph();
			await pathFinder.findRoutes(async (route) => {
					await BufferDb.insertRequest(`INSERT INTO routes (route_slug, workset_hash) VALUES (?, ?)`, [route.join('->'), WorkSetHash]);
			});

			var routeFounds = await BufferDb.selectRequest(`SELECT * FROM routes`, []);

			await UniverseDb.closeDb();
			await BufferDb.closeDb();

			if(Md5(JSON.stringify(routeFounds)) != TestSetValidRoutesResultsMd5) expect(false).toBe(true);
		}catch(e){
			console.log(e)
			expect(true).toBe(false);
		}
	});
	it("can find expected path", async function() {
		try{
			var UniverseDb = new Db();
			await UniverseDb.openDb(UniverseDbPath);
			var BufferDb = new Db();
			await BufferDb.openDb(BufferDbPath);

			var foundRoutesMap = {};
			var pathFinder = new PathFinder(UniverseDb, MFalcon);

			var routes = await BufferDb.selectRequest(`SELECT * FROM routes WHERE workset_hash=?`, [WorkSetHash]);

			var routeList = [];
			for(let i = 0; i < routes.length; i++){
				let routeRes = await pathFinder.computeOptimalWaypoints(Empire, routes[i].route_slug.split('->'));
				if(!routeRes) continue;

				routeList.push(routeRes);
				routeList.sort((rA, rB) => {
					var rALastNode = rA[rA.length-1];
					var rBLastNode = rB[rB.length-1];
					return (rALastNode.hitCount - rBLastNode.hitCount) || (rALastNode.travelTime - rBLastNode.travelTime);
				});
			}

			var formattedRoutesList = [];

			for(let i = 0; i < routeList.length; i++)
				formattedRoutesList.push(Toolbox.formatRoute(routeList[i]));
			
			for(let i = 0; i < formattedRoutesList.length; i++)
				var currRoute = formattedRoutesList[i];

			await UniverseDb.closeDb();
			await BufferDb.closeDb();
			if(Md5(JSON.stringify(formattedRoutesList)) != TestSetValidPathResultsMd5) expect(false).toBe(true);
		}catch(e){
			console.log(e)
			expect(true).toBe(false);
		}
	});
});

describe("Test set 4", function() {
	var UniverseDbPath = './tests/datasets/test0004/universe.db';
	var BufferDbPath = './tests/datasets/test0004/buffer.db';
	var BufferDbSqlPath = './buffer.db.sql';
	var MFalcon = require('./datasets/test0004/millenium-falcon.json');
	var Empire = require('./datasets/test0004/empire.json');
	var WorkSetHash = "DUMMY";
	var TestSetValidRoutesResultsMd5 = 'b66c01b131dbdd675ee1b11084e95b04';
	var TestSetValidPathResultsMd5 = '0ada8764922074bf9c0189dbb30ebe75';

	try{ Fs.unlinkSync(BufferDbPath); }catch(err){}

	it("can create buffer db", async function() {
		try{
			var BufferDb = new Db();
			await BufferDb.createDb(BufferDbPath);
			await BufferDb.openDb(BufferDbPath);
			await BufferDb.execMultipleRequest(Fs.readFileSync(BufferDbSqlPath, 'utf8'));
			await BufferDb.closeDb();
		}catch(e){
			expect(true).toBe(false);
		}
	});
	it("can open universe database", async function() {
		try{
			var UniverseDb = new Db();
			await UniverseDb.openDb(UniverseDbPath);
			await UniverseDb.closeDb();
		}catch(e){
			expect(true).toBe(false);
		}
	});
	it("can open buffer database", async function() {
		try{
			var BufferDb = new Db();
			await BufferDb.openDb(BufferDbPath);
			await BufferDb.closeDb();
		}catch(e){
			expect(true).toBe(false);
		}
	});	
	it("can build in memory graph", async function() {
		try{
			var UniverseDb = new Db();
			await UniverseDb.openDb(UniverseDbPath);			
			var pathFinder = new PathFinder(UniverseDb, MFalcon);
			await pathFinder.buildGraph();
			await UniverseDb.closeDb();
		}catch(e){
			expect(true).toBe(false);
		}
	});
	it("can find expected routes", async function() {
		try{
			var UniverseDb = new Db();
			await UniverseDb.openDb(UniverseDbPath);
			var BufferDb = new Db();
			await BufferDb.openDb(BufferDbPath);

			var foundRoutesMap = {};
			var pathFinder = new PathFinder(UniverseDb, MFalcon);
			await pathFinder.buildGraph();
			await pathFinder.findRoutes(async (route) => {
					await BufferDb.insertRequest(`INSERT INTO routes (route_slug, workset_hash) VALUES (?, ?)`, [route.join('->'), WorkSetHash]);
			});

			var routeFounds = await BufferDb.selectRequest(`SELECT * FROM routes`, []);

			await UniverseDb.closeDb();
			await BufferDb.closeDb();

			if(Md5(JSON.stringify(routeFounds)) != TestSetValidRoutesResultsMd5) expect(false).toBe(true);
		}catch(e){
			console.log(e)
			expect(true).toBe(false);
		}
	});
	it("can find expected path", async function() {
		try{
			var UniverseDb = new Db();
			await UniverseDb.openDb(UniverseDbPath);
			var BufferDb = new Db();
			await BufferDb.openDb(BufferDbPath);

			var foundRoutesMap = {};
			var pathFinder = new PathFinder(UniverseDb, MFalcon);

			var routes = await BufferDb.selectRequest(`SELECT * FROM routes WHERE workset_hash=?`, [WorkSetHash]);

			var routeList = [];
			for(let i = 0; i < routes.length; i++){
				let routeRes = await pathFinder.computeOptimalWaypoints(Empire, routes[i].route_slug.split('->'));
				if(!routeRes) continue;

				routeList.push(routeRes);
				routeList.sort((rA, rB) => {
					var rALastNode = rA[rA.length-1];
					var rBLastNode = rB[rB.length-1];
					return (rALastNode.hitCount - rBLastNode.hitCount) || (rALastNode.travelTime - rBLastNode.travelTime);
				});
			}

			var formattedRoutesList = [];

			for(let i = 0; i < routeList.length; i++)
				formattedRoutesList.push(Toolbox.formatRoute(routeList[i]));
			
			for(let i = 0; i < formattedRoutesList.length; i++)
				var currRoute = formattedRoutesList[i];

			await UniverseDb.closeDb();
			await BufferDb.closeDb();
			if(Md5(JSON.stringify(formattedRoutesList)) != TestSetValidPathResultsMd5) expect(false).toBe(true);
		}catch(e){
			console.log(e)
			expect(true).toBe(false);
		}
	});
});