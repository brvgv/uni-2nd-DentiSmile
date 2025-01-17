FROM node:22-alpine3.18

WORKDIR /app

# Copy package.json files
COPY server/notification_service/package*.json ./server/notification_service/
COPY shared/mqtt/package*.json ./shared/mqtt/

# Install production dependencies
RUN cd ./server/notification_service && \
    npm i && \
    cd ../../shared/mqtt
# Copy source code
COPY server/notification_service ./server/notification_service
COPY shared/mqtt ./shared/mqtt

# Build the application
RUN cd ./server/notification_service

EXPOSE 6500

ENV NODE_ENV=production

CMD ["npm", "start", "--prefix", "server/notification_service"]
