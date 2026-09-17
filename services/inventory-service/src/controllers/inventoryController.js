const { ApiResponse } = require('@stockpilot/common');
const inventoryService = require('../services/inventoryService');

class InventoryController {
  async getStocks(req, res, next) {
    try {
      const { warehouseId, productId, lowStockOnly, outOfStockOnly, search, page = 1, limit = 50 } = req.query;
      const result = await inventoryService.getStocks(req.user.tenantId, {
        warehouseId: warehouseId ? parseInt(warehouseId, 10) : undefined,
        productId: productId ? parseInt(productId, 10) : undefined,
        lowStockOnly: lowStockOnly === 'true',
        outOfStockOnly: outOfStockOnly === 'true',
        search,
        page,
        limit
      });
      return ApiResponse.paginated(res, result.stocks, page, limit, result.total, 'Inventory stock retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getMovements(req, res, next) {
    try {
      const { productId, warehouseId, movementType, page = 1, limit = 50 } = req.query;
      const result = await inventoryService.getMovements(req.user.tenantId, {
        productId: productId ? parseInt(productId, 10) : undefined,
        warehouseId: warehouseId ? parseInt(warehouseId, 10) : undefined,
        movementType,
        page,
        limit
      });
      return ApiResponse.paginated(res, result.movements, page, limit, result.total, 'Stock movements retrieved');
    } catch (err) {
      next(err);
    }
  }

  async adjustStock(req, res, next) {
    try {
      const { productId, warehouseId, adjustmentType, quantity, reason } = req.body;
      const userName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email;
      const result = await inventoryService.adjustStock(req.user.tenantId, {
        productId,
        warehouseId,
        adjustmentType,
        quantity,
        reason,
        adjustedBy: userName
      });
      return ApiResponse.success(res, result, 'Stock adjusted successfully');
    } catch (err) {
      next(err);
    }
  }

  async checkAvailability(req, res, next) {
    try {
      const { items } = req.body;
      const tenantId = req.user ? req.user.tenantId : parseInt(req.headers['x-tenant-id'], 10);
      const result = await inventoryService.checkAvailability(tenantId, items);
      return ApiResponse.success(res, result, 'Stock availability checked');
    } catch (err) {
      next(err);
    }
  }

  async initStock(req, res, next) {
    try {
      const tenantId = req.user ? req.user.tenantId : parseInt(req.headers['x-tenant-id'], 10);
      const userName = req.user ? `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email : 'System';
      const result = await inventoryService.initStock(tenantId, {
        ...req.body,
        createdBy: req.body.createdBy || userName
      });
      return ApiResponse.success(res, result, 'Stock initialized successfully');
    } catch (err) {
      next(err);
    }
  }

  // Internal endpoints for inter-service sync
  async internalIncrease(req, res, next) {
    try {
      const tenantId = req.user ? req.user.tenantId : parseInt(req.headers['x-tenant-id'], 10);
      const result = await inventoryService.increaseStock(tenantId, req.body);
      return ApiResponse.success(res, result, 'Stock increased');
    } catch (err) {
      next(err);
    }
  }

  async internalDecrease(req, res, next) {
    try {
      const tenantId = req.user ? req.user.tenantId : parseInt(req.headers['x-tenant-id'], 10);
      const result = await inventoryService.decreaseStock(tenantId, req.body);
      return ApiResponse.success(res, result, 'Stock decreased');
    } catch (err) {
      next(err);
    }
  }

  async removeProductStock(req, res, next) {
    try {
      const tenantId = req.user ? req.user.tenantId : parseInt(req.headers['x-tenant-id'], 10);
      await inventoryService.removeProductStock(tenantId, parseInt(req.params.productId, 10));
      return ApiResponse.success(res, null, 'Stock record removed');
    } catch (err) {
      next(err);
    }
  }

  async deleteStock(req, res, next) {
    try {
      const tenantId = req.user ? req.user.tenantId : parseInt(req.headers['x-tenant-id'], 10);
      const result = await inventoryService.deleteStock(tenantId, parseInt(req.params.id, 10));
      return ApiResponse.success(res, result, 'Stock record deleted successfully');
    } catch (err) {
      next(err);
    }
  }

  async deleteMovement(req, res, next) {
    try {
      const tenantId = req.user ? req.user.tenantId : parseInt(req.headers['x-tenant-id'], 10);
      const result = await inventoryService.deleteMovement(tenantId, parseInt(req.params.id, 10));
      return ApiResponse.success(res, result, 'Movement log deleted successfully');
    } catch (err) {
      next(err);
    }
  }

  async getForecast(req, res, next) {
    try {
      const { days, warehouseId } = req.query;
      const result = await inventoryService.getForecast(req.user.tenantId, {
        days: days ? parseInt(days, 10) : 30,
        warehouseId: warehouseId ? parseInt(warehouseId, 10) : undefined
      });
      return ApiResponse.success(res, result, 'Stock demand forecast generated');
    } catch (err) {
      next(err);
    }
  }

  async createAuditLog(req, res, next) {
    try {
      const userName = req.user ? `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email : 'User';
      const log = await inventoryService.logAuditActivity({
        tenantId: req.user?.tenantId,
        userId: req.user?.userId,
        userName,
        module: req.body.module,
        action: req.body.action,
        entityId: req.body.entityId,
        details: req.body.details,
        ipAddress: req.ip
      });
      return ApiResponse.created(res, log, 'Audit log recorded');
    } catch (err) {
      next(err);
    }
  }

  async getAuditLogs(req, res, next) {
    try {
      const { module, action, search, page = 1, limit = 50 } = req.query;
      const result = await inventoryService.getAuditLogs(req.user?.tenantId, {
        module,
        action,
        search,
        page,
        limit
      });
      return ApiResponse.paginated(res, result.logs, page, limit, result.total, 'Audit logs retrieved');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new InventoryController();
