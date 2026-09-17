const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { errorHandler } = require('@stockpilot/common');
const {
  tenantRouter,
  userRouter,
  roleRouter,
  permissionRouter,
  auditRouter,
  adminRouter
} = require('./routes');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Mount routes
app.use('/api/v1/tenants', tenantRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/roles', roleRouter);
app.use('/api/v1/permissions', permissionRouter);
app.use('/api/v1/audit-logs', auditRouter);
app.use('/api/v1/admin', adminRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'UP', service: 'Tenant & User Service', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

module.exports = app;
