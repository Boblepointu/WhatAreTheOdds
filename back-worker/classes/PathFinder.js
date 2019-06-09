"use strict";

module.exports = function(MFalcon, Empire, Graph, HeapSizeLevel1, HeapSizeLevel2, DepthLevel2){
	const _ = require('underscore');
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
			route.timeToPosition = timeToPosition;

			return route;
		}catch(err){ throw err; }
	}

	var extendRoute = function(route){
		var lWinston = {log: function(){}, warn: function(){}};//Logger(`PathFinder-computeLevel1-computeRouteArray-extendRoute`);
		try{
			var extendedRoutes = [];
			
			var lastRoutePlanet = route.path[route.path.length-1];
			lWinston.log(`Last position of route ${route.liteIdentifier} is ${lastRoutePlanet}. There is ${Graph.planets[lastRoutePlanet].links.length} available positions to go next.`);

			var links = Graph.planets[lastRoutePlanet].links;
			for(var i in links){
				var nextPosition = links[i].planet;
				var newRoute = { 
					path: route.path.slice(0)
					, linkNumberMap: route.linkNumberMap.slice(0)
					, waitMap: route.waitMap.slice(0)
					, timeToPosition: Object.assign({}, route.timeToPosition)
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
		var lWinston = {log: function(){}, warn: function(){}};//Logger(`PathFinder-computeLevel2-FindBestPathes-improveRoute`);
		try{
			var improvedRoutes = [];

			for(var i in route.waitMap){
				var newRoute = {
					path: route.path.slice(0)
					, linkNumberMap: route.linkNumberMap.slice(0)
					, waitMap: route.waitMap.slice(0)
					, timeToPosition: Object.assign({}, route.timeToPosition)
					, score: { aggregatedScore: route.score.aggregatedScore
							, distanceScore: route.score.distanceScore
							, chanceToMakeIt: route.score.chanceToMakeIt }
					, travelTime: route.travelTime
					, complete: route.complete
					, travelable: route.travelable
					, perfect: route.perfect
					, identifier: route.identifier
					, liteIdentifier: route.liteIdentifier };
				newRoute.waitMap[i]++;// = newRoute.waitMap[i]+1;
				
				updateRoute(newRoute);

				var newRouteDepth = 0;
				for(var j = 0; j < newRoute.waitMap.length; j++)
					newRouteDepth += parseInt(newRoute.waitMap[j]);

				if(newRouteDepth < DepthLevel2)
					improvedRoutes.push(newRoute);
			}

			return improvedRoutes;
		}catch(err){ throw err; }
	}	

	var findValidPathes = function(){
		var lWinston = Logger(`PathFinder-computeLevel1-findValidPathes`);
		try{
			while(_.filter(level1RouteArray, route => { return route.complete; }).length != level1RouteArray.length){
				level1RoundCount++;
				lWinston.log(``);
				lWinston.log(`*******************************************************`);
				lWinston.log(`*******************************************************`);
				lWinston.log(`------------------->   Round ${level1RoundCount}   <---------------------`);
				lWinston.log(`*******************************************************`);
				lWinston.log(`*******************************************************`);
				lWinston.log(``);

				var extendedRoutesArray = [];
				var cleanedRoutesArray = [];

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
					var extendedRoutes = extendRoute(routesToExtendArray[i]);
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
				cleanedRoutesArray = _.uniq(cleanedRoutesArray, route => {
					return route.identifier;
				});

				lWinston.log(`Sorting the resulting route array by route length and odds to make it (aggregatedScore).`);
				cleanedRoutesArray.sort((a, b) => {
					return b.score.aggregatedScore - a.score.aggregatedScore;
				});						

				lWinston.log(`Discarding routes with the lowest score to fit in the maximum search stack size (${HeapSizeLevel1}).`);
				if(cleanedRoutesArray.length > HeapSizeLevel1){
					lWinston.log(`There is ${cleanedRoutesArray.length} routes available in the stack. That's more than the allowed search size (${HeapSizeLevel1}). Reducing resulting search array.`);
					var toDiscardArray = cleanedRoutesArray.slice(HeapSizeLevel1, cleanedRoutesArray.length-1);
					level1DiscardedRouteArray = level1DiscardedRouteArray.concat(toDiscardArray);
					cleanedRoutesArray = cleanedRoutesArray.slice(0, HeapSizeLevel1);
				}

				lWinston.log(`There is ${cleanedRoutesArray.length} routes available in the stack.`);

				level1RouteArray = cleanedRoutesArray;
			}
		}catch(err){ throw err; }
	}

	var findBestPathes = function(){
		var lWinston = Logger(`PathFinder-computeLevel2-findBestPathes`);
		try{
			do{
				level2RoundCount++;
				lWinston.log(``);
				lWinston.log(`*******************************************************`);
				lWinston.log(`*******************************************************`);
				lWinston.log(`------------------->   Round ${level2RoundCount}   <---------------------`);
				lWinston.log(`*******************************************************`);
				lWinston.log(`*******************************************************`);
				lWinston.log(``);

				var improvedRoutesArray = [];
				var cleanedRoutesArray = [];

				lWinston.log(`Updating score, identifier, complete, travelable and perfect flag for each route.`);
				for(var i in level2RouteArray){
					var currRoute = level2RouteArray[i];
					if(currRoute.perfect) continue;

					updateRoute(currRoute);
				}

				lWinston.log(`Defining which routes we can improve.`);
				var routesToImproveArray = [];
				for(var i in level2RouteArray)
					if(level2RouteArray[i].travelable && !level2RouteArray[i].perfect)
						routesToImproveArray.push(level2RouteArray[i]);
				lWinston.log(`There are ${routesToImproveArray.length} routes to improve.`)			

				lWinston.log(`Defining which routes are perfect.`);
				for(var i in level2RouteArray)
					if(level2RouteArray[i].perfect)
						cleanedRoutesArray.push(level2RouteArray[i]);
				lWinston.log(`There are ${cleanedRoutesArray.length} perfect routes.`);

				lWinston.log(`Improving available routes.`);
				for(var i in routesToImproveArray){
					lWinston.log(`Finding out which possibilities we have to improve the current route (${routesToImproveArray[i].liteIdentifier}).`);
					var improvedRoutes = improveRoute(routesToImproveArray[i]);
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
				cleanedRoutesArray = _.uniq(cleanedRoutesArray, route => {
					return route.identifier;
				});

				lWinston.log(`Sorting the resulting route array by route length and odds to make it (aggregatedScore).`);
				cleanedRoutesArray.sort((a, b) => {
					return b.score.aggregatedScore - a.score.aggregatedScore;
				});

				lWinston.log(`Discarding routes with the lowest score to fit in the maximum search stack size (${HeapSizeLevel2}).`);
				if(cleanedRoutesArray.length > HeapSizeLevel2){
					lWinston.log(`There is ${cleanedRoutesArray.length} routes available in the stack. That's more than the allowed search size (${HeapSizeLevel2}). Reducing resulting search array.`);
					var toDiscardArray = cleanedRoutesArray.slice(HeapSizeLevel2, cleanedRoutesArray.length-1);
					level2DiscardedRouteArray = level2DiscardedRouteArray.concat(toDiscardArray);
					cleanedRoutesArray = cleanedRoutesArray.slice(0, HeapSizeLevel2);
				}

				lWinston.log(`There is ${cleanedRoutesArray.length} routes available in the stack.`);

				level2RouteArray = cleanedRoutesArray;
			}while(_.filter(level2RouteArray, route => { return route.perfect; }).length != level2RouteArray.length);
		}catch(err){ throw err; }
	}

	var computeLevel1 = function(){
		var lWinston = Logger(`PathFinder-computeLevel1`);
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
				level1DiscardedRouteArray.sort((a, b) => { return b.score.aggregatedScore - a.score.aggregatedScore; });
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
		var lWinston = Logger(`PathFinder-computeLevel2`);
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
			level2RouteArray = level1RouteArray.slice(0);

			lWinston.log(`Starting the search loop.`);
			level2RoundCount = 0;
			while(true){
				level2DiscardedRouteArray.sort((a, b) => { return b.score.aggregatedScore - a.score.aggregatedScore; });
				var routesToAdd = level2DiscardedRouteArray.slice(0, HeapSizeLevel2 - level2RouteArray.length);
				level2DiscardedRouteArray = level2DiscardedRouteArray.slice(HeapSizeLevel2 - level2RouteArray.length, level2DiscardedRouteArray.length - 1);
				for(var i in routesToAdd) level2RouteArray.push(routesToAdd[i]);

				findBestPathes();
				
				if(level2DiscardedRouteArray.length == 0){
					lWinston.log(`There are no more routes to assess. Stopping here.`);
					break;
				}
				if(level2RouteArray.length == HeapSizeLevel2){
					lWinston.log(`We found enough valid routes. Stopping here.`);
					break;
				}
				if(level2RouteArray.length < HeapSizeLevel2){
					lWinston.log(`There are more routes to assess, and we still have rounds to consume. Continuing.`);
					continue;
				}			
			}
		}catch(err){ throw err; }
	}

	this.computePath = function(){
		var lWinston = Logger(`PathFinder-computePath`);
		try{
			lWinston.log(`Computing level 1, finding out completes routes`);
			computeLevel1();
			if(level1RouteArray.length == 0){
				lWinston.error(`No route are traversable with given parameters.`);
				return level1RouteArray;
			}

			computeLevel2();
			if(level2RouteArray.length == 0){
				lWinston.error(`No route are improvable by waiting with given parameters.`);
				return level1RouteArray;
			}

			lWinston.log(`Found a few routes that could make it.`);
			level2RouteArray.sort((a, b) => {
				return b.score.aggregatedScore - a.score.aggregatedScore;
			});

			return level2RouteArray;
		}catch(err){ throw err; }
	}
}