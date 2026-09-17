FROM node:20-alpine
WORKDIR /app
COPY services/common ./services/common
RUN cd ./services/common && npm install --production
COPY services/warehouse-service ./services/warehouse-service
RUN cd ./services/warehouse-service && npm install --production
WORKDIR /app/services/warehouse-service
EXPOSE 5005
CMD ["node", "server.js"]
