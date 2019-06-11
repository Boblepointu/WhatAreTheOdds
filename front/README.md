# Millenium Falcon C3PO (front)

A C3PO for the Millenium Falcon !

## Compatibility

The app should be platform independent. Currently it has been tested on :
-  `Linux debian 4.9.0-9-amd64 #1 SMP Debian 4.9.168-1+deb9u2 (2019-05-13) x86_64 GNU/Linux`
  - With `Yarn v1.12.3` and `Node v10.15.3`
- `Windows 10 Entreprise LTSC - build 1809 - version 17763.503`
  - With `Yarn v1.12.3` and `Node v12.4.0`

## Dependencies

Millenium Falcon C3PO is designed to work with minimum dependency hassle. Here an how to :

- Install `NodeJS>=10.15.3` and `Yarn>=1.12.3` on your system.
- Then :
```bash
# Move into personnal dir
cd ~
# Clone this repository
git clone https://github.com/Boblepointu/WhatAreTheOdds.git && cd WhatAreTheOdds
# Launch the app
cd WhatAreTheOdds/front
yarn install
yarn run build
```

## Running

Once dependencies are resolved, you can launch one of the few project `npm commands` :
  - `yarn run dev` => Launch the webdev server.
  - `yarn run build` => Build the app to `dist` folder.
  - `yarn run build --report` => Build the app to `dist` folder and generate a `bundle analyzer report`.

## Configuration

You can edit the `./src/config.json` file to change a few settings.

#### DevMode 
  - Config file entry : "DevMode"
  - Example value : true
  - Description : Activate the dev mode. Request will be forced to the url set in `DevModeServerUrl` config entry.

#### DevModeServerUrl
  - Config file entry : "DevModeServerUrl"
  - Example value : "http://127.0.0.1:3000"
  - Description : Server url where the request will be sent when `DevMode` config entry is set to `true`.

## Todo
- Add a way to manage all text strings in the app; after all, its C3PO, it should speak a lot of languages !

## Credits

The following boilerplate was used as a base => http://vuejs-templates.github.io/webpack/
For a detailed explanation on how things work, check out the [guide](http://vuejs-templates.github.io/webpack/) and [docs for vue-loader](http://vuejs.github.io/vue-loader).
