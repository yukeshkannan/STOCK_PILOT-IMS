const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env'), override: true });
const app = require('./src/app');
const { sequelize } = require('./src/models');
const { initDatabase, eventBus } = require('@stockpilot/common');

const PORT = process.env.PORT || 5007;

async function startServer() {
  try {
    await initDatabase(sequelize, process.env.DB_NAME || 'sales_db');
    await eventBus.connect();

    app.listen(PORT, () => {
      console.log(`🛍️ Customer, POS & Sales Invoicing Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start Sales Service:', error);
    process.exit(1);
  }
}

startServer();
