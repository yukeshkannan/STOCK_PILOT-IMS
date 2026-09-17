const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { errorHandler } = require('@stockpilot/common');
const { productRouter, categoryRouter, brandRouter } = require('./routes');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Mount routes
app.use('/api/v1/products', productRouter);
app.use('/api/v1/categories', categoryRouter);
app.use('/api/v1/brands', brandRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'UP', service: 'Product Catalog Service', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

module.exports = app;
