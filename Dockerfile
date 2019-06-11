FROM node:12.4.0

# Preparing file structure
RUN mkdir /app

# Copying softwares into image
ADD front /app/front
ADD back-worker /app/back-worker
ADD back-api /app/back-api
ADD build.sh /app/


WORKDIR /app

RUN bash build.sh

WORKDIR /app/back-api/

CMD ["yarn", "run", "start"]