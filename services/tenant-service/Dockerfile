FROM node:20-alpine
WORKDIR /app
COPY services/common ./services/common
RUN cd ./services/common && npm install --production
COPY services/tenant-service ./services/tenant-service
RUN cd ./services/tenant-service && npm install --production
WORKDIR /app/services/tenant-service
EXPOSE 5002
CMD ["node", "server.js"]
