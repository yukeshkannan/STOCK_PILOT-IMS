const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env'), override: true });
const app = require('./src/app');
const { sequelize } = require('./src/models');
const { initDatabase, eventBus, EVENTS } = require('@stockpilot/common');
const notificationService = require('./src/services/notificationService');

const PORT = process.env.PORT || 5009;

async function startServer() {
  try {
    await initDatabase(sequelize, process.env.DB_NAME || 'notification_db');
    await eventBus.connect();

    // 1. Stock & Inventory Events
    await eventBus.subscribe('notification-stock-low', EVENTS.STOCK_LOW, async (data) => {
      try {
        await notificationService.createNotification({
          tenantId: data.tenantId,
          title: `Low Stock Warning: ${data.productName}`,
          message: `Product [${data.productName} (${data.productCode})] has only ${data.currentStock} units remaining in ${data.warehouseName}. Minimum threshold: ${data.minimumStock || 10} units.`,
          type: 'LOW_STOCK',
          category: 'STOCK',
          actionType: 'REORDER',
          actionId: data.productId,
          metadata: { productId: data.productId, warehouseId: data.warehouseId },
          link: '/inventory'
        });
      } catch (err) {
        console.error('Error handling STOCK_LOW notification:', err.message);
      }
    });

    await eventBus.subscribe('notification-stock-out', EVENTS.STOCK_OUT, async (data) => {
      try {
        await notificationService.createNotification({
          tenantId: data.tenantId,
          title: `Out of Stock Critical Alert: ${data.productName}`,
          message: `Product [${data.productName} (${data.productCode})] is completely OUT OF STOCK in ${data.warehouseName}. Sales paused for this item.`,
          type: 'OUT_OF_STOCK',
          category: 'STOCK',
          actionType: 'REORDER',
          actionId: data.productId,
          metadata: { productId: data.productId, warehouseId: data.warehouseId },
          link: '/inventory'
        });
      } catch (err) {
        console.error('Error handling STOCK_OUT notification:', err.message);
      }
    });

    await eventBus.subscribe('notification-stock-adjustment', EVENTS.STOCK_ADJUSTMENT, async (data) => {
      try {
        await notificationService.createNotification({
          tenantId: data.tenantId,
          title: `Stock Adjustment Recorded: ${data.productName}`,
          message: `Stock discrepancy of ${data.quantity} units adjusted for [${data.productName}] in ${data.warehouseName} (Reason: ${data.reason || 'Audit'}).`,
          type: 'STOCK',
          category: 'STOCK',
          link: '/inventory'
        });
      } catch (err) {
        console.error('Error handling STOCK_ADJUSTMENT notification:', err.message);
      }
    });

    // 2. Request & Response / Warehouse Transfer Events
    await eventBus.subscribe('notification-transfer-requested', EVENTS.TRANSFER_REQUESTED, async (data) => {
      try {
        await notificationService.createNotification({
          tenantId: data.tenantId,
          title: `Transfer Request: #${data.transferNumber}`,
          message: `Transfer Request raised: ${data.fromWarehouse} to ${data.toWarehouse} (${data.itemsCount} line items). Requires manager approval.`,
          type: 'TRANSFER',
          category: 'REQUESTS',
          actionType: 'TRANSFER_APPROVE',
          actionId: data.transferId,
          metadata: { transferId: data.transferId, transferNumber: data.transferNumber },
          link: '/warehouses?tab=transfers'
        });
      } catch (err) {
        console.error('Error handling TRANSFER_REQUESTED notification:', err.message);
      }
    });

    await eventBus.subscribe('notification-transfer-approved', EVENTS.TRANSFER_APPROVED, async (data) => {
      try {
        await notificationService.createNotification({
          tenantId: data.tenantId,
          title: `Stock Transfer Approved: #${data.transferNumber}`,
          message: `Transfer #${data.transferNumber} (${data.fromWarehouse} to ${data.toWarehouse}) has been approved and is ready for dispatch.`,
          type: 'TRANSFER',
          category: 'TRANSACTIONS',
          link: '/warehouses?tab=transfers'
        });
      } catch (err) {
        console.error('Error handling TRANSFER_APPROVED notification:', err.message);
      }
    });

    await eventBus.subscribe('notification-transfer-dispatched', EVENTS.TRANSFER_DISPATCHED, async (data) => {
      try {
        await notificationService.createNotification({
          tenantId: data.tenantId,
          title: `Stock Transfer Dispatched: #${data.transferNumber}`,
          message: `Transfer #${data.transferNumber} is now IN TRANSIT to ${data.toWarehouse}. Driver: ${data.driverName || 'In-house logistics'} (${data.vehicleNo || 'Fleet'}).`,
          type: 'TRANSFER',
          category: 'TRANSACTIONS',
          link: '/warehouses?tab=transfers'
        });
      } catch (err) {
        console.error('Error handling TRANSFER_DISPATCHED notification:', err.message);
      }
    });

    await eventBus.subscribe('notification-transfer-completed', EVENTS.TRANSFER_COMPLETED, async (data) => {
      try {
        await notificationService.createNotification({
          tenantId: data.tenantId,
          title: `Stock Transfer Received: #${data.transferNumber}`,
          message: `Transfer #${data.transferNumber} has arrived at ${data.toWarehouse}. Destination inventory successfully updated.`,
          type: 'TRANSFER',
          category: 'TRANSACTIONS',
          link: '/warehouses?tab=transfers'
        });
      } catch (err) {
        console.error('Error handling TRANSFER_COMPLETED notification:', err.message);
      }
    });

    // 3. Procurement / Purchase Order Events
    await eventBus.subscribe('notification-purchase-created', EVENTS.PURCHASE_CREATED, async (data) => {
      try {
        await notificationService.createNotification({
          tenantId: data.tenantId,
          title: `PO Approval Needed: #${data.poNumber}`,
          message: `Purchase Order #${data.poNumber} created for supplier '${data.supplierName}' (Amount: ₹${Number(data.grandTotal || 0).toLocaleString()}).`,
          type: 'PURCHASE',
          category: 'REQUESTS',
          actionType: 'PURCHASE_APPROVE',
          actionId: data.purchaseId,
          metadata: { purchaseId: data.purchaseId, poNumber: data.poNumber },
          link: '/purchases'
        });
      } catch (err) {
        console.error('Error handling PURCHASE_CREATED notification:', err.message);
      }
    });

    await eventBus.subscribe('notification-purchase-approved', EVENTS.PURCHASE_APPROVED, async (data) => {
      try {
        await notificationService.createNotification({
          tenantId: data.tenantId,
          title: `Purchase Order Approved: #${data.poNumber}`,
          message: `PO #${data.poNumber} from supplier '${data.supplierName}' has been approved and received into warehouse stock.`,
          type: 'PURCHASE',
          category: 'TRANSACTIONS',
          link: '/purchases'
        });
      } catch (err) {
        console.error('Error handling PURCHASE_APPROVED notification:', err.message);
      }
    });

    // 4. Sales & Finance Events
    await eventBus.subscribe('notification-sale', EVENTS.SALE_CREATED, async (data) => {
      try {
        const isHighValue = (data.grandTotal || 0) >= 50000;
        await notificationService.createNotification({
          tenantId: data.tenantId,
          title: isHighValue ? `High-Value Sale Order: #${data.invoiceNumber}` : `New Sale Invoice: #${data.invoiceNumber}`,
          message: `Invoice #${data.invoiceNumber} created for ${data.customerName || 'Walk-in Customer'} (Total: ₹${Number(data.grandTotal || 0).toLocaleString()}${data.dueAmount > 0 ? `, Due: ₹${data.dueAmount}` : ''}).`,
          type: 'SALE',
          category: 'TRANSACTIONS',
          link: '/sales'
        });
      } catch (err) {
        console.error('Error handling SALE_CREATED notification:', err.message);
      }
    });

    await eventBus.subscribe('notification-sale-return', EVENTS.SALE_RETURNED, async (data) => {
      try {
        await notificationService.createNotification({
          tenantId: data.tenantId,
          title: `Customer Return Processed: #${data.returnNumber || 'RET'}`,
          message: `Return #${data.returnNumber || 'RET'} processed for invoice #${data.invoiceNumber} (Refund Amount: ₹${Number(data.refundAmount || 0).toLocaleString()}). Stock returned to warehouse.`,
          type: 'RETURN',
          category: 'TRANSACTIONS',
          link: '/sales'
        });
      } catch (err) {
        console.error('Error handling SALE_RETURNED notification:', err.message);
      }
    });

    await eventBus.subscribe('notification-payment-overdue', EVENTS.PAYMENT_OVERDUE, async (data) => {
      try {
        await notificationService.createNotification({
          tenantId: data.tenantId,
          title: `Payment Overdue Notice: ${data.customerName}`,
          message: `Customer '${data.customerName}' has an overdue balance of ₹${Number(data.dueAmount || 0).toLocaleString()} on Invoice #${data.invoiceNumber}.`,
          type: 'PAYMENT',
          category: 'TRANSACTIONS',
          link: '/sales'
        });
      } catch (err) {
        console.error('Error handling PAYMENT_OVERDUE notification:', err.message);
      }
    });

    app.listen(PORT, () => {
      console.log(`In-App Notification Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start Notification Service:', error);
    process.exit(1);
  }
}

startServer();

