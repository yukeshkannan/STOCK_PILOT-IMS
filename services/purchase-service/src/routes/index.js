const express = require('express');
const { purchaseController, supplierController } = require('../controllers/purchaseController');
const {
  authenticateToken,
  requireTenant,
  requirePermission,
  PERMISSIONS
} = require('@stockpilot/common');

// Purchases Router
const purchaseRouter = express.Router();
purchaseRouter.use(authenticateToken, requireTenant);

purchaseRouter.get('/', requirePermission(PERMISSIONS.PURCHASE_VIEW), (req, res, next) => purchaseController.listPurchases(req, res, next));
purchaseRouter.post('/', requirePermission(PERMISSIONS.PURCHASE_CREATE), (req, res, next) => purchaseController.createPurchase(req, res, next));
purchaseRouter.get('/:id', requirePermission(PERMISSIONS.PURCHASE_VIEW), (req, res, next) => purchaseController.getPurchase(req, res, next));
purchaseRouter.patch('/:id/approve', requirePermission(PERMISSIONS.PURCHASE_APPROVE), (req, res, next) => purchaseController.approvePurchase(req, res, next));
purchaseRouter.post('/:id/payments', requirePermission(PERMISSIONS.PURCHASE_CREATE), (req, res, next) => purchaseController.recordPayment(req, res, next));
purchaseRouter.delete('/:id', requirePermission(PERMISSIONS.PURCHASE_CREATE), (req, res, next) => purchaseController.deletePurchase(req, res, next));
purchaseRouter.patch('/:id/cancel', requirePermission(PERMISSIONS.PURCHASE_CANCEL), (req, res, next) => purchaseController.cancelPurchase(req, res, next));

// Purchase Returns Router
const purchaseReturnRouter = express.Router();
purchaseReturnRouter.use(authenticateToken, requireTenant);

purchaseReturnRouter.get('/', requirePermission(PERMISSIONS.PURCHASE_VIEW), (req, res, next) => purchaseController.listReturns(req, res, next));
purchaseReturnRouter.post('/', requirePermission(PERMISSIONS.PURCHASE_RETURN), (req, res, next) => purchaseController.createReturn(req, res, next));
purchaseReturnRouter.patch('/:id/approve', requirePermission(PERMISSIONS.PURCHASE_APPROVE), (req, res, next) => purchaseController.approveReturn(req, res, next));
purchaseReturnRouter.patch('/:id/reject', requirePermission(PERMISSIONS.PURCHASE_APPROVE), (req, res, next) => purchaseController.rejectReturn(req, res, next));
purchaseReturnRouter.delete('/:id', requirePermission(PERMISSIONS.PURCHASE_RETURN), (req, res, next) => purchaseController.deleteReturn(req, res, next));

// Suppliers Router
const supplierRouter = express.Router();
supplierRouter.use(authenticateToken, requireTenant);

supplierRouter.get('/', requirePermission(PERMISSIONS.SUPPLIER_VIEW), (req, res, next) => supplierController.listSuppliers(req, res, next));
supplierRouter.post('/', requirePermission(PERMISSIONS.SUPPLIER_MANAGE), (req, res, next) => supplierController.createSupplier(req, res, next));
supplierRouter.get('/:id', requirePermission(PERMISSIONS.SUPPLIER_VIEW), (req, res, next) => supplierController.getSupplier(req, res, next));
supplierRouter.put('/:id', requirePermission(PERMISSIONS.SUPPLIER_MANAGE), (req, res, next) => supplierController.updateSupplier(req, res, next));
supplierRouter.delete('/:id', requirePermission(PERMISSIONS.SUPPLIER_MANAGE), (req, res, next) => supplierController.deleteSupplier(req, res, next));

module.exports = {
  purchaseRouter,
  purchaseReturnRouter,
  supplierRouter
};
