require('dotenv').config();
const app = require('./src/app');
const { sequelize } = require('./src/models');
const { initDatabase, eventBus } = require('@stockpilot/common');

const PORT = process.env.PORT || 5004;

async function startServer() {
  try {
    await initDatabase(sequelize, process.env.DB_NAME || 'inventory_db');
    await eventBus.connect();

    app.listen(PORT, () => {
      console.log(`📊 Core Inventory Engine Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start Inventory Service:', error);
    process.exit(1);
  }
}

startServer();
