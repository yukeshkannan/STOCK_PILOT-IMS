const { sendError } = require('../utils/response');

function authorizeRole(...allowedRoles) {
  const roles = allowedRoles.flat().filter(Boolean);
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Unauthenticated', 401);
    }

    if (req.user.isSuperAdmin) {
      return next();
    }

    if (roles.length > 0 && !roles.includes(req.user.role)) {
      return sendError(res, `Forbidden: Role [${req.user.role}] lacks required privilege`, 403);
    }

    next();
  };
}

function requirePermission(...requiredPermissions) {
  const permissions = requiredPermissions.flat().filter(Boolean);
  return (req, res, next) => {
    if (permissions.length === 0) {
      return next();
    }

    if (!req.user) {
      return sendError(res, 'Unauthenticated', 401);
    }

    if (req.user.isSuperAdmin) {
      return next();
    }

    const userRole = (req.user.role || req.user.roleName || '').toUpperCase();
    if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
      return next();
    }

    const userPermissions = req.user.permissions || [];
    const hasPermission = permissions.some(p => userPermissions.includes(p));

    if (!hasPermission) {
      return sendError(res, 'Forbidden: Insufficient permissions for this action', 403);
    }

    next();
  };
}

module.exports = {
  authorizeRole,
  requirePermission
};
