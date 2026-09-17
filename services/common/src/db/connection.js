const { Sequelize } = require('sequelize');
const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');
const { logger } = require('../utils/logger');

// Find project root directory reliably
function getProjectDataDir() {
  let currentDir = process.cwd();
  while (currentDir.length > 3) {
    if (fs.existsSync(path.join(currentDir, 'package.json')) && fs.existsSync(path.join(currentDir, 'services'))) {
      const dataDir = path.join(currentDir, '.data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      return dataDir;
    }
    currentDir = path.dirname(currentDir);
  }
  const fallbackDir = path.resolve(process.cwd(), '.data');
  if (!fs.existsSync(fallbackDir)) {
    fs.mkdirSync(fallbackDir, { recursive: true });
  }
  return fallbackDir;
}

function createDbConnection(dbName, options = {}) {
  const dialect = process.env.DB_DIALECT || 'sqlite';

  if (dialect === 'mysql') {
    return new Sequelize(
      dbName,
      process.env.DB_USER || 'root',
      process.env.DB_PASSWORD || 'rootpassword',
      {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',
        logging: process.env.DB_LOGGING === 'true' ? (msg) => logger.debug(msg) : false,
        pool: {
          max: 10,
          min: 0,
          acquire: 30000,
          idle: 10000
        },
        ...options
      }
    );
  }

  // SQLite Default for zero-friction local development
  const dataDir = getProjectDataDir();
  const storagePath = path.join(dataDir, `${dbName}.sqlite`);

  return new Sequelize({
    dialect: 'sqlite',
    storage: storagePath,
    logging: false,
    ...options
  });
}

async function syncTableColumns(sequelize) {
  try {
    const queryInterface = sequelize.getQueryInterface();
    for (const modelName of Object.keys(sequelize.models)) {
      const model = sequelize.models[modelName];
      const tableName = model.getTableName();
      try {
        const tableDescription = await queryInterface.describeTable(tableName);
        for (const [colName, attr] of Object.entries(model.rawAttributes)) {
          if (!tableDescription[colName]) {
            logger.info(`[Auto-Migration] Adding missing column "${colName}" to table "${tableName}"...`);
            await queryInterface.addColumn(tableName, colName, attr);
          }
        }
      } catch (tableErr) {
        // Table may not exist yet if not created
      }
    }
  } catch (err) {
    logger.warn(`[Auto-Migration Note]: ${err.message}`);
  }
}

async function initDatabase(sequelize, dbName) {
  try {
    const dialect = process.env.DB_DIALECT || 'sqlite';

    if (dialect === 'mysql') {
      try {
        const connection = await mysql.createConnection({
          host: process.env.DB_HOST || 'localhost',
          port: process.env.DB_PORT || 3306,
          user: process.env.DB_USER || 'root',
          password: process.env.DB_PASSWORD || 'rootpassword'
        });

        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
        await connection.end();
      } catch (err) {
        logger.warn(`Could not verify/create MySQL DB ${dbName} directly: ${err.message}`);
      }
    }

    await sequelize.authenticate();
    await sequelize.sync({ alter: false });
    await syncTableColumns(sequelize);
    logger.info(`Database schema synchronized for [${dbName}] (${dialect})`);
  } catch (error) {
    logger.error(`Database synchronization error for [${dbName}]: ${error.message}`);
    throw error;
  }
}

module.exports = {
  createDbConnection,
  createDatabaseConnection: createDbConnection,
  initDatabase
};
