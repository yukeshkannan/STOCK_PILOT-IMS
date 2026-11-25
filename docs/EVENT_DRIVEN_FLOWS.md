# StockPilot — Event-Driven Architecture & RabbitMQ Flows

## 1. Asynchronous Event-Driven Architecture

StockPilot utilizes **RabbitMQ** (topic exchange `stockpilot.events`) for asynchronous decoupled operations. This ensures that slow downstream tasks (such as sending alerts, audit logging, and financial ledger calculations) do not block immediate user checkout or inventory operations.

```mermaid
graph TD
    Sales[Sales Service] -->|Publish: sale.created| Ex[Exchange: stockpilot.events]
    Purchase[Purchase Service] -->|Publish: purchase.received| Ex
    Warehouse[Warehouse Service] -->|Publish: transfer.completed| Ex

    Ex -->|Route: sale.*| Q_Inv[Queue: inventory.sync]
    Ex -->|Route: sale.*| Q_Fin[Queue: finance.sync]
    Ex -->|Route: stock.*| Q_Notif[Queue: notifications.dispatch]
    
    Q_Inv --> Inv[Inventory Service]
    Q_Fin --> Fin[Finance Service]
    Q_Notif --> Notif[Notification Service]
```

---

## 2. Key Business Event Workflows

### 🛒 Flow 1: Sales Checkout & Inventory Auto-Deduction

```mermaid
sequenceDiagram
    autonumber
    actor Cashier as User (POS Staff)
    participant Sales as Sales Service
    participant Rabbit as RabbitMQ (stockpilot.events)
    participant Inv as Inventory Service
    participant Notif as Notification Service

    Cashier->>Sales: POST /api/v1/sales (Checkout invoice)
    Sales->>Sales: Save invoice & invoice items
    Sales->>Rabbit: Publish event: "sale.created"
    Sales-->>Cashier: 201 Created (Instant Invoice Response)

    par Asynchronous Processing
        Rabbit->>Inv: Consume "sale.created"
        Inv->>Inv: Deduct current_stock & Record SALE movement
        alt Available stock <= Reorder point
            Inv->>Rabbit: Publish event: "stock.low_alert"
            Rabbit->>Notif: Consume "stock.low_alert"
            Notif->>Notif: Insert in-app alert for managers
        end
    end
```

---

### 📦 Flow 2: Purchase Order Receipt & Automated Stock Intake

```mermaid
sequenceDiagram
    autonumber
    actor Manager as Warehouse Manager
    participant Purchase as Purchase Service
    participant Rabbit as RabbitMQ
    participant Inv as Inventory Service
    participant Fin as Finance Service

    Manager->>Purchase: PATCH /api/v1/purchases/:id/receive
    Purchase->>Purchase: Update PO status to RECEIVED
    Purchase->>Rabbit: Publish event: "purchase.received"
    Purchase-->>Manager: 200 OK

    par Asynchronous Inventory & Accounts
        Rabbit->>Inv: Consume "purchase.received"
        Inv->>Inv: Increment current_stock & Record PURCHASE movement
        Rabbit->>Fin: Consume "purchase.received"
        Fin->>Fin: Create accounts payable entry
    end
```

---

## 3. RabbitMQ Event Catalog

| Event Routing Key | Publisher | Subscribers | Action Triggered |
| :--- | :--- | :--- | :--- |
| `sale.created` | Sales Service | Inventory Service, Finance Service | Deducts physical inventory, logs revenue ledger entry. |
| `sale.cancelled` | Sales Service | Inventory Service | Releases reserved stock or restocks inventory. |
| `purchase.received` | Purchase Service | Inventory Service, Finance Service | Increments physical stock, logs vendor payable. |
| `stock.low_alert` | Inventory Service | Notification Service | Sends banner alert to Managers & Admins. |
| `transfer.dispatched`| Warehouse Service | Inventory Service | Moves stock from Source Warehouse to In-Transit. |
| `transfer.completed` | Warehouse Service | Inventory Service, Notification Service | Deposits stock into Destination Warehouse. |
| `tenant.created` | Auth Service | Tenant Service, Warehouse Service | Auto-provisions tenant schema & default warehouse facilities. |

---

## 4. Standard Event Payload Schema

All published events conform to this JSON schema:

```json
{
  "event": "sale.created",
  "eventId": "evt_9a8b7c6d5e4f",
  "tenantId": 1,
  "timestamp": "2026-10-13T10:15:00.000Z",
  "data": {
    "invoiceId": 1052,
    "invoiceNumber": "INV-2026-0012",
    "warehouseId": 3,
    "items": [
      {
        "productId": 204,
        "quantity": 5,
        "unitPrice": 1200.00
      }
    ]
  }
}
```

---

## 5. Resilience & Dead-Letter Queue (DLQ) Architecture

The shared event bus client (`services/common/src/events/eventBus.js`) implements enterprise-grade resilience:

- **Dead-Letter Exchange (DLX)**: A durable direct exchange named `stockpilot.dlx` is automatically provisioned.
- **Dead-Letter Queues (DLQ)**: Every consumer queue asserts with:
  - `x-dead-letter-exchange: "stockpilot.dlx"`
  - `x-dead-letter-routing-key: "<queueName>.dead"`
  A paired queue `<queueName>.dlq` is bound to `stockpilot.dlx` with routing key `<queueName>.dead`.
- **Exponential Retry Backoff**: When message consumption throws an unhandled error:
  1. The consumer retries up to **3 attempts** with exponential backoff (`1000ms * 2^(attempt - 1)`).
  2. If all 3 attempts fail, the message is permanently rejected (`nack(msg, false, false)`).
  3. RabbitMQ automatically forwards the rejected message into the DLQ with full original headers (`x-death`, error stack, retry count).
- **Zero Silent Data Loss**: Failed checkout, stock sync, or accounting events never disappear into void; SREs and developers can inspect the `.dlq` queues and replay messages after bug fixes.
- **Automatic Reconnection**: Re-attempts connection upon broker disconnection with graceful fallback if broker is temporarily unavailable.
- **Durable Exchanges & Queues**: `stockpilot.events` and all consumer queues are asserted with `{ durable: true }` to survive broker restarts.
