"use strict";

module.exports = function(Db, MFalcon, Empire){
	const Logger = require('./Logger.js');
	const PathFinderToolBox = require('./PathFinderToolBox.js');

	var linksMap = {};
	var indivisibleRoutes = {};
	var divisibleRoutes = {};

	var routesWithMeta = {};

	this.buildGraph = () => {
		var winston = Logger('PathFinder->buildGraph', 3);
		return new Promise(async (resolve, reject) => {
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
				// hopCount to keep track of the slice number we are currently computing.s
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
				winston.log(`${directPathesHopCount}`);
				resolve();
			}catch(err){ reject(err); }
		});
	}

	this.findIndivisibleRoutes = () => {
		var winston = new Logger('PathFinder->findIndivisibleRoutes', 4);
		return new Promise((resolve, reject) => {
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
		});
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