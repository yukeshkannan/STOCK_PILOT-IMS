const fs = require('fs');
const path = require('path');

const servicesDir = path.resolve(__dirname, '../services');
const commonDir = path.resolve(servicesDir, 'common');

function copyDir(src, dest) {
  if (fs.existsSync(dest)) {
    try {
      if (fs.realpathSync(src) === fs.realpathSync(dest)) {
        return; // Same directory or symlinked already
      }
    } catch {
      // Continue if realpath fails
    }
  } else {
    fs.mkdirSync(dest, { recursive: true });
  }

  fs.cpSync(src, dest, {
    recursive: true,
    filter: (source) => !source.includes('node_modules')
  });
}

const services = fs.readdirSync(servicesDir, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory() && dirent.name !== 'common')
  .map(dirent => dirent.name);

console.log('🔄 Syncing common library to all services and root...');

// Root node_modules
const rootTarget = path.resolve(__dirname, '../node_modules/@stockpilot/common');
copyDir(commonDir, rootTarget);
console.log('  ✓ Synced to root node_modules/@stockpilot/common');

services.forEach(svc => {
  const targetDir = path.join(servicesDir, svc, 'node_modules', '@stockpilot', 'common');
  copyDir(commonDir, targetDir);
  console.log(`  ✓ Synced to services/${svc}`);
});

console.log('✅ Common library cleanly synced to all microservices & root!');
