const { ApiResponse } = require('@stockpilot/common');
const tenantService = require('../services/tenantService');
const { auditService } = require('../services/userService');

class AdminController {
  async getDashboard(req, res, next) {
    try {
      const stats = await tenantService.getPlatformDashboard();
      return ApiResponse.success(res, stats, 'Platform statistics');
    } catch (err) {
      next(err);
    }
  }

  async listTenants(req, res, next) {
    try {
      const tenants = await tenantService.getAllTenants();
      return ApiResponse.success(res, tenants, 'All registered tenants');
    } catch (err) {
      next(err);
    }
  }

  async suspendTenant(req, res, next) {
    try {
      const tenant = await tenantService.setTenantStatus(req.params.id, 'SUSPENDED');
      await auditService.logAction({
        tenantId: tenant.id,
        userId: req.user?.userId || null,
        userName: req.user?.email || 'Super Admin',
        action: 'TENANT_SUSPENDED',
        module: 'SECURITY',
        recordId: tenant.id,
        description: `Organization [${tenant.company_name}] suspended by Super Admin`,
        ipAddress: req.ip
      });
      return ApiResponse.success(res, tenant, `Tenant [${tenant.company_name}] suspended`);
    } catch (err) {
      next(err);
    }
  }

  async activateTenant(req, res, next) {
    try {
      const tenant = await tenantService.setTenantStatus(req.params.id, 'ACTIVE');
      await auditService.logAction({
        tenantId: tenant.id,
        userId: req.user?.userId || null,
        userName: req.user?.email || 'Super Admin',
        action: 'TENANT_ACTIVATED',
        module: 'SECURITY',
        recordId: tenant.id,
        description: `Organization [${tenant.company_name}] reactivated by Super Admin`,
        ipAddress: req.ip
      });
      return ApiResponse.success(res, tenant, `Tenant [${tenant.company_name}] activated`);
    } catch (err) {
      next(err);
    }
  }

  async updateTenantPlan(req, res, next) {
    try {
      const { plan } = req.body;
      const tenant = await tenantService.setTenantPlan(req.params.id, plan);
      await auditService.logAction({
        tenantId: tenant.id,
        userId: req.user?.userId || null,
        userName: req.user?.email || 'Super Admin',
        action: 'TENANT_PLAN_UPDATED',
        module: 'BILLING',
        recordId: tenant.id,
        description: `Organization [${tenant.company_name}] subscription plan updated to [${plan}]`,
        ipAddress: req.ip
      });
      return ApiResponse.success(res, tenant, `Tenant [${tenant.company_name}] plan updated to ${plan}`);
    } catch (err) {
      next(err);
    }
  }

  async createTenant(req, res, next) {
    try {
      const tenant = await tenantService.createTenant(req.body);
      await auditService.logAction({
        tenantId: tenant.id,
        userId: req.user?.userId || null,
        userName: req.user?.email || 'Super Admin',
        action: 'TENANT_PROVISIONED',
        module: 'TENANT',
        recordId: tenant.id,
        description: `New tenant organization [${tenant.company_name}] provisioned`,
        ipAddress: req.ip
      });
      return ApiResponse.created(res, tenant, `Tenant [${tenant.company_name}] registered successfully`);
    } catch (err) {
      next(err);
    }
  }

  async deleteTenant(req, res, next) {
    try {
      const result = await tenantService.deleteTenant(req.params.id);
      await auditService.logAction({
        tenantId: null,
        userId: req.user?.userId || null,
        userName: req.user?.email || 'Super Admin',
        action: 'TENANT_PURGED',
        module: 'SECURITY',
        recordId: result.id,
        description: `Tenant organization [${result.company_name}] and all related microservice records permanently purged by Super Admin`,
        ipAddress: req.ip
      });
      return ApiResponse.success(res, result, `Tenant [${result.company_name}] and all associated data permanently deleted`);
    } catch (err) {
      next(err);
    }
  }

  async listPendingRegistrations(req, res, next) {
    try {
      const data = await tenantService.getPendingRegistrations();
      return ApiResponse.success(res, data, 'Pending registrations retrieved');
    } catch (err) {
      next(err);
    }
  }

  async deletePendingRegistration(req, res, next) {
    try {
      const cleanId = String(req.params.id).replace('pending-', '');
      const result = await tenantService.deletePendingRegistration(cleanId);
      await auditService.logAction({
        tenantId: null,
        userId: req.user?.userId || null,
        userName: req.user?.email || 'Super Admin',
        action: 'PENDING_USER_PURGED',
        module: 'SECURITY',
        recordId: result.id,
        description: `Pending registration for [${result.email}] permanently purged by Super Admin`,
        ipAddress: req.ip
      });
      return ApiResponse.success(res, result, `Pending registration for [${result.email}] deleted successfully`);
    } catch (err) {
      next(err);
    }
  }
  async getAuditLogs(req, res, next) {
    try {
      const data = await auditService.getPlatformLogs({
        tenantId: req.query.tenantId,
        module: req.query.module,
        action: req.query.action,
        search: req.query.search,
        limit: req.query.limit,
        page: req.query.page
      });
      return ApiResponse.success(res, data, 'Platform audit logs retrieved');
    } catch (err) {
      next(err);
    }
  }

  async deleteAuditLog(req, res, next) {
    try {
      await auditService.deleteLog(req.params.id);
      return ApiResponse.success(res, null, `Audit record #${req.params.id} permanently deleted`);
    } catch (err) {
      next(err);
    }
  }

  async clearAuditLogs(req, res, next) {
    try {
      await auditService.clearLogs();
      return ApiResponse.success(res, null, 'All platform audit records purged');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AdminController();

