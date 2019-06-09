"use strict";

module.exports = function(routeRows, bhArray){
	var Logger = require('./Logger.js');
	var _ = require('underscore');
	var winston = Logger(`BuildGraph`);
	var Graph = function(){
		var self = this;
		this.planets = [];

		this.getTravelTimeBetween = function(startPlanet, endPlanet, linkNumber){
			try{
				if(!linkNumber)
					return (_.find(this.planets[startPlanet].links, entry => { return entry.planet == endPlanet; })).travelTime;
				else 
					return this.planets[startPlanet].links[linkNumber].travelTime;
			}catch(err){ throw err; }
		}

		this.isThereBhOnPlanet = function(planet, day){
			try{
				return (_.find(this.planets[planet].bh, entry => {
					return entry.day == day;
				})) ? true : false;
			}catch(err){ throw err; }
		}
	}

	return new Promise((resolve, reject) => {
		try{
			winston.log(`Building graph out of ${routeRows.length} route entries.`);

			var graph = new Graph();

			for(var i in routeRows){
				var currRoute = routeRows[i];
				if(!graph.planets[currRoute.origin])
					graph.planets[currRoute.origin] = { links: [], bh: _.filter(bhArray, entry => { return entry.planet == currRoute.origin; }) };
				if(!graph.planets[currRoute.destination]) 
					graph.planets[currRoute.destination] = { links: [], bh: _.filter(bhArray, entry => { return entry.planet == currRoute.destination; }) };

				console.log(currRoute.origin.bh)
				console.log(currRoute.destination.bh)

				if(!_.find(graph.planets[currRoute.origin].links, entry => { return entry.planet == currRoute.destination && entry.travelTime == currRoute.travel_time; }))
					graph.planets[currRoute.origin].links.push({ planet: currRoute.destination, travelTime: currRoute.travel_time });
				else
					winston.warn(`Found a duplicate route entry, bypassing it => from ${currRoute.origin} to ${currRoute.destination} in ${currRoute.travel_time} days.`);

				if(!_.find(graph.planets[currRoute.destination].links, entry => { return entry.planet == currRoute.origin && entry.travelTime == currRoute.travel_time; }))
					graph.planets[currRoute.destination].links.push({ planet: currRoute.origin, travelTime: currRoute.travel_time });
				else
					winston.warn(`Found a duplicate route entry, bypassing it => from ${currRoute.origin} to ${currRoute.destination} in ${currRoute.travel_time} days.`);
			}

			winston.log(`Sorting graph by destination names.`);

			for(var i in graph.planets)
				graph.planets[i].links = graph.planets[i].links.sort((a, b) => {
					if(a.planet < b.planet) { return -1; }
					if(a.planet > b.planet) { return 1; }
					return 0;
				});

			var routeCount = 0;
			for(var i in graph.planets) routeCount += graph.planets[i].links.length;

			winston.log(`Built a graph with ${routeCount} routes available.`);

			resolve(graph);
		}catch(err){
			winston.error(`An unexpected error occured while building the graph.`)
			reject(err); 
		}
	});
};