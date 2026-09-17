const { ApiResponse } = require('@stockpilot/common');
const financeService = require('../services/financeService');
const reportService = require('../services/reportService');

class FinanceController {
  // Payments
  async listPayments(req, res, next) {
    try {
      const { type, paymentMethod, page = 1, limit = 50 } = req.query;
      const result = await financeService.getPayments(req.user.tenantId, { type, paymentMethod, page, limit });
      return ApiResponse.paginated(res, result.payments, page, limit, result.total, 'Payments retrieved');
    } catch (err) {
      next(err);
    }
  }

  async createPayment(req, res, next) {
    try {
      const userName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email;
      const payment = await financeService.createPayment(req.user.tenantId, {
        ...req.body,
        createdBy: userName
      });
      return ApiResponse.created(res, payment, 'Payment record created');
    } catch (err) {
      next(err);
    }
  }

  // Expenses
  async listExpenses(req, res, next) {
    try {
      const { category, page = 1, limit = 50 } = req.query;
      const result = await financeService.getExpenses(req.user.tenantId, { category, page, limit });
      return ApiResponse.paginated(res, result.expenses, page, limit, result.total, 'Expenses retrieved');
    } catch (err) {
      next(err);
    }
  }

  async createExpense(req, res, next) {
    try {
      const userName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email;
      const expense = await financeService.createExpense(req.user.tenantId, {
        ...req.body,
        createdBy: userName
      });
      return ApiResponse.created(res, expense, 'Expense recorded');
    } catch (err) {
      next(err);
    }
  }

  async updateExpense(req, res, next) {
    try {
      const expense = await financeService.updateExpense(req.user.tenantId, req.params.id, req.body);
      return ApiResponse.success(res, expense, 'Expense updated');
    } catch (err) {
      next(err);
    }
  }

  async deleteExpense(req, res, next) {
    try {
      await financeService.deleteExpense(req.user.tenantId, req.params.id);
      return ApiResponse.success(res, null, 'Expense deleted');
    } catch (err) {
      next(err);
    }
  }
}

class ReportController {
  async getDashboard(req, res, next) {
    try {
      const summary = await reportService.getDashboardSummary(req.user.tenantId);
      return ApiResponse.success(res, summary, 'Dashboard reports retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getSalesTrends(req, res, next) {
    try {
      const trends = await reportService.getSalesTrends(req.user.tenantId, req.query.period);
      return ApiResponse.success(res, trends, 'Sales trends retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getExpenseBreakdown(req, res, next) {
    try {
      const breakdown = await reportService.getExpenseBreakdown(req.user.tenantId);
      return ApiResponse.success(res, breakdown, 'Expense breakdown retrieved');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = {
  financeController: new FinanceController(),
  reportController: new ReportController()
};
