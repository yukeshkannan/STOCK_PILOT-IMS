const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { errorHandler } = require('@stockpilot/common');
const { purchaseRouter, purchaseReturnRouter, supplierRouter } = require('./routes');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Mount routes
app.use('/api/v1/purchases', purchaseRouter);
app.use('/api/v1/purchase-returns', purchaseReturnRouter);
app.use('/api/v1/suppliers', supplierRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'UP', service: 'Supplier & Purchasing Service', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

module.exports = app;
