const jwt = require('jsonwebtoken');
const { sendError } = require('../utils/response');

const JWT_SECRET = process.env.JWT_SECRET || 'stockpilot_super_secret_jwt_key_2026';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'stockpilot_refresh_secret_key_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

function generateTokens(payload) {
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  const refreshToken = jwt.sign({ userId: payload.userId, tenantId: payload.tenantId }, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
  return { accessToken, refreshToken };
}

function verifyAccessToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET);
  } catch (error) {
    return null;
  }
}

function authenticateToken(req, res, next) {
  // If API gateway has already authenticated and passed context headers
  if (req.headers['x-user-id']) {
    req.user = {
      userId: req.headers['x-user-id'],
      tenantId: req.headers['x-tenant-id'] || null,
      companyCode: req.headers['x-company-code'] || null,
      companyName: req.headers['x-company-name'] || null,
      name: req.headers['x-user-name'] || null,
      email: req.headers['x-user-email'] || '',
      role: req.headers['x-user-role'],
      permissions: req.headers['x-user-permissions'] ? JSON.parse(req.headers['x-user-permissions']) : [],
      isSuperAdmin: req.headers['x-is-super-admin'] === 'true',
      isDeveloper: req.headers['x-is-developer'] === 'true' || req.headers['x-user-role'] === 'DEVELOPER'
    };
    return next();
  }

  // Direct service call with Authorization header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return sendError(res, 'Access Denied: No authentication token provided', 401);
  }

  const decoded = verifyAccessToken(token);
  if (!decoded) {
    return sendError(res, 'Invalid or expired authentication token', 403);
  }

  req.user = decoded;
  next();
}

module.exports = {
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
  authenticateToken,
  JWT_SECRET,
  JWT_REFRESH_SECRET
};
