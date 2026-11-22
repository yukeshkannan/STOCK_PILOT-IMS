const path = require('path');
const assignedPort = process.env.PORT;
require('dotenv').config({ path: path.resolve(__dirname, '../../.env'), override: false });
const app = require('./src/app');

const PORT = (assignedPort && String(assignedPort) !== "5000") ? assignedPort : (process.env.PORT && String(process.env.PORT) !== "5000" ? process.env.PORT : 5010);

async function startServer() {
  try {
    app.listen(PORT, () => {
      console.log(`🤖 StockPilot AI Copilot Service (Google Gemini) running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start AI Copilot Service:', error);
    process.exit(1);
  }
}

startServer();
