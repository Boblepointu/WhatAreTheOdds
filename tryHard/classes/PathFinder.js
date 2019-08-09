"use strict";

module.exports = function(Db, MFalcon){
	const Logger = require('./Logger.js');
	const PathFinderToolBox = require('./PathFinderToolBox.js');
	const Config = require('../config.json');

	var linksMap = {};
	var indivisibleRoutes = {};
	var divisibleRoutes = {};

	var routesWithMeta = {};

	this.buildGraph = () => {
		var winston = Logger('PathFinder->buildGraph', 3);
		try{
			// Finding out how much entries we got in the provided database.
			var totalEntries = (await Db.execRequest(`SELECT count(*) as cnt from routes`))[0].cnt;
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
				let sqlReq = `SELECT origin as E1, destination as E2, travel_time as W from routes WHERE destination IN (${linkedToStr}) OR origin IN (${linkedToStr})`;
				// Executing request.
				let routesFound = await Db.execRequest(sqlReq);

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
			resolve();
		}catch(err){ reject(err); }
	}

	this.findIndivisibleRoutes = () => {
		var winston = new Logger('PathFinder->findIndivisibleRoutes', 4);
		try{
			winston.log(`Finding out indivisible routes pathes.`);
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
					// If hop count is superior or equal to current route; we head backward. Discarding this option.
					if(neighborPlanetHopCount >= currRouteHopCount && currRouteSecondLastPlanet) continue;
					// If current route already has this planet, we are looping. Discarding this option.
					if(currRoute.indexOf(neighborPlanet) != -1) continue;
					// Clone current route.
					let newRoute = currRoute.slice(0);
					// Add neighbor to new route.
					newRoute.push(neighborPlanet);
					// Generate a hash (here, we use the stringified route array) for easy comparison.
					let newRouteStr = newRoute.join('->');
					// If the last planet of the route is the final destination and this route doesn't already exist in hashmap.
					if(neighborPlanet == MFalcon.arrival && !indivisibleRoutes[newRouteStr]){
						// Adding it to the hashmap.
						indivisibleRoutes[newRouteStr] = newRoute;
						winston.log(`${newRoute.length - 1} hops : ${newRouteStr}.`);
					}
					// Else the route is stacked again for another round.
					else routesQueue.push(newRoute);
				}
			}

			winston.log(`${Object.keys(indivisibleRoutes).length} indivisible routes found !`);

			resolve(indivisibleRoutes);
		}catch(err){ reject(err); }
	}

	this.computeOptimalWaypoints = (Empire, route) => {
		var winston = new Logger('PathFinder->computeOptimalWaypoints', 4);
		try{
			winston.log(`Computing optimal waypoints for route [${route.join('->')}].`);
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

			// Function returning how much time we get on a planet at the same time a bounty hunter is on it
			var getHitCount = (planet, startDay, endDay) => {
				// If we got no bounty hunter data on this planet; no risk. Return 0.
				if(!bountyHunters[planet]) return 0;
				var increment = 0;
				// For each entry, if we are on this planet, increment risk.
				bountyHunters[planet].forEach(bhDay => (bhDay >= startDay && bhDay <= endDay) ? increment++ : 0);
				return increment;
			}

			// Simplified A* algorithm. We only look to go forward; so we don't need to store open and closed nodes.
			// Only a heap is needed.
			var heap = [];
			// For sake of performance, we use array to define our nodes
			// [ type(0=passBy,1=refuel,2=wait), planetName, actionDuration, totalTravelTime, 
			// totalBhCrossed, remainingFuel, totalStepCount, parent ]
			// Defining our start node.
			var startNode = [ 0, route[0], 0, 0, getHitCount(route[0], 0, 0), MFalcon.autonomy, 1, false ];
			// Our best node is initialised to the starting one.
			var bestNode = startNode;

			// Initialise heap with our start node.
			heap.push(startNode);

			// Here we go for the search !
			while(heap.length){
				// Get the first node in the heap.
				let node = heap.shift();

				// If we got a full path; end here.
				if(node[1] == MFalcon.arrival){
					// Function to reconstruct/flatten our linked list.
					var reconstruct = node => {
						// If we got a parent stored on our node, we have a level more to flatten.
						if(node[7]){
							// Recurse here.
							let path = reconstruct(node[7]);
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
					// Reconstructing our path from last found node.
					var path = reconstruct(node);
					// Reconstructing a verbose path. We don't need performance anymore.
					var verbosePath = [];
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
					let refuelNode = [1, node[1], 1, node[3]+1, getHitCount(node[1], node[3]+1, node[3]+1)+node[4], MFalcon.autonomy, node[6]+1];
					if(refuelNode[3] <= Empire.countdown) neighbors.push(refuelNode);
				} 
				// Else, add next planet to the neighbors list.
				else {
					let passingByNode = [0, nextPlanet, nextPlanetDistance, node[3]+nextPlanetDistance, getHitCount(nextPlanet, node[3]+nextPlanetDistance, node[3]+nextPlanetDistance)+node[4], node[5]-nextPlanetDistance, node[6]+1];
					if(passingByNode[3] <= Empire.countdown) neighbors.push(passingByNode);
				}

				// If last node in the chain isn't of type "wait"
				if(node[0] != 2){
					// Identify best nodes going up in wait times.
					// Arbitrary stop vars.
					let howMuchLoopWithoutImprovement = 0;
					let lowestHitCount = Infinity;
					// Loop through this space.
					for(let i = 1; i < (Empire.countdown-node[3]-1); i++){
						// If our arbitrary stop condition is greater than the config hardlimit, break.
						if(howMuchLoopWithoutImprovement > Config.HardLimit) break;
						// Computing hit count.
						let hitCount = getHitCount(node[1], node[3], node[3]+i);
						// If hitcount is better than the lowest found, reset arbitrary stop vars.
						if(hitCount < lowestHitCount){
							lowestHitCount = hitCount;
							howMuchLoopWithoutImprovement = 0;
						}
						// Else increment it.
						else howMuchLoopWithoutImprovement++;
						// Build and add our wait node to the neighbors list.
						let waitNode = [2, node[1], i, node[3]+i, hitCount+node[4], MFalcon.autonomy, node[6]+1];
						neighbors.push(waitNode);
					}
					// Identify best nodes going down in wait times.
					// Arbitrary stop vars.
					howMuchLoopWithoutImprovement = 0;
					lowestHitCount = Infinity;
					// Loop through this space.
					for(let i = Empire.countdown; i > (Empire.countdown-node[3]-1); i--){
						// If our arbitrary stop condition is greater than the config hardlimit, break.
						if(howMuchLoopWithoutImprovement > Config.HardLimit) break;
						// Computing hit count.
						let hitCount = getHitCount(node[1], node[3], node[3]+i);
						// If hitcount is better than the lowest found, reset arbitrary stop vars.
						if(hitCount < lowestHitCount){
							lowestHitCount = hitCount;
							howMuchLoopWithoutImprovement = 0;
						}
						// Else increment it.
						else howMuchLoopWithoutImprovement++;
						// Build and add our wait node to the neighbors list.
						let waitNode = [2, node[1], i, node[3]+i, hitCount+node[4], MFalcon.autonomy, node[6]+1];
						neighbors.push(waitNode);
					}		
				}

				// For each neighbors.
				for(let i = 0; i < neighbors.length; i++){
					// Add our last node as a parent.
					neighbors[i][7] = node;
					// If our neighbor is better than the best node found, based on hitcount, replace it.
					if(neighbors[i][4] <= bestNode[4]) bestNode = neighbors[i];
					// Add neighbor to the heap.
					heap.push(neighbors[i]);
				}
				// Sort the heap, hitcount then traveltime.
				heap.sort((nA, nB) => (nA[4] - nB[4]) || (nA[3] - nB[3]));
			}

			winston.warn(`Cannot find a valid path ! Route is ${route.join('->')} and empire countdown ${Empire.countdown} days.`);
			return false;
		}catch(err){ 
			winston.err(err);
			throw err; 
		}
	}

	this.findIndivisibleRoutesVariation = depth => {
		var winston = new Logger('PathFinder->findIndivisibleRoutesVariation', 4);
		return new Promise((resolve, reject) => {
			try{
				winston.log(`Finding out indivisible routes variations, until depth ${depth}.`);

				var searchDomains = {};

				for(let routeStr in indivisibleRoutes){
					var currRoute = indivisibleRoutes[routeStr];
					var currRouteBuildUp = [];
					var added = false;
					//console.log(currRoute)
					for(let planetIndex = 0; planetIndex < currRoute.length; planetIndex++){
						var currPlanet = currRoute[planetIndex];
						currRouteBuildUp.push(currPlanet);
						var currRouteBuildUpStr = currRouteBuildUp.join('->');
						//console.log(currRouteBuildUp)
						if(!searchDomains[currRouteBuildUpStr]){
							searchDomains[currRouteBuildUpStr] = { baseRoute: currRouteBuildUp, variations: [] };
							for(let subRouteStr in indivisibleRoutes){
								var currSubRoute = indivisibleRoutes[subRouteStr];
								if(subRouteStr.indexOf(currRouteBuildUpStr) != -1){
									searchDomains[currRouteBuildUpStr].variations.push(currSubRoute.slice(currSubRoute.indexOf(currPlanet)+1));
								}
							}
							//if(searchDomains[currRouteBuildUpStr].variations.length <= 1)
								//delete searchDomains[currRouteBuildUpStr];
							added = true;
							break;
						}
					}
				}

				var cnt = 0;
				for(var i in searchDomains){
					console.log(i, searchDomains[i])
					cnt += searchDomains[i].length;
				}
				console.log(cnt)




				return;

				for(let routeStr in indivisibleRoutes){
					let currCompleteRoute = indivisibleRoutes[routeStr];
					let buildUpRoute = [];
					for(let i in currCompleteRoute){
						var currPlanet = currCompleteRoute[i];
						buildUpRoute.push(currPlanet);
						let currBuildUpStr = buildUpRoute.join('->');

						if(routesRoots.indexOf(currBuildUpStr) == -1)
							routesRoots.push(currBuildUpStr);
						else break;
					}
				}

				console.log(routesRoots);

				return;

				/*var routesMap = {};
				var croppedBaseMap = {};

				for(let routeStr in indivisibleRoutes){
					//let cropToDepth = (maxDepth < indivisibleRoutes[routeStr].length) ? maxDepth : indivisibleRoutes[routeStr].length-1;
					let croppedRouteFromStart = indivisibleRoutes[routeStr].slice(0, indivisibleRoutes[routeStr].length-1);
					let croppedRouteFromEnd = indivisibleRoutes[routeStr].slice(0).reverse().slice(0, indivisibleRoutes[routeStr].length-1);
					routesMap[croppedRouteFromStart.join('->')] = { from: "start", baseLength: indivisibleRoutes[routeStr].length, route: croppedRouteFromStart };
					routesMap[croppedRouteFromEnd.join('->')] = { from: "end", baseLength: indivisibleRoutes[routeStr].length,  route: croppedRouteFromEnd };
					croppedBaseMap[croppedRouteFromStart.join('->')] = { baseLength: indivisibleRoutes[routeStr].length, route: croppedRouteFromStart };
					croppedBaseMap[croppedRouteFromEnd.join('->')] = { baseLength: indivisibleRoutes[routeStr].length, route: croppedRouteFromEnd };
				}

				var routesQueue = Object.values(routesMap);*/

				

				//console.log(routesQueue);
				//console.log(croppedBaseMap);

				var findAllRoutes = (E1, E2, E3) => {
					var foundRoutes = [];
					var routesQueue = [ [E1] ];
					
					while(routesQueue.length){
						let currRoute = routesQueue.shift();
						let currRouteLastPlanet = currRoute[currRoute.length-1];
						if(currRoute.length > depth) continue;
						for(let neighborPlanet in linksMap[currRouteLastPlanet]){
							if(currRoute.indexOf(neighborPlanet) != -1) continue;
							if(neighborPlanet == MFalcon.arrival) continue;
							//if(neighborPlanet == E3) continue;
							
							let newRoute = currRoute.slice(0);
							newRoute.push(neighborPlanet);
							if(neighborPlanet == E2 && newRoute.length > 2) foundRoutes.push(newRoute);
							else routesQueue.push(newRoute);
						}
					}

					return foundRoutes;
				};

				var routesQueue = [];
				for(let route in indivisibleRoutes)
					routesQueue.push({ baseLength: indivisibleRoutes[route].length, route: indivisibleRoutes[route] });

				//console.log(routesQueue)

				while(routesQueue.length){
					let currRoute = routesQueue.shift();
					for(let i = 0; i < currRoute.route.length; i++){
						let E1 = currRoute.route[i];
						let E2 = currRoute.route[i+1];
						let E3 = currRoute.route[i+2];
						if(!E2) continue;

						var variations = findAllRoutes(E1, E2, E3);
						for(let j = 0; j < variations.length; j++){
							let newRoute = currRoute.route.slice(0);
							//console.log('-----------')
							//console.log(newRoute.join('->'), variations[j].join('->'))
							newRoute.splice(i, 2);
							//console.log(newRoute.join('->'))
							newRoute.splice(i, 0, ...variations[j]);
							//console.log(newRoute.join('->'))
							//console.log('-----------')
							let newRouteStr = newRoute.join('->');
							//console.log(i, variations[j].length-1, ...variations[j], currRoute.route.join('->'), newRouteStr);
							if(!indivisibleRoutes[newRouteStr] && !divisibleRoutes[newRouteStr] && newRoute[newRoute.length-1] == MFalcon.arrival){
								divisibleRoutes[newRouteStr] = newRoute;
								if(newRoute.length < currRoute.baseLength+depth)
									routesQueue.push({ baseLength: currRoute.baseLength, route: newRoute });
							}
						}
						//console.log('------------');
					}
				}


				console.log(Object.assign({}, indivisibleRoutes, divisibleRoutes));
				console.log(Object.keys(Object.assign({}, indivisibleRoutes, divisibleRoutes)).length);
				return;

				var localIndivisibleRoutes = {};

				while(routesQueue.length){
					let currRoute = routesQueue.shift();
					let currRouteLastPlanet = currRoute[currRoute.length-1];
					let currRouteSecondLastPlanet = currRoute[currRoute.length-2];
					let currRouteHopCount = (currRoute[currRoute.length-2]) ? linksMap[currRouteSecondLastPlanet][currRouteLastPlanet].hopToDestination : Infinity;
					for(let neighborPlanet in linksMap[currRouteLastPlanet]){
						let neighborPlanetHopCount = linksMap[currRouteLastPlanet][neighborPlanet].hopToDestination;
						if(neighborPlanetHopCount >= currRouteHopCount && currRouteSecondLastPlanet) continue;
						if(currRoute.indexOf(neighborPlanet) != -1) continue;

						let newRoute = currRoute.slice(0);
						newRoute.push(neighborPlanet);
						let newRouteStr = newRoute.join('->');
						if(neighborPlanet == MFalcon.arrival && !indivisibleRoutes[newRouteStr]){
							indivisibleRoutes[newRouteStr] = newRoute;
							winston.log(`${newRoute.length - 1} hops : ${newRouteStr}.`);
						}else routesQueue.push(newRoute);
					}
				}

				winston.log(`${Object.keys(indivisibleRoutes).length} indivisible routes found !`);

				resolve(indivisibleRoutes);
			}catch(err){ reject(err); }
		});
	}
}