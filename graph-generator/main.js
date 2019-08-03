"use strict";

const NameGenerator = require('node-random-name');
const Faker = require('faker');
const Fs = require('fs');
const DbManager = new (require('./classes/DbManager.js'))();
const Logger = require('./classes/Logger.js');
const Config = require('./config.json');

const NbPlanetInUniverse = (parseInt(process.env.NB_PLANET_IN_UNIVERSE, 10) || process.env.NB_PLANET_IN_UNIVERSE) || Config.NbPlanetInUniverse || 10;
const MinRouteAvailable = (parseInt(process.env.MIN_ROUTE_AVAILABLE, 10) || process.env.MIN_ROUTE_AVAILABLE) || Config.MinRouteAvailable || 10;
const MaxLinksDistance = (parseInt(process.env.MAX_LINKS_DISTANCE, 10) || process.env.MAX_LINKS_DISTANCE) || Config.MaxLinksDistance || 10;
const MinRouteLength = (parseInt(process.env.MIN_ROUTE_LENGTH, 10) || process.env.MIN_ROUTE_LENGTH) || Config.MinRouteLength || 5;
const MaxLinksPerPlanet = (parseInt(process.env.MAX_LINKS_PER_PLANET, 10) || process.env.MAX_LINKS_PER_PLANET) || Config.MaxLinksPerPlanet || 5;
const MinLinksPerPlanet = (parseInt(process.env.MIN_LINKS_PER_PLANET, 10) || process.env.MIN_LINKS_PER_PLANET) || Config.MinLinksPerPlanet || 2;
const StartPlanetName = process.env.START_PLANET_NAME || Config.StartPlanetName || 'Tatooine';
const EndPlanetName = process.env.END_PLANET_NAME || Config.EndPlanetName || 'Endor';

var winston = new Logger('Global');
var randomIntFromInterval = (min,max) => { return Math.floor(Math.random()*(max-min+1)+min); };
var generateName = () => {
	var searchRound = 0;
	var name;
	name = Faker.fake("{{name.lastName}}{{name.firstName}}{{lorem.word}}");
	name = name.replace(/\s/g,'').replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
	name = name.toLowerCase();
	name = name.charAt(0).toUpperCase() + name.slice(1);
	return name;
}

var randomIntFromInterval = (min, max) => Math.floor(Math.random()*(max-min+1)+min);

var main = async function(){
	var winston = new Logger('Main');

	var planets = [];
	var routes = [];
	var routesMap = {};
	var linksMap = {};
	var planetToLinkMap = {};
	var linksCountPerPlanet = {};

	winston.log('Generating planet names.');

	while(planets.length < NbPlanetInUniverse){
		var planetName = generateName();
		var roundCount = 0;
		while(planets.indexOf(planetName) != -1){
			if(roundCount > 0)
				winston.warn('Difficulties generating planet names !');
			planetName = generateName();
			roundCount++;
		}
		planets.push(planetName);
		linksCountPerPlanet[planetName] = 0;
		planetToLinkMap[planetName] = [];
	}

	planetToLinkMap[StartPlanetName] = [];
	planetToLinkMap[EndPlanetName] = [];
	linksCountPerPlanet[StartPlanetName] = 0;
	linksCountPerPlanet[EndPlanetName] = 0;
	planets.push(StartPlanetName);
	planets.push(EndPlanetName);

	while(routes.length < MinRouteAvailable){
		var currRoute = [StartPlanetName];
		var isDeadEnd = false;

		for(var i = 0; i < MinRouteLength; i++){
			var lastPlanet = currRoute[currRoute.length - 1];
			if(i == MinRouteLength-1){
				var routeString = currRoute.join('-')+'-'+EndPlanetName;
				if(!routesMap[routeString]){
					currRoute.push(EndPlanetName);
					linksMap[lastPlanet+EndPlanetName] = { origin: lastPlanet, destination: EndPlanetName, travelTime: randomIntFromInterval(1, MaxLinksDistance) };
					break;
				}else{
					i--;
				}
			}

			var linkLastPlanetTo = planets[Math.floor(Math.random()*planets.length)];
			while(linkLastPlanetTo == StartPlanetName || linkLastPlanetTo == EndPlanetName || linkLastPlanetTo == lastPlanet)
				linkLastPlanetTo = planets[Math.floor(Math.random()*planets.length)];

			linksCountPerPlanet[lastPlanet]++;
			linksCountPerPlanet[linkLastPlanetTo]++;

			if(linksCountPerPlanet[lastPlanet] >= MaxLinksPerPlanet){
				var selectedLink = planetToLinkMap[lastPlanet][Math.floor(Math.random()*planetToLinkMap[lastPlanet].length)].destination;
				var j = 0;
				while(currRoute.indexOf(selectedLink) != -1){
					j++;
					if(j >= planetToLinkMap[lastPlanet].length){
						winston.warn('Can\'t add a link. Generating dead end. Watch your parameters !');
						isDeadEnd = true;
						break;
					}
					selectedLink = planetToLinkMap[lastPlanet][Math.floor(Math.random()*planetToLinkMap[lastPlanet].length)].destination;
				}
				if(!isDeadEnd){
					currRoute.push(selectedLink);
					continue;
				}else{ 
					break;
				}
			}

			if(linksMap[lastPlanet+linkLastPlanetTo])
				currRoute.push(linksMap[lastPlanet+linkLastPlanetTo].destination);
			else{
				var link = { origin: lastPlanet, destination: linkLastPlanetTo, travelTime: randomIntFromInterval(1, MaxLinksDistance) };
				linksMap[lastPlanet+linkLastPlanetTo] = link;
				planetToLinkMap[lastPlanet].push(link);
				planetToLinkMap[linkLastPlanetTo].push(link);
				currRoute.push(linkLastPlanetTo)
			}
		}
		if(!isDeadEnd){
			routesMap[currRoute.join('-')] = currRoute;
			routes.push(currRoute);
			console.log(currRoute.join('->'))
		}else{
			break;
		}
	}

	var planetToAddLinks = [];	
	for(var i in linksCountPerPlanet){
		if(linksCountPerPlanet[i] < MinLinksPerPlanet && i != EndPlanetName)
			planetToAddLinks.push({ linksToAdd: MinLinksPerPlanet - linksCountPerPlanet[i], planet: i });
	}

	winston.log(`Adding dummy links to planet in universe.`)
	for(var i = 0; i < planetToAddLinks.length; i++){
		var currPlanet = planetToAddLinks[i].planet;
		var linksToAdd = planetToAddLinks[i].linksToAdd;
		//console.log(i)
		while(linksToAdd != 0){
			var linkFrom = currPlanet;
			var linkTo = planetToAddLinks[Math.floor(Math.random()*planetToAddLinks.length)].planet;
			while(linkTo == linkFrom) linkTo = planetToAddLinks[Math.floor(Math.random()*planetToAddLinks.length)].planet;
			linksMap[linkFrom+linkTo] = { origin: linkFrom, destination: linkTo, travelTime: randomIntFromInterval(1, MaxLinksDistance) };
			linksCountPerPlanet[linkFrom]++;
			linksCountPerPlanet[linkTo]++;
			linksToAdd--;	
		}
	}


	var links = [];
	Object.values(linksMap).forEach(link => { links.push(link); });

	try{ Fs.unlinkSync('./universe.db'); }
	catch(err){}

	winston.log('Creating database.')
	await DbManager.createDb('./universe.db');
	//await DbManager.removeRouteTable();
	await DbManager.createRouteTable();

	var promiseList = [];
	winston.log('Populating database.');
	await DbManager.insertRoutesBatch(links);
	//for(var i in routeList)	promiseList.push(DbManager.insertRoute(routeList[i]));
	//winston.log('Waiting for promises results.');
	//Promise.all(promiseList);
}

main();

