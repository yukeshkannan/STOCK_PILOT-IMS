const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env'), override: true });
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const app = require('./src/app');

const PORT = process.env.PORT || 5010;

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
