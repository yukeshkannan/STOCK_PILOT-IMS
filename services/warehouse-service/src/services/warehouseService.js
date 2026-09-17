const axios = require('axios');
const { Warehouse, StockTransfer, StockTransferItem, sequelize } = require('../models');
const { TRANSFER_STATUS, STOCK_MOVEMENT_TYPES, eventBus, EVENTS, getNextSequenceNumber } = require('@stockpilot/common');

const INVENTORY_SERVICE_URL = process.env.INVENTORY_SERVICE_URL || 'http://localhost:5004';

class WarehouseService {
  async getWarehouses(tenantId) {
    return Warehouse.findAll({
      where: { tenant_id: tenantId },
      order: [['is_default', 'DESC'], ['name', 'ASC']]
    });
  }

  async getWarehouseById(tenantId, id) {
    const warehouse = await Warehouse.findOne({ where: { id, tenant_id: tenantId } });
    if (!warehouse) throw { statusCode: 404, message: 'Warehouse not found' };
    return warehouse;
  }

  async initDefaultWarehouse({ tenantId, companyName, address, city }) {
    if (!tenantId) return null;
    const [warehouse] = await Warehouse.findOrCreate({
      where: { tenant_id: tenantId, is_default: true },
      defaults: {
        tenant_id: tenantId,
        name: `${companyName || 'Main'} Central Hub`,
        code: 'WH-MAIN',
        address: address || city || 'Central Logistics Facility',
        city: city || '',
        capacity: 10000,
        capacity_unit: 'Pieces (Pcs)',
        is_default: true,
        status: 'ACTIVE'
      }
    });
    return warehouse;
  }


  async createWarehouse(tenantId, data, userPlan = 'PRO') {
    if (userPlan === 'STARTER') {
      const count = await Warehouse.count({ where: { tenant_id: tenantId } });
      if (count >= 1) {
        throw { statusCode: 403, message: 'STARTER Plan allows maximum 1 warehouse location. Please upgrade to PRO Growth Plan to add multi-branch warehouses.' };
      }
    }

    const code = (data.code || data.name.substring(0, 4)).trim().toUpperCase();
    const existing = await Warehouse.findOne({ where: { tenant_id: tenantId, code } });
    if (existing) {
      throw { statusCode: 409, message: `Warehouse code [${code}] already exists` };
    }

    if (data.isDefault) {
      await Warehouse.update({ is_default: false }, { where: { tenant_id: tenantId } });
    }

    return Warehouse.create({
      tenant_id: tenantId,
      name: data.name,
      code,
      address: data.address || '',
      city: data.city || '',
      manager_name: data.managerName || '',
      phone: data.phone || '',
      capacity: data.capacity || 10000,
      capacity_unit: data.capacityUnit || data.capacity_unit || 'Square Feet (Sq. Ft)',
      is_default: !!data.isDefault,
      status: 'ACTIVE'
    });
  }

  async updateWarehouse(tenantId, id, data) {
    const warehouse = await this.getWarehouseById(tenantId, id);

    if (data.code && data.code.trim().toUpperCase() !== warehouse.code) {
      const code = data.code.trim().toUpperCase();
      const existing = await Warehouse.findOne({ where: { tenant_id: tenantId, code } });
      if (existing && existing.id !== warehouse.id) {
        throw { statusCode: 409, message: `Warehouse code [${code}] already exists` };
      }
    }

    const isDefaultVal = data.isDefault !== undefined ? !!data.isDefault : (data.is_default !== undefined ? !!data.is_default : undefined);
    if (isDefaultVal === true && !warehouse.is_default) {
      await Warehouse.update({ is_default: false }, { where: { tenant_id: tenantId } });
    }

    const updatePayload = {};
    if (data.name !== undefined) updatePayload.name = data.name.trim();
    if (data.code !== undefined) updatePayload.code = data.code.trim().toUpperCase();
    if (data.address !== undefined) updatePayload.address = data.address;
    if (data.city !== undefined) updatePayload.city = data.city;
    if (data.managerName !== undefined) updatePayload.manager_name = data.managerName;
    else if (data.manager_name !== undefined) updatePayload.manager_name = data.manager_name;
    if (data.phone !== undefined) updatePayload.phone = data.phone;
    if (data.capacity !== undefined) updatePayload.capacity = parseInt(data.capacity, 10) || 10000;
    if (data.capacityUnit !== undefined) updatePayload.capacity_unit = data.capacityUnit;
    else if (data.capacity_unit !== undefined) updatePayload.capacity_unit = data.capacity_unit;
    if (isDefaultVal !== undefined) updatePayload.is_default = isDefaultVal;
    if (data.status !== undefined) updatePayload.status = data.status;

    await warehouse.update(updatePayload);
    return warehouse;
  }

  async deleteWarehouse(tenantId, id) {
    const warehouse = await this.getWarehouseById(tenantId, id);
    if (warehouse.is_default) {
      const count = await Warehouse.count({ where: { tenant_id: tenantId } });
      if (count > 1) {
        throw { statusCode: 400, message: 'Cannot delete the default warehouse hub. Please set another warehouse as default first.' };
      }
    }

    // Check if there are active stock transfer records associated with this warehouse
    const { Op } = require('sequelize');
    const transferCount = await StockTransfer.count({
      where: {
        tenant_id: tenantId,
        [Op.or]: [
          { from_warehouse_id: warehouse.id },
          { to_warehouse_id: warehouse.id }
        ]
      }
    });

    if (transferCount > 0) {
      throw {
        statusCode: 400,
        message: `Cannot delete warehouse [${warehouse.name}] because it is linked to ${transferCount} stock transfer records. Please set its status to INACTIVE instead to retain audit trail.`
      };
    }

    try {
      await warehouse.destroy();
      return true;
    } catch (err) {
      if (err.name === 'SequelizeForeignKeyConstraintError') {
        throw {
          statusCode: 400,
          message: `Cannot delete warehouse [${warehouse.name}] because active inventory or order history references it. You can set its operational status to INACTIVE instead.`
        };
      }
      throw err;
    }
  }

  // Stock Transfers
  async getTransfers(tenantId, { status, page = 1, limit = 50 }) {
    const where = { tenant_id: tenantId };
    if (status) where.status = status;

    const offset = (page - 1) * limit;
    const { rows, count } = await StockTransfer.findAndCountAll({
      where,
      include: [
        { model: StockTransferItem, as: 'items' },
        { model: Warehouse, as: 'fromWarehouse', attributes: ['id', 'name', 'code'] },
        { model: Warehouse, as: 'toWarehouse', attributes: ['id', 'name', 'code'] }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    });

    return { transfers: rows, total: count };
  }

  async getTransferById(tenantId, id) {
    const transfer = await StockTransfer.findOne({
      where: { id, tenant_id: tenantId },
      include: [
        { model: StockTransferItem, as: 'items' },
        { model: Warehouse, as: 'fromWarehouse' },
        { model: Warehouse, as: 'toWarehouse' }
      ]
    });
    if (!transfer) throw { statusCode: 404, message: 'Transfer record not found' };
    return transfer;
  }

  async createTransfer(tenantId, {
    fromWarehouseId,
    toWarehouseId,
    items,
    notes,
    requestedBy,
    carrierType,
    carrierName,
    vehicleNo,
    driverName,
    driverPhone,
    trackingNumber,
    estimatedArrival
  }) {
    if (fromWarehouseId === toWarehouseId) {
      throw { statusCode: 400, message: 'Source and Destination warehouses must be different' };
    }

    if (!items || !items.length) {
      throw { statusCode: 400, message: 'At least one item is required for transfer' };
    }

    const fromWh = await this.getWarehouseById(tenantId, fromWarehouseId);
    const toWh = await this.getWarehouseById(tenantId, toWarehouseId);

    const transferPrefix = `TRF-${new Date().getFullYear()}`;
    const transferNumber = await getNextSequenceNumber(sequelize, tenantId, 'STOCK_TRANSFER', transferPrefix, 4);

    const transaction = await sequelize.transaction();
    try {
      const transfer = await StockTransfer.create({
        tenant_id: tenantId,
        transfer_number: transferNumber,
        from_warehouse_id: fromWarehouseId,
        to_warehouse_id: toWarehouseId,
        status: TRANSFER_STATUS.PENDING,
        requested_by: requestedBy || 'User',
        notes: notes || '',
        carrier_type: carrierType || 'IN_HOUSE',
        carrier_name: carrierName || '',
        vehicle_no: vehicleNo || '',
        driver_name: driverName || '',
        driver_phone: driverPhone || '',
        tracking_number: trackingNumber || '',
        estimated_arrival: estimatedArrival || ''
      }, { transaction });

      for (const item of items) {
        await StockTransferItem.create({
          transfer_id: transfer.id,
          product_id: item.productId,
          product_code: item.productCode || `PRD-${item.productId}`,
          product_name: item.productName || `Product ${item.productId}`,
          quantity: item.quantity
        }, { transaction });
      }

      await transaction.commit();

      await eventBus.publish(EVENTS.TRANSFER_REQUESTED, {
        tenantId,
        transferId: transfer.id,
        transferNumber,
        fromWarehouse: fromWh.name,
        toWarehouse: toWh.name,
        itemsCount: items.length
      });

      return this.getTransferById(tenantId, transfer.id);
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  async approveTransfer(tenantId, transferId, approvedBy) {
    const transfer = await this.getTransferById(tenantId, transferId);
    if (transfer.status !== TRANSFER_STATUS.PENDING) {
      throw { statusCode: 400, message: `Cannot approve transfer in ${transfer.status} status` };
    }

    // Check stock availability in source warehouse
    try {
      const stockCheckItems = transfer.items.map(item => ({
        productId: item.product_id,
        warehouseId: transfer.from_warehouse_id,
        quantity: item.quantity
      }));

      const checkRes = await axios.post(`${INVENTORY_SERVICE_URL}/api/v1/inventory/internal/check-stock`, {
        items: stockCheckItems
      }, {
        headers: { 'x-tenant-id': String(tenantId) }
      });

      if (!checkRes.data?.data?.allAvailable) {
        const unavailable = (checkRes.data?.data?.items || []).find(i => !i.isAvailable);
        const detailMsg = unavailable
          ? `Insufficient stock for "${unavailable.productName || 'Product'}" in source warehouse (Requested: ${unavailable.requestedQuantity}, Available: ${unavailable.availableQuantity})`
          : 'Insufficient stock in source warehouse to approve transfer';
        throw { statusCode: 400, message: detailMsg };
      }
    } catch (err) {
      if (err.statusCode) throw err;
      console.warn('Inventory check notice:', err.message);
    }

    await transfer.update({
      status: TRANSFER_STATUS.APPROVED,
      approved_by: approvedBy || 'Manager'
    });

    await eventBus.publish(EVENTS.TRANSFER_APPROVED, {
      tenantId,
      transferId: transfer.id,
      transferNumber: transfer.transfer_number
    });

    return this.getTransferById(tenantId, transfer.id);
  }

  async dispatchTransfer(tenantId, transferId, dispatchData = {}) {
    const transfer = await this.getTransferById(tenantId, transferId);
    if (transfer.status !== TRANSFER_STATUS.APPROVED && transfer.status !== TRANSFER_STATUS.PENDING) {
      throw { statusCode: 400, message: `Cannot dispatch transfer in ${transfer.status} status` };
    }

    // 1. Deduct stock from source warehouse and put in transit
    for (const item of transfer.items) {
      try {
        await axios.post(`${INVENTORY_SERVICE_URL}/api/v1/inventory/internal/decrease-stock`, {
          productId: item.product_id,
          warehouseId: transfer.from_warehouse_id,
          quantity: item.quantity,
          movementType: STOCK_MOVEMENT_TYPES.TRANSFER_OUT,
          referenceType: 'TRANSFER',
          referenceId: transfer.transfer_number,
          notes: `Dispatched in-transit to ${transfer.toWarehouse ? transfer.toWarehouse.name : 'Warehouse ' + transfer.to_warehouse_id} via ${dispatchData.vehicleNo || transfer.vehicle_no || 'Fleet'}`,
          createdBy: dispatchData.dispatchedBy || transfer.approved_by || transfer.requested_by
        }, {
          headers: { 'x-tenant-id': String(tenantId) }
        });
      } catch (err) {
        console.warn('Decrease stock during dispatch notice:', err.message);
      }
    }

    const updatePayload = {
      status: TRANSFER_STATUS.IN_TRANSIT,
      dispatched_at: new Date()
    };

    if (dispatchData.carrierType) updatePayload.carrier_type = dispatchData.carrierType;
    if (dispatchData.carrierName) updatePayload.carrier_name = dispatchData.carrierName;
    if (dispatchData.vehicleNo) updatePayload.vehicle_no = dispatchData.vehicleNo;
    if (dispatchData.driverName) updatePayload.driver_name = dispatchData.driverName;
    if (dispatchData.driverPhone) updatePayload.driver_phone = dispatchData.driverPhone;
    if (dispatchData.trackingNumber) updatePayload.tracking_number = dispatchData.trackingNumber;
    if (dispatchData.estimatedArrival) updatePayload.estimated_arrival = dispatchData.estimatedArrival;

    await transfer.update(updatePayload);

    await eventBus.publish(EVENTS.TRANSFER_DISPATCHED, {
      tenantId,
      transferId: transfer.id,
      transferNumber: transfer.transfer_number,
      fromWarehouse: transfer.fromWarehouse ? transfer.fromWarehouse.name : '',
      toWarehouse: transfer.toWarehouse ? transfer.toWarehouse.name : '',
      vehicleNo: updatePayload.vehicle_no || transfer.vehicle_no,
      driverName: updatePayload.driver_name || transfer.driver_name
    });

    return this.getTransferById(tenantId, transfer.id);
  }

  async receiveTransfer(tenantId, transferId, receiveData = {}) {
    const transfer = await this.getTransferById(tenantId, transferId);
    if (transfer.status === TRANSFER_STATUS.COMPLETED) {
      throw { statusCode: 400, message: 'Transfer is already marked as completed' };
    }
    if (transfer.status === TRANSFER_STATUS.REJECTED) {
      throw { statusCode: 400, message: 'Cannot receive a rejected transfer' };
    }

    // If it skipped the IN_TRANSIT dispatch step, deduct from source first
    if (transfer.status !== TRANSFER_STATUS.IN_TRANSIT) {
      for (const item of transfer.items) {
        try {
          await axios.post(`${INVENTORY_SERVICE_URL}/api/v1/inventory/internal/decrease-stock`, {
            productId: item.product_id,
            warehouseId: transfer.from_warehouse_id,
            quantity: item.quantity,
            movementType: STOCK_MOVEMENT_TYPES.TRANSFER_OUT,
            referenceType: 'TRANSFER',
            referenceId: transfer.transfer_number,
            notes: `Transfer to ${transfer.toWarehouse ? transfer.toWarehouse.name : 'Warehouse ' + transfer.to_warehouse_id}`,
            createdBy: transfer.approved_by || transfer.requested_by
          }, {
            headers: { 'x-tenant-id': String(tenantId) }
          });
        } catch (err) {
          console.warn('Source stock deduction warning:', err.message);
        }
      }
    }

    // Increase stock in destination warehouse
    for (const item of transfer.items) {
      try {
        await axios.post(`${INVENTORY_SERVICE_URL}/api/v1/inventory/internal/increase-stock`, {
          productId: item.product_id,
          productCode: item.product_code,
          productName: item.product_name,
          warehouseId: transfer.to_warehouse_id,
          warehouseName: transfer.toWarehouse ? transfer.toWarehouse.name : `Warehouse ${transfer.to_warehouse_id}`,
          quantity: item.quantity,
          movementType: STOCK_MOVEMENT_TYPES.TRANSFER_IN,
          referenceType: 'TRANSFER',
          referenceId: transfer.transfer_number,
          notes: `Received from ${transfer.fromWarehouse ? transfer.fromWarehouse.name : 'Warehouse ' + transfer.from_warehouse_id} via ${transfer.vehicle_no || 'Fleet'}`,
          createdBy: receiveData.receivedBy || transfer.approved_by || transfer.requested_by
        }, {
          headers: { 'x-tenant-id': String(tenantId) }
        });
      } catch (err) {
        console.warn('Destination stock increase warning:', err.message);
      }
    }

    await transfer.update({
      status: TRANSFER_STATUS.COMPLETED,
      received_by: receiveData.receivedBy || 'Warehouse Manager',
      received_at: new Date(),
      completed_at: new Date()
    });

    await eventBus.publish(EVENTS.TRANSFER_COMPLETED, {
      tenantId,
      transferId: transfer.id,
      transferNumber: transfer.transfer_number,
      fromWarehouse: transfer.fromWarehouse ? transfer.fromWarehouse.name : '',
      toWarehouse: transfer.toWarehouse ? transfer.toWarehouse.name : ''
    });

    return this.getTransferById(tenantId, transfer.id);
  }

  async completeTransfer(tenantId, transferId, data = {}) {
    return this.receiveTransfer(tenantId, transferId, data);
  }

  async rejectTransfer(tenantId, transferId) {
    const transfer = await this.getTransferById(tenantId, transferId);
    await transfer.update({ status: TRANSFER_STATUS.REJECTED });
    await eventBus.publish(EVENTS.TRANSFER_REJECTED, {
      tenantId,
      transferId: transfer.id,
      transferNumber: transfer.transfer_number
    });
    return transfer;
  }

  async deleteTransfer(tenantId, transferId) {
    const transfer = await this.getTransferById(tenantId, transferId);
    const transaction = await sequelize.transaction();
    try {
      await StockTransferItem.destroy({ where: { transfer_id: transfer.id }, transaction });
      await transfer.destroy({ transaction });
      await transaction.commit();
      return true;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
}

module.exports = new WarehouseService();
