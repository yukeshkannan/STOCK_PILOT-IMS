const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { errorHandler } = require('@stockpilot/common');
const inventoryRoutes = require('./routes/inventoryRoutes');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.use('/api/v1/inventory', inventoryRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'UP', service: 'Core Inventory Engine Service', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

module.exports = app;
