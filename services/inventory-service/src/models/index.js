const { DataTypes } = require('sequelize');
const { createDatabaseConnection, STOCK_MOVEMENT_TYPES } = require('@stockpilot/common');

const sequelize = createDatabaseConnection(process.env.DB_NAME || 'inventory_db');

const Stock = sequelize.define('Stock', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  tenant_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  product_code: {
    type: DataTypes.STRING(60),
    allowNull: false
  },
  product_name: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  warehouse_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  warehouse_name: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  current_stock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  reserved_stock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  available_stock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  minimum_stock: {
    type: DataTypes.INTEGER,
    defaultValue: 5
  },
  maximum_stock: {
    type: DataTypes.INTEGER,
    defaultValue: 1000
  },
  last_adjusted_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'stocks',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['tenant_id', 'product_id', 'warehouse_id']
    },
    {
      fields: ['tenant_id', 'current_stock']
    }
  ]
});

const StockMovement = sequelize.define('StockMovement', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  tenant_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  product_code: {
    type: DataTypes.STRING(60),
    allowNull: false
  },
  product_name: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  warehouse_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  warehouse_name: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  movement_type: {
    type: DataTypes.ENUM(...Object.values(STOCK_MOVEMENT_TYPES)),
    allowNull: false
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false // positive for additions, negative for deductions
  },
  balance_after: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  reference_type: {
    type: DataTypes.STRING(50),
    allowNull: true // 'PURCHASE', 'SALE', 'TRANSFER', 'ADJUSTMENT', etc.
  },
  reference_id: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  created_by: {
    type: DataTypes.STRING(100),
    allowNull: true
  }
}, {
  tableName: 'stock_movements',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['tenant_id', 'product_id']
    },
    {
      fields: ['tenant_id', 'movement_type']
    }
  ]
});

const StockAdjustment = sequelize.define('StockAdjustment', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  tenant_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  product_code: {
    type: DataTypes.STRING(60),
    allowNull: false
  },
  warehouse_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  previous_quantity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  new_quantity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  difference: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  reason: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  adjusted_by: {
    type: DataTypes.STRING(100),
    allowNull: true
  }
}, {
  tableName: 'stock_adjustments',
  timestamps: true,
  underscored: true
});

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  tenant_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  user_name: {
    type: DataTypes.STRING(120),
    allowNull: true
  },
  module: {
    type: DataTypes.STRING(50),
    allowNull: false // 'INVENTORY', 'SALES', 'PURCHASES', 'TRANSFERS', 'SYSTEM'
  },
  action: {
    type: DataTypes.STRING(60),
    allowNull: false // 'CREATE', 'UPDATE', 'DELETE', 'ADJUST', 'SCAN', 'DISPATCH', etc.
  },
  entity_id: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  details: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  ip_address: {
    type: DataTypes.STRING(60),
    allowNull: true
  }
}, {
  tableName: 'audit_logs',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['tenant_id', 'module']
    },
    {
      fields: ['tenant_id', 'created_at']
    }
  ]
});

module.exports = {
  sequelize,
  Stock,
  StockMovement,
  StockAdjustment,
  AuditLog
};

