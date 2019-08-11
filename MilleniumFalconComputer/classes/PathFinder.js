"use strict";

module.exports = function(MFalcon){
	const Logger = require('./Logger.js');
	const Config = require('../config.json');

	var linksMap = {};
	var routes = {};

	this.buildGraph = Db => {
		var winston = Logger('PathFinder->buildGraph', 3);
		return new Promise(async (resolve, reject) => {
			try{
				// Finding out how much entries we got in the provided database.
				var totalEntries = (await Db.execRequest(`SELECT count(*) as cnt FROM routes`, []))[0].cnt;
				winston.log(`There is ${totalEntries} links to discover in db.`);

				// linkHashMaps to keep track of how much link we already pulled from db.
				var linksHashMap = {};
				// planetReachableFromSlices to keep track of which planet we already computed.
				var planetReachableFromSlices = {};
				// directPathesHopCount to keep track of how much direct routes we found.
				var directPathesHopCount = [];
				// planetsToPoll to keep track of next planet set to pull from db.
				var planetsToPoll = { [MFalcon.arrival]: true };
				// hopCount to keep track of the slice number we are currently computing.
				var hopCount = 1;
				
				winston.log(`Pulling db slice by slice starting by our destination planet (${MFalcon.arrival}).`);
				while(Object.keys(planetsToPoll).length){
					// Generating SQL parameter. The list of planet to poll from db.
					let linkedToStr = `"${Object.keys(planetsToPoll).join('","')}"`;
					// Building SQL request. We want all links containing one edge matching the planet to poll array.
					let sqlReq = `SELECT origin as E1, destination as E2, travel_time as W FROM routes WHERE destination IN (${linkedToStr}) OR origin IN (${linkedToStr})`;
					// Executing request.
					let routesFound = await Db.execRequest(sqlReq, []);

					// New planet set to poll from db.
					let preparePlanetsToPoll = {};
					for(let i = 0; i < routesFound.length; i++){
						let currRoute = routesFound[i];
						// MFalcon autonomy is < link distance; can't process later, discarding.
						if(MFalcon.autonomy < currRoute.W) continue;
						// We found a path !
						if(currRoute.E1 == MFalcon.departure || currRoute.E2 == MFalcon.departure) directPathesHopCount.push(hopCount);
						// If we havn't already pulled one of the edge of the link from db, add to next slice pull.
						if(!planetsToPoll[currRoute.E1] && !planetReachableFromSlices[currRoute.E1]) preparePlanetsToPoll[currRoute.E1] = true;
						if(!planetsToPoll[currRoute.E2] && !planetReachableFromSlices[currRoute.E2]) preparePlanetsToPoll[currRoute.E2] = true;
						// If its the first time we see one of the edge of the link, initialise array.
						if(!planetReachableFromSlices[currRoute.E1]) planetReachableFromSlices[currRoute.E1] = [];
						if(!planetReachableFromSlices[currRoute.E2]) planetReachableFromSlices[currRoute.E2] = [];
						// If we found out one of the edge of the link is reachable from a new slice; store that slice number.
						if(planetReachableFromSlices[currRoute.E1].indexOf(hopCount) == -1) planetReachableFromSlices[currRoute.E1].push(hopCount);
						if(planetReachableFromSlices[currRoute.E2].indexOf(hopCount) == -1) planetReachableFromSlices[currRoute.E2].push(hopCount);
						// If its the first time we see one of the edge of the link, initialise link map.
						if(!linksMap[currRoute.E1])	linksMap[currRoute.E1] = {};
						if(!linksMap[currRoute.E2]) linksMap[currRoute.E2] = {};
						// If this link is not stored in link map or this link is shorter than the stored one; write it. 
						if(!linksMap[currRoute.E1][currRoute.E2] || linksMap[currRoute.E1][currRoute.E2].distance > currRoute.W)
							linksMap[currRoute.E1][currRoute.E2] = { hopToDestination: hopCount, distance: currRoute.W };
						if(!linksMap[currRoute.E2][currRoute.E1] || linksMap[currRoute.E2][currRoute.E1].distance > currRoute.W)
							linksMap[currRoute.E2][currRoute.E1] = { hopToDestination: hopCount, distance: currRoute.W };
						// Store the link hashmap to keep track of links processed.
						if(!linksHashMap[currRoute.E1+currRoute.E2+currRoute.W]) linksHashMap[currRoute.E1+currRoute.E2+currRoute.W] = true;
					}
					planetsToPoll = preparePlanetsToPoll;
					winston.log(`${((Object.keys(linksHashMap).length*100)/totalEntries).toFixed(2)}% => Pulled ${routesFound.length} links from db, slice #${hopCount}`);
					hopCount++;
				}
				winston.log(`We pulled ${Object.keys(planetReachableFromSlices).length} planets from db; found ${directPathesHopCount.length} direct routes; with an universe depth of ${hopCount}.`);
				winston.log(`Note: a result < 100% means some planets arn't linked to our search domain or links are impracticable given MFalcon autonomy (from ${MFalcon.departure} to ${MFalcon.arrival} with ${MFalcon.autonomy} days of autonomy).`);
				resolve(linksMap);
			}catch(err){ reject(err); }
		});
	}

	this.findRoutes = async cb => {
		var winston = new Logger('PathFinder->findRoutes', 4);
		try{
			winston.log(`Finding out routes pathes.`);
			var routesQueue = [ [MFalcon.departure] ];

			// Simple adapted Djikstra.
			while(routesQueue.length){
				// Pulling out on route from the stack.
				let currRoute = routesQueue.shift();
				// Extracting the two last planets of route.
				let currRouteLastPlanet = currRoute[currRoute.length-1];
				let currRouteSecondLastPlanet = currRoute[currRoute.length-2];
				// Finding out the hop count to final destination of the last link in this route. If no link; score is "Infinity".
				let currRouteHopCount = currRouteSecondLastPlanet ? linksMap[currRouteSecondLastPlanet][currRouteLastPlanet].hopToDestination : Infinity;
				// For each available destination from the last planet in the current route
				for(let neighborPlanet in linksMap[currRouteLastPlanet]){
					// Extracting the hop count for this destination
					let neighborPlanetHopCount = linksMap[currRouteLastPlanet][neighborPlanet].hopToDestination;
					// If hop count is superior or equal to current route; we head backward or laterally. Discarding this option.
					// if(neighborPlanetHopCount >= currRouteHopCount && currRouteSecondLastPlanet) continue;
					// If current route already has this planet, we are looping. Discarding this option.
					if(currRoute.indexOf(neighborPlanet) != -1) continue;
					// Clone current route.
					let newRoute = currRoute.slice(0);
					// Add neighbor to new route.
					newRoute.push(neighborPlanet);
					// Generate a hash (here, we use the stringified route array) for easy comparison.
					let newRouteStr = newRoute.join('->');
					// If the last planet of the route is the final destination and this route doesn't already exist in hashmap.
					if(neighborPlanet == MFalcon.arrival && !routes[newRouteStr]){
						// Adding it to the hashmap.
						routes[newRouteStr] = newRoute;
						winston.log(`${newRoute.length - 1} hops : ${newRouteStr}.`);
						if(cb) await cb(newRoute);
					}
					// Else the route is stacked again for another round.
					else routesQueue.push(newRoute);
				}
			}

			winston.log(`${Object.keys(routes).length} routes found !`);

			return routes;
		}catch(err){ throw err; }
	}

	this.computeOptimalWaypoints = (Empire, route, _linksMap) => {
		var winston = new Logger('PathFinder->computeOptimalWaypoints', 3);
		try{			
			winston.log(`Computing optimal waypoints for route [${route.join('->')}].`);

			// If we pass a linkmap, override the one generated with buildGraph call.
			if(_linksMap) linksMap = _linksMap;

			// Extracting bounty hunters data associated with this route
			var tempBh = Empire.bounty_hunters.filter(bh => route.indexOf(bh.planet) != -1);
			var bountyHunters = {};
			// Looping through raw data
			for(let i = 0; i < tempBh.length; i++){
				// Initialise entry if needed
				if(!bountyHunters[tempBh[i].planet])
					bountyHunters[tempBh[i].planet] = [];
				// Associate planet to day with bounty hunter
				bountyHunters[tempBh[i].planet].push(tempBh[i].day);
			}

			// Computing minimum route traversal time
			var routeMinimumTraversalTime = 0;
			for(let i = 0; i < route.length; i++)
				if(route[i+1])
					routeMinimumTraversalTime += linksMap[route[i]][route[i+1]].distance;
			routeMinimumTraversalTime = routeMinimumTraversalTime + Math.round(routeMinimumTraversalTime/MFalcon.autonomy);


			// Function returning how much time we get on a planet at the same time a bounty hunter is on it
			var getHitCount = (planet, startDay, endDay) => {
				// If we got no bounty hunter data on this planet; no risk. Return 0.
				if(!bountyHunters[planet]) return 0;
				var increment = 0;
				// For each entry, if we are on this planet, increment risk.
				bountyHunters[planet].forEach(bhDay => (bhDay >= startDay && bhDay <= endDay) ? increment++ : 0);
				return increment;
			}

			var getTimeToDestination = from => {
				var startIndex = route.indexOf(from);
				var timeToDestination = 0;
				for(let i = startIndex; i < route.length; i++)
					if(route[i+1])
						timeToDestination += linksMap[route[i]][route[i+1]].distance
				timeToDestination = timeToDestination + Math.round(timeToDestination/MFalcon.autonomy);
				return timeToDestination;
			}

			var getHeuristicRisk = (from, travelTimeSoFar) => {
				var risk = 0;
				var startIndex = route.indexOf(from);
				var timeToDestination = getTimeToDestination(from);
				for(let i = startIndex; i < route.length; i++)
					if(route[i+1] && bountyHunters[route[i+1]])
						bountyHunters[route[i+1]].forEach(bhDay => (bhDay >= travelTimeSoFar && bhDay <= (travelTimeSoFar+timeToDestination)) ? risk++ : 0);
				return risk;
			}

			// Simplified A* algorithm. We only look to go forward; so we don't need to store closed nodes.
			// Only a heap is needed.
			var heap = [];
			// For sake of performance, we use array to define our nodes
			// [ type(0=passingBy,1=refueling,2=waiting), planetName, actionDuration, totalTravelTime, 
			// totalBhCrossed, remainingFuel, totalStepCount, heuristics, parent ]
			// Defining our start node.
			var startNode = [ 0, route[0], 0, 0, getHitCount(route[0], 0, 0), MFalcon.autonomy, 1, false ];

			// Initialise heap with our start node.
			heap.push(startNode);

			// Function to reconstruct/flatten our linked list.
			var reconstruct = node => {
				// If we got a parent stored on our node, we have a level more to flatten.
				if(node[8]){
					// Recurse here.
					let path = reconstruct(node[8]);
					// Remove parent from node.
					node.pop();
					// Add node to path.
					path.push(node);
					// return path.
					return path;
				}
				// This is the starting node. No parent; no path. Should not happen (data should be correctly constrained before A* search).
				else return [ node ]
			};

			// Here we go for the search !
			while(heap.length){
				// Get the first node in the heap.
				let node = heap.shift();

				// If we got a full path; end here.
				if(node[1] == MFalcon.arrival){
					// Reconstructing our path from last found node.
					let path = reconstruct(node);
					// Reconstructing a verbose path. We don't need performance anymore.
					let verbosePath = [];
					for(let i = 0; i < path.length; i++){
						let verboseNode = {};
						if(path[i][0] == 0) verboseNode.type = "passingBy";
						else if(path[i][0] == 1) verboseNode.type = "refueling";
						else verboseNode.type = "waiting";
						verboseNode.planet = path[i][1];
						verboseNode.duration = path[i][2];
						verboseNode.travelTime = path[i][3];
						verboseNode.hitCount = path[i][4];
						verboseNode.remainingFuel = path[i][5];
						verboseNode.steps = path[i][6];
						verbosePath.push(verboseNode);
					}
					winston.log(`Found a path for route ${route.join('->')} ! Achievable in ${verbosePath[verbosePath.length-1].travelTime} days, with ${verbosePath[verbosePath.length-1].hitCount} bountyhunters crossed.`);
					//console.log(verbosePath);
					return verbosePath;
				}

				// Initialising neighbor list.
				let neighbors = [];
				// Identifying next planet in route.
				let nextPlanet = route[route.indexOf(node[1])+1];
				// Identifying next planet distance.
				let nextPlanetDistance = linksMap[node[1]][nextPlanet].distance;

				// If we havn't got needed fuel to go to next planet; add a refuel node to neighbors.
				if(node[5] < nextPlanetDistance){
					let refuelNode = [1, node[1], 1, node[3]+1, getHitCount(node[1], node[3]+1, node[3]+1)+node[4], MFalcon.autonomy, node[6]+1, getHeuristicRisk(node[1], node[3]+1), node];
					if(refuelNode[3] <= Empire.countdown) neighbors.push(refuelNode);
				} 
				// Else, add next planet to the neighbors list.
				else {
					let passingByNode = [0, nextPlanet, nextPlanetDistance, node[3]+nextPlanetDistance, getHitCount(nextPlanet, node[3]+nextPlanetDistance, node[3]+nextPlanetDistance)+node[4], node[5]-nextPlanetDistance, node[6]+1, getHeuristicRisk(node[1], node[3]+nextPlanetDistance), node];
					if(passingByNode[3] <= Empire.countdown) neighbors.push(passingByNode);
				}

				// If last node in the chain isn't of type "wait" and heuristics != 0 for passingBy or refueling
				if(node[0] != 2 && neighbors[0] && neighbors[0][7] != 0){
					// Identify best nodes going up in wait times.
					// Loop through this space.
					for(let i = 1; i < (Empire.countdown-node[3]-1); i++){
						// Build and add our wait node to the neighbors list.
						let waitNode = [2, node[1], i, node[3]+i, getHitCount(node[1], node[3], node[3]+i)+node[4], MFalcon.autonomy, node[6]+1, getHeuristicRisk(node[1], node[3]+i), node];
						heap.push(waitNode);
						// If heuristics == 0; we got a clear path to destination. No need to add more nodes.
						if(waitNode[7] == 0) break;
					}
				}

				heap = heap.concat(neighbors);
				// Sort the heap, hitcount then heuristics then traveltime then refueling over waiting.
				heap.sort((nA, nB) => (nA[4] - nB[4]) || (nA[7] - nB[7]) || (nA[3] - nB[3]) || (nA[0] - nB[0]));
			}

			winston.warn(`Cannot find a valid path ! Route is ${route.join('->')} and empire countdown ${Empire.countdown} days.`);
			return false;
		}catch(err){ 
			winston.error(err);
			throw err; 
		}
	}
}