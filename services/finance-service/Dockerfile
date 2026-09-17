FROM node:20-alpine
WORKDIR /app
COPY services/common ./services/common
RUN cd ./services/common && npm install --production
COPY services/finance-service ./services/finance-service
RUN cd ./services/finance-service && npm install --production
WORKDIR /app/services/finance-service
EXPOSE 5008
CMD ["node", "server.js"]
