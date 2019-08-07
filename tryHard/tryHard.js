const DbReader = require('./classes/DbReader.js');
const PathFinder = require('./classes/PathFinder.js');
const Path = require('path');
const AppDir = Path.dirname(require.main.filename);

var main = async function(){
	var dataSet = { 
		MFalcon: require(Path.join(AppDir, './dataset/live/millenium-falcon.json')) 
		, Empire: require(Path.join(AppDir, './dataset/live/empire.json'))
	};
	var dbReader = new DbReader();

	await dbReader.openDb(dataSet.MFalcon.routes_db);

	var pathFinder = new PathFinder(dbReader, dataSet.MFalcon);

	await pathFinder.buildGraph();
	var routesFound = await pathFinder.findIndivisibleRoutes();
	//console.log(`${Object.keys(routesFound).length}`)
	
	await pathFinder.computeOptimalWaypoints(dataSet.Empire, Object.values(routesFound)[2]);

	//await pathFinder.findIndivisibleRoutesVariation(2);


	//console.log(perfectRoutes);


	return;

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