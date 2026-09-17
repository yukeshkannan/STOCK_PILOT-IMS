const { ApiResponse } = require('@stockpilot/common');
const purchaseService = require('../services/purchaseService');

class PurchaseController {
  async listPurchases(req, res, next) {
    try {
      const { status, supplierId, page = 1, limit = 50 } = req.query;
      const result = await purchaseService.getPurchases(req.user.tenantId, {
        status,
        supplierId: supplierId ? parseInt(supplierId, 10) : undefined,
        page,
        limit
      });
      return ApiResponse.paginated(res, result.purchases, page, limit, result.total, 'Purchases retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getPurchase(req, res, next) {
    try {
      const purchase = await purchaseService.getPurchaseById(req.user.tenantId, req.params.id);
      return ApiResponse.success(res, purchase, 'Purchase order details');
    } catch (err) {
      next(err);
    }
  }

  async createPurchase(req, res, next) {
    try {
      const userName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email;
      const purchase = await purchaseService.createPurchase(req.user.tenantId, {
        ...req.body,
        createdBy: userName
      });
      return ApiResponse.created(res, purchase, 'Purchase order created');
    } catch (err) {
      next(err);
    }
  }

  async approvePurchase(req, res, next) {
    try {
      const userName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email;
      const purchase = await purchaseService.approvePurchase(req.user.tenantId, req.params.id, userName);
      return ApiResponse.success(res, purchase, 'Purchase approved and stock added to inventory');
    } catch (err) {
      next(err);
    }
  }

  async recordPayment(req, res, next) {
    try {
      const userName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email;
      const purchase = await purchaseService.recordPayment(req.user.tenantId, req.params.id, {
        ...req.body,
        paidBy: userName
      });
      return ApiResponse.success(res, purchase, 'Payment recorded successfully');
    } catch (err) {
      next(err);
    }
  }

  async cancelPurchase(req, res, next) {
    try {
      const purchase = await purchaseService.cancelPurchase(req.user.tenantId, req.params.id);
      return ApiResponse.success(res, purchase, 'Purchase cancelled');
    } catch (err) {
      next(err);
    }
  }

  async deletePurchase(req, res, next) {
    try {
      const result = await purchaseService.deletePurchase(req.user.tenantId, req.params.id);
      return ApiResponse.success(res, result, 'Purchase order deleted successfully');
    } catch (err) {
      next(err);
    }
  }

  // Returns
  async listReturns(req, res, next) {
    try {
      const returns = await purchaseService.getPurchaseReturns(req.user.tenantId);
      return ApiResponse.success(res, returns, 'Purchase returns retrieved');
    } catch (err) {
      next(err);
    }
  }

  async createReturn(req, res, next) {
    try {
      const userName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email;
      const pReturn = await purchaseService.createPurchaseReturn(req.user.tenantId, {
        ...req.body,
        createdBy: userName
      });
      return ApiResponse.created(res, pReturn, 'Purchase return request created and awaiting approval');
    } catch (err) {
      next(err);
    }
  }

  async approveReturn(req, res, next) {
    try {
      const userName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email;
      const pReturn = await purchaseService.approvePurchaseReturn(req.user.tenantId, req.params.id, userName);
      return ApiResponse.success(res, pReturn, 'Purchase return approved and inventory stock deducted successfully');
    } catch (err) {
      next(err);
    }
  }

  async rejectReturn(req, res, next) {
    try {
      const userName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email;
      const { rejectionReason } = req.body;
      const pReturn = await purchaseService.rejectPurchaseReturn(req.user.tenantId, req.params.id, userName, rejectionReason);
      return ApiResponse.success(res, pReturn, 'Purchase return declined and stock remains unaffected');
    } catch (err) {
      next(err);
    }
  }

  async deleteReturn(req, res, next) {
    try {
      const result = await purchaseService.deletePurchaseReturn(req.user.tenantId, req.params.id);
      return ApiResponse.success(res, result, 'Purchase return deleted successfully');
    } catch (err) {
      next(err);
    }
  }
}

class SupplierController {
  async listSuppliers(req, res, next) {
    try {
      const suppliers = await purchaseService.getSuppliers(req.user.tenantId);
      return ApiResponse.success(res, suppliers, 'Suppliers retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getSupplier(req, res, next) {
    try {
      const supplier = await purchaseService.getSupplierById(req.user.tenantId, req.params.id);
      return ApiResponse.success(res, supplier, 'Supplier details');
    } catch (err) {
      next(err);
    }
  }

  async createSupplier(req, res, next) {
    try {
      const supplier = await purchaseService.createSupplier(req.user.tenantId, req.body);
      return ApiResponse.created(res, supplier, 'Supplier created');
    } catch (err) {
      next(err);
    }
  }

  async updateSupplier(req, res, next) {
    try {
      const supplier = await purchaseService.updateSupplier(req.user.tenantId, req.params.id, req.body);
      return ApiResponse.success(res, supplier, 'Supplier updated');
    } catch (err) {
      next(err);
    }
  }

  async deleteSupplier(req, res, next) {
    try {
      await purchaseService.deleteSupplier(req.user.tenantId, req.params.id);
      return ApiResponse.success(res, null, 'Supplier deleted');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = {
  purchaseController: new PurchaseController(),
  supplierController: new SupplierController()
};
