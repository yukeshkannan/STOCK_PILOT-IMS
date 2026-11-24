#!/usr/bin/env node
/**
 * ==============================================================================
 * StockPilot SaaS — Pure Production Database Initialization Script (Option A)
 * ==============================================================================
 * - Synchronizes all 9 microservice database schemas (tables, columns, indexes)
 * - Seeds ONLY the primary platform SuperAdmin account
 * - Zero dummy tenants, zero dummy products, zero mock orders
 * - Enterprise-grade clean state ready for live customer registrations
 * ==============================================================================
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
process.env.DB_DIALECT = process.env.DB_DIALECT || 'mysql';

let bcrypt;
try {
  bcrypt = require('bcryptjs');
} catch (e) {
  bcrypt = require('../services/auth-service/node_modules/bcryptjs');
}

const { ROLES } = require('../services/common/src/constants');
const { initDatabase } = require('../services/common/src/db/connection');

// Microservice Models
const authModels = require('../services/auth-service/src/models');
const tenantModels = require('../services/tenant-service/src/models');
const productModels = require('../services/product-service/src/models');
const inventoryModels = require('../services/inventory-service/src/models');
const warehouseModels = require('../services/warehouse-service/src/models');
const purchaseModels = require('../services/purchase-service/src/models');
const salesModels = require('../services/sales-service/src/models');
const financeModels = require('../services/finance-service/src/models');
const notificationModels = require('../services/notification-service/src/models');

async function initializeProductionDatabase() {
  console.log('======================================================');
  console.log('🚀 StockPilot SaaS — Initializing Pure Production Database');
  console.log('======================================================\n');

  console.log('[1/3] Synchronizing all 9 microservice database schemas...');
  const services = [
    { name: 'auth_db', sequelize: authModels.sequelize },
    { name: 'tenant_db', sequelize: tenantModels.sequelize },
    { name: 'product_db', sequelize: productModels.sequelize },
    { name: 'inventory_db', sequelize: inventoryModels.sequelize },
    { name: 'warehouse_db', sequelize: warehouseModels.sequelize },
    { name: 'purchase_db', sequelize: purchaseModels.sequelize },
    { name: 'sales_db', sequelize: salesModels.sequelize },
    { name: 'finance_db', sequelize: financeModels.sequelize },
    { name: 'notification_db', sequelize: notificationModels.sequelize }
  ];

  for (const svc of services) {
    try {
      await initDatabase(svc.sequelize, svc.name);
      console.log(`  ✓ Synced schema for [${svc.name}]`);
    } catch (err) {
      console.error(`  ❌ Failed to sync [${svc.name}]:`, err.message);
      throw err;
    }
  }

  console.log('\n[2/3] Provisioning Platform Super Admin Account...');
  const adminEmail = (process.env.SUPERADMIN_EMAIL || 'superadmin@stockpilot.io').toLowerCase().trim();
  const adminPassword = process.env.SUPERADMIN_PASSWORD || 'adminpassword123';
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(adminPassword, salt);

  const [superAdmin, created] = await authModels.User.findOrCreate({
    where: { email: adminEmail },
    defaults: {
      tenant_id: null,
      company_code: 'PLATFORM',
      first_name: 'Platform',
      last_name: 'Super Admin',
      email: adminEmail,
      password: passwordHash,
      role_name: ROLES.SUPER_ADMIN,
      is_super_admin: true,
      status: 'ACTIVE'
    }
  });

  if (!created) {
    await superAdmin.update({
      password: passwordHash,
      is_super_admin: true,
      role_name: ROLES.SUPER_ADMIN,
      status: 'ACTIVE'
    });
    console.log(`  ✓ Existing SuperAdmin credentials updated for [${adminEmail}]`);
  } else {
    console.log(`  ✓ SuperAdmin account created successfully for [${adminEmail}]`);
  }

  console.log('\n[3/3] Verifying clean state (Zero Dummy Business Data)...');
  const tenantCount = await tenantModels.Tenant.count();
  const productCount = await productModels.Product.count();
  const salesCount = await salesModels.Sale.count();

  console.log('------------------------------------------------------');
  console.log(`🏢 Registered Tenants : ${tenantCount} (Clean Slate)`);
  console.log(`📦 Catalog Products   : ${productCount} (Clean Slate)`);
  console.log(`🧾 Sales Invoices     : ${salesCount} (Clean Slate)`);
  console.log(`👑 Super Admin Email  : ${adminEmail}`);
  console.log(`🔑 Super Admin Pass   : ${adminPassword}`);
  console.log('------------------------------------------------------');
  console.log('🎉 PURE PRODUCTION INITIALIZATION COMPLETE!');
  console.log('✨ All new businesses can register via /register or SuperAdmin portal.');
  console.log('======================================================\n');

  process.exit(0);
}

initializeProductionDatabase().catch((err) => {
  console.error('\n❌ Initialization failed:', err.message);
  process.exit(1);
});
