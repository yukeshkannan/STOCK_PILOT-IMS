const express = require('express');
const { salesController, customerController } = require('../controllers/salesController');
const {
  authenticateToken,
  requireTenant,
  requirePermission,
  PERMISSIONS,
  idempotency
} = require('@stockpilot/common');

// Sales Router
const salesRouter = express.Router();

// Public Unauthenticated Routes (E-Bill viewer & Online Storefront Checkout)
salesRouter.get('/public/invoice/:invoiceNumber', (req, res, next) => salesController.getPublicInvoice(req, res, next));
salesRouter.post('/public/order', (req, res, next) => salesController.createPublicOrder(req, res, next));

// Authenticated Routes
salesRouter.use(authenticateToken, requireTenant);

salesRouter.get('/', requirePermission(PERMISSIONS.SALE_VIEW), (req, res, next) => salesController.listSales(req, res, next));
salesRouter.post('/', requirePermission(PERMISSIONS.SALE_CREATE), idempotency(), (req, res, next) => salesController.createSale(req, res, next));
salesRouter.get('/:id', requirePermission(PERMISSIONS.SALE_VIEW), (req, res, next) => salesController.getSale(req, res, next));
salesRouter.get('/:id/invoice', requirePermission(PERMISSIONS.SALE_VIEW), (req, res, next) => salesController.getInvoice(req, res, next));
salesRouter.post('/:id/send-email', requirePermission(PERMISSIONS.SALE_VIEW), (req, res, next) => salesController.sendInvoiceEmail(req, res, next));
salesRouter.delete('/:id', (req, res, next) => salesController.deleteSale(req, res, next));

// Sales Returns Router
const salesReturnRouter = express.Router();
salesReturnRouter.use(authenticateToken, requireTenant);

salesReturnRouter.get('/', requirePermission(PERMISSIONS.SALE_VIEW), (req, res, next) => salesController.listReturns(req, res, next));
salesReturnRouter.post('/', requirePermission(PERMISSIONS.SALE_RETURN), idempotency(), (req, res, next) => salesController.createReturn(req, res, next));
salesReturnRouter.delete('/:id', (req, res, next) => salesController.deleteReturn(req, res, next));

// Customers Router
const customerRouter = express.Router();
customerRouter.use(authenticateToken, requireTenant);

customerRouter.get('/', requirePermission(PERMISSIONS.CUSTOMER_VIEW), (req, res, next) => customerController.listCustomers(req, res, next));
customerRouter.post('/', requirePermission(PERMISSIONS.CUSTOMER_MANAGE), (req, res, next) => customerController.createCustomer(req, res, next));
customerRouter.get('/:id', requirePermission(PERMISSIONS.CUSTOMER_VIEW), (req, res, next) => customerController.getCustomer(req, res, next));
customerRouter.put('/:id', requirePermission(PERMISSIONS.CUSTOMER_MANAGE), (req, res, next) => customerController.updateCustomer(req, res, next));
customerRouter.delete('/:id', requirePermission(PERMISSIONS.CUSTOMER_MANAGE), (req, res, next) => customerController.deleteCustomer(req, res, next));

module.exports = {
  salesRouter,
  salesReturnRouter,
  customerRouter
};
