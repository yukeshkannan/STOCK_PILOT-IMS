import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import api from '../../services/api';
import Modal from '../../components/Modal';
import Badge from '../../components/Badge';
import CustomSelect from '../../components/CustomSelect';
import ConfirmModal from '../../components/ConfirmModal';
import {
  Layers,
  Sliders,
  History,
  AlertTriangle,
  ArrowUpDown,
  RefreshCw,
  Warehouse,
  Search,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  Package,
  Trash2,
  ArrowRightLeft,
  Building,
  Send
} from 'lucide-react';

export default function InventoryPage() {
  const { user: currentUser } = useSelector((state) => state.auth);

  // Role & Branch Scope
  const userRole = (currentUser?.roleName || currentUser?.role || '').toUpperCase();
  const isSuperAdmin = Boolean(currentUser?.isSuperAdmin) || userRole === 'SUPER_ADMIN';
  const isGlobalAdmin = isSuperAdmin || (userRole === 'ADMIN' && !currentUser?.warehouseId);
  const isBranchScoped = Boolean(currentUser?.warehouseId) && !isGlobalAdmin;
  const branchWhId = currentUser?.warehouseId ? String(currentUser.warehouseId) : '';
  const branchWhName = currentUser?.warehouseName || currentUser?.warehouse_name || '';

  const [activeTab, setActiveTab] = useState('stocks'); // 'stocks' | 'movements'
  const [stocks, setStocks] = useState([]);
  const [movements, setMovements] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const [selectedWarehouse, setSelectedWarehouse] = useState(branchWhId);
  const [selectedMovementType, setSelectedMovementType] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [search, setSearch] = useState('');

  // Adjustment Modal
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedStockItem, setSelectedStockItem] = useState(null);
  const [adjustForm, setAdjustForm] = useState({
    adjustmentType: 'ADD', // 'ADD' | 'SUBTRACT' | 'SET'
    quantity: 1,
    reason: 'Manual Stock Count'
  });

  // Requisition Modal (Request Stock from Hub)
  const [isRequisitionModalOpen, setIsRequisitionModalOpen] = useState(false);
  const [requisitionItem, setRequisitionItem] = useState(null);
  const [requisitionForm, setRequisitionForm] = useState({
    fromWarehouseId: '',
    quantity: 5,
    notes: ''
  });
  const [submittingRequisition, setSubmittingRequisition] = useState(false);

  // Delete Confirm Modal State
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    type: '', // 'stock' | 'movement'
    id: null,
    title: '',
    message: '',
    itemName: '',
    loading: false
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const stockParams = new URLSearchParams();
      const activeWhId = isBranchScoped ? branchWhId : selectedWarehouse;
      if (activeWhId) stockParams.append('warehouseId', activeWhId);
      if (lowStockFilter) stockParams.append('lowStockOnly', 'true');
      if (search) stockParams.append('search', search);

      const movParams = new URLSearchParams();
      if (activeWhId) movParams.append('warehouseId', activeWhId);
      if (selectedMovementType) movParams.append('movementType', selectedMovementType);

      const [stockRes, movRes, whRes, prodRes] = await Promise.all([
        api.get(`/inventory?${stockParams.toString()}`),
        api.get(`/inventory/movements?${movParams.toString()}`),
        api.get('/warehouses'),
        api.get('/products').catch(() => ({ data: [] }))
      ]);

      const activeProducts = prodRes?.data || [];
      const productMap = new Map(activeProducts.map((p) => [p.id, p]));
      const allWhs = whRes?.data || [];

      let rawStocks = (stockRes?.data || [])
        .filter((s) => productMap.has(s.product_id))
        .map((s) => {
          const matchedProd = productMap.get(s.product_id);
          return {
            ...s,
            product_name: matchedProd?.name || s.product_name,
            product_code: matchedProd?.product_code || s.product_code,
            minimum_stock: matchedProd?.minimum_stock !== undefined ? parseInt(matchedProd.minimum_stock, 10) : s.minimum_stock
          };
        });

      let rawMovements = movRes?.data || [];

      // Enforce strict branch scoping on client data
      if (isBranchScoped && branchWhId) {
        rawStocks = rawStocks.filter((s) => String(s.warehouse_id) === String(branchWhId));
        rawMovements = rawMovements.filter((m) => String(m.warehouse_id) === String(branchWhId));
      }

      setStocks(rawStocks);
      setMovements(rawMovements);
      setWarehouses(allWhs);
      setProducts(activeProducts);
    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedWarehouse, selectedMovementType, lowStockFilter, isBranchScoped, branchWhId]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchData();
  };

  const handleResetSearch = () => {
    if (!isBranchScoped) {
      setSelectedWarehouse('');
    }
    setSelectedMovementType('');
    setLowStockFilter(false);
    setSearch('');
    setTimeout(() => {
      fetchData();
    }, 50);
  };

  const openDeleteStockModal = (stock) => {
    setDeleteConfirm({
      isOpen: true,
      type: 'stock',
      id: stock.id,
      title: 'Delete Stock Record?',
      message: 'Remove this product balance from warehouse inventory?',
      itemName: `${stock.product_name} (${stock.warehouse_name}) • Current Stock: ${stock.current_stock}`,
      loading: false
    });
  };

  const openDeleteMovementModal = (movement) => {
    setDeleteConfirm({
      isOpen: true,
      type: 'movement',
      id: movement.id,
      title: 'Delete Movement Log?',
      message: 'Remove this audit log entry from movement history?',
      itemName: `${movement.product_name} • ${movement.movement_type} (${movement.quantity > 0 ? `+${movement.quantity}` : movement.quantity})`,
      loading: false
    });
  };

  const handleExecuteDelete = async () => {
    try {
      setDeleteConfirm((prev) => ({ ...prev, loading: true }));
      if (deleteConfirm.type === 'stock') {
        await api.delete(`/inventory/${deleteConfirm.id}`);
        toast.success('Stock record deleted');
      } else if (deleteConfirm.type === 'movement') {
        await api.delete(`/inventory/movements/${deleteConfirm.id}`);
        toast.success('Movement log deleted');
      }
      setDeleteConfirm({ isOpen: false, type: '', id: null, title: '', message: '', itemName: '', loading: false });
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Delete failed');
      setDeleteConfirm((prev) => ({ ...prev, loading: false }));
    }
  };

  const uninitializedProducts = useMemo(() => {
    if (lowStockFilter || search) return [];
    return products.filter((p) => !stocks.some((s) => s.product_id === p.id));
  }, [products, stocks, lowStockFilter, search]);


  const handleSyncAllCatalog = async () => {
    try {
      setSyncing(true);
      const whId = isBranchScoped ? branchWhId : selectedWarehouse || warehouses[0]?.id || 1;
      const targetWh = warehouses.find((w) => String(w.id) === String(whId));

      const uninit = products.filter((p) => !stocks.some((s) => s.product_id === p.id));

      for (const p of uninit) {
        await api.post('/inventory/init', {
          productId: p.id,
          productCode: p.product_code,
          productName: p.name,
          warehouseId: whId,
          warehouseName: targetWh?.name || 'Main Warehouse',
          minimumStock: p.minimum_stock || 5,
          initialStock: 0
        });
      }

      await fetchData();
      toast.success('Catalog items synced to inventory successfully');
    } catch (err) {
      console.error('Catalog sync error:', err);
      toast.error('Failed to sync catalog items to inventory');
    } finally {
      setSyncing(false);
    }
  };

  const openAdjustModal = (stockItem) => {
    setSelectedStockItem(stockItem);
    setAdjustForm({
      adjustmentType: 'ADD',
      quantity: 1,
      reason: ''
    });
    setIsAdjustModalOpen(true);
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStockItem) return;

    try {
      await api.post('/inventory/adjust', {
        productId: selectedStockItem.product_id,
        warehouseId: selectedStockItem.warehouse_id,
        adjustmentType: adjustForm.adjustmentType,
        quantity: parseInt(adjustForm.quantity, 10),
        reason: adjustForm.reason
      });
      toast.success('Inventory adjustment recorded');
      setIsAdjustModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to adjust stock');
    }
  };

  // Requisition Handler
  const openRequisitionModal = (stockItem) => {
    setRequisitionItem(stockItem);
    // Find origin hub (defaults to first warehouse that isn't this branch)
    const otherWh = warehouses.find((w) => String(w.id) !== String(stockItem.warehouse_id || branchWhId));
    setRequisitionForm({
      fromWarehouseId: otherWh ? String(otherWh.id) : (warehouses[0]?.id ? String(warehouses[0].id) : ''),
      quantity: 5,
      notes: `Requisition request for ${stockItem.product_name} by ${currentUser?.name || currentUser?.email || 'Branch Staff'}`
    });
    setIsRequisitionModalOpen(true);
  };

  const handleRequisitionSubmit = async (e) => {
    e.preventDefault();
    if (!requisitionItem) return;

    try {
      setSubmittingRequisition(true);
      const targetWhId = branchWhId || requisitionItem.warehouse_id;
      const originWhId = requisitionForm.fromWarehouseId;

      if (String(originWhId) === String(targetWhId)) {
        toast.warning('Origin hub and destination facility must be different');
        return;
      }

      await api.post('/transfers', {
        fromWarehouseId: parseInt(originWhId, 10),
        toWarehouseId: parseInt(targetWhId, 10),
        items: [
          {
            productId: requisitionItem.product_id,
            productCode: requisitionItem.product_code,
            productName: requisitionItem.product_name,
            quantity: parseInt(requisitionForm.quantity, 10)
          }
        ],
        requestedBy: `${currentUser?.name || 'Staff'} (${branchWhName || 'Branch'})`,
        notes: requisitionForm.notes || 'Sub-warehouse replenishment request',
        carrierType: 'IN_HOUSE'
      });

      toast.success('Stock requisition submitted! Sent to Main Warehouse Admin for approval.');
      setIsRequisitionModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to submit stock requisition');
    } finally {
      setSubmittingRequisition(false);
    }
  };

  // Filtered Display Stocks
  const displayStocks = useMemo(() => {
    if (lowStockFilter) {
      return stocks.filter((s) => {
        const current = parseInt(s.current_stock, 10) || 0;
        const min = parseInt(s.minimum_stock, 10) || 0;
        return current <= min && current > 0;
      });
    }
    return stocks;
  }, [stocks, lowStockFilter]);

  // Aggregated Stock Metrics
  const totalCurrentStock = useMemo(() => {
    return stocks.reduce((sum, s) => sum + (parseInt(s.current_stock, 10) || 0), 0);
  }, [stocks]);

  const totalAvailableStock = useMemo(() => {
    return stocks.reduce((sum, s) => sum + (parseInt(s.available_stock != null ? s.available_stock : s.current_stock, 10) || 0), 0);
  }, [stocks]);

  const lowStockCount = useMemo(() => {
    return stocks.filter((s) => {
      const current = parseInt(s.current_stock, 10) || 0;
      const min = parseInt(s.minimum_stock, 10) || 0;
      return current <= min && current > 0;
    }).length;
  }, [stocks]);

  return (
    <div>
      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <h1 className="page-title" style={{ margin: 0 }}>
              {isBranchScoped && branchWhName ? `${branchWhName} Live Stock & History` : 'Live Inventory & Stock History'}
            </h1>
            {isBranchScoped && branchWhName && (
              <span
                style={{
                  fontSize: '0.725rem',
                  fontWeight: 800,
                  background: 'var(--primary-light)',
                  color: 'var(--primary)',
                  border: '1px solid var(--primary-border)',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Building size={12} /> Assigned Branch Scoped
              </span>
            )}
          </div>
          <p className="page-subtitle" style={{ marginTop: '4px' }}>
            {isBranchScoped
              ? `Real-time SKU balances and stock movements for ${branchWhName}`
              : 'Real-time warehouse stock levels, automated balances, and immutable movement ledger'}
          </p>
        </div>

        {/* Segmented View Tabs */}
        <div className="segmented-control">
          <button
            onClick={() => setActiveTab('stocks')}
            className={`segmented-tab ${activeTab === 'stocks' ? 'active' : ''}`}
          >
            <Layers size={15} /> Live Stock Levels ({displayStocks.length})
          </button>
          <button
            onClick={() => setActiveTab('movements')}
            className={`segmented-tab ${activeTab === 'movements' ? 'active' : ''}`}
          >
            <History size={15} /> Movement Ledger ({movements.length})
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
        <div className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
            <Package size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Current Stock</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>{totalCurrentStock.toLocaleString()} units</div>
          </div>
        </div>

        <div className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Live Available</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981', marginTop: '2px' }}>{totalAvailableStock.toLocaleString()} units</div>
          </div>
        </div>

        <div className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
            <AlertTriangle size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Low Stock Items</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: lowStockCount > 0 ? '#f59e0b' : 'var(--text-main)', marginTop: '2px' }}>
              {lowStockCount} {lowStockCount === 1 ? 'item' : 'items'}
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(139, 92, 246, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6' }}>
            <History size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Movements</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#8b5cf6', marginTop: '2px' }}>{movements.length} records</div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ marginBottom: '1.25rem', padding: '0.85rem 1.25rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search Input */}
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '2.2rem', fontSize: '0.825rem' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product code, name..."
            />
          </div>

          {/* Warehouse Selector / Locked Badge */}
          {isBranchScoped ? (
            <div
              style={{
                height: '34px',
                background: 'var(--primary-light)',
                border: '1px solid var(--primary-border)',
                borderRadius: '8px',
                padding: '0 10px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--primary)',
                fontWeight: 700,
                fontSize: '0.8rem'
              }}
            >
              <Warehouse size={14} />
              <span>{branchWhName || 'Assigned Facility'}</span>
            </div>
          ) : (
            <div style={{ width: '190px' }}>
              <CustomSelect
                value={selectedWarehouse}
                onChange={(e) => setSelectedWarehouse(e.target.value)}
                placeholder="All Warehouses"
                size="sm"
                options={[
                  { value: '', label: 'All Warehouses' },
                  ...warehouses.map((w) => ({ value: String(w.id), label: w.name }))
                ]}
              />
            </div>
          )}

          {/* Movement Type Selector (Shown only when in Movements tab) */}
          {activeTab === 'movements' && (
            <div style={{ width: '190px' }}>
              <CustomSelect
                value={selectedMovementType}
                onChange={(e) => setSelectedMovementType(e.target.value)}
                placeholder="All Movement Types"
                size="sm"
                options={[
                  { value: '', label: 'All Movement Types' },
                  { value: 'PURCHASE', label: 'Purchase (+)' },
                  { value: 'SALE', label: 'Sale (-)' },
                  { value: 'TRANSFER_IN', label: 'Transfer In (+)' },
                  { value: 'TRANSFER_OUT', label: 'Transfer Out (-)' },
                  { value: 'ADJUSTMENT', label: 'Adjustment (±)' },
                  { value: 'RETURN_IN', label: 'Customer Return (+)' },
                  { value: 'RETURN_OUT', label: 'Supplier Return (-)' },
                  { value: 'DAMAGE', label: 'Damage (-)' }
                ]}
              />
            </div>
          )}

          {/* Low Stock Checkbox (Only in Stocks tab) */}
          {activeTab === 'stocks' && (
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                cursor: 'pointer',
                fontSize: '0.825rem',
                fontWeight: 600,
                color: lowStockFilter ? '#d97706' : 'var(--text-secondary)'
              }}
            >
              <input
                type="checkbox"
                checked={lowStockFilter}
                onChange={(e) => setLowStockFilter(e.target.checked)}
              />
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <AlertTriangle size={13} color="#d97706" />
                Low Stock Only
              </span>
            </label>
          )}

          <button type="submit" className="btn btn-secondary btn-sm">
            <Search size={14} /> Filter
          </button>

          <button type="button" onClick={handleResetSearch} className="btn btn-secondary btn-sm">
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Reset
          </button>
        </form>
      </div>

      {/* Uninitialized Products Sync Banner */}
      {uninitializedProducts.length > 0 && activeTab === 'stocks' && (
        <div
          style={{
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem 1.25rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Package size={20} color="var(--primary)" />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-main)' }}>
                {uninitializedProducts.length} Catalog {uninitializedProducts.length === 1 ? 'Product' : 'Products'} Not Yet Tracked In Live Inventory
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                Initialize them into Live Stock with 0 balance (Out of Stock) so you can adjust units or purchase stock.
              </div>
            </div>
          </div>
          <button
            onClick={handleSyncAllCatalog}
            disabled={syncing}
            className="btn btn-primary btn-sm"
            style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}
          >
            <RefreshCw size={13} className={syncing ? 'spin' : ''} />
            {syncing ? 'Initializing Stock...' : `Initialize ${uninitializedProducts.length} Products`}
          </button>
        </div>
      )}

      {/* Main Content Area */}
      {activeTab === 'stocks' ? (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-container" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product SKU</th>
                  <th>Product Name</th>
                  <th>Warehouse</th>
                  <th style={{ textAlign: 'center' }}>Current Stock</th>
                  <th style={{ textAlign: 'center' }}>Reserved</th>
                  <th style={{ textAlign: 'center' }}>Available (Live)</th>
                  <th style={{ textAlign: 'center' }}>Threshold</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                      Loading stock balances...
                    </td>
                  </tr>
                ) : displayStocks.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-muted)' }}>
                      {lowStockFilter ? (
                        <>
                          <CheckCircle2 size={36} color="#10b981" style={{ margin: '0 auto 0.75rem' }} />
                          <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                            No Low Stock Items Found
                          </div>
                          <p style={{ fontSize: '0.825rem', maxWidth: '460px', margin: '0 auto 1rem', color: 'var(--text-secondary)' }}>
                            All warehouse stock levels are currently healthy and above their minimum safety thresholds.
                          </p>
                          <button
                            onClick={() => setLowStockFilter(false)}
                            className="btn btn-secondary btn-sm"
                            style={{ margin: '0 auto', display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
                          >
                            <RefreshCw size={13} /> View All Inventory
                          </button>
                        </>
                      ) : (
                        <>
                          <Package size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
                          <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                            No Live Stock Records Found
                          </div>
                          <p style={{ fontSize: '0.825rem', maxWidth: '460px', margin: '0 auto 1rem', color: 'var(--text-secondary)' }}>
                            Products created in your Catalog need to be initialized with 0 units or purchased via Purchase Orders to show up in warehouse inventory.
                          </p>
                          {products.length > 0 && (
                            <button
                              onClick={handleSyncAllCatalog}
                              disabled={syncing}
                              className="btn btn-primary btn-sm"
                              style={{ margin: '0 auto', display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
                            >
                              <RefreshCw size={14} className={syncing ? 'spin' : ''} />
                              {syncing ? 'Initializing...' : `Initialize All ${products.length} Products to Live Stock`}
                            </button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ) : (
                  displayStocks.map((s) => {
                    const current = parseInt(s.current_stock, 10) || 0;
                    const min = parseInt(s.minimum_stock, 10) || 0;
                    const isLow = current <= min && current > 0;
                    const isOut = current <= 0;

                    return (
                      <tr key={s.id}>
                        <td style={{ fontWeight: 600, color: 'var(--primary)', fontFamily: 'monospace' }}>{s.product_code}</td>
                        <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{s.product_name}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.825rem' }}>
                            <Warehouse size={13} color="var(--text-muted)" />
                            <span>{s.warehouse_name}</span>
                          </div>
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--text-main)', fontSize: '0.925rem' }}>
                          {current}
                        </td>
                        <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{s.reserved_stock || 0}</td>
                        <td style={{ textAlign: 'center', fontWeight: 700, color: '#10b981', fontSize: '0.925rem' }}>
                          {s.available_stock != null ? s.available_stock : current}
                        </td>
                        <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                          Min: {min}
                        </td>
                        <td>
                          {isOut ? (
                            <span className="badge badge-danger">Out of Stock</span>
                          ) : isLow ? (
                            <span className="badge badge-warning">Low Stock</span>
                          ) : (
                            <span className="badge badge-success">Healthy</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                            {/* Requisition Button for branch staff/managers when stock is low or out */}
                            {isBranchScoped && (
                              <button
                                onClick={() => openRequisitionModal(s)}
                                className="btn btn-primary btn-sm"
                                style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                title="Request Stock from Main Warehouse Hub"
                              >
                                <ArrowRightLeft size={12} /> Request Hub
                              </button>
                            )}

                            <button
                              onClick={() => openAdjustModal(s)}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem' }}
                              title="Adjust Stock Manually"
                            >
                              <Sliders size={13} /> Adjust
                            </button>
                            {isGlobalAdmin && (
                              <button
                                onClick={() => openDeleteStockModal(s)}
                                className="btn btn-danger btn-sm"
                                style={{ padding: '0.25rem 0.45rem', fontSize: '0.75rem' }}
                                title="Delete Stock Record"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
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
      ) : (
        /* Movements Tab */
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-container" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Product</th>
                  <th>Warehouse</th>
                  <th>Movement Type</th>
                  <th style={{ textAlign: 'center' }}>Quantity</th>
                  <th style={{ textAlign: 'center' }}>Balance After</th>
                  <th>Reference</th>
                  <th>Notes</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                      Loading movement ledger...
                    </td>
                  </tr>
                ) : movements.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-muted)' }}>
                      <History size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
                      <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                        No Movement Records Found
                      </div>
                      <p style={{ fontSize: '0.825rem', maxWidth: '420px', margin: '0 auto', color: 'var(--text-secondary)' }}>
                        All incoming purchases, sales dispatches, transfers, and inventory adjustments for this facility will log an immutable audit trail here.
                      </p>
                    </td>
                  </tr>
                ) : (
                  movements.map((m) => {
                    const isPositive = ['PURCHASE', 'TRANSFER_IN', 'RETURN_IN'].includes(m.movement_type);
                    return (
                      <tr key={m.id}>
                        <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          {new Date(m.created_at).toLocaleString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.85rem' }}>{m.product_name}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{m.product_code}</div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.825rem' }}>
                            <Warehouse size={13} color="var(--text-muted)" />
                            <span>{m.warehouse_name}</span>
                          </div>
                        </td>
                        <td>
                          <span
                            style={{
                              fontSize: '0.725rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: isPositive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                              color: isPositive ? '#10b981' : '#ef4444'
                            }}
                          >
                            {m.movement_type}
                          </span>
                        </td>
                        <td
                          style={{
                            textAlign: 'center',
                            fontWeight: 800,
                            fontSize: '0.925rem',
                            color: isPositive ? '#10b981' : '#ef4444'
                          }}
                        >
                          {isPositive ? `+${m.quantity}` : m.quantity}
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--text-main)' }}>{m.balance_after}</td>
                        <td>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)', background: 'var(--bg-surface-elevated)', padding: '2px 6px', borderRadius: '4px' }}>
                            {m.reference_type} #{m.reference_id || '—'}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {m.notes || '—'}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {isGlobalAdmin && (
                            <button
                              onClick={() => openDeleteMovementModal(m)}
                              className="btn btn-danger btn-sm"
                              style={{ padding: '0.25rem 0.45rem', fontSize: '0.75rem' }}
                              title="Delete Movement Log"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {selectedStockItem && (
        <Modal
          isOpen={isAdjustModalOpen}
          onClose={() => setIsAdjustModalOpen(false)}
          title={`Adjust Stock: ${selectedStockItem.product_name}`}
        >
          {/* Summary Card */}
          <div style={{
            background: 'var(--bg-surface-elevated, #f8fafc)',
            padding: '0.85rem 1rem',
            borderRadius: 'var(--radius-md, 8px)',
            marginBottom: '1rem',
            border: '1px solid var(--border-color, #e2e8f0)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>Warehouse</div>
              <div style={{ fontWeight: 700, color: 'var(--text-main, #0f172a)', fontSize: '0.9rem', marginTop: '2px' }}>{selectedStockItem.warehouse_name}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>Current Stock</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary, #982A86)' }}>
                {selectedStockItem.current_stock} units
              </div>
            </div>
          </div>

          <form onSubmit={handleAdjustSubmit}>
            <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Action *</label>
                <CustomSelect
                  value={adjustForm.adjustmentType}
                  onChange={(e) => setAdjustForm({ ...adjustForm, adjustmentType: e.target.value })}
                  options={[
                    { value: 'ADD', label: 'Add Stock (+)' },
                    { value: 'SUBTRACT', label: 'Subtract Stock (-)' },
                    { value: 'SET', label: 'Set Exact Balance (=)' }
                  ]}
                />
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">
                  {adjustForm.adjustmentType === 'SET' ? 'New Total *' : 'Quantity *'}
                </label>
                <input
                  type="number"
                  min="1"
                  className="form-input"
                  value={adjustForm.quantity}
                  onChange={(e) => setAdjustForm({ ...adjustForm, quantity: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">Reason *</label>
              <input
                type="text"
                className="form-input"
                value={adjustForm.reason}
                onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                placeholder="e.g. Audit count, Damage, Surplus found"
                required
              />
            </div>

            <div className="modal-footer">
              <button type="button" onClick={() => setIsAdjustModalOpen(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Apply Adjustment
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Sub-Warehouse Requisition Modal (Request Stock from Hub) */}
      {requisitionItem && (
        <Modal
          isOpen={isRequisitionModalOpen}
          onClose={() => setIsRequisitionModalOpen(false)}
          title="Raise Stock Requisition to Hub"
          maxWidth="560px"
        >
          <div
            style={{
              background: 'var(--primary-light)',
              border: '1px solid var(--primary-border)',
              borderRadius: '8px',
              padding: '0.85rem 1rem',
              marginBottom: '1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--primary)', textTransform: 'uppercase', fontWeight: 800 }}>Requested Product</div>
              <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.925rem', marginTop: '2px' }}>{requisitionItem.product_name}</div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontFamily: 'monospace' }}>{requisitionItem.product_code}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Your Store Stock</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 900, color: requisitionItem.current_stock <= 0 ? '#dc2626' : '#d97706' }}>
                {requisitionItem.current_stock} Units
              </div>
            </div>
          </div>

          <form onSubmit={handleRequisitionSubmit}>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">Source Fulfillment Hub *</label>
              <CustomSelect
                value={requisitionForm.fromWarehouseId}
                onChange={(e) => setRequisitionForm({ ...requisitionForm, fromWarehouseId: e.target.value })}
                options={warehouses
                  .filter((w) => String(w.id) !== String(branchWhId || requisitionItem.warehouse_id))
                  .map((w) => ({ value: String(w.id), label: `${w.name} (${w.city || 'Hub'})` }))}
              />
              <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '3px' }}>
                The central facility where stocks are requested from.
              </div>
            </div>

            <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Destination Facility (Locked)</label>
                <input
                  type="text"
                  className="form-input"
                  disabled
                  value={branchWhName || requisitionItem.warehouse_name || 'Assigned Branch'}
                  style={{ background: '#f1f5f9', fontWeight: 700, color: 'var(--primary)' }}
                />
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Required Units *</label>
                <input
                  type="number"
                  min="1"
                  className="form-input"
                  value={requisitionForm.quantity}
                  onChange={(e) => setRequisitionForm({ ...requisitionForm, quantity: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">Requisition Notes & Urgency</label>
              <textarea
                rows={2}
                className="form-input"
                value={requisitionForm.notes}
                onChange={(e) => setRequisitionForm({ ...requisitionForm, notes: e.target.value })}
                placeholder="e.g. Customer demand spike, please dispatch via morning carrier"
              />
            </div>

            <div className="modal-footer">
              <button type="button" onClick={() => setIsRequisitionModalOpen(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingRequisition}
                className="btn btn-primary"
                style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Send size={14} />
                {submittingRequisition ? 'Submitting...' : 'Submit Requisition to Hub Admin'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Sleek Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={handleExecuteDelete}
        title={deleteConfirm.title}
        message={deleteConfirm.message}
        itemName={deleteConfirm.itemName}
        confirmText="Delete"
        loading={deleteConfirm.loading}
      />
    </div>
  );
}
