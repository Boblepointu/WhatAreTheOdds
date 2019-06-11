# WhatAreTheOdds
A long time ago in a galaxy far, far away...

The Death Star - the Empire's ultimate weapon - is almost operational and is currently approaching the Endor planet. The countdown has started.

Han Solo, Chewbacca, Leia and C3PO are currently on Tatooine boarding on the Millenium Falcon. They must reach Endor to join the Rebel fleet and destroy the Death Star before it annihilates the planet.

The Empire has hired the best bounty hunters in the galaxy to capture the Millenium Falcon and stop it from joining the rebel fleet...


## Mission

You can find the mission sheet with all implementation specifications [over there](./MISSION.md).

## Compatibility

The app should be platform independent. Currently it has been tested on :
-  `Linux debian 4.9.0-9-amd64 #1 SMP Debian 4.9.168-1+deb9u2 (2019-05-13) x86_64 GNU/Linux`
  - With `Yarn v1.12.3` and `Node v10.15.3`
- `Windows 10 Entreprise LTSC - build 1809 - version 17763.503`
  - With `Yarn v1.12.3` and `Node v12.4.0`

  
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
docker run -p 3000:3000 whataretheodds:latest
# Launch browser on 'http://127.0.0.1:3000'
```

## Dev dependencies

Millenium Falcon computer is designed to work with minimum dependency hassle. Here an how to :
- Install `NodeJS>=10.15.3` and `Yarn>=1.12.3` on your system.

- Then :
```bash
# Move into personnal dir
cd ~
# Clone this repository
git clone https://github.com/Boblepointu/WhatAreTheOdds.git && cd WhatAreTheOdds
# Build the app
bash build.sh
# Launch the app
cd back-api && yarn run start
# Launch browser on 'http://127.0.0.1:3000'
```

## Composition

The app is composed of three block :

- The API : Serve the front application and relay compute requests to workers. [see readme](./back-api/README.md).
- The WORKER : Do all the heavy lifting to find a way around this hostile universe. [see readme](./back-worker/README.md).
- The C3PO : The frontend application. You talk to it, it find a way to get it right ! [see readme](./front/README.md).

## Raw usage examples

### Pass a custom `millenium-falcon.json` file

```bash
# Build the app
bash build.sh
# Cleanup placeholder data
rm -rf ./back-api/worker/dataset/live/millenium-falcon.json
cp /home/millenium-falcon.json ./back-api/worker/dataset/live/millenium-falcon.json
# Launch the app
cd back-api && yarn run start
# Launch browser on 'http://127.0.0.1:3000'
```

## Docker usage examples

### Pass a custom `millenium-falcon.json` file

```bash
docker run -p 3000:3000 -v /home/millenium-falcon.json:/app/back-api/worker/dataset/live/millenium-falcon.json whataretheodds:latest
```

### Pass a custom `millenium-falcon.json` file and a custom `universe.db` file

```bash
docker run -p 3000:3000 -v /home/millenium-falcon.json:/app/back-api/worker/dataset/live/millenium-falcon.json -v /home/universe.db:/app/back-api/worker/dataset/live/universe.db whataretheodds:latest
```
Note : You can place the `universe.db` wherever you want, as long as its path is well referenced into the `millenium-falcon.json` file.

## Configuration

You can configure the app as wished by setting a few environment variables.
You can also hard set these variables into corresponding `config.json` files.

### Api configuration ([./back-api/config.json](./back-api/config.json))

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
  - Example value : 0
  - Description : Allow cross origin requests; useful for development; could generate a risk for production.

#### MaxSentRouteToClient
  - Config file entry : "MaxSentRouteToClient"
  - Environment variable : MAX_SENT_ROUTE_TO_CLIENT
  - Example value : 50
  - Description : How many computed routes will we display front side ?

### Worker configuration ([./back-worker/config.json](./back-worker/config.json))

#### HeapSizeLevel1 
  - Config file entry : "HeapSizeLevel1"
  - Environment variable : HEAP_SIZE_LEVEL_1
  - Example value : 100
  - Description : Heap size when traversing the graph to find a complete path. An heapsize of 100 give good results with moderately big graphs.

#### HeapSizeLevel2
  - Config file entry : "HeapSizeLevel2"
  - Environment variable : HEAP_SIZE_LEVEL_2
  - Example value : 30
  - Description : Heap size when trying to improve found pathes. An heapsize of 30 give good results with moderately complexe bounty hunter strategies.

#### Depth
  - Config file entry : "Depth"
  - Environment variable : DEPTH
  - Example value : 200
  - Description : Depth we will dive to search for a solution. 
      - On level 1 (graph traversal), will quit searching when no solution is found within this limit (warn => will limit graph traversal capabilities. Set this value to the length of the longest route !).
      - On level 2 (bounty hunters dodging), will quit when no better solution is found within this limit.

#### MFalconConfigPath
  - Config file entry : "MFalconConfigPath"
  - Environment variable : MFALCON_CONFIG_PATH
  - Example value : "./dataset/live/millenium-falcon.json"
  - Description : Path of the `millenium-falcon.json` file.

#### HardTimeoutSec
  - Config file entry : "HardTimeoutSec"
  - Environment variable : HARD_TIMEOUT_SEC
  - Example value : 60
  - Description : Will forcibly quit when this timeout is clocked. No results will be output. Web browsers http timeout are usually around 60 seconds.

#### SoftTimeoutSec
  - Config file entry : "SoftTimeoutSec"
  - Environment variable : SOFT_TIMEOUT_SEC
  - Example value : 30
  - Description : Will gracefully quit when this timeout is clocked. Best results found will be outputed.

#### LogLevel
  - Config file entry : "LogLevel"
  - Environment variable : LOG_LEVEL
  - Example value : 3
  - Description : Given the nature of the app, loglevels must be managed to prevent output cluttering. Each level added will activate one 'functional' deeper. LogLevel 3 is advised; LogLevel 4 and 5 output way too much data.