#!/bin/bash

echo "##### Building C3PO #####"

cd C3PO/
echo "---> Cleaning up project"
rm -rf node_modules

echo "---> Pulling node modules"
yarn install

echo "---> Building front app"
mv ./src/config.json ./src/config.dev.json && mv ./src/config.prod.json ./src/config.json
yarn run build
mv ./src/config.json ./src/config.prod.json && mv ./src/config.dev.json ./src/config.json
cd ..

echo "##### Building Millenium Falcon computer #####"
cd MilleniumFalconComputer/
echo "---> Cleaning up project"
rm -rf node_modules

echo "---> Building back app"
yarn install

echo "##### Binding the apps #####"
cd ..
echo "---> Copying C3P0 dist to back app"
cp -rf C3PO/dist/* MilleniumFalconComputer/public/

echo "##### App is ready to rumble; just 'yarn run start' into MilleniumFalconComputer folder #####"