/**
 * Enterprise Monotonic Sequence Generator for Multi-Tenant Workspaces
 * Supports both MySQL (Production) and SQLite (Local Development) seamlessly.
 */

async function ensureSequenceTable(sequelize) {
  const isSqlite = sequelize.getDialect() === 'sqlite';
  if (isSqlite) {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS tenant_sequences (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tenant_id INTEGER NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        prefix VARCHAR(30) NOT NULL,
        current_number INTEGER NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (tenant_id, entity_type, prefix)
      );
    `);
  } else {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`tenant_sequences\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`tenant_id\` INT NOT NULL,
        \`entity_type\` VARCHAR(50) NOT NULL,
        \`prefix\` VARCHAR(30) NOT NULL,
        \`current_number\` INT NOT NULL DEFAULT 0,
        \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY \`tenant_entity_prefix_unique\` (\`tenant_id\`, \`entity_type\`, \`prefix\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  }
}

async function getNextSequenceNumber(sequelize, tenantId, entityType, prefix, padLength = 4) {
  const safeTenantId = parseInt(tenantId, 10) || 1;
  const safeEntityType = String(entityType).trim().toUpperCase();
  const safePrefix = String(prefix).trim().toUpperCase();
  const isSqlite = sequelize.getDialect() === 'sqlite';

  await ensureSequenceTable(sequelize);

  if (isSqlite) {
    await sequelize.query(`
      INSERT INTO tenant_sequences (tenant_id, entity_type, prefix, current_number)
      VALUES (:tenantId, :entityType, :prefix, 1)
      ON CONFLICT(tenant_id, entity_type, prefix) DO UPDATE SET current_number = current_number + 1;
    `, {
      replacements: { tenantId: safeTenantId, entityType: safeEntityType, prefix: safePrefix }
    });
  } else {
    await sequelize.query(`
      INSERT INTO tenant_sequences (tenant_id, entity_type, prefix, current_number)
      VALUES (:tenantId, :entityType, :prefix, 1)
      ON DUPLICATE KEY UPDATE current_number = current_number + 1;
    `, {
      replacements: { tenantId: safeTenantId, entityType: safeEntityType, prefix: safePrefix }
    });
  }

  const [results] = await sequelize.query(`
    SELECT current_number FROM tenant_sequences
    WHERE tenant_id = :tenantId AND entity_type = :entityType AND prefix = :prefix
    LIMIT 1;
  `, {
    replacements: { tenantId: safeTenantId, entityType: safeEntityType, prefix: safePrefix }
  });

  const nextNumber = results?.[0]?.current_number || 1;
  return `${safePrefix}-${String(nextNumber).padStart(padLength, '0')}`;
}

async function peekNextSequenceNumber(sequelize, tenantId, entityType, prefix, padLength = 4) {
  const safeTenantId = parseInt(tenantId, 10) || 1;
  const safeEntityType = String(entityType).trim().toUpperCase();
  const safePrefix = String(prefix).trim().toUpperCase();

  await ensureSequenceTable(sequelize);

  const [results] = await sequelize.query(`
    SELECT current_number FROM tenant_sequences
    WHERE tenant_id = :tenantId AND entity_type = :entityType AND prefix = :prefix
    LIMIT 1;
  `, {
    replacements: { tenantId: safeTenantId, entityType: safeEntityType, prefix: safePrefix }
  });

  const currentNumber = results?.[0]?.current_number || 0;
  const previewNext = currentNumber + 1;
  return `${safePrefix}-${String(previewNext).padStart(padLength, '0')}`;
}

async function syncSequenceNumber(sequelize, tenantId, entityType, prefix, targetNumber) {
  const safeTenantId = parseInt(tenantId, 10) || 1;
  const safeEntityType = String(entityType).trim().toUpperCase();
  const safePrefix = String(prefix).trim().toUpperCase();
  const safeTarget = parseInt(targetNumber, 10) || 0;
  const isSqlite = sequelize.getDialect() === 'sqlite';

  if (safeTarget <= 0) return;

  await ensureSequenceTable(sequelize);

  if (isSqlite) {
    await sequelize.query(`
      INSERT INTO tenant_sequences (tenant_id, entity_type, prefix, current_number)
      VALUES (:tenantId, :entityType, :prefix, :safeTarget)
      ON CONFLICT(tenant_id, entity_type, prefix) DO UPDATE SET current_number = MAX(current_number, :safeTarget);
    `, {
      replacements: { tenantId: safeTenantId, entityType: safeEntityType, prefix: safePrefix, safeTarget }
    });
  } else {
    await sequelize.query(`
      INSERT INTO tenant_sequences (tenant_id, entity_type, prefix, current_number)
      VALUES (:tenantId, :entityType, :prefix, :safeTarget)
      ON DUPLICATE KEY UPDATE current_number = GREATEST(current_number, :safeTarget);
    `, {
      replacements: { tenantId: safeTenantId, entityType: safeEntityType, prefix: safePrefix, safeTarget }
    });
  }
}

module.exports = {
  getNextSequenceNumber,
  peekNextSequenceNumber,
  syncSequenceNumber
};
