const path = require('path');
const dotenv = require('dotenv');

// Automatically load secrets from the private server .env (which is NOT tracked by git)
dotenv.config({ path: path.resolve(__dirname, '.env') });

const baseEnv = {
  NODE_ENV: process.env.NODE_ENV || 'production',
  DB_DIALECT: process.env.DB_DIALECT || 'mysql',
  DB_HOST: (process.env.DB_HOST && process.env.DB_HOST !== 'localhost') ? process.env.DB_HOST : '127.0.0.1',
  DB_PORT: process.env.DB_PORT || 3306,
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_LOGGING: 'false',
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '8h',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  RABBITMQ_URL: process.env.RABBITMQ_URL,
  REDIS_URL: process.env.REDIS_URL,
  BREVO_API_KEY: process.env.BREVO_API_KEY,
  BREVO_SENDER_EMAIL: process.env.BREVO_SENDER_EMAIL,
  BREVO_SENDER_NAME: process.env.BREVO_SENDER_NAME,
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  AUTH_SERVICE_URL: 'http://127.0.0.1:5001',
  TENANT_SERVICE_URL: 'http://127.0.0.1:5002',
  PRODUCT_SERVICE_URL: 'http://127.0.0.1:5003',
  INVENTORY_SERVICE_URL: 'http://127.0.0.1:5004',
  WAREHOUSE_SERVICE_URL: 'http://127.0.0.1:5005',
  PURCHASE_SERVICE_URL: 'http://127.0.0.1:5006',
  SALES_SERVICE_URL: 'http://127.0.0.1:5007',
  FINANCE_SERVICE_URL: 'http://127.0.0.1:5008',
  NOTIFICATION_SERVICE_URL: 'http://127.0.0.1:5009',
  AI_SERVICE_URL: 'http://127.0.0.1:5010'
};

module.exports = {
  apps: [
    {
      name: 'gateway',
      script: 'api-gateway/server.js',
      max_memory_restart: '180M',
      node_args: '--max-old-space-size=96',
      env: { ...baseEnv, PORT: 5000 }
    },
    {
      name: 'auth-svc',
      script: 'services/auth-service/server.js',
      max_memory_restart: '180M',
      node_args: '--max-old-space-size=96',
      env: { ...baseEnv, PORT: 5001 }
    },
    {
      name: 'tenant-svc',
      script: 'services/tenant-service/server.js',
      max_memory_restart: '180M',
      node_args: '--max-old-space-size=96',
      env: { ...baseEnv, PORT: 5002 }
    },
    {
      name: 'product-svc',
      script: 'services/product-service/server.js',
      max_memory_restart: '180M',
      node_args: '--max-old-space-size=96',
      env: { ...baseEnv, PORT: 5003 }
    },
    {
      name: 'inventory-svc',
      script: 'services/inventory-service/server.js',
      max_memory_restart: '180M',
      node_args: '--max-old-space-size=96',
      env: { ...baseEnv, PORT: 5004 }
    },
    {
      name: 'warehouse-svc',
      script: 'services/warehouse-service/server.js',
      max_memory_restart: '180M',
      node_args: '--max-old-space-size=96',
      env: { ...baseEnv, PORT: 5005 }
    },
    {
      name: 'purchase-svc',
      script: 'services/purchase-service/server.js',
      max_memory_restart: '180M',
      node_args: '--max-old-space-size=96',
      env: { ...baseEnv, PORT: 5006 }
    },
    {
      name: 'sales-svc',
      script: 'services/sales-service/server.js',
      max_memory_restart: '180M',
      node_args: '--max-old-space-size=96',
      env: { ...baseEnv, PORT: 5007 }
    },
    {
      name: 'finance-svc',
      script: 'services/finance-service/server.js',
      max_memory_restart: '180M',
      node_args: '--max-old-space-size=96',
      env: { ...baseEnv, PORT: 5008 }
    },
    {
      name: 'notification-svc',
      script: 'services/notification-service/server.js',
      max_memory_restart: '180M',
      node_args: '--max-old-space-size=96',
      env: { ...baseEnv, PORT: 5009 }
    },
    {
      name: 'ai-svc',
      script: 'services/ai-service/server.js',
      max_memory_restart: '180M',
      node_args: '--max-old-space-size=96',
      env: { ...baseEnv, PORT: 5010 }
    }
  ]
};
