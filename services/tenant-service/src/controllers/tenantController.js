const { ApiResponse } = require('@stockpilot/common');
const tenantService = require('../services/tenantService');
const { auditService } = require('../services/userService');

class TenantController {
  async getTenantInternal(req, res, next) {
    try {
      const tenant = await tenantService.getTenant(req.params.id);
      return ApiResponse.success(res, tenant, 'Tenant details');
    } catch (err) {
      next(err);
    }
  }

  async getMe(req, res, next) {
    try {
      const tenant = await tenantService.getTenant(req.user.tenantId);
      return ApiResponse.success(res, tenant, 'Tenant details');
    } catch (err) {
      next(err);
    }
  }

  async updateMe(req, res, next) {
    try {
      const updated = await tenantService.updateTenant(req.user.tenantId, req.body);
      await auditService.logAction({
        tenantId: req.user.tenantId,
        userId: req.user.userId,
        userName: `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim(),
        action: 'UPDATE_TENANT',
        module: 'TENANT',
        recordId: req.user.tenantId,
        description: `Updated company details for ${updated.company_name}`
      });
      return ApiResponse.success(res, updated, 'Company details updated successfully');
    } catch (err) {
      next(err);
    }
  }

  async getSettings(req, res, next) {
    try {
      if (!req.user?.tenantId) {
        return ApiResponse.success(res, {
          companyName: 'StockPilot Platform',
          companyCode: 'PLATFORM',
          plan: 'ENTERPRISE',
          email: req.user?.email || 'superadmin@stockpilot.io',
          status: 'ACTIVE'
        }, 'Platform settings');
      }
      const settings = await tenantService.getSettings(req.user.tenantId, req.user);
      return ApiResponse.success(res, settings, 'Tenant settings');
    } catch (err) {
      next(err);
    }
  }

  async updateSettings(req, res, next) {
    try {
      const updated = await tenantService.updateSettings(req.user.tenantId, req.body);
      return ApiResponse.success(res, updated, 'Settings updated successfully');
    } catch (err) {
      next(err);
    }
  }

  async upgradeSubscription(req, res, next) {
    try {
      const { plan, paymentId, paymentMethod } = req.body;
      const tenantId = req.user.tenantId;
      const updatedTenant = await tenantService.setTenantPlan(tenantId, plan);

      // Audit Log
      await auditService.logAction({
        tenantId,
        userId: req.user.userId,
        userName: `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email,
        action: 'SUBSCRIPTION_UPGRADED',
        module: 'BILLING',
        recordId: tenantId,
        description: `Workspace subscription changed to [${plan}] via Razorpay (Txn: ${paymentId || 'TXN_' + Date.now()})`
      });

      return ApiResponse.success(res, {
        plan: updatedTenant.plan,
        tenant: updatedTenant,
        paymentId: paymentId || `pay_${Date.now()}`
      }, `Subscription plan changed to ${plan} successfully`);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new TenantController();
