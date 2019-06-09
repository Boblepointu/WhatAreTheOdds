FROM node:12.4.0

# Preparing file structure
RUN mkdir /app

# Copying softwares into image
ADD front /app/front
ADD back-worker /app/back-worker
ADD back-api /app/back-api

WORKDIR /app

# Cleaning up app relics in case the dev didn't did it
RUN rm -rf /app/front/node-modules
RUN rm -rf /app/front/dist/*
RUN rm -rf /app/back-api/node-modules
RUN rm -rf /app/back-worker/node-modules
RUN rm -rf /app/back-worker/worker/*
RUN rm -rf /app/back-worker/public/*

# Installing dependencies for each app
WORKDIR /app/front/
RUN yarn install

WORKDIR /app/back-api/
RUN yarn install

# Compiling the front app
WORKDIR /app/front/
RUN yarn run build

# Copying the front app to api public folder
RUN cp -rf /app/front/dist/* /app/back-api/public/

# Copying the worker app to api worker folder
RUN cp -rf /app/back-worker/* /app/back-api/worker/

# Installing dependencies for worker
WORKDIR /app/back-api/worker
RUN yarn install

WORKDIR /app/back-api/
#CMD ["node", "main.js"]
CMD ["bash"]