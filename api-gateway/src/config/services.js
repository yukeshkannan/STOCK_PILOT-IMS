require('dotenv').config();

const resolveUrl = (envVal, defaultPort) => {
  const url = envVal || `http://127.0.0.1:${defaultPort}`;
  return url.replace('localhost', '127.0.0.1');
};

const SERVICES = {
  auth: {
    url: resolveUrl(process.env.AUTH_SERVICE_URL, 5001),
    prefix: '/api/v1/auth'
  },
  tenant: {
    url: resolveUrl(process.env.TENANT_SERVICE_URL, 5002),
    prefix: '/api/v1/tenants'
  },
  users: {
    url: resolveUrl(process.env.TENANT_SERVICE_URL, 5002),
    prefix: '/api/v1/users'
  },
  roles: {
    url: resolveUrl(process.env.TENANT_SERVICE_URL, 5002),
    prefix: '/api/v1/roles'
  },
  permissions: {
    url: resolveUrl(process.env.TENANT_SERVICE_URL, 5002),
    prefix: '/api/v1/permissions'
  },
  audit: {
    url: resolveUrl(process.env.TENANT_SERVICE_URL, 5002),
    prefix: '/api/v1/audit-logs'
  },
  admin: {
    url: resolveUrl(process.env.TENANT_SERVICE_URL, 5002),
    prefix: '/api/v1/admin'
  },
  products: {
    url: resolveUrl(process.env.PRODUCT_SERVICE_URL, 5003),
    prefix: '/api/v1/products'
  },
  categories: {
    url: resolveUrl(process.env.PRODUCT_SERVICE_URL, 5003),
    prefix: '/api/v1/categories'
  },
  brands: {
    url: resolveUrl(process.env.PRODUCT_SERVICE_URL, 5003),
    prefix: '/api/v1/brands'
  },
  inventory: {
    url: resolveUrl(process.env.INVENTORY_SERVICE_URL, 5004),
    prefix: '/api/v1/inventory'
  },
  warehouses: {
    url: resolveUrl(process.env.WAREHOUSE_SERVICE_URL, 5005),
    prefix: '/api/v1/warehouses'
  },
  transfers: {
    url: resolveUrl(process.env.WAREHOUSE_SERVICE_URL, 5005),
    prefix: '/api/v1/transfers'
  },
  suppliers: {
    url: resolveUrl(process.env.PURCHASE_SERVICE_URL, 5006),
    prefix: '/api/v1/suppliers'
  },
  purchases: {
    url: resolveUrl(process.env.PURCHASE_SERVICE_URL, 5006),
    prefix: '/api/v1/purchases'
  },
  purchaseReturns: {
    url: resolveUrl(process.env.PURCHASE_SERVICE_URL, 5006),
    prefix: '/api/v1/purchase-returns'
  },
  customers: {
    url: resolveUrl(process.env.SALES_SERVICE_URL, 5007),
    prefix: '/api/v1/customers'
  },
  sales: {
    url: resolveUrl(process.env.SALES_SERVICE_URL, 5007),
    prefix: '/api/v1/sales'
  },
  salesReturns: {
    url: resolveUrl(process.env.SALES_SERVICE_URL, 5007),
    prefix: '/api/v1/sales-returns'
  },
  payments: {
    url: resolveUrl(process.env.FINANCE_SERVICE_URL, 5008),
    prefix: '/api/v1/payments'
  },
  expenses: {
    url: resolveUrl(process.env.FINANCE_SERVICE_URL, 5008),
    prefix: '/api/v1/expenses'
  },
  reports: {
    url: resolveUrl(process.env.FINANCE_SERVICE_URL, 5008),
    prefix: '/api/v1/reports'
  },
  notifications: {
    url: resolveUrl(process.env.NOTIFICATION_SERVICE_URL, 5009),
    prefix: '/api/v1/notifications'
  },
  ai: {
    url: resolveUrl(process.env.AI_SERVICE_URL, 5010),
    prefix: '/api/v1/ai'
  }
};

module.exports = { SERVICES };
