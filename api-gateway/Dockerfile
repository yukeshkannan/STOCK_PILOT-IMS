FROM node:20-alpine
WORKDIR /app
COPY api-gateway/package*.json ./
RUN npm install --production
COPY api-gateway/ ./
EXPOSE 5000
CMD ["node", "server.js"]
