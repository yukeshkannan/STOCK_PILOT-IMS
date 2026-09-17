const { DataTypes } = require('sequelize');
const { createDatabaseConnection, PURCHASE_STATUS, PAYMENT_STATUS } = require('@stockpilot/common');

const sequelize = createDatabaseConnection(process.env.DB_NAME || 'purchase_db');

const Supplier = sequelize.define('Supplier', {
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
  contact_person: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  gstin: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
    defaultValue: 'ACTIVE'
  }
}, {
  tableName: 'suppliers',
  timestamps: true,
  underscored: true
});

const Purchase = sequelize.define('Purchase', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  tenant_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  po_number: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  supplier_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  supplier_name: {
    type: DataTypes.STRING(150),
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
  order_date: {
    type: DataTypes.DATEONLY,
    defaultValue: DataTypes.NOW
  },
  status: {
    type: DataTypes.ENUM(...Object.values(PURCHASE_STATUS)),
    defaultValue: PURCHASE_STATUS.DRAFT
  },
  subtotal: {
    type: DataTypes.DECIMAL(14, 2),
    defaultValue: 0.00
  },
  tax_amount: {
    type: DataTypes.DECIMAL(14, 2),
    defaultValue: 0.00
  },
  discount_amount: {
    type: DataTypes.DECIMAL(14, 2),
    defaultValue: 0.00
  },
  grand_total: {
    type: DataTypes.DECIMAL(14, 2),
    defaultValue: 0.00
  },
  payment_status: {
    type: DataTypes.ENUM(...Object.values(PAYMENT_STATUS)),
    defaultValue: PAYMENT_STATUS.UNPAID
  },
  paid_amount: {
    type: DataTypes.DECIMAL(14, 2),
    defaultValue: 0.00
  },
  due_amount: {
    type: DataTypes.DECIMAL(14, 2),
    defaultValue: 0.00
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  created_by: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  approved_by: {
    type: DataTypes.STRING(100),
    allowNull: true
  }
}, {
  tableName: 'purchases',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['tenant_id', 'po_number']
    }
  ]
});

const PurchaseItem = sequelize.define('PurchaseItem', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  purchase_id: {
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
  unit_price: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  tax_rate: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 18.00
  },
  tax_amount: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00
  },
  total_price: {
    type: DataTypes.DECIMAL(14, 2),
    allowNull: false
  }
}, {
  tableName: 'purchase_items',
  timestamps: true,
  underscored: true
});

Purchase.hasMany(PurchaseItem, { foreignKey: 'purchase_id', as: 'items' });
PurchaseItem.belongsTo(Purchase, { foreignKey: 'purchase_id' });
Purchase.belongsTo(Supplier, { foreignKey: 'supplier_id', as: 'supplier' });

const PurchaseReturn = sequelize.define('PurchaseReturn', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  tenant_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  return_number: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  purchase_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  supplier_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  supplier_name: {
    type: DataTypes.STRING(150),
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
  total_refund: {
    type: DataTypes.DECIMAL(14, 2),
    defaultValue: 0.00
  },
  reason: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('PENDING_APPROVAL', 'APPROVED', 'REJECTED'),
    defaultValue: 'PENDING_APPROVAL'
  },
  reviewed_by: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  reviewed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  rejection_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  created_by: {
    type: DataTypes.STRING(100),
    allowNull: true
  }
}, {
  tableName: 'purchase_returns',
  timestamps: true,
  underscored: true
});

const PurchaseReturnItem = sequelize.define('PurchaseReturnItem', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  return_id: {
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
  },
  unit_price: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  total_price: {
    type: DataTypes.DECIMAL(14, 2),
    allowNull: false
  }
}, {
  tableName: 'purchase_return_items',
  timestamps: true,
  underscored: true
});

PurchaseReturn.hasMany(PurchaseReturnItem, { foreignKey: 'return_id', as: 'items' });
PurchaseReturnItem.belongsTo(PurchaseReturn, { foreignKey: 'return_id' });

module.exports = {
  sequelize,
  Supplier,
  Purchase,
  PurchaseItem,
  PurchaseReturn,
  PurchaseReturnItem
};
