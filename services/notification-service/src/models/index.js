const { DataTypes } = require('sequelize');
const { createDatabaseConnection } = require('@stockpilot/common');

const sequelize = createDatabaseConnection(process.env.DB_NAME || 'notification_db');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  tenant_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true // null means broadcast to all tenant users
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  type: {
    type: DataTypes.STRING(50),
    defaultValue: 'SYSTEM'
  },
  category: {
    type: DataTypes.STRING(50),
    defaultValue: 'SYSTEM' // 'REQUESTS', 'STOCK', 'TRANSACTIONS', 'SYSTEM'
  },
  action_type: {
    type: DataTypes.STRING(50),
    allowNull: true // 'TRANSFER_APPROVE', 'PURCHASE_APPROVE', 'RETURN_APPROVE', 'REORDER'
  },
  action_id: {
    type: DataTypes.STRING(100),
    allowNull: true // ID of transfer, PO, sale return, or product
  },
  action_status: {
    type: DataTypes.STRING(30),
    allowNull: true,
    defaultValue: null // 'PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'
  },
  metadata: {
    type: DataTypes.TEXT,
    allowNull: true // JSON stringified extra payload
  },
  link: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'notifications',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['tenant_id', 'is_read']
    },
    {
      fields: ['tenant_id', 'category']
    }
  ]
});

module.exports = {
  sequelize,
  Notification
};

