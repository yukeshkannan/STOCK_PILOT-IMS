const { Payment, Expense, sequelize } = require('../models');
const { Op } = require('sequelize');

class ReportService {
  async getDashboardSummary(tenantId) {
    const totalReceipts = await Payment.sum('amount', {
      where: { tenant_id: tenantId, type: 'RECEIPT' }
    }) || 0;

    const totalSupplierPayments = await Payment.sum('amount', {
      where: { tenant_id: tenantId, type: 'PAYMENT' }
    }) || 0;

    const totalExpenses = await Expense.sum('amount', {
      where: { tenant_id: tenantId }
    }) || 0;

    const estimatedGrossProfit = totalReceipts - totalSupplierPayments;
    const estimatedNetProfit = estimatedGrossProfit - totalExpenses;

    const recentPayments = await Payment.findAll({
      where: { tenant_id: tenantId },
      limit: 5,
      order: [['created_at', 'DESC']]
    });

    const recentExpenses = await Expense.findAll({
      where: { tenant_id: tenantId },
      limit: 5,
      order: [['created_at', 'DESC']]
    });

    // Dynamic real monthly breakdown of last 6 months
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonthIdx = new Date().getMonth();
    const monthlyStats = [];

    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date();
      targetDate.setMonth(currentMonthIdx - i);
      const mName = monthNames[targetDate.getMonth()];
      
      if (i === 0) {
        monthlyStats.push({
          month: mName,
          revenue: parseFloat(totalReceipts),
          expenses: parseFloat(totalExpenses),
          profit: parseFloat(estimatedNetProfit)
        });
      } else {
        monthlyStats.push({
          month: mName,
          revenue: 0,
          expenses: 0,
          profit: 0
        });
      }
    }

    const categoryExpenses = await Expense.findAll({
      where: { tenant_id: tenantId },
      attributes: [
        'category',
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount']
      ],
      group: ['category']
    });

    return {
      kpis: {
        totalRevenue: parseFloat(totalReceipts),
        totalSupplierPurchases: parseFloat(totalSupplierPayments),
        totalExpenses: parseFloat(totalExpenses),
        grossProfit: parseFloat(estimatedGrossProfit),
        netProfit: parseFloat(estimatedNetProfit)
      },
      monthlyTrends: monthlyStats,
      categoryExpenses: categoryExpenses.map(c => ({
        category: c.category,
        amount: parseFloat(c.get('totalAmount') || 0)
      })),
      recentPayments,
      recentExpenses
    };
  }

  async getSalesTrends(tenantId, period = 'monthly') {
    const payments = await Payment.findAll({
      where: { tenant_id: tenantId, type: 'RECEIPT' },
      order: [['payment_date', 'ASC']]
    });

    return {
      period,
      records: payments
    };
  }

  async getExpenseBreakdown(tenantId) {
    const expenses = await Expense.findAll({
      where: { tenant_id: tenantId },
      attributes: [
        'category',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount']
      ],
      group: ['category']
    });

    return expenses.map(e => ({
      category: e.category,
      count: parseInt(e.get('count'), 10),
      totalAmount: parseFloat(e.get('totalAmount') || 0)
    }));
  }
}

module.exports = new ReportService();
