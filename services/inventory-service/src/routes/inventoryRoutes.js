const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const {
  authenticateToken,
  requireTenant,
  requirePermission,
  PERMISSIONS,
  idempotency
} = require('@stockpilot/common');

// Public/Tenant APIs
router.get('/', authenticateToken, requireTenant, requirePermission(PERMISSIONS.STOCK_VIEW), (req, res, next) => inventoryController.getStocks(req, res, next));
router.get('/stocks', authenticateToken, requireTenant, requirePermission(PERMISSIONS.STOCK_VIEW), (req, res, next) => inventoryController.getStocks(req, res, next));
router.get('/forecast', authenticateToken, requireTenant, requirePermission(PERMISSIONS.STOCK_VIEW), (req, res, next) => inventoryController.getForecast(req, res, next));
router.get('/audit-logs', authenticateToken, requireTenant, (req, res, next) => inventoryController.getAuditLogs(req, res, next));
router.post('/audit-logs', authenticateToken, requireTenant, (req, res, next) => inventoryController.createAuditLog(req, res, next));
router.get('/movements', authenticateToken, requireTenant, requirePermission(PERMISSIONS.STOCK_VIEW), (req, res, next) => inventoryController.getMovements(req, res, next));
router.delete('/movements/:id', authenticateToken, requireTenant, requirePermission(PERMISSIONS.STOCK_ADJUST), (req, res, next) => inventoryController.deleteMovement(req, res, next));
router.delete('/:id', authenticateToken, requireTenant, requirePermission(PERMISSIONS.STOCK_ADJUST), (req, res, next) => inventoryController.deleteStock(req, res, next));
router.post('/adjust', authenticateToken, requireTenant, requirePermission(PERMISSIONS.STOCK_ADJUST), idempotency(), (req, res, next) => inventoryController.adjustStock(req, res, next));
router.post('/init', authenticateToken, requireTenant, idempotency(), (req, res, next) => inventoryController.initStock(req, res, next));
router.post('/check-availability', authenticateToken, requireTenant, (req, res, next) => inventoryController.checkAvailability(req, res, next));

// Internal APIs (Accessible by other services)
router.post('/internal/check-stock', (req, res, next) => inventoryController.checkAvailability(req, res, next));
router.post('/internal/init-stock', idempotency(), (req, res, next) => inventoryController.initStock(req, res, next));
router.post('/internal/increase-stock', idempotency(), (req, res, next) => inventoryController.internalIncrease(req, res, next));
router.post('/internal/decrease-stock', idempotency(), (req, res, next) => inventoryController.internalDecrease(req, res, next));
router.delete('/internal/remove-product-stock/:productId', (req, res, next) => inventoryController.removeProductStock(req, res, next));
router.put('/internal/update-product-stock/:productId', (req, res, next) => inventoryController.updateProductStockInfo(req, res, next));

module.exports = router;
