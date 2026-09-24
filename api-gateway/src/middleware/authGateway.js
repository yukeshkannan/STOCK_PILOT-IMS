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
      req.headers['x-is-developer'] = (decoded.isDeveloper || decoded.role === 'DEVELOPER') ? 'true' : 'false';
      req.headers['x-user-email'] = decoded.email || '';
      req.headers['x-user-name'] = decoded.name || `${decoded.firstName || decoded.first_name || ''} ${decoded.lastName || decoded.last_name || ''}`.trim() || '';
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
