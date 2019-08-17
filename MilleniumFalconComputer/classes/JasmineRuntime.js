"use strict";
const Logger = require('./Logger.js');

var winston = new Logger('JasmineTesting');

var smallReporter = {
	jasmineStarted: function(suiteInfo) {
		winston.log('Running suite with ' + suiteInfo.totalSpecsDefined);
	},
	suiteStarted: function(result) {
		winston.log('Suite started: ' + result.description);
	},
	specStarted: function(result) {
		winston.log('Spec started: ' + result.description);
	},
	specDone: function(result) {
		winston.log('Spec: ' + result.description);
		for(var i = 0; i < result.failedExpectations.length; i++)
			winston.log('Failure: ' + result.failedExpectations[i].message);
	},
	suiteDone: function(result) {
		winston.log('Suite: ' + result.description);
		for(var i = 0; i < result.failedExpectations.length; i++) {
			winston.log('Suite ' + result.failedExpectations[i].message);
		}
	},
	jasmineDone: function(result) {
		winston.log('Finished suite: ' + result.overallStatus);
		for(var i = 0; i < result.failedExpectations.length; i++) {	
			winston.log('Global ' + result.failedExpectations[i].message);
		}
	}
}

module.exports = async function(specFile, params, _useFullFledgedReporter){
	const Jasmine = new (require('jasmine'))();
	const JasmineConsoleReporter = require('jasmine-console-reporter');

	var useFullFledgedReporter;
	if(_useFullFledgedReporter === undefined) useFullFledgedReporter = true;
	else useFullFledgedReporter = _useFullFledgedReporter;

	Jasmine.loadConfig({
		spec_dir: 'tests',
		spec_files: [specFile],
		helpers: ['helpers/**/*.js'],
		random: false,
		seed: null,
		stopSpecOnExpectationFailure: true
	});

	const Reporter = new JasmineConsoleReporter({
		colors: 1,           // (0|false)|(1|true)|2
		cleanStack: 1,       // (0|false)|(1|true)|2|3
		verbosity: 4,        // (0|false)|1|2|(3|true)|4|Object
		listStyle: 'indent', // "flat"|"indent"
		timeUnit: 'ms',      // "ms"|"ns"|"s"
		timeThreshold: { ok: 500, warn: 10000, ouch: 30000 }, // Object|Number
		activity: false,     // boolean or string ("dots"|"star"|"flip"|"bouncingBar"|...)
		emoji: true,
		beep: true
	});

	Jasmine.jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000;

	Jasmine.env.passedParams = params;

	Jasmine.env.clearReporters();

	if(useFullFledgedReporter) Jasmine.addReporter(Reporter);
	else Jasmine.addReporter(smallReporter);

	var executeJasmine = () => {
		return new Promise((resolve,reject) => {
			Jasmine.execute();
			Jasmine.onComplete(resolve);
		});
	}
	return executeJasmine();
}