"use strict";

module.exports = function(MFalcon, Empire, Graph, HeapSizeLevel1, HeapSizeLevel2){
	const Logger = require('./Logger.js');
	const PathFinderToolBox = require('./PathFinderToolBox.js');
	const pathFinderToolBox = new PathFinderToolBox(Graph, MFalcon, Empire);

	var level1RouteArray = [];
	var level2RouteArray = [];
	var level1RoundCount = 0;
	var level1DiscardedRouteArray = [];
	var level2RoundCount = 0;
	var level2DiscardedRouteArray = [];

	var updateRoute = function(route){
		try{
			route.complete = (route.path[0] == MFalcon.departure && route.path[route.path.length-1] == MFalcon.arrival) ? true : false;

			var timeToPosition = pathFinderToolBox.computeTimeToPosition(route);
			var chanceToMakeIt = pathFinderToolBox.computeChanceToMakeIt(Graph, timeToPosition);
			var distanceScore = pathFinderToolBox.computeDistanceScore(timeToPosition);
			var aggregatedScore = chanceToMakeIt + distanceScore;

			for(var day in timeToPosition);
			route.travelTime = parseInt(day);
			route.score = { aggregatedScore: aggregatedScore, distanceScore: distanceScore, chanceToMakeIt: chanceToMakeIt };
			route.identifier = pathFinderToolBox.generateRouteIdentifier(route, timeToPosition);
			route.liteIdentifier = pathFinderToolBox.generateRouteIdentifier(route, timeToPosition, true);
			route.travelable = pathFinderToolBox.isRouteTravelable(route);
			route.perfect = (route.score.chanceToMakeIt == 100) ? true : false;

			return route;
		}catch(err){ throw err; }
	}

	var extendRoute = function(route){
		var lWinston = Logger(`PathFinder-computeLevel1-computeRouteArray-extendRoute`, 4);
		try{
			var extendedRoutes = [];
			
			var lastRoutePlanet = route.path[route.path.length-1];
			lWinston.log(`Last position of route ${route.liteIdentifier} is ${lastRoutePlanet}. There is ${Graph.planets[lastRoutePlanet].links.length} available positions to go next.`);

			var links = Graph.planets[lastRoutePlanet].links;
			for(let i in links){
				let nextPosition = links[i].planet;
				let newRoute = { 
					path: route.path.slice(0)
					, linkNumberMap: route.linkNumberMap.slice(0)
					, waitMap: route.waitMap.slice(0)
					, score: { aggregatedScore: route.score.aggregatedScore
							, distanceScore: route.score.distanceScore
							, chanceToMakeIt: route.score.chanceToMakeIt }
					, travelTime: route.travelTime
					, complete: route.complete
					, travelable: route.travelable
					, perfect: route.perfect
					, identifier: route.identifier
					, liteIdentifier: route.liteIdentifier };

				if(newRoute.path.indexOf(nextPosition) != -1){
					lWinston.warn(`Unable to add ${nextPosition} to route ${newRoute.liteIdentifier}. Deleting this route instance.`);
					continue;
				}
				newRoute.path.push(nextPosition);
				newRoute.linkNumberMap.push(parseInt(i));
				if(nextPosition != MFalcon.arrival)
					newRoute.waitMap.push(0);

				updateRoute(newRoute);

				extendedRoutes.push(newRoute);
			}
			return extendedRoutes;
		}catch(err){ throw err; }
	}

	var improveRoute = function(route){
		var lWinston = Logger(`PathFinder-computeLevel2-FindBestPathes-improveRoute`, 4);
		try{
			var improvedRoutes = [];

			for(let i in route.waitMap){
				let newRoute = {
					path: route.path.slice(0)
					, linkNumberMap: route.linkNumberMap.slice(0)
					, waitMap: route.waitMap.slice(0)
					, score: { aggregatedScore: route.score.aggregatedScore
							, distanceScore: route.score.distanceScore
							, chanceToMakeIt: route.score.chanceToMakeIt }
					, travelTime: route.travelTime
					, complete: route.complete
					, travelable: route.travelable
					, perfect: route.perfect
					, identifier: route.identifier
					, liteIdentifier: route.liteIdentifier };
				newRoute.waitMap[i] = newRoute.waitMap[i]+1;

				updateRoute(newRoute);

				improvedRoutes.push(newRoute);
			}
			/*var waitMapCount = 0;
			for(var i in improvedRoutes[0].waitMap)
				waitMapCount += improvedRoutes[0].waitMap[i];
			console.log("waitMapCount ", waitMapCount);*/
			return improvedRoutes;
		}catch(err){ throw err; }
	}	

	var findValidPathes = function(){
		var lWinston = Logger(`PathFinder-computeLevel1-findValidPathes`, 3);
		try{
			var allCompleteRoutes = [];
			do{
				level1RoundCount++;
				lWinston.log(``);
				lWinston.log(`*******************************************************`);
				lWinston.log(`*******************************************************`);
				lWinston.log(`------------------->   Round ${level1RoundCount}   <---------------------`);
				lWinston.log(`*******************************************************`);
				lWinston.log(`*******************************************************`);
				lWinston.log(``);

				let extendedRoutesArray = [];
				let cleanedRoutesArray = [];

				lWinston.log(`Updating score, identifier, complete, travelable and perfect flag for each route.`);
				for(var i in level1RouteArray){
					var currRoute = level1RouteArray[i];
					if(currRoute.complete) continue;

					updateRoute(currRoute);
				}

				lWinston.log(`Defining which routes we can extend.`);
				var routesToExtendArray = [];
				for(var i in level1RouteArray)
					if(!level1RouteArray[i].complete && level1RouteArray[i].travelable)
						routesToExtendArray.push(level1RouteArray[i]);
				lWinston.log(`There are ${routesToExtendArray.length} routes to extend.`);

				lWinston.log(`Defining which routes are complete.`);
				for(var i in level1RouteArray)
					if(level1RouteArray[i].complete && level1RouteArray[i].travelable)
						cleanedRoutesArray.push(level1RouteArray[i]);
				lWinston.log(`There are ${cleanedRoutesArray.length} completed routes.`);

				lWinston.log(`Extending available uncomplete routes.`);
				for(var i in routesToExtendArray){
					lWinston.log(`Finding out which possibilities we have to extend the current route (${routesToExtendArray[i].liteIdentifier}).`);
					let extendedRoutes = extendRoute(routesToExtendArray[i]);
					extendedRoutesArray = extendedRoutesArray.concat(extendedRoutes);
				}

				lWinston.log(`Cleaning up extended routes.`);
				for(var i in extendedRoutesArray)
					if(extendedRoutesArray[i].travelable){
						lWinston.log(`Route ${extendedRoutesArray[i].liteIdentifier} has a chance to make it of ${extendedRoutesArray[i].score.chanceToMakeIt}% and a two dimensional score of ${extendedRoutesArray[i].score.aggregatedScore}. Saving it for next round.`);
						cleanedRoutesArray.push(extendedRoutesArray[i]);
					}else{
						lWinston.warn(`Route ${extendedRoutesArray[i].liteIdentifier} is not valid. Deleting this instance.`);
					}

				lWinston.log(`Removing duplicated routes.`);
				let deduplicateObj = {};
				for(let i=0; i < cleanedRoutesArray.length; i++)
					deduplicateObj[cleanedRoutesArray[i].identifier] = cleanedRoutesArray[i];
				cleanedRoutesArray = [];
				for(let i in deduplicateObj)
					cleanedRoutesArray.push(deduplicateObj[i]);				

				lWinston.log(`Sorting the resulting route array odds to make it then by route length.`);
				var cmp = (a, b) => (a < b) - (a > b);
				cleanedRoutesArray.sort((a, b) => {
					return cmp(a.score.chanceToMakeIt, b.score.chanceToMakeIt) || cmp(a.score.distanceScore, b.score.distanceScore);
				});

				lWinston.log(`Discarding routes with the lowest score to fit in the maximum search stack size (${HeapSizeLevel1}).`);
				if(cleanedRoutesArray.length > HeapSizeLevel1){
					lWinston.log(`There is ${cleanedRoutesArray.length} routes available in the stack. That's more than the allowed search size (${HeapSizeLevel1}). Reducing resulting search array.`);
					let toDiscardArray = cleanedRoutesArray.slice(HeapSizeLevel1, cleanedRoutesArray.length-1);
					level1DiscardedRouteArray = level1DiscardedRouteArray.concat(toDiscardArray);
					level1DiscardedRouteArray.sort((a, b) => {
						return cmp(a.score.chanceToMakeIt, b.score.chanceToMakeIt) || cmp(a.score.distanceScore, b.score.distanceScore);
					});
					level1DiscardedRouteArray = level1DiscardedRouteArray.slice(0, HeapSizeLevel1);
					cleanedRoutesArray = cleanedRoutesArray.slice(0, HeapSizeLevel1);
				}

				lWinston.log(`There is ${cleanedRoutesArray.length} routes available in the stack.`);

				level1RouteArray = cleanedRoutesArray;

				var allCompleteRoutes = [];
				for(let i in level1RouteArray)
					if(level1RouteArray[i].complete)
						allCompleteRoutes.push(level1RouteArray[i]);

			}while(allCompleteRoutes.length != level1RouteArray.length);
		}catch(err){ throw err; }
	}

	var findBestPathes = function(){
		var lWinston = Logger(`PathFinder-computeLevel2-findBestPathes`, 3);
		try{
			var lastRoundIdentifierSum = '';
			var countSimilar = 0;
			do{
				level2RoundCount++;
				lWinston.log(``);
				lWinston.log(`*******************************************************`);
				lWinston.log(`*******************************************************`);
				lWinston.log(`------------------->   Round ${level2RoundCount}   <---------------------`);
				lWinston.log(`*******************************************************`);
				lWinston.log(`*******************************************************`);
				lWinston.log(``);

				let improvedRoutesArray = [];
				let cleanedRoutesArray = [];

				lWinston.log(`Updating score, identifier, complete, travelable and perfect flag for each route.`);
				for(var i in level2RouteArray){
					let currRoute = level2RouteArray[i];
					if(currRoute.perfect) continue;

					updateRoute(currRoute);
				}

				lWinston.log(`Defining which routes we can improve.`);
				let routesToImproveArray = [];
				for(var i in level2RouteArray)
					if(level2RouteArray[i].travelable && !level2RouteArray[i].perfect)
						routesToImproveArray.push(level2RouteArray[i]);
				lWinston.log(`There are ${routesToImproveArray.length} routes to improve.`)			

				lWinston.log(`Defining which routes are perfect.`);
				for(var i in level2RouteArray){
					cleanedRoutesArray.push(level2RouteArray[i]);
				}
				lWinston.log(`There are ${cleanedRoutesArray.length} perfect routes.`);

				lWinston.log(`Improving available routes.`);
				for(var i in routesToImproveArray){
					lWinston.log(`Finding out which possibilities we have to improve the current route (${routesToImproveArray[i].liteIdentifier}).`);
					let improvedRoutes = improveRoute(routesToImproveArray[i]);
					improvedRoutesArray = improvedRoutesArray.concat(improvedRoutes);
				}

				lWinston.log(`Cleaning up improved routes.`);
				for(var i in improvedRoutesArray)
					if(improvedRoutesArray[i].travelable){
						lWinston.log(`Route ${improvedRoutesArray[i].liteIdentifier} has a chance to make it of ${improvedRoutesArray[i].score.chanceToMakeIt}% and a two dimensional score of ${improvedRoutesArray[i].score.aggregatedScore}. Saving it for next round.`);
						cleanedRoutesArray.push(improvedRoutesArray[i]);
					}else{
						lWinston.warn(`Route ${improvedRoutesArray[i].liteIdentifier} is not valid. Deleting this instance.`);
					}

				lWinston.log(`Removing duplicated routes.`);
				let deduplicateObj = {};
				for (let i=0; i < cleanedRoutesArray.length; i++)
					deduplicateObj[cleanedRoutesArray[i].identifier+cleanedRoutesArray[i].waitMap.toString()] = cleanedRoutesArray[i];
				cleanedRoutesArray = [];
				for (let i in deduplicateObj)
					cleanedRoutesArray.push(deduplicateObj[i]);

				lWinston.log(`Sorting the resulting route array odds to make it then by route length then by number of steps.`);
				let cmp = (a, b) => (a < b) - (a > b);
				cleanedRoutesArray.sort((a, b) => {
						return cmp(a.score.chanceToMakeIt, b.score.chanceToMakeIt) 
							|| cmp(a.score.distanceScore, b.score.distanceScore) 
							|| cmp(-a.waitMap.length, -b.waitMap.length);
				});

				lWinston.log(`Discarding routes with the lowest score to fit in the maximum search stack size (${HeapSizeLevel2}).`);
				if(cleanedRoutesArray.length > HeapSizeLevel2){
					lWinston.log(`There is ${cleanedRoutesArray.length} routes available in the stack. That's more than the allowed search size (${HeapSizeLevel2}). Reducing resulting search array.`);
					let toDiscardArray = cleanedRoutesArray.slice(HeapSizeLevel2, cleanedRoutesArray.length-1);
					level2DiscardedRouteArray = level2DiscardedRouteArray.concat(toDiscardArray);
					level2DiscardedRouteArray.sort((a, b) => {
						return cmp(a.score.chanceToMakeIt, b.score.chanceToMakeIt) 
							|| cmp(a.score.distanceScore, b.score.distanceScore) 
							|| cmp(-a.waitMap.length, -b.waitMap.length);
					});
					if(level2DiscardedRouteArray.length > HeapSizeLevel2)
						level2DiscardedRouteArray = level2DiscardedRouteArray.slice(0, HeapSizeLevel2);
					cleanedRoutesArray = cleanedRoutesArray.slice(0, HeapSizeLevel2);
				}

				lWinston.log(`There is ${cleanedRoutesArray.length} routes available in the stack.`);

				if(cleanedRoutesArray.length > 0)
					level2RouteArray = cleanedRoutesArray;

				let newRoundIdentifierSum = "";
				for(let i in level2RouteArray)
					newRoundIdentifierSum += level2RouteArray[i].identifier;

				if(lastRoundIdentifierSum == newRoundIdentifierSum) countSimilar++;
				if(countSimilar > 2){
					lWinston.log(`This loop yield identical results than the last. Break !`);
					break;
				}

				let allPerfectRoutes = [];
				for(let i in level2RouteArray)
					if(level2RouteArray[i].perfect)
						allPerfectRoutes.push(level2RouteArray[i]);

				if(allPerfectRoutes.length == level2RouteArray.length){
					lWinston.log(`We got a full panel of perfect routes. Break !`);
					break;
				}

				lastRoundIdentifierSum = newRoundIdentifierSum;
				
			}while(true);
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

			lWinston.log(`Initialising the search with all the routes linked to start planet.`);
			for(var i in Graph.planets[MFalcon.departure].links){
				var currRoute = { 
					path: [MFalcon.departure]
					, linkNumberMap: [0]
					, waitMap: [0]
					, timeToPosition: {}
					, score: { aggregatedScore: 0
							, distanceScore: 0
							, chanceToBeCaptured: 0 }
					, travelTime: 0
					, complete: false
					, travelable: true
					, perfect: false };

				currRoute.path.push(Graph.planets[MFalcon.departure].links[i].planet);
				currRoute.linkNumberMap.push(parseInt(i));
				currRoute.waitMap.push(0);
				level1RouteArray.push(currRoute);
			}

			lWinston.log(`Starting the search loop.`);
			level1RoundCount = 0;
			while(true){
				var cmp = (a, b) => (a < b) - (a > b);
				level1DiscardedRouteArray.sort((a, b) => {
					return cmp(a.score.chanceToMakeIt, b.score.chanceToMakeIt) || cmp(a.score.distanceScore, b.score.distanceScore);
				});				
				var routesToAdd = level1DiscardedRouteArray.slice(0, HeapSizeLevel1 - level1RouteArray.length);
				level1DiscardedRouteArray = level1DiscardedRouteArray.slice(HeapSizeLevel1 - level1RouteArray.length, level1DiscardedRouteArray.length - 1);
				for(var i in routesToAdd) level1RouteArray.push(routesToAdd[i]);

				findValidPathes();

				if(level1DiscardedRouteArray.length == 0){
					lWinston.log(`There are no more routes to assess. Stopping here.`);
					break;
				}
				if(level1RouteArray.length == HeapSizeLevel1){
					lWinston.log(`We found enough valid routes. Stopping here.`);
					break;
				}
				if(level1RouteArray.length < HeapSizeLevel1){
					lWinston.log(`There are more routes to assess, and we still have rounds to consume. Continuing.`);
					continue;
				}
			}

		}catch(err){ throw err; }
	}

	var computeLevel2 = function(){
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
			level2RouteArray = level1RouteArray;

			lWinston.log(`Starting the search loop.`);
			level2RoundCount = 0;
			while(true){
				var level2RouteLength = level2RouteArray.length;
				var cmp = (a, b) => (a < b) - (a > b);
				level2DiscardedRouteArray.sort((a, b) => {
					return cmp(a.score.chanceToMakeIt, b.score.chanceToMakeIt) 
							|| cmp(a.score.distanceScore, b.score.distanceScore) 
							|| cmp(a.waitMap.length, b.waitMap.length);
				});	
				var routesToAdd = level2DiscardedRouteArray.slice(0, HeapSizeLevel2 - level2RouteArray.length);
				level2DiscardedRouteArray = level2DiscardedRouteArray.slice(HeapSizeLevel2 - level2RouteArray.length, level2DiscardedRouteArray.length - 1);
				for(var i in routesToAdd) level2RouteArray.push(routesToAdd[i]);

				findBestPathes();
				
				lWinston.log(`Removing duplicated routes (waitMap && refuelMap might have crossed).`);
				let deduplicateObj = {};
				for (let i=0; i < level2RouteArray.length; i++)
					deduplicateObj[level2RouteArray[i].identifier] = level2RouteArray[i];
				level2RouteArray = [];
				for (let i in deduplicateObj)
					level2RouteArray.push(deduplicateObj[i]);				

				if(level2DiscardedRouteArray.length == 0){
					lWinston.log(`There are no more routes to assess. Stopping here.`);
					break;
				}
				if(level2RouteArray.length == HeapSizeLevel2){
					let allPerfectRoutes = [];
					for(let i in level2RouteArray)
						if(level2RouteArray[i].perfect)
							allPerfectRoutes.push(level2RouteArray[i]);				
					if(allPerfectRoutes.length == 0){
						lWinston.log(`We found enough ${HeapSizeLevel2} routes. But none are 100%. Removing forcibly 1/3 of them and continuing.`);
						level2RouteArray = level2RouteArray.slice(0, Math.round((level2RouteArray.length/3)*2));
						continue;
					}else{
						lWinston.log(`We found enough valid and perfect routes. Stopping here.`);
						break;
					}
				}

				if(level2RouteLength == level2RouteArray.length){
					lWinston.log(`No improvement on last loop. Breaking here.`);
					break;
				}
				if(level2RouteArray.length < HeapSizeLevel2){
					lWinston.log(`There are more routes (${level2RouteArray.length}) to assess, and we still have rounds to consume. Continuing.`);
					continue;
				}
			}


		}catch(err){ throw err; }
	}

	this.computePath = function(){
		var lWinston = Logger(`PathFinder-computePath`, 1);
		try{
			lWinston.log(`Computing level 1, finding out completes routes.`);
			computeLevel1();
			if(level1RouteArray.length == 0){
				lWinston.error(`No route are traversable with given parameters.`);
				return level1RouteArray;
			}

			lWinston.log(`Computing level 2, finding out best pauses to make.`);
			computeLevel2();
			if(level2RouteArray.length == 0){
				lWinston.error(`No route are improvable by waiting with given parameters.`);
				return level1RouteArray;
			}

			lWinston.log(`Found ${level2RouteArray.length} routes that could make it.`);
			var cmp = (a, b) => (a < b) - (a > b);
			level2RouteArray.sort((a, b) => {
				return cmp(a.score.chanceToMakeIt, b.score.chanceToMakeIt) 
					|| cmp(a.score.distanceScore, b.score.distanceScore) 
					|| cmp(-a.waitMap.length, -b.waitMap.length);
			});

			return level2RouteArray;
		}catch(err){ throw err; }
	}
}