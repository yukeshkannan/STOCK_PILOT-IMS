const { DataTypes } = require('sequelize');
const { createDatabaseConnection } = require('@stockpilot/common');

const sequelize = createDatabaseConnection(process.env.DB_NAME || 'auth_db');

const TenantLookup = sequelize.define('TenantLookup', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  tenant_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true
  },
  company_code: {
    type: DataTypes.STRING(30),
    allowNull: false,
    unique: true
  },
  company_name: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('ACTIVE', 'SUSPENDED', 'PENDING'),
    defaultValue: 'ACTIVE'
  },
  plan: {
    type: DataTypes.STRING(50),
    defaultValue: 'TRIAL'
  }
}, {
  tableName: 'tenant_lookup',
  timestamps: true,
  underscored: true
});

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  tenant_id: {
    type: DataTypes.INTEGER,
    allowNull: true // Null for Super Admin
  },
  company_code: {
    type: DataTypes.STRING(30),
    allowNull: true
  },
  first_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  last_name: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  role_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  role_name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'STAFF'
  },
  is_super_admin: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  status: {
    type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED'),
    defaultValue: 'ACTIVE'
  },
  warehouse_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  warehouse_name: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  last_login_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'auth_users',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['tenant_id', 'email']
    }
  ]
});

const RefreshToken = sequelize.define('RefreshToken', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  token: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false
  },
  is_revoked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'refresh_tokens',
  timestamps: true,
  underscored: true
});

User.hasMany(RefreshToken, { foreignKey: 'user_id', as: 'refreshTokens' });
RefreshToken.belongsTo(User, { foreignKey: 'user_id' });

module.exports = {
  sequelize,
  TenantLookup,
  User,
  RefreshToken
};
