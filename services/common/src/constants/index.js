const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  STAFF: 'STAFF'
};

const PERMISSIONS = {
  // Tenant
  MANAGE_TENANT: 'tenant:manage',
  VIEW_TENANT: 'tenant:view',
  TENANT_SETTINGS: 'tenant:settings',

  // Users
  MANAGE_USERS: 'users:manage',
  VIEW_USERS: 'users:view',
  USER_VIEW: 'users:view',
  USER_CREATE: 'users:create',
  USER_UPDATE: 'users:update',
  USER_DELETE: 'users:delete',

  // Products
  MANAGE_PRODUCTS: 'products:manage',
  VIEW_PRODUCTS: 'products:view',
  PRODUCT_VIEW: 'products:view',
  PRODUCT_CREATE: 'products:create',
  PRODUCT_UPDATE: 'products:update',
  PRODUCT_DELETE: 'products:delete',
  MANAGE_CATEGORIES: 'categories:manage',
  MANAGE_BRANDS: 'brands:manage',

  // Inventory & Stock
  MANAGE_INVENTORY: 'inventory:manage',
  VIEW_INVENTORY: 'inventory:view',
  STOCK_VIEW: 'inventory:view',
  STOCK_ADJUST: 'inventory:adjust',
  ADJUST_STOCK: 'inventory:adjust',
  TRANSFER_STOCK: 'inventory:transfer',
  STOCK_TRANSFER: 'inventory:transfer',
  TRANSFER_APPROVE: 'inventory:transfer_approve',

  // Warehouses
  MANAGE_WAREHOUSES: 'warehouses:manage',
  VIEW_WAREHOUSES: 'warehouses:view',
  WAREHOUSE_VIEW: 'warehouses:view',
  WAREHOUSE_MANAGE: 'warehouses:manage',

  // Purchases & Suppliers
  MANAGE_PURCHASES: 'purchases:manage',
  APPROVE_PURCHASE: 'purchases:approve',
  VIEW_PURCHASES: 'purchases:view',
  PURCHASE_VIEW: 'purchases:view',
  PURCHASE_CREATE: 'purchases:create',
  PURCHASE_APPROVE: 'purchases:approve',
  PURCHASE_CANCEL: 'purchases:cancel',
  MANAGE_SUPPLIERS: 'suppliers:manage',
  VIEW_SUPPLIERS: 'suppliers:view',
  SUPPLIER_VIEW: 'suppliers:view',
  SUPPLIER_MANAGE: 'suppliers:manage',
  PURCHASE_RETURN: 'purchases:return',

  // Sales & POS Invoicing
  CREATE_SALE: 'sales:create',
  VIEW_SALES: 'sales:view',
  SALE_VIEW: 'sales:view',
  SALE_CREATE: 'sales:create',
  MANAGE_CUSTOMERS: 'customers:manage',
  VIEW_CUSTOMERS: 'customers:view',
  CUSTOMER_VIEW: 'customers:view',
  CUSTOMER_MANAGE: 'customers:manage',
  SALES_RETURN: 'sales:return',

  // Finance & Expenses
  MANAGE_EXPENSES: 'expenses:manage',
  VIEW_EXPENSES: 'expenses:view',
  EXPENSE_VIEW: 'expenses:view',
  EXPENSE_MANAGE: 'expenses:manage',
  MANAGE_PAYMENTS: 'payments:manage',
  VIEW_PAYMENTS: 'payments:view',
  PAYMENT_VIEW: 'payments:view',
  PAYMENT_MANAGE: 'payments:manage',
  PAYMENT_CREATE: 'payments:create',

  // Reports & Analytics
  VIEW_REPORTS: 'reports:view',
  REPORT_VIEW: 'reports:view',
  EXPORT_REPORTS: 'reports:export',

  // Audit Logs
  VIEW_AUDIT_LOGS: 'audit:view'
};

const DEFAULT_ROLE_PERMISSIONS = {
  SUPER_ADMIN: Object.values(PERMISSIONS),
  ADMIN: Object.values(PERMISSIONS).filter(p => p !== PERMISSIONS.MANAGE_TENANT),
  MANAGER: [
    PERMISSIONS.VIEW_TENANT,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.MANAGE_PRODUCTS,
    PERMISSIONS.VIEW_PRODUCTS,
    PERMISSIONS.MANAGE_CATEGORIES,
    PERMISSIONS.MANAGE_BRANDS,
    PERMISSIONS.MANAGE_INVENTORY,
    PERMISSIONS.VIEW_INVENTORY,
    PERMISSIONS.ADJUST_STOCK,
    PERMISSIONS.TRANSFER_STOCK,
    PERMISSIONS.MANAGE_WAREHOUSES,
    PERMISSIONS.VIEW_WAREHOUSES,
    PERMISSIONS.MANAGE_PURCHASES,
    PERMISSIONS.APPROVE_PURCHASE,
    PERMISSIONS.VIEW_PURCHASES,
    PERMISSIONS.MANAGE_SUPPLIERS,
    PERMISSIONS.VIEW_SUPPLIERS,
    PERMISSIONS.PURCHASE_RETURN,
    PERMISSIONS.CREATE_SALE,
    PERMISSIONS.VIEW_SALES,
    PERMISSIONS.MANAGE_CUSTOMERS,
    PERMISSIONS.VIEW_CUSTOMERS,
    PERMISSIONS.SALES_RETURN,
    PERMISSIONS.MANAGE_EXPENSES,
    PERMISSIONS.VIEW_EXPENSES,
    PERMISSIONS.MANAGE_PAYMENTS,
    PERMISSIONS.VIEW_PAYMENTS,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.EXPORT_REPORTS
  ],
  STAFF: [
    PERMISSIONS.VIEW_PRODUCTS,
    PERMISSIONS.VIEW_INVENTORY,
    PERMISSIONS.VIEW_WAREHOUSES,
    PERMISSIONS.TRANSFER_STOCK,
    PERMISSIONS.CREATE_SALE,
    PERMISSIONS.VIEW_SALES,
    PERMISSIONS.MANAGE_CUSTOMERS,
    PERMISSIONS.VIEW_CUSTOMERS,
    PERMISSIONS.SALES_RETURN,
    PERMISSIONS.VIEW_SUPPLIERS
  ]
};

const STOCK_MOVEMENT_TYPES = {
  PURCHASE: 'PURCHASE',
  SALE: 'SALE',
  RETURN_IN: 'RETURN_IN',
  RETURN_OUT: 'RETURN_OUT',
  TRANSFER_IN: 'TRANSFER_IN',
  TRANSFER_OUT: 'TRANSFER_OUT',
  ADJUSTMENT: 'ADJUSTMENT',
  DAMAGE: 'DAMAGE'
};

const TRANSFER_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  IN_TRANSIT: 'IN_TRANSIT',
  COMPLETED: 'COMPLETED',
  REJECTED: 'REJECTED'
};

const PURCHASE_STATUS = {
  DRAFT: 'DRAFT',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  APPROVED: 'APPROVED',
  RECEIVED: 'RECEIVED',
  CANCELLED: 'CANCELLED'
};

const SALE_STATUS = {
  COMPLETED: 'COMPLETED',
  REFUNDED: 'REFUNDED',
  PARTIALLY_REFUNDED: 'PARTIALLY_REFUNDED',
  CANCELLED: 'CANCELLED'
};

const PAYMENT_METHODS = {
  CASH: 'CASH',
  CARD: 'CARD',
  UPI: 'UPI',
  BANK_TRANSFER: 'BANK_TRANSFER',
  CHEQUE: 'CHEQUE',
  CREDIT: 'CREDIT'
};

const PAYMENT_STATUS = {
  PAID: 'PAID',
  PARTIAL: 'PARTIAL',
  UNPAID: 'UNPAID'
};

const EXPENSE_CATEGORIES = {
  RENT: 'RENT',
  UTILITIES: 'UTILITIES',
  SALARIES: 'SALARIES',
  LOGISTICS: 'LOGISTICS',
  MAINTENANCE: 'MAINTENANCE',
  MARKETING: 'MARKETING',
  OFFICE_SUPPLIES: 'OFFICE_SUPPLIES',
  TAXES: 'TAXES',
  OTHER: 'OTHER'
};

const EVENTS = {
  STOCK_LOW: 'stock.low',
  STOCK_OUT: 'stock.out',
  STOCK_ADJUSTMENT: 'stock.adjustment',
  PURCHASE_CREATED: 'purchase.created',
  PURCHASE_APPROVED: 'purchase.approved',
  PURCHASE_REJECTED: 'purchase.rejected',
  SALE_CREATED: 'sale.created',
  SALE_RETURNED: 'sale.returned',
  PAYMENT_OVERDUE: 'payment.overdue',
  TRANSFER_REQUESTED: 'transfer.requested',
  TRANSFER_APPROVED: 'transfer.approved',
  TRANSFER_REJECTED: 'transfer.rejected',
  TRANSFER_DISPATCHED: 'transfer.dispatched',
  TRANSFER_COMPLETED: 'transfer.completed',
  SYSTEM_BROADCAST: 'system.broadcast',
  NOTIFICATION_SEND: 'notification.send'
};

module.exports = {
  ROLES,
  PERMISSIONS,
  DEFAULT_ROLE_PERMISSIONS,
  STOCK_MOVEMENT_TYPES,
  TRANSFER_STATUS,
  PURCHASE_STATUS,
  SALE_STATUS,
  PAYMENT_METHODS,
  PAYMENT_STATUS,
  EXPENSE_CATEGORIES,
  EVENTS
};
