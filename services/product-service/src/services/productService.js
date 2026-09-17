const { Op } = require('sequelize');
const { Product, Category, Brand } = require('../models');
const { eventBus, EVENTS } = require('@stockpilot/common');

class ProductService {
  async getProducts(tenantId, { search, categoryId, brandId, status, page = 1, limit = 50 }) {
    const where = { tenant_id: tenantId };

    if (categoryId) where.category_id = categoryId;
    if (brandId) where.brand_id = brandId;
    if (status) where.status = status;

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { product_code: { [Op.like]: `%${search}%` } },
        { barcode: { [Op.like]: `%${search}%` } }
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

    return { products: rows, total: count };
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
      barcode: productData.barcode || formattedCode,
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
      barcode: updateData.barcode !== undefined ? updateData.barcode : product.barcode,
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

    return true;
  }

  // Categories
  async getCategories(tenantId) {
    return Category.findAll({
      where: { tenant_id: tenantId },
      order: [['name', 'ASC']]
    });
  }

  async createCategory(tenantId, categoryData) {
    return Category.create({
      tenant_id: tenantId,
      name: categoryData.name,
      code: categoryData.code || categoryData.name.substring(0, 4).toUpperCase(),
      description: categoryData.description || ''
    });
  }

  async updateCategory(tenantId, categoryId, data) {
    const cat = await Category.findOne({ where: { id: categoryId, tenant_id: tenantId } });
    if (!cat) throw { statusCode: 404, message: 'Category not found' };
    await cat.update(data);
    return cat;
  }

  async deleteCategory(tenantId, categoryId) {
    const cat = await Category.findOne({ where: { id: categoryId, tenant_id: tenantId } });
    if (!cat) throw { statusCode: 404, message: 'Category not found' };
    await cat.destroy();
    return true;
  }

  // Brands
  async getBrands(tenantId) {
    return Brand.findAll({
      where: { tenant_id: tenantId },
      order: [['name', 'ASC']]
    });
  }

  async createBrand(tenantId, brandData) {
    return Brand.create({
      tenant_id: tenantId,
      name: brandData.name,
      description: brandData.description || ''
    });
  }

  async updateBrand(tenantId, brandId, data) {
    const brand = await Brand.findOne({ where: { id: brandId, tenant_id: tenantId } });
    if (!brand) throw { statusCode: 404, message: 'Brand not found' };
    await brand.update(data);
    return brand;
  }

  async deleteBrand(tenantId, brandId) {
    const brand = await Brand.findOne({ where: { id: brandId, tenant_id: tenantId } });
    if (!brand) throw { statusCode: 404, message: 'Brand not found' };
    await brand.destroy();
    return true;
  }
}

module.exports = new ProductService();
