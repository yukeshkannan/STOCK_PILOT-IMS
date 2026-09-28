const { Op } = require('sequelize');
const { Notification, sequelize } = require('../models');

const WAREHOUSE_SERVICE_URL = process.env.WAREHOUSE_SERVICE_URL || 'http://localhost:5005';
const PURCHASE_SERVICE_URL = process.env.PURCHASE_SERVICE_URL || 'http://localhost:5006';
const SALES_SERVICE_URL = process.env.SALES_SERVICE_URL || 'http://localhost:5007';
const INVENTORY_SERVICE_URL = process.env.INVENTORY_SERVICE_URL || 'http://localhost:5004';
const TENANT_SERVICE_URL = process.env.TENANT_SERVICE_URL || 'http://localhost:5002';

async function fetchService(servicePath, defaultEnvUrl, dockerUrl, headers = {}) {
  const candidateUrls = [
    defaultEnvUrl,
    dockerUrl,
    `http://localhost:${dockerUrl.split(':').pop()}`
  ].filter(Boolean);

  for (const baseUrl of [...new Set(candidateUrls)]) {
    try {
      const url = `${baseUrl.replace(/\/$/, '')}${servicePath}`;
      const res = await fetch(url, { headers });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // try next candidate URL
    }
  }
  return null;
}

async function httpPatch(serviceEnvUrl, dockerUrl, path, body = {}, headers = {}) {
  const candidateUrls = [
    serviceEnvUrl,
    dockerUrl,
    `http://localhost:${dockerUrl.split(':').pop()}`
  ].filter(Boolean);

  let lastError = null;
  for (const baseUrl of [...new Set(candidateUrls)]) {
    try {
      const url = `${baseUrl.replace(/\/$/, '')}${path}`;
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
      return await res.json();
    } catch (e) {
      lastError = e;
      if (e.statusCode) throw e;
    }
  }
  throw lastError || new Error(`Failed to reach service for PATCH ${path}`);
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

function extractList(json, defaultProp) {
  if (!json) return [];
  if (Array.isArray(json)) return json;
  if (Array.isArray(json.data)) return json.data;
  if (defaultProp && Array.isArray(json.data?.[defaultProp])) return json.data[defaultProp];
  if (Array.isArray(json.data?.items)) return json.data.items;
  if (Array.isArray(json.data?.stocks)) return json.data.stocks;
  if (Array.isArray(json.data?.purchases)) return json.data.purchases;
  if (Array.isArray(json.data?.returns)) return json.data.returns;
  if (Array.isArray(json.data?.transfers)) return json.data.transfers;
  if (Array.isArray(json.data?.sales)) return json.data.sales;
  if (Array.isArray(json.items)) return json.items;
  return [];
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

      // 2. Identify tenants to synchronize
      let tenantIdsToSync = [];
      if (tenantId) {
        tenantIdsToSync = [Number(tenantId)];
      } else {
        // Fallback for SuperAdmin / background sweeps: discover active tenants
        try {
          const tenantModels = require('../../../tenant-service/src/models');
          if (tenantModels?.Tenant) {
            const tenants = await tenantModels.Tenant.findAll({ where: { status: 'ACTIVE' }, attributes: ['id'] });
            tenantIdsToSync = tenants.map((t) => Number(t.id));
          }
        } catch {
          // ignore
        }

        if (tenantIdsToSync.length === 0) {
          try {
            const notifTenants = await Notification.findAll({
              attributes: [[sequelize.fn('DISTINCT', sequelize.col('tenant_id')), 'tenant_id']],
              where: { tenant_id: { [Op.gt]: 0 } },
              raw: true
            });
            tenantIdsToSync = notifTenants.map((n) => Number(n.tenant_id)).filter(Boolean);
          } catch {
            // ignore
          }
        }

        if (tenantIdsToSync.length === 0) {
          tenantIdsToSync = [1];
        }
      }

      for (const tId of tenantIdsToSync) {
        const headers = {
          'x-tenant-id': String(tId),
          'x-user-id': 'system',
          'x-user-role': 'ADMIN',
          'x-user-permissions': JSON.stringify(['*']),
          'x-is-super-admin': 'true',
          'Content-Type': 'application/json'
        };

        // A. Dynamic Live Stock Alerts Sync (Real inventory levels)
        try {
          const stockJson = await fetchService(
            '/api/v1/inventory?limit=500',
            INVENTORY_SERVICE_URL,
            'http://inventory-service:5004',
            headers
          );
          const itemsList = extractList(stockJson, 'stocks');
          if (Array.isArray(itemsList) && itemsList.length > 0) {
            for (const item of itemsList) {
              const curr = parseInt(item.current_stock ?? item.currentStock, 10);
              const min = parseInt(item.minimum_stock ?? item.minimumStock, 10) || 5;
              const pId = item.product_id ?? item.productId ?? item.id;
              const pName = item.product_name ?? item.productName ?? 'Product';
              const pCode = item.product_code ?? item.productCode ?? 'SKU';
              const whName = item.warehouse_name ?? item.warehouseName ?? 'Main Warehouse';

              if (isNaN(curr)) continue;

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
                await Notification.destroy({
                  where: {
                    tenant_id: tId,
                    type: 'LOW_STOCK',
                    action_id: String(pId)
                  }
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
                await Notification.destroy({
                  where: {
                    tenant_id: tId,
                    type: 'OUT_OF_STOCK',
                    action_id: String(pId)
                  }
                });
              } else {
                // Stock is healthy! Automatically remove previous low / out of stock warnings
                await Notification.destroy({
                  where: {
                    tenant_id: tId,
                    type: { [Op.in]: ['LOW_STOCK', 'OUT_OF_STOCK'] },
                    action_id: String(pId)
                  }
                });
              }
            }
          }
        } catch (e) {
          console.warn('[NotificationLiveSync] Stock alerts sync note:', e.message);
        }

        // B. Dynamic Live Pending Purchase Orders Sync
        try {
          const poJson = await fetchService(
            '/api/v1/purchases?limit=100',
            PURCHASE_SERVICE_URL,
            'http://purchase-service:5006',
            headers
          );
          const poList = extractList(poJson, 'purchases');
          if (Array.isArray(poList) && poList.length > 0) {
            for (const po of poList) {
              const isPending = po.status === 'PENDING' || po.status === 'PENDING_APPROVAL' || po.status === 'DRAFT';
              const isApproved = po.status === 'APPROVED';
              const isCancelled = po.status === 'CANCELLED';

              if (isPending) {
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
                    message: `Purchase Order #${po.po_number} created for supplier '${po.supplier_name || 'Vendor'}' (Total: ₹${Number(po.grand_total || 0).toLocaleString('en-IN')}). Awaiting admin approval.`,
                    type: 'PURCHASE',
                    category: 'REQUESTS',
                    actionType: 'PURCHASE_APPROVE',
                    actionId: po.id,
                    metadata: { purchaseId: po.id, poNumber: po.po_number },
                    link: '/purchases'
                  });
                }
              } else if (isApproved || isCancelled) {
                await Notification.update({
                  action_status: isApproved ? 'APPROVED' : 'CANCELLED',
                  is_read: true
                }, {
                  where: {
                    tenant_id: tId,
                    action_type: 'PURCHASE_APPROVE',
                    action_id: String(po.id),
                    action_status: 'PENDING'
                  }
                });
              }
            }
          }
        } catch (e) {
          console.warn('[NotificationLiveSync] PO sync note:', e.message);
        }

        // C. Dynamic Live Pending Purchase Returns Sync (RMA Returns)
        try {
          const retJson = await fetchService(
            '/api/v1/purchase-returns',
            PURCHASE_SERVICE_URL,
            'http://purchase-service:5006',
            headers
          );
          const retList = extractList(retJson, 'returns');
          if (Array.isArray(retList) && retList.length > 0) {
            for (const ret of retList) {
              const isPending = !ret.status || ret.status === 'PENDING_APPROVAL' || ret.status === 'PENDING';
              const isApproved = ret.status === 'APPROVED';
              const isRejected = ret.status === 'REJECTED';

              if (isPending) {
                const existing = await Notification.findOne({
                  where: {
                    tenant_id: tId,
                    action_type: 'RETURN_APPROVE',
                    action_id: String(ret.id)
                  }
                });
                if (!existing) {
                  await this.createNotification({
                    tenantId: tId,
                    title: `Purchase Return Request #${ret.return_number}`,
                    message: `RMA Return request #${ret.return_number} of ₹${Number(ret.total_refund || 0).toLocaleString('en-IN')} submitted for ${ret.supplier_name || 'Supplier'} (${ret.reason || 'Defective / Damaged items'}). Awaiting manager review.`,
                    type: 'RETURN_APPROVAL',
                    category: 'REQUESTS',
                    actionType: 'RETURN_APPROVE',
                    actionId: ret.id,
                    metadata: { returnId: ret.id, returnNumber: ret.return_number, poNumber: ret.po_number, purchaseId: ret.purchase_id },
                    link: `/purchases?tab=returns&returnId=${ret.id}`
                  });
                }
              } else if (isApproved || isRejected) {
                await Notification.update({
                  action_status: isApproved ? 'APPROVED' : 'REJECTED',
                  is_read: true
                }, {
                  where: {
                    tenant_id: tId,
                    action_type: 'RETURN_APPROVE',
                    action_id: String(ret.id),
                    action_status: 'PENDING'
                  }
                });
              }
            }
          }
        } catch (e) {
          console.warn('[NotificationLiveSync] Purchase returns sync note:', e.message);
        }

        // D. Dynamic Live Pending Transfers Sync
        try {
          const trfJson = await fetchService(
            '/api/v1/warehouses/transfers?status=PENDING&limit=50',
            WAREHOUSE_SERVICE_URL,
            'http://warehouse-service:5005',
            headers
          );
          const trfList = extractList(trfJson, 'transfers');
          if (Array.isArray(trfList) && trfList.length > 0) {
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
          console.warn('[NotificationLiveSync] Transfers sync note:', e.message);
        }

        // E. Dynamic Live Outstanding Invoices Sync
        try {
          const salesJson = await fetchService(
            '/api/v1/sales?limit=50',
            SALES_SERVICE_URL,
            'http://sales-service:5007',
            headers
          );
          const salesList = extractList(salesJson, 'sales');
          if (Array.isArray(salesList) && salesList.length > 0) {
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
                    message: `Invoice #${s.invoice_number} (Due: ₹${Number(s.due_amount || 0).toLocaleString('en-IN')}) has an outstanding balance for customer ${s.customer_name || 'Customer'}.`,
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
          console.warn('[NotificationLiveSync] Sales invoices sync note:', e.message);
        }

        // F. Dynamic Live Customer Sales Returns Sync
        try {
          const sRetJson = await fetchService(
            '/api/v1/sales-returns',
            SALES_SERVICE_URL,
            'http://sales-service:5007',
            headers
          );
          const sRetList = extractList(sRetJson, 'returns');
          if (Array.isArray(sRetList) && sRetList.length > 0) {
            for (const sRet of sRetList) {
              const existing = await Notification.findOne({
                where: {
                  tenant_id: tId,
                  type: 'RETURN',
                  action_id: String(sRet.id)
                }
              });
              if (!existing) {
                await this.createNotification({
                  tenantId: tId,
                  title: `Customer Return #${sRet.return_number}`,
                  message: `Sales return #${sRet.return_number} recorded for ${sRet.customer_name || 'Customer'} (Refund Amount: ₹${Number(sRet.total_refund || 0).toLocaleString('en-IN')}). Items restored to warehouse stock.`,
                  type: 'RETURN',
                  category: 'TRANSACTIONS',
                  actionId: sRet.id,
                  metadata: { returnId: sRet.id, returnNumber: sRet.return_number },
                  link: '/sales'
                });
              }
            }
          }
        } catch (e) {
          console.warn('[NotificationLiveSync] Sales returns sync note:', e.message);
        }
      }
    } catch (err) {
      console.warn('Dynamic live sync note:', err.message);
    }
  }

  async getNotifications(tenantId, userId, isSuperAdmin = false, options = {}) {
    // Run live dynamic synchronization first (safe fallback on error)
    try {
      await this.syncLiveDynamicAlerts(tenantId, isSuperAdmin);
    } catch (syncErr) {
      console.warn('[NotificationSync] Warning during syncLiveDynamicAlerts:', syncErr.message);
    }

    const { category, unreadOnly, search, limit = 50, page = 1, user } = options;
    const baseWhere = (!tenantId && isSuperAdmin) ? {} : { tenant_id: tenantId ? Number(tenantId) : null };

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
    const where = (!tenantId && isSuperAdmin) ? { id: notificationId } : { id: notificationId, tenant_id: tenantId ? Number(tenantId) : null };
    const notif = await Notification.findOne({ where });
    if (!notif) throw { statusCode: 404, message: 'Notification not found' };
    await notif.update({ is_read: true });
    return notif;
  }

  async markAllAsRead(tenantId, isSuperAdmin = false) {
    const where = (!tenantId && isSuperAdmin) ? { is_read: false } : { tenant_id: tenantId ? Number(tenantId) : null, is_read: false };
    await Notification.update({ is_read: true }, { where });
    return true;
  }

  async deleteNotification(tenantId, notificationId, isSuperAdmin = false) {
    const where = (!tenantId && isSuperAdmin) ? { id: notificationId } : { id: notificationId, tenant_id: tenantId ? Number(tenantId) : null };
    const notif = await Notification.findOne({ where });
    if (!notif) throw { statusCode: 404, message: 'Notification not found' };
    await notif.destroy();
    return true;
  }

  async clearReadNotifications(tenantId, isSuperAdmin = false) {
    const where = (!tenantId && isSuperAdmin) ? { is_read: true } : { tenant_id: tenantId ? Number(tenantId) : null, is_read: true };
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

    // Prevent duplicate unread notifications for stock or approval items
    if (['LOW_STOCK', 'OUT_OF_STOCK', 'RETURN_APPROVAL', 'PURCHASE'].includes(type) && actionId) {
      try {
        const existing = await Notification.findOne({
          where: {
            tenant_id: tenantId ? Number(tenantId) : 0,
            type,
            action_id: String(actionId)
          }
        });
        if (existing) {
          await existing.update({
            title,
            message,
            category: finalCategory,
            action_type: actionType || existing.action_type,
            action_status: actionType ? (actionStatus || existing.action_status) : null,
            metadata: typeof metadata === 'object' ? JSON.stringify(metadata) : (metadata || null),
            link: link || existing.link,
            is_read: false
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
      where: { id: notificationId, tenant_id: tenantId ? Number(tenantId) : null }
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
      'x-user-id': String(user?.userId || '1'),
      'x-user-role': String(user?.role || 'ADMIN'),
      'x-user-permissions': JSON.stringify(user?.permissions || ['*']),
      ...(authHeader ? { Authorization: authHeader } : {})
    };

    const actionUpper = String(action || '').toUpperCase();

    // 1. Warehouse Transfer Actions
    if (notif.action_type === 'TRANSFER_APPROVE') {
      if (actionUpper === 'APPROVE') {
        await httpPatch(WAREHOUSE_SERVICE_URL, 'http://warehouse-service:5005', `/api/v1/warehouses/transfers/${notif.action_id}/approve`, {}, headers);
        await notif.update({ action_status: 'APPROVED', is_read: true });
        
        await this.createNotification({
          tenantId,
          title: `Transfer Approved: #${notif.action_id}`,
          message: `Stock Transfer #${notif.action_id} was approved by ${user?.name || 'Manager'}. Ready for dispatch.`,
          type: 'TRANSFER',
          category: 'TRANSACTIONS',
          link: '/warehouses?tab=transfers'
        });
      } else if (actionUpper === 'REJECT') {
        await httpPatch(WAREHOUSE_SERVICE_URL, 'http://warehouse-service:5005', `/api/v1/warehouses/transfers/${notif.action_id}/reject`, { reason: 'Rejected from Notification Center' }, headers);
        await notif.update({ action_status: 'REJECTED', is_read: true });
        
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
        await httpPatch(PURCHASE_SERVICE_URL, 'http://purchase-service:5006', `/api/v1/purchases/${notif.action_id}/approve`, {}, headers);
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
        await httpPatch(PURCHASE_SERVICE_URL, 'http://purchase-service:5006', `/api/v1/purchases/${notif.action_id}/cancel`, {}, headers);
        await notif.update({ action_status: 'REJECTED', is_read: true });
      } else {
        throw { statusCode: 400, message: `Invalid action '${action}' for purchase order` };
      }
    }

    // 3. Purchase Return Approval Actions
    else if (notif.action_type === 'RETURN_APPROVE') {
      if (actionUpper === 'APPROVE') {
        await httpPatch(PURCHASE_SERVICE_URL, 'http://purchase-service:5006', `/api/v1/purchase-returns/${notif.action_id}/approve`, {}, headers);
        await notif.update({ action_status: 'APPROVED', is_read: true });

        const meta = notif.metadata ? (typeof notif.metadata === 'string' ? JSON.parse(notif.metadata) : notif.metadata) : {};
        await this.createNotification({
          tenantId,
          title: `Purchase Return Approved: #${meta.returnNumber || notif.action_id}`,
          message: `RMA Return #${meta.returnNumber || notif.action_id} was approved by ${user?.name || 'Admin'} and inventory stock was deducted.`,
          type: 'RETURN',
          category: 'TRANSACTIONS',
          link: '/purchases?tab=returns'
        });
      } else if (actionUpper === 'REJECT') {
        await httpPatch(PURCHASE_SERVICE_URL, 'http://purchase-service:5006', `/api/v1/purchase-returns/${notif.action_id}/reject`, { reason: 'Rejected from Notification Center' }, headers);
        await notif.update({ action_status: 'REJECTED', is_read: true });

        const meta = notif.metadata ? (typeof notif.metadata === 'string' ? JSON.parse(notif.metadata) : notif.metadata) : {};
        await this.createNotification({
          tenantId,
          title: `Purchase Return Declined: #${meta.returnNumber || notif.action_id}`,
          message: `RMA Return #${meta.returnNumber || notif.action_id} was declined by ${user?.name || 'Admin'}.`,
          type: 'RETURN',
          category: 'TRANSACTIONS',
          link: '/purchases?tab=returns'
        });
      } else {
        throw { statusCode: 400, message: `Invalid action '${action}' for purchase return` };
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
    } catch {
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
