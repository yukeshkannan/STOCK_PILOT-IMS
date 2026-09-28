FROM node:20-alpine
WORKDIR /app
COPY services/common ./services/common
RUN cd ./services/common && npm install --production
COPY services/ai-service ./services/ai-service
RUN cd ./services/ai-service && npm install --production
WORKDIR /app/services/ai-service
EXPOSE 5010
CMD ["node", "server.js"]
