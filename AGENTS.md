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

## 🛑 Strict Development & Deployment Workflow
To ensure production quality, stability, and developer alignment, ALWAYS follow this 4-step protocol:
1. **Analyze & Plan**: When the user requests a task/fix/feature, analyze it thoroughly and present a clear, production-grade **Implementation Plan** first. (Do not write plans for simple queries or quick lookups).
2. **Approval Gate**: Do NOT edit or write code until the user explicitly reviews and approves the plan.
3. **Execution & Review**: Implement the changes cleanly, verify the build/syntax, and summarize what was done for the user to review.
4. **Push Confirmation Gate**: NEVER push to GitHub (`git push`) automatically. Only push when the user explicitly instructs to do so.
