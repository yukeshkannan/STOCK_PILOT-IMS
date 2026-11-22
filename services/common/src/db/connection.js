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

function resolveDbHost() {
  const host = process.env.DB_HOST || '127.0.0.1';
  return host === 'localhost' ? '127.0.0.1' : host;
}

function createDbConnection(dbName, options = {}) {
  const isMysql = process.env.DB_DIALECT === 'mysql' || Boolean(process.env.DB_HOST);

  if (isMysql) {
    return new Sequelize(
      dbName,
      process.env.DB_USER || 'root',
      process.env.DB_PASSWORD || 'rootpassword',
      {
        host: resolveDbHost(),
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
          } else if (dbCol === 'store_config' && (tableName === 'tenants' || tableName === 'Tenants')) {
            // Ensure store_config is upgraded to LONGTEXT for large visual builder payloads in MySQL
            try {
              const currentType = String(tableDescription[dbCol].type || '').toUpperCase();
              if (currentType === 'TEXT' || currentType.includes('VARCHAR')) {
                logger.info(`[Auto-Migration] Upgrading "store_config" to LONGTEXT on table "${tableName}"...`);
                await sequelize.query(`ALTER TABLE \`${tableName}\` MODIFY COLUMN \`store_config\` LONGTEXT;`);
              }
            } catch (modifyErr) {
              // Ignore if dialect is SQLite or already LONGTEXT
            }
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

async function waitForMysqlConnection(dbName, maxRetries = 10, delayMs = 2000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const connection = await mysql.createConnection({
        host: resolveDbHost(),
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'rootpassword',
        connectTimeout: 6000
      });

      await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
      await connection.end();
      logger.info(`[DB Boot] Verified/created MySQL database [${dbName}] successfully.`);
      return;
    } catch (err) {
      if (attempt === maxRetries) {
        logger.warn(`[DB Boot] Could not verify/create MySQL DB [${dbName}] after ${maxRetries} attempts: ${err.message}`);
        return;
      }
      logger.warn(`[DB Boot] MySQL service not ready for [${dbName}] (${err.code || err.message}). Retrying ${attempt}/${maxRetries} in ${delayMs / 1000}s...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
}

async function authenticateWithRetry(sequelize, dbName, maxRetries = 6, delayMs = 2000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await sequelize.authenticate();
      return;
    } catch (err) {
      if (attempt === maxRetries) throw err;
      logger.warn(`[DB Boot] Sequelize connection failed for [${dbName}] (${err.message}). Retrying ${attempt}/${maxRetries} in ${delayMs / 1000}s...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
}

async function initDatabase(sequelize, dbName) {
  try {
    const dialect = process.env.DB_DIALECT || 'sqlite';

    if (dialect === 'mysql') {
      await waitForMysqlConnection(dbName);
      await authenticateWithRetry(sequelize, dbName);
    } else {
      await sequelize.authenticate();
    }

    await syncTableColumns(sequelize);
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
