require('dotenv').config();

const SERVICES = {
  auth: {
    url: process.env.AUTH_SERVICE_URL || 'http://localhost:5001',
    prefix: '/api/v1/auth'
  },
  tenant: {
    url: process.env.TENANT_SERVICE_URL || 'http://localhost:5002',
    prefix: '/api/v1/tenants'
  },
  users: {
    url: process.env.TENANT_SERVICE_URL || 'http://localhost:5002',
    prefix: '/api/v1/users'
  },
  roles: {
    url: process.env.TENANT_SERVICE_URL || 'http://localhost:5002',
    prefix: '/api/v1/roles'
  },
  permissions: {
    url: process.env.TENANT_SERVICE_URL || 'http://localhost:5002',
    prefix: '/api/v1/permissions'
  },
  audit: {
    url: process.env.TENANT_SERVICE_URL || 'http://localhost:5002',
    prefix: '/api/v1/audit-logs'
  },
  admin: {
    url: process.env.TENANT_SERVICE_URL || 'http://localhost:5002',
    prefix: '/api/v1/admin'
  },
  products: {
    url: process.env.PRODUCT_SERVICE_URL || 'http://localhost:5003',
    prefix: '/api/v1/products'
  },
  categories: {
    url: process.env.PRODUCT_SERVICE_URL || 'http://localhost:5003',
    prefix: '/api/v1/categories'
  },
  brands: {
    url: process.env.PRODUCT_SERVICE_URL || 'http://localhost:5003',
    prefix: '/api/v1/brands'
  },
  inventory: {
    url: process.env.INVENTORY_SERVICE_URL || 'http://localhost:5004',
    prefix: '/api/v1/inventory'
  },
  warehouses: {
    url: process.env.WAREHOUSE_SERVICE_URL || 'http://localhost:5005',
    prefix: '/api/v1/warehouses'
  },
  transfers: {
    url: process.env.WAREHOUSE_SERVICE_URL || 'http://localhost:5005',
    prefix: '/api/v1/transfers'
  },
  suppliers: {
    url: process.env.PURCHASE_SERVICE_URL || 'http://localhost:5006',
    prefix: '/api/v1/suppliers'
  },
  purchases: {
    url: process.env.PURCHASE_SERVICE_URL || 'http://localhost:5006',
    prefix: '/api/v1/purchases'
  },
  purchaseReturns: {
    url: process.env.PURCHASE_SERVICE_URL || 'http://localhost:5006',
    prefix: '/api/v1/purchase-returns'
  },
  customers: {
    url: process.env.SALES_SERVICE_URL || 'http://localhost:5007',
    prefix: '/api/v1/customers'
  },
  sales: {
    url: process.env.SALES_SERVICE_URL || 'http://localhost:5007',
    prefix: '/api/v1/sales'
  },
  salesReturns: {
    url: process.env.SALES_SERVICE_URL || 'http://localhost:5007',
    prefix: '/api/v1/sales-returns'
  },
  payments: {
    url: process.env.FINANCE_SERVICE_URL || 'http://localhost:5008',
    prefix: '/api/v1/payments'
  },
  expenses: {
    url: process.env.FINANCE_SERVICE_URL || 'http://localhost:5008',
    prefix: '/api/v1/expenses'
  },
  reports: {
    url: process.env.FINANCE_SERVICE_URL || 'http://localhost:5008',
    prefix: '/api/v1/reports'
  },
  notifications: {
    url: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:5009',
    prefix: '/api/v1/notifications'
  },
  ai: {
    url: process.env.AI_SERVICE_URL || 'http://localhost:5010',
    prefix: '/api/v1/ai'
  }
};

module.exports = { SERVICES };
