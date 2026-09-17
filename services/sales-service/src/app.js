const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { errorHandler } = require('@stockpilot/common');
const { salesRouter, salesReturnRouter, customerRouter } = require('./routes');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Mount routes
app.use('/api/v1/sales', salesRouter);
app.use('/api/v1/sales-returns', salesReturnRouter);
app.use('/api/v1/customers', customerRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'UP', service: 'Customer, POS & Sales Invoicing Service', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

module.exports = app;
