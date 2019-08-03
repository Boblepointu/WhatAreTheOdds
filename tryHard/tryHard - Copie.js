const Toolbox = new (require('./classes/Toolbox.js'))();
const GraphBuilder = require('./classes/GraphBuilder.js');
const DbReader = new (require('./classes/DbReader.js'))();

const AStar = require('./aStar.js');

var Thread = function(funcToRun, params){
	var ThreadSpawn = require('threads').spawn;

	return new Promise((resolve, reject) => {
		try{
			thread = ThreadSpawn(funcToRun);
			thread.send(params);
			thread.on('message', results => {
				resolve(results);
				thread.kill();
			});
			thread.on('error', function(error) {
				console.error('Worker errored:', error);
			})
			thread.on('exit', function() {
				console.log('Worker has been terminated.');
			});			
		}catch(err){ reject(err); }
	});
}
const ThreadSpawn = require('threads').spawn;



var pathFinder = function(startPlanet, endPlanet, graph, bufferSize, planetToHopCount){

	var findPathes = function(params, done){
		var startPlanet = params.startPlanet;
		var endPlanet = params.endPlanet;
		var nbRouteToFind = params.nbRouteToFind;
		var routesToBypass = params.routesToBypass;
		var allowLoop = params.allowLoop;
		var autonomy = params.autonomy;
		var countdown = params.countdown;
		var strategy = params.strategy;
		var bufferSize = params.bufferSize;
		var planets = params.planets;
		var timeoutSec = params.timeoutSec;

		var startTime = Math.floor((new Date()).getTime()/1000);
		// Initialising the search with one route, containing only the startPlanet
		var startRoute = { distance: 0, refuelCount: 0, path: [startPlanet], pathMap: { }, hopLeft: Infinity };
		startRoute.pathMap[startPlanet] = true;
		var routeQueue = [ startRoute ];
		// The buffered routes will be stored in this array
		var bufferedRoutes = [];		
		// The complete routes will be stored in this array
		var completedRoutes = [];
		// Banned route from the search, in case we want to redo it later
		if(!routesToBypass) routesToBypass = [];

		//var sortFunction = (a, b) => { return a.hopLeft - b.hopLeft || (a.distance+a.refuelCount) - (b.distance+b.refuelCount); };

		var distanceSort = (a, b) => { return (a.distance+a.refuelCount) - (b.distance+b.refuelCount); };
		var closeSort = (a, b) => { return a.hopLeft - b.hopLeft; };
		var closestThenDistance = (a, b) => { return a.hopLeft - b.hopLeft || (a.distance+a.refuelCount) - (b.distance+b.refuelCount); };

		var bufferise = () => {
			 if(routeQueue.length <= bufferSize) return;
			 bufferedRoutes = bufferedRoutes.concat(routeQueue.slice(bufferSize));
			 routeQueue = routeQueue.slice(0, bufferSize);
		}
		var debufferise = () => {
			if(routeQueue.length > bufferSize) return;
			routeQueue = routeQueue.concat(bufferedRoutes.slice(0, bufferSize));
			bufferedRoutes = bufferedRoutes.slice(bufferSize);
		}

		// Search loop
		while(routeQueue.length){
			if(Math.floor((new Date()).getTime()/1000) - startTime > timeoutSec)
				break;
			//console.log(routeQueue.length, bufferedRoutes.length)
			//bufferedRoutes.sort(sortFunction);

			// Get a route queued
			var currRoute = routeQueue.shift();
			// Get the last planet in this route
			var lastRoutePlanet = currRoute.path[currRoute.path.length-1];
			//

			// If our route is complete (last planet being endPlanet)
			if(lastRoutePlanet == endPlanet){
				// If our route isn't banned, add it to the complete route array
				if(routesToBypass.indexOf(currRoute.path.join('->')) == -1)
					completedRoutes.push(currRoute);

				// routeQueue.sort(sortFunction);
				// debufferise();
				// Continue the loop, nothing more to do here
				continue;
			}

			// If we found enough route, break here
			if(completedRoutes.length >= nbRouteToFind)
				break;

			// Get the neighbors of current route
			var neighbors = [];
			for(var i in planets[lastRoutePlanet].links)
				neighbors.push(planets[lastRoutePlanet].links[i]);
			
			for(var i = 0; i < neighbors.length; i++){
				// If our current route already contain this neighbor, bypass it, except if we allow loopings.
				if(currRoute.pathMap[neighbors[i].planet] && !allowLoop) continue;
				let newRoute = { distance: currRoute.distance, path: currRoute.path.slice(0), pathMap: Object.assign({}, currRoute.pathMap) };
				newRoute.path.push(neighbors[i].planet);
				newRoute.pathMap[neighbors[i].planet] = true;
				newRoute.distance += neighbors[i].travelTime;
				newRoute.hopLeft = planetToHopCount[neighbors[i].planet];
				//console.log(newRoute)
				newRoute.refuelCount = Math.floor(newRoute.distance / autonomy);
				if((newRoute.distance + newRoute.refuelCount) <= countdown){
					routeQueue.push(newRoute);
					/*console.log((newRoute.path.length - 2), planetToHopCount[startPlanet])
					if((newRoute.path.length - 2) <= planetToHopCount[startPlanet])
						routeQueue.push(newRoute);
					else
						bufferedRoutes.push(newRoute);*/
				}
			}
			//routeQueue.sort((a, b) => { return (a.distance+a.refuelCount) - (b.distance+b.refuelCount); });
			
			/*
				var bests = routeQueue.slice(0).sort(distanceSort);
				var closests = routeQueue.slice(0).sort(closeSort);
				routeQueue = bests.slice(0, bufferSize).concat(closests.slice(0, bufferSize));
				bufferedRoutes = bufferedRoutes.concat(bests.slice(bufferSize), closests.slice(bufferSize));
			*/

			if(routeQueue.length == 0){
				console.log('here')
				bufferedRoutes.sort(closestThenDistance);
				debufferise();
			}
			//routeQueue.sort(closestThenDistance);
			routeQueue.sort(closestThenDistance);
		}



		completedRoutes.sort((a, b) => { return (a.distance+a.refuelCount) - (b.distance+b.refuelCount); });

		if(done)
			done({ 
				strategy: strategy
				, routes: completedRoutes 
			});
		return completedRoutes;
	}

	//console.log(graph.planets)
	var routesFound = findPathes({
		startPlanet: startPlanet
		, endPlanet: endPlanet
		, nbRouteToFind: 1
		, routesToBypass: []
		, allowLoop: false
		, autonomy: 10000
		, countdown: 50
		, strategy: "shortestHopLeftThenDistance"
		, planets: graph.planets
		, bufferSize: Infinity
		, timeoutSec: 300
	});

	for(var i = 0; i < routesFound.length; i++){
		console.log(`Route #${i} => ${routesFound[i].distance+routesFound[i].refuelCount} days; ${routesFound[i].path.length} hops; ${routesFound[i].path.join('->')}`)
	}
	console.log();
	return 




	var path = AStar({
		start: "Tatooine"
		, isEnd: node => { return node == "Endor"; }
		, neighbor: node => { return Object.keys(graph.planets[node].links); }
		, distance: (nodeA, nodeB) => { return graph.planets[nodeA].links[nodeB].travelTime; }
		, heuristic: node => { return 0; }
	});

	console.log(path)



	/*var routes = findPathes({
		startPlanet: startPlanet
		, endPlanet: endPlanet
		, nbRouteToFind: 1
		, routesToBypass: []
		, allowLoop: false
		, autonomy: 100
		, countdown: 40
		, strategy: "shortestDistance"
		, planets: graph.planets
		, bufferSize: 100
		, timeoutSec: 30
	});

	console.log(routes);*/


	/*var strategies = ["shortestDistance", "longestDistance", "longestPath", "shortestPath", "random", "none"];
	var workerPromises = [];
	var toBypass = [];
	var routes = [];

	var dedupRoutes = routes => {
		var dedupObj = {};
		var resultArray = [];
		//console.log(routes)
		for(var i = 0; i < routes.length; i++){
			//console.log(JSON.stringify(routes[i]))
			dedupObj[routes[i].path.join('->')] = routes[i];
		}

		for(var i in dedupObj) resultArray.push(dedupObj[i]);

		return resultArray;
	}

	var jobResultCb = jobResult => {
		var strategy = jobResult.strategy;
		var foundRoutes = jobResult.routes;
		console.log(`Yielded ${foundRoutes.length} new routes.`);
		routes = routes.concat(foundRoutes);
		routes = dedupRoutes(routes);
		console.log(`Routes array now contain ${routes.length} routes.`);
		//console.log(routes)

		for(var i in routes){
			console.log(routes[i].path.join('->'));
		}

		for(var j = 0; j < foundRoutes.length; j++)
			toBypass.push(foundRoutes[j].path.join('->'));

		if(foundRoutes.length == 0) return;

		var thread = Thread(findPathes, {
			startPlanet: startPlanet
			, endPlanet: endPlanet
			, nbRouteToFind: 10
			, routesToBypass: toBypass
			, allowLoop: false
			, autonomy: 100
			, countdown: 40
			, strategy: strategy
			, planets: graph.planets
			, bufferSize: 100
			, timeoutSec: 10
		});
		thread.then(jobResultCb);
	};*/

		/*var thread = Thread(findPathes, {
			startPlanet: startPlanet
			, endPlanet: endPlanet
			, nbRouteToFind: 100
			, routesToBypass: toBypass
			, allowLoop: false
			, autonomy: 100
			, countdown: 1000
			, strategy: "none"
			, planets: graph.planets
			, bufferSize: 1000
			, timeoutSec: 600
		});
		thread.then(jobResultCb);*/

	/*for(var i = 0; i < strategies.length; i++){
		var thread = Thread(findPathes, {
			startPlanet: startPlanet
			, endPlanet: endPlanet
			, nbRouteToFind: 10
			, routesToBypass: toBypass
			, allowLoop: false
			, autonomy: 100
			, countdown: 10000
			, strategy: strategies[i]
			, planets: graph.planets
			, bufferSize: 10
			, timeoutSec: 30
		});
		thread.then(jobResultCb);
	}*/

	/*var thread = Thread(findPathes, {
		startPlanet: startPlanet
		, endPlanet: endPlanet
		, nbRouteToFind: 1
		, routesToBypass: toBypass
		, allowLoop: false
		, autonomy: 100
		, countdown: 10000
		, strategy: "shortestDistance"
		, planets: graph.planets
		, bufferSize: 1
		, timeoutSec: 30
	});
	thread.then(jobResultCb);*/

	/*for(var i = 0; i < 1; i++){
		var thread = Thread(findPathes, {
			startPlanet: startPlanet
			, endPlanet: endPlanet
			, nbRouteToFind: 1
			, routesToBypass: toBypass
			, allowLoop: false
			, autonomy: 100
			, countdown: 10000
			, strategy: "none"
			, planets: graph.planets
			, bufferSize: 10
			, timeoutSec: 30
		});
		thread.then(jobResultCb);
	}*/

	/*var launchCount = 0;
	setInterval(function(){
		for(var i = 0; i < strategies.length; i++){
			var thread = Thread(findPathes, {
				startPlanet: startPlanet
				, endPlanet: endPlanet
				, nbRouteToFind: 1
				, routesToBypass: toBypass
				, allowLoop: false
				, autonomy: 10
				, countdown: 100
				, strategy: strategies[i]
				, planets: graph.planets
				, bufferSize: 10
				, timeoutSec: 5*launchCount
			});
			thread.then(jobResultCb);
		}
		launchCount++;
	}, (5000*launchCount) + 1000);*/

	//console.log(graph.planets);
	//console.log(graph.planets[0]);




	/*routesFound = findPathes({
		startPlanet: startPlanet
		, endPlanet: endPlanet
		, nbRouteToFind: 1
		, routesToBypass: toBypass
		, allowLoop: false
		, autonomy: 10
		, countdown: 30
		, strategy: "shortestDistance"
		, planets: graph.planets
		, bufferSize: 5
	});
	console.log(`ShortestDistance strategy yielded ${routesFound.length} new routes.`);
	for(var j = 0; j < routesFound.length; j++) toBypass.push(routesFound[j].path.join('->'));
	routes = routes.concat(routesFound);*/

	/*for(var i = 0; i < 10; i++){
		var toBypass = [];
		for(var j = 0; j < routes.length; j++) toBypass.push(routes[j].path.join('->'));

		routesFound = this.findPathes(1, toBypass, false, 10, 100, "none");
		console.log(`None strategy yielded ${routesFound.length} new routes.`);
		for(var j = 0; j < routesFound.length; j++) toBypass.push(routesFound[j].path.join('->'));
		routes = routes.concat(routesFound);

		routesFound = this.findPathes(1, toBypass, false, 10, 100, "random");
		console.log(`Random strategy yielded ${routesFound.length} new routes.`);
		for(var j = 0; j < routesFound.length; j++) toBypass.push(routesFound[j].path.join('->'));
		routes = routes.concat(routesFound);	

		routesFound = this.findPathes(1, toBypass, false, 10, 100, "shortestDistance");
		console.log(`ShortestDistance strategy yielded ${routesFound.length} new routes.`);
		for(var j = 0; j < routesFound.length; j++) toBypass.push(routesFound[j].path.join('->'));
		routes = routes.concat(routesFound);
		
		routesFound = this.findPathes(1, toBypass, false, 10, 100, "longestDistance");
		console.log(`LongestDistance strategy yielded ${routesFound.length} new routes.`);
		for(var j = 0; j < routesFound.length; j++) toBypass.push(routesFound[j].path.join('->'));
		routes = routes.concat(routesFound);

		routesFound = this.findPathes(1, toBypass, false, 10, 100, "shortestPath");
		console.log(`ShortestPath strategy yielded ${routesFound.length} new routes.`);
		for(var j = 0; j < routesFound.length; j++) toBypass.push(routesFound[j].path.join('->'));
		routes = routes.concat(routesFound);

		routesFound = this.findPathes(1, toBypass, false, 10, 100, "longestPath");
		console.log(`LongestPath strategy yielded ${routesFound.length} new routes.`);
		for(var j = 0; j < routesFound.length; j++) toBypass.push(routesFound[j].path.join('->'));
		routes = routes.concat(routesFound);

		routes.sort((a, b) => { return (a.distance+a.refuelCount) - (b.distance+b.refuelCount); });
		for(var j in routes)
			console.log(routes[j].distance, routes[j].refuelCount, routes[j].path.join('->'));
		console.log('-----------------');
		console.log(`Found ${routes.length} routes !`);
		console.log('-----------------');
		//console.log(routes.length);
	}*/
}

var main = async function(){

	var DataSet = await Toolbox.readData('./dataset/live/millenium-falcon.json');

	console.log(DataSet);
	var fullRoutesEntries = [];
	var fetchedPlanets = {};
	var planetToHopCount = {};
	var distanceMap = {};
	var linkMap = {};

	var planetList

	distanceMap[DataSet.MFalcon.arrival] = 0;
	fetchedPlanets[DataSet.MFalcon.arrival] = true;
	var nextSearch = [DataSet.MFalcon.arrival];
	var hopCount = 0;
	while(true){
		hopCount++;
		var partRouteEntries = [];
		do{
			var part = nextSearch.splice(0, 100000)
			partRouteEntries = partRouteEntries.concat(await DbReader.readLinksEntries(DataSet.MFalcon.routes_db, part));

		}while(nextSearch.length > 0)

		var localLinks = [];
		for(var i in partRouteEntries){
			if(!linkMap[partRouteEntries[i].origin+partRouteEntries[i].destination+partRouteEntries[i].travel_time]){
				linkMap[partRouteEntries[i].origin+partRouteEntries[i].destination+partRouteEntries[i].travel_time] = true;
				localLinks.push(partRouteEntries[i])
			}

			if(!fetchedPlanets[partRouteEntries[i].origin])
				nextSearch.push(partRouteEntries[i].origin)
			if(!fetchedPlanets[partRouteEntries[i].destination])
				nextSearch.push(partRouteEntries[i].destination)

			fetchedPlanets[partRouteEntries[i].destination] = true;
			fetchedPlanets[partRouteEntries[i].origin] = true;
			if(!planetToHopCount[partRouteEntries[i].destination])
				planetToHopCount[partRouteEntries[i].destination] = hopCount;
			if(!planetToHopCount[partRouteEntries[i].origin])
				planetToHopCount[partRouteEntries[i].origin] = hopCount;

			if(partRouteEntries[i].origin == DataSet.MFalcon.departure || partRouteEntries[i].destination == DataSet.MFalcon.departure){
				console.log('Route found ! Reconstructing path.');

			}					
		}
		fullRoutesEntries.push(localLinks);

		console.log("nextSearch.length : ", nextSearch.length)

		if(nextSearch.length == 0)
			break;
	}

	console.log("planetToHopCount['Tatooine'] : ", planetToHopCount['Tatooine']);
	//console.log(planetToHopCount)

	var Graph = await GraphBuilder(fullRoutesEntries.flat(), [], DataSet.MFalcon.autonomy);


	pathFinder('Tatooine', 'Endor', Graph, 50, planetToHopCount);

	return;
	var path = AStar({
		start: "Tatooine"
		, isEnd: node => { return node == "Endor"; }
		, neighbor: node => { return Object.keys(Graph.planets[node].links); }
		, distance: (nodeA, nodeB) => { return planetToHopCount[nodeB] - planetToHopCount[nodeA];/*Graph.planets[nodeA].links[nodeB].travelTime;*/ }
		, heuristic: node => { return 0; }
	});

	console.log(path)

	return;

	//var Graph = await GraphBuilder(DataSet.Universe, [], DataSet.MFalcon.autonomy);
	


	//console.log(Graph)
	//console.log(Graph.getNeighbors('Tatooine'))
	//console.log(Graph.getDistance('Tatooine', 'Dagobah'))

	

	return;

	var results = [];
	var textResults = [];
	for(var i = 0; i < 10; i++){
		var route = AStar({
			start: 'Tatooine',
			numberOfRouteToFind: 10,
			isEnd: (end, route) => { 
				//return false;
				//if(textResults.indexOf(route.toString()) != -1)
				//	return false
				return end == 'Endor'
			}, 
			neighbor: Graph.getNeighbors,
			distance: (planetA, planetB, route) => {
				//console.log(route)
				if(textResults.indexOf(route.toString()) != -1){
					return Infinity;
				}
				else
					return Graph.getDistance(planetA, planetB);
			},
			heuristic: () => 0
		});

		textResults.push(route.path.toString());	
		results.push(route);
	}
	console.log('-----------')
	console.log(results)
}

main();