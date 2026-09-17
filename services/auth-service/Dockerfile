FROM node:20-alpine
WORKDIR /app
COPY services/common ./services/common
RUN cd ./services/common && npm install --production
COPY services/auth-service ./services/auth-service
RUN cd ./services/auth-service && npm install --production
WORKDIR /app/services/auth-service
EXPOSE 5001
CMD ["node", "server.js"]
