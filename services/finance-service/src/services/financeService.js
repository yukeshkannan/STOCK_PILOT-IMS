const { Payment, Expense, sequelize } = require('../models');
const { PAYMENT_METHODS, EXPENSE_CATEGORIES, eventBus, EVENTS } = require('@stockpilot/common');

class FinanceService {
  // Payments
  async getPayments(tenantId, { type, paymentMethod, page = 1, limit = 50 }) {
    const where = { tenant_id: tenantId };
    if (type) where.type = type;
    if (paymentMethod) where.payment_method = paymentMethod;

    const offset = (page - 1) * limit;
    const { rows, count } = await Payment.findAndCountAll({
      where,
      order: [['payment_date', 'DESC'], ['created_at', 'DESC']],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    });

    return { payments: rows, total: count };
  }

  async createPayment(tenantId, data) {
    const paymentCount = await Payment.count({ where: { tenant_id: tenantId } });
    const paymentNumber = `PAY-${new Date().getFullYear()}-${String(paymentCount + 1).padStart(4, '0')}`;

    const payment = await Payment.create({
      tenant_id: tenantId,
      payment_number: paymentNumber,
      type: data.type || 'RECEIPT',
      reference_type: data.referenceType || 'MANUAL',
      reference_id: data.referenceId ? String(data.referenceId) : null,
      party_name: data.partyName || 'Customer / Vendor',
      payment_method: data.paymentMethod || PAYMENT_METHODS.CASH,
      amount: parseFloat(data.amount) || 0,
      payment_date: data.paymentDate || new Date(),
      notes: data.notes || '',
      created_by: data.createdBy || 'Admin'
    });

    await eventBus.publish(EVENTS.PAYMENT_RECEIVED, {
      tenantId,
      paymentId: payment.id,
      paymentNumber,
      amount: payment.amount,
      type: payment.type,
      partyName: payment.party_name
    });

    return payment;
  }

  // Expenses
  async getExpenses(tenantId, { category, page = 1, limit = 50 }) {
    const where = { tenant_id: tenantId };
    if (category) where.category = category;

    const offset = (page - 1) * limit;
    const { rows, count } = await Expense.findAndCountAll({
      where,
      order: [['expense_date', 'DESC'], ['created_at', 'DESC']],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    });

    return { expenses: rows, total: count };
  }

  async createExpense(tenantId, data) {
    const expCount = await Expense.count({ where: { tenant_id: tenantId } });
    const expenseNumber = `EXP-${new Date().getFullYear()}-${String(expCount + 1).padStart(4, '0')}`;

    const expense = await Expense.create({
      tenant_id: tenantId,
      expense_number: expenseNumber,
      category: data.category || 'OTHER',
      title: data.title,
      amount: parseFloat(data.amount) || 0,
      payment_method: data.paymentMethod || PAYMENT_METHODS.CASH,
      expense_date: data.expenseDate || new Date(),
      recipient: data.recipient || '',
      notes: data.notes || '',
      created_by: data.createdBy || 'Admin'
    });

    await eventBus.publish(EVENTS.EXPENSE_CREATED, {
      tenantId,
      expenseId: expense.id,
      expenseNumber,
      title: expense.title,
      category: expense.category,
      amount: expense.amount
    });

    return expense;
  }

  async updateExpense(tenantId, id, data) {
    const expense = await Expense.findOne({ where: { id, tenant_id: tenantId } });
    if (!expense) throw { statusCode: 404, message: 'Expense not found' };
    await expense.update(data);
    return expense;
  }

  async deleteExpense(tenantId, id) {
    const expense = await Expense.findOne({ where: { id, tenant_id: tenantId } });
    if (!expense) throw { statusCode: 404, message: 'Expense not found' };
    await expense.destroy();
    return true;
  }
}

module.exports = new FinanceService();
