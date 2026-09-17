FROM node:20-alpine
WORKDIR /app
COPY services/common ./services/common
RUN cd ./services/common && npm install --production
COPY services/purchase-service ./services/purchase-service
RUN cd ./services/purchase-service && npm install --production
WORKDIR /app/services/purchase-service
EXPOSE 5006
CMD ["node", "server.js"]
