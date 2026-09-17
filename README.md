# StockPilot — Multi-Tenant Inventory & Business Management SaaS

StockPilot is a production-ready, microservices-based SaaS platform designed for multi-tenant inventory management, sales invoicing (POS), procurement orders, multi-warehouse stock transfers, finance tracking, and executive business analytics.

---

## 🌟 Key Features

1. **Strict Multi-Tenancy**: Data isolated per `tenant_id` at every microservice layer via verified JWT contexts.
2. **Authentication & RBAC**: Tenant login using `company_code` + `email` + `password`, role matrix (`SUPER_ADMIN`, `ADMIN`, `MANAGER`, `STAFF`, `ACCOUNTANT`) and granular permission checks.
3. **Core Inventory Engine**: Live Stock formula (`Available Stock = Current Stock - Reserved Stock`), multi-warehouse stock allocations, and comprehensive 8-movement audit history.
4. **Multi-Warehouse Stock Transfers**: Multi-stage transfer workflow (`PENDING` -> `APPROVED` -> `COMPLETED`/`REJECTED`).
5. **Procurement & Purchasing**: Supplier directory, Purchase Orders with tax & discount calculation, automated inventory intake upon approval, and Purchase Returns.
6. **Sales & POS Invoicing**: Fast invoice builder with instant stock availability validation, auto-deduction, customer balance tracking, and printable GST tax invoice template.
7. **Finance & Expenses**: Payment receipts, operational expense categorization, and net profit calculations.
8. **Real-time Notifications**: In-app notification center for low stock warnings, out of stock alerts, sales, and warehouse transfer updates.
9. **Platform Super Admin Portal**: Manage registered business organizations, activate or suspend tenant companies, and inspect system audit logs.

---

## 🏗️ Architecture & Service Boundaries

```
                         STOCKPILOT SaaS
                               │
                               ▼
                    React 18 + Vite Frontend
                               │ (HTTP / REST)
                               ▼
                     API Gateway (Port 5000)
                               │
        ┌──────────────────────┼───────────────────────┐
        │                      │                       │
        ▼                      ▼                       ▼
  Auth Service          Tenant/User Service      Product Service
   (Port 5001)             (Port 5002)             (Port 5003)
     auth_db                tenant_db               product_db
        │                      │                       │
        └──────────────────────┼───────────────────────┘
                               │
        ┌──────────────────────┼───────────────────────┐
        │                      │                       │
        ▼                      ▼                       ▼
 Inventory Service      Warehouse Service       Purchase Service
   (Port 5004)             (Port 5005)             (Port 5006)
  inventory_db            warehouse_db             purchase_db
        │                      │                       │
        └──────────────────────┼───────────────────────┘
                               │
        ┌──────────────────────┼───────────────────────┐
        │                      │                       │
        ▼                      ▼                       ▼
   Sales Service         Finance Service        Notification Service
   (Port 5007)             (Port 5008)             (Port 5009)
    sales_db               finance_db            notification_db
                               │
                        RabbitMQ Events
                               │
                      Docker Orchestration
```

---

## 🔑 Demo Login Credentials

| Role / Organization | Company Code | Email | Password |
| :--- | :--- | :--- | :--- |
| **Platform Super Admin** | `PLATFORM` | `superadmin@stockpilot.io` | `adminpassword123` |
| **ABC Electronics (Admin)** | `ABC001` | `admin@abc.com` | `password123` |
| **ABC Electronics (Manager)**| `ABC001` | `manager@abc.com` | `password123` |
| **ABC Electronics (Staff)**  | `ABC001` | `staff@abc.com` | `password123` |
| **Sri Lakshmi Traders**      | `SLT002` | `admin@lakshmi.com` | `password123` |
| **Kumar Distributors**       | `KUM003` | `admin@kumar.com` | `password123` |

---

## 🚀 Quick Start (Local Development)

### 1. Install all dependencies across services & frontend:
```bash
node scripts/install-all.js
```

### 2. Initialize and seed databases:
```bash
node scripts/seed-all.js
```

### 3. Launch all 9 backend microservices & API Gateway:
```bash
node scripts/start-all-services.js
```

### 4. Start the frontend:
```bash
cd frontend && npm run dev
```

Visit the app at **`http://localhost:3000`** (or `http://localhost:5173`).

---

## 🐳 Docker Deployment

To launch the complete infrastructure (MySQL, RabbitMQ, Redis, API Gateway, 9 Microservices, and Nginx Frontend) with one command:

```bash
docker compose up --build
```
