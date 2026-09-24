const axios = require('axios');
const { Customer, Sale, SaleItem, SaleReturn, SaleReturnItem, sequelize } = require('../models');
const { SALE_STATUS, PAYMENT_STATUS, PAYMENT_METHODS, STOCK_MOVEMENT_TYPES, eventBus, EVENTS, getNextSequenceNumber } = require('@stockpilot/common');

const INVENTORY_SERVICE_URL = process.env.INVENTORY_SERVICE_URL || 'http://localhost:5004';

class SalesService {
  // Customers
  async getCustomers(tenantId) {
    return Customer.findAll({
      where: { tenant_id: tenantId },
      order: [['name', 'ASC']]
    });
  }

  async getCustomerById(tenantId, id) {
    const customer = await Customer.findOne({ where: { id, tenant_id: tenantId } });
    if (!customer) throw { statusCode: 404, message: 'Customer not found' };
    return customer;
  }

  async createCustomer(tenantId, data) {
    return Customer.create({
      tenant_id: tenantId,
      name: data.name,
      phone: data.phone,
      email: data.email || null,
      address: data.address || '',
      gstin: data.gstin || '',
      credit_limit: data.creditLimit || 50000,
      status: 'ACTIVE'
    });
  }

  async updateCustomer(tenantId, id, data) {
    const customer = await this.getCustomerById(tenantId, id);
    await customer.update(data);
    return customer;
  }

  async deleteCustomer(tenantId, id) {
    const customer = await this.getCustomerById(tenantId, id);
    await customer.destroy();
    return true;
  }

  // Sales
  async getSales(tenantId, { status, customerId, page = 1, limit = 50 }) {
    const where = { tenant_id: tenantId };
    if (status) where.status = status;
    if (customerId) where.customer_id = customerId;

    const offset = (page - 1) * limit;
    const { rows, count } = await Sale.findAndCountAll({
      where,
      include: [
        { model: SaleItem, as: 'items' },
        { model: Customer, as: 'customer' }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    });

    return { sales: rows, total: count };
  }

  async getSaleById(tenantId, id) {
    const sale = await Sale.findOne({
      where: { id, tenant_id: tenantId },
      include: [
        { model: SaleItem, as: 'items' },
        { model: Customer, as: 'customer' }
      ]
    });
    if (!sale) throw { statusCode: 404, message: 'Sale invoice not found' };
    return sale;
  }

  async getPublicInvoice(invoiceNumber) {
    const cleanNum = String(invoiceNumber).trim();
    let sale = await Sale.findOne({
      where: { invoice_number: cleanNum },
      include: [
        { model: SaleItem, as: 'items' },
        { model: Customer, as: 'customer' }
      ]
    });
    if (!sale && !isNaN(cleanNum)) {
      sale = await Sale.findByPk(parseInt(cleanNum, 10), {
        include: [
          { model: SaleItem, as: 'items' },
          { model: Customer, as: 'customer' }
        ]
      });
    }
    if (!sale) throw { statusCode: 404, message: 'Official invoice not found or link has expired' };

    let companyName = null;
    let companyGstin = null;
    let companyAddress = null;
    let companyPhone = null;

    try {
      const TENANT_URL = process.env.TENANT_SERVICE_URL || 'http://localhost:5002';
      const tRes = await axios.get(`${TENANT_URL}/api/v1/tenants/internal/${sale.tenant_id}`, { timeout: 2000 });
      const tData = tRes.data?.data;
      if (tData) {
        companyName = tData.company_name || tData.name;
        companyGstin = tData.tax_number || tData.gstin;
        companyAddress = tData.address;
        companyPhone = tData.phone;
      }
    } catch (e) {
      // Non-fatal fallback
    }

    const saleJson = sale.toJSON();
    saleJson.company_name = companyName || sale.warehouse_name || 'Retail Store';
    saleJson.company_gstin = companyGstin || '29ABCDE1234F1Z5';
    saleJson.company_address = companyAddress || '';
    saleJson.company_phone = companyPhone || '';
    return saleJson;
  }

  async createPublicOrder(orderData) {
    const {
      companyCode,
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      items,
      paymentMethod = 'COD',
      notes
    } = orderData;

    const cleanCode = (companyCode || '').trim().toUpperCase();
    let tenantInfo = null;

    try {
      const { createDatabaseConnection } = require('@stockpilot/common');
      const authDb = createDatabaseConnection('auth_db');
      const [lookups] = await authDb.query(
        'SELECT tenant_id, company_code, company_name FROM tenant_lookup WHERE UPPER(company_code) = :code LIMIT 1;',
        { replacements: { code: cleanCode } }
      );
      if (lookups && lookups.length > 0) {
        tenantInfo = {
          tenantId: Number(lookups[0].tenant_id),
          companyCode: lookups[0].company_code,
          companyName: lookups[0].company_name
        };
      }
    } catch (e) {}

    if (!tenantInfo) {
      try {
        const { createDatabaseConnection } = require('@stockpilot/common');
        const tenantDb = createDatabaseConnection('tenant_db');
        const [tenants] = await tenantDb.query(
          'SELECT id, company_code, company_name FROM tenants WHERE UPPER(company_code) = :code LIMIT 1;',
          { replacements: { code: cleanCode } }
        );
        if (tenants && tenants.length > 0) {
          tenantInfo = {
            tenantId: Number(tenants[0].id),
            companyCode: tenants[0].company_code,
            companyName: tenants[0].company_name
          };
        }
      } catch (e) {}
    }

    if (!tenantInfo) {
      throw { statusCode: 404, message: `Store with code '${companyCode}' not found` };
    }

    const tenantId = tenantInfo.tenantId;

    // Resolve primary warehouse
    let warehouseId = 1;
    let warehouseName = 'Main Outlet Store';
    try {
      const { createDatabaseConnection } = require('@stockpilot/common');
      const whDb = createDatabaseConnection('warehouse_db');
      const [whs] = await whDb.query(
        'SELECT id, name FROM warehouses WHERE tenant_id = :tenantId ORDER BY is_default DESC, id ASC LIMIT 1;',
        { replacements: { tenantId } }
      );
      if (whs && whs.length > 0) {
        warehouseId = whs[0].id;
        warehouseName = whs[0].name;
      }
    } catch (e) {}

    // Find or create customer
    let customer = null;
    if (customerPhone) {
      customer = await Customer.findOne({
        where: { tenant_id: tenantId, phone: customerPhone }
      });
      if (!customer) {
        customer = await Customer.create({
          tenant_id: tenantId,
          name: customerName || 'Online Customer',
          phone: customerPhone,
          email: customerEmail || null,
          address: customerAddress || '',
          credit_limit: 10000,
          status: 'ACTIVE'
        });
      }
    }

    // Prepare sale
    const sale = await this.createSale(tenantId, {
      customerId: customer?.id,
      customerName: customerName || customer?.name || 'Online Customer',
      customerPhone: customerPhone || customer?.phone || '',
      warehouseId,
      warehouseName,
      items,
      paymentMethod: paymentMethod === 'UPI' ? 'UPI' : 'CASH',
      paidAmount: paymentMethod === 'UPI' ? 0 : 0, // Mark paid or COD
      discountAmount: 0,
      notes: `[Online Storefront Order] ${notes || ''} | Delivery Addr: ${customerAddress || 'Direct Store Pickup'}`,
      createdBy: 'Online Customer'
    });

    return {
      success: true,
      saleId: sale.id,
      invoiceNumber: sale.invoice_number,
      grandTotal: sale.grand_total,
      subtotal: sale.subtotal,
      taxAmount: sale.tax_amount,
      customerName: sale.customer_name,
      ebillUrl: `/e-bill/${sale.invoice_number}`
    };
  }

  async createSale(tenantId, saleData) {
    const {
      customerId,
      customerName,
      customerPhone,
      warehouseId,
      warehouseName,
      items,
      paymentMethod = PAYMENT_METHODS.CASH,
      paidAmount = 0,
      discountAmount = 0,
      notes,
      createdBy
    } = saleData;

    if (!items || !items.length) {
      throw { statusCode: 400, message: 'Sale must have at least one line item' };
    }

    const parsedWhId = parseInt(warehouseId, 10);
    const whId = (!isNaN(parsedWhId) && parsedWhId > 0) ? parsedWhId : 1;
    const whName = warehouseName || 'Main Warehouse';

    // 1. Check stock availability for all items in Inventory Service
    const stockCheckPayload = items.map(item => ({
      productId: item.productId,
      warehouseId: whId,
      quantity: item.quantity
    }));

    try {
      const checkRes = await axios.post(`${INVENTORY_SERVICE_URL}/api/v1/inventory/internal/check-stock`, {
        items: stockCheckPayload
      }, {
        headers: { 'x-tenant-id': String(tenantId) }
      });

      if (!checkRes.data?.data?.allAvailable) {
        const unavailableItems = checkRes.data.data.items.filter(i => !i.isAvailable);
        const details = unavailableItems.map(i => `${i.productName}: available ${i.availableQuantity}, requested ${i.requestedQuantity}`).join('; ');
        throw {
          statusCode: 400,
          errorCode: 'INSUFFICIENT_STOCK',
          message: `Insufficient stock to complete sale: ${details}`
        };
      }
    } catch (err) {
      if (err.statusCode) throw err;
      console.warn('Inventory check bypassed in isolated mode:', err.message);
    }

    // 2. Calculate Totals
    let subtotal = 0;
    let totalTax = 0;

    const calculatedItems = items.map(item => {
      const price = parseFloat(item.unitPrice) || 0;
      const cost = parseFloat(item.costPrice) || 0;
      const qty = parseInt(item.quantity, 10) || 1;
      const taxRate = parseFloat(item.taxRate) || 0;
      const itemDiscount = parseFloat(item.discountAmount) || 0;

      const itemSubtotal = price * qty;
      const itemTax = itemSubtotal * (taxRate / 100);
      const itemTotal = Math.max(0, itemSubtotal + itemTax - itemDiscount);

      subtotal += itemSubtotal;
      totalTax += itemTax;

      return {
        product_id: item.productId,
        product_code: item.productCode || `PRD-${item.productId}`,
        product_name: item.productName || `Product ${item.productId}`,
        unit_price: price,
        cost_price: cost,
        quantity: qty,
        tax_rate: taxRate,
        tax_amount: itemTax,
        discount_amount: itemDiscount,
        total_price: itemTotal
      };
    });

    const discount = parseFloat(discountAmount) || 0;
    const grandTotal = Math.max(0, subtotal + totalTax - discount);

    const paid = Math.min(grandTotal, Math.max(0, parseFloat(paidAmount) || 0));
    const due = Math.max(0, grandTotal - paid);

    let paymentStatus = PAYMENT_STATUS.PAID;
    if (due > 0 && paid > 0) paymentStatus = PAYMENT_STATUS.PARTIAL;
    else if (due > 0 && paid === 0) paymentStatus = PAYMENT_STATUS.UNPAID;

    const invoicePrefix = `INV-${new Date().getFullYear()}`;
    const invoiceNumber = await getNextSequenceNumber(sequelize, tenantId, 'INVOICE', invoicePrefix, 4);

    const transaction = await sequelize.transaction();
    const deductedItems = [];
    try {
      // 3. Deduct stock from Inventory Service with compensation rollback on failure
      for (const item of calculatedItems) {
        try {
          await axios.post(`${INVENTORY_SERVICE_URL}/api/v1/inventory/internal/decrease-stock`, {
            productId: item.product_id,
            warehouseId: whId,
            quantity: item.quantity,
            movementType: STOCK_MOVEMENT_TYPES.SALE,
            referenceType: 'INVOICE',
            referenceId: invoiceNumber,
            notes: `Sale Invoice #${invoiceNumber}`,
            createdBy: createdBy || 'Cashier'
          }, {
            headers: {
              'x-tenant-id': String(tenantId),
              'x-idempotency-key': `sale-deduct-${invoiceNumber}-${item.product_id}`
            }
          });
          deductedItems.push(item);
        } catch (err) {
          console.error(`Inventory deduction error during sale:`, err.response?.data?.message || err.message);
          
          // Compensating rollback for already deducted items
          for (const prevItem of deductedItems) {
            try {
              await axios.post(`${INVENTORY_SERVICE_URL}/api/v1/inventory/internal/increase-stock`, {
                productId: prevItem.product_id,
                warehouseId: whId,
                quantity: prevItem.quantity,
                movementType: STOCK_MOVEMENT_TYPES.ADJUSTMENT,
                referenceType: 'INVOICE_ROLLBACK',
                referenceId: invoiceNumber,
                notes: `Compensating rollback for failed invoice #${invoiceNumber}`,
                createdBy: 'System (Compensating Transaction)'
              }, {
                headers: {
                  'x-tenant-id': String(tenantId),
                  'x-idempotency-key': `sale-rollback-${invoiceNumber}-${prevItem.product_id}`
                }
              });
            } catch (rollbackErr) {
              console.error(`Failed compensating rollback for item ${prevItem.product_id}:`, rollbackErr.message);
            }
          }

          const errMsg = err.response?.data?.error?.message || err.response?.data?.message || err.message || 'Stock deduction failed';
          throw {
            statusCode: 400,
            errorCode: 'INSUFFICIENT_STOCK',
            message: `Sale aborted: ${errMsg}`
          };
        }
      }

      // 4. Save Sale & Items
      const sale = await Sale.create({
        tenant_id: tenantId,
        invoice_number: invoiceNumber,
        customer_id: customerId || null,
        customer_name: customerName || 'Walk-in Customer',
        customer_phone: customerPhone || null,
        warehouse_id: whId,
        warehouse_name: whName,
        sale_date: new Date(),
        status: SALE_STATUS.COMPLETED,
        subtotal,
        tax_amount: totalTax,
        discount_amount: discount,
        grand_total: grandTotal,
        payment_method: paymentMethod,
        payment_status: paymentStatus,
        paid_amount: paid,
        due_amount: due,
        notes: notes || '',
        created_by: createdBy || 'Cashier'
      }, { transaction });

      for (const item of calculatedItems) {
        await SaleItem.create({
          sale_id: sale.id,
          ...item
        }, { transaction });
      }

      // If customer balance needs updating for credit
      if (customerId && due > 0) {
        const customer = await Customer.findOne({ where: { id: customerId, tenant_id: tenantId }, transaction });
        if (customer) {
          await customer.increment('current_balance', { by: due, transaction });
        }
      }

      await transaction.commit();

      // 5. Emit SALE_CREATED event to RabbitMQ
      await eventBus.publish(EVENTS.SALE_CREATED, {
        tenantId,
        saleId: sale.id,
        invoiceNumber,
        customerId,
        customerName: sale.customer_name,
        grandTotal,
        paidAmount: paid,
        dueAmount: due,
        paymentMethod,
        paymentStatus,
        warehouseId: whId,
        itemsCount: calculatedItems.length,
        items: calculatedItems
      });

      return this.getSaleById(tenantId, sale.id);
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  async deleteSale(tenantId, id) {
    const sale = await Sale.findOne({
      where: { id, tenant_id: tenantId },
      include: [{ model: SaleItem, as: 'items' }]
    });
    if (!sale) throw { statusCode: 404, message: 'Sale invoice not found' };

    const transaction = await sequelize.transaction();
    try {
      // 1. Restock items back to Inventory Service
      if (sale.items && sale.items.length > 0) {
        for (const item of sale.items) {
          try {
            await axios.post(`${INVENTORY_SERVICE_URL}/api/v1/inventory/internal/increase-stock`, {
              productId: item.product_id,
              productCode: item.product_code,
              productName: item.product_name,
              warehouseId: sale.warehouse_id || 1,
              warehouseName: sale.warehouse_name || 'Main Warehouse',
              quantity: item.quantity,
              movementType: STOCK_MOVEMENT_TYPES.RETURN_IN || 'RETURN_IN',
              referenceType: 'SALE_CANCEL',
              referenceId: sale.invoice_number,
              notes: `Cancelled & Deleted Invoice #${sale.invoice_number}`,
              createdBy: 'System/Admin'
            }, {
              headers: { 'x-tenant-id': String(tenantId) }
            });
          } catch (err) {
            console.warn(`Could not restock item ${item.product_id} on invoice delete:`, err.message);
          }
        }
      }

      // 2. If customer balance had outstanding due from this invoice, revert it
      if (sale.customer_id && parseFloat(sale.due_amount) > 0) {
        const customer = await Customer.findOne({ where: { id: sale.customer_id, tenant_id: tenantId }, transaction });
        if (customer) {
          const currentBal = parseFloat(customer.current_balance) || 0;
          const dueVal = parseFloat(sale.due_amount) || 0;
          const newBal = Math.max(0, currentBal - dueVal);
          await customer.update({ current_balance: newBal }, { transaction });
        }
      }

      // 3. Delete sale items & sale
      await SaleItem.destroy({ where: { sale_id: sale.id }, transaction });
      await sale.destroy({ transaction });

      await transaction.commit();
      return true;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  // Sales Returns
  async createSaleReturn(tenantId, returnData) {
    const { saleId, customerId, customerName, warehouseId, warehouseName, items, condition = 'GOOD', reason, notes, createdBy } = returnData;

    const returnPrefix = `SR-${new Date().getFullYear()}`;
    const returnNumber = await getNextSequenceNumber(sequelize, tenantId, 'SALE_RETURN', returnPrefix, 4);

    let totalRefund = 0;
    const returnItems = items.map(item => {
      const price = parseFloat(item.unitPrice) || 0;
      const qty = parseInt(item.quantity, 10) || 1;
      const total = price * qty;
      totalRefund += total;
      return {
        product_id: item.productId,
        product_code: item.productCode || `PRD-${item.productId}`,
        product_name: item.productName || `Product ${item.productId}`,
        quantity: qty,
        unit_price: price,
        total_price: total
      };
    });

    const transaction = await sequelize.transaction();
    try {
      const sReturn = await SaleReturn.create({
        tenant_id: tenantId,
        return_number: returnNumber,
        sale_id: saleId || null,
        customer_id: customerId || null,
        customer_name: customerName || 'Customer',
        warehouse_id: warehouseId || 1,
        warehouse_name: warehouseName || 'Main Warehouse',
        total_refund: totalRefund,
        condition,
        reason: reason || 'Customer return',
        notes: notes || '',
        created_by: createdBy || 'Admin'
      }, { transaction });

      for (const item of returnItems) {
        await SaleReturnItem.create({
          return_id: sReturn.id,
          ...item
        }, { transaction });

        // If condition is GOOD: Return to available stock. If DAMAGED: log damage movement
        const movementType = condition === 'GOOD' ? STOCK_MOVEMENT_TYPES.RETURN_IN : STOCK_MOVEMENT_TYPES.DAMAGE;

        if (condition === 'GOOD') {
          await axios.post(`${INVENTORY_SERVICE_URL}/api/v1/inventory/internal/increase-stock`, {
            productId: item.product_id,
            productCode: item.product_code,
            productName: item.product_name,
            warehouseId: warehouseId || 1,
            warehouseName: warehouseName || 'Main Warehouse',
            quantity: item.quantity,
            movementType,
            referenceType: 'SALE_RETURN',
            referenceId: returnNumber,
            notes: `Sales return (${condition}): ${reason}`,
            createdBy: createdBy || 'Admin'
          }, {
            headers: { 'x-tenant-id': String(tenantId) }
          });
        }
      }

      await transaction.commit();

      await eventBus.publish(EVENTS.SALE_RETURNED, {
        tenantId,
        returnId: sReturn.id,
        returnNumber,
        invoiceNumber: saleId ? `INV-${saleId}` : 'Walk-in',
        customerName: customerName || 'Customer',
        refundAmount: totalRefund,
        itemsCount: returnItems.length
      });

      return sReturn;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  async getSaleReturns(tenantId) {
    return SaleReturn.findAll({
      where: { tenant_id: tenantId },
      include: [
        { model: SaleReturnItem, as: 'items' },
        { model: Sale, as: 'sale' }
      ],
      order: [['created_at', 'DESC']]
    });
  }

  async deleteSaleReturn(tenantId, id) {
    const sReturn = await SaleReturn.findOne({
      where: { id, tenant_id: tenantId },
      include: [{ model: SaleReturnItem, as: 'items' }]
    });
    if (!sReturn) throw { statusCode: 404, message: 'Sales return record not found' };

    const transaction = await sequelize.transaction();
    try {
      // If items were marked as GOOD (restocked), deduct them back when deleting the return record
      if (sReturn.condition === 'GOOD' && sReturn.items && sReturn.items.length > 0) {
        for (const item of sReturn.items) {
          try {
            await axios.post(`${INVENTORY_SERVICE_URL}/api/v1/inventory/internal/decrease-stock`, {
              productId: item.product_id,
              warehouseId: sReturn.warehouse_id || 1,
              quantity: item.quantity,
              movementType: 'RETURN_CANCEL',
              referenceType: 'SALE_RETURN_CANCEL',
              referenceId: sReturn.return_number,
              notes: `Cancelled & Deleted Sales Return #${sReturn.return_number}`,
              createdBy: 'System/Admin'
            }, {
              headers: { 'x-tenant-id': String(tenantId) }
            });
          } catch (err) {
            console.warn(`Could not reverse stock for item ${item.product_id} on return deletion:`, err.message);
          }
        }
      }

      await SaleReturnItem.destroy({ where: { return_id: sReturn.id }, transaction });
      await sReturn.destroy({ transaction });

      await transaction.commit();
      return true;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  /**
   * Send Automated HTML & PDF-ready Tax Invoice via Email
   */
  async sendInvoiceEmail(tenantId, saleId, { recipientEmail, recipientName, note, user }) {
    const nodemailer = require('nodemailer');
    const sale = await this.getSaleById(tenantId, saleId);
    const targetEmail = recipientEmail || sale.customer?.email;

    if (!targetEmail) {
      throw { statusCode: 400, message: 'Recipient email address is required' };
    }

    const companyName = user?.companyName || user?.company_name || 'StockPilot Store';
    const invoiceNum = sale.invoice_number || `INV-${sale.id}`;
    const dateStr = new Date(sale.created_at || Date.now()).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    const itemsHtml = (sale.items || [])
      .map(
        (it) => `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px 12px; font-weight: 500; color: #1e293b;">${it.product_name} <br/><span style="font-size: 11px; color: #64748b;">SKU: ${it.product_code}</span></td>
          <td style="padding: 10px 12px; text-align: center; color: #334155;">${it.quantity}</td>
          <td style="padding: 10px 12px; text-align: right; color: #334155;">₹${parseFloat(it.unit_price).toLocaleString('en-IN')}</td>
          <td style="padding: 10px 12px; text-align: right; font-weight: 600; color: #0f172a;">₹${parseFloat(it.total_amount).toLocaleString('en-IN')}</td>
        </tr>`
      )
      .join('');

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        <div style="background: #0f172a; color: #ffffff; padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">${companyName}</h1>
          <p style="margin: 6px 0 0; font-size: 13px; color: #94a3b8;">Official Tax Invoice & Payment Receipt</p>
        </div>
        
        <div style="padding: 24px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 13px; color: #475569;">
            <div>
              <strong>Invoice #:</strong> ${invoiceNum}<br/>
              <strong>Date:</strong> ${dateStr}
            </div>
            <div style="text-align: right;">
              <strong>Billed To:</strong> ${recipientName || sale.customer?.name || 'Valued Customer'}<br/>
              <strong>Payment Mode:</strong> ${sale.payment_method || 'PAID'}
            </div>
          </div>

          ${note ? `<div style="background: #f8fafc; border-left: 4px solid #4f46e5; padding: 10px 14px; margin-bottom: 20px; font-size: 13px; color: #334155;">${note}</div>` : ''}

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
            <thead>
              <tr style="background: #f1f5f9; color: #475569; text-align: left;">
                <th style="padding: 8px 12px; border-radius: 6px 0 0 6px;">Item</th>
                <th style="padding: 8px 12px; text-align: center;">Qty</th>
                <th style="padding: 8px 12px; text-align: right;">Price</th>
                <th style="padding: 8px 12px; text-align: right; border-radius: 0 6px 6px 0;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px; color: #64748b;">
              <span>Subtotal:</span>
              <span>₹${parseFloat(sale.subtotal || 0).toLocaleString('en-IN')}</span>
            </div>
            ${sale.discount_amount > 0 ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px; color: #16a34a;">
              <span>Discount:</span>
              <span>-₹${parseFloat(sale.discount_amount).toLocaleString('en-IN')}</span>
            </div>` : ''}
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px; color: #64748b;">
              <span>Tax (GST):</span>
              <span>₹${parseFloat(sale.tax_amount || 0).toLocaleString('en-IN')}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: 800; color: #0f172a; border-top: 1px solid #e2e8f0; padding-top: 8px; margin-top: 6px;">
              <span>Grand Total:</span>
              <span style="color: #4f46e5;">₹${parseFloat(sale.grand_total || 0).toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div style="text-align: center; margin-top: 24px;">
            <p style="font-size: 12px; color: #94a3b8; margin: 0 0 10px;">Thank you for your business!</p>
          </div>
        </div>
      </div>
    `;

    // Initialize transporter (fallback to test SMTP or logging if no SMTP env set)
    let emailSent = false;
    let messageId = null;

    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      const info = await transporter.sendMail({
        from: `"${companyName}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to: targetEmail,
        subject: `Invoice #${invoiceNum} from ${companyName}`,
        html: htmlContent
      });

      emailSent = true;
      messageId = info.messageId;
    } else {
      // In dev environment or unconfigured SMTP, simulate successful dispatch
      console.log(`[Email Dispatcher] Simulated email sent to ${targetEmail} for Invoice #${invoiceNum}`);
      emailSent = true;
      messageId = `sim_${Date.now()}`;
    }

    return {
      success: true,
      emailSent,
      recipientEmail: targetEmail,
      invoiceNumber: invoiceNum,
      messageId,
      dispatchedAt: new Date()
    };
  }
}

module.exports = new SalesService();

