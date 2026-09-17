const { Tenant, TenantUser, Role, Permission, AuditLog } = require('../models');
const { DEFAULT_ROLE_PERMISSIONS, ROLES, PERMISSIONS } = require('@stockpilot/common');

class UserService {
  async getUsers(tenantId) {
    return TenantUser.findAll({
      where: { tenant_id: tenantId },
      order: [['created_at', 'DESC']]
    });
  }

  async getUserById(tenantId, userId) {
    const user = await TenantUser.findOne({
      where: { id: userId, tenant_id: tenantId }
    });
    if (!user) {
      throw { statusCode: 404, message: 'User not found' };
    }
    return user;
  }

  async createUser(tenantId, userData) {
    const cleanEmail = userData.email.toLowerCase().trim();
    // Check if email exists in this tenant
    const existing = await TenantUser.findOne({
      where: { tenant_id: tenantId, email: cleanEmail }
    });
    if (existing) {
      throw { statusCode: 409, message: 'User with this email already exists in your company' };
    }

    const user = await TenantUser.create({
      tenant_id: tenantId,
      first_name: userData.firstName,
      last_name: userData.lastName || '',
      email: cleanEmail,
      phone: userData.phone || null,
      role_id: userData.roleId || null,
      role_name: userData.roleName || ROLES.STAFF,
      warehouse_id: userData.warehouseId || null,
      warehouse_name: userData.warehouseName || null,
      status: userData.status || 'ACTIVE'
    });

    // Sync into auth_db User table
    try {
      const authModels = require('../../../auth-service/src/models');
      if (authModels?.User) {
        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(userData.password || 'password123', salt);
        const tenant = await Tenant.findByPk(tenantId);

        const existingAuthUser = await authModels.User.findOne({
          where: { tenant_id: tenantId, email: cleanEmail }
        });

        if (existingAuthUser) {
          await existingAuthUser.update({
            first_name: userData.firstName,
            last_name: userData.lastName || '',
            password: hashedPassword,
            role_name: userData.roleName || ROLES.STAFF,
            warehouse_id: userData.warehouseId || null,
            warehouse_name: userData.warehouseName || null,
            status: userData.status || 'ACTIVE'
          });
        } else {
          await authModels.User.create({
            tenant_id: tenantId,
            company_code: tenant ? tenant.company_code : '',
            first_name: userData.firstName,
            last_name: userData.lastName || '',
            email: cleanEmail,
            password: hashedPassword,
            role_name: userData.roleName || ROLES.STAFF,
            warehouse_id: userData.warehouseId || null,
            warehouse_name: userData.warehouseName || null,
            is_super_admin: false,
            status: userData.status || 'ACTIVE'
          });
        }
      }
    } catch (e) {
      console.warn('Auth user sync note:', e.message);
    }

    return user;
  }

  async updateUser(tenantId, userId, updateData) {
    const user = await this.getUserById(tenantId, userId);
    await user.update({
      first_name: updateData.firstName !== undefined ? updateData.firstName : user.first_name,
      last_name: updateData.lastName !== undefined ? updateData.lastName : user.last_name,
      phone: updateData.phone !== undefined ? updateData.phone : user.phone,
      role_id: updateData.roleId !== undefined ? updateData.roleId : user.role_id,
      role_name: updateData.roleName !== undefined ? updateData.roleName : user.role_name,
      warehouse_id: updateData.warehouseId !== undefined ? updateData.warehouseId : user.warehouse_id,
      warehouse_name: updateData.warehouseName !== undefined ? updateData.warehouseName : user.warehouse_name,
      status: updateData.status !== undefined ? updateData.status : user.status
    });

    try {
      const authModels = require('../../../auth-service/src/models');
      if (authModels?.User) {
        const updateFields = {
          first_name: user.first_name,
          last_name: user.last_name,
          role_name: user.role_name,
          warehouse_id: user.warehouse_id,
          warehouse_name: user.warehouse_name,
          status: user.status
        };

        if (updateData.password && updateData.password.trim().length >= 4) {
          const bcrypt = require('bcryptjs');
          const salt = await bcrypt.genSalt(10);
          updateFields.password = await bcrypt.hash(updateData.password.trim(), salt);
        }

        await authModels.User.update(updateFields, {
          where: { tenant_id: tenantId, email: user.email }
        });
      }
    } catch (e) {
      console.warn('Auth user update sync note:', e.message);
    }

    return user;
  }

  async toggleUserStatus(tenantId, userId, status) {
    const user = await this.getUserById(tenantId, userId);
    await user.update({ status });
    return user;
  }

  async deleteUser(tenantId, userId) {
    const user = await this.getUserById(tenantId, userId);
    const userEmail = user.email;
    await user.destroy();

    try {
      const authModels = require('../../../auth-service/src/models');
      if (authModels?.User) {
        await authModels.User.destroy({
          where: { tenant_id: tenantId, email: userEmail }
        });
      }
    } catch (e) {
      console.warn('Auth user delete sync note:', e.message);
    }

    return true;
  }

  // Roles & Permissions
  async getRoles(tenantId) {
    return Role.findAll({
      where: {
        $or: [
          { tenant_id: tenantId },
          { is_system: true }
        ]
      },
      include: [{ model: Permission, as: 'permissions' }]
    }).catch(async () => {
      // Fallback for dialect syntax
      return Role.findAll({
        include: [{ model: Permission, as: 'permissions' }]
      });
    });
  }

  async getPermissions() {
    return Permission.findAll({ order: [['module', 'ASC'], ['name', 'ASC']] });
  }

  async createRole(tenantId, { name, description, permissionIds }) {
    const role = await Role.create({
      tenant_id: tenantId,
      name,
      description,
      is_system: false
    });

    if (permissionIds && permissionIds.length) {
      await role.setPermissions(permissionIds);
    }

    return Role.findByPk(role.id, {
      include: [{ model: Permission, as: 'permissions' }]
    });
  }
}

class AuditService {
  async logAction({ tenantId, userId, userName, action, module, recordId, description, ipAddress }) {
    try {
      await AuditLog.create({
        tenant_id: tenantId || null,
        user_id: userId || null,
        user_name: userName || 'System',
        action,
        module,
        record_id: recordId ? String(recordId) : null,
        description,
        ip_address: ipAddress || null
      });
    } catch (err) {
      console.error('Failed to write audit log:', err.message);
    }
  }

  async getLogs(tenantId, limit = 50) {
    const where = tenantId ? { tenant_id: tenantId } : {};
    return AuditLog.findAll({
      where,
      limit: parseInt(limit, 10),
      order: [['created_at', 'DESC']]
    });
  }

  async getPlatformLogs({ tenantId, module, action, search, limit = 100, page = 1 } = {}) {
    const { Op } = require('sequelize');
    const where = {};

    if (tenantId) {
      where.tenant_id = tenantId;
    }
    if (module && module !== 'ALL') {
      where.module = module;
    }
    if (action && action !== 'ALL') {
      where.action = action;
    }
    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      where[Op.or] = [
        { action: { [Op.like]: q } },
        { description: { [Op.like]: q } },
        { user_name: { [Op.like]: q } },
        { module: { [Op.like]: q } }
      ];
    }

    const parsedLimit = Math.min(parseInt(limit, 10) || 100, 200);
    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const offset = (parsedPage - 1) * parsedLimit;

    const { rows, count } = await AuditLog.findAndCountAll({
      where,
      limit: parsedLimit,
      offset,
      order: [['created_at', 'DESC']]
    });

    return {
      logs: rows,
      totalCount: count,
      page: parsedPage,
      totalPages: Math.ceil(count / parsedLimit) || 1
    };
  }

  async deleteLog(logId) {
    const log = await AuditLog.findByPk(logId);
    if (!log) {
      throw { statusCode: 404, message: 'Audit log record not found' };
    }
    await log.destroy();
    return true;
  }

  async clearLogs() {
    await AuditLog.destroy({ where: {}, truncate: true });
    return true;
  }
}

module.exports = {
  userService: new UserService(),
  auditService: new AuditService()
};
