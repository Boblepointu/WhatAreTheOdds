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

## Requirements

To work in dev mode, you must set the `forced` variable line 143 into `./src/App.vue` to point to your backend.
To build for production, you must set the `forced` variable line 143 into `./src/App.vue` to empty string.

## Todo

- Add components, Bus, Store to make it more maintenable.
- Add a way to manage all text strings in the app; after all, its C3PO, it should speak a lot of languages !
- Add a way to toggle `dev`/`prod` mode without editing `./src/App.vue`.

## Credits

The following boilerplate was used as a base => http://vuejs-templates.github.io/webpack/

``` bash
# install dependencies
npm install

# serve with hot reload at localhost:8080
npm run dev

# build for production with minification
npm run build

# build for production and view the bundle analyzer report
npm run build --report
```

For a detailed explanation on how things work, check out the [guide](http://vuejs-templates.github.io/webpack/) and [docs for vue-loader](http://vuejs.github.io/vue-loader).
