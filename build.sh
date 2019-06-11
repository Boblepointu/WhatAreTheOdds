#!/bin/bash

echo "##### Building Millenium Falcon computer #####"

echo "---> Cleaning up project"
rm -rf back-api/node_modules
rm -rf back-worker/node_modules
rm -rf front/node_modules
rm -rf back-api/worker/*
rm -rf back-api/public/*
rm -rf back-api/front/dist/*

echo "---> Pulling node modules"
cd back-api/ && yarn install
cd ../front && yarn install

echo "---> Building front app"
yarn run build && cd ..

echo "---> Binding together the app"
cp -rf front/dist/* back-api/public/
cp -rf back-worker/* back-api/worker
cd back-api/worker && yarn install && cd -

echo "##### App is ready to rumble; just 'yarn run start' into back-api folder #####"



