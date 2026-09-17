const { execSync } = require('child_process');

const ports = [5000, 5001, 5002, 5003, 5004, 5005, 5006, 5007, 5008, 5009];

ports.forEach((port) => {
  try {
    const netstatOut = execSync('netstat -ano').toString();
    const lines = netstatOut.split('\n');
    lines.forEach((line) => {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 5 && parts[1].endsWith(':' + port) && parts[3] === 'LISTENING') {
        const pid = parts[4];
        console.log(`Terminating stale process on port ${port} (PID: ${pid})...`);
        try {
          execSync(`taskkill /F /PID ${pid}`);
        } catch {}
      }
    });
  } catch (err) {
    console.error(`Error checking port ${port}:`, err.message);
  }
});

console.log('All backend ports cleared.');
