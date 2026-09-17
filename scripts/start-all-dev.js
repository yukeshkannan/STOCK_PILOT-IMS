const { spawn } = require('child_process');
const path = require('path');

console.log('🌟 Starting StockPilot Full-Stack Platform (Backend Microservices + Frontend)...\n');

const backend = spawn('node', [path.resolve(__dirname, 'start-all-services.js')], {
  stdio: 'inherit'
});

const frontend = spawn('npm', ['run', 'dev'], {
  cwd: path.resolve(__dirname, '..', 'frontend'),
  shell: true,
  stdio: 'inherit'
});

process.on('SIGINT', () => {
  backend.kill();
  frontend.kill();
  process.exit();
});
