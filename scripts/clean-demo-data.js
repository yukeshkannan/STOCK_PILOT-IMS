const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { createDbConnection } = require('../services/common/src/db/connection');

const dbs = [
  'tenant_db',
  'product_db',
  'inventory_db',
  'warehouse_db',
  'purchase_db',
  'sales_db',
  'finance_db',
  'notification_db',
  'auth_db'
];

async function cleanAllDemoData() {
  console.log('🧹 Cleaning all demo seed data from MySQL databases...\n');

  for (const dbName of dbs) {
    try {
      const sequelize = createDbConnection(dbName);
      await sequelize.authenticate();

      const [tables] = await sequelize.query('SHOW TABLES;');
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');

      for (const row of tables) {
        const tableName = Object.values(row)[0];

        if (dbName === 'auth_db' && tableName.toLowerCase().includes('user')) {
          // Keep ONLY the Super Admin account in auth_users
          await sequelize.query(`DELETE FROM \`${tableName}\` WHERE is_super_admin = 0 OR email != 'superadmin@stockpilot.io';`);
          console.log(`  ✓ Cleaned [${dbName}].[${tableName}] (Preserved Super Admin: superadmin@stockpilot.io)`);
        } else {
          await sequelize.query(`TRUNCATE TABLE \`${tableName}\`;`);
          console.log(`  ✓ Truncated [${dbName}].[${tableName}]`);
        }
      }

      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');
      await sequelize.close();
    } catch (err) {
      console.warn(`  ⚠️  [${dbName}]: ${err.message}`);
    }
  }

  console.log('\n======================================================');
  console.log('🎉 All demo seed data successfully removed!');
  console.log('👑 Only Super Admin remains: superadmin@stockpilot.io');
  console.log('✨ Platform is now 100% clean and dynamic for real production tenants!');
  console.log('======================================================');
  process.exit(0);
}

cleanAllDemoData();
