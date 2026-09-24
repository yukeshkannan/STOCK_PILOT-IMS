const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { errorHandler } = require('@stockpilot/common');
const aiRoutes = require('./routes/aiRoutes');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Mount routes
app.use('/api/v1/ai', aiRoutes);

app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    service: 'StockPilot AI Copilot Microservice (Google Gemini)',
    timestamp: new Date().toISOString()
  });
});

app.use(errorHandler);

module.exports = app;
