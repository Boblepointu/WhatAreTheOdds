const IsValidPath = require('is-valid-path');
const Fs = require('fs');
const Validator = require('validator');
const Toolbox = new (require('../classes/Toolbox.js'))();
const Db = require('../classes/Db.js');

var Params;

describe("Pulling parameters.", function() {
	it("can pull parameters without error", function() {
		try{
			Params = Toolbox.getAppParams();
			expect(Params).toEqual(jasmine.any(Object));
		}catch(e){
			expect(Params).toEqual(jasmine.any(Object));
		}
	});
});

describe("Verifying config/env parameters.", function() {
	
	it("contains a valid path 'MFalconConfigPath' value", function() {
		expect(Params.MFalconConfigPath).toEqual(jasmine.any(String));
		expect(IsValidPath(Params.MFalconConfigPath)).toBe(true);
	});

	it("contains a valid path 'BufferDbPath' value", function() {
		expect(Params.BufferDbPath).toEqual(jasmine.any(String));
		expect(IsValidPath(Params.BufferDbPath)).toBe(true);
	});

	it("contains a valid path 'UniverseWorkDbPath' value", function() {
		expect(Params.UniverseWorkDbPath).toEqual(jasmine.any(String));
		expect(IsValidPath(Params.UniverseWorkDbPath)).toBe(true);
	});

	it("contains a valid (0 || 1) integer 'DryRun' value", function() {
		expect(Params.DryRun).toEqual(jasmine.any(Number));
		expect(Params.DryRun == 0 || Params.DryRun == 1).toBe(true);
	});

	it("contains a valid (1 || 2 || 3 || 4 || 5) integer 'LogLevel' value", function() {
		expect(Params.LogLevel).toEqual(jasmine.any(Number));
		expect(Params.LogLevel > 0 && Params.LogLevel <= 5).toBe(true);
	});

	it("contains a valid (>0) integer 'HardTimeoutSec' value", function() {
		expect(Params.HardTimeoutSec).toEqual(jasmine.any(Number));
		expect(Params.HardTimeoutSec > 0).toBe(true);
	});

	it("contains a valid (>0 && <HardTimeoutSec) integer 'SoftTimeoutSec' value", function() {
		expect(Params.SoftTimeoutSec).toEqual(jasmine.any(Number));
		expect(Params.SoftTimeoutSec > 0 && Params.SoftTimeoutSec < Params.HardTimeoutSec).toBe(true);
	});

	it("contains a valid (>0 && <65535) integer 'Port' value", function() {
		expect(Params.Port).toEqual(jasmine.any(Number));
		expect(Params.Port > 0 && Params.Port <= 65535).toBe(true);
	});

	it("contains a valid (>0) integer 'MaxSimultaneousComputation' value", function() {
		expect(Params.MaxSimultaneousComputation).toEqual(jasmine.any(Number));
		expect(Params.MaxSimultaneousComputation > 0).toBe(true);
	});

	it("contains a valid (0 || 1) integer 'AllowAllAccessControlOrigins' value", function() {
		expect(Params.AllowAllAccessControlOrigins).toEqual(jasmine.any(Number));
		expect(Params.AllowAllAccessControlOrigins == 0 || Params.AllowAllAccessControlOrigins == 1).toBe(true);
	});

	it("contains a valid (>0) integer 'MaxSentRouteToClient' value", function() {
		expect(Params.MaxSentRouteToClient).toEqual(jasmine.any(Number));
		expect(Params.MaxSentRouteToClient > 0).toBe(true);
	});

	it("contains a valid (>100) integer 'ExploreBatchSize' value", function() {
		expect(Params.ExploreBatchSize).toEqual(jasmine.any(Number));
		expect(Params.ExploreBatchSize >= 100).toBe(true);
	});
});

describe("Verifying Millenium Falcon config file.", function() {
	it("file exist", function() {
		var fileExist = (Fs.existsSync(Params.MFalconConfigPath)) ? true : false;
		expect(fileExist).toBe(true);
	});

	it("file is valid json", function() {
		try{
			var file = JSON.parse(Fs.readFileSync(Params.MFalconConfigPath));
			expect(true).toBe(true);
		}catch(err){ expect(false).toBe(true); }
	});	

	it("contains a alphanumeric string departure entry", function() {
		var mFalcon = JSON.parse(Fs.readFileSync(Params.MFalconConfigPath));
		expect(mFalcon.departure).toEqual(jasmine.any(String));
		expect(Validator.isAlphanumeric(mFalcon.departure)).toBe(true);
	});

	it("contains a alphanumeric string arrival entry", function() {
		var mFalcon = JSON.parse(Fs.readFileSync(Params.MFalconConfigPath));
		expect(mFalcon.arrival).toEqual(jasmine.any(String));
		expect(Validator.isAlphanumeric(mFalcon.departure)).toBe(true);
	});

	it("contains a valid (>0) integer autonomy entry", function() {
		var mFalcon = JSON.parse(Fs.readFileSync(Params.MFalconConfigPath));
		expect(mFalcon.autonomy).toEqual(jasmine.any(Number));
		expect(mFalcon.autonomy > 0).toBe(true);
	});

	it("contains a valid path routes_db", function() {
		var mFalcon = JSON.parse(Fs.readFileSync(Params.MFalconConfigPath));
		expect(mFalcon.routes_db).toEqual(jasmine.any(String));
		expect(IsValidPath(mFalcon.routes_db)).toBe(true);
	});

	it("db referenced by routes_db exist", function() {
		var mFalcon = JSON.parse(Fs.readFileSync(Params.MFalconConfigPath));
		var fileExist = (Fs.existsSync(mFalcon.routes_db)) ? true : false;
		expect(fileExist).toBe(true);
	});
});

describe("Verifying universe database content.", function() {
	it("can open universe database", async function() {
		try{
			var mFalcon = JSON.parse(Fs.readFileSync(Params.MFalconConfigPath));
			var UniverseDb = new Db();
			await UniverseDb.openDb(mFalcon.routes_db);
			expect(true).toBe(true);
			await UniverseDb.closeDb();
		}catch(err){ expect(false).toBe(true); }
	});

	it("has got a routes table", async function() {
		try{
			var mFalcon = JSON.parse(Fs.readFileSync(Params.MFalconConfigPath));
			var UniverseDb = new Db();
			await UniverseDb.openDb(mFalcon.routes_db);			
			var routesTableExist = (await UniverseDb.selectRequest(`SELECT name FROM sqlite_master WHERE type='table' AND name='routes'`, []))[0] ? true : false;
			if(!routesTableExist) throw "";
			else expect(true).toBe(true);
			await UniverseDb.closeDb();
		}catch(err){ expect(false).toBe(true); }
	});

	it("has got 3 columns in route table", async function() {
		try{
			var mFalcon = JSON.parse(Fs.readFileSync(Params.MFalconConfigPath));
			var UniverseDb = new Db();
			await UniverseDb.openDb(mFalcon.routes_db);		
			var routesTableColumns = await UniverseDb.selectRequest(`PRAGMA table_info(routes)`, []);
			expect(routesTableColumns.length).toEqual(3);
			await UniverseDb.closeDb();
		}catch(err){ expect(false).toBe(true); }
	});

	it("has got a correctly formed (name: origin, type: TEXT) origin column", async function() {
		try{
			var mFalcon = JSON.parse(Fs.readFileSync(Params.MFalconConfigPath));
			var UniverseDb = new Db();
			await UniverseDb.openDb(mFalcon.routes_db);		
			var routesTableColumns = await UniverseDb.selectRequest(`PRAGMA table_info(routes)`, []);
			expect(routesTableColumns[0].name).toEqual('origin');
			expect(routesTableColumns[0].type).toEqual('TEXT');
			await UniverseDb.closeDb();
		}catch(err){ expect(false).toBe(true); }
	});	

	it("has got a correctly formed (name: destination, type: TEXT) destination column", async function() {
		try{
			var mFalcon = JSON.parse(Fs.readFileSync(Params.MFalconConfigPath));
			var UniverseDb = new Db();
			await UniverseDb.openDb(mFalcon.routes_db);		
			var routesTableColumns = await UniverseDb.selectRequest(`PRAGMA table_info(routes)`, []);
			expect(routesTableColumns[1].name).toEqual('destination');
			expect(routesTableColumns[1].type).toEqual('TEXT');
			await UniverseDb.closeDb();
		}catch(err){ expect(false).toBe(true); }
	});

	it("has got a correctly formed (name: travel_time, type: INTEGER || UNSIGNED INTEGER) travel_time column", async function() {
		try{
			var mFalcon = JSON.parse(Fs.readFileSync(Params.MFalconConfigPath));
			var UniverseDb = new Db();
			await UniverseDb.openDb(mFalcon.routes_db);		
			var routesTableColumns = await UniverseDb.selectRequest(`PRAGMA table_info(routes)`, []);
			expect(routesTableColumns[2].name).toEqual('travel_time');
			expect(routesTableColumns[2].type == 'INTEGER' || routesTableColumns[2].type == 'UNSIGNED INTEGER').toBe(true);
			await UniverseDb.closeDb();
		}catch(err){ expect(false).toBe(true); }
	});

	it("route table is not empty", async function() {
		try{
			var mFalcon = JSON.parse(Fs.readFileSync(Params.MFalconConfigPath));
			var UniverseDb = new Db();
			await UniverseDb.openDb(mFalcon.routes_db);		
			var routesCnt = (await UniverseDb.selectRequest(`SELECT count(*) as cnt FROM routes`, []))[0].cnt;
			expect(routesCnt>0).toBe(true);
			await UniverseDb.closeDb();
		}catch(err){ expect(false).toBe(true); }
	});

	it("contain entries with mFalcon departure value", async function() {
		try{
			var mFalcon = JSON.parse(Fs.readFileSync(Params.MFalconConfigPath));
			var UniverseDb = new Db();
			await UniverseDb.openDb(mFalcon.routes_db);		
			var routes = await UniverseDb.selectRequest(`SELECT * FROM routes WHERE origin=? OR destination=?`, [mFalcon.departure, mFalcon.departure]);
			expect(routes.length > 0).toBe(true);
			await UniverseDb.closeDb();		
		}catch(err){ expect(false).toBe(true); }
	});

	it("contain entries with mFalcon arrival value", async function() {
		try{
			var mFalcon = JSON.parse(Fs.readFileSync(Params.MFalconConfigPath));
			var UniverseDb = new Db();
			await UniverseDb.openDb(mFalcon.routes_db);
			routes = await UniverseDb.selectRequest(`SELECT * FROM routes WHERE origin=? OR destination=?`, [mFalcon.arrival, mFalcon.arrival]);
			expect(routes.length > 0).toBe(true);	
			await UniverseDb.closeDb();		
		}catch(err){ expect(false).toBe(true); }
	});	

	it("contain valid data (only alphanumeric names, names length < 1000, positive travel times)", async function() {
		try{
			var mFalcon = JSON.parse(Fs.readFileSync(Params.MFalconConfigPath));
			var UniverseDb = new Db();
			await UniverseDb.openDb(mFalcon.routes_db);
			var routes = await UniverseDb.selectIteratorRequest(`SELECT * FROM routes`, [], row => {
				expect(Validator.isAlphanumeric(row.origin)).toBe(true);
				expect(Validator.isAlphanumeric(row.destination)).toBe(true);
				expect(row.origin.length < 1000).toBe(true);
				expect(row.destination.length < 1000).toBe(true);
				expect(row.travel_time).toEqual(jasmine.any(Number));
				expect(row.travel_time >= 0).toBe(true);
			});
			await UniverseDb.closeDb();
		}catch(err){ expect(false).toBe(true); }
	});
});