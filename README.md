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
# Launch the app build
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

