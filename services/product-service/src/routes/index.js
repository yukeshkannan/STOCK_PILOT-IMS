const express = require('express');
const productController = require('../controllers/productController');
const {
  authenticateToken,
  requireTenant,
  requirePermission,
  PERMISSIONS
} = require('@stockpilot/common');

// Products Router
const productRouter = express.Router();

// Public Unauthenticated Store Catalog Route (for customer-facing storefront)
productRouter.get('/public/store/:companyCode', (req, res, next) => productController.getPublicStoreCatalog(req, res, next));

// Authenticated Routes
productRouter.use(authenticateToken, requireTenant);

productRouter.get('/', requirePermission(PERMISSIONS.PRODUCT_VIEW), (req, res, next) => productController.getProducts(req, res, next));
productRouter.get('/next-code', requirePermission(PERMISSIONS.PRODUCT_VIEW), (req, res, next) => productController.getNextProductCode(req, res, next));
productRouter.post('/', requirePermission(PERMISSIONS.PRODUCT_CREATE), (req, res, next) => productController.createProduct(req, res, next));
productRouter.get('/:id', requirePermission(PERMISSIONS.PRODUCT_VIEW), (req, res, next) => productController.getProduct(req, res, next));
productRouter.put('/:id', requirePermission(PERMISSIONS.PRODUCT_UPDATE), (req, res, next) => productController.updateProduct(req, res, next));
productRouter.delete('/:id', requirePermission(PERMISSIONS.PRODUCT_DELETE), (req, res, next) => productController.deleteProduct(req, res, next));

// Categories Router
const categoryRouter = express.Router();
categoryRouter.use(authenticateToken, requireTenant);

categoryRouter.get('/', requirePermission(PERMISSIONS.PRODUCT_VIEW), (req, res, next) => productController.getCategories(req, res, next));
categoryRouter.post('/', requirePermission(PERMISSIONS.CATEGORY_MANAGE), (req, res, next) => productController.createCategory(req, res, next));
categoryRouter.put('/:id', requirePermission(PERMISSIONS.CATEGORY_MANAGE), (req, res, next) => productController.updateCategory(req, res, next));
categoryRouter.delete('/:id', requirePermission(PERMISSIONS.CATEGORY_MANAGE), (req, res, next) => productController.deleteCategory(req, res, next));

// Brands Router
const brandRouter = express.Router();
brandRouter.use(authenticateToken, requireTenant);

brandRouter.get('/', requirePermission(PERMISSIONS.PRODUCT_VIEW), (req, res, next) => productController.getBrands(req, res, next));
brandRouter.post('/', requirePermission(PERMISSIONS.BRAND_MANAGE), (req, res, next) => productController.createBrand(req, res, next));
brandRouter.put('/:id', requirePermission(PERMISSIONS.BRAND_MANAGE), (req, res, next) => productController.updateBrand(req, res, next));
brandRouter.delete('/:id', requirePermission(PERMISSIONS.BRAND_MANAGE), (req, res, next) => productController.deleteBrand(req, res, next));

module.exports = {
  productRouter,
  categoryRouter,
  brandRouter
};
