FROM node:12.4.0

# Preparing file structure
RUN mkdir /app

# Copying softwares into image
ADD C3PO /app/C3PO
ADD MilleniumFalconComputer /app/MilleniumFalconComputer
ADD build.sh /app/

WORKDIR /app

# Build the app
RUN bash build.sh

# Remove C3PO build files
RUN rm -rf C3PO

WORKDIR /app/MilleniumFalconComputer/

# Execute tests
# RUN yarn run test

# Launch the app
CMD ["yarn", "run", "start"]