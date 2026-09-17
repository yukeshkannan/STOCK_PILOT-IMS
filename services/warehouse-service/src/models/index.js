const { DataTypes } = require('sequelize');
const { createDatabaseConnection, TRANSFER_STATUS } = require('@stockpilot/common');

const sequelize = createDatabaseConnection(process.env.DB_NAME || 'warehouse_db');

const Warehouse = sequelize.define('Warehouse', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  tenant_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  code: {
    type: DataTypes.STRING(30),
    allowNull: false
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  manager_name: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  capacity: {
    type: DataTypes.INTEGER,
    defaultValue: 10000
  },
  capacity_unit: {
    type: DataTypes.STRING(50),
    defaultValue: 'Square Feet (Sq. Ft)',
    allowNull: true
  },
  is_default: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  status: {
    type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
    defaultValue: 'ACTIVE'
  }
}, {
  tableName: 'warehouses',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['tenant_id', 'code']
    }
  ]
});

const StockTransfer = sequelize.define('StockTransfer', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  tenant_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  transfer_number: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  from_warehouse_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  to_warehouse_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM(...Object.values(TRANSFER_STATUS)),
    defaultValue: TRANSFER_STATUS.PENDING
  },
  requested_by: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  approved_by: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  carrier_type: {
    type: DataTypes.STRING(30),
    defaultValue: 'IN_HOUSE',
    allowNull: true
  },
  carrier_name: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  vehicle_no: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  driver_name: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  driver_phone: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  tracking_number: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  estimated_arrival: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  dispatched_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  received_by: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  received_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  completed_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'stock_transfers',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['tenant_id', 'transfer_number']
    }
  ]
});

const StockTransferItem = sequelize.define('StockTransferItem', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  transfer_id: {
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
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'stock_transfer_items',
  timestamps: true,
  underscored: true
});

StockTransfer.hasMany(StockTransferItem, { foreignKey: 'transfer_id', as: 'items' });
StockTransferItem.belongsTo(StockTransfer, { foreignKey: 'transfer_id' });

StockTransfer.belongsTo(Warehouse, { foreignKey: 'from_warehouse_id', as: 'fromWarehouse' });
StockTransfer.belongsTo(Warehouse, { foreignKey: 'to_warehouse_id', as: 'toWarehouse' });

module.exports = {
  sequelize,
  Warehouse,
  StockTransfer,
  StockTransferItem
};
