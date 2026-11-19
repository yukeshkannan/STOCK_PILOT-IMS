#!/usr/bin/env node
/**
 * StockPilot Pre-Flight Environment Validator
 * Checks configuration integrity, required credentials, and security health before deployment.
 */

const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load .env
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

const isProduction = process.env.NODE_ENV === 'production';

console.log('====================================================');
console.log(`🔍 StockPilot Pre-Flight Environment Check [${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}]`);
console.log('====================================================\n');

const CHECKS = [
  {
    key: 'NODE_ENV',
    required: true,
    validate: (val) => ['development', 'production', 'test'].includes(val),
    tip: 'Must be development or production'
  },
  {
    key: 'PORT',
    required: false,
    default: '5000',
    validate: (val) => !isNaN(parseInt(val, 10)),
    tip: 'API Gateway listening port'
  },
  {
    key: 'JWT_SECRET',
    required: true,
    validate: (val) => Boolean(val && val.length >= 32 && !val.includes('stockpilot_super_secret_jwt_key_2026')),
    warnOnDefault: 'stockpilot_super_secret_jwt_key_2026',
    tip: 'Should be a cryptographically random string (e.g. openssl rand -hex 32)'
  },
  {
    key: 'JWT_REFRESH_SECRET',
    required: true,
    validate: (val) => Boolean(val && val.length >= 32 && !val.includes('stockpilot_refresh_secret_key_2026')),
    warnOnDefault: 'stockpilot_refresh_secret_key_2026',
    tip: 'Should be distinct from JWT_SECRET'
  },
  {
    key: 'DB_DIALECT',
    required: true,
    validate: (val) => ['mysql', 'sqlite', 'postgres'].includes(val),
    tip: 'Set to "mysql" for Docker / Production cloud environments'
  },
  {
    key: 'DB_PASSWORD',
    required: isProduction,
    validate: (val) => Boolean(val && val !== '12345' && val !== 'rootpassword'),
    warnOnDefault: '12345',
    tip: 'Use a strong non-default database password in production'
  },
  {
    key: 'BREVO_API_KEY',
    required: false,
    validate: (val) => Boolean(val && val.startsWith('xkeysib-') && val.length > 50),
    tip: 'Transactional email delivery gateway for invoices, OTPs & tracking'
  },
  {
    key: 'BREVO_SENDER_EMAIL',
    required: false,
    validate: (val) => Boolean(val && val.includes('@')),
    tip: 'Verified Brevo sender email address'
  },
  {
    key: 'RABBITMQ_URL',
    required: false,
    validate: (val) => Boolean(val && (val.startsWith('amqp://') || val.startsWith('amqps://'))),
    tip: 'CloudAMQP or local RabbitMQ broker connection string'
  },
  {
    key: 'REDIS_URL',
    required: false,
    validate: (val) => Boolean(val && (val.startsWith('redis://') || val.startsWith('rediss://'))),
    tip: 'Upstash or local Redis instance for caching and idempotency'
  }
];

let hasErrors = false;
let hasWarnings = false;

CHECKS.forEach((check) => {
  const value = process.env[check.key] || check.default;

  if (!value && check.required) {
    console.error(`❌ [ERROR] ${check.key}: Missing required environment variable! (${check.tip})`);
    hasErrors = true;
    return;
  }

  if (value && check.warnOnDefault && value === check.warnOnDefault) {
    if (isProduction) {
      console.error(`❌ [ERROR] ${check.key}: Using default development secret in production!`);
      hasErrors = true;
    } else {
      console.warn(`⚠️  [WARN]  ${check.key}: Using default development value "${value}". Change this before production!`);
      hasWarnings = true;
    }
    return;
  }

  if (value && check.validate && !check.validate(value)) {
    if (isProduction && check.required) {
      console.error(`❌ [ERROR] ${check.key}: Failed validation! (${check.tip})`);
      hasErrors = true;
    } else {
      console.warn(`⚠️  [WARN]  ${check.key}: Advisory check not optimal. (${check.tip})`);
      hasWarnings = true;
    }
    return;
  }

  console.log(`✅ [OK]    ${check.key}`);
});

console.log('\n====================================================');
if (hasErrors) {
  console.error('🚫 Pre-flight check FAILED! Please resolve critical configuration errors.');
  process.exit(1);
} else if (hasWarnings) {
  console.log('⚠️  Pre-flight check PASSED with advisory warnings.');
  process.exit(0);
} else {
  console.log('🎉 Pre-flight check PASSED! All configuration parameters are healthy.');
  process.exit(0);
}
