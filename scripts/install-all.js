const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const dirs = [
  'services/common',
  'api-gateway',
  'services/auth-service',
  'services/tenant-service',
  'services/product-service',
  'services/inventory-service',
  'services/warehouse-service',
  'services/purchase-service',
  'services/sales-service',
  'services/finance-service',
  'services/notification-service',
  'frontend'
];

console.log('📦 Installing dependencies across all StockPilot packages...\n');

for (const dir of dirs) {
  const fullPath = path.resolve(__dirname, '..', dir);
  if (fs.existsSync(fullPath) && fs.existsSync(path.join(fullPath, 'package.json'))) {
    console.log(`➡️  Installing: ${dir}`);
    try {
      execSync('npm install', { cwd: fullPath, stdio: 'inherit' });
    } catch (err) {
      console.error(`❌ Failed to install ${dir}:`, err.message);
    }
  }
}

console.log('\n✅ All packages installed successfully!');
