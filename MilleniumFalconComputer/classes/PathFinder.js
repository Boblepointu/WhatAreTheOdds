"use strict";

module.exports = function(){
	const Logger = require('./Logger.js');
	const Toolbox = new (require('./Toolbox.js'))();
	const Params = Toolbox.getAppParams();

	this.precompute = async (UniverseWorkDb, BufferDb, MFalcon) => {
		var winston = Logger('PathFinder->precomputeUniverse', 2);
		try{
			// Finding out how much entries we got in the provided database.
			var totalEntries = await UniverseWorkDb.getLinksCount();
			winston.log(`There is ${totalEntries} links to discover in db.`);

			winston.log(`Pulling db slice by slice starting by our destination planet (${MFalcon.arrival}).`);

			// Slice number. Will be incremented each loop step.
			var hopCount = 1;
			// Total number of link pulled.
			var totalLinksPulled = 0;
			// Total number of link qualifyed.
			var totalLinksQualifyed = 0;
			// Number of time we cross MFalcon.arrival during the loop process
			var directRoutesCount = 0;
			// If we cross MFalcon.arrival during the process, this switch is turned to true.
			var isDestinationReachable = false;
			// List of planet we need to find in database for next loop.
			var planetsToPollHashMap = { [MFalcon.arrival]: true };
			// Registering the start node, MFalcon.arrival, with a hop to destination = 0.
			await BufferDb.setMultiPlanetHops([MFalcon.arrival], 0);
			// While we have planet to polls
			while(Object.keys(planetsToPollHashMap).length){
				// Get all links containing as origin or destination planets in planetToPollHashMap
				let links = await UniverseWorkDb.getNotPulledLinksWithPlanets(Object.keys(planetsToPollHashMap));
				// Incrementing totalLinksPulled
				totalLinksPulled += links.length;
				// Marking these links as pulled in universe work database
				await UniverseWorkDb.markPulledFromIds(links.map(link => link.id));
				// Discarding links with a travel time greater than MFalcon.autonomy
				links = links.filter(link => link.travel_time <= MFalcon.autonomy);
				// Incrementing totalLinksQualifyed
				totalLinksQualifyed += links.length;				
				// If links array is non empty, log status
				if(links.length)
					winston.log(`${((totalLinksQualifyed*100)/totalEntries).toFixed(2)}% => slice #${hopCount} Pulled ${totalLinksPulled} links from db, ${links.length} links qualify to this slice, given Millenium Falcon autonomy of ${MFalcon.autonomy} days.`);
				// Extracting planets names from links
				let planets = links.map(link => link.origin).concat(links.map(link => link.destination));
				// Defining which planet we need to pull for next loop
				let nextPlanetsToPollHashMap = {};
				planets.forEach(planet => {
					// If planet is equal to MFalcon.departure and we havn't already registered this planet this loop, increment directRoutesCount
					if(planet == MFalcon.departure && !planetsToPollHashMap[planet]) directRoutesCount++;
					// If we havn't already registered this planet for next loop, do it
					if(!planetsToPollHashMap[planet]) nextPlanetsToPollHashMap[planet] = true;
					// If this planet is equal to MFalcon.departure, mark the graph as travelable by switching isDestinationReachable to true
					if(planet == MFalcon.departure) isDestinationReachable = true;
				});
				// Convert next planet to poll hashmap to array
				let nextPlanetsToPollArray = Object.keys(nextPlanetsToPollHashMap);
				// If this array is not empty
				if(nextPlanetsToPollArray.length){
					// Save to buffer db the hop value for each one
					await BufferDb.setMultiPlanetHops(nextPlanetsToPollArray, hopCount);
					// Increment hopCount for next loop
					hopCount++;
				}
				// Replace planets polled by the new set
				planetsToPollHashMap = nextPlanetsToPollHashMap;
			}

			winston.log(`We pulled ${totalLinksPulled} links for search domain; the workset depth is ${hopCount} ${isDestinationReachable ? "and there is at least "+directRoutesCount+" route from "+MFalcon.departure+" to "+MFalcon.arrival : "and there is no route from "+MFalcon.departure+" to "+MFalcon.arrival}.`);
			winston.log(`Note: a result < 100% means some planets arn't linked to our search domain or links are impracticable given MFalcon autonomy (from ${MFalcon.departure} to ${MFalcon.arrival} with ${MFalcon.autonomy} days of autonomy).`);			
			
			// Returning the boolean saying if our graph is travelable from MFalcon.arrival to MFalcon.departure
			return isDestinationReachable;
		}catch(err){ throw err; }
	}

	this.explore = async (UniverseWorkDb, BufferDb, MFalcon) => {
		var winston = new Logger(`PathFinder->explore`, 2);
		try{
			// Defining a func to find the minimum travel time of route
			var getMinimumTravelTime = async route => {
				var travelTime = 0;
				for(let i = 0; i < route.length; i++)
					if(route[i+1])
						travelTime += Math.min(...(await UniverseWorkDb.getTravelTimes(route[i], route[i+1])));

				travelTime = travelTime + Math.floor(travelTime / MFalcon.autonomy) - 1;
				return travelTime;
			}
			// Getting back the route queue size from buffer database
			var routeQueueCount = await BufferDb.getRouteQueueCount();
			// If no routes are already in queue
			if(!routeQueueCount){
				winston.log(`No route in queue. Initialising it.`);
				// Initialising queue by adding a route with one node, MFalcon.departure
				await BufferDb.addRoutesToQueue([[MFalcon.departure]]);
			}
			let pullSize = Math.ceil(Params.ExploreBatchSize / 100);
			// Simple adapted batch Djikstra. Find all routes in graph.
			let routesBuffer = await BufferDb.pullRoutesFromQueue(pullSize);
			while(true){
				if(routesBuffer.length > Params.ExploreBatchSize){
					// Add all new routes to queue in buffer database
					await BufferDb.addRoutesToQueue(routesBuffer);
					// Getting back route count in buffer database
					let routesFound = await BufferDb.getRouteCount();
					// If route count is >= of MaxPrecalculatedRoutes
					if(routesFound >= Params.MaxPrecalculatedRoutes){
						// Log it
						winston.log(`Found ${routesFound} routes, hitted max precalculated route limit. Cleaning up routes queue and stopping here exploration.`);
						// Empty buffer database queue
						await BufferDb.cleanupQueue();
						// Break the explore loop. We finished search here.
						break;
					}					
					// Retrieve Params.ExploreBatchSize / 100 best routes
					routesBuffer = await BufferDb.pullRoutesFromQueue(pullSize);
				}else if(!routesBuffer.length) routesBuffer = await BufferDb.pullRoutesFromQueue(pullSize);
				// If we got no route, the search is finished. Breaking the loop.
				if(!routesBuffer.length) break;
				// Get the next available routes in buffer (ordered by closest to destination then smaller hops from departure)
				let currRoute = routesBuffer.shift();
				// Getting back links associated with last planet in route
				let links = await UniverseWorkDb.getLinksWithPlanet(currRoute[currRoute.length-1], MFalcon.autonomy);
				// Extracting all planet names from these links
				let planets = links.map(link => link.origin).concat(links.map(link => link.destination));
				// Filtering these planet name, excluding them if they are already in the route pulled before
				let neighbors = planets.filter(planet => currRoute.indexOf(planet) == -1);
				// For each neighbor
				for(let i = 0; i < neighbors.length; i++){
					let currNeighbor = neighbors[i];
					// Duplicate our route
					let newRoute = currRoute.slice(0);
					// Add current neighbor to it
					newRoute.push(currNeighbor);
					// If current neighbor is equal to MFalcon.arrival and route is not already saved in database
					if(currNeighbor == MFalcon.arrival && !(await BufferDb.isRouteAlreadyInDb(newRoute))){
						// Get minimum travel time
						let minimumTravelTime = await getMinimumTravelTime(newRoute);
						// Then we got a new route ! Log it
						winston.log(`${newRoute.length - 1} hops, ${minimumTravelTime} days: ${newRoute.join('->')}.`);
						// Insert route to buffer database
						await BufferDb.insertRoute(newRoute, minimumTravelTime);
					}
					// Else, save this route for queue
					else routesBuffer.push(newRoute);
				}
			}

			winston.log(`${await BufferDb.getRouteCount()} routes found !`);
			return;
		}catch(err){ throw err; }
	}

	this.compute = async (UniverseWorkDb, MFalcon, Empire, route) => {
		var winston = new Logger('PathFinder->computeOptimalWaypoints', 3);
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

			var getTimeToDestination = async from => {
				var startIndex = route.indexOf(from);
				var timeToDestination = 0;
				for(let i = startIndex; i < route.length; i++)
					if(route[i+1])
						timeToDestination += Math.max(...(await UniverseWorkDb.getTravelTimes(route[i], route[i+1])));

				timeToDestination = timeToDestination;// + Math.floor(timeToDestination / MFalcon.autonomy) - 1;
				return timeToDestination;
			}

			var getHeuristicRisk = async (from, travelTimeSoFar) => {
				var risk = 0;
				var startIndex = route.indexOf(from);
				var timeToDestination = await getTimeToDestination(from);
				for(let i = startIndex+1; i < route.length; i++)
					if(route[i] && bountyHunters[route[i]])
						bountyHunters[route[i]].forEach(bhDay => (bhDay >= travelTimeSoFar && bhDay <= (travelTimeSoFar+timeToDestination)) ? risk++ : 0);
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
					return verbosePath;
				}

				// Initialising neighbor list.
				let neighbors = [];
				// Identifying next planet in route.
				let nextPlanet = route[route.indexOf(node[1])+1];
				// Identifying next planet distance.
				let nextPlanetDistances = await UniverseWorkDb.getTravelTimes(node[1], nextPlanet);

				for(var i = 0; i < nextPlanetDistances.length; i++){
					// If we havn't got needed fuel to go to next planet; add a refuel node to neighbors only if last neighbors isn't a refuel.
					if(node[5] < nextPlanetDistances[i] && node[0] != 1){
						let refuelNode = [1, node[1], 1, node[3]+1, getHitCount(node[1], node[3]+1, node[3]+1)+node[4], MFalcon.autonomy, node[6]+1, await getHeuristicRisk(node[1], node[3]+1), node];
						neighbors.push(refuelNode);
					} 
					// Add next planet to the neighbors list. In case of multiple links between these planet, add them all
					if(node[5] >= nextPlanetDistances[i]) {
						let passingByNode = [0, nextPlanet, nextPlanetDistances[i], node[3]+nextPlanetDistances[i], getHitCount(nextPlanet, node[3]+nextPlanetDistances[i], node[3]+nextPlanetDistances[i])+node[4], node[5]-nextPlanetDistances[i], node[6]+1, await getHeuristicRisk(node[1], node[3]+nextPlanetDistances[i]), node];
						neighbors.push(passingByNode);
					}
				}

				// If last node in the chain isn't of type "wait" and heuristics != 0 for passingBy or refueling
				if(node[0] != 2 && neighbors[0] && neighbors[0][7] != 0){
					// Identify best nodes going up in wait times.
					// Loop through this space.
					for(let i = 1; i < (Empire.countdown); i++){
						// Build and add our wait node to the neighbors list.
						let waitNode = [2, node[1], i, node[3]+i, getHitCount(node[1], node[3], node[3]+i)+node[4], MFalcon.autonomy, node[6]+1, await getHeuristicRisk(node[1], node[3]+i), node];
						neighbors.push(waitNode);
						// If heuristics == 0; we got a clear path to destination. No need to add more nodes.
						if(waitNode[7] == 0) break;
					}
				}

				for(let i = 0; i < neighbors.length; i++)
					if(neighbors[i][3]+(await getTimeToDestination(neighbors[i][1])) <= Empire.countdown)
						heap.push(neighbors[i]);

				// Sort the heap, hitcount then heuristics then traveltime then refueling and passingBy over waiting.
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