"use strict";

module.exports = function(Graph, MFalcon, Empire){
	const _ = require('underscore');
	const Logger = require('./Logger.js');

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
				pathString = `|${route.path[i]}|`;
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