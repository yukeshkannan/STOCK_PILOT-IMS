const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
process.env.DB_DIALECT = process.env.DB_DIALECT || 'sqlite';
const { spawn } = require('child_process');

const services = [
  { name: 'Gateway', port: 5000, script: 'api-gateway/server.js', color: '\x1b[36m' },
  { name: 'Auth', port: 5001, script: 'services/auth-service/server.js', color: '\x1b[32m' },
  { name: 'Tenant', port: 5002, script: 'services/tenant-service/server.js', color: '\x1b[33m' },
  { name: 'Product', port: 5003, script: 'services/product-service/server.js', color: '\x1b[34m' },
  { name: 'Inventory', port: 5004, script: 'services/inventory-service/server.js', color: '\x1b[35m' },
  { name: 'Warehouse', port: 5005, script: 'services/warehouse-service/server.js', color: '\x1b[36m' },
  { name: 'Purchase', port: 5006, script: 'services/purchase-service/server.js', color: '\x1b[32m' },
  { name: 'Sales', port: 5007, script: 'services/sales-service/server.js', color: '\x1b[33m' },
  { name: 'Finance', port: 5008, script: 'services/finance-service/server.js', color: '\x1b[34m' },
  { name: 'Notification', port: 5009, script: 'services/notification-service/server.js', color: '\x1b[35m' },
  { name: 'AI-Copilot', port: 5010, script: 'services/ai-service/server.js', color: '\x1b[36m' }
];

console.log('Launching all StockPilot backend microservices and API Gateway...\n');

const processes = [];

services.forEach((svc) => {
  const fullPath = path.resolve(__dirname, '..', svc.script);
  const proc = spawn('node', ['--watch', fullPath], {
    cwd: path.dirname(fullPath),
    stdio: 'pipe',
    env: { ...process.env, PORT: svc.port }
  });

  proc.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach((line) => {
      console.log(`${svc.color}[${svc.name}:${svc.port}]\x1b[0m ${line}`);
    });
  });

  proc.stderr.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach((line) => {
      console.error(`${svc.color}[${svc.name}:${svc.port} ERR]\x1b[0m ${line}`);
    });
  });

  proc.on('close', (code) => {
    console.log(`${svc.color}[${svc.name}]\x1b[0m Exited with code ${code}`);
  });

  processes.push(proc);
});

// Cleanup on exit
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping all services...');
  processes.forEach(p => p.kill());
  process.exit();
});

process.on('SIGTERM', () => {
  processes.forEach(p => p.kill());
  process.exit();
});
