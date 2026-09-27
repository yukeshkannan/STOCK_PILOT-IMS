const { ApiResponse } = require('@stockpilot/common');
const productService = require('../services/productService');
const { z } = require('zod');

const productSchema = z.object({
  productCode: z.string().optional(),
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  categoryId: z.number().optional().nullable(),
  brandId: z.number().optional().nullable(),
  unit: z.string().optional(),
  purchasePrice: z.number().nonnegative().optional(),
  sellingPrice: z.number().nonnegative().optional(),
  taxRate: z.number().nonnegative().optional(),
  minimumStock: z.number().int().nonnegative().optional(),
  maximumStock: z.number().int().optional(),
  imageUrl: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'DISCONTINUED']).optional(),
  initialStock: z.number().int().nonnegative().optional(),
  warehouseId: z.number().int().optional(),
  warehouseName: z.string().optional()
});

class ProductController {
  _getTenantId(req) {
    const tid = req.tenantId || req.user?.tenantId || req.user?.tenant_id || req.headers['x-tenant-id'] || req.query?.tenantId;
    return (tid !== undefined && tid !== null && tid !== '') ? parseInt(tid, 10) : null;
  }

  async getNextProductCode(req, res, next) {
    try {
      const companyCode = req.user?.companyCode || req.query?.companyCode;
      const companyName = req.user?.companyName || req.query?.companyName;
      const tenantId = this._getTenantId(req);
      const nextCode = await productService.getNextProductCode(
        tenantId,
        companyCode,
        companyName
      );
      return ApiResponse.success(res, { nextCode }, 'Next product code generated');
    } catch (err) {
      next(err);
    }
  }

  async getProducts(req, res, next) {
    try {
      const tenantId = this._getTenantId(req);
      const { search, categoryId, brandId, status, page = 1, limit = 50 } = req.query;
      const result = await productService.getProducts(tenantId, {
        search,
        categoryId: categoryId ? parseInt(categoryId, 10) : undefined,
        brandId: brandId ? parseInt(brandId, 10) : undefined,
        status,
        page,
        limit
      });
      return ApiResponse.paginated(res, result.products, page, limit, result.total, 'Products retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getProduct(req, res, next) {
    try {
      const tenantId = this._getTenantId(req);
      const product = await productService.getProductById(tenantId, req.params.id);
      return ApiResponse.success(res, product, 'Product details');
    } catch (err) {
      next(err);
    }
  }

  async createProduct(req, res, next) {
    try {
      const tenantId = this._getTenantId(req);
      const validated = productSchema.parse(req.body);
      const product = await productService.createProduct(tenantId, {
        ...validated,
        companyCode: req.user?.companyCode,
        companyName: req.user?.companyName
      });
      return ApiResponse.created(res, product, 'Product created successfully');
    } catch (err) {
      next(err);
    }
  }

  async updateProduct(req, res, next) {
    try {
      const tenantId = this._getTenantId(req);
      const product = await productService.updateProduct(tenantId, req.params.id, req.body);
      return ApiResponse.success(res, product, 'Product updated successfully');
    } catch (err) {
      next(err);
    }
  }

  async deleteProduct(req, res, next) {
    try {
      const tenantId = this._getTenantId(req);
      await productService.deleteProduct(tenantId, req.params.id);
      return ApiResponse.success(res, null, 'Product deleted successfully');
    } catch (err) {
      next(err);
    }
  }

  // Categories
  async getCategories(req, res, next) {
    try {
      const tenantId = this._getTenantId(req);
      const categories = await productService.getCategories(tenantId);
      return ApiResponse.success(res, categories, 'Categories retrieved');
    } catch (err) {
      next(err);
    }
  }

  async createCategory(req, res, next) {
    try {
      const tenantId = this._getTenantId(req);
      const category = await productService.createCategory(tenantId, req.body);
      return ApiResponse.created(res, category, 'Category created');
    } catch (err) {
      next(err);
    }
  }

  async updateCategory(req, res, next) {
    try {
      const tenantId = this._getTenantId(req);
      const category = await productService.updateCategory(tenantId, req.params.id, req.body);
      return ApiResponse.success(res, category, 'Category updated');
    } catch (err) {
      next(err);
    }
  }

  async deleteCategory(req, res, next) {
    try {
      const tenantId = this._getTenantId(req);
      await productService.deleteCategory(tenantId, req.params.id);
      return ApiResponse.success(res, null, 'Category deleted');
    } catch (err) {
      next(err);
    }
  }

  // Brands
  async getBrands(req, res, next) {
    try {
      const tenantId = this._getTenantId(req);
      const brands = await productService.getBrands(tenantId);
      return ApiResponse.success(res, brands, 'Brands retrieved');
    } catch (err) {
      next(err);
    }
  }

  async createBrand(req, res, next) {
    try {
      const tenantId = this._getTenantId(req);
      const brand = await productService.createBrand(tenantId, req.body);
      return ApiResponse.created(res, brand, 'Brand created');
    } catch (err) {
      next(err);
    }
  }

  async updateBrand(req, res, next) {
    try {
      const tenantId = this._getTenantId(req);
      const brand = await productService.updateBrand(tenantId, req.params.id, req.body);
      return ApiResponse.success(res, brand, 'Brand updated');
    } catch (err) {
      next(err);
    }
  }

  async deleteBrand(req, res, next) {
    try {
      const tenantId = this._getTenantId(req);
      await productService.deleteBrand(tenantId, req.params.id);
      return ApiResponse.success(res, null, 'Brand deleted');
    } catch (err) {
      next(err);
    }
  }

  async getPublicStoreCatalog(req, res, next) {
    try {
      const { companyCode } = req.params;
      const catalog = await productService.getPublicStoreCatalog(companyCode);
      return ApiResponse.success(res, catalog, 'Public store catalog retrieved');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ProductController();
