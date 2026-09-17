const express = require('express');
const { financeController, reportController } = require('../controllers/financeController');
const {
  authenticateToken,
  requireTenant,
  requirePermission,
  PERMISSIONS
} = require('@stockpilot/common');

// Payments Router
const paymentRouter = express.Router();
paymentRouter.use(authenticateToken, requireTenant);

paymentRouter.get('/', requirePermission(PERMISSIONS.PAYMENT_VIEW), (req, res, next) => financeController.listPayments(req, res, next));
paymentRouter.post('/', requirePermission(PERMISSIONS.PAYMENT_CREATE), (req, res, next) => financeController.createPayment(req, res, next));

// Expenses Router
const expenseRouter = express.Router();
expenseRouter.use(authenticateToken, requireTenant);

expenseRouter.get('/', requirePermission(PERMISSIONS.EXPENSE_VIEW), (req, res, next) => financeController.listExpenses(req, res, next));
expenseRouter.post('/', requirePermission(PERMISSIONS.EXPENSE_MANAGE), (req, res, next) => financeController.createExpense(req, res, next));
expenseRouter.put('/:id', requirePermission(PERMISSIONS.EXPENSE_MANAGE), (req, res, next) => financeController.updateExpense(req, res, next));
expenseRouter.delete('/:id', requirePermission(PERMISSIONS.EXPENSE_MANAGE), (req, res, next) => financeController.deleteExpense(req, res, next));

// Reports Router
const reportRouter = express.Router();
reportRouter.use(authenticateToken, requireTenant);

reportRouter.get('/dashboard', requirePermission(PERMISSIONS.REPORT_VIEW), (req, res, next) => reportController.getDashboard(req, res, next));
reportRouter.get('/sales/trends', requirePermission(PERMISSIONS.REPORT_VIEW), (req, res, next) => reportController.getSalesTrends(req, res, next));
reportRouter.get('/expenses/breakdown', requirePermission(PERMISSIONS.REPORT_VIEW), (req, res, next) => reportController.getExpenseBreakdown(req, res, next));

module.exports = {
  paymentRouter,
  expenseRouter,
  reportRouter
};
