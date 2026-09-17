const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'stockpilot_super_secret_jwt_key_2026';

function authGatewayMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      // Inject context headers to downstream microservices
      req.headers['x-user-id'] = String(decoded.userId || decoded.id || '');
      req.headers['x-tenant-id'] = decoded.tenantId ? String(decoded.tenantId) : '';
      req.headers['x-company-code'] = decoded.companyCode || '';
      req.headers['x-company-name'] = decoded.companyName || '';
      req.headers['x-user-role'] = decoded.roleName || decoded.role || '';
      req.headers['x-is-super-admin'] = decoded.isSuperAdmin ? 'true' : 'false';
      req.headers['x-user-email'] = decoded.email || '';
      if (decoded.permissions) {
        req.headers['x-user-permissions'] = JSON.stringify(decoded.permissions);
      }
    } catch {
      // Invalid/expired token - downstream service or protected route will reject if auth is required
    }
  }
  next();
}

module.exports = { authGatewayMiddleware };
