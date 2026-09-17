const { ApiResponse } = require('@stockpilot/common');
const { userService, auditService } = require('../services/userService');

class UserController {
  async listUsers(req, res, next) {
    try {
      const users = await userService.getUsers(req.user.tenantId);
      return ApiResponse.success(res, users, 'Users retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getUser(req, res, next) {
    try {
      const user = await userService.getUserById(req.user.tenantId, req.params.id);
      return ApiResponse.success(res, user, 'User details');
    } catch (err) {
      next(err);
    }
  }

  async createUser(req, res, next) {
    try {
      const user = await userService.createUser(req.user.tenantId, req.body);
      await auditService.logAction({
        tenantId: req.user.tenantId,
        userId: req.user.userId,
        userName: req.user.email,
        action: 'CREATE_USER',
        module: 'USERS',
        recordId: user.id,
        description: `Created user ${user.email} with role ${user.role_name}`
      });
      return ApiResponse.created(res, user, 'User created successfully');
    } catch (err) {
      next(err);
    }
  }

  async updateUser(req, res, next) {
    try {
      const user = await userService.updateUser(req.user.tenantId, req.params.id, req.body);
      await auditService.logAction({
        tenantId: req.user.tenantId,
        userId: req.user.userId,
        userName: req.user.email,
        action: 'UPDATE_USER',
        module: 'USERS',
        recordId: user.id,
        description: `Updated user ${user.email}`
      });
      return ApiResponse.success(res, user, 'User updated successfully');
    } catch (err) {
      next(err);
    }
  }

  async toggleStatus(req, res, next) {
    try {
      const user = await userService.toggleUserStatus(req.user.tenantId, req.params.id, req.body.status);
      return ApiResponse.success(res, user, `User status updated to ${user.status}`);
    } catch (err) {
      next(err);
    }
  }

  async deleteUser(req, res, next) {
    try {
      await userService.deleteUser(req.user.tenantId, req.params.id);
      return ApiResponse.success(res, null, 'User removed successfully');
    } catch (err) {
      next(err);
    }
  }

  async listRoles(req, res, next) {
    try {
      const roles = await userService.getRoles(req.user.tenantId);
      return ApiResponse.success(res, roles, 'Roles retrieved');
    } catch (err) {
      next(err);
    }
  }

  async listPermissions(req, res, next) {
    try {
      const permissions = await userService.getPermissions();
      return ApiResponse.success(res, permissions, 'Permissions retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getAuditLogs(req, res, next) {
    try {
      const logs = await auditService.getLogs(req.user.tenantId, req.query.limit || 50);
      return ApiResponse.success(res, logs, 'Audit logs retrieved');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new UserController();
