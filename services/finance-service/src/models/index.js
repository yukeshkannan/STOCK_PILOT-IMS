const { DataTypes } = require('sequelize');
const { createDatabaseConnection, PAYMENT_METHODS, EXPENSE_CATEGORIES } = require('@stockpilot/common');

const sequelize = createDatabaseConnection(process.env.DB_NAME || 'finance_db');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  tenant_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  payment_number: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('RECEIPT', 'PAYMENT'),
    allowNull: false
  },
  reference_type: {
    type: DataTypes.STRING(50),
    defaultValue: 'MANUAL' // 'SALE', 'PURCHASE', 'EXPENSE', 'MANUAL'
  },
  reference_id: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  party_name: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  payment_method: {
    type: DataTypes.ENUM(...Object.values(PAYMENT_METHODS)),
    defaultValue: PAYMENT_METHODS.CASH
  },
  amount: {
    type: DataTypes.DECIMAL(14, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  payment_date: {
    type: DataTypes.DATEONLY,
    defaultValue: DataTypes.NOW
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
  tableName: 'payments',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['tenant_id', 'payment_number']
    },
    {
      fields: ['tenant_id', 'payment_date']
    }
  ]
});

const Expense = sequelize.define('Expense', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  tenant_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  expense_number: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  category: {
    type: DataTypes.ENUM(...Object.values(EXPENSE_CATEGORIES)),
    defaultValue: 'OTHER'
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(14, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  payment_method: {
    type: DataTypes.ENUM(...Object.values(PAYMENT_METHODS)),
    defaultValue: PAYMENT_METHODS.CASH
  },
  expense_date: {
    type: DataTypes.DATEONLY,
    defaultValue: DataTypes.NOW
  },
  recipient: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  receipt_url: {
    type: DataTypes.STRING(500),
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
  tableName: 'expenses',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['tenant_id', 'expense_number']
    },
    {
      fields: ['tenant_id', 'expense_date']
    }
  ]
});

module.exports = {
  sequelize,
  Payment,
  Expense
};
