FROM node:22-alpine3.18

WORKDIR /app

# Copy package.json files
COPY server/clinic_service/package*.json ./server/clinic_service/
COPY shared/mqtt/package*.json ./shared/mqtt/

# Install production dependencies
RUN cd ./server/clinic_service && \
    npm i && \
    cd ../../shared/mqtt
# Copy source code
COPY server/clinic_service ./server/clinic_service
COPY shared/mqtt ./shared/mqtt

# Build the application
RUN cd ./server/clinic_service

EXPOSE 3300

ENV NODE_ENV=production

CMD ["npm", "start", "--prefix", "server/clinic_service"]
