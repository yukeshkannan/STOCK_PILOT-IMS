const { createDatabaseConnection } = require('@stockpilot/common');
const { Op } = require('sequelize');

// Helper DB Connections for Multi-Tenant Querying
const inventorySequelize = createDatabaseConnection('inventory_db');
const productSequelize = createDatabaseConnection('product_db');
const salesSequelize = createDatabaseConnection('sales_db');
const financeSequelize = createDatabaseConnection('finance_db');
const tenantSequelize = createDatabaseConnection('tenant_db');
const warehouseSequelize = createDatabaseConnection('warehouse_db');

/**
 * 0. Warehouse Overview & Count Tool
 */
async function getWarehouses(tenantId, { status = 'ALL', search = '' } = {}) {
  try {
    let whereClause = 'WHERE tenant_id = :tenantId';
    if (status && status !== 'ALL') {
      whereClause += ` AND status = :status`;
    }
    if (search) {
      whereClause += ` AND (name LIKE :search OR code LIKE :search OR city LIKE :search)`;
    }

    const warehouses = await warehouseSequelize.query(
      `SELECT id, name, code, city, address, manager_name, phone, capacity, capacity_unit, is_default, status
       FROM warehouses
       ${whereClause}
       ORDER BY id ASC`,
      {
        replacements: { tenantId, status, search: `%${search}%` },
        type: warehouseSequelize.QueryTypes.SELECT
      }
    );

    const [stats] = await warehouseSequelize.query(
      `SELECT 
        COUNT(*) as total_warehouses,
        SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as active_warehouses,
        SUM(CASE WHEN status = 'INACTIVE' THEN 1 ELSE 0 END) as inactive_warehouses
       FROM warehouses WHERE tenant_id = :tenantId`,
      { replacements: { tenantId }, type: warehouseSequelize.QueryTypes.SELECT }
    );

    return {
      success: true,
      totalCount: Number(stats?.total_warehouses || 0),
      activeCount: Number(stats?.active_warehouses || 0),
      inactiveCount: Number(stats?.inactive_warehouses || 0),
      warehouses: warehouses.map(w => ({
        id: w.id,
        name: w.name,
        code: w.code,
        city: w.city || 'N/A',
        manager: w.manager_name || 'N/A',
        phone: w.phone || 'N/A',
        capacity: `${w.capacity} ${w.capacity_unit || 'Sq. Ft'}`,
        isDefault: Boolean(w.is_default),
        status: w.status
      }))
    };
  } catch (error) {
    console.error('[Copilot Tool getWarehouses Error]:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * 1. Stock & Inventory Tool
 */
async function getStockOverview(tenantId, { lowStockOnly = false, search = '', limit = 15 } = {}) {
  try {
    const whereClause = { tenant_id: tenantId };
    if (lowStockOnly) {
      whereClause.current_stock = { [Op.lte]: inventorySequelize.col('minimum_stock') };
    }
    if (search) {
      whereClause[Op.or] = [
        { product_name: { [Op.like]: `%${search}%` } },
        { product_code: { [Op.like]: `%${search}%` } }
      ];
    }

    const stocks = await inventorySequelize.query(
      `SELECT product_code, product_name, warehouse_name, current_stock, minimum_stock, available_stock, reserved_stock
       FROM stocks 
       WHERE tenant_id = :tenantId
       ${lowStockOnly ? 'AND current_stock <= minimum_stock' : ''}
       ${search ? 'AND (product_name LIKE :search OR product_code LIKE :search)' : ''}
       ORDER BY current_stock ASC 
       LIMIT :limit`,
      {
        replacements: { tenantId, search: `%${search}%`, limit: Number(limit) || 15 },
        type: inventorySequelize.QueryTypes.SELECT
      }
    );

    // Summary counts
    const [stats] = await inventorySequelize.query(
      `SELECT 
        COUNT(*) as total_items,
        SUM(CASE WHEN current_stock <= minimum_stock AND current_stock > 0 THEN 1 ELSE 0 END) as low_stock_count,
        SUM(CASE WHEN current_stock <= 0 THEN 1 ELSE 0 END) as out_of_stock_count,
        SUM(current_stock) as total_units
       FROM stocks WHERE tenant_id = :tenantId`,
      { replacements: { tenantId }, type: inventorySequelize.QueryTypes.SELECT }
    );

    return {
      success: true,
      stats: {
        totalItems: Number(stats?.total_items || 0),
        lowStockCount: Number(stats?.low_stock_count || 0),
        outOfStockCount: Number(stats?.out_of_stock_count || 0),
        totalUnits: Number(stats?.total_units || 0)
      },
      items: stocks.map(s => ({
        code: s.product_code,
        name: s.product_name,
        warehouse: s.warehouse_name,
        currentStock: s.current_stock,
        minStock: s.minimum_stock,
        isLowStock: s.current_stock <= s.minimum_stock,
        isOutOfStock: s.current_stock <= 0
      }))
    };
  } catch (error) {
    console.error('[Copilot Tool getStockOverview Error]:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * 2. Sales & Revenue Analytics Tool
 */
async function getSalesSummary(tenantId, { period = 'today' } = {}) {
  try {
    let dateFilter = `AND DATE(sale_date) = DATE('now')`;
    if (period === 'yesterday') {
      dateFilter = `AND DATE(sale_date) = DATE('now', '-1 day')`;
    } else if (period === 'this_week' || period === 'week') {
      dateFilter = `AND DATE(sale_date) >= DATE('now', '-7 days')`;
    } else if (period === 'this_month' || period === 'month') {
      dateFilter = `AND DATE(sale_date) >= DATE('now', 'start of month')`;
    } else if (period === 'all') {
      dateFilter = '';
    }

    const [salesStats] = await salesSequelize.query(
      `SELECT 
        COUNT(*) as total_sales_count,
        COALESCE(SUM(grand_total), 0) as total_revenue,
        COALESCE(SUM(paid_amount), 0) as total_collected,
        COALESCE(SUM(due_amount), 0) as pending_receivables,
        COALESCE(AVG(grand_total), 0) as average_ticket_size
       FROM sales 
       WHERE tenant_id = :tenantId AND status = 'COMPLETED' ${dateFilter}`,
      { replacements: { tenantId }, type: salesSequelize.QueryTypes.SELECT }
    );

    // Recent top sales
    const recentSales = await salesSequelize.query(
      `SELECT invoice_number, customer_name, grand_total, payment_method, payment_status, sale_date
       FROM sales 
       WHERE tenant_id = :tenantId AND status = 'COMPLETED' ${dateFilter}
       ORDER BY id DESC LIMIT 5`,
      { replacements: { tenantId }, type: salesSequelize.QueryTypes.SELECT }
    );

    return {
      success: true,
      period,
      summary: {
        totalOrders: Number(salesStats?.total_sales_count || 0),
        totalRevenue: Number(salesStats?.total_revenue || 0).toFixed(2),
        totalCollected: Number(salesStats?.total_collected || 0).toFixed(2),
        pendingReceivables: Number(salesStats?.pending_receivables || 0).toFixed(2),
        avgOrderValue: Number(salesStats?.average_ticket_size || 0).toFixed(2)
      },
      recentOrders: recentSales
    };
  } catch (error) {
    console.error('[Copilot Tool getSalesSummary Error]:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * 3. Financial & Expenses Snapshot Tool
 */
async function getFinancialSnapshot(tenantId) {
  try {
    const [expenseStats] = await financeSequelize.query(
      `SELECT 
        COUNT(*) as expense_count,
        COALESCE(SUM(amount), 0) as total_expenses
       FROM expenses 
       WHERE tenant_id = :tenantId AND DATE(expense_date) >= DATE('now', 'start of month')`,
      { replacements: { tenantId }, type: financeSequelize.QueryTypes.SELECT }
    );

    const [paymentStats] = await financeSequelize.query(
      `SELECT 
        COALESCE(SUM(CASE WHEN type = 'RECEIPT' THEN amount ELSE 0 END), 0) as total_receipts,
        COALESCE(SUM(CASE WHEN type = 'PAYMENT' THEN amount ELSE 0 END), 0) as total_payouts
       FROM payments 
       WHERE tenant_id = :tenantId AND DATE(payment_date) >= DATE('now', 'start of month')`,
      { replacements: { tenantId }, type: financeSequelize.QueryTypes.SELECT }
    );

    return {
      success: true,
      monthToDate: {
        totalReceiptsCollected: Number(paymentStats?.total_receipts || 0).toFixed(2),
        totalPayouts: Number(paymentStats?.total_payouts || 0).toFixed(2),
        totalExpenses: Number(expenseStats?.total_expenses || 0).toFixed(2),
        netCashflow: (Number(paymentStats?.total_receipts || 0) - Number(expenseStats?.total_expenses || 0) - Number(paymentStats?.total_payouts || 0)).toFixed(2)
      }
    };
  } catch (error) {
    console.error('[Copilot Tool getFinancialSnapshot Error]:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * 4. Product Lookup & Price Checking Tool
 */
async function searchProducts(tenantId, { query = '', limit = 15 } = {}) {
  try {
    const q = (query || '').trim();
    let whereClause = 'WHERE p.tenant_id = :tenantId';
    if (q) {
      whereClause += ' AND (p.name LIKE :query OR p.product_code LIKE :query)';
    }

    const products = await productSequelize.query(
      `SELECT p.id, p.product_code, p.name, p.unit, p.selling_price, p.purchase_price, p.tax_rate, p.status
       FROM products p
       ${whereClause}
       ORDER BY p.id ASC
       LIMIT :limit`,
      { replacements: { tenantId, query: `%${q}%`, limit: Number(limit) || 15 }, type: productSequelize.QueryTypes.SELECT }
    );

    const [stats] = await productSequelize.query(
      `SELECT COUNT(*) as total_count FROM products WHERE tenant_id = :tenantId`,
      { replacements: { tenantId }, type: productSequelize.QueryTypes.SELECT }
    );

    return {
      success: true,
      totalRegisteredProducts: Number(stats?.total_count || 0),
      count: products.length,
      products: products.map(p => ({
        id: p.id,
        code: p.product_code,
        name: p.name,
        price: `₹${Number(p.selling_price).toFixed(2)}`,
        purchasePrice: `₹${Number(p.purchase_price).toFixed(2)}`,
        unit: p.unit,
        taxRate: `${p.tax_rate}%`,
        status: p.status
      }))
    };
  } catch (error) {
    console.error('[Copilot Tool searchProducts Error]:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * 5. Auto Support Ticket Creation Tool
 */
async function createSupportTicket(tenantId, userId, { subject, description, priority = 'MEDIUM', category = 'GENERAL' } = {}) {
  try {
    const [result] = await tenantSequelize.query(
      `INSERT INTO tickets (tenant_id, user_id, subject, description, priority, category, status, created_at, updated_at)
       VALUES (:tenantId, :userId, :subject, :description, :priority, :category, 'OPEN', datetime('now'), datetime('now'))`,
      {
        replacements: {
          tenantId,
          userId: userId || null,
          subject: subject || 'AI Assistant Auto-Logged Query',
          description: description || 'Issue raised via AI Copilot',
          priority: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(priority) ? priority : 'MEDIUM',
          category: category || 'TECHNICAL'
        }
      }
    );

    return {
      success: true,
      ticketId: result,
      message: `Support ticket #${result} has been registered with priority [${priority}]. Our technical team has been notified.`
    };
  } catch (error) {
    console.error('[Copilot Tool createSupportTicket Error]:', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = {
  getWarehouses,
  getStockOverview,
  getSalesSummary,
  getFinancialSnapshot,
  searchProducts,
  createSupportTicket
};

