FROM node:20-alpine
WORKDIR /app
COPY services/common ./services/common
RUN cd ./services/common && npm install --production
COPY services/notification-service ./services/notification-service
RUN cd ./services/notification-service && npm install --production
WORKDIR /app/services/notification-service
EXPOSE 5009
CMD ["node", "server.js"]
