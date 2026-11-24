const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ip = process.argv[2];

if (!ip) {
  console.log('========================================================');
  console.log('⚠️  Usage: node scripts/set-demo-ip.js <NEW_EC2_IP>');
  console.log('Example: node scripts/set-demo-ip.js 54.163.30.152');
  console.log('========================================================');
  process.exit(1);
}

// Clean IP format (remove http:// or trailing slashes if user pasted full URL)
const cleanIp = ip.replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim();

const vercelJsonPath = path.resolve(__dirname, '..', 'frontend', 'vercel.json');

const vercelConfig = {
  rewrites: [
    {
      source: '/api/:path*',
      destination: `http://${cleanIp}/api/:path*`
    },
    {
      source: '/health',
      destination: `http://${cleanIp}/health`
    },
    {
      source: '/(.*)',
      destination: '/index.html'
    }
  ]
};

fs.writeFileSync(vercelJsonPath, JSON.stringify(vercelConfig, null, 2) + '\n', 'utf-8');

console.log('========================================================');
console.log(`✅ frontend/vercel.json successfully updated to EC2 IP: [${cleanIp}]`);
console.log('========================================================');

try {
  console.log('🚀 Staging, committing & pushing to GitHub...');
  execSync('git add frontend/vercel.json', { stdio: 'inherit' });
  execSync(`git commit -m "chore(vercel): update backend proxy to EC2 IP ${cleanIp}"`, { stdio: 'inherit' });
  execSync('git push origin main', { stdio: 'inherit' });
  console.log('========================================================');
  console.log('🎉 Push successful! Vercel is now auto-deploying your fresh backend IP.');
  console.log('Wait ~20 seconds and open your Vercel URL!');
  console.log('========================================================');
} catch (err) {
  console.log('ℹ️  Note: Changes saved to frontend/vercel.json. Please commit and push manually if git push failed.');
}
