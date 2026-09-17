const express = require('express');
const { warehouseController, transferController } = require('../controllers/warehouseController');
const {
  authenticateToken,
  requireTenant,
  requirePermission,
  PERMISSIONS
} = require('@stockpilot/common');

// Warehouses Router
const warehouseRouter = express.Router();
warehouseRouter.post('/internal/init-default', (req, res, next) => warehouseController.initDefaultWarehouse(req, res, next));
warehouseRouter.use(authenticateToken, requireTenant);


warehouseRouter.get('/', requirePermission(PERMISSIONS.WAREHOUSE_VIEW), (req, res, next) => warehouseController.listWarehouses(req, res, next));
warehouseRouter.post('/', requirePermission(PERMISSIONS.WAREHOUSE_MANAGE), (req, res, next) => warehouseController.createWarehouse(req, res, next));
warehouseRouter.get('/:id', requirePermission(PERMISSIONS.WAREHOUSE_VIEW), (req, res, next) => warehouseController.getWarehouse(req, res, next));
warehouseRouter.put('/:id', requirePermission(PERMISSIONS.WAREHOUSE_MANAGE), (req, res, next) => warehouseController.updateWarehouse(req, res, next));
warehouseRouter.delete('/:id', requirePermission(PERMISSIONS.WAREHOUSE_MANAGE), (req, res, next) => warehouseController.deleteWarehouse(req, res, next));

// Transfers Router
const transferRouter = express.Router();
transferRouter.use(authenticateToken, requireTenant);

transferRouter.get('/', requirePermission(PERMISSIONS.STOCK_TRANSFER), (req, res, next) => transferController.listTransfers(req, res, next));
transferRouter.post('/', requirePermission(PERMISSIONS.STOCK_TRANSFER), (req, res, next) => transferController.createTransfer(req, res, next));
transferRouter.get('/:id', requirePermission(PERMISSIONS.STOCK_TRANSFER), (req, res, next) => transferController.getTransfer(req, res, next));
transferRouter.patch('/:id/approve', requirePermission(PERMISSIONS.TRANSFER_APPROVE), (req, res, next) => transferController.approveTransfer(req, res, next));
transferRouter.patch('/:id/dispatch', requirePermission(PERMISSIONS.STOCK_TRANSFER), (req, res, next) => transferController.dispatchTransfer(req, res, next));
transferRouter.patch('/:id/receive', requirePermission(PERMISSIONS.STOCK_TRANSFER), (req, res, next) => transferController.receiveTransfer(req, res, next));
transferRouter.patch('/:id/complete', requirePermission(PERMISSIONS.TRANSFER_APPROVE), (req, res, next) => transferController.completeTransfer(req, res, next));
transferRouter.patch('/:id/reject', requirePermission(PERMISSIONS.TRANSFER_APPROVE), (req, res, next) => transferController.rejectTransfer(req, res, next));
transferRouter.delete('/:id', requirePermission(PERMISSIONS.STOCK_TRANSFER), (req, res, next) => transferController.deleteTransfer(req, res, next));

module.exports = {
  warehouseRouter,
  transferRouter
};
