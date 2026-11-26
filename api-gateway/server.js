const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env'), override: true });
const app = require('./src/app');

// Validate production security tokens
if (process.env.NODE_ENV === 'production') {
  const jwtSecret = (process.env.JWT_SECRET || '').trim();
  if (!jwtSecret || jwtSecret.length < 32 || jwtSecret.includes('stockpilot_super_secret')) {
    console.warn('⚠️ WARNING: Insecure or default JWT_SECRET detected in production. Execute "node scripts/generate-secrets.js --apply" when convenient to rotate.');
  }
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(` API Gateway running on port ${PORT}`);
  console.log(` Base API URL: http://localhost:${PORT}/api/v1`);
});
