const { DataTypes } = require('sequelize');
const { createDatabaseConnection } = require('@stockpilot/common');

const sequelize = createDatabaseConnection(process.env.DB_NAME || 'tenant_db');

const Tenant = sequelize.define('Tenant', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
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
  email: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  tax_number: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  currency: {
    type: DataTypes.STRING(10),
    defaultValue: 'INR'
  },
  currency_symbol: {
    type: DataTypes.STRING(5),
    defaultValue: '₹'
  },
  timezone: {
    type: DataTypes.STRING(50),
    defaultValue: 'Asia/Kolkata'
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
  tableName: 'tenants',
  timestamps: true,
  underscored: true
});

const Role = sequelize.define('Role', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  tenant_id: {
    type: DataTypes.INTEGER,
    allowNull: true // Null for default system roles
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  is_system: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'roles',
  timestamps: true,
  underscored: true
});

const Permission = sequelize.define('Permission', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  module: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  tableName: 'permissions',
  timestamps: true,
  underscored: true
});

const RolePermission = sequelize.define('RolePermission', {
  role_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true
  },
  permission_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true
  }
}, {
  tableName: 'role_permissions',
  timestamps: false,
  underscored: true
});

Role.belongsToMany(Permission, { through: RolePermission, foreignKey: 'role_id', as: 'permissions' });
Permission.belongsToMany(Role, { through: RolePermission, foreignKey: 'permission_id', as: 'roles' });

const TenantUser = sequelize.define('TenantUser', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  tenant_id: {
    type: DataTypes.INTEGER,
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
  phone: {
    type: DataTypes.STRING(50),
    allowNull: true
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
  status: {
    type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED'),
    defaultValue: 'ACTIVE'
  },
  is_super_admin: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  warehouse_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  warehouse_name: {
    type: DataTypes.STRING(150),
    allowNull: true
  }
}, {
  tableName: 'tenant_users',
  timestamps: true,
  underscored: true
});

TenantUser.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
TenantUser.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });
Tenant.hasMany(TenantUser, { foreignKey: 'tenant_id', as: 'users' });

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  tenant_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  user_name: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  action: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  module: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  record_id: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  ip_address: {
    type: DataTypes.STRING(50),
    allowNull: true
  }
}, {
  tableName: 'audit_logs',
  timestamps: true,
  underscored: true
});

module.exports = {
  sequelize,
  Tenant,
  Role,
  Permission,
  RolePermission,
  TenantUser,
  AuditLog
};
