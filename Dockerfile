FROM node:12.4.0

# Preparing file structure
RUN mkdir /app

# Copying softwares into image
ADD C3PO /app/C3PO
ADD MilleniumFalconComputer /app/MilleniumFalconComputer
ADD build.sh /app/

WORKDIR /app

RUN bash build.sh

WORKDIR /app/MilleniumFalconComputer/

CMD ["yarn", "run", "start"]