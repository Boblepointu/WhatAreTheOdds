# WhatAreTheOdds

![](_readme_assets/starwars_banner.png)

A long time ago in a galaxy far, far away...

The Death Star - the Empire's ultimate weapon - is almost operational and is currently approaching the Endor planet. The countdown has started.

Han Solo, Chewbacca, Leia and C3PO are currently on Tatooine boarding on the Millenium Falcon. They must reach Endor to join the Rebel fleet and destroy the Death Star before it annihilates the planet.

The Empire has hired the best bounty hunters in the galaxy to capture the Millenium Falcon and stop it from joining the rebel fleet...


## Mission

You can find the mission sheet with all implementation specifications [over there](./MISSION.md).

## Compatibility

The app should be platform independent. Currently it has been tested on :
- `Linux debian 4.9.0-9-amd64 #1 SMP Debian 4.9.168-1+deb9u2 (2019-05-13) x86_64 GNU/Linux`
	- With `Yarn v1.12.3` and `Node v10.15.3`
- `Windows 10 Entreprise LTSC - build 1809 - version 17763.503`
	- With `Yarn v1.12.3`, `Node v12.4.0` and `MSYS` for console port (should work with `CygWin`)

  
## Production dependencies

- Install docker to your system.
- Then :
```bash
# Move into personnal dir
cd ~
# Clone this repository
git clone https://github.com/Boblepointu/WhatAreTheOdds.git && cd WhatAreTheOdds
# Launch the docker build
docker build -t whataretheodds .
# Launch the docker image
docker run -p 3000:3000 whataretheodds:latest
# Launch browser on 'http://127.0.0.1:3000'
```

## Dev dependencies

Millenium Falcon computer is designed to work with minimum dependency hassle. Here an how to :
- Install `NodeJS >= 10.15.3` and `Yarn >= 1.12.3` on your system.
- Then :
```bash
# Move into personnal dir
cd ~
# Clone this repository
git clone https://github.com/Boblepointu/WhatAreTheOdds.git && cd WhatAreTheOdds
# Build the app
bash build.sh
# Launch the app
cd MilleniumFalconComputer && yarn run start
# Launch browser on 'http://127.0.0.1:3000'
```

## Composition

The app is composed of two blocks :

- The MilleniumFalconComputer : Serve the front application and relay compute requests to workers.
- The C3PO : The frontend application. You talk to it, it find a way to get it right !

## Raw usage examples

```bash
# Build the app
bash build.sh
# Add / Replace / Change dataset data in ./MilleniumFalconComputer/dataset/
# Launch the app
cd MilleniumFalconComputer && yarn run start
# Launch browser on 'http://127.0.0.1:3000'
```

## Docker usage examples

### Pass a custom `millenium-falcon.json` file

```bash
docker run -p 3000:3000 -v /home/millenium-falcon.json:/app/MilleniumFalconComputer/dataset/millenium-falcon.json whataretheodds:latest
```

### Pass a custom `millenium-falcon.json` file and a custom `universe.db` file

```bash
docker run -p 3000:3000 -v /home/millenium-falcon.json:/app/MilleniumFalconComputer/dataset/millenium-falcon.json -v /home/universe.db:/app/MilleniumFalconComputer/dataset/universe.db whataretheodds:latest
```

### Pass a custom dataset folder (Must contain `millenium-falcon.json` and `universe.db`; the app will add `buffer.db`)

```bash
docker run -p 3000:3000 -v /home/dataset:/app/MilleniumFalconComputer/dataset whataretheodds:latest
```

### Pass a custom `config.json` file
```bash
docker run -p 3000:3000 -v /home/config.json:/app/MilleniumFalconComputer/config.json whataretheodds:latest
```

## Configuration

You can configure the app as wished by setting a few environment variables.
You can also hard set these variables into [./MilleniumFalconComputer/config.json](./MilleniumFalconComputer/config.json) file.

### MilleniumFalconComputer configuration

#### MaxSimultaneousComputation 
  - Config file entry : "MaxSimultaneousComputation"
  - Environment variable : MAX_SIMULTANEOUS_COMPUTATION
  - Example value : 10
  - Description : Set the maximum workers that will be working concurently.

#### Port
  - Config file entry : "Port"
  - Environment variable : PORT
  - Example value : 3000
  - Description : Http port to listen for incoming connections.

#### AllowAllAccessControlOrigins
  - Config file entry : "AllowAllAccessControlOrigins"
  - Environment variable : ALLOW_ALL_ACCESS_CONTROL_ORIGIN
  - Example value : 0 or 1
  - Description : Allow cross origin requests; useful for development; could generate a risk for production.

#### DryRun
  - Config file entry : "DryRun"
  - Environment variable : DRY_RUN
  - Example value : 0 or 1
  - Description : Dry run. Will delete buffer database at start if set to 1.

#### MFalconConfigPath
  - Config file entry : "MFalconConfigPath"
  - Environment variable : MFALCON_CONFIG_PATH
  - Example value : "./dataset/millenium-falcon.json"
  - Description : Path of the `millenium-falcon.json` file. Must be relative to `MilleniumFalconComputer` folder.

#### MaxSentRouteToClient
  - Config file entry : "MaxSentRouteToClient"
  - Environment variable : MAX_SENT_ROUTE_TO_CLIENT
  - Example value : 50
  - Description : How many computed routes will we display front side ?

#### MaxPrecalculatedRoutes
  - Config file entry : "MaxPrecalculatedRoutes"
  - Environment variable : MAX_PRECALCULATED_ROUTES
  - Example value : 3000
  - Description : Will stop exploring universe when this many routes will be found. We don't want buffer database to grow uncontrolled.

#### ExploreBatchSize
  - Config file entry : "ExploreBatchSize"
  - Environment variable : EXPLORE_BATCH_SIZE
  - Example value : 10000
  - Minimum value : 100
  - Description : Size of batch for each step in explore. The memory consumed by the explore step is tied to it. The exploration speed and buffer database size too. Warning : don't change it for a given workset through multiple launch without resetting buffer database. It can shift the search domain 'cursor', and you'll end up with only very long routes in the live buffer. A value < 100 is suboptimal, hence it is rejected by runtime tests.

#### BufferDbPath
  - Config file entry : "BufferDbPath"
  - Environment variable : BUFFER_DB_PATH
  - Example value : "./dataset/buffer.db"
  - Description : Path of the `buffer.db` database. If it don't exist, will be generated automatically.

#### UniverseWorkDbPath
  - Config file entry : "UniverseWorkDbPath"
  - Environment variable : UNIVERSE_WORK_DB_PATH
  - Example value : "./dataset/universe_wrk.db"
  - Description : Path of the `universe_wrk.db` database. Will be rebuilt at each start.

#### HardTimeoutSec
  - Config file entry : "HardTimeoutSec"
  - Environment variable : HARD_TIMEOUT_SEC
  - Example value : 60
  - Description : Will forcibly quit when this timeout is clocked. No results will be outputed. Web browsers http timeout are usually around 60 seconds.

#### SoftTimeoutSec
  - Config file entry : "SoftTimeoutSec"
  - Environment variable : SOFT_TIMEOUT_SEC
  - Example value : 30
  - Description : Will gracefully quit when this timeout is clocked. Best results found will be outputed.

#### LogLevel
  - Config file entry : "LogLevel"
  - Environment variable : LOG_LEVEL
  - Example value : 4
  - Description : Given the nature of the app, loglevels must be managed to prevent output cluttering. Each level added will activate one 'functional' deeper. LogLevel 4 is advised for small production server; LogLevel 3 for high usage production server; LogLevel 5 output way too much data, to use only for debug.

## Notes

- You can place the `universe.db` wherever you want, as long as its path is well referenced into the `millenium-falcon.json` file, and relative to `MilleniumFalconComputer` folder.

- The preferred way of passing data is by mounting a folder. A buffer database is generated by the app. You might want to save it, since it will be populated with precalculations.

- As said before, a precalculation is done by the app at start. The biggest universes can't be fully explored, since we are playing on a NP-Complete problem. However, as time pass, more and more routes will be precalculated. It imply that on first start, you could have only one route to compute against. You must wait a few seconds/minute to get enough routes in buffer database to have a meaningfull result. Don't be afraid, with universes containing millions of entries it take roughly 10's of seconds to have a good enough sample.