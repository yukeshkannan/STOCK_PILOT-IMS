const { ApiResponse } = require('@stockpilot/common');
const warehouseService = require('../services/warehouseService');

class WarehouseController {
  async listWarehouses(req, res, next) {
    try {
      const warehouses = await warehouseService.getWarehouses(req.user.tenantId);
      return ApiResponse.success(res, warehouses, 'Warehouses retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getWarehouse(req, res, next) {
    try {
      const warehouse = await warehouseService.getWarehouseById(req.user.tenantId, req.params.id);
      return ApiResponse.success(res, warehouse, 'Warehouse details');
    } catch (err) {
      next(err);
    }
  }

  async createWarehouse(req, res, next) {
    try {
      const warehouse = await warehouseService.createWarehouse(req.user.tenantId, req.body, req.user?.plan);
      return ApiResponse.created(res, warehouse, 'Warehouse created successfully');
    } catch (err) {
      next(err);
    }
  }

  async updateWarehouse(req, res, next) {
    try {
      const warehouse = await warehouseService.updateWarehouse(req.user.tenantId, req.params.id, req.body);
      return ApiResponse.success(res, warehouse, 'Warehouse updated successfully');
    } catch (err) {
      next(err);
    }
  }

  async deleteWarehouse(req, res, next) {
    try {
      await warehouseService.deleteWarehouse(req.user.tenantId, req.params.id);
      return ApiResponse.success(res, null, 'Warehouse deleted successfully');
    } catch (err) {
      next(err);
    }
  }

  async initDefaultWarehouse(req, res, next) {
    try {
      const { tenantId, companyName, address, city } = req.body;
      const warehouse = await warehouseService.initDefaultWarehouse({ tenantId, companyName, address, city });
      return ApiResponse.created(res, warehouse, 'Default warehouse initialized');
    } catch (err) {
      next(err);
    }
  }
}


class TransferController {
  async listTransfers(req, res, next) {
    try {
      const { status, page = 1, limit = 50 } = req.query;
      const result = await warehouseService.getTransfers(req.user.tenantId, { status, page, limit });
      return ApiResponse.paginated(res, result.transfers, page, limit, result.total, 'Transfers retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getTransfer(req, res, next) {
    try {
      const transfer = await warehouseService.getTransferById(req.user.tenantId, req.params.id);
      return ApiResponse.success(res, transfer, 'Transfer details');
    } catch (err) {
      next(err);
    }
  }

  async createTransfer(req, res, next) {
    try {
      const userName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email;
      const transfer = await warehouseService.createTransfer(req.user.tenantId, {
        ...req.body,
        requestedBy: userName
      });
      return ApiResponse.created(res, transfer, 'Stock transfer request created');
    } catch (err) {
      next(err);
    }
  }

  async approveTransfer(req, res, next) {
    try {
      const userName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email;
      const transfer = await warehouseService.approveTransfer(req.user.tenantId, req.params.id, userName);
      return ApiResponse.success(res, transfer, 'Stock transfer approved');
    } catch (err) {
      next(err);
    }
  }

  async dispatchTransfer(req, res, next) {
    try {
      const userName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email;
      const transfer = await warehouseService.dispatchTransfer(req.user.tenantId, req.params.id, {
        ...req.body,
        dispatchedBy: userName
      });
      return ApiResponse.success(res, transfer, 'Stock transfer dispatched and in transit');
    } catch (err) {
      next(err);
    }
  }

  async receiveTransfer(req, res, next) {
    try {
      const userName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email;
      const transfer = await warehouseService.receiveTransfer(req.user.tenantId, req.params.id, {
        ...req.body,
        receivedBy: userName
      });
      return ApiResponse.success(res, transfer, 'Stock transfer received and added to destination warehouse');
    } catch (err) {
      next(err);
    }
  }

  async completeTransfer(req, res, next) {
    try {
      const userName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email;
      const transfer = await warehouseService.completeTransfer(req.user.tenantId, req.params.id, {
        ...req.body,
        receivedBy: userName
      });
      return ApiResponse.success(res, transfer, 'Stock transfer completed and inventory updated');
    } catch (err) {
      next(err);
    }
  }

  async rejectTransfer(req, res, next) {
    try {
      const transfer = await warehouseService.rejectTransfer(req.user.tenantId, req.params.id);
      return ApiResponse.success(res, transfer, 'Stock transfer rejected');
    } catch (err) {
      next(err);
    }
  }

  async deleteTransfer(req, res, next) {
    try {
      await warehouseService.deleteTransfer(req.user.tenantId, req.params.id);
      return ApiResponse.success(res, null, 'Stock transfer record deleted successfully');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = {
  warehouseController: new WarehouseController(),
  transferController: new TransferController()
};
