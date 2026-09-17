const { sendError } = require('../utils/response');

function enforceTenantIsolation(req, res, next) {
  // Super Admin can access across tenants if explicit, or operate on global scope
  if (req.user && req.user.isSuperAdmin) {
    req.tenantId = req.query.tenantId || req.headers['x-tenant-id'] || null;
    return next();
  }

  const tenantId = req.user?.tenantId || req.headers['x-tenant-id'];
  if (!tenantId) {
    return sendError(res, 'Tenant context missing from verified token', 403);
  }

  req.tenantId = parseInt(tenantId, 10);
  next();
}

function requireSuperAdmin(req, res, next) {
  if (req.user && req.user.isSuperAdmin) {
    return next();
  }
  return sendError(res, 'Forbidden: Requires Super Admin platform privileges', 403);
}

function withTenant(tenantId, condition = {}) {
  if (!tenantId) return condition;
  return {
    ...condition,
    tenant_id: tenantId
  };
}

module.exports = {
  enforceTenantIsolation,
  requireTenant: enforceTenantIsolation,
  requireSuperAdmin,
  withTenant
};
