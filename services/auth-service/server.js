require('dotenv').config();
const app = require('./src/app');
const { sequelize } = require('./src/models');
const { initDatabase, eventBus } = require('@stockpilot/common');

const PORT = process.env.PORT || 5001;

async function startServer() {
  try {
    await initDatabase(sequelize, process.env.DB_NAME || 'auth_db');
    await eventBus.connect();

    app.listen(PORT, () => {
      console.log(`🔐 Auth Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start Auth Service:', error);
    process.exit(1);
  }
}

startServer();
