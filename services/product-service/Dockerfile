FROM node:20-alpine
WORKDIR /app
COPY services/common ./services/common
RUN cd ./services/common && npm install --production
COPY services/product-service ./services/product-service
RUN cd ./services/product-service && npm install --production
WORKDIR /app/services/product-service
EXPOSE 5003
CMD ["node", "server.js"]
