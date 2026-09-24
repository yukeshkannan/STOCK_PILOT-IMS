import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import api from '../../services/api';
import Modal from '../../components/Modal';
import Badge from '../../components/Badge';
import CustomSelect from '../../components/CustomSelect';
import ConfirmModal from '../../components/ConfirmModal';
import { Package, Plus, Search, Filter, Edit2, Trash2, Tag, Layers, RefreshCw } from 'lucide-react';

export default function ProductsPage() {
  const user = useSelector((state) => state.auth?.user);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');

  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [deletingCategory, setDeletingCategory] = useState(null);
  const [deletingBrand, setDeletingBrand] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeletingItem, setIsDeletingItem] = useState(false);

  // Form states
  const [productForm, setProductForm] = useState({
    productCode: '',
    name: '',
    description: '',
    categoryId: '',
    brandId: '',
    unit: 'PCS',
    purchasePrice: 0,
    sellingPrice: 0,
    taxRate: 18,
    minimumStock: 5,
    maximumStock: 500,
    initialStock: 0,
    warehouseId: ''
  });

  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });
  const [brandForm, setBrandForm] = useState({ name: '', description: '' });

  const fetchCatalogData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedCategory) params.append('categoryId', selectedCategory);
      if (selectedBrand) params.append('brandId', selectedBrand);

      const [pRes, cRes, bRes, wRes] = await Promise.all([
        api.get(`/products?${params.toString()}`),
        api.get('/categories'),
        api.get('/brands'),
        api.get('/warehouses').catch(() => ({ data: [] }))
      ]);

      setProducts(pRes?.data || []);
      setCategories(cRes?.data || []);
      setBrands(bRes?.data || []);
      setWarehouses(wRes?.data || []);
    } catch (err) {
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalogData();
  }, [selectedCategory, selectedBrand]);

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    fetchCatalogData();
  };

  const openAddModal = async () => {
    setEditingProduct(null);
    setProductForm({
      productCode: 'Loading...',
      name: '',
      description: '',
      categoryId: '',
      brandId: '',
      unit: 'PCS',
      purchasePrice: 0,
      sellingPrice: 0,
      taxRate: 18,
      minimumStock: 5,
      maximumStock: 500,
      initialStock: 0,
      warehouseId: warehouses[0]?.id || ''
    });
    setIsProductModalOpen(true);

    try {
      const res = await api.get('/products/next-code', {
        params: {
          companyName: user?.companyName,
          companyCode: user?.companyCode
        }
      });
      const generatedCode = res?.data?.nextCode || 'PRD-0001';
      setProductForm((prev) => ({
        ...prev,
        productCode: generatedCode
      }));
    } catch (err) {
      console.warn('Auto code fetch failed, falling back:', err);
      const rawComp = (user?.companyName || user?.companyCode || 'PRD')
        .replace(/\b(retailers|retail|private|limited|pvt|ltd|inc|corp|corporation|llc|enterprises|enterprise|store|stores|group|co|company)\b/gi, '')
        .trim();
      const prefix = (rawComp.split(/[\s_\-]+/)[0] || 'PRD').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'PRD';
      setProductForm((prev) => ({
        ...prev,
        productCode: `${prefix}-0001`
      }));
    }
  };

  const openEditModal = (p) => {
    setEditingProduct(p);
    setProductForm({
      productCode: p.product_code,
      name: p.name,
      description: p.description || '',
      categoryId: p.category_id || '',
      brandId: p.brand_id || '',
      unit: p.unit || 'PCS',
      purchasePrice: parseFloat(p.purchase_price) || 0,
      sellingPrice: parseFloat(p.selling_price) || 0,
      taxRate: parseFloat(p.tax_rate) || 18,
      minimumStock: p.minimum_stock || 5,
      maximumStock: p.maximum_stock || 500,
      initialStock: 0,
      warehouseId: ''
    });
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      const selectedWh = warehouses.find(w => String(w.id) === String(productForm.warehouseId));
      const payload = {
        ...productForm,
        purchasePrice: parseFloat(productForm.purchasePrice),
        sellingPrice: parseFloat(productForm.sellingPrice),
        taxRate: parseFloat(productForm.taxRate),
        minimumStock: parseInt(productForm.minimumStock, 10),
        maximumStock: parseInt(productForm.maximumStock, 10),
        categoryId: productForm.categoryId ? parseInt(productForm.categoryId, 10) : null,
        brandId: productForm.brandId ? parseInt(productForm.brandId, 10) : null,
        initialStock: productForm.initialStock ? parseInt(productForm.initialStock, 10) : 0,
        warehouseId: productForm.warehouseId ? parseInt(productForm.warehouseId, 10) : undefined,
        warehouseName: selectedWh?.name
      };

      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, payload);
        toast.success('Product updated successfully');
      } else {
        await api.post('/products', payload);
        toast.success('Product created successfully');
      }

      setIsProductModalOpen(false);
      fetchCatalogData();
    } catch (err) {
      toast.error(err.message || 'Failed to save product');
    }
  };

  const confirmDeleteProduct = (p) => {
    setDeletingProduct(p);
  };

  const executeDeleteProduct = async () => {
    if (!deletingProduct) return;
    try {
      setIsDeleting(true);
      await api.delete(`/products/${deletingProduct.id}`);
      toast.success('Product deleted successfully');
      setDeletingProduct(null);
      fetchCatalogData();
    } catch (err) {
      toast.error(err.message || 'Delete failed');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      await api.post('/categories', categoryForm);
      toast.success('Category created successfully');
      setCategoryForm({ name: '', description: '' });
      setIsCategoryModalOpen(false);
      fetchCatalogData();
    } catch (err) {
      toast.error(err.message || 'Failed to create category');
    }
  };

  const handleCreateBrand = async (e) => {
    e.preventDefault();
    try {
      await api.post('/brands', brandForm);
      toast.success('Brand created successfully');
      setBrandForm({ name: '', description: '' });
      setIsBrandModalOpen(false);
      fetchCatalogData();
    } catch (err) {
      toast.error(err.message || 'Failed to create brand');
    }
  };

  const executeDeleteCategory = async () => {
    if (!deletingCategory) return;
    setIsDeletingItem(true);
    try {
      await api.delete(`/categories/${deletingCategory.id}`);
      toast.success(`Category "${deletingCategory.name}" deleted successfully`);
      setDeletingCategory(null);
      fetchCatalogData();
    } catch (err) {
      toast.error(err.message || 'Failed to delete category');
    } finally {
      setIsDeletingItem(false);
    }
  };

  const executeDeleteBrand = async () => {
    if (!deletingBrand) return;
    setIsDeletingItem(true);
    try {
      await api.delete(`/brands/${deletingBrand.id}`);
      toast.success(`Brand "${deletingBrand.name}" deleted successfully`);
      setDeletingBrand(null);
      fetchCatalogData();
    } catch (err) {
      toast.error(err.message || 'Failed to delete brand');
    } finally {
      setIsDeletingItem(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Products & Catalog</h1>
          <p className="page-subtitle">
            Manage your multi-tenant inventory products, pricing, categories, and brands
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button onClick={() => setIsCategoryModalOpen(true)} className="btn btn-secondary">
            <Layers size={16} /> Categories ({categories.length})
          </button>
          <button onClick={() => setIsBrandModalOpen(true)} className="btn btn-secondary">
            <Tag size={16} /> Brands ({brands.length})
          </button>
          <button onClick={openAddModal} className="btn btn-primary">
            <Plus size={16} /> Add Product
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="card" style={{ marginBottom: '1.25rem', padding: '0.85rem 1.25rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '2.2rem', fontSize: '0.825rem' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by SKU, Product Name..."
            />
          </div>

          <div style={{ width: '190px' }}>
            <CustomSelect
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              placeholder="All Categories"
              size="sm"
              options={[
                { value: '', label: 'All Categories' },
                ...categories.map((c) => ({ value: c.id, label: c.name }))
              ]}
            />
          </div>

          <div style={{ width: '190px' }}>
            <CustomSelect
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              placeholder="All Brands"
              size="sm"
              options={[
                { value: '', label: 'All Brands' },
                ...brands.map((b) => ({ value: b.id, label: b.name }))
              ]}
            />
          </div>

          <button type="submit" className="btn btn-secondary btn-sm">
            <Filter size={14} /> Filter
          </button>
          <button type="button" onClick={() => { setSearch(''); setSelectedCategory(''); setSelectedBrand(''); fetchCatalogData(); }} className="btn btn-secondary btn-sm">
            <RefreshCw size={14} /> Reset
          </button>
        </form>
      </div>

      {/* Products Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container" style={{ border: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Code / SKU</th>
                <th>Product Name</th>
                <th>Category</th>
                <th>Brand</th>
                <th>Cost Price</th>
                <th>Selling Price</th>
                <th>Margin</th>
                <th>Tax Rate</th>
                <th>Min Stock</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                    Loading product catalog...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                    No products found. Click "Add Product" to create your first item!
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const cost = parseFloat(p.purchase_price) || 0;
                  const price = parseFloat(p.selling_price) || 0;
                  const margin = price > 0 ? (((price - cost) / price) * 100).toFixed(1) : 0;

                  return (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600, color: '#7c3aed', fontFamily: 'monospace' }}>{p.product_code}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{p.name}</div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{p.unit}</div>
                      </td>
                      <td style={{ color: '#475569' }}>{p.category?.name || '—'}</td>
                      <td style={{ color: '#475569' }}>{p.brand?.name || '—'}</td>
                      <td style={{ color: '#64748b' }}>₹{cost.toLocaleString()}</td>
                      <td style={{ fontWeight: 700, color: '#0f172a' }}>₹{price.toLocaleString()}</td>
                      <td>
                        <span style={{ color: margin >= 20 ? '#059669' : '#d97706', fontWeight: 600, fontSize: '0.8rem' }}>
                          {margin}%
                        </span>
                      </td>
                      <td style={{ color: '#64748b' }}>{p.tax_rate}%</td>
                      <td style={{ color: '#64748b' }}>{p.minimum_stock}</td>
                      <td>
                        <Badge status={p.status || 'ACTIVE'} />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => openEditModal(p)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '0.25rem 0.5rem' }}
                            title="Edit Product"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => confirmDeleteProduct(p)}
                            className="btn btn-danger btn-sm"
                            style={{ padding: '0.25rem 0.5rem' }}
                            title="Delete Product"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Product Modal */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title={editingProduct ? `Edit Product: ${editingProduct.product_code}` : 'Add New Product'}
      >
        <form onSubmit={handleSaveProduct}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Product Code / SKU</label>
              <input
                type="text"
                className="form-input"
                style={{
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  color: 'var(--primary)',
                  backgroundColor: 'var(--bg-surface-elevated, #f8fafc)',
                  cursor: 'not-allowed',
                  opacity: 0.95
                }}
                value={productForm.productCode}
                readOnly
                tabIndex={-1}
                placeholder="Auto-generated"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Unit of Measure</label>
              <CustomSelect
                value={productForm.unit}
                onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                options={[
                  { value: 'PCS', label: 'PCS (Pieces)' },
                  { value: 'BOX', label: 'BOX (Boxes)' },
                  { value: 'PACK', label: 'PACK (Packets)' },
                  { value: 'KG', label: 'KG (Kilograms)' },
                  { value: 'LTR', label: 'LTR (Litres)' },
                  { value: 'MTR', label: 'MTR (Metres)' },
                  { value: 'DOZEN', label: 'DOZEN (12 Units)' },
                  { value: 'SET', label: 'SET (Sets)' }
                ]}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Product Name *</label>
            <input
              type="text"
              className="form-input"
              value={productForm.name}
              onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
              placeholder="e.g. Dell XPS 15 Laptop"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Category</label>
              <CustomSelect
                value={productForm.categoryId}
                onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                placeholder="Select Category"
                options={[
                  { value: '', label: 'Select Category' },
                  ...categories.map((c) => ({ value: c.id, label: c.name }))
                ]}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Brand (Optional)</label>
              <CustomSelect
                value={productForm.brandId}
                onChange={(e) => setProductForm({ ...productForm, brandId: e.target.value })}
                placeholder="Select Brand"
                options={[
                  { value: '', label: 'Select Brand' },
                  ...brands.map((b) => ({ value: b.id, label: b.name }))
                ]}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Purchase / Cost Price (₹) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-input"
                value={productForm.purchasePrice}
                onChange={(e) => setProductForm({ ...productForm, purchasePrice: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Selling Price (₹) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-input"
                value={productForm.sellingPrice}
                onChange={(e) => setProductForm({ ...productForm, sellingPrice: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">GST Tax Rate (%)</label>
              <CustomSelect
                value={productForm.taxRate}
                onChange={(e) => setProductForm({ ...productForm, taxRate: e.target.value })}
                options={[
                  { value: 0, label: '0% (Exempted)' },
                  { value: 5, label: '5% GST' },
                  { value: 12, label: '12% GST' },
                  { value: 18, label: '18% GST (Standard)' },
                  { value: 28, label: '28% GST' }
                ]}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Minimum Stock Alert Threshold *</label>
              <input
                type="number"
                min="0"
                className="form-input"
                value={productForm.minimumStock}
                onChange={(e) => setProductForm({ ...productForm, minimumStock: e.target.value })}
                placeholder="Alert threshold (e.g. 5)"
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={() => setIsProductModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingProduct ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Category Manager Modal */}
      <Modal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} title="Product Categories">
        <form onSubmit={handleCreateCategory} style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">New Category Name</label>
              <input
                type="text"
                className="form-input"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                placeholder="e.g. Laptops & Computers"
                required
              />
            </div>
            <div style={{ alignSelf: 'flex-end', marginBottom: '1rem' }}>
              <button type="submit" className="btn btn-primary">
                + Add Category
              </button>
            </div>
          </div>
        </form>

        <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Category Name</th>
                <th>Code</th>
                <th style={{ textAlign: 'right', width: '70px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem' }}>
                    No categories found.
                  </td>
                </tr>
              ) : (
                categories.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td><code>{c.code || '—'}</code></td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => setDeletingCategory(c)}
                        className="btn btn-danger btn-sm"
                        style={{ padding: '0.25rem 0.5rem' }}
                        title="Delete Category"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Modal>

      {/* Brand Manager Modal */}
      <Modal isOpen={isBrandModalOpen} onClose={() => setIsBrandModalOpen(false)} title="Product Brands">
        <form onSubmit={handleCreateBrand} style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">New Brand Name</label>
              <input
                type="text"
                className="form-input"
                value={brandForm.name}
                onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })}
                placeholder="e.g. Dell, Apple, Sony"
                required
              />
            </div>
            <div style={{ alignSelf: 'flex-end', marginBottom: '1rem' }}>
              <button type="submit" className="btn btn-primary">
                + Add Brand
              </button>
            </div>
          </div>
        </form>

        <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Brand Name</th>
                <th>Description</th>
                <th style={{ textAlign: 'right', width: '70px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {brands.length === 0 ? (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem' }}>
                    No brands found.
                  </td>
                </tr>
              ) : (
                brands.map((b) => (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 600 }}>{b.name}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{b.description || '—'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => setDeletingBrand(b)}
                        className="btn btn-danger btn-sm"
                        style={{ padding: '0.25rem 0.5rem' }}
                        title="Delete Brand"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Modal>

      {/* Delete Confirmation Modal for Product */}
      <ConfirmModal
        isOpen={!!deletingProduct}
        onClose={() => setDeletingProduct(null)}
        onConfirm={executeDeleteProduct}
        title="Delete Product?"
        message="Are you sure you want to delete this product from catalog? This action cannot be undone."
        itemName={deletingProduct ? `${deletingProduct.name} (${deletingProduct.product_code})` : ''}
        confirmText="Delete Product"
        loading={isDeleting}
      />

      {/* Delete Confirmation Modal for Category */}
      <ConfirmModal
        isOpen={!!deletingCategory}
        onClose={() => setDeletingCategory(null)}
        onConfirm={executeDeleteCategory}
        title="Delete Category?"
        message="Are you sure you want to delete this category? Products currently assigned to this category will become unassigned."
        itemName={deletingCategory ? deletingCategory.name : ''}
        confirmText="Delete Category"
        loading={isDeletingItem}
      />

      {/* Delete Confirmation Modal for Brand */}
      <ConfirmModal
        isOpen={!!deletingBrand}
        onClose={() => setDeletingBrand(null)}
        onConfirm={executeDeleteBrand}
        title="Delete Brand?"
        message="Are you sure you want to delete this brand? Products currently assigned to this brand will become unassigned."
        itemName={deletingBrand ? deletingBrand.name : ''}
        confirmText="Delete Brand"
        loading={isDeletingItem}
      />
    </div>
  );
}
