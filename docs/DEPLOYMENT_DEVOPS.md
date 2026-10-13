# StockPilot — Production Deployment & DevOps Guide

## 1. Production Architecture Overview

In production, client traffic terminates at an **Nginx Reverse Proxy with SSL (HTTPS)** which routes API traffic to the **API Gateway** and static frontend assets to a dedicated static server or CDN.

```mermaid
graph TD
    Internet[Public Internet HTTPS 443] --> Nginx[Nginx Ingress / SSL Reverse Proxy]
    
    subgraph "Internal Docker Bridge Network: stockpilot-network"
        Nginx -->|Proxy /api/*| GW[API Gateway :5000]
        Nginx -->|Proxy /*| Front[React Frontend Web App :3000]
        
        GW --> Auth[auth-service :5001]
        GW --> Tenant[tenant-service :5002]
        GW --> Product[product-service :5003]
        GW --> Inv[inventory-service :5004]
        GW --> Warehouse[warehouse-service :5005]
        GW --> Purchase[purchase-service :5006]
        GW --> Sales[sales-service :5007]
        GW --> Finance[finance-service :5008]
        GW --> Notif[notification-service :5009]
        GW --> AI[ai-service :5010]

        Auth & Tenant & Product & Inv & Warehouse & Purchase & Sales & Finance & Notif --> MySQL[(MySQL 8.0 :3306)]
        Inv & Purchase & Sales & Notif --> RabbitMQ[(RabbitMQ :5672)]
        GW & Inv --> Redis[(Redis Cache :6379)]
    end
```

---

## 2. Docker Compose Production Deployment

The project contains a production-tuned configuration: `docker-compose.prod.yml`.

### Step 1: Clone & Configure Production Environment
```bash
cp .env.example .env.production
```
Make sure to replace secrets:
- Generate a strong `JWT_SECRET` (e.g. `openssl rand -hex 32`)
- Set a complex `MYSQL_ROOT_PASSWORD`
- Set secure credentials for `SUPERADMIN_PASSWORD`

### Step 2: Build & Start All Containers
```bash
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

### Step 3: Verify Container Health
```bash
docker-compose -f docker-compose.prod.yml ps
```

---

## 3. Environment Variables Reference

| Variable | Description | Sample Production Value |
| :--- | :--- | :--- |
| `NODE_ENV` | Runtime environment | `production` |
| `PORT` | API Gateway Port | `5000` |
| `JWT_SECRET` | Primary JWT signing secret | `3f9a7c8... (64 hex characters)` |
| `JWT_REFRESH_SECRET`| Refresh token signing secret | `8e2b1d0... (64 hex characters)` |
| `DB_HOST` | MySQL hostname | `mysql` (Docker container name) or AWS RDS endpoint |
| `DB_PORT` | MySQL port | `3306` |
| `DB_USER` | MySQL username | `root` or dedicated app user |
| `DB_PASSWORD` | MySQL password | *[Strong Secret]* |
| `RABBITMQ_URL` | AMQP connection string | `amqp://user:pass@rabbitmq:5672` or CloudAMQP URI |
| `REDIS_URL` | Redis connection string | `redis://redis:6379` |
| `CORS_ORIGIN` | Allowed web origins | `https://app.stockpilot.io` |

---

## 4. Health Checks & Monitoring

The API Gateway provides a consolidated health check endpoint:
```http
GET http://localhost:5000/health
```

### Response Example:
```json
{
  "status": "UP",
  "service": "API Gateway",
  "timestamp": "2026-10-13T10:15:00.000Z",
  "services": {
    "auth": "http://auth-service:5001",
    "tenant": "http://tenant-service:5002",
    "product": "http://product-service:5003",
    "inventory": "http://inventory-service:5004",
    "warehouse": "http://warehouse-service:5005",
    "purchase": "http://purchase-service:5006",
    "sales": "http://sales-service:5007",
    "finance": "http://finance-service:5008",
    "notifications": "http://notification-service:5009",
    "ai": "http://ai-service:5010"
  }
}
```

---

## 5. Zero-Downtime Update Routine
When rolling out new microservice updates:
```bash
# 1. Pull latest git code
git pull origin main

# 2. Rebuild and restart only the updated service container
docker-compose -f docker-compose.prod.yml up -d --no-deps --build inventory-service

# 3. Clean up dangling images
docker image prune -f
```
