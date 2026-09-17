import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import api from '../../services/api';
import Modal from '../../components/Modal';
import Badge from '../../components/Badge';
import CustomSelect from '../../components/CustomSelect';
import ConfirmModal from '../../components/ConfirmModal';
import {
  Warehouse,
  ArrowRightLeft,
  Plus,
  CheckCircle,
  XCircle,
  MapPin,
  User,
  Check,
  Trash2,
  Save,
  RotateCcw,
  Building2,
  ShieldCheck,
  ChevronRight,
  Boxes,
  Lock,
  Clock,
  Truck,
  Printer,
  FileText,
  Navigation,
  Phone,
  Send,
  PackageCheck,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Search,
  Filter,
  Package,
  AlertTriangle,
  CheckCircle2,
  Layers,
  Eye,
  Settings,
  ArrowUpRight,
  TrendingUp,
  SlidersHorizontal,
  RefreshCw,
  ExternalLink,
  Sparkles,
  ArrowDownLeft,
  CheckCheck,
  Info,
  Building,
  Maximize2
} from 'lucide-react';

const CAPACITY_UNIT_OPTIONS = [
  { value: 'Square Feet (Sq. Ft)', label: 'Square Feet (Sq. Ft) - Usable Floor Area' },
  { value: 'Square Meters (Sq. M)', label: 'Square Meters (Sq. M) - Metric Floor Area' },
  { value: 'Pallet Bays / Racks', label: 'Pallet Bays / Racks - Bay Capacity' },
  { value: 'Cubic Feet (Cu. Ft)', label: 'Cubic Feet (Cu. Ft) - Volumetric Storage' },
  { value: 'Metric Tons (MT)', label: 'Metric Tons (MT) - Heavy Load Limit' },
  { value: 'Total Units / Pcs', label: 'Total Units / Pcs - Unit Volume' }
];

export default function WarehousesPage() {
  const { user: currentUser } = useSelector((state) => state.auth);

  // Role & Scope Permissions
  const assignedWhId = currentUser?.warehouseId || currentUser?.warehouse_id ? String(currentUser?.warehouseId || currentUser?.warehouse_id) : null;
  const assignedWhName = currentUser?.warehouseName || currentUser?.warehouse_name || null;
  const userRole = (currentUser?.roleName || currentUser?.role || '').toUpperCase();
  const isSuperAdmin = Boolean(currentUser?.isSuperAdmin) || userRole === 'SUPER_ADMIN';
  const isAdmin = userRole === 'ADMIN' || isSuperAdmin;
  const isGlobalAdmin = isSuperAdmin || (userRole === 'ADMIN' && !assignedWhId);
  const isBranchScoped = Boolean(assignedWhId) && !isGlobalAdmin;
  const isBranchAdmin = userRole === 'ADMIN' && isBranchScoped;
  const isStaff = userRole === 'STAFF';

  // Permission capabilities
  const canManageWarehouse = isGlobalAdmin; // Only Global Admin can register new warehouse hubs
  const canDeleteWarehouse = isGlobalAdmin; // Only Global Admin can delete warehouses
  const canEditWarehouse = isGlobalAdmin || (isBranchAdmin && isBranchScoped); // Global Admin & Branch Admin can configure their facility
  const canInitiateTransfer = true; // Operational movements
  const canApproveTransfer = isGlobalAdmin || isBranchAdmin; // Governance

  // Top Tabs: 'warehouses' (Facilities Directory) | 'inventory' (Stock Matrix) | 'transfers' (Logistics & Movements)
  const [activeTab, setActiveTab] = useState('warehouses');
  const [warehouses, setWarehouses] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [products, setProducts] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Live Inventory Matrix Tab Filters & Selection
  const [selectedInventoryWhId, setSelectedInventoryWhId] = useState(assignedWhId ? String(assignedWhId) : 'ALL');
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState('ALL');
  const [inventoryStatusFilter, setInventoryStatusFilter] = useState('ALL'); // 'ALL' | 'HEALTHY' | 'LOW_STOCK' | 'OUT_OF_STOCK'

  // Transfers Filter
  const [transferStatusFilter, setTransferStatusFilter] = useState('ALL');

  // Modals & Selection states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [configuringWarehouse, setConfiguringWarehouse] = useState(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [deletingWarehouse, setDeletingWarehouse] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [rejectingTransfer, setRejectingTransfer] = useState(null);
  const [isRejecting, setIsRejecting] = useState(false);
  const [deletingTransfer, setDeletingTransfer] = useState(null);
  const [isDeletingTransfer, setIsDeletingTransfer] = useState(false);

  // Logistics & Transport Modals
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [dispatchModalTransfer, setDispatchModalTransfer] = useState(null);
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchForm, setDispatchForm] = useState({
    carrierType: 'IN_HOUSE',
    carrierName: '',
    vehicleNo: '',
    driverName: '',
    driverPhone: '',
    trackingNumber: '',
    estimatedArrival: ''
  });

  const [isChallanModalOpen, setIsChallanModalOpen] = useState(false);
  const [challanTransfer, setChallanTransfer] = useState(null);
  const [showTransportInTransferForm, setShowTransportInTransferForm] = useState(false);

  // Form states for creation
  const [whForm, setWhForm] = useState({
    name: '',
    code: '',
    address: '',
    city: '',
    managerName: '',
    phone: '',
    capacity: 25000,
    capacityUnit: 'Square Feet (Sq. Ft)',
    isDefault: false,
    status: 'ACTIVE'
  });

  // Form states for editing selected warehouse
  const [editForm, setEditForm] = useState({
    name: '',
    code: '',
    address: '',
    city: '',
    managerName: '',
    phone: '',
    capacity: 25000,
    capacityUnit: 'Square Feet (Sq. Ft)',
    isDefault: false,
    status: 'ACTIVE'
  });

  const [transferForm, setTransferForm] = useState({
    fromWarehouseId: '',
    toWarehouseId: '',
    productId: '',
    quantity: 1,
    notes: '',
    carrierType: 'IN_HOUSE',
    carrierName: '',
    vehicleNo: '',
    driverName: '',
    driverPhone: '',
    trackingNumber: '',
    estimatedArrival: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [whRes, trfRes, prdRes, stkRes] = await Promise.all([
        api.get('/warehouses'),
        api.get('/transfers'),
        api.get('/products?limit=500').catch(() => ({ data: [] })),
        api.get('/inventory?limit=500').catch(() => ({ data: { stocks: [] } }))
      ]);

      const whList = whRes?.data || [];
      setWarehouses(whList);
      setTransfers(trfRes?.data || []);
      setProducts(prdRes?.data || []);
      const rawStocks = stkRes?.data?.stocks || stkRes?.data || [];
      setStocks(Array.isArray(rawStocks) ? rawStocks : []);

      if (configuringWarehouse) {
        const fresh = whList.find((w) => w.id === configuringWarehouse.id);
        if (fresh) {
          setConfiguringWarehouse(fresh);
        }
      }
    } catch (err) {
      console.error('Error loading warehouse data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-scope inventory tab to assigned branch warehouse if user is branch-scoped
  useEffect(() => {
    if (isBranchScoped && assignedWhId) {
      setSelectedInventoryWhId(String(assignedWhId));
    }
  }, [assignedWhId, isBranchScoped]);

  // When configuringWarehouse opens, populate editForm
  useEffect(() => {
    if (configuringWarehouse) {
      setEditForm({
        name: configuringWarehouse.name || '',
        code: configuringWarehouse.code || '',
        address: configuringWarehouse.address || '',
        city: configuringWarehouse.city || '',
        managerName: configuringWarehouse.manager_name || '',
        phone: configuringWarehouse.phone || '',
        capacity: configuringWarehouse.capacity || 25000,
        capacityUnit: configuringWarehouse.capacity_unit || 'Square Feet (Sq. Ft)',
        isDefault: Boolean(configuringWarehouse.is_default),
        status: configuringWarehouse.status || 'ACTIVE'
      });
    }
  }, [configuringWarehouse]);

  // Scoped warehouses list for the current user session
  const visibleWarehouses = useMemo(() => {
    if (isBranchScoped && assignedWhId) {
      const filtered = warehouses.filter((w) => String(w.id) === String(assignedWhId));
      return filtered.length > 0 ? filtered : warehouses;
    }
    return warehouses;
  }, [warehouses, isBranchScoped, assignedWhId]);

  // Helper to extract all stock items stored in a given warehouse
  const getWarehouseStocks = (whId) => {
    if (!whId) return [];
    return stocks
      .filter((s) => String(s.warehouse_id) === String(whId))
      .map((s) => {
        const matchedProd = products.find((p) => String(p.id) === String(s.product_id));
        const currentStock = parseInt(s.current_stock ?? 0, 10);
        const reservedStock = parseInt(s.reserved_stock ?? 0, 10);
        const availableStock = s.available_stock !== undefined ? parseInt(s.available_stock, 10) : Math.max(0, currentStock - reservedStock);
        const minStock = s.minimum_stock !== undefined && s.minimum_stock !== null
          ? parseInt(s.minimum_stock, 10)
          : parseInt(matchedProd?.minimum_stock || matchedProd?.minimumStock || 5, 10);
        const purchasePrice = parseFloat(matchedProd?.purchase_price || matchedProd?.purchasePrice || matchedProd?.cost_price || 0);
        const sellingPrice = parseFloat(matchedProd?.selling_price || matchedProd?.sellingPrice || matchedProd?.price || 0);
        const unitVal = purchasePrice > 0 ? purchasePrice : sellingPrice;
        const totalValue = currentStock * unitVal;
        const categoryName = matchedProd?.category?.name || matchedProd?.category_name || (typeof matchedProd?.category === 'string' ? matchedProd.category : 'General');

        let stockStatus = 'HEALTHY';
        if (currentStock <= 0) {
          stockStatus = 'OUT_OF_STOCK';
        } else if (currentStock <= minStock) {
          stockStatus = 'LOW_STOCK';
        }

        return {
          ...s,
          product_name: matchedProd?.name || s.product_name || `Product #${s.product_id}`,
          product_code: matchedProd?.product_code || matchedProd?.productCode || s.product_code || `SKU-${s.product_id}`,
          unit: matchedProd?.unit || 'PCS',
          categoryName,
          purchasePrice,
          sellingPrice,
          totalValue,
          currentStock,
          reservedStock,
          availableStock,
          minStock,
          stockStatus
        };
      });
  };

  // Compute stats for a single warehouse card
  const getWarehouseStats = (warehouse) => {
    const whStocks = getWarehouseStocks(warehouse.id);
    const distinctProducts = whStocks.length;
    const totalUnits = whStocks.reduce((acc, s) => acc + s.currentStock, 0);
    const totalAssetValuation = whStocks.reduce((acc, s) => acc + s.totalValue, 0);
    const lowStockCount = whStocks.filter((s) => s.stockStatus === 'LOW_STOCK').length;
    const outOfStockCount = whStocks.filter((s) => s.stockStatus === 'OUT_OF_STOCK').length;
    const healthyCount = whStocks.filter((s) => s.stockStatus === 'HEALTHY').length;
    const capacity = parseInt(warehouse.capacity || 25000, 10);

    return {
      whStocks,
      distinctProducts,
      totalUnits,
      totalAssetValuation,
      lowStockCount,
      outOfStockCount,
      healthyCount,
      capacity
    };
  };

  // Aggregate metrics across visible fulfillment facilities
  const networkMetrics = useMemo(() => {
    const totalWarehouses = visibleWarehouses.length;
    const totalCapacity = visibleWarehouses.reduce((sum, w) => sum + parseInt(w.capacity || 25000, 10), 0);
    let totalUnits = 0;
    let totalValuation = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let optimalCount = 0;

    visibleWarehouses.forEach((w) => {
      const stats = getWarehouseStats(w);
      totalUnits += stats.totalUnits;
      totalValuation += stats.totalAssetValuation;
      lowStockCount += stats.lowStockCount;
      outOfStockCount += stats.outOfStockCount;
      optimalCount += stats.healthyCount;
    });

    return {
      totalWarehouses,
      totalCapacity,
      totalUnits,
      totalValuation,
      lowStockCount,
      outOfStockCount,
      optimalCount
    };
  }, [visibleWarehouses, stocks, products]);

  // Active facility object in Tab 2 (Stock Matrix)
  const activeInventoryWarehouse = useMemo(() => {
    if (isBranchScoped && currentUser?.warehouseId) {
      return warehouses.find((w) => String(w.id) === String(currentUser.warehouseId)) || null;
    }
    if (selectedInventoryWhId === 'ALL') return null;
    return warehouses.find((w) => String(w.id) === String(selectedInventoryWhId)) || null;
  }, [warehouses, selectedInventoryWhId, isBranchScoped, currentUser?.warehouseId]);

  // All stocks to display in the Live Stock Matrix table
  const displayInventoryStocks = useMemo(() => {
    let rawList = [];
    if (isBranchScoped && currentUser?.warehouseId) {
      const w = activeInventoryWarehouse;
      if (w) {
        rawList = getWarehouseStocks(w.id).map((item) => ({
          ...item,
          warehouseName: w.name,
          warehouseCode: w.code,
          warehouseId: w.id
        }));
      }
    } else if (selectedInventoryWhId === 'ALL') {
      rawList = visibleWarehouses.flatMap((w) => {
        return getWarehouseStocks(w.id).map((item) => ({
          ...item,
          warehouseName: w.name,
          warehouseCode: w.code,
          warehouseId: w.id
        }));
      });
    } else {
      const w = activeInventoryWarehouse;
      if (w) {
        rawList = getWarehouseStocks(w.id).map((item) => ({
          ...item,
          warehouseName: w.name,
          warehouseCode: w.code,
          warehouseId: w.id
        }));
      }
    }

    return rawList.filter((item) => {
      const q = inventorySearch.trim().toLowerCase();
      const matchSearch =
        !q ||
        item.product_name.toLowerCase().includes(q) ||
        item.product_code.toLowerCase().includes(q) ||
        item.categoryName.toLowerCase().includes(q) ||
        (item.warehouseName && item.warehouseName.toLowerCase().includes(q));

      const matchCategory = inventoryCategoryFilter === 'ALL' || item.categoryName === inventoryCategoryFilter;
      const matchStatus = inventoryStatusFilter === 'ALL' || item.stockStatus === inventoryStatusFilter;

      return matchSearch && matchCategory && matchStatus;
    });
  }, [selectedInventoryWhId, warehouses, visibleWarehouses, activeInventoryWarehouse, stocks, products, inventorySearch, inventoryCategoryFilter, inventoryStatusFilter, isBranchScoped, currentUser?.warehouseId]);

  // Categories list for active view
  const activeAvailableCategories = useMemo(() => {
    const cats = new Set();
    const sourceList =
      isBranchScoped && activeInventoryWarehouse
        ? getWarehouseStocks(activeInventoryWarehouse.id)
        : selectedInventoryWhId === 'ALL'
        ? visibleWarehouses.flatMap((w) => getWarehouseStocks(w.id))
        : activeInventoryWarehouse
        ? getWarehouseStocks(activeInventoryWarehouse.id)
        : [];

    sourceList.forEach((s) => {
      if (s.categoryName) cats.add(s.categoryName);
    });
    return Array.from(cats).sort();
  }, [selectedInventoryWhId, visibleWarehouses, activeInventoryWarehouse, stocks, products, isBranchScoped]);

  // Filtered transfers list (scoped to branch movements if user is branch-scoped)
  const filteredTransfers = useMemo(() => {
    let list = transfers;
    if (isBranchScoped && currentUser?.warehouseId) {
      list = list.filter(
        (t) => String(t.from_warehouse_id) === String(currentUser.warehouseId) || String(t.to_warehouse_id) === String(currentUser.warehouseId)
      );
    }
    if (transferStatusFilter === 'ALL') return list;
    return list.filter((t) => t.status === transferStatusFilter);
  }, [transfers, transferStatusFilter, isBranchScoped, currentUser?.warehouseId]);

  // Compute whether any changes were made compared to configuringWarehouse
  const hasChanges = useMemo(() => {
    if (!configuringWarehouse) return false;
    return (
      (editForm.name || '').trim() !== (configuringWarehouse.name || '').trim() ||
      (editForm.code || '').trim().toUpperCase() !== (configuringWarehouse.code || '').trim().toUpperCase() ||
      (editForm.address || '').trim() !== (configuringWarehouse.address || '').trim() ||
      (editForm.city || '').trim() !== (configuringWarehouse.city || '').trim() ||
      (editForm.managerName || '').trim() !== (configuringWarehouse.manager_name || '').trim() ||
      (editForm.phone || '').trim() !== (configuringWarehouse.phone || '').trim() ||
      parseInt(editForm.capacity, 10) !== parseInt(configuringWarehouse.capacity, 10) ||
      (editForm.capacityUnit || 'Square Feet (Sq. Ft)') !== (configuringWarehouse.capacity_unit || 'Square Feet (Sq. Ft)') ||
      Boolean(editForm.isDefault) !== Boolean(configuringWarehouse.is_default) ||
      (editForm.status || 'ACTIVE') !== (configuringWarehouse.status || 'ACTIVE')
    );
  }, [editForm, configuringWarehouse]);

  // Compute available stock for selected product in selected origin warehouse
  const selectedSourceStock = useMemo(() => {
    if (!transferForm.fromWarehouseId || !transferForm.productId) return null;
    const found = stocks.find(
      (s) => String(s.warehouse_id) === String(transferForm.fromWarehouseId) && String(s.product_id) === String(transferForm.productId)
    );
    return found ? (found.available_stock !== undefined ? found.available_stock : (found.current_stock ?? 0)) : 0;
  }, [stocks, transferForm.fromWarehouseId, transferForm.productId]);

  const reqTransferQty = parseInt(transferForm.quantity, 10) || 0;
  const isTransferOverStock = selectedSourceStock !== null && reqTransferQty > selectedSourceStock;
  const isTransferSourceZero = selectedSourceStock !== null && selectedSourceStock <= 0;

  const handleCreateWarehouse = async (e) => {
    e.preventDefault();
    try {
      await api.post('/warehouses', {
        ...whForm,
        capacity: parseInt(whForm.capacity, 10) || 25000,
        capacityUnit: whForm.capacityUnit || 'Square Feet (Sq. Ft)'
      });
      toast.success('Warehouse facility created successfully');
      setIsCreateModalOpen(false);
      setWhForm({
        name: '',
        code: '',
        address: '',
        city: '',
        managerName: '',
        phone: '',
        capacity: 25000,
        capacityUnit: 'Square Feet (Sq. Ft)',
        isDefault: false,
        status: 'ACTIVE'
      });
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to create warehouse');
    }
  };

  const handleUpdateWarehouse = async (e) => {
    e.preventDefault();
    if (!configuringWarehouse) return;
    try {
      setIsUpdating(true);
      await api.put(`/warehouses/${configuringWarehouse.id}`, {
        ...editForm,
        capacity: parseInt(editForm.capacity, 10) || 25000,
        capacityUnit: editForm.capacityUnit || 'Square Feet (Sq. Ft)'
      });
      toast.success('Warehouse configuration updated successfully');
      setIsEditModalOpen(false);
      setConfiguringWarehouse(null);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to update warehouse');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResetForm = () => {
    if (!configuringWarehouse) return;
    setEditForm({
      name: configuringWarehouse.name || '',
      code: configuringWarehouse.code || '',
      address: configuringWarehouse.address || '',
      city: configuringWarehouse.city || '',
      managerName: configuringWarehouse.manager_name || '',
      phone: configuringWarehouse.phone || '',
      capacity: configuringWarehouse.capacity || 25000,
      capacityUnit: configuringWarehouse.capacity_unit || 'Square Feet (Sq. Ft)',
      isDefault: Boolean(configuringWarehouse.is_default),
      status: configuringWarehouse.status || 'ACTIVE'
    });
    toast.info('Form reverted to current saved settings');
  };

  const handleDeleteWarehouse = async () => {
    if (!deletingWarehouse) return;
    try {
      setIsDeleting(true);
      await api.delete(`/warehouses/${deletingWarehouse.id}`);
      toast.success('Warehouse facility removed successfully');
      setDeletingWarehouse(null);
      if (configuringWarehouse?.id === deletingWarehouse.id) {
        setIsEditModalOpen(false);
        setConfiguringWarehouse(null);
      }
      if (selectedInventoryWhId === String(deletingWarehouse.id)) {
        setSelectedInventoryWhId('ALL');
      }
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to delete warehouse');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateTransfer = async (e) => {
    e.preventDefault();
    if (transferForm.fromWarehouseId === transferForm.toWarehouseId) {
      toast.error('Source and destination warehouse cannot be the same');
      return;
    }
    const selectedProd = products.find((p) => String(p.id) === String(transferForm.productId));
    const available = selectedSourceStock !== null ? selectedSourceStock : 0;
    const reqQty = parseInt(transferForm.quantity, 10);

    if (reqQty > available) {
      toast.error(`Transfer quantity (${reqQty}) exceeds available stock (${available}) in source warehouse`);
      return;
    }

    try {
      await api.post('/transfers', {
        fromWarehouseId: parseInt(transferForm.fromWarehouseId, 10),
        toWarehouseId: parseInt(transferForm.toWarehouseId, 10),
        notes: transferForm.notes,
        carrierType: transferForm.carrierType,
        carrierName: transferForm.carrierName,
        vehicleNo: transferForm.vehicleNo,
        driverName: transferForm.driverName,
        driverPhone: transferForm.driverPhone,
        trackingNumber: transferForm.trackingNumber,
        estimatedArrival: transferForm.estimatedArrival,
        items: [
          {
            productId: parseInt(transferForm.productId, 10),
            productCode: selectedProd ? selectedProd.product_code : '',
            productName: selectedProd ? selectedProd.name : '',
            quantity: parseInt(transferForm.quantity, 10)
          }
        ]
      });

      toast.success('Stock transfer request submitted successfully');
      setIsTransferModalOpen(false);
      setTransferForm({
        fromWarehouseId: '',
        toWarehouseId: '',
        productId: '',
        quantity: 1,
        notes: '',
        carrierType: 'IN_HOUSE',
        carrierName: '',
        vehicleNo: '',
        driverName: '',
        driverPhone: '',
        trackingNumber: '',
        estimatedArrival: ''
      });
      setShowTransportInTransferForm(false);
      setActiveTab('transfers');
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Transfer request failed');
    }
  };

  const handleApproveTransfer = async (id) => {
    try {
      await api.patch(`/transfers/${id}/approve`);
      toast.success('Transfer request approved. Ready for transport dispatch.');
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Approve failed');
    }
  };

  const handleOpenDispatchModal = (transfer) => {
    setDispatchModalTransfer(transfer);
    setDispatchForm({
      carrierType: transfer.carrier_type || 'IN_HOUSE',
      carrierName: transfer.carrier_name || '',
      vehicleNo: transfer.vehicle_no || '',
      driverName: transfer.driver_name || '',
      driverPhone: transfer.driver_phone || '',
      trackingNumber: transfer.tracking_number || '',
      estimatedArrival: transfer.estimated_arrival || ''
    });
    setIsDispatchModalOpen(true);
  };

  const handleExecuteDispatch = async (e) => {
    e.preventDefault();
    if (!dispatchModalTransfer) return;
    try {
      setIsDispatching(true);
      await api.patch(`/transfers/${dispatchModalTransfer.id}/dispatch`, dispatchForm);
      toast.success(`Transfer ${dispatchModalTransfer.transfer_number} dispatched & in transit`);
      setIsDispatchModalOpen(false);
      setDispatchModalTransfer(null);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Dispatch failed');
    } finally {
      setIsDispatching(false);
    }
  };

  const handleReceiveTransfer = async (transfer) => {
    try {
      await api.patch(`/transfers/${transfer.id}/receive`);
      toast.success(`Transfer ${transfer.transfer_number} goods received & added to stock`);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Receive transfer failed');
    }
  };

  const handleOpenChallan = (transfer) => {
    setChallanTransfer(transfer);
    setIsChallanModalOpen(true);
  };

  const handlePrintChallan = () => {
    window.print();
  };

  const confirmRejectTransfer = (t) => {
    setRejectingTransfer(t);
  };

  const executeRejectTransfer = async () => {
    if (!rejectingTransfer) return;
    try {
      setIsRejecting(true);
      await api.patch(`/transfers/${rejectingTransfer.id}/reject`);
      toast.info('Transfer request rejected');
      setRejectingTransfer(null);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Reject failed');
    } finally {
      setIsRejecting(false);
    }
  };

  const handleDeleteTransfer = async () => {
    if (!deletingTransfer) return;
    try {
      setIsDeletingTransfer(true);
      await api.delete(`/transfers/${deletingTransfer.id}`);
      toast.success(`Transfer ${deletingTransfer.transfer_number} deleted successfully`);
      setDeletingTransfer(null);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to delete transfer');
    } finally {
      setIsDeletingTransfer(false);
    }
  };

  // Jump from warehouse card to live inventory breakdown
  const handleInspectWarehouseInventory = (whId) => {
    setSelectedInventoryWhId(String(whId));
    setActiveTab('inventory');
    setInventorySearch('');
    setInventoryStatusFilter('ALL');
    setInventoryCategoryFilter('ALL');
  };

  // Quick initiate transfer from warehouse
  const handleQuickTransferFromWarehouse = (whId) => {
    const dest = warehouses.find((w) => String(w.id) !== String(whId));
    setTransferForm({
      fromWarehouseId: String(whId),
      toWarehouseId: dest ? String(dest.id) : '',
      productId: products[0]?.id ? String(products[0]?.id) : '',
      quantity: 5,
      notes: '',
      carrierType: 'IN_HOUSE',
      carrierName: '',
      vehicleNo: '',
      driverName: '',
      driverPhone: '',
      trackingNumber: '',
      estimatedArrival: ''
    });
    setIsTransferModalOpen(true);
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', paddingBottom: '3.5rem' }}>
      {/* ========================================================================= */}
      {/* 1. EXECUTIVE COMMAND HEADER & TAB NAV                                     */}
      {/* ========================================================================= */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '1.25rem 1.5rem',
          marginBottom: '1.5rem',
          boxShadow: '0 4px 20px -4px rgba(15, 23, 42, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, var(--primary-light), #f3c7ec)',
                border: '1px solid var(--primary-border)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px var(--primary-glow)'
              }}
            >
              <Warehouse size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                  Warehouse Hubs & Fulfillment Network
                </h1>

                {currentUser?.warehouseName && (
                  <span
                    style={{
                      fontSize: '0.725rem',
                      fontWeight: 700,
                      background: '#fdf2f8',
                      color: '#982A86',
                      border: '1px solid #fbcfe8',
                      padding: '2px 9px',
                      borderRadius: '8px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Building2 size={12} />
                    <span>Branch: {currentUser.warehouseName}</span>
                  </span>
                )}
              </div>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.825rem', marginTop: '2px' }}>
                Enterprise distribution centers, live SKU ledger by location, and inter-facility transit pipeline
              </p>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={fetchData}
              className="btn btn-ghost btn-sm"
              title="Refresh network data"
              style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.45rem 0.65rem' }}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>

            {canInitiateTransfer && (
              <button
                onClick={() => {
                  if (warehouses.length < 2) {
                    if (isBranchScoped) {
                      toast.warning('No other fulfillment warehouse hub registered in the company to request stock from.');
                    } else {
                      toast.warning('You need at least 2 warehouses to initiate inter-facility stock transfers.');
                    }
                    return;
                  }

                  let defaultFromWh = '';
                  let defaultToWh = '';

                  if (isBranchScoped && assignedWhId) {
                    defaultToWh = String(assignedWhId);
                    const otherWh = warehouses.find(w => String(w.id) !== String(assignedWhId));
                    defaultFromWh = otherWh ? String(otherWh.id) : (warehouses[0]?.id ? String(warehouses[0].id) : '');
                  } else {
                    defaultFromWh = String(warehouses[0]?.id || '');
                    defaultToWh = String(warehouses[1]?.id || warehouses[0]?.id || '');
                  }

                  // Find first product with stock in the origin warehouse
                  const availableProd = products.find((p) => {
                    const s = stocks.find(stk => String(stk.warehouse_id) === String(defaultFromWh) && String(stk.product_id) === String(p.id));
                    return s && (s.available_stock > 0 || s.current_stock > 0);
                  }) || products[0];

                  setTransferForm({
                    fromWarehouseId: defaultFromWh,
                    toWarehouseId: defaultToWh,
                    productId: availableProd ? String(availableProd.id) : (products[0]?.id ? String(products[0].id) : ''),
                    quantity: 5,
                    notes: isBranchScoped ? `Branch replenishment request for ${assignedWhName || 'Branch'}` : '',
                    carrierType: 'IN_HOUSE',
                    carrierName: '',
                    vehicleNo: '',
                    driverName: '',
                    driverPhone: '',
                    trackingNumber: '',
                    estimatedArrival: ''
                  });
                  setIsTransferModalOpen(true);
                }}
                className="btn btn-secondary btn-sm"
                style={{
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  borderRadius: '9px',
                  border: '1px solid #cbd5e1'
                }}
              >
                <ArrowRightLeft size={14} /> {isBranchScoped ? 'Request Stock from Hub' : 'New Inter-Hub Transfer'}
              </button>
            )}

            {canManageWarehouse && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="btn btn-primary btn-sm"
                style={{
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  borderRadius: '9px',
                  boxShadow: '0 2px 10px var(--primary-glow)'
                }}
              >
                <Plus size={15} /> Register Facility Hub
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            borderTop: '1px solid #f1f5f9',
            paddingTop: '0.85rem'
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              background: '#f1f5f9',
              padding: '4px',
              borderRadius: '10px',
              gap: '4px'
            }}
          >
            <button
              onClick={() => setActiveTab('warehouses')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '0.45rem 1rem',
                borderRadius: '7px',
                fontSize: '0.825rem',
                fontWeight: activeTab === 'warehouses' ? 700 : 500,
                color: activeTab === 'warehouses' ? 'var(--primary)' : '#64748b',
                background: activeTab === 'warehouses' ? '#ffffff' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                boxShadow: activeTab === 'warehouses' ? '0 1px 3px rgba(15, 23, 42, 0.08)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <Building2 size={15} /> Facilities Directory ({warehouses.length})
            </button>

            <button
              onClick={() => setActiveTab('inventory')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '0.45rem 1rem',
                borderRadius: '7px',
                fontSize: '0.825rem',
                fontWeight: activeTab === 'inventory' ? 700 : 500,
                color: activeTab === 'inventory' ? 'var(--primary)' : '#64748b',
                background: activeTab === 'inventory' ? '#ffffff' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                boxShadow: activeTab === 'inventory' ? '0 1px 3px rgba(15, 23, 42, 0.08)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <Boxes size={15} /> Live Stock Matrix ({networkMetrics.totalUnits.toLocaleString()} Units)
            </button>

            <button
              onClick={() => setActiveTab('transfers')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '0.45rem 1rem',
                borderRadius: '7px',
                fontSize: '0.825rem',
                fontWeight: activeTab === 'transfers' ? 700 : 500,
                color: activeTab === 'transfers' ? 'var(--primary)' : '#64748b',
                background: activeTab === 'transfers' ? '#ffffff' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                boxShadow: activeTab === 'transfers' ? '0 1px 3px rgba(15, 23, 42, 0.08)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <Truck size={15} /> Logistics & Transfers ({transfers.length})
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. NETWORK AT-A-GLANCE EXECUTIVE KPI CARDS                                */}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* 2. NETWORK AT-A-GLANCE EXECUTIVE KPI CARDS (INTERACTIVE)                   */}
      {/* ========================================================================= */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}
      >
        {/* KPI 1: Active Hubs -> Switch to Facilities Directory */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setActiveTab('warehouses')}
          onKeyDown={(e) => e.key === 'Enter' && setActiveTab('warehouses')}
          title="Click to view all fulfillment facilities"
          style={{
            background: '#ffffff',
            borderRadius: '14px',
            border: activeTab === 'warehouses' ? '2px solid var(--primary)' : '1px solid #e2e8f0',
            padding: '1.15rem 1.25rem',
            boxShadow: activeTab === 'warehouses' ? '0 4px 12px rgba(99, 102, 241, 0.15)' : '0 2px 6px rgba(15, 23, 42, 0.03)',
            position: 'relative',
            overflow: 'hidden',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            transform: 'translateY(0)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow = '0 8px 16px rgba(99, 102, 241, 0.12)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = activeTab === 'warehouses' ? '0 4px 12px rgba(99, 102, 241, 0.15)' : '0 2px 6px rgba(15, 23, 42, 0.03)';
          }}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, var(--primary), #a855f7)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Fulfillment Facilities
            </span>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={16} />
            </div>
          </div>
          <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a' }}>{networkMetrics.totalWarehouses}</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#059669' }}>
              ({warehouses.filter((w) => w.status === 'ACTIVE').length} Operational)
            </span>
          </div>
        </div>

        {/* KPI 2: Total Physical Floor Space -> Switch to Facilities Directory */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setActiveTab('warehouses')}
          onKeyDown={(e) => e.key === 'Enter' && setActiveTab('warehouses')}
          title="Click to view facility capacity and floor space breakdown"
          style={{
            background: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            padding: '1.15rem 1.25rem',
            boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)',
            position: 'relative',
            overflow: 'hidden',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            transform: 'translateY(0)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow = '0 8px 16px rgba(37, 99, 235, 0.12)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 6px rgba(15, 23, 42, 0.03)';
          }}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #3b82f6, #06b6d4)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Network Footprint
            </span>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Maximize2 size={16} />
            </div>
          </div>
          <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a' }}>
              {networkMetrics.totalCapacity.toLocaleString()}
            </span>
            <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#64748b' }}>Sq. Ft Total Area</span>
          </div>
        </div>

        {/* KPI 3: Live Units on Hand -> Switch to Live Inventory Matrix */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            setActiveTab('inventory');
            setSelectedInventoryWhId('ALL');
            setInventoryStatusFilter('ALL');
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setActiveTab('inventory');
              setSelectedInventoryWhId('ALL');
              setInventoryStatusFilter('ALL');
            }
          }}
          title="Click to view all stored physical inventory in stock matrix"
          style={{
            background: '#ffffff',
            borderRadius: '14px',
            border: activeTab === 'inventory' ? '2px solid #10b981' : '1px solid #e2e8f0',
            padding: '1.15rem 1.25rem',
            boxShadow: activeTab === 'inventory' ? '0 4px 12px rgba(16, 185, 129, 0.15)' : '0 2px 6px rgba(15, 23, 42, 0.03)',
            position: 'relative',
            overflow: 'hidden',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            transform: 'translateY(0)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow = '0 8px 16px rgba(16, 185, 129, 0.12)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = activeTab === 'inventory' ? '0 4px 12px rgba(16, 185, 129, 0.15)' : '0 2px 6px rgba(15, 23, 42, 0.03)';
          }}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #10b981, #14b8a6)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Stored Physical Inventory
            </span>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Boxes size={16} />
            </div>
          </div>
          <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a' }}>
              {networkMetrics.totalUnits.toLocaleString()}
            </span>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#059669' }}>Units on Hand</span>
          </div>
        </div>

        {/* KPI 4: Valuation -> Switch to Live Inventory Matrix */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            setActiveTab('inventory');
            setSelectedInventoryWhId('ALL');
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setActiveTab('inventory');
              setSelectedInventoryWhId('ALL');
            }
          }}
          title="Click to view network asset valuation & SKU breakdown"
          style={{
            background: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            padding: '1.15rem 1.25rem',
            boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)',
            position: 'relative',
            overflow: 'hidden',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            transform: 'translateY(0)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow = '0 8px 16px rgba(245, 158, 11, 0.12)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 6px rgba(15, 23, 42, 0.03)';
          }}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #f59e0b, #e11d48)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Network Asset Valuation
            </span>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#059669', background: '#ecfdf5', padding: '1px 6px', borderRadius: '4px' }}>
              Live
            </span>
          </div>
          <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a' }}>
              ₹{networkMetrics.totalValuation.toLocaleString()}
            </span>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Inventory Worth</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: FACILITIES & HUBS DIRECTORY                                        */}
      {/* ========================================================================= */}
      {activeTab === 'warehouses' && (
        <div>
          {warehouses.length === 0 && !loading ? (
            <div
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px dashed #cbd5e1',
                padding: '4rem 2rem',
                textAlign: 'center'
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  margin: '0 auto 1.25rem',
                  borderRadius: '16px',
                  background: 'var(--primary-light)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Warehouse size={32} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.4rem' }}>
                No Fulfillment Hubs Registered Yet
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: '460px', margin: '0 auto 1.5rem' }}>
                Register your central distribution facility or regional transit warehouses to begin tracking multi-location stocks and dispatch routes.
              </p>
              {canManageWarehouse && (
                <button onClick={() => setIsCreateModalOpen(true)} className="btn btn-primary btn-md">
                  <Plus size={16} /> Register First Facility Hub
                </button>
              )}
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '1.25rem'
              }}
            >
              {visibleWarehouses.map((w) => {
                const capacityUnit = w.capacity_unit || 'Square Feet (Sq. Ft)';
                const stats = getWarehouseStats(w);
                const isDefault = Boolean(w.is_default);

                return (
                  <div
                    key={w.id}
                    style={{
                      background: '#ffffff',
                      borderRadius: '16px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(152, 42, 134, 0.4)';
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.boxShadow = '0 12px 24px -4px rgba(152, 42, 134, 0.12), 0 4px 12px rgba(15, 23, 42, 0.04)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(15, 23, 42, 0.04)';
                    }}
                  >
                    {/* Top Accent Strip */}
                    <div
                      style={{
                        height: '4px',
                        background: isDefault
                          ? 'linear-gradient(90deg, var(--primary), #a855f7)'
                          : 'linear-gradient(90deg, #cbd5e1, #94a3b8)'
                      }}
                    />

                    <div style={{ padding: '1.35rem 1.4rem 1rem' }}>
                      {/* Facility Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
                        <div style={{ flex: 1, minWidth: 0, paddingRight: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <h3
                              style={{
                                fontSize: '1.15rem',
                                fontWeight: 700,
                                color: '#0f172a',
                                margin: 0,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}
                            >
                              {w.name}
                            </h3>
                            {isDefault && (
                              <span
                                style={{
                                  fontSize: '0.675rem',
                                  fontWeight: 700,
                                  background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)',
                                  color: '#065f46',
                                  border: '1px solid #a7f3d0',
                                  padding: '2px 7px',
                                  borderRadius: '9999px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px'
                                }}
                              >
                                <ShieldCheck size={11} /> DEFAULT HUB
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Top Right Actions: Delete on left of Edit */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {canDeleteWarehouse && (
                            <button
                              type="button"
                              onClick={() => setDeletingWarehouse(w)}
                              style={{
                                border: '1px solid #fee2e2',
                                background: '#fef2f2',
                                color: '#dc2626',
                                borderRadius: '8px',
                                padding: '5px 8px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.725rem',
                                fontWeight: 600,
                                transition: 'all 0.15s ease'
                              }}
                              title="Delete Facility"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}

                          {canEditWarehouse && (
                            <button
                              type="button"
                              onClick={() => {
                                setConfiguringWarehouse(w);
                                setIsEditModalOpen(true);
                              }}
                              style={{
                                border: '1px solid #e2e8f0',
                                background: '#ffffff',
                                color: '#334155',
                                borderRadius: '8px',
                                padding: '5px 10px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.725rem',
                                fontWeight: 600,
                                transition: 'all 0.15s ease'
                              }}
                              title="Edit facility parameters"
                            >
                              <Settings size={13} /> Configure
                            </button>
                          )}
                        </div>
                      </div>

                      {/* City & Address info */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748b', fontSize: '0.775rem', marginBottom: '0.85rem' }}>
                        <MapPin size={13} />
                        <span>{w.address ? `${w.address}${w.city ? `, ${w.city}` : ''}` : w.city || 'Central Operations Location'}</span>
                      </div>

                      {/* Space Capacity Spec Line */}
                      <div
                        style={{
                          background: '#f8fafc',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '8px',
                          border: '1px solid #f1f5f9',
                          marginBottom: '0.85rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div style={{ fontSize: '0.725rem', color: '#64748b', fontWeight: 600 }}>Floor / Storage Capacity</div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a' }}>
                          {parseInt(w.capacity || 25000, 10).toLocaleString()} <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b' }}>{capacityUnit}</span>
                        </div>
                      </div>

                      {/* Key Warehouse Metrics Grid */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(2, 1fr)',
                          gap: '0.65rem',
                          paddingTop: '0.5rem',
                          borderTop: '1px dashed #e2e8f0'
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '0.675rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                            Stored Stock Units
                          </div>
                          <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--primary)', marginTop: '2px' }}>
                            {stats.totalUnits.toLocaleString()} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b' }}>Units</span>
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: '0.675rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                            Asset Valuation
                          </div>
                          <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#059669', marginTop: '2px' }}>
                            ₹{stats.totalAssetValuation.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Facility Footer Actions */}
                    <div
                      style={{
                        padding: '0.85rem 1.4rem',
                        background: '#f8fafc',
                        borderTop: '1px solid #f1f5f9',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => handleInspectWarehouseInventory(w.id)}
                        className="btn btn-ghost btn-sm"
                        style={{
                          fontWeight: 700,
                          fontSize: '0.775rem',
                          color: 'var(--primary)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '0.35rem 0.5rem'
                        }}
                      >
                        <Boxes size={14} /> View Stored Stock ({stats.distinctProducts}) <ChevronRight size={13} />
                      </button>

                      {canInitiateTransfer && (
                        <button
                          type="button"
                          onClick={() => handleQuickTransferFromWarehouse(w.id)}
                          style={{
                            border: '1px solid #cbd5e1',
                            background: '#ffffff',
                            color: '#334155',
                            borderRadius: '7px',
                            padding: '0.35rem 0.65rem',
                            fontSize: '0.725rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <ArrowRightLeft size={12} /> {isBranchScoped ? 'Transfer Goods' : 'Transfer Out'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: LIVE STOCK MATRIX (MULTI-LOCATION INVENTORY LEDGER)                */}
      {/* ========================================================================= */}
      {activeTab === 'inventory' && (
        <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.04)' }}>
          {/* Facility Filter Pills Ribbon */}
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {isBranchScoped ? 'Branch Fulfillment Location' : 'Select Fulfillment Facility'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Showing <strong>{displayInventoryStocks.length}</strong> items in active view
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {!isBranchScoped && (
                <button
                  type="button"
                  onClick={() => setSelectedInventoryWhId('ALL')}
                  style={{
                    padding: '0.4rem 0.85rem',
                    borderRadius: '9999px',
                    fontSize: '0.8rem',
                    fontWeight: selectedInventoryWhId === 'ALL' ? 700 : 500,
                    border: selectedInventoryWhId === 'ALL' ? '1px solid var(--primary)' : '1px solid #cbd5e1',
                    background: selectedInventoryWhId === 'ALL' ? 'var(--primary)' : '#ffffff',
                    color: selectedInventoryWhId === 'ALL' ? '#ffffff' : '#334155',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: selectedInventoryWhId === 'ALL' ? '0 2px 6px var(--primary-glow)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Layers size={13} /> All Facilities ({warehouses.length})
                </button>
              )}

              {visibleWarehouses.map((w) => {
                const isSelected = String(selectedInventoryWhId) === String(w.id);
                const wStocks = getWarehouseStocks(w.id);
                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => setSelectedInventoryWhId(String(w.id))}
                    style={{
                      padding: '0.4rem 0.85rem',
                      borderRadius: '9999px',
                      fontSize: '0.8rem',
                      fontWeight: isSelected ? 700 : 500,
                      border: isSelected ? '1px solid var(--primary)' : '1px solid #cbd5e1',
                      background: isSelected ? 'var(--primary)' : '#ffffff',
                      color: isSelected ? '#ffffff' : '#334155',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: isSelected ? '0 2px 6px var(--primary-glow)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Building2 size={13} /> {w.name} ({wStocks.length})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search and Secondary Filter Bar */}
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '0.65rem', flex: 1, minWidth: '280px', maxWidth: '480px' }}>
              <div style={{ position: 'relative', width: '100%' }}>
                <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '32px', height: '38px', borderRadius: '8px', fontSize: '0.85rem' }}
                  placeholder="Search SKU code, product name, category..."
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Category Dropdown */}
              {activeAvailableCategories.length > 0 && (
                <div style={{ width: '160px' }}>
                  <CustomSelect
                    value={inventoryCategoryFilter}
                    onChange={(e) => setInventoryCategoryFilter(e.target.value)}
                    options={[
                      { value: 'ALL', label: 'All Categories' },
                      ...activeAvailableCategories.map((c) => ({ value: c, label: c }))
                    ]}
                  />
                </div>
              )}

              {/* Status Filter Buttons */}
              <div style={{ display: 'inline-flex', background: '#f1f5f9', padding: '3px', borderRadius: '8px' }}>
                <button
                  type="button"
                  onClick={() => setInventoryStatusFilter('ALL')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: inventoryStatusFilter === 'ALL' ? 700 : 500,
                    border: 'none',
                    background: inventoryStatusFilter === 'ALL' ? '#ffffff' : 'transparent',
                    color: inventoryStatusFilter === 'ALL' ? '#0f172a' : '#64748b',
                    cursor: 'pointer'
                  }}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setInventoryStatusFilter('HEALTHY')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: inventoryStatusFilter === 'HEALTHY' ? 700 : 500,
                    border: 'none',
                    background: inventoryStatusFilter === 'HEALTHY' ? '#ffffff' : 'transparent',
                    color: inventoryStatusFilter === 'HEALTHY' ? '#059669' : '#64748b',
                    cursor: 'pointer'
                  }}
                >
                  Healthy
                </button>
                <button
                  type="button"
                  onClick={() => setInventoryStatusFilter('LOW_STOCK')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: inventoryStatusFilter === 'LOW_STOCK' ? 700 : 500,
                    border: 'none',
                    background: inventoryStatusFilter === 'LOW_STOCK' ? '#ffffff' : 'transparent',
                    color: inventoryStatusFilter === 'LOW_STOCK' ? '#b45309' : '#64748b',
                    cursor: 'pointer'
                  }}
                >
                  Low Stock
                </button>
                <button
                  type="button"
                  onClick={() => setInventoryStatusFilter('OUT_OF_STOCK')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: inventoryStatusFilter === 'OUT_OF_STOCK' ? 700 : 500,
                    border: 'none',
                    background: inventoryStatusFilter === 'OUT_OF_STOCK' ? '#ffffff' : 'transparent',
                    color: inventoryStatusFilter === 'OUT_OF_STOCK' ? '#dc2626' : '#64748b',
                    cursor: 'pointer'
                  }}
                >
                  Out of Stock
                </button>
              </div>
            </div>
          </div>

          {/* Ledger Table */}
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', margin: 0 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>ITEM DETAILS</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>CATEGORY</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>FACILITY LOCATION</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>AVAILABLE / ON-HAND</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>HEALTH STATUS</th>
                  <th style={{ padding: '0.75rem 1.25rem', textAlign: 'right', fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>TOTAL VALUE</th>
                  <th style={{ padding: '0.75rem 1.25rem', textAlign: 'center', fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {displayInventoryStocks.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ padding: '3.5rem 1rem', textAlign: 'center', color: '#64748b' }}>
                      <Boxes size={32} style={{ margin: '0 auto 0.75rem', color: '#cbd5e1' }} />
                      <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#334155' }}>No Stock Records Found</div>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>
                        No inventory matching your selected filters or this warehouse currently has no stored SKUs.
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayInventoryStocks.map((item, idx) => (
                    <tr key={`${item.warehouseId}-${item.product_id}-${idx}`} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      {/* Product Name & SKU */}
                      <td style={{ padding: '0.85rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '34px',
                              height: '34px',
                              borderRadius: '8px',
                              background: '#f1f5f9',
                              color: '#475569',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '0.8rem'
                            }}
                          >
                            <Package size={17} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.875rem' }}>{item.product_name}</div>
                            <div style={{ fontSize: '0.725rem', color: '#64748b', fontFamily: 'monospace' }}>{item.product_code}</div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>
                          {item.categoryName}
                        </span>
                      </td>

                      {/* Facility */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.825rem', color: '#0f172a' }}>{item.warehouseName}</div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'monospace' }}>{item.warehouseCode}</div>
                      </td>

                      {/* Available Quantity */}
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.95rem', color: item.currentStock <= 0 ? '#dc2626' : '#0f172a' }}>
                          {item.availableStock}{' '}
                          <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b' }}>{item.unit}</span>
                        </div>
                        {item.reservedStock > 0 && (
                          <div style={{ fontSize: '0.7rem', color: '#b45309' }}>({item.reservedStock} reserved)</div>
                        )}
                      </td>

                      {/* Health Status */}
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                        {item.stockStatus === 'HEALTHY' && (
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', padding: '2px 8px', borderRadius: '9999px' }}>
                            ● Optimal
                          </span>
                        )}
                        {item.stockStatus === 'LOW_STOCK' && (
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', padding: '2px 8px', borderRadius: '9999px' }}>
                            ▲ Low Stock
                          </span>
                        )}
                        {item.stockStatus === 'OUT_OF_STOCK' && (
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '2px 8px', borderRadius: '9999px' }}>
                            ✕ Out of Stock
                          </span>
                        )}
                      </td>

                      {/* Total Value */}
                      <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                        ₹{item.totalValue.toLocaleString()}
                      </td>

                      {/* Action */}
                      <td style={{ padding: '0.85rem 1.25rem', textAlign: 'center' }}>
                        {canInitiateTransfer && warehouses.length > 1 && item.currentStock > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              const dest = warehouses.find((w) => String(w.id) !== String(item.warehouseId));
                              setTransferForm({
                                fromWarehouseId: String(item.warehouseId),
                                toWarehouseId: dest ? String(dest.id) : '',
                                productId: String(item.product_id),
                                quantity: Math.min(item.availableStock, 5),
                                notes: '',
                                carrierType: 'IN_HOUSE',
                                carrierName: '',
                                vehicleNo: '',
                                driverName: '',
                                driverPhone: '',
                                trackingNumber: '',
                                estimatedArrival: ''
                              });
                              setIsTransferModalOpen(true);
                            }}
                            className="btn btn-ghost btn-xs"
                            style={{
                              border: '1px solid #e2e8f0',
                              borderRadius: '6px',
                              fontSize: '0.725rem',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              color: 'var(--primary)'
                            }}
                          >
                            <ArrowRightLeft size={11} /> Transfer
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: STOCK TRANSFERS & INTER-HUB LOGISTICS PIPELINE                     */}
      {/* ========================================================================= */}
      {activeTab === 'transfers' && (
        <div>
          {/* Transfer Status Filter Strip */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              padding: '0.75rem 1rem',
              marginBottom: '1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem'
            }}
          >
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {[
                { id: 'ALL', label: 'All Transfers', count: transfers.length },
                { id: 'PENDING', label: 'Pending Approval', count: transfers.filter(t => t.status === 'PENDING').length },
                { id: 'APPROVED', label: 'Approved / Ready', count: transfers.filter(t => t.status === 'APPROVED').length },
                { id: 'IN_TRANSIT', label: 'In Transit', count: transfers.filter(t => t.status === 'IN_TRANSIT').length },
                { id: 'COMPLETED', label: 'Completed', count: transfers.filter(t => t.status === 'COMPLETED').length },
                { id: 'REJECTED', label: 'Rejected', count: transfers.filter(t => t.status === 'REJECTED').length }
              ].map((pill) => {
                const isSelected = transferStatusFilter === pill.id;
                return (
                  <button
                    key={pill.id}
                    onClick={() => setTransferStatusFilter(pill.id)}
                    style={{
                      padding: '0.4rem 0.85rem',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: isSelected ? 700 : 500,
                      border: isSelected ? '1px solid var(--primary)' : '1px solid #cbd5e1',
                      background: isSelected ? 'var(--primary)' : '#ffffff',
                      color: isSelected ? '#ffffff' : '#334155',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: isSelected ? '0 2px 8px var(--primary-glow)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>{pill.label}</span>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '9999px',
                        background: isSelected ? 'rgba(255, 255, 255, 0.25)' : '#f1f5f9',
                        color: isSelected ? '#ffffff' : '#475569'
                      }}
                    >
                      {pill.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {canInitiateTransfer && warehouses.length > 1 && (
              <button
                onClick={() => {
                  let defaultFrom = '';
                  let defaultTo = '';

                  if (isBranchScoped && currentUser?.warehouseId) {
                    defaultTo = String(currentUser.warehouseId);
                    const originWh = warehouses.find((w) => String(w.id) !== String(currentUser.warehouseId));
                    defaultFrom = originWh ? String(originWh.id) : (warehouses[0]?.id ? String(warehouses[0].id) : '');
                  } else {
                    defaultFrom = String(warehouses[0]?.id || '');
                    defaultTo = String(warehouses[1]?.id || '');
                  }

                  setTransferForm({
                    fromWarehouseId: defaultFrom,
                    toWarehouseId: defaultTo,
                    productId: String(products[0]?.id || ''),
                    quantity: 5,
                    notes: isBranchScoped ? `Branch replenishment request for ${currentUser?.warehouseName || 'Branch'}` : '',
                    carrierType: 'IN_HOUSE',
                    carrierName: '',
                    vehicleNo: '',
                    driverName: '',
                    driverPhone: '',
                    trackingNumber: '',
                    estimatedArrival: ''
                  });
                  setIsTransferModalOpen(true);
                }}
                className="btn btn-primary btn-xs"
                style={{ fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '5px' }}
              >
                {isBranchScoped ? (
                  <>
                    <ArrowRightLeft size={13} /> Request Stock from Main Warehouse
                  </>
                ) : (
                  <>
                    <Plus size={13} /> Initiate Inter-Hub Transfer
                  </>
                )}
              </button>
            )}
          </div>

          {filteredTransfers.length === 0 ? (
            <div
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px dashed #cbd5e1',
                padding: '3.5rem 2rem',
                textAlign: 'center'
              }}
            >
              <Truck size={36} style={{ margin: '0 auto 0.75rem', color: '#cbd5e1' }} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.3rem' }}>
                No Transfer Records Found in this Category
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.85rem', maxWidth: '420px', margin: '0 auto' }}>
                Try selecting another status tab or initiate a new stock transfer between your fulfillment facilities.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {filteredTransfers.map((t) => {
                const totalQty = (t.items || []).reduce((acc, i) => acc + (i.quantity || 0), 0);
                const isPending = t.status === 'PENDING';
                const isApproved = t.status === 'APPROVED';
                const isInTransit = t.status === 'IN_TRANSIT';
                const isCompleted = t.status === 'COMPLETED';
                const isRejected = t.status === 'REJECTED';

                const formattedDate = t.created_at
                  ? new Date(t.created_at).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })
                  : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

                return (
                  <div
                    key={t.id}
                    style={{
                      background: '#ffffff',
                      borderRadius: '14px',
                      border: '1px solid #e2e8f0',
                      padding: '1.15rem 1.35rem',
                      boxShadow: '0 1px 4px rgba(15, 23, 42, 0.03)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.85rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 800, fontFamily: 'monospace', color: 'var(--primary)', fontSize: '0.9rem' }}>
                            {t.transfer_number}
                          </span>
                          {isPending && (
                            <span style={{ fontSize: '0.725rem', fontWeight: 700, background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', padding: '2px 8px', borderRadius: '9999px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <Clock size={11} /> Pending Approval
                            </span>
                          )}
                          {isApproved && (
                            <span style={{ fontSize: '0.725rem', fontWeight: 700, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '2px 8px', borderRadius: '9999px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <CheckCircle size={11} /> Approved / Ready
                            </span>
                          )}
                          {isInTransit && (
                            <span style={{ fontSize: '0.725rem', fontWeight: 700, background: 'var(--primary-light)', color: 'var(--primary)', border: '1px solid var(--primary-border)', padding: '2px 8px', borderRadius: '9999px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <Truck size={11} /> In Transit
                            </span>
                          )}
                          {isCompleted && (
                            <span style={{ fontSize: '0.725rem', fontWeight: 700, background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', padding: '2px 8px', borderRadius: '9999px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <CheckCheck size={11} /> Completed
                            </span>
                          )}
                          {isRejected && (
                            <span style={{ fontSize: '0.725rem', fontWeight: 700, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '2px 8px', borderRadius: '9999px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <XCircle size={11} /> Declined
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '3px' }}>
                          Requested by <strong>{t.requested_by || 'Staff'}</strong> on {formattedDate}
                        </div>
                      </div>

                      {/* Actions Toolbar */}
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        {/* Challan Print */}
                        {(isApproved || isInTransit || isCompleted) && (
                          <button
                            onClick={() => handleOpenChallan(t)}
                            className="btn btn-ghost btn-xs"
                            style={{ border: '1px solid #cbd5e1', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Printer size={12} /> Delivery Slip
                          </button>
                        )}

                        {/* Approve/Reject (Source Hub Admin / Global Admin only) */}
                        {isPending && (isGlobalAdmin || (isBranchAdmin && String(t.from_warehouse_id) === String(assignedWhId))) && (
                          <>
                            <button
                              onClick={() => confirmRejectTransfer(t)}
                              className="btn btn-ghost btn-xs"
                              style={{ color: '#dc2626', border: '1px solid #fee2e2' }}
                            >
                              Decline
                            </button>
                            <button
                              onClick={() => handleApproveTransfer(t.id)}
                              className="btn btn-primary btn-xs"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Check size={12} /> Approve Requisition
                            </button>
                          </>
                        )}

                        {/* Dispatch (Source Hub Manager / Global Admin) */}
                        {isApproved && (isGlobalAdmin || String(t.from_warehouse_id) === String(assignedWhId)) && (
                          <button
                            onClick={() => handleOpenDispatchModal(t)}
                            className="btn btn-primary btn-xs"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Truck size={12} /> Assign Fleet & Dispatch
                          </button>
                        )}

                        {/* Receive at Destination Hub (Destination Branch User / Global Admin) */}
                        {isInTransit && (isGlobalAdmin || String(t.to_warehouse_id) === String(assignedWhId)) && (
                          <button
                            onClick={() => handleReceiveTransfer(t)}
                            className="btn btn-success btn-xs"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <CheckCheck size={12} /> Receive Goods into Stock
                          </button>
                        )}

                        {/* Delete Transfer Option */}
                        <button
                          onClick={() => setDeletingTransfer(t)}
                          className="btn btn-ghost btn-xs"
                          style={{
                            color: '#dc2626',
                            border: '1px solid #fee2e2',
                            background: '#fef2f2',
                            borderRadius: '6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontWeight: 600
                          }}
                          title="Delete this transfer record"
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </div>

                    {/* Route Diagram */}
                    <div
                      style={{
                        background: '#f8fafc',
                        borderRadius: '10px',
                        padding: '0.75rem 1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '0.75rem',
                        fontSize: '0.825rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Building2 size={16} color="var(--primary)" />
                        <div>
                          <div style={{ fontSize: '0.675rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Origin Facility</div>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{t.fromWarehouse?.name || 'Origin Hub'}</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8' }}>
                        <div style={{ width: '30px', height: '1px', background: '#cbd5e1' }} />
                        <Truck size={15} color="var(--primary)" />
                        <div style={{ width: '30px', height: '1px', background: '#cbd5e1' }} />
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MapPin size={16} color="#059669" />
                        <div>
                          <div style={{ fontSize: '0.675rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Destination Hub</div>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{t.toWarehouse?.name || 'Destination Hub'}</div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.675rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Transfer Items</div>
                        <div style={{ fontWeight: 800, color: 'var(--primary)' }}>{totalQty} Units ({t.items?.length || 0} SKUs)</div>
                      </div>
                    </div>

                    {/* Logistics Fleet Details if In Transit */}
                    {(t.vehicle_no || t.carrier_name || t.driver_name) && (
                      <div style={{ marginTop: '0.65rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.75rem', color: '#475569' }}>
                        {t.vehicle_no && <span><strong>Vehicle:</strong> {t.vehicle_no}</span>}
                        {t.carrier_name && <span><strong>Carrier:</strong> {t.carrier_name}</span>}
                        {t.driver_name && <span><strong>Driver:</strong> {t.driver_name} {t.driver_phone ? `(${t.driver_phone})` : ''}</span>}
                        {t.tracking_number && <span><strong>Tracking / LR:</strong> {t.tracking_number}</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. BESPOKE STRUCTURED MODAL: CREATE WAREHOUSE FACILITY (ADMIN ONLY)       */}
      {/* ========================================================================= */}
      {canManageWarehouse && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Register New Fulfillment Facility"
          maxWidth="640px"
        >
          <form onSubmit={handleCreateWarehouse}>
            {/* Section 1: Facility Identity */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.825rem', fontWeight: 700, color: '#334155', marginBottom: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <Building2 size={15} style={{ color: 'var(--primary)' }} /> Facility Identity
              </div>
              <div className="form-row">
                <div className="form-group" style={{ flex: 2 }}>
                  <label className="form-label">Warehouse / Facility Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={whForm.name}
                    onChange={(e) => setWhForm({ ...whForm, name: e.target.value })}
                    placeholder="e.g. Hyderabad Central Fulfillment Center"
                    required
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Facility Code *</label>
                  <input
                    type="text"
                    className="form-input"
                    style={{ textTransform: 'uppercase', fontFamily: 'monospace', fontWeight: 700 }}
                    value={whForm.code}
                    onChange={(e) => setWhForm({ ...whForm, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. HYD-HUB-01"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Physical Footprint */}
            <div style={{ marginBottom: '1.25rem', padding: '0.85rem 1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.825rem', fontWeight: 700, color: '#334155', marginBottom: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <Maximize2 size={15} style={{ color: 'var(--primary)' }} /> Physical Footprint & Floor Space
              </div>
              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Usable Storage Area *</label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    placeholder="e.g. 25000"
                    value={whForm.capacity}
                    onChange={(e) => setWhForm({ ...whForm, capacity: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Measurement Unit *</label>
                  <CustomSelect
                    value={whForm.capacityUnit}
                    onChange={(e) => setWhForm({ ...whForm, capacityUnit: e.target.value })}
                    options={CAPACITY_UNIT_OPTIONS}
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Location & Incharge */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.825rem', fontWeight: 700, color: '#334155', marginBottom: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <MapPin size={15} style={{ color: 'var(--primary)' }} /> Location & Operational Contact
              </div>
              <div className="form-row">
                <div className="form-group" style={{ flex: 2 }}>
                  <label className="form-label">Street Address</label>
                  <input
                    type="text"
                    className="form-input"
                    value={whForm.address}
                    onChange={(e) => setWhForm({ ...whForm, address: e.target.value })}
                    placeholder="e.g. Plot 42, Logistics Avenue, Phase 2"
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">City / Region</label>
                  <input
                    type="text"
                    className="form-input"
                    value={whForm.city}
                    onChange={(e) => setWhForm({ ...whForm, city: e.target.value })}
                    placeholder="e.g. Hyderabad"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Facility Manager / Incharge</label>
                  <input
                    type="text"
                    className="form-input"
                    value={whForm.managerName}
                    onChange={(e) => setWhForm({ ...whForm, managerName: e.target.value })}
                    placeholder="e.g. Rajesh Kumar"
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Contact Phone</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={whForm.phone}
                    onChange={(e) => setWhForm({ ...whForm, phone: e.target.value })}
                    placeholder="e.g. +91 98765 43210"
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
              <button type="button" onClick={() => setIsCreateModalOpen(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" style={{ fontWeight: 700 }}>
                Register Facility Hub
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* 5. BESPOKE STRUCTURED MODAL: CONFIGURE / EDIT WAREHOUSE                   */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setConfiguringWarehouse(null);
        }}
        title={`Configure Hub: ${configuringWarehouse?.name || 'Warehouse'}`}
        maxWidth="640px"
      >
        {configuringWarehouse && (
          <form onSubmit={handleUpdateWarehouse}>
            {/* Section 1: Facility Identity */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.825rem', fontWeight: 700, color: '#334155', marginBottom: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <Building2 size={15} style={{ color: 'var(--primary)' }} /> Facility Identity
              </div>
              <div className="form-row">
                <div className="form-group" style={{ flex: 2 }}>
                  <label className="form-label">Warehouse Name *</label>
                  <input
                    type="text"
                    disabled={!canEditWarehouse}
                    className="form-input"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Facility Code *</label>
                  <input
                    type="text"
                    disabled={!canEditWarehouse}
                    className="form-input"
                    style={{ textTransform: 'uppercase', fontFamily: 'monospace', fontWeight: 700 }}
                    value={editForm.code}
                    onChange={(e) => setEditForm({ ...editForm, code: e.target.value.toUpperCase() })}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Physical Footprint */}
            <div style={{ marginBottom: '1.25rem', padding: '0.85rem 1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.825rem', fontWeight: 700, color: '#334155', marginBottom: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <Maximize2 size={15} style={{ color: 'var(--primary)' }} /> Physical Footprint & Floor Space
              </div>
              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Usable Storage Area *</label>
                  <input
                    type="number"
                    min="1"
                    disabled={!canEditWarehouse}
                    className="form-input"
                    value={editForm.capacity}
                    onChange={(e) => setEditForm({ ...editForm, capacity: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Measurement Unit *</label>
                  {canEditWarehouse ? (
                    <CustomSelect
                      value={editForm.capacityUnit}
                      onChange={(e) => setEditForm({ ...editForm, capacityUnit: e.target.value })}
                      options={CAPACITY_UNIT_OPTIONS}
                    />
                  ) : (
                    <input type="text" disabled className="form-input" value={editForm.capacityUnit} />
                  )}
                </div>
              </div>
            </div>

            {/* Section 3: Location & Incharge */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.825rem', fontWeight: 700, color: '#334155', marginBottom: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <MapPin size={15} style={{ color: 'var(--primary)' }} /> Location & Operational Contact
              </div>
              <div className="form-row">
                <div className="form-group" style={{ flex: 2 }}>
                  <label className="form-label">Street Address</label>
                  <input
                    type="text"
                    disabled={!canEditWarehouse}
                    className="form-input"
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">City / Region</label>
                  <input
                    type="text"
                    disabled={!canEditWarehouse}
                    className="form-input"
                    value={editForm.city}
                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Facility Manager</label>
                  <input
                    type="text"
                    disabled={!canEditWarehouse}
                    className="form-input"
                    value={editForm.managerName}
                    onChange={(e) => setEditForm({ ...editForm, managerName: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Contact Phone</label>
                  <input
                    type="tel"
                    disabled={!canEditWarehouse}
                    className="form-input"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '0.5rem' }}>
                <label className="form-label">Operational Status</label>
                {canEditWarehouse ? (
                  <CustomSelect
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    options={[
                      { value: 'ACTIVE', label: 'ACTIVE - Accepting Stock & Dispatches' },
                      { value: 'INACTIVE', label: 'INACTIVE - Temporarily Suspended' }
                    ]}
                  />
                ) : (
                  <input type="text" disabled className="form-input" value={editForm.status} />
                )}
              </div>
            </div>

            <div
              className="modal-footer"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '1.5rem',
                paddingTop: '1rem',
                borderTop: '1px solid #e2e8f0'
              }}
            >
              {canDeleteWarehouse ? (
                <button
                  type="button"
                  onClick={() => setDeletingWarehouse(configuringWarehouse)}
                  className="btn btn-ghost btn-sm"
                  style={{ color: '#dc2626', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                >
                  <Trash2 size={14} /> Delete Hub
                </button>
              ) : (
                <div />
              )}

              <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
                {canEditWarehouse && hasChanges && (
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="btn btn-secondary btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    title="Revert form back to current saved state"
                  >
                    <RotateCcw size={13} /> Reset
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setConfiguringWarehouse(null);
                  }}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>

                {canEditWarehouse && (
                  <button
                    type="submit"
                    disabled={!hasChanges || isUpdating}
                    className={`btn ${hasChanges ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                    style={{
                      minWidth: '140px',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    {isUpdating ? 'Updating...' : hasChanges ? <><Save size={14} /> Save Changes</> : <><Check size={14} /> Saved</>}
                  </button>
                )}
              </div>
            </div>
          </form>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* 6. STOCK TRANSFER & REQUISITION MODAL                                     */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        title={isBranchScoped ? 'Raise Stock Requisition to Hub' : 'Initiate Inter-Facility Stock Transfer'}
        maxWidth="620px"
      >
        <form onSubmit={handleCreateTransfer}>
          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">
                {isBranchScoped ? 'Source Hub (Requested From) *' : 'Origin Facility (From) *'}
              </label>
              <CustomSelect
                value={transferForm.fromWarehouseId}
                onChange={(e) => setTransferForm({ ...transferForm, fromWarehouseId: e.target.value })}
                options={warehouses
                  .filter((w) => !isBranchScoped || String(w.id) !== String(assignedWhId))
                  .map((w) => ({
                    value: String(w.id),
                    label: `${w.name} (${w.code})`
                  }))}
              />
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">
                Destination Facility (To) *
                {isBranchScoped && (
                  <span style={{ fontSize: '0.72rem', color: 'var(--primary)', marginLeft: '6px', fontWeight: 700 }}>
                    (Your Branch - Locked)
                  </span>
                )}
              </label>
              {isBranchScoped ? (
                <div
                  style={{
                    height: '38px',
                    background: 'var(--primary-light)',
                    border: '1px solid var(--primary-border)',
                    borderRadius: '8px',
                    padding: '0 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: 'var(--primary)',
                    fontWeight: 700,
                    fontSize: '0.85rem'
                  }}
                >
                  <Building2 size={14} />
                  <span>{assignedWhName || 'Assigned Branch'}</span>
                </div>
              ) : (
                <CustomSelect
                  value={transferForm.toWarehouseId}
                  onChange={(e) => setTransferForm({ ...transferForm, toWarehouseId: e.target.value })}
                  options={warehouses
                    .filter((w) => String(w.id) !== String(transferForm.fromWarehouseId))
                    .map((w) => ({
                      value: String(w.id),
                      label: `${w.name} (${w.code})`
                    }))}
                />
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label className="form-label">Product Item *</label>
              <CustomSelect
                value={transferForm.productId}
                onChange={(e) => setTransferForm({ ...transferForm, productId: e.target.value })}
                options={products.map((p) => {
                  const s = stocks.find((stk) => String(stk.warehouse_id) === String(transferForm.fromWarehouseId) && String(stk.product_id) === String(p.id));
                  const qty = s ? (s.available_stock !== undefined ? s.available_stock : (s.current_stock ?? 0)) : 0;
                  const sourceWh = warehouses.find(w => String(w.id) === String(transferForm.fromWarehouseId));
                  const sourceName = sourceWh ? sourceWh.name : 'Hub';
                  return {
                    value: String(p.id),
                    label: `${p.name} (${p.product_code || p.productCode || `PRD-${p.id}`}) — [Stock in ${sourceName}: ${qty} units]`
                  };
                })}
              />
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">
                Transfer Quantity * {selectedSourceStock !== null ? <span style={{ color: 'var(--primary)', fontWeight: 700 }}>[Available: {selectedSourceStock} units]</span> : ''}
              </label>
              <input
                type="number"
                min="1"
                className="form-input"
                placeholder={selectedSourceStock !== null ? `Max ${selectedSourceStock}` : 'Enter qty'}
                value={transferForm.quantity}
                onChange={(e) => setTransferForm({ ...transferForm, quantity: e.target.value })}
                required
              />
              {isTransferOverStock && (
                <div style={{ color: '#dc2626', fontSize: '0.725rem', marginTop: '3px', fontWeight: 600 }}>
                  Quantity exceeds available stock ({selectedSourceStock} units)
                </div>
              )}
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label">Transfer Reason / Notes</label>
            <textarea
              className="form-input"
              rows={2}
              value={transferForm.notes}
              onChange={(e) => setTransferForm({ ...transferForm, notes: e.target.value })}
              placeholder="e.g. Stock replenishment for seasonal branch sales"
            />
          </div>

          <div className="modal-footer">
            <button type="button" onClick={() => setIsTransferModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isTransferOverStock || isTransferSourceZero || !transferForm.fromWarehouseId || !transferForm.toWarehouseId || !transferForm.productId}
            >
              Submit Transfer Request
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* 7. DISPATCH GOODS & ASSIGN TRANSPORT MODAL                                */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isDispatchModalOpen}
        onClose={() => setIsDispatchModalOpen(false)}
        title="Dispatch Goods & Assign Transport Fleet"
        maxWidth="600px"
      >
        {dispatchModalTransfer && (
          <form onSubmit={handleExecuteDispatch}>
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '0.85rem 1rem',
                marginBottom: '1.25rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Transfer Ref</div>
                <div style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--primary)' }}>
                  {dispatchModalTransfer.transfer_number}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Route</div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#0f172a' }}>
                  {dispatchModalTransfer.fromWarehouse?.name} ➔ {dispatchModalTransfer.toWarehouse?.name}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Items</div>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>
                  {(dispatchModalTransfer.items || []).reduce((acc, i) => acc + (i.quantity || 0), 0)} units
                </div>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">Carrier Mode *</label>
              <CustomSelect
                value={dispatchForm.carrierType}
                onChange={(e) => setDispatchForm({ ...dispatchForm, carrierType: e.target.value })}
                options={[
                  { value: 'IN_HOUSE', label: 'Company Fleet / In-House Vehicle' },
                  { value: '3PL', label: 'Third-Party Logistics / Courier (3PL)' }
                ]}
              />
            </div>

            {dispatchForm.carrierType === 'IN_HOUSE' ? (
              <>
                <div className="form-row">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Vehicle Reg Number *</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      placeholder="e.g. TN-09-AB-1234"
                      value={dispatchForm.vehicleNo}
                      onChange={(e) => setDispatchForm({ ...dispatchForm, vehicleNo: e.target.value.toUpperCase() })}
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Driver Name *</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      placeholder="e.g. Rajesh Kumar"
                      value={dispatchForm.driverName}
                      onChange={(e) => setDispatchForm({ ...dispatchForm, driverName: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '0.5rem' }}>
                  <label className="form-label">Driver Phone Number</label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="e.g. +91 98765 43210"
                    value={dispatchForm.driverPhone}
                    onChange={(e) => setDispatchForm({ ...dispatchForm, driverPhone: e.target.value })}
                  />
                </div>
              </>
            ) : (
              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">3PL Transporter Name *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. Blue Dart / VRL / Delhivery"
                    value={dispatchForm.carrierName}
                    onChange={(e) => setDispatchForm({ ...dispatchForm, carrierName: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Docket / LR Number *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. BD-99482910"
                    value={dispatchForm.trackingNumber}
                    onChange={(e) => setDispatchForm({ ...dispatchForm, trackingNumber: e.target.value })}
                  />
                </div>
              </div>
            )}

            {/* Approximate / Estimated Delivery Date & Time Picker */}
            <div className="form-group" style={{ marginTop: '0.85rem' }}>
              <label className="form-label">Estimated / Approximate Delivery Arrival</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 11 Sep 2026, 04:00 PM (or Tomorrow Evening)"
                value={dispatchForm.estimatedArrival}
                onChange={(e) => setDispatchForm({ ...dispatchForm, estimatedArrival: e.target.value })}
              />
              <span style={{ fontSize: '0.725rem', color: '#64748b', marginTop: '2px', display: 'block' }}>
                Expected arrival time of shipment at destination hub
              </span>
            </div>

            <div className="modal-footer" style={{ marginTop: '1.25rem' }}>
              <button
                type="button"
                onClick={() => {
                  setIsDispatchModalOpen(false);
                  setDispatchModalTransfer(null);
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" disabled={isDispatching} className="btn btn-primary">
                <Truck size={15} /> {isDispatching ? 'Dispatching...' : 'Confirm Dispatch & In-Transit'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* 8. DELIVERY CHALLAN / GOODS TRANSIT SLIP MODAL                            */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isChallanModalOpen}
        onClose={() => {
          setIsChallanModalOpen(false);
          setChallanTransfer(null);
        }}
        title="Delivery Challan & Goods Transit Slip"
        maxWidth="720px"
      >
        {challanTransfer && (
          <div>
            <div
              id="printable-challan"
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '10px',
                padding: '1.75rem',
                fontFamily: 'Inter, -apple-system, sans-serif'
              }}
            >
              {/* Slip Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  borderBottom: '2px solid var(--primary)',
                  paddingBottom: '1rem',
                  marginBottom: '1.25rem'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#0f172a', letterSpacing: '-0.02em' }}>
                      STOCKPILOT
                    </h2>
                    <span
                      style={{
                        fontSize: '0.675rem',
                        fontWeight: 700,
                        background: 'var(--primary-light)',
                        color: 'var(--primary)',
                        border: '1px solid var(--primary-border)',
                        padding: '2px 8px',
                        borderRadius: '4px'
                      }}
                    >
                      INTERNAL LOGISTICS
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px', fontWeight: 600 }}>
                    INTER-FACILITY GOODS DELIVERY CHALLAN
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Challan / DC Number:</div>
                  <div style={{ fontWeight: 800, fontFamily: 'monospace', color: 'var(--primary)', fontSize: '1.05rem' }}>
                    DC-{challanTransfer.transfer_number}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                    Date: <strong>{new Date(challanTransfer.created_at || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>
                  </div>
                </div>
              </div>

              {/* Origin & Destination Hub Cards */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem',
                  marginBottom: '1.25rem',
                  background: '#f8fafc',
                  padding: '1rem',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--primary)', fontWeight: 800, letterSpacing: '0.04em' }}>
                    DISPATCH ORIGIN (FACILITY)
                  </div>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem', marginTop: '3px' }}>
                    {challanTransfer.fromWarehouse?.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '2px' }}>
                    {challanTransfer.fromWarehouse?.address || 'Main Logistics Facility'}
                    {challanTransfer.fromWarehouse?.city ? `, ${challanTransfer.fromWarehouse.city}` : ''}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px', fontFamily: 'monospace' }}>
                    Facility Code: <strong>{challanTransfer.fromWarehouse?.code}</strong>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#059669', fontWeight: 800, letterSpacing: '0.04em' }}>
                    DELIVERY DESTINATION (HUB)
                  </div>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem', marginTop: '3px' }}>
                    {challanTransfer.toWarehouse?.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '2px' }}>
                    {challanTransfer.toWarehouse?.address || 'Destination Hub'}
                    {challanTransfer.toWarehouse?.city ? `, ${challanTransfer.toWarehouse.city}` : ''}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px', fontFamily: 'monospace' }}>
                    Facility Code: <strong>{challanTransfer.toWarehouse?.code}</strong>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div style={{ marginBottom: '1.25rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                      <th style={{ textAlign: 'left', padding: '8px 10px', color: '#475569', fontWeight: 700 }}>#</th>
                      <th style={{ textAlign: 'left', padding: '8px 10px', color: '#475569', fontWeight: 700 }}>Item Description</th>
                      <th style={{ textAlign: 'left', padding: '8px 10px', color: '#475569', fontWeight: 700 }}>SKU / Product Code</th>
                      <th style={{ textAlign: 'right', padding: '8px 10px', color: '#475569', fontWeight: 700 }}>Dispatched Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(challanTransfer.items || []).map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '8px 10px' }}>{idx + 1}</td>
                        <td style={{ padding: '8px 10px', fontWeight: 700, color: '#0f172a' }}>{item.product_name}</td>
                        <td style={{ padding: '8px 10px', fontFamily: 'monospace', color: '#64748b' }}>{item.product_code || '—'}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 800, color: 'var(--primary)' }}>
                          {item.quantity} Units
                        </td>
                      </tr>
                    ))}
                    <tr style={{ background: '#f8fafc', fontWeight: 800 }}>
                      <td colSpan="3" style={{ padding: '8px 10px', textAlign: 'right', color: '#334155' }}>Total Dispatched Quantity:</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--primary)', fontSize: '0.95rem' }}>
                        {(challanTransfer.items || []).reduce((acc, i) => acc + (i.quantity || 0), 0)} Units
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Logistics Fleet Details */}
              {(challanTransfer.vehicle_no || challanTransfer.carrier_name || challanTransfer.driver_name || challanTransfer.tracking_number || challanTransfer.estimated_arrival) && (
                <div
                  style={{
                    background: '#f8fafc',
                    padding: '0.85rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '0.775rem',
                    marginBottom: '1.5rem'
                  }}
                >
                  <div style={{ fontWeight: 800, color: '#334155', marginBottom: '6px', textTransform: 'uppercase', fontSize: '0.7rem' }}>
                    Transport & Fleet Details:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px', color: '#475569' }}>
                    <div><strong>Mode:</strong> {challanTransfer.carrier_type === 'IN_HOUSE' ? 'Company Fleet' : '3PL Courier'}</div>
                    {challanTransfer.vehicle_no && <div><strong>Vehicle No:</strong> {challanTransfer.vehicle_no}</div>}
                    {challanTransfer.carrier_name && <div><strong>Carrier:</strong> {challanTransfer.carrier_name}</div>}
                    {challanTransfer.driver_name && <div><strong>Driver:</strong> {challanTransfer.driver_name} {challanTransfer.driver_phone ? `(${challanTransfer.driver_phone})` : ''}</div>}
                    {challanTransfer.tracking_number && <div><strong>LR / Docket:</strong> {challanTransfer.tracking_number}</div>}
                    {challanTransfer.estimated_arrival && <div><strong>Est. Arrival:</strong> {challanTransfer.estimated_arrival}</div>}
                  </div>
                </div>
              )}

              {/* Signatures: Only 2 Columns as requested */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '3rem',
                  marginTop: '2.5rem',
                  textAlign: 'center',
                  fontSize: '0.775rem'
                }}
              >
                <div>
                  <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '6px', fontWeight: 700, color: '#0f172a' }}>
                    Dispatched By: {challanTransfer.fromWarehouse?.name || 'Origin Facility'}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>Authorized Warehouse Incharge</div>
                </div>

                <div>
                  <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '6px', fontWeight: 700, color: '#0f172a' }}>
                    Received By: {challanTransfer.toWarehouse?.name || 'Destination Hub'}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>Goods Receiving Officer</div>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'space-between' }}>
              <button
                type="button"
                onClick={() => {
                  setIsChallanModalOpen(false);
                  setChallanTransfer(null);
                }}
                className="btn btn-secondary"
              >
                Close
              </button>
              <button type="button" onClick={handlePrintChallan} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Printer size={15} /> Print Challan Slip
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* 9. CONFIRM MODALS (DELETE WAREHOUSE & REJECT TRANSFER)                    */}
      {/* ========================================================================= */}
      <ConfirmModal
        isOpen={Boolean(deletingWarehouse)}
        onClose={() => setDeletingWarehouse(null)}
        onConfirm={handleDeleteWarehouse}
        title="Delete Warehouse Facility Hub"
        message={`Are you sure you want to delete "${deletingWarehouse?.name}" (${deletingWarehouse?.code})?`}
        confirmText="Yes, Delete Facility"
        confirmVariant="danger"
        isLoading={isDeleting}
      />

      <ConfirmModal
        isOpen={Boolean(rejectingTransfer)}
        onClose={() => setRejectingTransfer(null)}
        onConfirm={executeRejectTransfer}
        title="Decline Stock Transfer Request"
        message={`Are you sure you want to decline stock transfer request ${rejectingTransfer?.transfer_number}?`}
        confirmText="Decline Transfer"
        confirmVariant="danger"
        isLoading={isRejecting}
      />

      <ConfirmModal
        isOpen={Boolean(deletingTransfer)}
        onClose={() => setDeletingTransfer(null)}
        onConfirm={handleDeleteTransfer}
        title="Delete Stock Transfer Record"
        message={`Are you sure you want to delete stock transfer record "${deletingTransfer?.transfer_number}"?`}
        confirmText="Yes, Delete Transfer"
        confirmVariant="danger"
        isLoading={isDeletingTransfer}
      />
    </div>
  );
}
