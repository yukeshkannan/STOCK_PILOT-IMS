const { DataTypes } = require('sequelize');
const { createDatabaseConnection, SALE_STATUS, PAYMENT_STATUS, PAYMENT_METHODS } = require('@stockpilot/common');

const sequelize = createDatabaseConnection(process.env.DB_NAME || 'sales_db');

const Customer = sequelize.define('Customer', {
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
  phone: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  gstin: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  credit_limit: {
    type: DataTypes.DECIMAL(14, 2),
    defaultValue: 50000.00
  },
  current_balance: {
    type: DataTypes.DECIMAL(14, 2),
    defaultValue: 0.00
  },
  status: {
    type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
    defaultValue: 'ACTIVE'
  }
}, {
  tableName: 'customers',
  timestamps: true,
  underscored: true
});

const Sale = sequelize.define('Sale', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  tenant_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  invoice_number: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  customer_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  customer_name: {
    type: DataTypes.STRING(150),
    allowNull: false,
    defaultValue: 'Walk-in Customer'
  },
  customer_phone: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  warehouse_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  warehouse_name: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  sale_date: {
    type: DataTypes.DATEONLY,
    defaultValue: DataTypes.NOW
  },
  status: {
    type: DataTypes.ENUM(...Object.values(SALE_STATUS)),
    defaultValue: SALE_STATUS.COMPLETED
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
  payment_method: {
    type: DataTypes.ENUM(...Object.values(PAYMENT_METHODS)),
    defaultValue: PAYMENT_METHODS.CASH
  },
  payment_status: {
    type: DataTypes.ENUM(...Object.values(PAYMENT_STATUS)),
    defaultValue: PAYMENT_STATUS.PAID
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
  }
}, {
  tableName: 'sales',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['tenant_id', 'invoice_number']
    }
  ]
});

const SaleItem = sequelize.define('SaleItem', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  sale_id: {
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
  cost_price: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00
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
  discount_amount: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00
  },
  total_price: {
    type: DataTypes.DECIMAL(14, 2),
    allowNull: false
  }
}, {
  tableName: 'sale_items',
  timestamps: true,
  underscored: true
});

Sale.hasMany(SaleItem, { foreignKey: 'sale_id', as: 'items' });
SaleItem.belongsTo(Sale, { foreignKey: 'sale_id' });
Sale.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });

const SaleReturn = sequelize.define('SaleReturn', {
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
  sale_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  customer_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  customer_name: {
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
  condition: {
    type: DataTypes.ENUM('GOOD', 'DAMAGED'),
    defaultValue: 'GOOD'
  },
  reason: {
    type: DataTypes.STRING(255),
    allowNull: false
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
  tableName: 'sale_returns',
  timestamps: true,
  underscored: true
});

const SaleReturnItem = sequelize.define('SaleReturnItem', {
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
  tableName: 'sale_return_items',
  timestamps: true,
  underscored: true
});

SaleReturn.hasMany(SaleReturnItem, { foreignKey: 'return_id', as: 'items' });
SaleReturnItem.belongsTo(SaleReturn, { foreignKey: 'return_id' });
SaleReturn.belongsTo(Sale, { foreignKey: 'sale_id', as: 'sale' });

module.exports = {
  sequelize,
  Customer,
  Sale,
  SaleItem,
  SaleReturn,
  SaleReturnItem
};
