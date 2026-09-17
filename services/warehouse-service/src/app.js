const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { errorHandler } = require('@stockpilot/common');
const { warehouseRouter, transferRouter } = require('./routes');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Mount routes
app.use('/api/v1/warehouses', warehouseRouter);
app.use('/api/v1/transfers', transferRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'UP', service: 'Warehouse & Stock Transfer Service', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

module.exports = app;
