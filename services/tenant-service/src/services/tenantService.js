const { Tenant, TenantUser, Role, Permission, AuditLog } = require('../models');
const { ROLES, PERMISSIONS, DEFAULT_ROLE_PERMISSIONS } = require('@stockpilot/common');

const http = require('http');
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:5001';

async function fetchFromAuth(endpoint, options = {}) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(`${AUTH_SERVICE_URL}${endpoint}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data !== undefined ? json.data : json;
  } catch (err) {
    return null;
  }
}

let lastSyncTime = 0;
const SYNC_COOLDOWN_MS = 60000; // 1 minute cooldown to prevent hammering DB and timeout

class TenantService {
  async syncAuthLookups(force = false) {
    const now = Date.now();
    if (!force && now - lastSyncTime < SYNC_COOLDOWN_MS) {
      return;
    }
    lastSyncTime = now;

    let lookups = [];
    let users = [];

    // 1. Try HTTP API call to auth-service
    const authData = await fetchFromAuth('/api/v1/auth/internal/tenant-lookups');
    if (authData && authData.lookups) {
      lookups = authData.lookups;
      users = authData.users || [];
    } else {
      // 2. Fallback to local require if on single filesystem
      try {
        const authModels = require('../../../auth-service/src/models');
        if (authModels?.TenantLookup) {
          lookups = await authModels.TenantLookup.findAll();
          if (authModels?.User) {
            users = await authModels.User.findAll({ where: { is_super_admin: false } });
          }
        }
      } catch (err) {
        // Fallback to direct DB query if needed
        try {
          const { createDbConnection } = require('@stockpilot/common');
          const authDb = createDbConnection('auth_db');
          const [dbLookups] = await authDb.query('SELECT * FROM tenant_lookup;');
          const [dbUsers] = await authDb.query('SELECT * FROM auth_users WHERE is_super_admin = 0 OR is_super_admin IS NULL;');
          lookups = dbLookups || [];
          users = dbUsers || [];
        } catch {}
      }
    }

    if (lookups && lookups.length > 0) {
      for (const l of lookups) {
        const tenantId = Number(l.tenant_id);
        const [tenant, created] = await Tenant.findOrCreate({
          where: { id: tenantId },
          defaults: {
            id: tenantId,
            company_code: l.company_code,
            company_name: l.company_name,
            email: l.email || '',
            status: l.status || 'ACTIVE',
            plan: l.plan || 'TRIAL'
          }
        });

        if (!created && l.status && tenant.status !== l.status) {
          await tenant.update({ status: l.status, plan: l.plan || tenant.plan });
        }

        // Sync associated users
        const tenantUsers = users.filter((u) => Number(u.tenant_id) === tenantId);
        for (const u of tenantUsers) {
          await TenantUser.findOrCreate({
            where: { tenant_id: tenantId, email: u.email },
            defaults: {
              tenant_id: tenantId,
              first_name: u.first_name,
              last_name: u.last_name || '',
              email: u.email,
              phone: u.phone || null,
              role_name: u.role_name || 'ADMIN',
              status: u.status || 'ACTIVE'
            }
          });
        }
      }
    }
  }

  async provisionTenantInternal(data) {
    const { tenantId, companyCode, companyName, email, phone, address, city, taxNumber, plan, adminUser, managerUser, staffUser } = data;
    const cleanPlan = (plan || 'TRIAL').toString().trim().toUpperCase();

    const [tenant, created] = await Tenant.findOrCreate({
      where: { id: tenantId },
      defaults: {
        id: tenantId,
        company_code: companyCode.toUpperCase(),
        company_name: companyName,
        email: email || '',
        phone: phone || null,
        address: address || city || null,
        tax_number: taxNumber || null,
        status: 'ACTIVE',
        plan: cleanPlan
      }
    });

    if (!created) {
      await tenant.update({
        company_code: companyCode.toUpperCase(),
        company_name: companyName,
        email: email || tenant.email,
        phone: phone || tenant.phone,
        address: address || city || tenant.address,
        tax_number: taxNumber || tenant.tax_number,
        plan: cleanPlan,
        status: 'ACTIVE'
      });
    }

    if (adminUser) {
      await TenantUser.findOrCreate({
        where: { tenant_id: tenantId, email: adminUser.email.toLowerCase().trim() },
        defaults: {
          tenant_id: tenantId,
          first_name: adminUser.firstName,
          last_name: adminUser.lastName || '',
          email: adminUser.email.toLowerCase().trim(),
          phone: adminUser.phone || null,
          role_name: ROLES.ADMIN,
          status: 'ACTIVE'
        }
      });
    }

    if (managerUser) {
      await TenantUser.findOrCreate({
        where: { tenant_id: tenantId, email: managerUser.email.toLowerCase().trim() },
        defaults: {
          tenant_id: tenantId,
          first_name: managerUser.firstName,
          last_name: managerUser.lastName || '',
          email: managerUser.email.toLowerCase().trim(),
          role_name: ROLES.MANAGER,
          status: 'ACTIVE'
        }
      });
    }

    if (staffUser) {
      await TenantUser.findOrCreate({
        where: { tenant_id: tenantId, email: staffUser.email.toLowerCase().trim() },
        defaults: {
          tenant_id: tenantId,
          first_name: staffUser.firstName,
          last_name: staffUser.lastName || '',
          email: staffUser.email.toLowerCase().trim(),
          role_name: ROLES.STAFF,
          status: 'ACTIVE'
        }
      });
    }

    try {
      await AuditLog.create({
        tenant_id: tenantId,
        user_id: adminUser?.id || 1,
        user_name: adminUser?.email || 'Platform Registration',
        action: 'TENANT_REGISTERED',
        module: 'TENANT',
        record_id: `ORG-${tenantId}`,
        description: `New organization [${companyName}] (${companyCode}) registered with Admin [${adminUser?.email || email}]`
      });
    } catch {}

    return tenant;
  }

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

    // Auto-sync from auth_db TenantLookup if missing in tenant_db
    if (!tenant && tenantId) {
      await this.syncAuthLookups();
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

  async getSettings(tenantId, userContext = null) {
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
        companyName: userContext?.companyName || 'StockPilot Organization',
        companyCode: userContext?.companyCode || 'ORG',
        email: userContext?.email || '',
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

  async getStoreConfig(tenantId) {
    const tenant = await this.getTenant(tenantId);
    let parsedConfig = null;
    if (tenant.store_config) {
      try {
        parsedConfig = typeof tenant.store_config === 'string' ? JSON.parse(tenant.store_config) : tenant.store_config;
      } catch (e) {
        parsedConfig = null;
      }
    }

    const defaultConfig = {
      template: 'DEFAULT',
      theme: 'CLEAN_LIGHT',
      branding: {
        storeName: tenant.company_name || 'Online Store',
        tagline: 'Quality Products Delivered Directly to Your Doorstep',
        primaryColor: '#982A86',
        accentColor: '#10b981',
        bgColor: '#ffffff',
        cardColor: '#ffffff',
        textColor: '#0f172a',
        logoUrl: '',
        bannerUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=80'
      },
      announcement: {
        enabled: false,
        text: 'Free express delivery on orders above ₹499 | 100% Genuine Quality Guaranteed'
      },
      navbar: {
        enabled: true,
        showPhone: true,
        showAddress: true,
        showWhatsApp: true,
        showCart: true
      },
      hero: {
        enabled: true,
        badge: 'Official Online Store',
        title: `Welcome to ${tenant.company_name || 'Our Online Store'}`,
        subtitle: 'Shop the freshest arrivals, exclusive store offers, and verified products delivered quickly.',
        ctaText: 'Explore Catalog',
        secondaryCtaText: 'Contact Store',
        imageUrl: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=1200&q=80'
      },
      productsSection: {
        enabled: true,
        title: 'Featured Catalog',
        subtitle: 'Browse all available products in real-time inventory',
        showSearch: true,
        showCategories: true,
        showStockBadge: true
      },
      testimonials: {
        enabled: true,
        title: 'Customer Stories & Reviews',
        subtitle: 'Trusted by thousands of happy shoppers',
        reviews: [
          { id: 1, name: 'Priya Sharma', rating: 5, comment: 'Outstanding quality and super fast delivery. The ordering process was seamless!', role: 'Verified Buyer', location: 'Chennai' },
          { id: 2, name: 'Rajesh Kumar', rating: 5, comment: '100% authentic products. Direct WhatsApp updates made the whole purchase effortless.', role: 'Verified Customer', location: 'Bengaluru' },
          { id: 3, name: 'Sneha Patel', rating: 5, comment: 'Best pricing and prompt customer assistance. Will definitely order regularly!', role: 'Verified Buyer', location: 'Mumbai' }
        ]
      },
      contact: {
        enabled: true,
        title: 'Visit Our Store & Contact',
        subtitle: 'Reach out to our team directly for inquiries and orders',
        address: tenant.address || 'Retail Center, Main High Street',
        phone: tenant.phone || '',
        email: tenant.email || '',
        hours: 'Mon - Sat: 9:00 AM - 9:00 PM',
        whatsappNumber: tenant.phone || '',
        whatsappMessage: `Hello! I would like to inquire about products from ${tenant.company_name || 'your store'}.`
      },
      sections: {
        categoriesEnabled: true,
        featuredProductsEnabled: true,
        trustBadgesEnabled: true,
        testimonialsEnabled: true,
        contactFooterEnabled: true
      },
      trustBadges: [
        { icon: 'Zap', title: 'Express Dispatch', desc: 'Fast doorstep delivery' },
        { icon: 'ShieldCheck', title: '100% Genuine', desc: 'Verified from authorized stock' },
        { icon: 'CreditCard', title: 'UPI & COD', desc: 'Secure & flexible payments' },
        { icon: 'Phone', title: 'Direct Support', desc: 'WhatsApp & phone assistance' }
      ],
      whatsapp: {
        enabled: true,
        phoneNumber: tenant.phone || '',
        defaultMessage: `Hello! I would like to inquire about products from ${tenant.company_name || 'your store'}.`
      }
    };

    return {
      companyCode: tenant.company_code,
      companyName: tenant.company_name,
      email: tenant.email,
      phone: tenant.phone,
      address: tenant.address,
      currency: tenant.currency || 'INR',
      currencySymbol: tenant.currency_symbol || '₹',
      ...(parsedConfig
        ? {
            ...defaultConfig,
            ...parsedConfig,
            branding: { ...defaultConfig.branding, ...(parsedConfig.branding || {}) },
            navbar: { ...defaultConfig.navbar, ...(parsedConfig.navbar || {}) },
            hero: { ...defaultConfig.hero, ...(parsedConfig.hero || {}) },
            productsSection: { ...defaultConfig.productsSection, ...(parsedConfig.productsSection || {}) },
            testimonials: {
              ...defaultConfig.testimonials,
              ...(parsedConfig.testimonials || {}),
              reviews: parsedConfig.testimonials?.reviews || defaultConfig.testimonials.reviews
            },
            contact: { ...defaultConfig.contact, ...(parsedConfig.contact || {}) },
            announcement: { ...defaultConfig.announcement, ...(parsedConfig.announcement || {}) },
            sections: { ...defaultConfig.sections, ...(parsedConfig.sections || {}) },
            whatsapp: { ...defaultConfig.whatsapp, ...(parsedConfig.whatsapp || {}) }
          }
        : defaultConfig)
    };
  }

  async updateStoreConfig(tenantId, storeConfig) {
    const tenant = await this.getTenant(tenantId);
    const serialized = typeof storeConfig === 'string' ? storeConfig : JSON.stringify(storeConfig);
    await tenant.update({ store_config: serialized });
    return this.getStoreConfig(tenantId);
  }

  // Platform Super Admin methods
  async getAllTenants() {
    await this.syncAuthLookups();

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
    let pendingUsers = [];

    // 1. Try HTTP API call to auth-service
    const authData = await fetchFromAuth('/api/v1/auth/internal/pending-users');
    if (Array.isArray(authData)) {
      pendingUsers = authData;
    } else {
      // 2. Fallback to local require
      try {
        const authModels = require('../../../auth-service/src/models');
        if (authModels?.User) {
          const { Op } = require('sequelize');
          pendingUsers = await authModels.User.findAll({
            where: {
              [Op.or]: [
                { status: 'PENDING_SETUP' },
                { tenant_id: null }
              ],
              is_super_admin: false
            },
            order: [['created_at', 'DESC']]
          });
        }
      } catch (err) {
        try {
          const { createDbConnection } = require('@stockpilot/common');
          const authDb = createDbConnection('auth_db');
          const [dbUsers] = await authDb.query("SELECT * FROM auth_users WHERE (status = 'PENDING_SETUP' OR tenant_id IS NULL) AND (is_super_admin = 0 OR is_super_admin IS NULL) ORDER BY created_at DESC;");
          pendingUsers = dbUsers || [];
        } catch {}
      }
    }

    return (pendingUsers || []).map((u) => ({
      id: `pending-${u.id}`,
      pending_user_id: u.id,
      company_name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'Incomplete Setup',
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

  async deletePendingRegistration(userId) {
    // 1. Try HTTP call to auth-service
    try {
      const res = await fetch(`${AUTH_SERVICE_URL}/api/v1/auth/internal/pending-users/${userId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        const json = await res.json();
        return json?.data || { id: userId };
      }
    } catch {}

    // 2. Fallback to local require
    try {
      const authModels = require('../../../auth-service/src/models');
      if (authModels?.User) {
        const user = await authModels.User.findOne({
          where: { id: userId, is_super_admin: false }
        });
        if (user) {
          if (authModels?.RefreshToken) {
            await authModels.RefreshToken.destroy({ where: { user_id: userId } });
          }
          const email = user.email;
          await user.destroy();
          return { id: userId, email, company_name: `${user.first_name} ${user.last_name || ''}`.trim() };
        }
      }
    } catch {}

    // 3. Fallback to direct DB
    try {
      const { createDbConnection } = require('@stockpilot/common');
      const authDb = createDbConnection('auth_db');
      await authDb.query('DELETE FROM refresh_tokens WHERE user_id = :id;', { replacements: { id: userId } });
      await authDb.query('DELETE FROM auth_users WHERE id = :id;', { replacements: { id: userId } });
      return { id: userId };
    } catch {}

    return { id: userId };
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

  async getPlatformDashboard() {
    await this.syncAuthLookups();

    const [
      totalTenants,
      activeTenants,
      suspendedTenants,
      totalUsers,
      recentTenants,
      recentLogs,
      pendingList
    ] = await Promise.all([
      Tenant.count(),
      Tenant.count({ where: { status: 'ACTIVE' } }),
      Tenant.count({ where: { status: 'SUSPENDED' } }),
      TenantUser.count({ where: { is_super_admin: false } }),
      Tenant.findAll({ limit: 10, order: [['created_at', 'DESC']] }),
      AuditLog.findAll({
        limit: 10,
        include: [{ model: Tenant, as: 'tenant', attributes: ['id', 'company_name', 'company_code'], required: false }],
        order: [['created_at', 'DESC']]
      }),
      this.getPendingRegistrations().catch(() => [])
    ]);

    const formattedRecentLogs = (recentLogs || []).map((r) => {
      const data = r.toJSON ? r.toJSON() : r;
      return {
        ...data,
        tenant_name: data.tenant?.company_name || (data.tenant_id ? `Organization #${data.tenant_id}` : 'Global Platform'),
        tenant_code: data.tenant?.company_code || 'GLOBAL'
      };
    });

    return {
      totalTenants,
      activeTenants,
      suspendedTenants,
      pendingRegistrations: pendingList?.length || 0,
      totalUsers,
      recentTenants,
      recentLogs: formattedRecentLogs
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
