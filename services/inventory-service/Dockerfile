FROM node:20-alpine
WORKDIR /app
COPY services/common ./services/common
RUN cd ./services/common && npm install --production
COPY services/inventory-service ./services/inventory-service
RUN cd ./services/inventory-service && npm install --production
WORKDIR /app/services/inventory-service
EXPOSE 5004
CMD ["node", "server.js"]
