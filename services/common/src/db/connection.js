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
  const isMysql = process.env.DB_DIALECT === 'mysql' || Boolean(process.env.DB_HOST);

  if (isMysql) {
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

        // Auto-repair orphaned camelCase timestamp columns in MySQL if underscored table
        if (tableDescription['createdAt'] && tableDescription['created_at']) {
          try {
            await sequelize.query(`ALTER TABLE \`${tableName}\` MODIFY COLUMN \`createdAt\` DATETIME NULL DEFAULT CURRENT_TIMESTAMP;`);
          } catch (e) {}
        }
        if (tableDescription['updatedAt'] && tableDescription['updated_at']) {
          try {
            await sequelize.query(`ALTER TABLE \`${tableName}\` MODIFY COLUMN \`updatedAt\` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;`);
          } catch (e) {}
        }

        for (const [attrName, attr] of Object.entries(model.rawAttributes)) {
          const dbCol = attr.field || attrName;
          if (!tableDescription[dbCol]) {
            // Do not accidentally add camelCase createdAt/updatedAt if created_at/updated_at exists
            if ((attrName === 'createdAt' || attrName === 'updatedAt') && (tableDescription['created_at'] || tableDescription['updated_at'])) {
              continue;
            }
            logger.info(`[Auto-Migration] Adding missing column "${dbCol}" to table "${tableName}"...`);
            await queryInterface.addColumn(tableName, dbCol, attr);
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
