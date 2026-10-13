# AI Agent Guidelines & Context for StockPilot

Welcome to **StockPilot**, a Multi-Tenant Inventory & Business Management Microservices SaaS platform.

## ⚡ Quick Knowledge Reference
To save token context and immediately understand the project, read the documentation files located in `docs/`:
- **Cheat Sheet & Overview**: [AI_CONTEXT.md](file:///e:/STOCK_PILOT-IMS/docs/AI_CONTEXT.md)
- **Microservices & System Flow**: [ARCHITECTURE.md](file:///e:/STOCK_PILOT-IMS/docs/ARCHITECTURE.md)
- **Multi-Tenancy & RBAC Security**: [SECURITY.md](file:///e:/STOCK_PILOT-IMS/docs/SECURITY.md)
- **API Endpoints & Contracts**: [API_CONTRACTS.md](file:///e:/STOCK_PILOT-IMS/docs/API_CONTRACTS.md)
- **Database Tables & Isolation**: [DATABASE_SCHEMA.md](file:///e:/STOCK_PILOT-IMS/docs/DATABASE_SCHEMA.md)
- **RabbitMQ Async Events**: [EVENT_DRIVEN_FLOWS.md](file:///e:/STOCK_PILOT-IMS/docs/EVENT_DRIVEN_FLOWS.md)
- **DevOps, Docker & Env**: [DEPLOYMENT_DEVOPS.md](file:///e:/STOCK_PILOT-IMS/docs/DEPLOYMENT_DEVOPS.md)

## 🔄 Mandatory Documentation Synchronization Rule
**CRITICAL**: Whenever you modify:
1. Endpoints, request/response bodies ➔ Update [API_CONTRACTS.md](file:///e:/STOCK_PILOT-IMS/docs/API_CONTRACTS.md).
2. Sequelize/MySQL models, tables, columns ➔ Update [DATABASE_SCHEMA.md](file:///e:/STOCK_PILOT-IMS/docs/DATABASE_SCHEMA.md).
3. System ports, services, proxy routes ➔ Update [ARCHITECTURE.md](file:///e:/STOCK_PILOT-IMS/docs/ARCHITECTURE.md) & [AI_CONTEXT.md](file:///e:/STOCK_PILOT-IMS/docs/AI_CONTEXT.md).
4. Roles, permissions, token payloads, isolation logic ➔ Update [SECURITY.md](file:///e:/STOCK_PILOT-IMS/docs/SECURITY.md).
5. RabbitMQ publishers/subscribers/topics ➔ Update [EVENT_DRIVEN_FLOWS.md](file:///e:/STOCK_PILOT-IMS/docs/EVENT_DRIVEN_FLOWS.md).
