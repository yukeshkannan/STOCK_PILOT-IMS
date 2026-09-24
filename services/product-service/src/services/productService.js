const { Op } = require('sequelize');
const { Product, Category, Brand } = require('../models');
const { eventBus, EVENTS, cache } = require('@stockpilot/common');

class ProductService {
  async getProducts(tenantId, { search, categoryId, brandId, status, page = 1, limit = 50 }) {
    const isDefaultQuery = !search && !categoryId && !brandId && !status && Number(page) === 1;
    const cacheKey = `stockpilot:products:tenant:${tenantId}:page:${page}:limit:${limit}`;

    if (isDefaultQuery) {
      const cached = await cache.get(cacheKey);
      if (cached) return cached;
    }

    const where = { tenant_id: tenantId };

    if (categoryId) where.category_id = categoryId;
    if (brandId) where.brand_id = brandId;
    if (status) where.status = status;

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { product_code: { [Op.like]: `%${search}%` } }
      ];
    }

    const offset = (page - 1) * limit;
    const { rows, count } = await Product.findAndCountAll({
      where,
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name', 'code'] },
        { model: Brand, as: 'brand', attributes: ['id', 'name'] }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    });

    const result = { products: rows, total: count };
    if (isDefaultQuery) {
      await cache.set(cacheKey, result, 180);
    }

    return result;
  }

  async getProductById(tenantId, productId) {
    const product = await Product.findOne({
      where: { id: productId, tenant_id: tenantId },
      include: [
        { model: Category, as: 'category' },
        { model: Brand, as: 'brand' }
      ]
    });
    if (!product) {
      throw { statusCode: 404, message: 'Product not found' };
    }
    return product;
  }

  extractCompanyPrefix(userCompanyCode, userCompanyName) {
    let raw = '';
    if (userCompanyName && typeof userCompanyName === 'string' && userCompanyName.trim()) {
      // Remove common corporate suffixes/noise words
      const stripped = userCompanyName
        .replace(/\b(retailers|retail|private|limited|pvt|ltd|inc|corp|corporation|llc|enterprises|enterprise|store|stores|group|co|company|technologies|tech|solutions|services|logistics|distributors|traders|trading)\b/gi, '')
        .trim();
      const cleaned = (stripped || userCompanyName).trim().split(/[\s_\-]+/)[0];
      raw = cleaned;
    } else if (userCompanyCode && typeof userCompanyCode === 'string' && userCompanyCode.trim()) {
      raw = userCompanyCode.trim().split(/[\s_\-]+/)[0];
    }

    let prefix = (raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (prefix.length > 8) {
      prefix = prefix.substring(0, 8);
    }
    if (!prefix || prefix.length < 2) {
      prefix = 'PRD';
    }
    return prefix;
  }

  async getNextProductCode(tenantId, userCompanyCode, userCompanyName) {
    let compCode = userCompanyCode;
    let compName = userCompanyName;

    if (!compCode && !compName && tenantId) {
      try {
        const { sequelize } = require('../models');
        const [results] = await sequelize.query(
          `SELECT company_code, company_name FROM tenant_db.tenants WHERE id = :tenantId LIMIT 1`,
          { replacements: { tenantId } }
        );
        if (results && results.length > 0) {
          compCode = results[0].company_code;
          compName = results[0].company_name;
        }
      } catch (err) {
        // tenant_db query fallback catch
      }
    }

    const prefix = this.extractCompanyPrefix(compCode, compName);
    const { sequelize } = require('../models');
    const { peekNextSequenceNumber } = require('@stockpilot/common');

    // Seed sequence if table has existing items
    try {
      const productsWithPrefix = await Product.findAll({
        where: { tenant_id: tenantId, product_code: { [Op.like]: `${prefix}-%` } },
        attributes: ['product_code'],
        raw: true
      });
      let maxExisting = 0;
      for (const p of productsWithPrefix) {
        const match = (p.product_code || '').match(new RegExp(`^${prefix}-(\\d+)$`, 'i'));
        if (match && match[1]) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxExisting) maxExisting = num;
        }
      }
      if (maxExisting > 0) {
        await sequelize.query(`
          CREATE TABLE IF NOT EXISTS tenant_sequences (
            id INT AUTO_INCREMENT PRIMARY KEY,
            tenant_id INT NOT NULL,
            entity_type VARCHAR(50) NOT NULL,
            prefix VARCHAR(30) NOT NULL,
            current_number INT NOT NULL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY tenant_entity_prefix_unique (tenant_id, entity_type, prefix)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        await sequelize.query(`
          INSERT INTO tenant_sequences (tenant_id, entity_type, prefix, current_number)
          VALUES (:tenantId, 'PRODUCT', :prefix, :maxExisting)
          ON DUPLICATE KEY UPDATE current_number = GREATEST(current_number, :maxExisting);
        `, { replacements: { tenantId, prefix, maxExisting } });
      }
    } catch (e) {
      // Non-fatal seed catch
    }

    return peekNextSequenceNumber(sequelize, tenantId, 'PRODUCT', prefix, 4);
  }

  async createProduct(tenantId, productData) {
    let formattedCode = (productData.productCode || '').trim().toUpperCase();
    const prefix = this.extractCompanyPrefix(productData.companyCode, productData.companyName);
    const { sequelize } = require('../models');
    const { syncSequenceNumber, getNextSequenceNumber } = require('@stockpilot/common');

    if (!formattedCode) {
      formattedCode = await getNextSequenceNumber(sequelize, tenantId, 'PRODUCT', prefix, 4);
    } else {
      const match = formattedCode.match(new RegExp(`^${prefix}-(\\d+)$`, 'i'));
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num)) {
          await syncSequenceNumber(sequelize, tenantId, 'PRODUCT', prefix, num);
        }
      }
    }

    // Check code uniqueness
    const existing = await Product.findOne({
      where: { tenant_id: tenantId, product_code: formattedCode }
    });
    if (existing) {
      throw { statusCode: 409, message: `Product code [${formattedCode}] already exists for your company.` };
    }

    const product = await Product.create({
      tenant_id: tenantId,
      product_code: formattedCode,
      name: productData.name,
      description: productData.description || '',
      category_id: productData.categoryId || null,
      brand_id: productData.brandId || null,
      unit: productData.unit || 'PCS',
      purchase_price: productData.purchasePrice || 0,
      selling_price: productData.sellingPrice || 0,
      tax_rate: productData.taxRate !== undefined ? productData.taxRate : 18.00,
      minimum_stock: productData.minimumStock !== undefined ? productData.minimumStock : 5,
      maximum_stock: productData.maximumStock || 1000,
      image_url: productData.imageUrl || null,
      status: productData.status || 'ACTIVE'
    });

    // Publish event
    await eventBus.publish(EVENTS.PRODUCT_CREATED, {
      productId: product.id,
      tenantId,
      productCode: product.product_code,
      name: product.name,
      purchasePrice: product.purchase_price,
      sellingPrice: product.selling_price,
      minimumStock: product.minimum_stock
    });

    // Automatically initialize stock record in Inventory Service
    const INVENTORY_SERVICE_URL = process.env.INVENTORY_SERVICE_URL || 'http://localhost:5004';
    try {
      await fetch(`${INVENTORY_SERVICE_URL}/api/v1/inventory/internal/init-stock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': String(tenantId)
        },
        body: JSON.stringify({
          productId: product.id,
          productCode: product.product_code,
          productName: product.name,
          warehouseId: productData.warehouseId || 1,
          warehouseName: productData.warehouseName || 'Main Warehouse',
          minimumStock: product.minimum_stock,
          initialStock: productData.initialStock || 0,
          createdBy: productData.createdBy || 'Admin'
        })
      });
    } catch (err) {
      console.warn('Inventory stock init notice:', err.message);
    }

    // Invalidate product cache
    await cache.delByPattern(`stockpilot:products:tenant:${tenantId}:*`);

    return this.getProductById(tenantId, product.id);
  }

  async updateProduct(tenantId, productId, updateData) {
    const product = await this.getProductById(tenantId, productId);

    if (updateData.productCode && updateData.productCode !== product.product_code) {
      const formattedCode = updateData.productCode.trim().toUpperCase();
      const existing = await Product.findOne({
        where: { tenant_id: tenantId, product_code: formattedCode, id: { [Op.ne]: productId } }
      });
      if (existing) {
        throw { statusCode: 409, message: `Product code [${formattedCode}] already in use.` };
      }
      product.product_code = formattedCode;
    }

    await product.update({
      product_code: product.product_code,
      name: updateData.name !== undefined ? updateData.name : product.name,
      description: updateData.description !== undefined ? updateData.description : product.description,
      category_id: updateData.categoryId !== undefined ? updateData.categoryId : product.category_id,
      brand_id: updateData.brandId !== undefined ? updateData.brandId : product.brand_id,
      unit: updateData.unit !== undefined ? updateData.unit : product.unit,
      purchase_price: updateData.purchasePrice !== undefined ? updateData.purchasePrice : product.purchase_price,
      selling_price: updateData.sellingPrice !== undefined ? updateData.sellingPrice : product.selling_price,
      tax_rate: updateData.taxRate !== undefined ? updateData.taxRate : product.tax_rate,
      minimum_stock: updateData.minimumStock !== undefined ? updateData.minimumStock : product.minimum_stock,
      maximum_stock: updateData.maximumStock !== undefined ? updateData.maximumStock : product.maximum_stock,
      image_url: updateData.imageUrl !== undefined ? updateData.imageUrl : product.image_url,
      status: updateData.status !== undefined ? updateData.status : product.status
    });

    await eventBus.publish(EVENTS.PRODUCT_UPDATED, {
      productId: product.id,
      tenantId,
      productCode: product.product_code,
      name: product.name,
      sellingPrice: product.selling_price,
      minimumStock: product.minimum_stock
    });

    // Automatically sync updated product details to Inventory Service
    const INVENTORY_SERVICE_URL = process.env.INVENTORY_SERVICE_URL || 'http://localhost:5004';
    try {
      await fetch(`${INVENTORY_SERVICE_URL}/api/v1/inventory/internal/update-product-stock/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': String(tenantId)
        },
        body: JSON.stringify({
          productCode: product.product_code,
          productName: product.name,
          minimumStock: product.minimum_stock
        })
      });
    } catch (err) {
      console.warn('Inventory stock update notice:', err.message);
    }

    // Invalidate product cache
    await cache.delByPattern(`stockpilot:products:tenant:${tenantId}:*`);
    await cache.del(`stockpilot:product:tenant:${tenantId}:${productId}`);

    return this.getProductById(tenantId, product.id);
  }

  async deleteProduct(tenantId, productId) {
    const product = await this.getProductById(tenantId, productId);
    await product.destroy();

    // Automatically remove orphaned stock record in Inventory Service
    const INVENTORY_SERVICE_URL = process.env.INVENTORY_SERVICE_URL || 'http://localhost:5004';
    try {
      await fetch(`${INVENTORY_SERVICE_URL}/api/v1/inventory/internal/remove-product-stock/${productId}`, {
        method: 'DELETE',
        headers: {
          'x-tenant-id': String(tenantId)
        }
      });
    } catch (err) {
      console.warn('Inventory stock remove notice:', err.message);
    }

    // Invalidate product cache
    await cache.delByPattern(`stockpilot:products:tenant:${tenantId}:*`);
    await cache.del(`stockpilot:product:tenant:${tenantId}:${productId}`);

    return true;
  }

  // Categories
  async getCategories(tenantId) {
    const cacheKey = `stockpilot:categories:tenant:${tenantId}`;
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const categories = await Category.findAll({
      where: { tenant_id: tenantId },
      order: [['name', 'ASC']]
    });

    await cache.set(cacheKey, categories, 600);
    return categories;
  }

  async createCategory(tenantId, categoryData) {
    const cat = await Category.create({
      tenant_id: tenantId,
      name: categoryData.name,
      code: categoryData.code || categoryData.name.substring(0, 4).toUpperCase(),
      description: categoryData.description || ''
    });
    await cache.del(`stockpilot:categories:tenant:${tenantId}`);
    await cache.delByPattern(`stockpilot:products:tenant:${tenantId}:*`);
    return cat;
  }

  async updateCategory(tenantId, categoryId, data) {
    const cat = await Category.findOne({ where: { id: categoryId, tenant_id: tenantId } });
    if (!cat) throw { statusCode: 404, message: 'Category not found' };
    await cat.update(data);
    await cache.del(`stockpilot:categories:tenant:${tenantId}`);
    await cache.delByPattern(`stockpilot:products:tenant:${tenantId}:*`);
    return cat;
  }

  async deleteCategory(tenantId, categoryId) {
    const cat = await Category.findOne({ where: { id: categoryId, tenant_id: tenantId } });
    if (!cat) throw { statusCode: 404, message: 'Category not found' };
    await Product.update({ category_id: null }, { where: { category_id: categoryId, tenant_id: tenantId } });
    await cat.destroy();
    await cache.del(`stockpilot:categories:tenant:${tenantId}`);
    await cache.delByPattern(`stockpilot:products:tenant:${tenantId}:*`);
    return true;
  }

  // Brands
  async getBrands(tenantId) {
    const cacheKey = `stockpilot:brands:tenant:${tenantId}`;
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const brands = await Brand.findAll({
      where: { tenant_id: tenantId },
      order: [['name', 'ASC']]
    });

    await cache.set(cacheKey, brands, 600);
    return brands;
  }

  async createBrand(tenantId, brandData) {
    const brand = await Brand.create({
      tenant_id: tenantId,
      name: brandData.name,
      description: brandData.description || ''
    });
    await cache.del(`stockpilot:brands:tenant:${tenantId}`);
    await cache.delByPattern(`stockpilot:products:tenant:${tenantId}:*`);
    return brand;
  }

  async updateBrand(tenantId, brandId, data) {
    const brand = await Brand.findOne({ where: { id: brandId, tenant_id: tenantId } });
    if (!brand) throw { statusCode: 404, message: 'Brand not found' };
    await brand.update(data);
    await cache.del(`stockpilot:brands:tenant:${tenantId}`);
    await cache.delByPattern(`stockpilot:products:tenant:${tenantId}:*`);
    return brand;
  }

  async deleteBrand(tenantId, brandId) {
    const brand = await Brand.findOne({ where: { id: brandId, tenant_id: tenantId } });
    if (!brand) throw { statusCode: 404, message: 'Brand not found' };
    await Product.update({ brand_id: null }, { where: { brand_id: brandId, tenant_id: tenantId } });
    await brand.destroy();
    await cache.del(`stockpilot:brands:tenant:${tenantId}`);
    await cache.delByPattern(`stockpilot:products:tenant:${tenantId}:*`);
    return true;
  }

  async getPublicStoreCatalog(companyCode) {
    const cleanCode = (companyCode || '').trim().toUpperCase();
    let tenantInfo = null;

    // 1. Try tenant_db first for full store config and details
    try {
      const { createDatabaseConnection } = require('@stockpilot/common');
      const tenantDb = createDatabaseConnection('tenant_db');
      const [tenants] = await tenantDb.query(
        'SELECT * FROM tenants WHERE UPPER(company_code) = :code LIMIT 1;',
        { replacements: { code: cleanCode } }
      );
      if (tenants && tenants.length > 0) {
        const t = tenants[0];
        let parsedConfig = null;
        if (t.store_config) {
          try {
            parsedConfig = typeof t.store_config === 'string' ? JSON.parse(t.store_config) : t.store_config;
          } catch (e) {
            parsedConfig = null;
          }
        }

        tenantInfo = {
          tenantId: Number(t.id),
          companyCode: t.company_code,
          companyName: t.company_name,
          email: t.email,
          phone: t.phone,
          address: t.address,
          city: t.city || '',
          taxNumber: t.tax_number,
          currency: t.currency || 'INR',
          currencySymbol: t.currency_symbol || '₹',
          storeConfig: parsedConfig
        };
      }
    } catch (e) {
      console.warn('Tenant DB lookup notice:', e.message);
    }

    // 2. Fallback to auth_db tenant_lookup
    if (!tenantInfo) {
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
      } catch (e) {
        console.warn('Auth DB lookup notice:', e.message);
      }
    }

    if (!tenantInfo) {
      throw { statusCode: 404, message: `Store with code '${companyCode}' not found` };
    }

    const tenantId = tenantInfo.tenantId;

    // Fetch categories
    const categories = await Category.findAll({
      where: { tenant_id: tenantId },
      order: [['name', 'ASC']]
    });

    // Fetch active products
    const products = await Product.findAll({
      where: { tenant_id: tenantId, status: 'ACTIVE' },
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name', 'code'] },
        { model: Brand, as: 'brand', attributes: ['id', 'name'] }
      ],
      order: [['name', 'ASC']]
    });

    // Fetch real-time stocks from inventory_db
    let stockMap = {};
    try {
      const { createDatabaseConnection } = require('@stockpilot/common');
      const invDb = createDatabaseConnection('inventory_db');
      const [stocks] = await invDb.query(
        'SELECT product_id, SUM(current_stock) as total_stock, SUM(reserved_stock) as total_reserved FROM stocks WHERE tenant_id = :tenantId GROUP BY product_id;',
        { replacements: { tenantId } }
      );
      if (stocks) {
        stocks.forEach((st) => {
          const avail = Math.max(0, (Number(st.total_stock) || 0) - (Number(st.total_reserved) || 0));
          stockMap[st.product_id] = avail;
        });
      }
    } catch (e) {}

    const catalog = products.map((p) => {
      const pJson = p.toJSON();
      const currentStock = stockMap[p.id] !== undefined ? stockMap[p.id] : 15;
      return {
        ...pJson,
        availableStock: currentStock,
        inStock: currentStock > 0
      };
    });

    // Merge default store config
    const defaultConfig = {
      template: 'DEFAULT',
      theme: 'CLEAN_LIGHT',
      branding: {
        storeName: tenantInfo.companyName || 'Online Store',
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
        title: `Welcome to ${tenantInfo.companyName || 'Our Online Store'}`,
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
        address: tenantInfo.address || 'Retail Center, Main High Street',
        phone: tenantInfo.phone || '',
        email: tenantInfo.email || '',
        hours: 'Mon - Sat: 9:00 AM - 9:00 PM',
        whatsappNumber: tenantInfo.phone || '',
        whatsappMessage: `Hello! I would like to inquire about products from ${tenantInfo.companyName || 'your store'}.`
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
        phoneNumber: tenantInfo.phone || '',
        defaultMessage: `Hello! I would like to inquire about products from ${tenantInfo.companyName || 'your store'}.`
      }
    };

    const mergedConfig = tenantInfo.storeConfig
      ? {
          ...defaultConfig,
          ...tenantInfo.storeConfig,
          branding: { ...defaultConfig.branding, ...(tenantInfo.storeConfig.branding || {}) },
          navbar: { ...defaultConfig.navbar, ...(tenantInfo.storeConfig.navbar || {}) },
          hero: { ...defaultConfig.hero, ...(tenantInfo.storeConfig.hero || {}) },
          productsSection: { ...defaultConfig.productsSection, ...(tenantInfo.storeConfig.productsSection || {}) },
          testimonials: {
            ...defaultConfig.testimonials,
            ...(tenantInfo.storeConfig.testimonials || {}),
            reviews: tenantInfo.storeConfig.testimonials?.reviews || defaultConfig.testimonials.reviews
          },
          contact: { ...defaultConfig.contact, ...(tenantInfo.storeConfig.contact || {}) },
          announcement: { ...defaultConfig.announcement, ...(tenantInfo.storeConfig.announcement || {}) },
          sections: { ...defaultConfig.sections, ...(tenantInfo.storeConfig.sections || {}) },
          whatsapp: { ...defaultConfig.whatsapp, ...(tenantInfo.storeConfig.whatsapp || {}) }
        }
      : defaultConfig;

    return {
      tenant: {
        ...tenantInfo,
        storeConfig: mergedConfig
      },
      storeConfig: mergedConfig,
      categories,
      products: catalog
    };
  }
}

module.exports = new ProductService();
