FROM node:22-alpine3.18

WORKDIR /app

# Configure npm to always generate package-lock.json
RUN npm config set package-lock=true

# Copy package files
COPY server/auth_service/package*.json ./server/auth_service/
COPY shared/mqtt/package*.json ./shared/mqtt/

# Install dependencies with explicit package-lock generation
RUN cd ./server/auth_service && \
    npm install --package-lock && \
    cd ../../shared/mqtt && \
    npm install --package-lock

# Copy source code
COPY server/auth_service ./server/auth_service
COPY shared/mqtt ./shared/mqtt

WORKDIR /app/server/auth_service

EXPOSE 4400

ENV NODE_ENV=production

CMD ["npm", "start"]
