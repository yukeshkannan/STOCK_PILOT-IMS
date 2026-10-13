# StockPilot — Production Incident Runbook & Troubleshooting

## 1. Incident Severity Definitions

| Level | Impact | Target Resolution | Examples |
| :---: | :--- | :---: | :--- |
| **P1 - Critical** | Entire platform or API Gateway down; POS checkout failing | < 30 mins | Gateway crash, MySQL database down, Auth service failure. |
| **P2 - High** | One microservice unavailable (e.g. Finance or AI service) | < 2 hours | Background event consumer stuck, Report generator timeout. |
| **P3 - Medium** | Degraded performance or cosmetic bug | < 24 hours | UI styling issue, intermittent notification delays. |

---

## 2. Common Incidents & Rapid Resolution

### Scenario 1: API Gateway Returning `503 SERVICE_UNAVAILABLE`
**Symptom**: User receives `{ "success": false, "message": "Service [inventory] is currently unavailable" }`.

**Root Cause**: Downstream microservice process terminated or port is unreachable.

**Remediation Steps**:
1. Check gateway health check to identify the dead service:
   ```bash
   curl -s http://localhost:5000/health
   ```
2. Inspect logs for the failing container:
   ```bash
   docker logs --tail 100 stockpilot-inventory-service
   ```
3. Restart the specific container:
   ```bash
   docker-compose -f docker-compose.prod.yml restart inventory-service
   ```

---

### Scenario 2: RabbitMQ Broker Disconnected or Events Backlog
**Symptom**: Invoices are created in Sales, but stock is not deducted in Inventory.

**Remediation Steps**:
1. Check RabbitMQ Management UI at `http://localhost:15672` (default user: `guest`, pass: `guest`).
2. Verify queue depths under `stockpilot.events` exchange.
3. If consumers are hung, restart the common worker services:
   ```bash
   docker-compose -f docker-compose.prod.yml restart inventory-service notification-service
   ```

---

### Scenario 3: Database Connection Limit Exceeded
**Symptom**: `SequelizeConnectionError: Too many connections`.

**Remediation Steps**:
1. Check active MySQL connections:
   ```sql
   SHOW STATUS WHERE `variable_name` = 'Threads_connected';
   ```
2. Increase max connections in MySQL config or container:
   ```sql
   SET GLOBAL max_connections = 500;
   ```
3. Verify connection pool settings in `services/common/src/db/connection.js` (recommended `max: 20`, `min: 2` per service container).

---

## 3. Database Backup & Disaster Recovery

### Daily Automated Backup Command:
```bash
docker exec stockpilot-mysql /usr/bin/mysqldump -u root --password=rootpassword --all-databases > backup_$(date +%F).sql
```

### Full Restore Command:
```bash
cat backup_2026-10-13.sql | docker exec -i stockpilot-mysql /usr/bin/mysql -u root --password=rootpassword
```

---

## 4. Reset & Reseed (Development / Staging Only)

If test databases become corrupted in staging:
```bash
# WARNING: Clears and resets all tenant data
node scripts/seed-all.js
```
