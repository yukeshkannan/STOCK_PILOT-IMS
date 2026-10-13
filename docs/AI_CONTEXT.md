# StockPilot — AI Context & Quick Reference Cheat Sheet

> **Purpose**: Ultra-compact system context for AI agents and developers. Read this file first to obtain complete project understanding in <600 tokens.

---

## ⚡ 1. System Overview
- **Domain**: Multi-Tenant Inventory, POS, Procurement, Multi-Warehouse Transfer, Finance, and Analytics SaaS.
- **Architecture**: Microservices pattern behind an API Gateway with REST proxy + RabbitMQ event-driven asynchronous messaging.
- **Tenant Isolation**: Row-Level Multi-Tenancy with verified JWT context (`x-tenant-id`) enforced at both Gateway and service layers.
- **Core Formula**: `Available Stock = Current Stock - Reserved Stock`.

---

## 🔌 2. Service Port & Prefix Matrix

| Service | Port | Base Proxy Route | Database (MySQL) | Key Responsibilities |
| :--- | :---: | :--- | :--- | :--- |
| **API Gateway** | `5000` | `/api/v1/*` | *None* | Rate limiting, CORS, JWT decoding, Context header injection |
| **Auth Service** | `5001` | `/api/v1/auth` | `auth_db` | User credentials, JWT signing, password hashing |
| **Tenant Service** | `5002` | `/api/v1/tenants`, `/api/v1/users`, `/api/v1/roles`, `/api/v1/admin` | `tenant_db` | Multi-tenant orgs, RBAC roles, permission matrix, platform audit |
| **Product Service** | `5003` | `/api/v1/products`, `/api/v1/categories`, `/api/v1/brands` | `product_db` | SKU catalog, barcodes, categories, brands, variants |
| **Inventory Service**| `5004` | `/api/v1/inventory` | `inventory_db` | Stock levels, reservation, 8-movement audit history |
| **Warehouse Service**| `5005` | `/api/v1/warehouses`, `/api/v1/transfers` | `warehouse_db` | Warehouse locations, bins, transfer workflow (`PENDING`->`COMPLETED`) |
| **Purchase Service** | `5006` | `/api/v1/suppliers`, `/api/v1/purchases`, `/api/v1/purchase-returns` | `purchase_db` | PO lifecycle, vendor management, automated stock intake |
| **Sales Service** | `5007` | `/api/v1/customers`, `/api/v1/sales`, `/api/v1/sales-returns` | `sales_db` | POS billing, stock reservation, customer ledger, tax invoices |
| **Finance Service** | `5008` | `/api/v1/payments`, `/api/v1/expenses`, `/api/v1/reports` | `finance_db` | Receipts, expenses, profit/loss calculations |
| **Notification Svc** | `5009` | `/api/v1/notifications` | `notification_db` | In-app alerts, low stock warnings, system broadcasts |
| **AI Service** | `5010` | `/api/v1/ai` | *None / ai_db* | Business intelligence assistant & Copilot prompt fallback |
| **Frontend App** | `3000` / `5173` | `/` | *None* | React 18, Vite, Redux Toolkit, Tailwind/Vanilla CSS |

---

## 🛡️ 3. Authentication & Context Injection

1. **Client Request**: Sends `Authorization: Bearer <token>` to API Gateway (`5000`).
2. **API Gateway Middleware** (`api-gateway/src/middleware/authGateway.js`):
   - Verifies JWT with `JWT_SECRET`.
   - Injects downstream context headers:
     - `x-tenant-id`: Target company tenant identifier
     - `x-user-id`: Authenticated user ID
     - `x-user-role`: `SUPER_ADMIN`, `ADMIN`, `MANAGER`, `STAFF`, `ACCOUNTANT`, `DEVELOPER`
     - `x-company-code`: Organization unique slug
     - `x-user-permissions`: JSON string of granular permission keys
3. **Downstream Services**: Common middleware (`services/common/src/middleware/tenantIsolation.js`) extracts `req.tenantId` and enforces tenant queries via `withTenant(req.tenantId, condition)`.

---

## 📬 4. Event Bus (RabbitMQ)
- **Exchange**: `stockpilot.events` (Topic Exchange).
- **Core Events**:
  - `sale.completed` ➔ Deducts inventory in `inventory-service`, records income in `finance-service`.
  - `purchase.approved` ➔ Auto-increments stock in `inventory-service`.
  - `stock.low_alert` ➔ Dispatches notification in `notification-service`.
  - `transfer.dispatched` ➔ Moves stock to in-transit status.

---

## 🛠️ 5. Development CLI Commands
```bash
# 1. Install all dependencies across services & frontend:
node scripts/install-all.js

# 2. Initialize and seed databases:
node scripts/seed-all.js

# 3. Launch all microservices & gateway:
node scripts/start-all-services.js

# 4. Run frontend:
cd frontend && npm run dev
```

---

## 📚 6. Documentation Map
- Full System Topology: [ARCHITECTURE.md](file:///e:/STOCK_PILOT-IMS/docs/ARCHITECTURE.md)
- Tenancy & Security Guidelines: [SECURITY.md](file:///e:/STOCK_PILOT-IMS/docs/SECURITY.md)
- Complete Endpoints & Response Formats: [API_CONTRACTS.md](file:///e:/STOCK_PILOT-IMS/docs/API_CONTRACTS.md)
- Microservices Database Models: [DATABASE_SCHEMA.md](file:///e:/STOCK_PILOT-IMS/docs/DATABASE_SCHEMA.md)
- Pub/Sub Queues & Payloads: [EVENT_DRIVEN_FLOWS.md](file:///e:/STOCK_PILOT-IMS/docs/EVENT_DRIVEN_FLOWS.md)
- Docker & Production Deployment: [DEPLOYMENT_DEVOPS.md](file:///e:/STOCK_PILOT-IMS/docs/DEPLOYMENT_DEVOPS.md)
- Ops & Troubleshooting: [INCIDENT_RUNBOOK.md](file:///e:/STOCK_PILOT-IMS/docs/INCIDENT_RUNBOOK.md)
