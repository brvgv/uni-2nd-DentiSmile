FROM node:22-alpine3.18

WORKDIR /app/frontend

# Copy package files
COPY frontend/package*.json ./
COPY shared/mqtt/package*.json ../shared/mqtt/

# Combine install commands and clean cache
RUN npm i && \
    npm cache clean --force

# Copy source code
COPY frontend ./
COPY shared/mqtt ../shared/mqtt

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]
