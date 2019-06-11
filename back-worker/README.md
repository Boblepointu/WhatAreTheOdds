# Millenium Falcon computer (back-worker)
A tomtom for the Millenium Falcon !

## Compatibility

The app should be platform independent. Currently it has been tested on :
-  `Linux debian 4.9.0-9-amd64 #1 SMP Debian 4.9.168-1+deb9u2 (2019-05-13) x86_64 GNU/Linux`
  - With `Yarn v1.12.3` and `Node v10.15.3`
- `Windows 10 Entreprise LTSC - build 1809 - version 17763.503`
  - With `Yarn v1.12.3` and `Node v12.4.0`

## Dependencies

Millenium Falcon computer is designed to work with minimum dependency hassle. Here an how to :

- Install `NodeJS>=10.15.3` and `Yarn>=1.12.3` on your system.
- Then :
```bash
# Move into personnal dir
cd ~
# Clone this repository
git clone https://github.com/Boblepointu/WhatAreTheOdds.git && cd WhatAreTheOdds
# Launch the app
cd WhatAreTheOdds/back-worker
yarn install
yarn run start
```

## Configuration

You can edit the `./config.json` file or set environment variables to change a few settings.
Please note that if set, an environment variable will override the config setting.

#### HeapSizeLevel1 
  - Config file entry : "HeapSizeLevel1"
  - Environment variable : HEAP_SIZE_LEVEL_1
  - Description : Heap size when traversing the graph to find a complete path.

#### HeapSizeLevel2
  - Config file entry : "HeapSizeLevel2"
  - Environment variable : HEAP_SIZE_LEVEL_2
  - Description : Heap size when trying to improve found pathes.

#### Depth
  - Config file entry : "Depth"
  - Environment variable : DEPTH
  - Description : Depth we will dive to search for a solution. 
      - On level 1 (graph traversal), will quit searching when no solution is found within this limit (warn => will limit graph traversal capabilities. Set this value to the length of the longest route !).
      - On level 2 (bounty hunters dodging), will quit when no better solution is found within this limit.

#### MFalconConfigPath
  - Config file entry : "MFalconConfigPath"
  - Environment variable : MFALCON_CONFIG_PATH
  - Description : Path of the `millenium-falcon.json` file.

#### HardTimeoutSec
  - Config file entry : "HardTimeoutSec"
  - Environment variable : HARD_TIMEOUT_SEC
  - Description : Will forcibly quit when this timeout is clocked. No results will be output.

#### SoftTimeoutSec
  - Config file entry : "SoftTimeoutSec"
  - Environment variable : SOFT_TIMEOUT_SEC
  - Description : Will gracefully quit when this timeout is clocked. Best results found will be outputed.

#### LogLevel
  - Config file entry : "LogLevel"
  - Environment variable : LOG_LEVEL
  - Description : Given the nature of the app, loglevels must be managed to prevent output cluttering. Each level added will activate one 'functional' deeper. LogLevel 3 is advised; LogLevel 4 and 5 output way too much data.

## Running

Once dependencies are resolved, you can launch one of the few project `npm commands` :
  - `yarn run start` => Will launch the app.

## Todo

- Find a better way to do a regression into the bounty hunter dodging part; Combinatory explosion make it difficult to find the best dodging strategy when bounty hunters are extremely well organized. 