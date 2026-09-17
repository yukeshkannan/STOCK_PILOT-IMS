const axios = require('axios');
const { Supplier, Purchase, PurchaseItem, PurchaseReturn, PurchaseReturnItem, sequelize } = require('../models');
const { PURCHASE_STATUS, PAYMENT_STATUS, STOCK_MOVEMENT_TYPES, eventBus, EVENTS, getNextSequenceNumber } = require('@stockpilot/common');

const INVENTORY_SERVICE_URL = process.env.INVENTORY_SERVICE_URL || 'http://localhost:5004';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:5009';

async function dispatchNotification(tenantId, { title, message, type = 'PURCHASE', link = null }) {
  try {
    await axios.post(`${NOTIFICATION_SERVICE_URL}/api/v1/notifications`, {
      title,
      message,
      type,
      link,
      tenantId: tenantId ? Number(tenantId) : 0
    }, {
      headers: { 'x-tenant-id': String(tenantId || 0) },
      timeout: 3000
    });
  } catch (e) {
    // Non-fatal notification failure
  }
}

class PurchaseService {
  // Suppliers
  async getSuppliers(tenantId) {
    return Supplier.findAll({
      where: { tenant_id: tenantId },
      order: [['name', 'ASC']]
    });
  }

  async getSupplierById(tenantId, id) {
    const supplier = await Supplier.findOne({ where: { id, tenant_id: tenantId } });
    if (!supplier) throw { statusCode: 404, message: 'Supplier not found' };
    return supplier;
  }

  async createSupplier(tenantId, data) {
    return Supplier.create({
      tenant_id: tenantId,
      name: data.name,
      contact_person: data.contactPerson || '',
      email: data.email || null,
      phone: data.phone,
      address: data.address || '',
      gstin: data.gstin || '',
      status: 'ACTIVE'
    });
  }

  async updateSupplier(tenantId, id, data) {
    const supplier = await this.getSupplierById(tenantId, id);
    await supplier.update(data);
    return supplier;
  }

  async deleteSupplier(tenantId, id) {
    const supplier = await this.getSupplierById(tenantId, id);
    await supplier.destroy();
    return true;
  }

  // Purchases
  async getPurchases(tenantId, { status, supplierId, page = 1, limit = 50 }) {
    const where = { tenant_id: tenantId };
    if (status) where.status = status;
    if (supplierId) where.supplier_id = supplierId;

    const offset = (page - 1) * limit;
    const { rows, count } = await Purchase.findAndCountAll({
      where,
      include: [
        { model: PurchaseItem, as: 'items' },
        { model: Supplier, as: 'supplier' }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    });

    return { purchases: rows, total: count };
  }

  async getPurchaseById(tenantId, id) {
    const purchase = await Purchase.findOne({
      where: { id, tenant_id: tenantId },
      include: [
        { model: PurchaseItem, as: 'items' },
        { model: Supplier, as: 'supplier' }
      ]
    });
    if (!purchase) throw { statusCode: 404, message: 'Purchase record not found' };
    return purchase;
  }

  async createPurchase(tenantId, purchaseData) {
    const { supplierId, warehouseId, warehouseName, items, discountAmount = 0, notes, createdBy } = purchaseData;

    const parsedSupplierId = parseInt(supplierId, 10);
    if (!supplierId || isNaN(parsedSupplierId)) {
      throw { statusCode: 400, message: 'Please select a valid Supplier for the purchase order' };
    }

    if (!items || !Array.isArray(items) || !items.length) {
      throw { statusCode: 400, message: 'Purchase must have at least one line item' };
    }

    let supplier = await Supplier.findOne({ where: { id: parsedSupplierId, tenant_id: tenantId } });
    if (!supplier) {
      const anySup = await Supplier.findOne({ where: { tenant_id: tenantId } });
      if (anySup) {
        supplier = anySup;
      } else {
        supplier = await Supplier.create({
          tenant_id: tenantId,
          name: 'Primary Wholesale Supplier',
          phone: '9876543210',
          status: 'ACTIVE'
        });
      }
    }

    const poPrefix = `PO-${new Date().getFullYear()}`;
    const poNumber = await getNextSequenceNumber(sequelize, tenantId, 'PURCHASE_ORDER', poPrefix, 4);

    let subtotal = 0;
    let totalTax = 0;

    const calculatedItems = items.map(item => {
      const price = parseFloat(item.unitPrice) || 0;
      const qty = parseInt(item.quantity, 10) || 1;
      const taxRate = parseFloat(item.taxRate) || 0;
      const itemSubtotal = price * qty;
      const itemTax = itemSubtotal * (taxRate / 100);
      const itemTotal = itemSubtotal + itemTax;

      subtotal += itemSubtotal;
      totalTax += itemTax;

      return {
        product_id: item.productId,
        product_code: item.productCode || `PRD-${item.productId}`,
        product_name: item.productName || `Product ${item.productId}`,
        unit_price: price,
        quantity: qty,
        tax_rate: taxRate,
        tax_amount: itemTax,
        total_price: itemTotal
      };
    });

    const discount = parseFloat(discountAmount) || 0;
    const grandTotal = Math.max(0, subtotal + totalTax - discount);

    const transaction = await sequelize.transaction();
    try {
      const purchase = await Purchase.create({
        tenant_id: tenantId,
        po_number: poNumber,
        supplier_id: supplierId,
        supplier_name: supplier.name,
        warehouse_id: warehouseId || 1,
        warehouse_name: warehouseName || 'Main Warehouse',
        status: PURCHASE_STATUS.DRAFT,
        subtotal,
        tax_amount: totalTax,
        discount_amount: discount,
        grand_total: grandTotal,
        payment_status: PAYMENT_STATUS.UNPAID,
        paid_amount: 0,
        due_amount: grandTotal,
        notes: notes || '',
        created_by: createdBy || 'Admin'
      }, { transaction });

      for (const item of calculatedItems) {
        await PurchaseItem.create({
          purchase_id: purchase.id,
          ...item
        }, { transaction });
      }

      await transaction.commit();

      await eventBus.publish(EVENTS.PURCHASE_CREATED, {
        tenantId,
        purchaseId: purchase.id,
        poNumber,
        supplierName: supplier.name,
        grandTotal
      });

      return this.getPurchaseById(tenantId, purchase.id);
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  async approvePurchase(tenantId, purchaseId, approvedBy) {
    const purchase = await this.getPurchaseById(tenantId, purchaseId);
    if (purchase.status === PURCHASE_STATUS.APPROVED) {
      throw { statusCode: 400, message: 'Purchase is already approved' };
    }

    // Call Inventory Service to increase stock for all items
    for (const item of purchase.items) {
      try {
        await axios.post(`${INVENTORY_SERVICE_URL}/api/v1/inventory/internal/increase-stock`, {
          productId: item.product_id,
          productCode: item.product_code,
          productName: item.product_name,
          warehouseId: purchase.warehouse_id,
          warehouseName: purchase.warehouse_name,
          quantity: item.quantity,
          movementType: STOCK_MOVEMENT_TYPES.PURCHASE,
          referenceType: 'PO',
          referenceId: purchase.po_number,
          notes: `Purchase from ${purchase.supplier_name}`,
          createdBy: approvedBy || 'Admin'
        }, {
          headers: { 'x-tenant-id': String(tenantId) }
        });
      } catch (err) {
        console.error(`Inventory increase error during PO approval:`, err.message);
      }
    }

    await purchase.update({
      status: PURCHASE_STATUS.APPROVED,
      approved_by: approvedBy || 'Admin'
    });

    await eventBus.publish(EVENTS.PURCHASE_APPROVED, {
      tenantId,
      purchaseId: purchase.id,
      poNumber: purchase.po_number,
      supplierName: purchase.supplier_name,
      grandTotal: purchase.grand_total,
      warehouseId: purchase.warehouse_id
    });

    return this.getPurchaseById(tenantId, purchase.id);
  }

  async recordPayment(tenantId, purchaseId, paymentData = {}) {
    const { amount, paymentMethod, transactionId, notes, autoApproveStock, paidBy } = paymentData;
    const purchase = await this.getPurchaseById(tenantId, purchaseId);
    if (!purchase) {
      throw { statusCode: 404, message: 'Purchase Order not found' };
    }

    const payAmount = parseFloat(amount) || parseFloat(purchase.due_amount) || parseFloat(purchase.grand_total);
    const newPaid = Math.min(parseFloat(purchase.grand_total), (parseFloat(purchase.paid_amount) || 0) + payAmount);
    const newDue = Math.max(0, parseFloat(purchase.grand_total) - newPaid);
    const newStatus = newDue <= 0 ? PAYMENT_STATUS.PAID : PAYMENT_STATUS.PARTIALLY_PAID;

    await purchase.update({
      paid_amount: newPaid,
      due_amount: newDue,
      payment_status: newStatus
    });

    // If autoApproveStock requested and not yet approved, intake stock into warehouse
    if (autoApproveStock && purchase.status !== PURCHASE_STATUS.APPROVED) {
      try {
        await this.approvePurchase(tenantId, purchaseId, paidBy || 'Payment Gateway');
      } catch (e) {
        console.error('Auto stock intake after payment failed/skipped:', e.message);
      }
    }

    try {
      await eventBus.publish(EVENTS.PAYMENT_RECORDED, {
        tenantId,
        referenceType: 'PURCHASE',
        referenceId: purchase.id,
        poNumber: purchase.po_number,
        supplierId: purchase.supplier_id,
        supplierName: purchase.supplier_name,
        amount: payAmount,
        paymentMethod: paymentMethod || 'TEST_GATEWAY',
        transactionId: transactionId || `TXN-TEST-${Date.now()}`,
        paidAt: new Date()
      });
    } catch (e) {
      console.error('Payment event publish error:', e.message);
    }

    return this.getPurchaseById(tenantId, purchase.id);
  }

  async cancelPurchase(tenantId, purchaseId, reason = 'Order cancelled by user') {
    const purchase = await this.getPurchaseById(tenantId, purchaseId);
    if (!purchase) {
      throw { statusCode: 404, message: 'Purchase Order not found' };
    }
    if (purchase.status === PURCHASE_STATUS.CANCELLED) {
      throw { statusCode: 400, message: 'Purchase Order is already cancelled' };
    }

    // If purchase was already approved, stock was ingested into inventory, so deduct/revert it!
    if (purchase.status === PURCHASE_STATUS.APPROVED) {
      for (const item of purchase.items || []) {
        try {
          await axios.post(`${INVENTORY_SERVICE_URL}/api/v1/inventory/internal/decrease-stock`, {
            productId: item.product_id,
            warehouseId: purchase.warehouse_id,
            quantity: item.quantity,
            movementType: STOCK_MOVEMENT_TYPES.RETURN_OUT,
            referenceType: 'PO_CANCELLED',
            referenceId: purchase.po_number,
            notes: `Stock reverted: PO #${purchase.po_number} cancelled (${reason})`,
            createdBy: 'System'
          }, {
            headers: { 'x-tenant-id': String(tenantId) }
          });
        } catch (err) {
          console.error(`Error decreasing stock on PO cancellation:`, err.message);
        }
      }
    }

    await purchase.update({
      status: PURCHASE_STATUS.CANCELLED,
      notes: purchase.notes ? `${purchase.notes} | Cancelled: ${reason}` : `Cancelled: ${reason}`
    });

    return this.getPurchaseById(tenantId, purchase.id);
  }

  async deletePurchase(tenantId, purchaseId) {
    const purchase = await this.getPurchaseById(tenantId, purchaseId);
    if (!purchase) {
      throw { statusCode: 404, message: 'Purchase Order not found' };
    }

    // If purchase was approved, revert the ingested stock from inventory before deletion
    if (purchase.status === PURCHASE_STATUS.APPROVED) {
      for (const item of purchase.items || []) {
        try {
          await axios.post(`${INVENTORY_SERVICE_URL}/api/v1/inventory/internal/decrease-stock`, {
            productId: item.product_id,
            warehouseId: purchase.warehouse_id,
            quantity: item.quantity,
            movementType: STOCK_MOVEMENT_TYPES.ADJUSTMENT,
            referenceType: 'PO_DELETED',
            referenceId: purchase.po_number,
            notes: `Stock reverted: PO #${purchase.po_number} was deleted`,
            createdBy: 'System'
          }, {
            headers: { 'x-tenant-id': String(tenantId) }
          });
        } catch (err) {
          console.error(`Error reverting stock on PO deletion:`, err.message);
        }
      }
    }

    await PurchaseItem.destroy({ where: { purchase_id: purchase.id } });
    await purchase.destroy();
    return { success: true, message: 'Purchase order deleted and stock reverted successfully' };
  }

  // Purchase Returns
  async createPurchaseReturn(tenantId, returnData) {
    const {
      purchaseId,
      poNumber,
      supplierId,
      warehouseId,
      warehouseName,
      items,
      reason,
      notes,
      createdBy
    } = returnData;

    if (!items || !items.length) {
      throw { statusCode: 400, message: 'Purchase return must include at least one item' };
    }

    let linkedPurchase = null;
    if (purchaseId) {
      try {
        linkedPurchase = await this.getPurchaseById(tenantId, purchaseId);
      } catch (e) {
        console.warn(`Purchase ID ${purchaseId} not found, proceeding with general return.`);
      }
    }

    const supId = supplierId || linkedPurchase?.supplier_id;
    if (!supId) {
      throw { statusCode: 400, message: 'Supplier is required for purchase return' };
    }

    const supplier = await this.getSupplierById(tenantId, supId);
    const targetWhId = warehouseId ? parseInt(warehouseId, 10) : (linkedPurchase?.warehouse_id || 1);
    const targetWhName = warehouseName || linkedPurchase?.warehouse_name || 'Main Warehouse';

    const returnPrefix = `PR-${new Date().getFullYear()}`;
    const returnNumber = await getNextSequenceNumber(sequelize, tenantId, 'PURCHASE_RETURN', returnPrefix, 4);

    let totalRefund = 0;
    const returnItems = items.map(item => {
      const price = parseFloat(item.unitPrice !== undefined ? item.unitPrice : item.unit_price) || 0;
      const qty = parseInt(item.quantity, 10) || 1;
      const total = price * qty;
      totalRefund += total;
      const prodId = parseInt(item.productId !== undefined ? item.productId : item.product_id, 10);
      return {
        product_id: prodId,
        product_code: item.productCode || item.product_code || `PRD-${prodId}`,
        product_name: item.productName || item.product_name || `Product ${prodId}`,
        quantity: qty,
        unit_price: price,
        total_price: total
      };
    });

    const transaction = await sequelize.transaction();
    try {
      const pReturn = await PurchaseReturn.create({
        tenant_id: tenantId,
        return_number: returnNumber,
        purchase_id: linkedPurchase ? linkedPurchase.id : (purchaseId ? parseInt(purchaseId, 10) : null),
        supplier_id: supplier.id,
        supplier_name: supplier.name,
        warehouse_id: targetWhId,
        warehouse_name: targetWhName,
        total_refund: totalRefund,
        reason: reason || 'Defective/Damaged goods',
        notes: notes || (linkedPurchase ? `Returned against PO #${linkedPurchase.po_number}` : ''),
        status: 'PENDING_APPROVAL',
        created_by: createdBy || 'Admin'
      }, { transaction });

      for (const item of returnItems) {
        await PurchaseReturnItem.create({
          return_id: pReturn.id,
          ...item
        }, { transaction });
      }

      await transaction.commit();

      // Dispatch platform notification for new RMA return request
      dispatchNotification(tenantId, {
        title: `Purchase Return Request #${returnNumber}`,
        message: `RMA Return request of ₹${totalRefund.toLocaleString('en-IN')} submitted for ${supplier.name} (${reason || 'Defective items'}). Awaiting review.`,
        type: 'PURCHASE',
        link: `/purchases?tab=returns&returnId=${pReturn.id}`
      });

      return this.getPurchaseReturnById(tenantId, pReturn.id);
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  async approvePurchaseReturn(tenantId, id, approvedBy) {
    const pReturn = await this.getPurchaseReturnById(tenantId, id);
    if (!pReturn) {
      throw { statusCode: 404, message: 'Purchase return record not found' };
    }

    if (pReturn.status === 'APPROVED') {
      throw { statusCode: 400, message: 'Purchase return has already been approved and stock was deducted.' };
    }

    // Atomically decrease stock in live inventory upon approval
    for (const item of pReturn.items || []) {
      try {
        await axios.post(`${INVENTORY_SERVICE_URL}/api/v1/inventory/internal/decrease-stock`, {
          productId: item.product_id,
          warehouseId: pReturn.warehouse_id,
          quantity: item.quantity,
          movementType: STOCK_MOVEMENT_TYPES.RETURN_OUT,
          referenceType: 'PURCHASE_RETURN',
          referenceId: pReturn.return_number,
          notes: `RMA Return Approved for ${pReturn.supplier_name}: ${pReturn.reason || 'Defective goods'}`,
          createdBy: approvedBy || 'Admin'
        }, {
          headers: { 'x-tenant-id': String(tenantId) }
        });
      } catch (invErr) {
        const errMsg = invErr.response?.data?.message || invErr.message;
        console.error(`Inventory deduction error during return approval:`, errMsg);
        throw {
          statusCode: invErr.response?.status || 400,
          message: `Failed to deduct stock for ${item.product_name}: ${errMsg}`
        };
      }
    }

    await pReturn.update({
      status: 'APPROVED',
      reviewed_by: approvedBy || 'Admin',
      reviewed_at: new Date()
    });

    try {
      await eventBus.publish(EVENTS.STOCK_UPDATED, {
        tenantId,
        type: 'PURCHASE_RETURN_APPROVED',
        returnNumber: pReturn.return_number,
        supplierName: pReturn.supplier_name,
        warehouseId: pReturn.warehouse_id,
        totalRefund: pReturn.total_refund
      });
    } catch (e) {
      // Event bus non-fatal
    }

    dispatchNotification(tenantId, {
      title: `Return Approved: #${pReturn.return_number}`,
      message: `Return request of ₹${parseFloat(pReturn.total_refund).toLocaleString('en-IN')} for ${pReturn.supplier_name} accepted. Stock deducted from ${pReturn.warehouse_name}.`,
      type: 'PURCHASE',
      link: `/purchases?tab=returns&returnId=${pReturn.id}`
    });

    return this.getPurchaseReturnById(tenantId, pReturn.id);
  }

  async rejectPurchaseReturn(tenantId, id, rejectedBy, rejectionReason) {
    const pReturn = await this.getPurchaseReturnById(tenantId, id);
    if (!pReturn) {
      throw { statusCode: 404, message: 'Purchase return record not found' };
    }

    if (pReturn.status === 'APPROVED') {
      throw { statusCode: 400, message: 'Cannot decline a purchase return that has already been approved and stock deducted.' };
    }

    await pReturn.update({
      status: 'REJECTED',
      reviewed_by: rejectedBy || 'Admin',
      reviewed_at: new Date(),
      rejection_reason: rejectionReason || 'Declined by supplier / quality check'
    });

    dispatchNotification(tenantId, {
      title: `Return Declined: #${pReturn.return_number}`,
      message: `Return request for ${pReturn.supplier_name} was declined: ${rejectionReason || 'No reason provided'}. Stock remains unaffected.`,
      type: 'PURCHASE',
      link: `/purchases?tab=returns&returnId=${pReturn.id}`
    });

    return this.getPurchaseReturnById(tenantId, pReturn.id);
  }

  async getPurchaseReturns(tenantId) {
    return PurchaseReturn.findAll({
      where: { tenant_id: tenantId },
      include: [{ model: PurchaseReturnItem, as: 'items' }],
      order: [['created_at', 'DESC']]
    });
  }

  async getPurchaseReturnById(tenantId, id) {
    const pReturn = await PurchaseReturn.findOne({
      where: { id, tenant_id: tenantId },
      include: [{ model: PurchaseReturnItem, as: 'items' }]
    });
    if (!pReturn) throw { statusCode: 404, message: 'Purchase return record not found' };
    return pReturn;
  }

  async deletePurchaseReturn(tenantId, id) {
    const pReturn = await this.getPurchaseReturnById(tenantId, id);
    if (!pReturn) {
      throw { statusCode: 404, message: 'Purchase return record not found' };
    }

    // Only revert stock if the return was approved (and thus previously deducted)
    if (pReturn.status === 'APPROVED') {
      for (const item of pReturn.items || []) {
        try {
          await axios.post(`${INVENTORY_SERVICE_URL}/api/v1/inventory/internal/increase-stock`, {
            productId: item.product_id,
            productCode: item.product_code,
            productName: item.product_name,
            warehouseId: pReturn.warehouse_id,
            warehouseName: pReturn.warehouse_name,
            quantity: item.quantity,
            movementType: STOCK_MOVEMENT_TYPES.ADJUSTMENT,
            referenceType: 'PR_DELETED',
            referenceId: pReturn.return_number,
            notes: `Stock restored: Approved Purchase return #${pReturn.return_number} was deleted`,
            createdBy: 'System'
          }, {
            headers: { 'x-tenant-id': String(tenantId) }
          });
        } catch (err) {
          console.error(`Error restoring stock on purchase return delete:`, err.message);
        }
      }
    }

    await PurchaseReturnItem.destroy({ where: { return_id: pReturn.id } });
    await pReturn.destroy();
    return { success: true, message: 'Purchase return deleted successfully' };
  }
}

module.exports = new PurchaseService();
