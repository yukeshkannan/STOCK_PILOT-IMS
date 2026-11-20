module.exports = {
  apps: [
    {
      name: 'gateway',
      script: 'api-gateway/server.js',
      max_memory_restart: '120M',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      }
    },
    {
      name: 'auth-svc',
      script: 'services/auth-service/server.js',
      max_memory_restart: '90M',
      env: { NODE_ENV: 'production', PORT: 5001 }
    },
    {
      name: 'tenant-svc',
      script: 'services/tenant-service/server.js',
      max_memory_restart: '90M',
      env: { NODE_ENV: 'production', PORT: 5002 }
    },
    {
      name: 'product-svc',
      script: 'services/product-service/server.js',
      max_memory_restart: '90M',
      env: { NODE_ENV: 'production', PORT: 5003 }
    },
    {
      name: 'inventory-svc',
      script: 'services/inventory-service/server.js',
      max_memory_restart: '90M',
      env: { NODE_ENV: 'production', PORT: 5004 }
    },
    {
      name: 'warehouse-svc',
      script: 'services/warehouse-service/server.js',
      max_memory_restart: '90M',
      env: { NODE_ENV: 'production', PORT: 5005 }
    },
    {
      name: 'purchase-svc',
      script: 'services/purchase-service/server.js',
      max_memory_restart: '90M',
      env: { NODE_ENV: 'production', PORT: 5006 }
    },
    {
      name: 'sales-svc',
      script: 'services/sales-service/server.js',
      max_memory_restart: '90M',
      env: { NODE_ENV: 'production', PORT: 5007 }
    },
    {
      name: 'finance-svc',
      script: 'services/finance-service/server.js',
      max_memory_restart: '90M',
      env: { NODE_ENV: 'production', PORT: 5008 }
    },
    {
      name: 'notification-svc',
      script: 'services/notification-service/server.js',
      max_memory_restart: '90M',
      env: { NODE_ENV: 'production', PORT: 5009 }
    },
    {
      name: 'ai-svc',
      script: 'services/ai-service/server.js',
      max_memory_restart: '90M',
      env: { NODE_ENV: 'production', PORT: 5010 }
    }
  ]
};
