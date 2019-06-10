"use strict";

module.exports = function(MFalcon, Empire, Graph, HeapSizeLevel1, HeapSizeLevel2, DepthLevel2, Timeout){
	const Logger = require('./Logger.js');
	const PathFinderToolBox = require('./PathFinderToolBox.js');
	const pathFinderToolBox = new PathFinderToolBox(Graph, MFalcon, Empire);

	var timeStarted = 0;

	var updateRoute = function(route){
		try{
			route.complete = (route.path[0] == MFalcon.departure && route.path[route.path.length-1] == MFalcon.arrival) ? true : false;

			var timeToPosition = pathFinderToolBox.computeTimeToPosition(route);
			var chanceToMakeIt = pathFinderToolBox.computeChanceToMakeIt(Graph, timeToPosition);
			var distanceScore = pathFinderToolBox.computeDistanceScore(timeToPosition);

			var riskMap = pathFinderToolBox.computeRiskMap(route, Empire.bounty_hunters, timeToPosition);

			for(var day in timeToPosition);
			route.travelTime = parseInt(day);
			
			route.identifier = pathFinderToolBox.generateRouteIdentifier(route, timeToPosition);
			route.liteIdentifier = pathFinderToolBox.generateRouteIdentifier(route, timeToPosition, true);
			route.travelable = pathFinderToolBox.isRouteTravelable(route);
			route.timeToPosition = timeToPosition;
			route.riskMap = riskMap;
			var riskScore = pathFinderToolBox.computeRiskScore(route);
			var aggregatedScore = chanceToMakeIt + distanceScore + riskScore;			
			route.score = { aggregatedScore: aggregatedScore, distanceScore: distanceScore, chanceToMakeIt: chanceToMakeIt, riskScore: riskScore };
			route.perfect = (route.score.chanceToMakeIt == 100) ? true : false;
			return route;
		}catch(err){ throw err; }
	}

	var extendRoute = function(route){
		var lWinston = Logger(`PathFinder-computeLevel1-extendRoute`, 4);
		try{
			lWinston.log(`Finding out which possibilities we have to extend the current route (${route.liteIdentifier}).`);
			var extendedRoutes = [];
			
			var lastRoutePlanet = route.path[route.path.length-1];
			lWinston.log(`Last position of route ${route.liteIdentifier} is ${lastRoutePlanet}. There is ${Graph.planets[lastRoutePlanet].links.length} available positions to go next.`);

			var links = Graph.planets[lastRoutePlanet].links;
			for(let i in links){
				let nextPosition = links[i].planet;
				let newRoute = pathFinderToolBox.cloneRoute(route);

				if(newRoute.path.indexOf(nextPosition) != -1){
					lWinston.warn(`Unable to add ${nextPosition} to route ${newRoute.liteIdentifier}. Deleting this route instance.`);
					continue;
				}
				newRoute.path.push(nextPosition);
				newRoute.linkNumberMap.push(parseInt(i));
				if(nextPosition != MFalcon.arrival)
					newRoute.waitMap.push(0);

				updateRoute(newRoute);
				if(newRoute.travelable)
					extendedRoutes.push(newRoute);
			}
			return extendedRoutes;
		}catch(err){ throw err; }
	}

	var improveRoute = function(route){
		var lWinston = Logger(`PathFinder-computeLevel2-improveRoute`, 4);
		try{
			var improvedRoutes = [];

			for(let i in route.waitMap){
				var currPlanet = route.path[i];
				for(let j in route.riskMap){
					if(route.riskMap[j] == 0) continue;
					if(!route.timeToPosition[j]) continue;

					// I think we call that a gradient descent ?
					for(var k = 1; Math.floor(route.riskMap[j]/k) > 1 && k < 10; k++){
						let newRoute = pathFinderToolBox.cloneRoute(route);
						newRoute.waitMap[i] += Math.floor(route.riskMap[j]/k);
						updateRoute(newRoute);
						if(newRoute.score.riskScore > route.score.riskScore && newRoute.travelable)
							improvedRoutes.push(newRoute);
					}

					let newRoute = pathFinderToolBox.cloneRoute(route);
					newRoute.waitMap[i] += 1;
					updateRoute(newRoute);
					if(newRoute.score.riskScore > route.score.riskScore && newRoute.travelable)
						improvedRoutes.push(newRoute);					
				}
			}
			return improvedRoutes;
		}catch(err){ throw err; }
	}	

	var findValidPathes = function(routeArray){
		var lWinston = Logger(`PathFinder-computeLevel1-findValidPathes`, 3);
		try{
			var discardedRouteArray = [];
			var roundCount = 0;

			while(true){
				roundCount++;
				lWinston.log(``);
				lWinston.log(`*******************************************************`);
				lWinston.log(`*******************************************************`);
				lWinston.log(`------------------->   Round ${roundCount}   <---------------------`);
				lWinston.log(`*******************************************************`);
				lWinston.log(`*******************************************************`);
				lWinston.log(``);

				let selectedRoutesArray = [];

				lWinston.log(`Filling routes to compute with discarded ones to achieve heap size.`);
				routeArray = routeArray.concat(discardedRouteArray.splice(0, HeapSizeLevel1));

				lWinston.log(`Updating ${routeArray.length} route meta. Defining which routes are extendable. Defining which routes are complete.`);
				for(let i in routeArray){
					let currRoute = routeArray[i];
					if(!currRoute.complete)	updateRoute(currRoute);
					if(!currRoute.complete && currRoute.travelable){
						let extendedRoutes = extendRoute(currRoute);
						if(extendedRoutes.length == 0) continue;
						for(let j in extendedRoutes) selectedRoutesArray.push(extendedRoutes[j]);
					}
					else if(currRoute.complete && currRoute.travelable)
						selectedRoutesArray.push(currRoute);
				}

				lWinston.log(`Removing duplicated routes.`);
				selectedRoutesArray = pathFinderToolBox.dedupRoutes(selectedRoutesArray);

				lWinston.log(`Sorting the resulting route array odds to make it then by route length.`);
				pathFinderToolBox.sortRoutes(selectedRoutesArray, "chanceThenDistance");

				lWinston.log(`Discarding routes with the lowest score to fit in the maximum search stack size (${HeapSizeLevel1}).`);
				let scalpResults = pathFinderToolBox.scalpRoutes(selectedRoutesArray, discardedRouteArray, HeapSizeLevel1);
				selectedRoutesArray = scalpResults[0];
				discardedRouteArray = scalpResults[1];

				routeArray = selectedRoutesArray;

				var completeCount = 0;
				for(let i in routeArray)
					if(routeArray[i].complete) completeCount++;

				lWinston.log(`There is ${routeArray.length} routes available in the stack.`);
				lWinston.log(`There is ${completeCount} completed routes in the stack.`);

				if(((new Date()).getTime()/1000) - timeStarted > Timeout){
					lWinston.log(`Soft timeout (${Timeout} seconds) broken on level 1. You won't have improved results !`);
					break;
				}
				if(completeCount != routeArray.length) continue;
				else break;
			}

			return routeArray;
		}catch(err){ throw err; }
	}

	var findBestPathes = function(routeArray){
		var lWinston = Logger(`PathFinder-computeLevel2-findBestPathes`, 3);//{ log: function(){} };//
		try{
			var lastRoundIdentifierSum = '';
			var countSimilar = 0;

			var discardedRouteArray = [];
			var roundCount = 0;

			var bestScore = -Infinity;
			var nbRoundSinceBestScoreTopped = 0;

			while(true){
				roundCount++;
				lWinston.log(``);
				lWinston.log(`*******************************************************`);
				lWinston.log(`*******************************************************`);
				lWinston.log(`------------------->   Round ${roundCount}   <---------------------`);
				lWinston.log(`*******************************************************`);
				lWinston.log(`*******************************************************`);
				lWinston.log(``);

				let selectedRoutesArray = [];

				lWinston.log(`Filling routes to compute with discarded ones to achieve heap size.`);
				routeArray = routeArray.concat(discardedRouteArray.splice(0, HeapSizeLevel2));

				lWinston.log(`Updating ${routeArray.length} route meta. Defining which routes are improvable. Defining which routes are perfect.`);
				for(var i in routeArray){
					let currRoute = routeArray[i];
					if(!currRoute.perfect) updateRoute(currRoute);
					if(!currRoute.perfect){
						let improvedRoutes = improveRoute(currRoute);
						if(improvedRoutes.length == 0) continue;
						for(let j in improvedRoutes) selectedRoutesArray.push(improvedRoutes[j]);
					}
					else selectedRoutesArray.push(currRoute);
				}

				lWinston.log(`Removing duplicated routes.`);
				selectedRoutesArray = pathFinderToolBox.dedupRoutes(selectedRoutesArray, "hard");

				lWinston.log(`Sorting the resulting route array odds to make it then by route length.`);
				pathFinderToolBox.sortRoutes(selectedRoutesArray, "risk");

				if(selectedRoutesArray[0] && bestScore < selectedRoutesArray[0].score.riskScore){
					lWinston.log(`Best risk score ${bestScore} topped at ${selectedRoutesArray[0].score.riskScore} ! A new hope..`);
					bestScore = selectedRoutesArray[0].score.riskScore;
					nbRoundSinceBestScoreTopped = 0;
				}else{
					lWinston.log(`Best risk score ${bestScore} unegaled ! ${DepthLevel2 - nbRoundSinceBestScoreTopped} round to go.`);
					nbRoundSinceBestScoreTopped++;
				}
				
				if(selectedRoutesArray.length > HeapSizeLevel2){
					lWinston.log(`Discarding routes with the lowest score to fit in the maximum search stack size (${HeapSizeLevel2}).`);
					let scalpResults = pathFinderToolBox.scalpRoutes(selectedRoutesArray, discardedRouteArray, HeapSizeLevel2);
					selectedRoutesArray = scalpResults[0];
					discardedRouteArray = scalpResults[1];
					pathFinderToolBox.sortRoutes(discardedRouteArray, "chanceThenRisk")
				}

				routeArray = selectedRoutesArray;
				
				lWinston.log(`There is ${discardedRouteArray.length} discarded routes in the stack.`);
				lWinston.log(`There is ${routeArray.length} routes available in the stack.`);

				var perfectIsFound = false;
				for(let i in routeArray)
					if(routeArray[i].perfect) 
						perfectIsFound = true;

				if(((new Date()).getTime()/1000) - timeStarted > Timeout){
					lWinston.log(`Soft timeout (${Timeout} seconds) broken on level 2. Returning whatever we got !`);
					break;
				}
				if(perfectIsFound) break;
				if(routeArray.length == 0 && discardedRouteArray.length == 0) break;
				if(nbRoundSinceBestScoreTopped > DepthLevel2) break;
			}

			routeArray = routeArray.concat(discardedRouteArray);

			return routeArray;
		}catch(err){ throw err; }
	}

	var computeLevel1 = function(){
		var lWinston = Logger(`PathFinder-computeLevel1`, 2);
		try{
			lWinston.log(``);
			lWinston.log(`///////////////////////////////////////////////////////`);
			lWinston.log(`///////////////////////////////////////////////////////`);
			lWinston.log(`--------->   Level 1 [Routes generation]   <-----------`);
			lWinston.log(`////////////////////////MakingIt///////////////////////`);
			lWinston.log(`///////////////////////////////////////////////////////`);
			lWinston.log(``);

			lWinston.log(`Finding out the best routes, level 1.`);
			lWinston.log(`Starting the search loop.`);

			var baseRoute = pathFinderToolBox.createRoute(MFalcon.departure);
			return findValidPathes([baseRoute]);
		}catch(err){ throw err; }
	}

	var computeLevel2 = function(routeArray){
		var lWinston = Logger(`PathFinder-computeLevel2`, 2);
		try{
			lWinston.log(``);
			lWinston.log(`///////////////////////////////////////////////////////`);
			lWinston.log(`///////////////////////////////////////////////////////`);
			lWinston.log(`-------->   Level 2 [Routes improvement]   <-----------`);
			lWinston.log(`//////////////////StayingDiscreet//////////////////////`);
			lWinston.log(`///////////////////////////////////////////////////////`);
			lWinston.log(``);

			lWinston.log(`Finding out the best routes, level 2.`);
			lWinston.log(`Initialising the search with all the routes computed level 1.`);

			return findBestPathes(routeArray);
		}catch(err){ throw err; }
	}

	this.computePath = function(){
		var lWinston = Logger(`PathFinder-computePath`, 1);
		try{
			lWinston.log(`Setting up a timer to forcibly return after ${Timeout} seconds.`);
			timeStarted = (new Date()).getTime()/1000;

			lWinston.log(`Computing level 1, finding out completes routes.`);
			var level1RouteArray = computeLevel1();
			if(level1RouteArray.length == 0){
				lWinston.error(`No route are traversable with given parameters.`);
				return level1RouteArray;
			}

			lWinston.log(`Computing level 2, finding out best pauses to make.`);
			var level2RouteArray = computeLevel2(level1RouteArray);
			if(level2RouteArray.length == 0){
				lWinston.error(`No route are improvable by waiting with given parameters.`);
				return level1RouteArray;
			}
			
			var finalArray = level2RouteArray.concat(level1RouteArray);
			pathFinderToolBox.sortRoutes(finalArray, "chanceThenDistance");

			lWinston.log(`Found ${finalArray.length} routes that could make it.`);
			lWinston.log(`Full execution took ${((new Date()).getTime()/1000)-timeStarted} seconds.`);

			return finalArray;
		}catch(err){ throw err; }
	}
}