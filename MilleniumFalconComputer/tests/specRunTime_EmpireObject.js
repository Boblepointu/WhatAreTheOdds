const IsValidPath = require('is-valid-path');
const Fs = require('fs');
const Validator = require('validator');
const Toolbox = new (require('../classes/Toolbox.js'))();
const Db = require('../classes/Db.js');

var Empire = jasmine.currentEnv_.passedParams;

describe("Testing empire data passed by client", function() {
	it("empire data exist and is an object", function() {
		expect(Empire).toEqual(jasmine.any(Object));
	});

	it("contain an integer (>0) countdown", function() {
		expect(Empire.countdown).toEqual(jasmine.any(Number));
		expect(Empire.countdown > 0).toBe(true);
	});

	it("contain a bounty hunters array", function() {
		expect(Empire.bounty_hunters).toEqual(jasmine.any(Array));
	});

	it("contain valid intel for each entries in bounty hunters array", function() {
		for(let i = 0; i < Empire.bounty_hunters.length; i++){
			expect(Empire.bounty_hunters[i].planet).toEqual(jasmine.any(String));
			expect(Empire.bounty_hunters[i].planet.length > 0).toBe(true);
			expect(Empire.bounty_hunters[i].day).toEqual(jasmine.any(Number));
			expect(Empire.bounty_hunters[i].day > 0).toBe(true);
		}
	});	
});