require('dotenv').config();
const app = require('./src/app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(` API Gateway running on port ${PORT}`);
  console.log(` Base API URL: http://localhost:${PORT}/api/v1`);
});
