const path = require('path');
const assignedPort = process.env.PORT;
require('dotenv').config({ path: path.resolve(__dirname, '../../.env'), override: false });
const app = require('./src/app');
const { sequelize } = require('./src/models');
const { initDatabase, eventBus } = require('@stockpilot/common');

const PORT = (assignedPort && String(assignedPort) !== "5000") ? assignedPort : (process.env.PORT && String(process.env.PORT) !== "5000" ? process.env.PORT : 5005);

async function startServer() {
  try {
    await initDatabase(sequelize, process.env.DB_NAME || 'warehouse_db');
    await eventBus.connect();

    app.listen(PORT, () => {
      console.log(`🏭 Warehouse & Stock Transfer Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start Warehouse Service:', error);
    process.exit(1);
  }
}

startServer();
