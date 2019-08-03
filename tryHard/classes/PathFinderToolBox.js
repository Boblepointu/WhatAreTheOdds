"use strict";

module.exports = function(Graph, MFalcon, Empire){
	const _ = require('underscore');
	const Logger = require('./Logger.js');

	this.cloneRoute = function(route){
		var cloned = this.createRoute(route.path[0]);
		
		cloned.path = route.path.slice(0);
		cloned.linkNumberMap = route.linkNumberMap.slice(0);
		cloned.waitMap = route.waitMap.slice(0);
		cloned.riskMap = route.riskMap.slice(0);
		cloned.score.aggregatedScore = route.score.aggregatedScore;
		cloned.score.distanceScore = route.score.distanceScore;
		cloned.score.chanceToMakeIt = route.score.chanceToMakeIt;
		cloned.score.riskScore = route.score.riskScore;
		cloned.travelTime = route.travelTime;
		cloned.complete = route.complete;
		cloned.travelable = route.travelable;
		cloned.perfect = route.perfect;
		cloned.identifier = route.identifier;
		cloned.liteIdentifier = route.liteIdentifier;

		return cloned;
	}

	this.createRoute = function(startPlanet){
		var route = { 
				path: [startPlanet]
				, linkNumberMap: [0]
				, waitMap: [0]
				, riskMap: [0]
				, timeToPosition: {}
				, score: { aggregatedScore: 0
						, distanceScore: 0
						, chanceToBeCaptured: 0 }
				, travelTime: 0
				, complete: false
				, travelable: true
				, perfect: false };
		return route;
	}

	this.scalpRoutes = function(scalpFromArray, scalpToArray, heapSize){
		try{
			let scalpedArray = scalpFromArray.slice(heapSize);
			scalpToArray = scalpedArray.concat(scalpToArray);
			this.sortRoutes(scalpToArray, "chanceThenDistance");
			scalpToArray = scalpToArray.slice(0, heapSize*10);
			scalpFromArray = scalpFromArray.slice(0, heapSize);

			return [scalpFromArray, scalpToArray];
		}catch(err){ throw err; }
	}

	this.sortRoutes = function(routeArray, type){
		try{
			var simpleCompare = (a, b) => (b - a);
			routeArray.sort((a, b) => {
				if(!type || type == "aggregatedScore")
					return simpleCompare(a.score.aggregatedScore, b.score.aggregatedScore);
				if(type == "chanceThenDistance")
					return simpleCompare(a.score.chanceToMakeIt, b.score.chanceToMakeIt) 
							|| simpleCompare(a.score.distanceScore, b.score.distanceScore)
				if(type == "distance")
					return simpleCompare(a.score.distanceScore, b.score.distanceScore);
				if(type == "chanceThenDistanceThenPauses")
					return simpleCompare(a.score.chanceToMakeIt, b.score.chanceToMakeIt) 
							|| simpleCompare(a.score.distanceScore, b.score.distanceScore)
							|| simpleCompare(-a.waitMap.length, -b.waitMap.length);	
				if(type == "chanceThenRisk")
					return simpleCompare(a.score.chanceToMakeIt, b.score.chanceToMakeIt) 
							|| simpleCompare(a.score.riskScore, b.score.riskScore);
				if(type == "chanceThenPauses")
					return simpleCompare(a.score.chanceToMakeIt, b.score.chanceToMakeIt) 
							|| simpleCompare(-a.waitMap.length, -b.waitMap.length);							
				if(type == "risk")
					return simpleCompare(a.score.riskScore, b.score.riskScore);
				if(type == "pauses")
					return simpleCompare(-a.waitMap.length, -b.waitMap.length);
				if(type == "riskThenPauses")
					return simpleCompare(a.score.riskScore, b.score.riskScore)
							|| simpleCompare(-a.waitMap.length, -b.waitMap.length);
				if(type == "pausesThenRisk")
					return simpleCompare(-a.waitMap.length, -b.waitMap.length)
							|| simpleCompare(a.score.riskScore, b.score.riskScore);
				if(type == "chanceThenRisk")
					return simpleCompare(a.score.chanceToMakeIt, b.score.chanceToMakeIt)
							|| simpleCompare(a.score.riskScore, b.score.riskScore);
			});
		}catch(err){ throw err; }
	}	

	this.dedupRoutes = function(routeArray, type){
		try{
			let dedupObj = {};
			for(let i = 0; i < routeArray.length; i++){
				if(!type)
					dedupObj[routeArray[i].identifier] = routeArray[i];
				else if(type == "hard"){
					dedupObj[routeArray[i].liteIdentifier] = routeArray[i];
				}
			}
			routeArray = [];
			for(let i in dedupObj) routeArray.push(dedupObj[i]);

			return routeArray;
		}catch(err){ throw err; }
	}

	this.computeTimeToPosition = function(route){
		var lWinston = Logger(`PathFinderToolBox-computeTimeToPosition`, 5);
		try{
			var travelTime = 0;
			var travelTimeSinceLastRefuel = 0;
			var timeToPosition = { };

			for(var i = 0; i < route.path.length; i++){
				var lastPosition = route.path[i-1];
				var lastLinkNumber = route.linkNumberMap[i-1];
				var currPosition = route.path[i];
				var currLinkNumber = route.linkNumberMap[i];
				var nextPosition = route.path[i+1];
				var nextLinkNumber = route.linkNumberMap[i+1];

				travelTime += (lastPosition) ? Graph.getTravelTimeBetween(lastPosition, currPosition, currLinkNumber) : 0;
				travelTimeSinceLastRefuel += (lastPosition) ? Graph.getTravelTimeBetween(lastPosition, currPosition, currLinkNumber) : 0;

				timeToPosition[travelTime] = { planet: currPosition, type: "passingBy" };

				lWinston.log(`[TravelTime : ${travelTime}] [Current position : ${currPosition}] ${(nextPosition) ? '[Next position : '+nextPosition+']' : ''}.`);
				lWinston.log(`Millenium Falcon will be passing by ${currPosition} day ${travelTime}.`);

				if(route.waitMap[route.path.indexOf(currPosition)] > 0){
					for(var j = 0; j < route.waitMap[route.path.indexOf(currPosition)]; j++){
						travelTime++;
						travelTimeSinceLastRefuel = 0;
						timeToPosition[travelTime] = { planet: currPosition, type: "waiting/refueling" };
						lWinston.log(`Millenium Falcon will wait/refuel on ${currPosition}, at day ${travelTime}.`);
					}
				}
				if(travelTimeSinceLastRefuel >= MFalcon.autonomy && route.path[route.path.length-1] != MFalcon.arrival){
					travelTime++;
					travelTimeSinceLastRefuel = 0;
					timeToPosition[travelTime] = { planet: currPosition, type: "refueling" };
					lWinston.log(`Millenium Falcon will need to refuel on ${currPosition}, at day ${travelTime}.`);
				}
				if(nextPosition && Graph.getTravelTimeBetween(currPosition, nextPosition, nextLinkNumber) + travelTimeSinceLastRefuel > MFalcon.autonomy){
					travelTime++;
					travelTimeSinceLastRefuel = 0;
					timeToPosition[travelTime] = { planet: currPosition, type: "refueling" };
					lWinston.log(`To jump onto ${nextPosition}, Millenium Falcon will need to refuel on ${currPosition}, at day ${travelTime}.`);
				}
			}

			return timeToPosition;
		}catch(err){ throw err; }
	}

	this.computeRiskScore = function(route){
		try{
			var rawScore = 0;
			for(var i in route.riskMap)
				rawScore += route.riskMap[i];
			return -rawScore;
		}catch(err){ throw err; }
	}

	this.computeRiskMap = function(route, bhArray, timeToPosition){
		try{
			bhArray.sort((a, b) => { return a.day - b.day; });

			var planetToRisk = [];
			for(var i in bhArray){
				if(!planetToRisk[bhArray[i].planet] && route.path.indexOf(bhArray[i].planet) != -1) planetToRisk[bhArray[i].planet] = [];
				if(route.path.indexOf(bhArray[i].planet) == -1) continue;

				if(planetToRisk[bhArray[i].planet].indexOf(bhArray[i].day) != -1) continue;
				planetToRisk[bhArray[i].planet].push(bhArray[i].day);
			}
			//console.log(planetToRisk);

			var riskMap = [];
			for(var i in timeToPosition){
				var currDay = parseInt(i);
				var currPlanet = timeToPosition[i].planet;
				
				if(!planetToRisk[currPlanet]){
					riskMap.push(0);
					continue;
				}

				var indexFirstRisk = planetToRisk[currPlanet].indexOf(currDay);

				if(planetToRisk[currPlanet].length == 0 || indexFirstRisk == -1)
					riskMap.push(0);
				else{
					var consecutiveRisk = 1;
					var lastDayAtRisk = currDay;
					for(var j = indexFirstRisk+1; j < planetToRisk[currPlanet].length; j++){
						if(planetToRisk[currPlanet][j] == lastDayAtRisk+1){
							consecutiveRisk++;
							lastDayAtRisk = planetToRisk[currPlanet][j];
						}else break;
					}
					riskMap.push(consecutiveRisk);
				}
			
				/*if(planetToRisk[currPlanet].length == 0 || indexFirstRisk == -1)
					riskMap[riskMap.length-1] += 0;
				else{
					var consecutiveRisk = 1;
					var lastDayAtRisk = currDay+1;
					for(var j = indexFirstRisk+1; j < planetToRisk[currPlanet].length; j++){
						if(planetToRisk[currPlanet][j] == lastDayAtRisk+1){
							consecutiveRisk++;
							lastDayAtRisk = planetToRisk[currPlanet][j];
						}else break;
					}
					riskMap[riskMap.length-1] += consecutiveRisk;
				}*/

			}

			return riskMap;
		}catch(err){ throw err; }
	}

	this.computeChanceToMakeIt = function(Graph, timeToPosition){
		var lWinston = Logger(`PathFinderToolBox-computeChanceToMakeIt`, 5);
		try{
			var oddsMFalconWillMakeIt = 100;
			var chanceToBeCaptured = 0;
			var riskCount = 0;

			for(let day in timeToPosition){
				let currPosition = timeToPosition[day].planet;
				lWinston.log(`Millenium Falcon will be at ${currPosition} on day ${day}.`);

				let isThereBhThisDay = Graph.isThereBhOnPlanet(currPosition, day);
				if(isThereBhThisDay){
					riskCount++;
					lWinston.log(`BountyHunters will be at ${currPosition} on day ${day}. Risk to be captured increased.`);
				}
				else continue;
				if(riskCount == 1){
					chanceToBeCaptured = 0.1;
				}else{
					chanceToBeCaptured = chanceToBeCaptured + (Math.pow(9, riskCount-1) / Math.pow(10, riskCount));
				}
				oddsMFalconWillMakeIt = (1-chanceToBeCaptured)*100;
				lWinston.log(`Odds the Millenium Falcon will make it are ${oddsMFalconWillMakeIt}%.`);
			}

			return parseFloat(oddsMFalconWillMakeIt.toFixed(2));
		}catch(err){ throw err; }
	}

	this.computeDistanceScore = function(timeToPosition){
		var lWinston = Logger(`PathFinderToolBox-computeDistanceScore`, 5);
		try{
			var lastTimedPosition = 0;
			for(lastTimedPosition in timeToPosition);
			return Empire.countdown - lastTimedPosition;
		}catch(err){ throw err; }
	}

	this.isRouteTravelable = function(route){
		var lWinston = Logger(`PathFinderToolBox-isRouteTravelable`, 5);
		try{
			lWinston.log(`Finding out if route ${route.identifier} is travelable, with a Millenium Falcon autonomy of ${MFalcon.autonomy} and an Empire countdown of ${Empire.countdown}.`);

			if(route.travelTime > Empire.countdown){
				lWinston.warn(`Route ${route.identifier} is not travelable, traversal time (${route.travelTime} days) would be superior to the empire countdown (${Empire.countdown} days).`);
				return false;
			}else{
				lWinston.log(`Route ${route.identifier} traversal time (${route.travelTime}) is quicker than the Empire countdown ${Empire.countdown}. Continuing route validity assessment.`);
			}

			for(var i = 1; i < route.path.length; i++){
				var lastPosition = route.path[i-1];
				var lastLinkNumber = route.linkNumberMap[i-1];
				var currPosition = route.path[i];
				var currLinkNumber = route.linkNumberMap[i];

				if(Graph.getTravelTimeBetween(lastPosition, currPosition, currLinkNumber) > MFalcon.autonomy){
					lWinston.warn(`Route ${route.identifier} is invalid, travel time from ${lastPosition} to ${currPosition} is greater than the Millenium Falcon autonomy (${MFalcon.autonomy}).`);
					return false;
				}
			}

			lWinston.log(`Route ${route.identifier} is travelable. Traversal time < Empire countdown and each link is practicable regarding the Millenium Falcon autonomy.`);

			return true;
		}catch(err){ throw(err); }
	}

	this.generateRouteIdentifier = function(route, timeToPosition, liteIdentifier){
		try{
			var buildObj = {};
			for(let i in timeToPosition){
				if(!buildObj[timeToPosition[i].planet])	buildObj[timeToPosition[i].planet] = { refuel: 0, wait: 0, dayIn: i, dayOut: i };
				if(timeToPosition[i].type == "refueling") buildObj[timeToPosition[i].planet].refuel = 1;
				if(timeToPosition[i].type == "waiting/refueling") buildObj[timeToPosition[i].planet].wait++;
				buildObj[timeToPosition[i].planet].dayOut = i;
			}

			for(let i in buildObj){
				if(buildObj[i].wait > 0 
					&& buildObj[i].refuel == 0
					&& i != MFalcon.departure){
					buildObj[i].wait--;
					buildObj[i].refuel = 1;
				}
			}

			var pathString = '';
			if(route.path.length == 1){
				pathString = `|${route.path[0]}|`;
			}else{
				for(let i in route.path){
					let displayStr = `${route.path[i]}`;
					if(buildObj[route.path[i]].refuel == 1) displayStr += `[R]`;
					if(buildObj[route.path[i]].wait > 0) displayStr += `[W${buildObj[route.path[i]].wait}]`;
					(!liteIdentifier) ? displayStr += `(dIn:${buildObj[route.path[i]].dayIn}`+((i != route.path.length-1) ? `;dOut:${buildObj[route.path[i]].dayOut})` : `)`) : '';
					if(i == 0) pathString = `|${displayStr}->`;
					else if(i == route.path.length - 1) pathString = `${pathString}${displayStr}|`;
					else pathString = `${pathString}${displayStr}->`;
				}
			}

			return pathString;
		}catch(err){ throw err; }
	}
};