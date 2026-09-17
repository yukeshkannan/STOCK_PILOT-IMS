const { ApiResponse } = require('@stockpilot/common');
const salesService = require('../services/salesService');

class SalesController {
  async listSales(req, res, next) {
    try {
      const { status, customerId, page = 1, limit = 50 } = req.query;
      const result = await salesService.getSales(req.user.tenantId, {
        status,
        customerId: customerId ? parseInt(customerId, 10) : undefined,
        page,
        limit
      });
      return ApiResponse.paginated(res, result.sales, page, limit, result.total, 'Sales retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getSale(req, res, next) {
    try {
      const sale = await salesService.getSaleById(req.user.tenantId, req.params.id);
      return ApiResponse.success(res, sale, 'Sale details');
    } catch (err) {
      next(err);
    }
  }

  async createSale(req, res, next) {
    try {
      const userName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email;
      const sale = await salesService.createSale(req.user.tenantId, {
        ...req.body,
        createdBy: userName
      });
      return ApiResponse.created(res, sale, 'Sale completed and invoice generated');
    } catch (err) {
      next(err);
    }
  }

  async getInvoice(req, res, next) {
    try {
      const sale = await salesService.getSaleById(req.user.tenantId, req.params.id);
      return ApiResponse.success(res, sale, 'Invoice retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getPublicInvoice(req, res, next) {
    try {
      const { invoiceNumber } = req.params;
      const sale = await salesService.getPublicInvoice(invoiceNumber);
      return ApiResponse.success(res, sale, 'Public e-bill retrieved');
    } catch (err) {
      next(err);
    }
  }

  async sendInvoiceEmail(req, res, next) {
    try {
      const result = await salesService.sendInvoiceEmail(req.user.tenantId, req.params.id, {
        recipientEmail: req.body.recipientEmail,
        recipientName: req.body.recipientName,
        note: req.body.note,
        user: req.user
      });
      return ApiResponse.success(res, result, 'Invoice email dispatched successfully');
    } catch (err) {
      next(err);
    }
  }

  async deleteSale(req, res, next) {
    try {
      await salesService.deleteSale(req.user.tenantId, req.params.id);
      return ApiResponse.success(res, null, 'Sale invoice deleted and inventory restocked successfully');
    } catch (err) {
      next(err);
    }
  }

  // Returns
  async listReturns(req, res, next) {
    try {
      const returns = await salesService.getSaleReturns(req.user.tenantId);
      return ApiResponse.success(res, returns, 'Sales returns retrieved');
    } catch (err) {
      next(err);
    }
  }

  async createReturn(req, res, next) {
    try {
      const userName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email;
      const sReturn = await salesService.createSaleReturn(req.user.tenantId, {
        ...req.body,
        createdBy: userName
      });
      return ApiResponse.created(res, sReturn, 'Sales return processed');
    } catch (err) {
      next(err);
    }
  }

  async deleteReturn(req, res, next) {
    try {
      await salesService.deleteSaleReturn(req.user.tenantId, req.params.id);
      return ApiResponse.success(res, null, 'Sales return deleted successfully');
    } catch (err) {
      next(err);
    }
  }
}

class CustomerController {
  async listCustomers(req, res, next) {
    try {
      const customers = await salesService.getCustomers(req.user.tenantId);
      return ApiResponse.success(res, customers, 'Customers retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getCustomer(req, res, next) {
    try {
      const customer = await salesService.getCustomerById(req.user.tenantId, req.params.id);
      return ApiResponse.success(res, customer, 'Customer details');
    } catch (err) {
      next(err);
    }
  }

  async createCustomer(req, res, next) {
    try {
      const customer = await salesService.createCustomer(req.user.tenantId, req.body);
      return ApiResponse.created(res, customer, 'Customer created');
    } catch (err) {
      next(err);
    }
  }

  async updateCustomer(req, res, next) {
    try {
      const customer = await salesService.updateCustomer(req.user.tenantId, req.params.id, req.body);
      return ApiResponse.success(res, customer, 'Customer updated');
    } catch (err) {
      next(err);
    }
  }

  async deleteCustomer(req, res, next) {
    try {
      await salesService.deleteCustomer(req.user.tenantId, req.params.id);
      return ApiResponse.success(res, null, 'Customer deleted');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = {
  salesController: new SalesController(),
  customerController: new CustomerController()
};
