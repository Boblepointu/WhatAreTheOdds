"use strict";

module.exports = function(routeRows, bhArray, MFalconAutonomy){
	var Logger = require('./Logger.js');
	var _ = require('underscore');
	var winston = Logger(`BuildGraph`);
	var Graph = function(){
		var self = this;
		this.planets = {};
		this.planetToPlanetHeuristic = {};

		this.getNeighbors = function(planet){
			var neighbors = [];
			for(var i in self.planets[planet].links){
				neighbors.push(self.planets[planet].links[i].planet)
			}
			return neighbors;
		}

		this.getDistance = function(planetA, planetB){
			//console.log(planetA, planetB)
			for(var i = 0; i < self.planets[planetA].links.length; i++)
				if(self.planets[planetA].links[i].planet == planetB)
					break;
			//var planetATravelTime = (_.find(self.planets[planetB].links, entry => { return entry.planet == planetA; }))
			//console.log(planetATravelTime.travelTime, planetBTravelTime.travelTime)
			return self.planets[planetA].links[i].travelTime;
		}	

		this.getTravelTimeBetween = function(startPlanet, endPlanet, linkNumber){
			try{
				if(!linkNumber)
					return (_.find(self.planets[startPlanet].links, entry => { return entry.planet == endPlanet; })).travelTime;
				else 
					return self.planets[startPlanet].links[linkNumber].travelTime;
			}catch(err){ throw err; }
		}

		this.isThereBhOnPlanet = function(planet, day){
			try{
				return (_.find(self.planets[planet].bh, entry => {
					return entry.day == day;
				})) ? true : false;
			}catch(err){ throw err; }
		}
	}

	return new Promise((resolve, reject) => {
		try{
			winston.log(`Building graph out of ${routeRows.length} links entries.`);

			var graph = new Graph();

			for(var i in routeRows){
				var currRoute = routeRows[i];
				if(!graph.planets[currRoute.origin])
					graph.planets[currRoute.origin] = { links: {}, bh: _.filter(bhArray, entry => { return entry.planet == currRoute.origin; }) };
				if(!graph.planets[currRoute.destination]) 
					graph.planets[currRoute.destination] = { links: {}, bh: _.filter(bhArray, entry => { return entry.planet == currRoute.destination; }) };

				if(!_.find(graph.planets[currRoute.origin].links, entry => { return entry.planet == currRoute.destination && entry.travelTime == currRoute.travel_time; })){
					if(currRoute.travel_time <= MFalconAutonomy)
						graph.planets[currRoute.origin].links[currRoute.destination] = { planet: currRoute.destination, travelTime: currRoute.travel_time };
					else
						winston.warn(`The link between ${currRoute.origin} and ${currRoute.destination} as a travel time superior of MFalcon autonomy (${currRoute.travel_time} days vs ${MFalconAutonomy} days. Discarding it.`);
				}
				else
					winston.warn(`Found a duplicate link entry, bypassing it => from ${currRoute.origin} to ${currRoute.destination} in ${currRoute.travel_time} days.`);

				if(!_.find(graph.planets[currRoute.destination].links, entry => { return entry.planet == currRoute.origin && entry.travelTime == currRoute.travel_time; })){
					if(currRoute.travel_time <= MFalconAutonomy)
						graph.planets[currRoute.destination].links[currRoute.origin] = { planet: currRoute.origin, travelTime: currRoute.travel_time };
					else
						winston.warn(`The link between ${currRoute.destination} and ${currRoute.origin} as a travel time superior of MFalcon autonomy (${currRoute.travel_time} days vs ${MFalconAutonomy} days. Discarding it.`);
				}
				else
					winston.warn(`Found a duplicate link entry, bypassing it => from ${currRoute.origin} to ${currRoute.destination} in ${currRoute.travel_time} days.`);
			}

			winston.log(`Sorting graph by destination names.`);

			/*for(var i in graph.planets)
				graph.planets[i].links = graph.planets[i].links.sort((a, b) => {
					if(a.planet < b.planet) { return -1; }
					if(a.planet > b.planet) { return 1; }
					return 0;
				});*/

			var routeCount = 0;
			for(var i in graph.planets) routeCount += Object.keys(graph.planets[i].links).length;

			winston.log(`Built a graph with ${routeCount} links available.`);


			resolve(graph);
			return;

			for(var i = 0; i < allPlanets.length; i++){
				graph.planetToPlanetHeuristic[allPlanets[i]] = {};
			}


			for(var i = 0; i < routeRows.length; i++){
				if(!graph.planetToPlanetHeuristic[routeRows[i].origin][routeRows[i].destination])
					graph.planetToPlanetHeuristic[routeRows[i].origin][routeRows[i].destination] = routeRows[i].travel_time;
				if(!graph.planetToPlanetHeuristic[routeRows[i].destination][routeRows[i].origin])
					graph.planetToPlanetHeuristic[routeRows[i].destination][routeRows[i].origin] = routeRows[i].travel_time;
			}


			var gridMap = {};

			for(var i in graph.planetToPlanetHeuristic){
				for(var j in graph.planetToPlanetHeuristic[i]){
					if(!gridMap[i]) gridMap[i] = 0;
					graph.planetToPlanetHeuristic[i][j]
				}
			}


			return;

			var Dijk = require('node-dijkstra');
			var dijkRoute = new Dijk();

			var allPlanets = Object.keys(graph.planets);
			var planetToIndex = {};
			for(var i in allPlanets)
				planetToIndex[allPlanets[i]] = parseInt(i);



			for(var i = 0; i < allPlanets.length; i++){
				graph.planetToPlanetHeuristic[allPlanets[i]] = {};
			}


			for(var i = 0; i < routeRows.length; i++){
				if(!graph.planetToPlanetHeuristic[routeRows[i].origin][routeRows[i].destination])
					graph.planetToPlanetHeuristic[routeRows[i].origin][routeRows[i].destination] = routeRows[i].travel_time;
				if(!graph.planetToPlanetHeuristic[routeRows[i].destination][routeRows[i].origin])
					graph.planetToPlanetHeuristic[routeRows[i].destination][routeRows[i].origin] = routeRows[i].travel_time;
			}

			for(var i in graph.planetToPlanetHeuristic){
				var links = {};
				for(var j in graph.planetToPlanetHeuristic[i]){
					links[j] = graph.planetToPlanetHeuristic[i][j];
				}
				dijkRoute.addNode(i, links);
			}

			console.log(dijkRoute.path('Tatooine', 'Endor'));

			return;

			winston.log(`Building heuristics`);



			var allPlanets = Object.keys(graph.planets);
			var planetToIndex = {};
			for(var i in allPlanets)
				planetToIndex[allPlanets[i]] = parseInt(i);



			for(var i = 0; i < allPlanets.length; i++){
				graph.planetToPlanetHeuristic[allPlanets[i]] = {};
			}

			for(var i = 0; i < routeRows.length; i++){
				if(!graph.planetToPlanetHeuristic[routeRows[i].origin][routeRows[i].destination])
					graph.planetToPlanetHeuristic[routeRows[i].origin][routeRows[i].destination] = 1;
				if(!graph.planetToPlanetHeuristic[routeRows[i].destination][routeRows[i].origin])
					graph.planetToPlanetHeuristic[routeRows[i].destination][routeRows[i].origin] = 1;
			}



			var displayArray = array => {
				for(var i in array)
					console.log(array[i].join(','))
			}


			var MathJs = require('mathjs');

			var matrix = MathJs.matrix('sparse', 'number');

			var sparseMatrixArray = [];
			for(var i in graph.planetToPlanetHeuristic){
				for(var j in graph.planetToPlanetHeuristic[i]){
					matrix.set([planetToIndex[i], planetToIndex[j]], graph.planetToPlanetHeuristic[i][j])
				}
			}

			console.log('SPARSE DONE')
			console.log('Tatooine index: ', planetToIndex["Tatooine"]);
			console.log('Endor index: ', planetToIndex["Endor"]);


			var powedMatrix = MathJs.multiply(matrix, matrix);

			var resultFound = powedMatrix.get([planetToIndex["Tatooine"], planetToIndex["Endor"]]);

			var count = 1;
			while(!resultFound){
				count++;
				console.log('Pow '+count)
				powedMatrix = MathJs.multiply(powedMatrix, matrix);
				resultFound = powedMatrix.get([planetToIndex["Tatooine"], planetToIndex["Endor"]])
			}
			console.log(resultFound);
			return;

			powedMatrix = MathJs.multiply(powedMatrix, matrix);
			powedMatrix = MathJs.multiply(powedMatrix, matrix);
			console.log('POW DONE')
			

			//matrix.set([1, 1], 23)
			console.log(powedMatrix);

			var powedMatrix = MathJs.pow(matrix, 6);
			console.log(displayArray(powedMatrix.toArray()))

			return;

			var sparseMatrix = MathJs.sparse(sparseMatrixArray);

			console.log(sparseMatrix)
			//console.log(sparseMatrix.toArray())

			var powed = MathJs.pow(sparseMatrix, 2);
			//powed = MathJs.multiply(sparseMatrix, powed);

			console.log(powed)


			return;




			console.log(displayArray(sparseMatrixArray));

			var sparseMatrix = MathJs.sparse(sparseMatrixArray, "number");

			//console.log(sparseMatrix);
			var csrMatrix = CSRMatrix.fromDense(sparseMatrixArray);
			console.log(csrMatrix)
			console.log(csrMatrix.apply(csrMatrix, []))
			var powedMatrix = MathJs.pow(sparseMatrixArray, 1);
			console.log(planetToIndex);
			console.log(graph.planetToPlanetHeuristic);
			console.log(displayArray(sparseMatrixArray));
			console.log(displayArray(powedMatrix));

			return;

		
			console.log(planetToIndex)
			console.log(sparseMatrix)

			/*for(var i in true)


			for(var i = 0; i < allPlanets.length; i++){
				sparseMatrix[]
			}*/

			/*for(var i in allPlanets){
				if(!sparseMatrix[i]) sparseMatrix[i] = [];
				for(var j in graph.planetToPlanetHeuristic[i]){
					if(!sparseMatrix[j]) sparseMatrix[j] = {};
					if(!sparseMatrix[i][j] || sparseMatrix[i][j] > graph.planetToPlanetHeuristic[i][j])
						sparseMatrix[i][j] = graph.planetToPlanetHeuristic[i][j];
					if(!sparseMatrix[j][i] || sparseMatrix[j][i] > graph.planetToPlanetHeuristic[j][i])
						sparseMatrix[j][i] = graph.planetToPlanetHeuristic[j][i];		
				}
			}*/

			/*for(var i = 0; i < matrix.length; i++)
				matrix[i] = new Array(allPlanets.length-1);*/


			console.log(sparseMatrix);
			return;




			console.log(graph.planetToPlanetHeuristic);

			return;
			for(var i in graph.planets){
				for(var j in graph.planets)
					if(!graph.planetToPlanetHeuristic[i][j])
						graph.planetToPlanetHeuristic[i][j] = allPlanets.length;
			}

			console.log(graph.planetToPlanetHeuristic)
			return;

			var count = 0;
			for(var i in graph.planets){
				count++;
				console.log(`${(count/Object.keys(graph.planets).length)*100}%`);
				for(var j in graph.planetToPlanetHeuristic[i]){
					for(var k in graph.planetToPlanetHeuristic[i]){
						//if(graph.planetToPlanetHeuristic[j][k] > 2) continue;
						if(!graph.planetToPlanetHeuristic[j][k])
							graph.planetToPlanetHeuristic[j][k] = 2;
						else if(graph.planetToPlanetHeuristic[j][k] > 1)
							graph.planetToPlanetHeuristic[j][k] += 1;
					}
					//console.log(i, graph.planetToPlanetHeuristic[j])
				}
			}


			/*for(var i in graph.planetToPlanetHeuristic){
				var curr = Object.keys(graph.planetToPlanetHeuristic[i]);
				for(var j in graph.planetToPlanetHeuristic[i]){
					console.log(graph.planetToPlanetHeuristic[j][i], j, i)
					if(!graph.planetToPlanetHeuristic[j][i])
						graph.planetToPlanetHeuristic[j][i] = 2;
				}
			}*/


			/*for(var i in graph.planetToPlanetHeuristic){
				for(var j = 0; j < allPlanets.length; j++){
					if(!graph.planetToPlanetHeuristic[i][allPlanets[j]] && allPlanets[j] != i)
						graph.planetToPlanetHeuristic[i][allPlanets[j]] = allPlanets.length;
				}
			}*/

			/*for(var i in graph.planetToPlanetHeuristic){
				for(var j in graph.planetToPlanetHeuristic[i]){
					graph.planetToPlanetHeuristic[j][i]--;
				}
			}*/

			console.log(graph.planetToPlanetHeuristic);

			resolve(graph);
		}catch(err){
			winston.error(`An unexpected error occured while building the graph.`)
			reject(err); 
		}
	});
};