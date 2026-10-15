# StockPilot — Standard API Contracts & Endpoints Reference

## 1. Uniform Response Envelopes

All microservices adhere to standard JSON response envelopes to simplify client parsing and eliminate inconsistent error models.

### ✅ Success Response (200 OK / 201 Created)
```json
{
  "success": true,
  "data": {
    "id": 101,
    "name": "Wireless Mouse",
    "sku": "WM-001",
    "current_stock": 50
  },
  "message": "Resource retrieved successfully"
}
```

### ❌ Error Response (4xx / 5xx)
```json
{
  "success": false,
  "message": "Available stock (3) is less than requested quantity (5)",
  "errorCode": "INSUFFICIENT_STOCK",
  "details": null
}
```

---

## 2. Standard Header Conventions

### Client to API Gateway
| Header | Requirement | Description |
| :--- | :---: | :--- |
| `Authorization` | Mandatory (protected routes) | `Bearer <JWT_TOKEN>` |
| `Content-Type` | Mandatory (POST / PUT / PATCH) | `application/json` |
| `Idempotency-Key` | Optional (checkout/payments) | Unique UUID to guarantee one-time operation execution |

### Injected by Gateway to Downstream Microservices
| Header | Description |
| :--- | :--- |
| `x-tenant-id` | Numeric identifier of current tenant organization (`12`) |
| `x-user-id` | Authenticated user ID (`104`) |
| `x-user-role` | User role string (`ADMIN`, `MANAGER`, `STAFF`) |
| `x-company-code` | Short organization code (`ABC001`) |
| `x-user-permissions` | JSON array of permission strings |
| `x-is-super-admin` | `'true'` or `'false'` |

---

## 3. Microservices Endpoint Catalog

### 🔐 1. Auth Service (`/api/v1/auth`)
| Method | Route | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/v1/auth/register` | Register user account with first name, last name, email, password | No |
| `POST` | `/api/v1/auth/login` | Authenticate user with email and password (auto-routes by role) | No |
| `POST` | `/api/v1/auth/dev-login` | Authenticate developer team member with email and passkey | No |
| `POST` | `/api/v1/auth/complete-profile` | Complete organization setup (business name, phone, city, plan) | Yes |
| `POST` | `/api/v1/auth/refresh` | Refresh access token using refresh token | No |
| `GET` | `/api/v1/auth/me` | Fetch authenticated profile details & active subscription | Yes |
| `POST` | `/api/v1/auth/logout` | Invalidate current session token | Yes |

### 🏢 2. Tenant & User Service (`/api/v1/...`)
| Method | Route | Description | Min Role |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/tenants/me` | Get current tenant profile | `STAFF` |
| `PUT` | `/api/v1/tenants/me` | Update tenant company profile | `ADMIN` |
| `GET` | `/api/v1/tenants/settings` | Get tenant business settings | `STAFF` |
| `PUT` | `/api/v1/tenants/settings` | Update tenant business settings | `ADMIN` |
| `GET` | `/api/v1/tenants/store-config` | Load storefront visual builder config & theme | `ADMIN` |
| `PUT` | `/api/v1/tenants/store-config` | Save and publish storefront builder design | `ADMIN` |
| `GET` | `/api/v1/tenants/tickets` | List tenant support tickets & status | `STAFF` |
| `POST` | `/api/v1/tenants/tickets` | Submit new support helpdesk ticket | `STAFF` |
| `GET` | `/api/v1/users` | List company staff users | `ADMIN` |
| `POST` | `/api/v1/users` | Invite / create user account | `ADMIN` |
| `GET` | `/api/v1/roles` | List tenant roles and permissions | `ADMIN` |
| `GET` | `/api/v1/admin/tenants` | Platform Super Admin list of tenants | `SUPER_ADMIN` |
| `POST` | `/api/v1/admin/tenants` | Provision new tenant organization | `SUPER_ADMIN` |
| `PATCH` | `/api/v1/admin/tenants/:id/status` | Suspend or activate tenant company | `SUPER_ADMIN` |
| `GET` | `/api/v1/admin/tickets` | Helpdesk ticket queue for devs and superadmin | `SUPER_ADMIN / DEV` |
| `GET` | `/api/v1/admin/team` | Developer & support team directory | `SUPER_ADMIN / DEV` |

### 📦 3. Product Service (`/api/v1/...`)
| Method | Route | Description | Min Role |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/products/public/store/:companyCode` | Public storefront catalog & theme configuration | `PUBLIC` |
| `GET` | `/api/v1/products` | Paginated product list with search/filter | `STAFF` |
| `POST` | `/api/v1/products` | Create new SKU with barcode, pricing, tax | `MANAGER` |
| `GET` | `/api/v1/products/:id` | Get single product details | `STAFF` |
| `PUT` | `/api/v1/products/:id` | Update product metadata | `MANAGER` |
| `DELETE`| `/api/v1/products/:id` | Soft delete product | `ADMIN` |
| `GET` | `/api/v1/categories` | List product categories | `STAFF` |
| `GET` | `/api/v1/brands` | List product brands | `STAFF` |

### 📊 4. Inventory Service (`/api/v1/inventory`)
| Method | Route | Description | Min Role |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/inventory` | List stock levels per warehouse & SKU | `STAFF` |
| `GET` | `/api/v1/inventory/movements` | Stock movement audit history (8 movement types) | `STAFF` |
| `POST` | `/api/v1/inventory/adjust` | Manual inventory correction (reconciliation) | `MANAGER` |
| `GET` | `/api/v1/inventory/low-stock` | Retrieve SKUs falling below reorder point | `STAFF` |

### 🏭 5. Warehouse Service (`/api/v1/...`)
| Method | Route | Description | Min Role |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/warehouses` | List storage warehouses | `STAFF` |
| `POST` | `/api/v1/warehouses` | Add warehouse facility | `ADMIN` |
| `GET` | `/api/v1/transfers` | List stock transfer requests | `STAFF` |
| `POST` | `/api/v1/transfers` | Initiate inter-warehouse stock transfer | `MANAGER` |
| `PATCH` | `/api/v1/transfers/:id/status` | Approve / Dispatch / Receive transfer | `MANAGER` |

### 🛒 6. Purchase Service (`/api/v1/...`)
| Method | Route | Description | Min Role |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/suppliers` | List approved vendors | `STAFF` |
| `POST` | `/api/v1/suppliers` | Register new supplier | `MANAGER` |
| `GET` | `/api/v1/purchases` | List Purchase Orders (PO) | `STAFF` |
| `POST` | `/api/v1/purchases` | Create PO with item lines & tax | `MANAGER` |
| `PATCH` | `/api/v1/purchases/:id/receive`| Mark PO received (auto-intakes to inventory) | `MANAGER` |
| `GET` | `/api/v1/purchase-returns` | Purchase returns directory | `MANAGER` |

### 💰 7. Sales & POS Service (`/api/v1/...`)
| Method | Route | Description | Min Role |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/customers` | Customer directory with balance tracking | `STAFF` |
| `POST` | `/api/v1/customers` | Create customer profile | `STAFF` |
| `GET` | `/api/v1/sales` | List sales invoices | `STAFF` |
| `POST` | `/api/v1/sales` | Checkout invoice, reserve/deduct stock | `STAFF` |
| `GET` | `/api/v1/sales/:id` | Full invoice details for printing / PDF | `STAFF` |
| `POST` | `/api/v1/sales-returns` | Process item return & restock | `MANAGER` |
| `POST` | `/api/v1/sales/public/order` | Direct storefront customer checkout | `PUBLIC` |
| `POST` | `/api/v1/sales/public/otp/send` | Send 4-digit OTP for 1-Click Fast Checkout | `PUBLIC` |
| `POST` | `/api/v1/sales/public/otp/verify` | Verify OTP & retrieve returning customer details | `PUBLIC` |
| `POST` | `/api/v1/sales/public/customer/register` | Register customer account scoped to tenant store | `PUBLIC` |
| `POST` | `/api/v1/sales/public/customer/login` | Customer login with mobile/email and password | `PUBLIC` |
| `GET` | `/api/v1/sales/public/customer/profile` | Fetch customer profile and saved delivery addresses | `PUBLIC` |
| `GET` | `/api/v1/sales/public/customer/orders` | Fetch customer order history with live fulfillment statuses | `PUBLIC` |
| `GET` | `/api/v1/sales/public/order/track/:invoiceNumber` | Real-time 6-stage order tracking & courier details | `PUBLIC` |
| `GET` | `/api/v1/sales/public/invoice/:invoiceNumber` | Public E-bill / tax invoice lookup | `PUBLIC` |

### 💳 8. Finance Service (`/api/v1/...`)
| Method | Route | Description | Min Role |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/payments` | Payment transactions ledger | `ACCOUNTANT` |
| `POST` | `/api/v1/payments` | Record customer or vendor payment | `ACCOUNTANT` |
| `GET` | `/api/v1/expenses` | Operational expenses list | `ACCOUNTANT` |
| `POST` | `/api/v1/expenses` | Log business expense (Rent, utilities, etc.) | `ACCOUNTANT` |
| `GET` | `/api/v1/reports/profit-loss` | Compute Net Profit & Loss summary | `ACCOUNTANT` |

### 🔔 9. Notification Service (`/api/v1/notifications`)
| Method | Route | Description | Min Role |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/notifications` | Fetch unread in-app alerts | `STAFF` |
| `PATCH` | `/api/v1/notifications/:id/read` | Mark alert as read | `STAFF` |
| `PATCH` | `/api/v1/notifications/read-all`| Mark all alerts read | `STAFF` |

### 🤖 10. AI Service (`/api/v1/ai`)
| Method | Route | Description | Min Role |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/ai/suggested-prompts` | Prompt suggestions for smart copilot | `STAFF` |
| `POST` | `/api/v1/ai/ask` | Natural language store analytics query | `STAFF` |
