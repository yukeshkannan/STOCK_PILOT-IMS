const { Op } = require('sequelize');
const { Notification, sequelize } = require('../models');

const WAREHOUSE_SERVICE_URL = process.env.WAREHOUSE_SERVICE_URL || 'http://localhost:5005';
const PURCHASE_SERVICE_URL = process.env.PURCHASE_SERVICE_URL || 'http://localhost:5006';
const SALES_SERVICE_URL = process.env.SALES_SERVICE_URL || 'http://localhost:5007';
const INVENTORY_SERVICE_URL = process.env.INVENTORY_SERVICE_URL || 'http://localhost:5004';

async function httpPatch(url, body = {}, headers = {}) {
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    let errMessage = `HTTP request failed (${res.status})`;
    try {
      const errJson = await res.json();
      if (errJson?.message) errMessage = errJson.message;
    } catch {
      // ignore
    }
    throw { statusCode: res.status, message: errMessage };
  }
  return res.json();
}

function inferCategory(type, actionType) {
  if (
    ['TRANSFER_APPROVE', 'PURCHASE_APPROVE', 'RETURN_APPROVE'].includes(actionType) ||
    ['TRANSFER_REQUEST', 'PURCHASE_APPROVAL', 'RETURN_APPROVAL', 'REQUEST'].includes(type)
  ) {
    return 'REQUESTS';
  }
  if (['LOW_STOCK', 'OUT_OF_STOCK', 'STOCK_ADJUSTMENT', 'STOCK'].includes(type)) return 'STOCK';
  if (['SALE', 'PURCHASE', 'PAYMENT', 'RETURN', 'TRANSACTIONS'].includes(type)) return 'TRANSACTIONS';
  return 'SYSTEM';
}

class NotificationService {
  /**
   * 100% Dynamic Live Alerts Reconciliation
   * Eliminates static/fake dummy data and synchronizes with real live DB records across microservices.
   */
  async syncLiveDynamicAlerts(tenantId, isSuperAdmin = false) {
    try {
      // 1. Purge legacy hardcoded dummy/mock notifications with fake 2024 IDs or static maintenance strings
      await Notification.destroy({
        where: {
          [Op.or]: [
            { title: 'Scheduled System Maintenance' },
            { message: { [Op.like]: '%#INV-2024-%' } },
            { message: { [Op.like]: '%#PO-2024-%' } },
            { message: { [Op.like]: '%#TRF-2024-%' } },
            { title: { [Op.like]: '%#PO-2024-%' } },
            { title: { [Op.like]: '%#TRF-2024-%' } },
            { title: { [Op.like]: '%TechCorp Enterprises%' } },
            { message: { [Op.like]: '%TechCorp Enterprises%' } }
          ]
        }
      });

      // 2. Clean up orphan notifications whose tenant no longer exists in tenant_db
      let activeTenantIds = [];
      try {
        const tenantModels = require('../../../tenant-service/src/models');
        if (tenantModels?.Tenant) {
          const tenants = await tenantModels.Tenant.findAll({ where: { status: 'ACTIVE' }, attributes: ['id'] });
          activeTenantIds = tenants.map((t) => Number(t.id));
        }
      } catch (e) {
        console.warn('Tenant model query note:', e.message);
      }

      if (activeTenantIds.length === 0) {
        // If all tenant companies are deleted, delete ALL tenant notifications!
        await Notification.destroy({
          where: {
            tenant_id: { [Op.gt]: 0 }
          }
        });
      } else {
        // Delete notifications belonging to non-existent / deleted tenants
        await Notification.destroy({
          where: {
            tenant_id: {
              [Op.and]: [
                { [Op.gt]: 0 },
                { [Op.notIn]: activeTenantIds }
              ]
            }
          }
        });
      }

      // 3. Purge stock notifications whose product or stock no longer exists in inventory_db
      try {
        const inventoryModels = require('../../../inventory-service/src/models');
        if (inventoryModels?.Stock) {
          const allStocks = await inventoryModels.Stock.findAll({ attributes: ['tenant_id', 'product_id'] });
          const stockSet = new Set(allStocks.map((s) => `${s.tenant_id}-${s.product_id}`));

          const existingStockNotifs = await Notification.findAll({
            where: {
              type: { [Op.in]: ['LOW_STOCK', 'OUT_OF_STOCK', 'STOCK'] }
            }
          });

          for (const sn of existingStockNotifs) {
            if (sn.action_id && sn.tenant_id > 0) {
              const key = `${sn.tenant_id}-${sn.action_id}`;
              if (!stockSet.has(key)) {
                await sn.destroy();
              }
            }
          }
        }
      } catch (e) {
        // ignore
      }

      const tenantIdsToSync = [];
      if (!tenantId || isSuperAdmin) {
        tenantIdsToSync.push(...activeTenantIds);
      } else if (activeTenantIds.includes(Number(tenantId))) {
        tenantIdsToSync.push(Number(tenantId));
      }

      for (const tId of tenantIdsToSync) {
        const headers = {
          'x-tenant-id': String(tId),
          'x-user-role': 'ADMIN',
          'x-user-permissions': '["*"]'
        };

        // A. Dynamic Live Stock Alerts Sync (Real inventory levels)
        try {
          const stockRes = await fetch(`${INVENTORY_SERVICE_URL}/api/v1/inventory?limit=200`, { headers });
          const stockData = await stockRes.json();
          const itemsList = stockData?.data?.items || stockData?.data?.stocks || [];
          if (Array.isArray(itemsList) && itemsList.length > 0) {
            for (const item of itemsList) {
              const curr = parseInt(item.current_stock ?? item.currentStock, 10) || 0;
              const min = parseInt(item.minimum_stock ?? item.minimumStock, 10) || 5;
              const pId = item.product_id ?? item.productId;
              const pName = item.product_name ?? item.productName;
              const pCode = item.product_code ?? item.productCode;
              const whName = item.warehouse_name ?? item.warehouseName ?? 'Main Warehouse';

              if (curr <= 0) {
                await this.createNotification({
                  tenantId: tId,
                  title: `Out of Stock Alert: ${pName}`,
                  message: `Product [${pName} (${pCode})] is completely OUT OF STOCK in ${whName}. Sales paused for this item.`,
                  type: 'OUT_OF_STOCK',
                  category: 'STOCK',
                  actionType: 'REORDER',
                  actionId: pId,
                  metadata: { productId: pId, warehouseId: item.warehouse_id || item.warehouseId },
                  link: '/inventory'
                });
              } else if (curr <= min) {
                await this.createNotification({
                  tenantId: tId,
                  title: `Low Stock Alert: ${pName}`,
                  message: `Product [${pName} (${pCode})] has only ${curr} units remaining in ${whName} (Minimum threshold: ${min} units).`,
                  type: 'LOW_STOCK',
                  category: 'STOCK',
                  actionType: 'REORDER',
                  actionId: pId,
                  metadata: { productId: pId, warehouseId: item.warehouse_id || item.warehouseId },
                  link: '/inventory'
                });
              }
            }
          }
        } catch (e) {
          // silent fallback
        }

        // B. Dynamic Live Pending Purchase Orders Sync
        try {
          const poRes = await fetch(`${PURCHASE_SERVICE_URL}/api/v1/purchases?status=PENDING&limit=50`, { headers });
          const poData = await poRes.json();
          const poList = poData?.data?.purchases || poData?.data?.items || [];
          if (Array.isArray(poList)) {
            for (const po of poList) {
              if (po.status === 'PENDING') {
                const existing = await Notification.findOne({
                  where: {
                    tenant_id: tId,
                    action_type: 'PURCHASE_APPROVE',
                    action_id: String(po.id)
                  }
                });
                if (!existing) {
                  await this.createNotification({
                    tenantId: tId,
                    title: `PO Approval Needed: #${po.po_number}`,
                    message: `Purchase Order #${po.po_number} created for supplier '${po.supplier_name || 'Vendor'}' (Total: ₹${Number(po.grand_total || 0).toLocaleString()}). Awaiting admin approval.`,
                    type: 'PURCHASE',
                    category: 'REQUESTS',
                    actionType: 'PURCHASE_APPROVE',
                    actionId: po.id,
                    metadata: { purchaseId: po.id, poNumber: po.po_number },
                    link: '/purchases'
                  });
                }
              }
            }
          }
        } catch (e) {
          // silent fallback
        }

        // C. Dynamic Live Pending Transfers Sync
        try {
          const trfRes = await fetch(`${WAREHOUSE_SERVICE_URL}/api/v1/warehouses/transfers?status=PENDING&limit=50`, { headers });
          const trfData = await trfRes.json();
          const trfList = trfData?.data?.transfers || trfData?.data?.items || [];
          if (Array.isArray(trfList)) {
            for (const trf of trfList) {
              if (trf.status === 'PENDING') {
                const existing = await Notification.findOne({
                  where: {
                    tenant_id: tId,
                    action_type: 'TRANSFER_APPROVE',
                    action_id: String(trf.id)
                  }
                });
                if (!existing) {
                  const itemsCount = trf.items?.length || 1;
                  await this.createNotification({
                    tenantId: tId,
                    title: `Transfer Request #${trf.transfer_number}`,
                    message: `Stock transfer request raised from ${trf.source_warehouse_name || 'Main Warehouse'} to ${trf.destination_warehouse_name || 'Branch'} (${itemsCount} line items). Requires manager sign-off.`,
                    type: 'TRANSFER',
                    category: 'REQUESTS',
                    actionType: 'TRANSFER_APPROVE',
                    actionId: trf.id,
                    metadata: { transferId: trf.id, transferNumber: trf.transfer_number },
                    link: '/warehouses?tab=transfers'
                  });
                }
              }
            }
          }
        } catch (e) {
          // silent fallback
        }

        // D. Dynamic Live Outstanding Invoices Sync
        try {
          const salesRes = await fetch(`${SALES_SERVICE_URL}/api/v1/sales?status=PARTIAL&limit=20`, { headers });
          const salesData = await salesRes.json();
          const salesList = salesData?.data?.sales || salesData?.data?.items || [];
          if (Array.isArray(salesList)) {
            for (const s of salesList) {
              if (Number(s.due_amount) > 0) {
                const existing = await Notification.findOne({
                  where: {
                    tenant_id: tId,
                    type: 'PAYMENT',
                    action_id: String(s.id)
                  }
                });
                if (!existing) {
                  await this.createNotification({
                    tenantId: tId,
                    title: `Payment Pending: ${s.customer_name || 'Customer'}`,
                    message: `Invoice #${s.invoice_number} (Due: ₹${Number(s.due_amount || 0).toLocaleString()}) has an outstanding balance for customer ${s.customer_name}.`,
                    type: 'PAYMENT',
                    category: 'TRANSACTIONS',
                    actionId: s.id,
                    metadata: { saleId: s.id, invoiceNumber: s.invoice_number },
                    link: '/sales'
                  });
                }
              }
            }
          }
        } catch (e) {
          // silent fallback
        }
      }
    } catch (err) {
      console.warn('Dynamic live sync note:', err.message);
    }
  }

  async getNotifications(tenantId, userId, isSuperAdmin = false, options = {}) {
    // Run live dynamic synchronization first
    await this.syncLiveDynamicAlerts(tenantId, isSuperAdmin);

    const { category, unreadOnly, search, limit = 50, page = 1, user } = options;
    const baseWhere = (!tenantId && isSuperAdmin) ? {} : { tenant_id: tenantId || null };

    // Staff/Branch-scoped filtering: non-admins only see their assigned or broadcast alerts
    const userRole = (user?.roleName || user?.role || '').toUpperCase();
    const isGlobalAdmin = isSuperAdmin || Boolean(user?.isSuperAdmin) || (userRole === 'ADMIN' && !user?.warehouseId);

    if (!isGlobalAdmin && userId) {
      baseWhere[Op.or] = [
        { user_id: userId },
        { user_id: null }
      ];
    }

    const filterWhere = { ...baseWhere };

    if (unreadOnly) {
      filterWhere.is_read = false;
    }

    if (category && category !== 'ALL' && category !== 'UNREAD') {
      filterWhere.category = category;
    }

    if (search && search.trim()) {
      filterWhere[Op.and] = [
        {
          [Op.or]: [
            { title: { [Op.like]: `%${search.trim()}%` } },
            { message: { [Op.like]: `%${search.trim()}%` } }
          ]
        }
      ];
    }

    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);

    const { rows: notifications, count: total } = await Notification.findAndCountAll({
      where: filterWhere,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit, 10),
      offset
    });

    // Compute category counts for tab badges strictly by category
    const unreadCount = await Notification.count({
      where: { ...baseWhere, is_read: false }
    });

    const requestsCount = await Notification.count({
      where: { ...baseWhere, category: 'REQUESTS' }
    });

    const stockCount = await Notification.count({
      where: { ...baseWhere, category: 'STOCK' }
    });

    const transactionsCount = await Notification.count({
      where: { ...baseWhere, category: 'TRANSACTIONS' }
    });

    const systemCount = await Notification.count({
      where: { ...baseWhere, category: 'SYSTEM' }
    });

    const allCount = await Notification.count({
      where: baseWhere
    });

    return {
      notifications,
      total,
      unreadCount,
      counts: {
        all: allCount,
        unread: unreadCount,
        requests: requestsCount,
        stock: stockCount,
        transactions: transactionsCount,
        system: systemCount
      }
    };
  }

  async markAsRead(tenantId, notificationId, isSuperAdmin = false) {
    const where = (!tenantId && isSuperAdmin) ? { id: notificationId } : { id: notificationId, tenant_id: tenantId };
    const notif = await Notification.findOne({ where });
    if (!notif) throw { statusCode: 404, message: 'Notification not found' };
    await notif.update({ is_read: true });
    return notif;
  }

  async markAllAsRead(tenantId, isSuperAdmin = false) {
    const where = (!tenantId && isSuperAdmin) ? { is_read: false } : { tenant_id: tenantId, is_read: false };
    await Notification.update({ is_read: true }, { where });
    return true;
  }

  async deleteNotification(tenantId, notificationId, isSuperAdmin = false) {
    const where = (!tenantId && isSuperAdmin) ? { id: notificationId } : { id: notificationId, tenant_id: tenantId };
    const notif = await Notification.findOne({ where });
    if (!notif) throw { statusCode: 404, message: 'Notification not found' };
    await notif.destroy();
    return true;
  }

  async clearReadNotifications(tenantId, isSuperAdmin = false) {
    const where = (!tenantId && isSuperAdmin) ? { is_read: true } : { tenant_id: tenantId, is_read: true };
    await Notification.destroy({ where });
    return true;
  }

  async createNotification({
    tenantId,
    userId,
    title,
    message,
    type = 'SYSTEM',
    category,
    actionType,
    actionId,
    actionStatus = 'PENDING',
    metadata,
    link
  }) {
    const finalCategory = category || inferCategory(type, actionType);

    // Prevent duplicate unread stock alerts for the same item
    if (['LOW_STOCK', 'OUT_OF_STOCK'].includes(type) && actionId) {
      try {
        const existing = await Notification.findOne({
          where: {
            tenant_id: tenantId ? Number(tenantId) : 0,
            type,
            action_id: String(actionId),
            is_read: false
          }
        });
        if (existing) {
          await existing.update({
            title,
            message,
            metadata: typeof metadata === 'object' ? JSON.stringify(metadata) : (metadata || null)
          });
          return existing;
        }
      } catch {
        // ignore
      }
    }

    return Notification.create({
      tenant_id: tenantId ? Number(tenantId) : 0,
      user_id: userId || null,
      title,
      message,
      type,
      category: finalCategory,
      action_type: actionType || null,
      action_id: actionId ? String(actionId) : null,
      action_status: actionType ? (actionStatus || 'PENDING') : null,
      metadata: typeof metadata === 'object' ? JSON.stringify(metadata) : (metadata || null),
      link: link || null,
      is_read: false
    });
  }

  /**
   * Execute Action directly from Notification Card (Approve / Reject / Reorder)
   */
  async executeAction({ tenantId, notificationId, action, user, authHeader }) {
    const notif = await Notification.findOne({
      where: { id: notificationId, tenant_id: tenantId }
    });

    if (!notif) {
      throw { statusCode: 404, message: 'Notification not found' };
    }

    if (!notif.action_type || !notif.action_id) {
      throw { statusCode: 400, message: 'This notification is not actionable' };
    }

    if (notif.action_status && notif.action_status !== 'PENDING') {
      throw { statusCode: 400, message: `Action already processed as ${notif.action_status}` };
    }

    const headers = {
      'x-tenant-id': String(tenantId),
      'x-user-id': String(user?.userId || ''),
      'x-user-role': String(user?.role || 'ADMIN'),
      'x-user-permissions': JSON.stringify(user?.permissions || ['*']),
      ...(authHeader ? { Authorization: authHeader } : {})
    };

    const actionUpper = String(action || '').toUpperCase();

    // 1. Warehouse Transfer Actions
    if (notif.action_type === 'TRANSFER_APPROVE') {
      if (actionUpper === 'APPROVE') {
        await httpPatch(`${WAREHOUSE_SERVICE_URL}/api/v1/warehouses/transfers/${notif.action_id}/approve`, {}, headers);
        await notif.update({ action_status: 'APPROVED', is_read: true });
        
        // Dispatch response notification
        await this.createNotification({
          tenantId,
          title: `Transfer Approved: #${notif.action_id}`,
          message: `Stock Transfer #${notif.action_id} was approved by ${user?.name || 'Manager'}. Ready for dispatch.`,
          type: 'TRANSFER',
          category: 'TRANSACTIONS',
          link: '/warehouses?tab=transfers'
        });
      } else if (actionUpper === 'REJECT') {
        await httpPatch(`${WAREHOUSE_SERVICE_URL}/api/v1/warehouses/transfers/${notif.action_id}/reject`, { reason: 'Rejected from Notification Center' }, headers);
        await notif.update({ action_status: 'REJECTED', is_read: true });
        
        // Dispatch response notification
        await this.createNotification({
          tenantId,
          title: `Transfer Rejected: #${notif.action_id}`,
          message: `Stock Transfer #${notif.action_id} was rejected by ${user?.name || 'Manager'}.`,
          type: 'TRANSFER',
          category: 'TRANSACTIONS',
          link: '/warehouses?tab=transfers'
        });
      } else {
        throw { statusCode: 400, message: `Invalid action '${action}' for transfer` };
      }
    }

    // 2. Purchase Order Approval Actions
    else if (notif.action_type === 'PURCHASE_APPROVE') {
      if (actionUpper === 'APPROVE') {
        await httpPatch(`${PURCHASE_SERVICE_URL}/api/v1/purchases/${notif.action_id}/approve`, {}, headers);
        await notif.update({ action_status: 'APPROVED', is_read: true });

        await this.createNotification({
          tenantId,
          title: `Purchase Order Approved: #${notif.action_id}`,
          message: `PO #${notif.action_id} was approved by ${user?.name || 'Admin'} and inventory stock was updated.`,
          type: 'PURCHASE',
          category: 'TRANSACTIONS',
          link: '/purchases'
        });
      } else if (actionUpper === 'REJECT' || actionUpper === 'CANCEL') {
        await httpPatch(`${PURCHASE_SERVICE_URL}/api/v1/purchases/${notif.action_id}/cancel`, {}, headers);
        await notif.update({ action_status: 'REJECTED', is_read: true });
      } else {
        throw { statusCode: 400, message: `Invalid action '${action}' for purchase order` };
      }
    }

    // 3. Purchase Return Approval Actions
    else if (notif.action_type === 'RETURN_APPROVE') {
      if (actionUpper === 'APPROVE') {
        await httpPatch(`${PURCHASE_SERVICE_URL}/api/v1/purchases/returns/${notif.action_id}/approve`, {}, headers);
        await notif.update({ action_status: 'APPROVED', is_read: true });
      } else if (actionUpper === 'REJECT') {
        await httpPatch(`${PURCHASE_SERVICE_URL}/api/v1/purchases/returns/${notif.action_id}/reject`, {}, headers);
        await notif.update({ action_status: 'REJECTED', is_read: true });
      }
    }

    // 4. Low Stock Reorder Quick Action
    else if (notif.action_type === 'REORDER') {
      await notif.update({ action_status: 'PROCESSED', is_read: true });
    }

    else {
      await notif.update({ action_status: actionUpper, is_read: true });
    }

    return notif;
  }

  async broadcast({ tenantId, tenantIds, title, message, type = 'SYSTEM', category = 'SYSTEM', link }) {
    let targetTenants = [];
    if (tenantId === 'ALL' || (!tenantId && (!tenantIds || tenantIds.length === 0))) {
      if (Array.isArray(tenantIds) && tenantIds.length > 0) {
        targetTenants = tenantIds;
      } else {
        try {
          const tenantModels = require('../../../tenant-service/src/models');
          if (tenantModels?.Tenant) {
            const all = await tenantModels.Tenant.findAll({ where: { status: 'ACTIVE' }, attributes: ['id'] });
            targetTenants = all.map(t => t.id);
          }
        } catch (e) {
          console.warn('Tenant model query note:', e.message);
        }
      }
    } else if (Array.isArray(tenantIds) && tenantIds.length > 0) {
      targetTenants = tenantIds;
    } else if (tenantId) {
      targetTenants = [tenantId];
    }

    const createdList = [];
    if (targetTenants.length > 0) {
      for (const tId of targetTenants) {
        const notif = await Notification.create({
          tenant_id: tId,
          title,
          message,
          type,
          category: category || 'SYSTEM',
          link: link || null,
          is_read: false
        });
        createdList.push(notif);
      }
    }

    // Record superadmin copy for tracking
    try {
      const adminNotif = await Notification.create({
        tenant_id: 0,
        title: `[Broadcast] ${title}`,
        message: targetTenants.length > 0
          ? `Dispatched to ${targetTenants.length} organization(s): ${message}`
          : message,
        type,
        category: 'SYSTEM',
        link: link || null,
        is_read: false
      });
      createdList.push(adminNotif);
    } catch (e) {
      // ignore
    }

    return {
      success: true,
      count: createdList.length,
      targetCount: targetTenants.length
    };
  }
}

module.exports = new NotificationService();

