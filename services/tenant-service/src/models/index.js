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
  },
  store_config: {
    type: DataTypes.TEXT,
    allowNull: true
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

const SupportTicket = sequelize.define('SupportTicket', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  ticket_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  tenant_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  company_name: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  company_code: {
    type: DataTypes.STRING(30),
    allowNull: false
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  user_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  user_email: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  user_phone: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  category: {
    type: DataTypes.STRING(50),
    defaultValue: 'GENERAL'
  },
  priority: {
    type: DataTypes.STRING(50),
    defaultValue: 'MEDIUM'
  },
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'OPEN'
  },
  subject: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  assigned_to: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: 'Unassigned'
  },
  resolution_notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'support_tickets',
  timestamps: true,
  underscored: true
});

const TicketMessage = sequelize.define('TicketMessage', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  ticket_id: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  sender_type: {
    type: DataTypes.STRING(50),
    defaultValue: 'CLIENT'
  },
  sender_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  sender_email: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  is_internal_note: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'ticket_messages',
  timestamps: true,
  underscored: true
});

const SupportMember = sequelize.define('SupportMember', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  role: {
    type: DataTypes.STRING(100),
    defaultValue: 'Core Developer'
  },
  specialization: {
    type: DataTypes.STRING(255),
    defaultValue: 'Full Stack & APIs'
  },
  phone: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  status: {
    type: DataTypes.STRING(30),
    defaultValue: 'ACTIVE'
  }
}, {
  tableName: 'support_members',
  timestamps: true,
  underscored: true
});

SupportTicket.hasMany(TicketMessage, { foreignKey: 'ticket_id', sourceKey: 'ticket_id', as: 'messages' });
TicketMessage.belongsTo(SupportTicket, { foreignKey: 'ticket_id', targetKey: 'ticket_id', as: 'ticket' });

AuditLog.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
Tenant.hasMany(AuditLog, { foreignKey: 'tenant_id', as: 'audit_logs' });

module.exports = {
  sequelize,
  Tenant,
  Role,
  Permission,
  RolePermission,
  TenantUser,
  AuditLog,
  SupportTicket,
  TicketMessage,
  SupportMember
};
