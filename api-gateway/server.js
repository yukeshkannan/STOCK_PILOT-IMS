const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env'), override: true });
const app = require('./src/app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(` API Gateway running on port ${PORT}`);
  console.log(` Base API URL: http://localhost:${PORT}/api/v1`);
});
