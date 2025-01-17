FROM node:22-alpine3.18

WORKDIR /app

# Copy package.json files
COPY server/appointment_service/package*.json ./server/appointment_service/
COPY shared/mqtt/package*.json ./shared/mqtt/

# Install production dependencies
RUN cd ./server/appointment_service && \
    npm i && \
    cd ../../shared/mqtt
# Copy source code
COPY server/appointment_service ./server/appointment_service
COPY shared/mqtt ./shared/mqtt

# Build the application
RUN cd ./server/appointment_service

EXPOSE 5000

ENV NODE_ENV=production

CMD ["npm", "start", "--prefix", "server/appointment_service"]
