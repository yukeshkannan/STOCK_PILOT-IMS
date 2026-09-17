const { Tenant, TenantUser, Role, Permission, AuditLog } = require('../models');
const { ROLES, PERMISSIONS, DEFAULT_ROLE_PERMISSIONS } = require('@stockpilot/common');

const http = require('http');

function pingService(url) {
  return new Promise((resolve) => {
    const start = Date.now();
    const req = http.get(url, { timeout: 1500 }, (res) => {
      res.resume();
      const latency = Date.now() - start;
      resolve({ online: res.statusCode === 200, latency: latency === 0 ? 1 : latency });
    });
    req.on('error', () => {
      resolve({ online: false, latency: 0 });
    });
    req.on('timeout', () => {
      req.destroy();
      resolve({ online: false, latency: 0 });
    });
  });
}

class TenantService {
  async getTenant(tenantId) {
    let tenant = null;
    if (tenantId) {
      tenant = await Tenant.findByPk(tenantId);
      if (!tenant) {
        tenant = await Tenant.findOne({ where: { id: Number(tenantId) || 0 } });
      }
      if (!tenant && typeof tenantId === 'string') {
        tenant = await Tenant.findOne({ where: { company_code: tenantId.toUpperCase() } });
      }
    }
    if (!tenant) {
      throw { statusCode: 404, message: 'Tenant company not found' };
    }
    return tenant;
  }

  async updateTenant(tenantId, updateData) {
    const tenant = await this.getTenant(tenantId);
    await tenant.update(updateData);
    return tenant;
  }

  async getSettings(tenantId) {
    if (!tenantId) {
      return {
        companyName: 'StockPilot Platform',
        companyCode: 'PLATFORM',
        email: 'superadmin@stockpilot.io',
        phone: '',
        address: '',
        taxNumber: '',
        currency: 'INR',
        currencySymbol: '₹',
        timezone: 'Asia/Kolkata',
        plan: 'ENTERPRISE'
      };
    }

    try {
      const tenant = await this.getTenant(tenantId);
      return {
        companyName: tenant.company_name,
        companyCode: tenant.company_code,
        email: tenant.email,
        phone: tenant.phone || '',
        address: tenant.address || '',
        taxNumber: tenant.tax_number || '',
        currency: tenant.currency || 'INR',
        currencySymbol: tenant.currency_symbol || '₹',
        timezone: tenant.timezone || 'Asia/Kolkata',
        plan: (tenant.plan || 'TRIAL').toString().trim().toUpperCase()
      };
    } catch {
      return {
        companyName: 'StockPilot Organization',
        companyCode: 'ORG',
        email: '',
        phone: '',
        address: '',
        taxNumber: '',
        currency: 'INR',
        currencySymbol: '₹',
        timezone: 'Asia/Kolkata',
        plan: 'TRIAL'
      };
    }
  }

  async updateSettings(tenantId, settings) {
    const tenant = await this.getTenant(tenantId);
    await tenant.update({
      company_name: settings.companyName || settings.company_name || tenant.company_name,
      email: settings.email || tenant.email,
      phone: settings.phone !== undefined ? settings.phone : tenant.phone,
      address: settings.address !== undefined ? settings.address : tenant.address,
      tax_number: settings.taxNumber !== undefined ? settings.taxNumber : (settings.tax_number || tenant.tax_number),
      currency: settings.currency || tenant.currency,
      currency_symbol: settings.currencySymbol || (settings.currency === 'USD' ? '$' : settings.currency === 'EUR' ? '€' : settings.currency === 'GBP' ? '£' : settings.currency === 'AED' ? 'د.إ' : '₹'),
      timezone: settings.timezone || tenant.timezone
    });
    return this.getSettings(tenantId);
  }

  // Platform Super Admin methods
  async getAllTenants() {
    return Tenant.findAll({
      include: [
        {
          model: TenantUser,
          as: 'users',
          attributes: ['id', 'first_name', 'last_name', 'email', 'role_name', 'status']
        }
      ],
      order: [['created_at', 'DESC']]
    });
  }

  async getPendingRegistrations() {
    try {
      const authModels = require('../../../auth-service/src/models');
      if (authModels?.User) {
        const { Op } = require('sequelize');
        const pendingUsers = await authModels.User.findAll({
          where: {
            [Op.or]: [
              { status: 'PENDING_SETUP' },
              { tenant_id: null }
            ],
            is_super_admin: false
          },
          order: [['created_at', 'DESC']]
        });
        return pendingUsers.map((u) => ({
          id: `pending-${u.id}`,
          pending_user_id: u.id,
          company_name: `${u.first_name} ${u.last_name || ''}`.trim() || 'Incomplete Setup',
          company_code: 'PENDING_SETUP',
          email: u.email,
          phone: 'Profile Incomplete',
          address: 'Awaiting Workspace Setup',
          tax_number: 'Incomplete',
          status: 'PENDING_SETUP',
          plan: 'TRIAL',
          users: [
            {
              id: u.id,
              first_name: u.first_name,
              last_name: u.last_name,
              email: u.email,
              role_name: 'ADMIN',
              status: 'PENDING_SETUP'
            }
          ],
          created_at: u.createdAt || u.created_at,
          is_pending_setup: true
        }));
      }
      return [];
    } catch (err) {
      console.warn('Error fetching pending registrations:', err.message);
      return [];
    }
  }

  async deletePendingRegistration(userId) {
    const authModels = require('../../../auth-service/src/models');
    if (authModels?.User) {
      const user = await authModels.User.findOne({
        where: {
          id: userId,
          is_super_admin: false
        }
      });
      if (!user) {
        throw { statusCode: 404, message: 'Pending user registration record not found' };
      }
      if (authModels?.RefreshToken) {
        await authModels.RefreshToken.destroy({ where: { user_id: userId } });
      }
      const email = user.email;
      await user.destroy();
      return { id: userId, email, company_name: `${user.first_name} ${user.last_name || ''}`.trim() };
    }
    throw { statusCode: 500, message: 'Auth models unavailable' };
  }

  async setTenantStatus(tenantId, status) {
    const tenant = await this.getTenant(tenantId);
    await tenant.update({ status });

    // 1. Update all users belonging to this tenant in tenant_db
    await TenantUser.update(
      { status: status === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE' },
      { where: { tenant_id: tenant.id } }
    );

    // 2. Direct instant update in auth_db
    try {
      const authModels = require('../../../auth-service/src/models');
      if (authModels?.TenantLookup) {
        await authModels.TenantLookup.update(
          { status },
          { where: { company_code: tenant.company_code.toUpperCase() } }
        );
      }
      if (authModels?.User) {
        await authModels.User.update(
          { status: status === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE' },
          { where: { tenant_id: tenant.id } }
        );
      }
    } catch (err) {
      console.warn('Direct auth_db sync note:', err.message);
    }

    // 3. HTTP sync with auth-service
    try {
      const http = require('http');
      const authUrl = new URL(process.env.AUTH_SERVICE_URL || 'http://localhost:5001');
      const reqData = JSON.stringify({ companyCode: tenant.company_code, status });
      const req = http.request({
        hostname: authUrl.hostname,
        port: authUrl.port,
        path: '/api/v1/auth/internal/tenant-status',
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(reqData)
        }
      });
      req.on('error', () => {});
      req.write(reqData);
      req.end();
    } catch {
      // Ignore if offline
    }

    return tenant;
  }

  async setTenantPlan(tenantId, plan) {
    const validPlans = ['TRIAL', 'STARTER', 'PRO', 'ENTERPRISE'];
    if (!validPlans.includes(plan)) {
      throw { statusCode: 400, message: `Invalid plan. Must be one of: ${validPlans.join(', ')}` };
    }

    const tenant = await this.getTenant(tenantId);
    await tenant.update({ plan });

    // 1. Direct instant update in auth_db
    try {
      const authModels = require('../../../auth-service/src/models');
      if (authModels?.TenantLookup) {
        await authModels.TenantLookup.update(
          { plan },
          { where: { company_code: tenant.company_code.toUpperCase() } }
        );
      }
    } catch (err) {
      console.warn('Direct auth_db plan sync note:', err.message);
    }

    // 2. HTTP sync with auth-service
    try {
      const http = require('http');
      const authUrl = new URL(process.env.AUTH_SERVICE_URL || 'http://localhost:5001');
      const reqData = JSON.stringify({ companyCode: tenant.company_code, plan });
      const req = http.request({
        hostname: authUrl.hostname,
        port: authUrl.port,
        path: '/api/v1/auth/internal/tenant-plan',
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(reqData)
        }
      });
      req.on('error', () => {});
      req.write(reqData);
      req.end();
    } catch {
      // Ignore if offline
    }

    return tenant;
  }

  async createTenant(tenantData) {
    const { company_name, company_code, email, phone, address, tax_number } = tenantData;
    const existing = await Tenant.findOne({ where: { company_code: company_code.toUpperCase() } });
    if (existing) {
      throw { statusCode: 400, message: `Company code [${company_code}] already registered` };
    }

    const tenant = await Tenant.create({
      company_code: company_code.toUpperCase(),
      company_name,
      email,
      phone: phone || null,
      address: address || null,
      tax_number: tax_number || null,
      status: 'ACTIVE'
    });

    await TenantUser.create({
      tenant_id: tenant.id,
      first_name: company_name,
      last_name: 'Admin',
      email: email,
      phone: phone || null,
      role_name: ROLES.ADMIN,
      status: 'ACTIVE'
    });

    await AuditLog.create({
      tenant_id: tenant.id,
      user_id: 1,
      user_name: 'Super Admin',
      module: 'TENANT',
      action: `Provisioned new tenant company [${company_name} (${company_code})]`,
      ip_address: '127.0.0.1'
    });

    return tenant;
  }

  async getPlatformTelemetry() {
    const services = [
      { name: 'Gateway', port: 5000 },
      { name: 'Auth', port: 5001 },
      { name: 'Tenant', port: 5002 },
      { name: 'Product', port: 5003 },
      { name: 'Inventory', port: 5004 },
      { name: 'Warehouse', port: 5005 },
      { name: 'Purchase', port: 5006 },
      { name: 'Sales', port: 5007 },
      { name: 'Finance', port: 5008 },
      { name: 'Notification', port: 5009 }
    ];

    const results = await Promise.all(
      services.map(async (svc) => {
        const ping = await pingService(`http://localhost:${svc.port}/health`);
        const color = svc.name === 'Auth' || svc.name === 'Warehouse' || svc.name === 'Finance'
          ? '#7c3aed'
          : (svc.name === 'Purchase' ? '#0284c7' : '#059669');

        return {
          name: svc.name,
          port: svc.port,
          status: ping.online ? 'ONLINE' : 'OFFLINE',
          latency: ping.online ? ping.latency : 0,
          fill: ping.online ? color : '#ef4444'
        };
      })
    );

    const onlineServices = results.filter((r) => r.status === 'ONLINE');
    const avgLatency = Math.round(
      onlineServices.reduce((sum, r) => sum + r.latency, 0) / (onlineServices.length || 1)
    );

    return {
      services: results,
      activeCount: onlineServices.length,
      totalCount: services.length,
      avgLatency
    };
  }

  async getPlatformDashboard() {
    const totalTenants = await Tenant.count();
    const activeTenants = await Tenant.count({ where: { status: 'ACTIVE' } });
    const suspendedTenants = await Tenant.count({ where: { status: 'SUSPENDED' } });
    const totalUsers = await TenantUser.count({ where: { is_super_admin: false } });

    let pendingRegistrations = 0;
    try {
      const authModels = require('../../../auth-service/src/models');
      if (authModels?.User) {
        const { Op } = require('sequelize');
        pendingRegistrations = await authModels.User.count({
          where: {
            [Op.or]: [{ status: 'PENDING_SETUP' }, { tenant_id: null }],
            is_super_admin: false
          }
        });
      }
    } catch {
      pendingRegistrations = 0;
    }

    const recentTenants = await Tenant.findAll({
      limit: 5,
      order: [['created_at', 'DESC']]
    });

    const recentLogs = await AuditLog.findAll({
      limit: 10,
      order: [['created_at', 'DESC']]
    });

    const telemetry = await this.getPlatformTelemetry();

    return {
      totalTenants,
      activeTenants,
      suspendedTenants,
      pendingRegistrations,
      totalUsers,
      recentTenants,
      recentLogs,
      telemetry
    };
  }

  async deleteTenant(tenantId) {
    const tenant = await this.getTenant(tenantId);
    const numericId = Number(tenant.id);
    const companyCode = tenant.company_code;

    const { createDbConnection } = require('@stockpilot/common');

    // 1. auth_db (users, lookup, tokens)
    try {
      const authDb = createDbConnection('auth_db');
      await authDb.query('DELETE FROM refresh_tokens WHERE user_id IN (SELECT id FROM auth_users WHERE tenant_id = :id);', { replacements: { id: numericId } });
      await authDb.query('DELETE FROM auth_users WHERE tenant_id = :id;', { replacements: { id: numericId } });
      await authDb.query('DELETE FROM tenant_lookup WHERE tenant_id = :id OR company_code = :code;', { replacements: { id: numericId, code: companyCode } });
    } catch (e) {
      console.warn('[Purge auth_db note]:', e.message);
    }

    // 2. product_db (products, categories, brands)
    try {
      const productDb = createDbConnection('product_db');
      await productDb.query('DELETE FROM products WHERE tenant_id = :id;', { replacements: { id: numericId } });
      await productDb.query('DELETE FROM categories WHERE tenant_id = :id;', { replacements: { id: numericId } });
      await productDb.query('DELETE FROM brands WHERE tenant_id = :id;', { replacements: { id: numericId } });
    } catch (e) {
      console.warn('[Purge product_db note]:', e.message);
    }

    // 3. inventory_db (stocks, stock movements, stock adjustments)
    try {
      const inventoryDb = createDbConnection('inventory_db');
      await inventoryDb.query('DELETE FROM stocks WHERE tenant_id = :id;', { replacements: { id: numericId } });
      await inventoryDb.query('DELETE FROM stock_movements WHERE tenant_id = :id;', { replacements: { id: numericId } });
      await inventoryDb.query('DELETE FROM stock_adjustments WHERE tenant_id = :id;', { replacements: { id: numericId } });
    } catch (e) {
      console.warn('[Purge inventory_db note]:', e.message);
    }

    // 4. warehouse_db (transfers, warehouses)
    try {
      const whDb = createDbConnection('warehouse_db');
      await whDb.query('DELETE FROM stock_transfer_items WHERE transfer_id IN (SELECT id FROM stock_transfers WHERE tenant_id = :id);', { replacements: { id: numericId } });
      await whDb.query('DELETE FROM stock_transfers WHERE tenant_id = :id;', { replacements: { id: numericId } });
      await whDb.query('DELETE FROM warehouses WHERE tenant_id = :id;', { replacements: { id: numericId } });
    } catch (e) {
      console.warn('[Purge warehouse_db note]:', e.message);
    }

    // 5. purchase_db (orders, items, returns, suppliers)
    try {
      const purDb = createDbConnection('purchase_db');
      await purDb.query('DELETE FROM purchase_return_items WHERE return_id IN (SELECT id FROM purchase_returns WHERE tenant_id = :id);', { replacements: { id: numericId } });
      await purDb.query('DELETE FROM purchase_returns WHERE tenant_id = :id;', { replacements: { id: numericId } });
      await purDb.query('DELETE FROM purchase_items WHERE purchase_id IN (SELECT id FROM purchases WHERE tenant_id = :id);', { replacements: { id: numericId } });
      await purDb.query('DELETE FROM purchases WHERE tenant_id = :id;', { replacements: { id: numericId } });
      await purDb.query('DELETE FROM suppliers WHERE tenant_id = :id;', { replacements: { id: numericId } });
    } catch (e) {
      console.warn('[Purge purchase_db note]:', e.message);
    }

    // 6. sales_db (sales, items, returns, customers)
    try {
      const salesDb = createDbConnection('sales_db');
      await salesDb.query('DELETE FROM sale_return_items WHERE return_id IN (SELECT id FROM sale_returns WHERE tenant_id = :id);', { replacements: { id: numericId } });
      await salesDb.query('DELETE FROM sale_returns WHERE tenant_id = :id;', { replacements: { id: numericId } });
      await salesDb.query('DELETE FROM sale_items WHERE sale_id IN (SELECT id FROM sales WHERE tenant_id = :id);', { replacements: { id: numericId } });
      await salesDb.query('DELETE FROM sales WHERE tenant_id = :id;', { replacements: { id: numericId } });
      await salesDb.query('DELETE FROM customers WHERE tenant_id = :id;', { replacements: { id: numericId } });
    } catch (e) {
      console.warn('[Purge sales_db note]:', e.message);
    }

    // 7. finance_db (payments, expenses)
    try {
      const finDb = createDbConnection('finance_db');
      await finDb.query('DELETE FROM payments WHERE tenant_id = :id;', { replacements: { id: numericId } });
      await finDb.query('DELETE FROM expenses WHERE tenant_id = :id;', { replacements: { id: numericId } });
    } catch (e) {
      console.warn('[Purge finance_db note]:', e.message);
    }

    // 8. notification_db (notifications)
    try {
      const notifDb = createDbConnection('notification_db');
      await notifDb.query('DELETE FROM notifications WHERE tenant_id = :id;', { replacements: { id: numericId } });
    } catch (e) {
      console.warn('[Purge notification_db note]:', e.message);
    }

    // 9. tenant_db (self)
    await TenantUser.destroy({ where: { tenant_id: numericId } });
    await AuditLog.destroy({ where: { tenant_id: numericId } });
    await Tenant.destroy({ where: { id: numericId } });

    return { id: numericId, company_code: companyCode, company_name: tenant.company_name };
  }
}

module.exports = new TenantService();
