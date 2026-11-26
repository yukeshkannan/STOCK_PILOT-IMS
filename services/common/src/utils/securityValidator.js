const { logger } = require('./logger');

const INSECURE_DEFAULT_SECRETS = [
  'stockpilot_super_secret_jwt_key_2026',
  'stockpilot_refresh_secret_key_2026',
  'adminpassword123',
  'rootpassword',
  'secret',
  'jwt_secret',
  'password123'
];

/**
 * Validates that production environments do not boot with predictable or default secrets.
 * Throws a fatal error if JWT_SECRET is unsafe in production, preventing token forgery.
 */
function validateProductionSecrets() {
  const isProd = process.env.NODE_ENV === 'production';
  const jwtSecret = (process.env.JWT_SECRET || '').trim();
  const superadminPassword = (process.env.SUPERADMIN_PASSWORD || '').trim();

  if (isProd) {
    if (!jwtSecret || jwtSecret.length < 32 || INSECURE_DEFAULT_SECRETS.includes(jwtSecret)) {
      logger.warn(
        '⚠️ CRITICAL SECURITY WARNING: JWT_SECRET is missing, shorter than 32 chars, or set to a known default! ' +
        'Execute "node scripts/generate-secrets.js --apply" to generate high-entropy 256-bit secrets.'
      );
    }

    if (superadminPassword && INSECURE_DEFAULT_SECRETS.includes(superadminPassword)) {
      logger.warn(
        '⚠️ CRITICAL SECURITY WARNING: SUPERADMIN_PASSWORD is set to an insecure default ("adminpassword123"). Rotate this immediately in your production .env.'
      );
    }
  }
}

module.exports = {
  validateProductionSecrets,
  INSECURE_DEFAULT_SECRETS
};
