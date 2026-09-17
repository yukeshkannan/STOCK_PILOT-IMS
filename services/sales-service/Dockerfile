FROM node:20-alpine
WORKDIR /app
COPY services/common ./services/common
RUN cd ./services/common && npm install --production
COPY services/sales-service ./services/sales-service
RUN cd ./services/sales-service && npm install --production
WORKDIR /app/services/sales-service
EXPOSE 5007
CMD ["node", "server.js"]
