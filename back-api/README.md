# Millenium Falcon computer interface (back-api)

A translator for the Millenium Falcon !

## Compatibility

The app should be platform independent. Currently it has been tested on :
-  `Linux debian 4.9.0-9-amd64 #1 SMP Debian 4.9.168-1+deb9u2 (2019-05-13) x86_64 GNU/Linux`
  - With `Yarn v1.12.3` and `Node v10.15.3`
- `Windows 10 Entreprise LTSC - build 1809 - version 17763.503`
  - With `Yarn v1.12.3` and `Node v12.4.0`

## Dependencies

Millenium Falcon computer interface is designed to work with minimum dependency hassle. Here an how to :

- Install `NodeJS>=10.15.3` and `Yarn>=1.12.3` on your system.
- Then :
```bash
# Move into personnal dir
cd ~
# Clone this repository
git clone https://github.com/Boblepointu/WhatAreTheOdds.git && cd WhatAreTheOdds
# Launch the app
cd WhatAreTheOdds/back-api
yarn install
yarn run start
```

## Requirements

In order to make this api work, you need to have a working copy of the `back-worker` app into the `./worker` folder, as well as a working copy of a compiled `front` into the `public` folder. See `../build.sh` for more informations.

## Configuration

You can edit the `./config.json` file or set environment variables to change a few settings.
Please note that if set, an environment variable will override the config setting.
Please note that if the config file entry is missing and no environment variable is set, the app will gracefully rely on hardcoded values.

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
  - Example value : true
  - Description : Allow cross origin requests; useful for development; could generate a risk for production.

#### MaxSentRouteToClient
  - Config file entry : "MaxSentRouteToClient"
  - Environment variable : MAX_SENT_ROUTE_TO_CLIENT
  - Example value : 50
  - Description : How many computed routes will we display front side ?

## Running

Once dependencies are resolved, you can launch one of the few project `npm commands` :
  - `yarn run start` => Will launch the app.

## Todo

- Charge testing