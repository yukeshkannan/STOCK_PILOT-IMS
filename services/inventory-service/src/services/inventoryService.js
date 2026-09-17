const { Op } = require('sequelize');
const { Stock, StockMovement, StockAdjustment, AuditLog, sequelize } = require('../models');
const { STOCK_MOVEMENT_TYPES, eventBus, EVENTS } = require('@stockpilot/common');

class InventoryService {
  async getStocks(tenantId, { warehouseId, productId, lowStockOnly, outOfStockOnly, search, page = 1, limit = 50 }) {
    // Sync/cleanup catalog changes and ensure stock thresholds are always updated from catalog
    try {
      const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:5003';
      const pRes = await fetch(`${PRODUCT_SERVICE_URL}/api/v1/products?limit=1000`, {
        headers: {
          'x-tenant-id': String(tenantId),
          'x-user-role': 'ADMIN',
          'x-user-permissions': '["*"]'
        }
      });
      const pData = await pRes.json();
      if (pData?.data && Array.isArray(pData.data)) {
        const validIds = pData.data.map(p => p.id);
        if (validIds.length > 0) {
          await Stock.destroy({
            where: {
              tenant_id: tenantId,
              product_id: { [Op.notIn]: validIds }
            }
          });

          // Sync current minimum_stock and details from product catalog
          for (const p of pData.data) {
            await Stock.update({
              minimum_stock: p.minimum_stock !== undefined ? parseInt(p.minimum_stock, 10) : 5,
              product_name: p.name,
              product_code: p.product_code
            }, {
              where: {
                tenant_id: tenantId,
                product_id: p.id
              }
            });
          }
        } else {
          await Stock.destroy({
            where: { tenant_id: tenantId }
          });
        }
      }
    } catch (e) {
      // Cross-service fallback
    }

    const where = { tenant_id: tenantId };

    if (warehouseId) where.warehouse_id = warehouseId;
    if (productId) where.product_id = productId;

    if (lowStockOnly) {
      where[Op.and] = [
        sequelize.where(sequelize.col('current_stock'), '<=', sequelize.col('minimum_stock')),
        { current_stock: { [Op.gt]: 0 } }
      ];
    } else if (outOfStockOnly) {
      where.current_stock = { [Op.lte]: 0 };
    }

    if (search) {
      where[Op.or] = [
        { product_name: { [Op.like]: `%${search}%` } },
        { product_code: { [Op.like]: `%${search}%` } },
        { warehouse_name: { [Op.like]: `%${search}%` } }
      ];
    }

    const offset = (page - 1) * limit;
    const { rows, count } = await Stock.findAndCountAll({
      where,
      order: [['current_stock', 'ASC']],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    });

    // Check if any item in current stock is low and emit alert if needed
    for (const item of rows) {
      if (item.current_stock > 0 && item.current_stock <= item.minimum_stock) {
        eventBus.publish(EVENTS.STOCK_LOW, {
          tenantId,
          productId: item.product_id,
          productCode: item.product_code,
          productName: item.product_name,
          warehouseId: item.warehouse_id,
          warehouseName: item.warehouse_name,
          currentStock: item.current_stock,
          minimumStock: item.minimum_stock
        }).catch(() => {});
      } else if (item.current_stock <= 0) {
        eventBus.publish(EVENTS.STOCK_OUT, {
          tenantId,
          productId: item.product_id,
          productCode: item.product_code,
          productName: item.product_name,
          warehouseId: item.warehouse_id,
          warehouseName: item.warehouse_name
        }).catch(() => {});
      }
    }

    return { stocks: rows, total: count };
  }

  async removeProductStock(tenantId, productId) {
    await Stock.destroy({
      where: { tenant_id: tenantId, product_id: productId }
    });
    return true;
  }

  async updateProductStockInfo(tenantId, productId, { productCode, productName, minimumStock }) {
    const updateData = {};
    if (productCode) updateData.product_code = productCode;
    if (productName) updateData.product_name = productName;
    if (minimumStock !== undefined) updateData.minimum_stock = parseInt(minimumStock, 10);

    if (Object.keys(updateData).length > 0) {
      await Stock.update(updateData, {
        where: { tenant_id: tenantId, product_id: productId }
      });
    }
    return true;
  }

  async getStockByProductAndWarehouse(tenantId, productId, warehouseId) {
    let stock = await Stock.findOne({
      where: { tenant_id: tenantId, product_id: productId, warehouse_id: warehouseId }
    });
    return stock;
  }

  /**
   * Initialize Stock for a new or existing product in a warehouse
   */
  async initStock(tenantId, { productId, productCode, productName, warehouseId, warehouseName, minimumStock, initialStock = 0, createdBy = 'System' }) {
    const whId = warehouseId ? parseInt(warehouseId, 10) : 1;
    const whName = warehouseName || 'Main Warehouse';
    const initQty = parseInt(initialStock, 10) || 0;
    const minStock = minimumStock !== undefined ? parseInt(minimumStock, 10) : 5;

    const transaction = await sequelize.transaction();
    try {
      let [stock, created] = await Stock.findOrCreate({
        where: { tenant_id: tenantId, product_id: productId, warehouse_id: whId },
        defaults: {
          tenant_id: tenantId,
          product_id: productId,
          product_code: productCode || `PRD-${productId}`,
          product_name: productName || `Product ${productId}`,
          warehouse_id: whId,
          warehouse_name: whName,
          current_stock: initQty,
          reserved_stock: 0,
          available_stock: initQty,
          minimum_stock: minStock
        },
        transaction
      });

      if (!created) {
        await stock.update({
          product_name: productName || stock.product_name,
          product_code: productCode || stock.product_code,
          minimum_stock: minStock
        }, { transaction });
      }

      if (created && initQty > 0) {
        // Log opening movement
        await StockMovement.create({
          tenant_id: tenantId,
          product_id: productId,
          product_code: productCode || stock.product_code,
          product_name: productName || stock.product_name,
          warehouse_id: whId,
          warehouse_name: whName,
          movement_type: STOCK_MOVEMENT_TYPES.ADJUSTMENT,
          quantity: initQty,
          balance_after: initQty,
          reference_type: 'INITIAL_STOCK',
          reference_id: `INIT-${productId}`,
          notes: 'Initial Opening Stock Balance',
          created_by: createdBy
        }, { transaction });
      }

      await transaction.commit();
      return stock;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  /**
   * Internal & Synchronous Stock Check
   */
  async checkAvailability(tenantId, items = []) {
    const results = [];
    let allAvailable = true;

    for (const item of items) {
      let stock = await Stock.findOne({
        where: {
          tenant_id: tenantId,
          product_id: item.productId,
          warehouse_id: item.warehouseId
        }
      });

      if (!stock) {
        stock = await Stock.findOne({
          where: {
            tenant_id: tenantId,
            product_id: item.productId
          },
          order: [['available_stock', 'DESC']]
        });
      }

      const currentAvailable = stock ? stock.available_stock : 0;
      const isEnough = currentAvailable >= item.quantity;
      if (!isEnough) allAvailable = false;

      results.push({
        productId: item.productId,
        productCode: item.productCode || (stock ? stock.product_code : ''),
        productName: item.productName || (stock ? stock.product_name : ''),
        warehouseId: item.warehouseId,
        requestedQuantity: item.quantity,
        availableQuantity: currentAvailable,
        isAvailable: isEnough
      });
    }

    return { allAvailable, items: results };
  }

  /**
   * Increase Stock (Purchase approval, Transfer IN, Customer Return IN)
   * Concurrency-safe with Pessimistic Locking
   */
  async increaseStock(tenantId, { productId, productCode, productName, warehouseId, warehouseName, quantity, movementType, referenceType, referenceId, notes, createdBy }) {
    const qty = parseInt(quantity, 10);
    if (qty <= 0) throw { statusCode: 400, message: 'Quantity must be positive' };

    const transaction = await sequelize.transaction();
    try {
      let [stock] = await Stock.findOrCreate({
        where: { tenant_id: tenantId, product_id: productId, warehouse_id: warehouseId },
        defaults: {
          tenant_id: tenantId,
          product_id: productId,
          product_code: productCode || `PRD-${productId}`,
          product_name: productName || `Product ${productId}`,
          warehouse_id: warehouseId,
          warehouse_name: warehouseName || `Warehouse ${warehouseId}`,
          current_stock: 0,
          reserved_stock: 0,
          available_stock: 0
        },
        transaction
      });

      // Acquire exclusive row lock (SELECT ... FOR UPDATE)
      stock = await Stock.findOne({
        where: { id: stock.id, tenant_id: tenantId },
        transaction,
        lock: transaction.LOCK.UPDATE
      });

      const newCurrent = stock.current_stock + qty;
      const newAvailable = newCurrent - stock.reserved_stock;

      await stock.update({
        current_stock: newCurrent,
        available_stock: newAvailable,
        product_code: productCode || stock.product_code,
        product_name: productName || stock.product_name,
        warehouse_name: warehouseName || stock.warehouse_name
      }, { transaction });

      // Log movement
      const movement = await StockMovement.create({
        tenant_id: tenantId,
        product_id: productId,
        product_code: stock.product_code,
        product_name: stock.product_name,
        warehouse_id: warehouseId,
        warehouse_name: stock.warehouse_name,
        movement_type: movementType || STOCK_MOVEMENT_TYPES.PURCHASE,
        quantity: qty,
        balance_after: newCurrent,
        reference_type: referenceType || 'PURCHASE',
        reference_id: referenceId ? String(referenceId) : null,
        notes: notes || '',
        created_by: createdBy || 'System'
      }, { transaction });

      await transaction.commit();

      await eventBus.publish(EVENTS.STOCK_UPDATED, {
        tenantId,
        productId,
        warehouseId,
        currentStock: newCurrent,
        availableStock: newAvailable
      });

      return { stock, movement };
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  /**
   * Decrease Stock (Sale confirmation, Transfer OUT, Purchase Return OUT, Damage)
   * Concurrency-safe with Pessimistic Locking (SELECT ... FOR UPDATE) and Atomic Check
   */
  async decreaseStock(tenantId, { productId, warehouseId, quantity, movementType, referenceType, referenceId, notes, createdBy }) {
    const qty = parseInt(quantity, 10);
    if (qty <= 0) throw { statusCode: 400, message: 'Quantity must be positive' };

    const transaction = await sequelize.transaction();
    try {
      let stock = null;
      if (warehouseId) {
        stock = await Stock.findOne({
          where: { tenant_id: tenantId, product_id: productId, warehouse_id: warehouseId },
          transaction,
          lock: transaction.LOCK.UPDATE
        });
      }

      if (!stock) {
        stock = await Stock.findOne({
          where: { tenant_id: tenantId, product_id: productId },
          order: [['available_stock', 'DESC']],
          transaction,
          lock: transaction.LOCK.UPDATE
        });
      }

      if (!stock || stock.available_stock < qty) {
        const available = stock ? stock.available_stock : 0;
        throw {
          statusCode: 400,
          errorCode: 'INSUFFICIENT_STOCK',
          message: `Insufficient stock for product [${stock ? stock.product_name : productId}]. Requested: ${qty}, Available: ${available}`
        };
      }

      // Atomic conditional update to eliminate race condition / overselling
      const [affectedRows] = await Stock.update({
        current_stock: sequelize.literal(`current_stock - ${qty}`),
        available_stock: sequelize.literal(`available_stock - ${qty}`)
      }, {
        where: {
          id: stock.id,
          tenant_id: tenantId,
          available_stock: { [Op.gte]: qty }
        },
        transaction
      });

      if (affectedRows === 0) {
        throw {
          statusCode: 400,
          errorCode: 'INSUFFICIENT_STOCK',
          message: `Concurrency conflict or insufficient stock for product [${stock.product_name || productId}].`
        };
      }

      // Reload fresh values within the active lock
      await stock.reload({ transaction });
      const newCurrent = stock.current_stock;
      const newAvailable = stock.available_stock;

      // Log movement
      const movement = await StockMovement.create({
        tenant_id: tenantId,
        product_id: productId,
        product_code: stock.product_code,
        product_name: stock.product_name,
        warehouse_id: stock.warehouse_id,
        warehouse_name: stock.warehouse_name,
        movement_type: movementType || STOCK_MOVEMENT_TYPES.SALE,
        quantity: -qty,
        balance_after: newCurrent,
        reference_type: referenceType || 'SALE',
        reference_id: referenceId ? String(referenceId) : null,
        notes: notes || '',
        created_by: createdBy || 'System'
      }, { transaction });

      await transaction.commit();

      // Check Low / Out of Stock alerts
      if (newCurrent <= 0) {
        await eventBus.publish(EVENTS.STOCK_OUT, {
          tenantId,
          productId,
          productCode: stock.product_code,
          productName: stock.product_name,
          warehouseId: stock.warehouse_id,
          warehouseName: stock.warehouse_name
        });
      } else if (newCurrent <= stock.minimum_stock) {
        await eventBus.publish(EVENTS.STOCK_LOW, {
          tenantId,
          productId,
          productCode: stock.product_code,
          productName: stock.product_name,
          warehouseId: stock.warehouse_id,
          warehouseName: stock.warehouse_name,
          currentStock: newCurrent,
          minimumStock: stock.minimum_stock
        });
      }

      await eventBus.publish(EVENTS.STOCK_UPDATED, {
        tenantId,
        productId,
        warehouseId: stock.warehouse_id,
        currentStock: newCurrent,
        availableStock: newAvailable
      });

      return { stock, movement };
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  /**
   * Manual Stock Adjustment (Concurrency-safe with Pessimistic Locking)
   */
  async adjustStock(tenantId, { productId, warehouseId, adjustmentType, quantity, reason, adjustedBy }) {
    const qty = parseInt(quantity, 10);
    if (isNaN(qty)) throw { statusCode: 400, message: 'Valid quantity is required' };

    const transaction = await sequelize.transaction();
    try {
      let stock = await Stock.findOne({
        where: { tenant_id: tenantId, product_id: productId, warehouse_id: warehouseId },
        transaction,
        lock: transaction.LOCK.UPDATE
      });

      if (!stock) {
        throw { statusCode: 404, message: 'Stock record not found for product in this warehouse' };
      }

      // Check if product still exists in catalog
      try {
        const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:5003';
        const pCheck = await fetch(`${PRODUCT_SERVICE_URL}/api/v1/products/${productId}`, {
          headers: {
            'x-tenant-id': String(tenantId),
            'x-user-role': 'ADMIN',
            'x-user-permissions': '["*"]'
          }
        });
        if (pCheck.status === 404) {
          await Stock.destroy({ where: { tenant_id: tenantId, product_id: productId }, transaction });
          await transaction.commit();
          throw { statusCode: 404, message: 'This product was removed from catalog.' };
        }
      } catch (e) {
        if (e.statusCode === 404) throw e;
      }

      const previousQty = stock.current_stock;
      let newQty = previousQty;

      if (adjustmentType === 'ADD') {
        newQty = previousQty + qty;
      } else if (adjustmentType === 'SUBTRACT') {
        newQty = Math.max(0, previousQty - qty);
      } else if (adjustmentType === 'SET') {
        newQty = Math.max(0, qty);
      } else {
        throw { statusCode: 400, message: 'Invalid adjustment type. Use ADD, SUBTRACT, or SET.' };
      }

      const difference = newQty - previousQty;
      const newAvailable = newQty - stock.reserved_stock;

      await stock.update({
        current_stock: newQty,
        available_stock: newAvailable,
        last_adjusted_at: new Date()
      }, { transaction });

      // Log Adjustment Record
      const adj = await StockAdjustment.create({
        tenant_id: tenantId,
        product_id: productId,
        product_code: stock.product_code,
        warehouse_id: warehouseId,
        previous_quantity: previousQty,
        new_quantity: newQty,
        difference,
        reason: reason || 'Manual stock adjustment',
        adjusted_by: adjustedBy || 'Admin'
      }, { transaction });

      // Log Movement
      await StockMovement.create({
        tenant_id: tenantId,
        product_id: productId,
        product_code: stock.product_code,
        product_name: stock.product_name,
        warehouse_id: warehouseId,
        warehouse_name: stock.warehouse_name,
        movement_type: STOCK_MOVEMENT_TYPES.ADJUSTMENT,
        quantity: difference,
        balance_after: newQty,
        reference_type: 'ADJUSTMENT',
        reference_id: String(adj.id),
        notes: `Adjustment (${adjustmentType}): ${reason}`,
        created_by: adjustedBy || 'Admin'
      }, { transaction });

      await transaction.commit();

      await eventBus.publish(EVENTS.STOCK_ADJUSTMENT, {
        tenantId,
        productId,
        productName: stock.product_name,
        productCode: stock.product_code,
        warehouseId,
        warehouseName: stock.warehouse_name,
        quantity: difference,
        previousQuantity: previousQty,
        newQuantity: newQty,
        reason: reason || 'Audit adjustment'
      });

      return { stock, adjustment: adj };
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  async getMovements(tenantId, { productId, warehouseId, movementType, page = 1, limit = 50 }) {
    const where = { tenant_id: tenantId };
    if (productId) where.product_id = productId;
    if (warehouseId) where.warehouse_id = warehouseId;
    if (movementType) where.movement_type = movementType;

    const offset = (page - 1) * limit;
    const { rows, count } = await StockMovement.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    });

    return { movements: rows, total: count };
  }

  async deleteStock(tenantId, stockId) {
    const stock = await Stock.findOne({ where: { id: stockId, tenant_id: tenantId } });
    if (!stock) {
      throw { statusCode: 404, message: 'Stock record not found' };
    }
    await stock.destroy();
    return { success: true, message: 'Stock record deleted successfully' };
  }

  async deleteMovement(tenantId, movementId) {
    const movement = await StockMovement.findOne({ where: { id: movementId, tenant_id: tenantId } });
    if (!movement) {
      throw { statusCode: 404, message: 'Movement record not found' };
    }
    await movement.destroy();
    return { success: true, message: 'Movement log deleted successfully' };
  }

  /**
   * AI & Sales Velocity Stock Demand Forecasting Engine
   */
  async getForecast(tenantId, { days = 30, warehouseId } = {}) {
    const daysInt = parseInt(days, 10) || 30;
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - daysInt);

    // 1. Fetch current stocks
    const stockWhere = { tenant_id: tenantId };
    if (warehouseId) stockWhere.warehouse_id = warehouseId;
    const stocks = await Stock.findAll({ where: stockWhere });

    // 2. Fetch sale deductions in historical window
    const movementWhere = {
      tenant_id: tenantId,
      movement_type: [STOCK_MOVEMENT_TYPES.SALE, 'SALE', 'DISPATCH'],
      created_at: { [Op.gte]: sinceDate }
    };
    if (warehouseId) movementWhere.warehouse_id = warehouseId;

    const movements = await StockMovement.findAll({
      where: movementWhere,
      attributes: ['product_id', 'quantity', 'created_at']
    });

    // 3. Aggregate sales by product
    const salesByProduct = {};
    for (const m of movements) {
      const pid = m.product_id;
      const soldQty = Math.abs(parseInt(m.quantity, 10) || 0);
      salesByProduct[pid] = (salesByProduct[pid] || 0) + soldQty;
    }

    // 4. Compute forecast metrics per stock item
    const forecastResults = stocks.map((stk) => {
      const totalSold = salesByProduct[stk.product_id] || 0;
      const dailyVelocity = parseFloat((totalSold / Math.max(1, daysInt)).toFixed(2));
      const current = Math.max(0, parseInt(stk.current_stock, 10) || 0);
      const minThreshold = parseInt(stk.minimum_stock, 10) || 5;

      let daysRemaining = 999;
      if (current === 0) {
        daysRemaining = 0;
      } else if (dailyVelocity > 0) {
        daysRemaining = Math.max(0, Math.round(current / dailyVelocity));
      } else {
        daysRemaining = 180; // Plenty / slow moving
      }

      let riskLevel = 'OPTIMAL';
      let riskScore = 1; // 1-5 scale
      if (current <= 0) {
        riskLevel = 'OUT_OF_STOCK';
        riskScore = 5;
      } else if (daysRemaining <= 7 || current <= minThreshold) {
        riskLevel = 'CRITICAL';
        riskScore = 4;
      } else if (daysRemaining <= 15) {
        riskLevel = 'WARNING';
        riskScore = 3;
      } else if (daysRemaining > 90) {
        riskLevel = 'OVERSTOCKED';
        riskScore = 2;
      }

      // Recommended Reorder Quantity to maintain 30-day buffer + safety stock
      const targetBufferDays = 30;
      const targetStock = Math.ceil(dailyVelocity * targetBufferDays) + minThreshold;
      const recommendedReorder = Math.max(0, targetStock - current);

      const projectedStockoutDate = new Date();
      projectedStockoutDate.setDate(projectedStockoutDate.getDate() + (daysRemaining > 365 ? 365 : daysRemaining));

      return {
        id: stk.id,
        productId: stk.product_id,
        productCode: stk.product_code,
        productName: stk.product_name,
        warehouseId: stk.warehouse_id,
        warehouseName: stk.warehouse_name,
        currentStock: current,
        minimumStock: minThreshold,
        totalSoldInPeriod: totalSold,
        dailyVelocity,
        daysRemaining,
        riskLevel,
        riskScore,
        recommendedReorder,
        projectedStockoutDate: daysRemaining === 0 ? 'Immediately' : projectedStockoutDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        periodDays: daysInt
      };
    });

    // Sort by most critical risk first
    forecastResults.sort((a, b) => b.riskScore - a.riskScore || a.daysRemaining - b.daysRemaining);

    const criticalCount = forecastResults.filter((f) => f.riskLevel === 'CRITICAL' || f.riskLevel === 'OUT_OF_STOCK').length;
    const warningCount = forecastResults.filter((f) => f.riskLevel === 'WARNING').length;

    return {
      summary: {
        totalAnalyzed: forecastResults.length,
        criticalCount,
        warningCount,
        healthyCount: forecastResults.length - criticalCount - warningCount,
        periodDays: daysInt
      },
      items: forecastResults
    };
  }

  /**
   * Comprehensive Audit Trail Logging
   */
  async logAuditActivity({ tenantId, userId, userName, module, action, entityId, details, ipAddress }) {
    try {
      return await AuditLog.create({
        tenant_id: tenantId ? parseInt(tenantId, 10) : 0,
        user_id: userId ? parseInt(userId, 10) : null,
        user_name: userName || 'System',
        module: (module || 'SYSTEM').toUpperCase(),
        action: (action || 'ACTION').toUpperCase(),
        entity_id: entityId ? String(entityId) : null,
        details: typeof details === 'object' ? JSON.stringify(details) : (details || null),
        ip_address: ipAddress || null
      });
    } catch (err) {
      console.warn('Audit log write error:', err.message);
      return null;
    }
  }

  async getAuditLogs(tenantId, { module, action, search, page = 1, limit = 50 } = {}) {
    const where = (!tenantId) ? {} : { tenant_id: tenantId };
    if (module && module !== 'ALL') where.module = module;
    if (action && action !== 'ALL') where.action = action;

    if (search && search.trim()) {
      where[Op.or] = [
        { user_name: { [Op.like]: `%${search.trim()}%` } },
        { details: { [Op.like]: `%${search.trim()}%` } },
        { entity_id: { [Op.like]: `%${search.trim()}%` } }
      ];
    }

    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const { rows, count } = await AuditLog.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit, 10),
      offset
    });

    return { logs: rows, total: count };
  }
}

module.exports = new InventoryService();

