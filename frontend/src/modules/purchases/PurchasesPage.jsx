import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useSearchParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';
import Modal from '../../components/Modal';
import Badge from '../../components/Badge';
import CustomSelect from '../../components/CustomSelect';
import ConfirmModal from '../../components/ConfirmModal';
import { openRazorpayCheckout } from '../../services/razorpay';
import InvoiceModal from '../../components/invoice/InvoiceModal';
import {
  ShoppingCart,
  Plus,
  Check,
  CheckCircle,
  Trash2,
  X,
  RefreshCw,
  UserCheck,
  ArrowLeftRight,
  CreditCard,
  FileText,
  Printer,
  RotateCcw,
  AlertCircle,
  Undo2,
  Clock,
  XCircle,
  Send,
  Eye,
  CheckCheck,
  ShieldCheck,
  Building,
  AlertTriangle,
  Package
} from 'lucide-react';

export default function PurchasesPage() {
  const { user } = useSelector((state) => state.auth);
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('purchases'); // 'purchases' | 'suppliers' | 'returns'
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);

  // RMA Review Modal State
  const [selectedReturnForReview, setSelectedReturnForReview] = useState(null);
  const [isReviewReturnModalOpen, setIsReviewReturnModalOpen] = useState(false);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [isRejectingFormOpen, setIsRejectingFormOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Modals
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnTargetPO, setReturnTargetPO] = useState(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payTargetPO, setPayTargetPO] = useState(null);
  const [payForm, setPayForm] = useState({
    amount: '',
    paymentMethod: 'BANK_TRANSFER',
    transactionId: '',
    notes: '',
    autoApproveStock: true
  });

  // Invoice Modal State
  const [selectedInvoicePO, setSelectedInvoicePO] = useState(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoicePaymentInfo, setInvoicePaymentInfo] = useState(null);
  const [isPaymentSuccessModal, setIsPaymentSuccessModal] = useState(false);

  // Delete Confirmation Modal State
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    type: '', // 'po' | 'supplier'
    id: null,
    title: '',
    message: '',
    itemName: '',
    loading: false
  });

  // New PO Form state
  const [poForm, setPoForm] = useState({
    supplierId: '',
    warehouseId: '',
    notes: '',
    discountAmount: 0,
    items: [{ productId: '', quantity: 1, unitPrice: '', taxRate: 0 }]
  });

  const [supplierForm, setSupplierForm] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    gstin: ''
  });

  const [returnForm, setReturnForm] = useState({
    purchaseId: null,
    poNumber: '',
    supplierId: '',
    warehouseId: '',
    warehouseName: '',
    reason: 'Defective goods on inspection',
    notes: '',
    items: []
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [poRes, supRes, whRes, prdRes, retRes] = await Promise.all([
        api.get('/purchases'),
        api.get('/suppliers'),
        api.get('/warehouses'),
        api.get('/products?limit=100'),
        api.get('/purchase-returns').catch(() => ({ data: [] }))
      ]);

      setPurchases(poRes?.data || []);
      setSuppliers(supRes?.data || []);
      setWarehouses(whRes?.data || []);
      setProducts(prdRes?.data || []);
      setReturns(retRes?.data || []);
    } catch (err) {
      console.error('Error fetching purchasing data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Deep linking sync: detect tab=returns&returnId=... or action=new/new=true/productId=...
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['purchases', 'suppliers', 'returns'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
    const retIdParam = searchParams.get('returnId');
    if (retIdParam && returns.length > 0) {
      const found = returns.find((r) => String(r.id) === String(retIdParam));
      if (found) {
        setSelectedReturnForReview(found);
        setIsReviewReturnModalOpen(true);
      }
    }

    const actionParam = searchParams.get('action');
    const newParam = searchParams.get('new');
    const productIdParam = searchParams.get('productId');
    if (actionParam === 'new' || newParam === 'true') {
      setActiveTab('purchases');
      setIsPOModalOpen(true);

      const targetWhId = user?.warehouseId ? String(user.warehouseId) : (warehouses[0]?.id ? String(warehouses[0].id) : '');
      const targetSupId = suppliers[0]?.id ? String(suppliers[0].id) : '';
      const prod = productIdParam && products.length > 0
        ? products.find((p) => String(p.id) === String(productIdParam))
        : null;

      setPoForm((prev) => ({
        ...prev,
        supplierId: prev.supplierId || targetSupId,
        warehouseId: prev.warehouseId || targetWhId,
        items: prod
          ? [
              {
                productId: String(prod.id),
                quantity: Math.max(1, (prod.minimum_stock || 5) * 2),
                unitPrice: prod.purchase_price !== undefined && prod.purchase_price !== null ? prod.purchase_price : 0,
                taxRate: prod.tax_rate !== undefined && prod.tax_rate !== null ? prod.tax_rate : 18
              }
            ]
          : prev.items
      }));
    }
  }, [searchParams, returns, products, warehouses, suppliers, user]);

  const handleAddItemRow = () => {
    setPoForm({
      ...poForm,
      items: [...poForm.items, { productId: '', quantity: 1, unitPrice: '', taxRate: 0 }]
    });
  };

  const handleRemoveItemRow = (index) => {
    const updated = poForm.items.filter((_, i) => i !== index);
    setPoForm({ ...poForm, items: updated });
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...poForm.items];
    updated[index][field] = value;

    if (field === 'productId') {
      const prod = products.find(p => p.id === parseInt(value, 10));
      if (prod) {
        updated[index].unitPrice = prod.purchase_price !== undefined && prod.purchase_price !== null ? prod.purchase_price : 0;
        updated[index].taxRate = prod.tax_rate !== undefined && prod.tax_rate !== null ? prod.tax_rate : 18;
      }
    }

    setPoForm({ ...poForm, items: updated });
  };

  const getFinancials = () => {
    let subtotal = 0;
    let taxTotal = 0;
    poForm.items.forEach(item => {
      const qty = parseInt(item.quantity, 10) || 0;
      const price = parseFloat(item.unitPrice) || 0;
      const taxRate = parseFloat(item.taxRate) || 0;
      const itemSub = qty * price;
      const itemTax = itemSub * (taxRate / 100);
      subtotal += itemSub;
      taxTotal += itemTax;
    });
    const discount = parseFloat(poForm.discountAmount) || 0;
    const grandTotal = Math.max(0, subtotal + taxTotal - discount);
    return { subtotal, taxTotal, discount, grandTotal };
  };

  const calculateGrandTotal = () => {
    return getFinancials().grandTotal;
  };

  const handleCreatePO = async (e) => {
    e.preventDefault();
    try {
      if (!poForm.supplierId) {
        toast.warning('Please select a Supplier for this purchase order');
        return;
      }
      if (!poForm.warehouseId && warehouses.length > 0) {
        toast.warning('Please select a destination Warehouse');
        return;
      }
      const validItems = poForm.items.filter((item) => item.productId && parseInt(item.quantity, 10) > 0);
      if (validItems.length === 0) {
        toast.warning('Please select at least one Product item with a valid quantity');
        return;
      }

      const targetWhId = parseInt(poForm.warehouseId, 10) || (warehouses[0]?.id || 1);
      const selectedWh = warehouses.find((w) => w.id === targetWhId);

      await api.post('/purchases', {
        supplierId: parseInt(poForm.supplierId, 10),
        warehouseId: targetWhId,
        warehouseName: selectedWh ? selectedWh.name : 'Main Warehouse',
        discountAmount: parseFloat(poForm.discountAmount) || 0,
        notes: poForm.notes || '',
        items: validItems.map((item) => {
          const prod = products.find((p) => p.id === parseInt(item.productId, 10));
          return {
            productId: parseInt(item.productId, 10),
            productCode: prod ? prod.product_code : `PRD-${item.productId}`,
            productName: prod ? prod.name : `Product ${item.productId}`,
            quantity: parseInt(item.quantity, 10),
            unitPrice: parseFloat(item.unitPrice) || 0,
            taxRate: parseFloat(item.taxRate) || 0
          };
        })
      });

      toast.success('Purchase Order created successfully');
      setIsPOModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to create Purchase Order');
    }
  };

  const handleApprovePO = async (id) => {
    try {
      await api.patch(`/purchases/${id}/approve`);
      toast.success('Purchase Order approved & inventory updated');
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to approve purchase');
    }
  };

  const handleOpenPayModal = (po) => {
    setPayTargetPO(po);
    const dueAmt = parseFloat(po.due_amount || po.grand_total || 0);
    setPayForm({
      amount: dueAmt,
      paymentMethod: 'BANK_TRANSFER',
      transactionId: `TXN-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`,
      notes: '',
      autoApproveStock: po.status !== 'APPROVED'
    });
    setIsPayModalOpen(true);
  };

  const handleOpenDeletePO = (po) => {
    setDeleteConfirm({
      isOpen: true,
      type: 'po',
      id: po.id,
      title: 'Delete Purchase Order?',
      message: 'Are you sure you want to remove this purchase order record?',
      itemName: `${po.po_number || 'PO'} • ${po.supplier_name || 'Supplier'}`,
      loading: false
    });
  };

  const handleOpenDeleteSupplier = (supplier) => {
    setDeleteConfirm({
      isOpen: true,
      type: 'supplier',
      id: supplier.id,
      title: 'Delete Supplier?',
      message: 'Are you sure you want to delete this supplier profile?',
      itemName: supplier.name,
      loading: false
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm.id) return;
    setDeleteConfirm((prev) => ({ ...prev, loading: true }));
    try {
      if (deleteConfirm.type === 'po') {
        await api.delete(`/purchases/${deleteConfirm.id}`);
        toast.success('Purchase order deleted successfully');
      } else if (deleteConfirm.type === 'supplier') {
        await api.delete(`/suppliers/${deleteConfirm.id}`);
        toast.success('Supplier deleted successfully');
      } else if (deleteConfirm.type === 'return') {
        await api.delete(`/purchase-returns/${deleteConfirm.id}`);
        toast.success('Purchase return deleted & stock restored to live inventory successfully');
      }
      setDeleteConfirm({ isOpen: false, type: '', id: null, title: '', message: '', itemName: '', loading: false });
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to delete');
      setDeleteConfirm((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleViewInvoice = async (po) => {
    if (po.payment_status !== 'PAID') {
      toast.warn('Please complete the payment first to generate and download the Tax Invoice.');
      return;
    }
    try {
      const res = await api.get(`/purchases/${po.id}`);
      setSelectedInvoicePO(res.data?.data || po);
    } catch (e) {
      setSelectedInvoicePO(po);
    }
    setInvoicePaymentInfo(null);
    setIsPaymentSuccessModal(false);
    setIsInvoiceModalOpen(true);
  };

  const handleOpenRazorpay = async (po) => {
    const dueAmount = parseFloat(po.due_amount || po.grand_total || 0);
    let key = (localStorage.getItem('stockpilot_rzp_key') || '').trim();
    if (!key || key === 'rzp_test_51b7Z0wZ4N3F8C') {
      key = 'rzp_test_TZszoYWU51JmHM';
      localStorage.setItem('stockpilot_rzp_key', key);
    }

    try {
      await openRazorpayCheckout({
        key: key.trim(),
        amount: dueAmount,
        poNumber: po.po_number,
        supplierName: po.supplier_name,
        companyName: 'StockPilot',
        onSuccess: async (response) => {
          const txnId = response.razorpay_payment_id || `pay_${Date.now()}`;
          try {
            await api.post(`/purchases/${po.id}/payments`, {
              amount: dueAmount,
              paymentMethod: 'RAZORPAY',
              transactionId: txnId,
              notes: `Paid via Razorpay (Payment ID: ${txnId})`,
              autoApproveStock: true
            });
            toast.success(`Payment verified via Razorpay! ID: ${txnId}`);
            fetchData();

            try {
              const res = await api.get(`/purchases/${po.id}`);
              setSelectedInvoicePO(res.data?.data || po);
            } catch (err) {
              setSelectedInvoicePO({ ...po, paid_amount: dueAmount, due_amount: 0, payment_status: 'PAID' });
            }
            setInvoicePaymentInfo({
              transactionId: txnId,
              amount: dueAmount,
              date: new Date()
            });
            setIsPaymentSuccessModal(true);
            setIsInvoiceModalOpen(true);
          } catch (e) {
            toast.error(e.message || 'Payment recording failed');
          }
        },
        onDismiss: (err) => {
          if (err && (err.code === 'BAD_REQUEST_ERROR' || String(err.description || '').includes('Unauthorized'))) {
            toast.error('Invalid Razorpay Key. Please update your Key ID in Settings or try again.');
          } else {
            toast.info('Payment window closed');
          }
        }
      });
    } catch (err) {
      toast.error(err.message || 'Failed to launch Razorpay Checkout');
    }
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    if (!payTargetPO) return;
    const payAmt = parseFloat(payForm.amount || 0);
    const txnId = payForm.transactionId || `TXN-${Date.now()}`;
    try {
      await api.post(`/purchases/${payTargetPO.id}/payments`, {
        amount: payAmt,
        paymentMethod: payForm.paymentMethod,
        transactionId: txnId,
        notes: payForm.notes,
        autoApproveStock: payForm.autoApproveStock
      });
      toast.success('Payment recorded successfully!');
      setIsPayModalOpen(false);
      fetchData();

      try {
        const res = await api.get(`/purchases/${payTargetPO.id}`);
        setSelectedInvoicePO(res.data?.data || payTargetPO);
      } catch (err) {
        setSelectedInvoicePO(payTargetPO);
      }
      setInvoicePaymentInfo({
        transactionId: txnId,
        amount: payAmt,
        date: new Date()
      });
      setIsPaymentSuccessModal(true);
      setIsInvoiceModalOpen(true);
      setPayTargetPO(null);
    } catch (err) {
      toast.error(err.message || 'Failed to record payment');
    }
  };

  const handleCreateSupplier = async (e) => {
    e.preventDefault();
    try {
      await api.post('/suppliers', supplierForm);
      toast.success('Supplier created successfully');
      setIsSupplierModalOpen(false);
      setSupplierForm({ name: '', contactPerson: '', email: '', phone: '', address: '', gstin: '' });
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to create supplier');
    }
  };

  const handleOpenProcessReturn = (targetPO = null) => {
    const selectedPO = targetPO || purchases.find((p) => p.status === 'APPROVED' || p.payment_status === 'PAID') || purchases[0];

    if (selectedPO) {
      setReturnForm({
        purchaseId: String(selectedPO.id),
        poNumber: selectedPO.po_number,
        supplierId: String(selectedPO.supplier_id),
        warehouseId: String(selectedPO.warehouse_id),
        warehouseName: selectedPO.warehouse_name,
        reason: 'Defective / Damaged items on delivery',
        notes: '',
        items: (selectedPO.items || []).map((item) => ({
          productId: item.product_id,
          productCode: item.product_code,
          productName: item.product_name,
          purchasedQty: item.quantity,
          quantity: 1,
          unitPrice: item.unit_price,
          selected: true
        }))
      });
    } else {
      setReturnForm({
        purchaseId: '',
        poNumber: '',
        supplierId: '',
        warehouseId: '',
        warehouseName: '',
        reason: 'Defective / Damaged items on delivery',
        notes: '',
        items: []
      });
    }
    setIsReturnModalOpen(true);
  };

  const handleSelectPOForReturn = (poId) => {
    if (!poId) {
      setReturnForm((prev) => ({
        ...prev,
        purchaseId: '',
        poNumber: '',
        supplierId: '',
        warehouseId: '',
        warehouseName: '',
        items: []
      }));
      return;
    }

    const selectedPO = purchases.find((p) => String(p.id) === String(poId));
    if (selectedPO) {
      setReturnForm((prev) => ({
        ...prev,
        purchaseId: String(selectedPO.id),
        poNumber: selectedPO.po_number,
        supplierId: String(selectedPO.supplier_id),
        warehouseId: String(selectedPO.warehouse_id),
        warehouseName: selectedPO.warehouse_name,
        items: (selectedPO.items || []).map((item) => ({
          productId: item.product_id,
          productCode: item.product_code,
          productName: item.product_name,
          purchasedQty: item.quantity,
          quantity: 1,
          unitPrice: item.unit_price,
          selected: true
        }))
      }));
    }
  };

  const handleReturnItemChange = (idx, field, val) => {
    const updated = [...returnForm.items];
    updated[idx][field] = val;
    setReturnForm((prev) => ({ ...prev, items: updated }));
  };

  const handleOpenDeleteReturn = (pReturn) => {
    setDeleteConfirm({
      isOpen: true,
      type: 'return',
      id: pReturn.id,
      title: 'Delete Purchase Return?',
      message: 'Are you sure you want to delete this purchase return record? Deleting this return will automatically restore the returned items back into warehouse live stock.',
      itemName: `${pReturn.return_number || 'Return'} • ${pReturn.supplier_name || 'Supplier'} (Refund: ₹${parseFloat(pReturn.total_refund || 0).toLocaleString()})`,
      loading: false
    });
  };

  const handleCreateReturn = async (e) => {
    e.preventDefault();
    try {
      const activeItems = (returnForm.items || [])
        .filter((item) => item.selected !== false)
        .map((item) => ({
          productId: parseInt(item.productId, 10),
          productCode: item.productCode || '',
          productName: item.productName || '',
          quantity: parseInt(item.quantity, 10),
          unitPrice: parseFloat(item.unitPrice) || 0
        }))
        .filter((item) => item.quantity > 0);

      if (activeItems.length === 0) {
        toast.error('Please specify at least one product with return quantity greater than 0');
        return;
      }

      const selectedWh = warehouses.find((w) => w.id === parseInt(returnForm.warehouseId, 10));

      const res = await api.post('/purchase-returns', {
        purchaseId: returnForm.purchaseId ? parseInt(returnForm.purchaseId, 10) : null,
        supplierId: parseInt(returnForm.supplierId, 10),
        warehouseId: parseInt(returnForm.warehouseId, 10),
        warehouseName: selectedWh ? selectedWh.name : returnForm.warehouseName || 'Main Warehouse',
        reason: returnForm.reason,
        notes: returnForm.notes,
        items: activeItems
      });

      toast.success('RMA Return Request logged! Awaiting supplier / manager acceptance.');
      setIsReturnModalOpen(false);
      setActiveTab('returns');
      fetchData();
      if (res?.data) {
        setSelectedReturnForReview(res.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to process purchase return');
    }
  };

  const handleApproveReturn = async (returnId) => {
    try {
      setActionLoading(true);
      await api.patch(`/purchase-returns/${returnId}/approve`);
      toast.success('Return request accepted! Warehouse live stock deducted successfully.');
      setIsReviewReturnModalOpen(false);
      setSelectedReturnForReview(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to approve return request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectReturn = async (returnId) => {
    if (!rejectionReasonInput.trim()) {
      toast.warning('Please specify a reason for declining the return request');
      return;
    }
    try {
      setActionLoading(true);
      await api.patch(`/purchase-returns/${returnId}/reject`, {
        rejectionReason: rejectionReasonInput.trim()
      });
      toast.info('Return request declined. Warehouse live stock remains unaffected.');
      setIsReviewReturnModalOpen(false);
      setSelectedReturnForReview(null);
      setRejectionReasonInput('');
      setIsRejectingFormOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to decline return request');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Purchasing & Suppliers</h1>
          <p className="page-subtitle">
            Manage procurement orders, supplier accounts, and purchase returns
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="segmented-control">
            <button
              onClick={() => setActiveTab('purchases')}
              className={`segmented-tab ${activeTab === 'purchases' ? 'active' : ''}`}
            >
              <ShoppingCart size={15} /> Purchase Orders ({purchases.length})
            </button>
            <button
              onClick={() => setActiveTab('suppliers')}
              className={`segmented-tab ${activeTab === 'suppliers' ? 'active' : ''}`}
            >
              <UserCheck size={15} /> Suppliers ({suppliers.length})
            </button>
            <button
              onClick={() => setActiveTab('returns')}
              className={`segmented-tab ${activeTab === 'returns' ? 'active' : ''}`}
            >
              <ArrowLeftRight size={15} /> Purchase Returns ({returns.length})
            </button>
          </div>

          <button
            onClick={() => {
              setPoForm({
                supplierId: suppliers[0]?.id ? String(suppliers[0].id) : '',
                warehouseId: warehouses[0]?.id ? String(warehouses[0].id) : '',
                notes: '',
                discountAmount: 0,
                items: [{ productId: '', quantity: 1, unitPrice: '', taxRate: 0 }]
              });
              setIsPOModalOpen(true);
            }}
            className="btn btn-primary btn-sm"
          >
            <Plus size={14} /> New Purchase Order
          </button>
        </div>
      </div>

      {activeTab === 'purchases' && (
        <>
          {products.length === 0 && (
            <div
              style={{
                background: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                borderRadius: '10px',
                padding: '0.85rem 1.25rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Package size={22} color="#3b82f6" style={{ flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e40af' }}>
                    Your Product Catalog is Empty
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#3b82f6' }}>
                    To create purchase orders and procure inventory, define your products in the Products page first.
                  </div>
                </div>
              </div>
              <Link to="/products" className="btn btn-primary btn-sm" style={{ whiteSpace: 'nowrap', textDecoration: 'none' }}>
                <Plus size={13} /> Go to Products Catalog
              </Link>
            </div>
          )}

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-container" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>PO Number</th>
                  <th>Supplier</th>
                  <th>Warehouse</th>
                  <th>Order Items</th>
                  <th>Grand Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {purchases.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No purchase orders found. Click "New Purchase Order" to procure stock!
                    </td>
                  </tr>
                ) : (
                  purchases.map((po) => (
                    <tr key={po.id}>
                      <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{po.po_number}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{po.supplier_name}</div>
                      </td>
                      <td>{po.warehouse_name}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {(po.items || []).map((item, idx) => (
                            <div
                              key={idx}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                                {item.product_name}
                              </span>
                              <span
                                style={{
                                  fontSize: '0.72rem',
                                  fontWeight: 600,
                                  color: 'var(--primary)',
                                  background: 'rgba(152, 42, 134, 0.08)',
                                  border: '1px solid rgba(152, 42, 134, 0.2)',
                                  padding: '1px 6px',
                                  borderRadius: '4px'
                                }}
                              >
                                Qty: {item.quantity}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td style={{ fontWeight: 800 }}>₹{parseFloat(po.grand_total).toLocaleString()}</td>
                      <td>
                        <Badge status={po.payment_status} />
                      </td>
                      <td>
                        <Badge status={po.status} />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'nowrap' }}>
                          {po.payment_status === 'PAID' && (
                            <button
                              onClick={() => handleViewInvoice(po)}
                              className="btn btn-secondary btn-sm"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '0.35rem 0.65rem',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                whiteSpace: 'nowrap',
                                flexShrink: 0
                              }}
                              title="View & Download Official Tax Invoice"
                            >
                              <FileText size={13} color="var(--primary)" /> Invoice
                            </button>
                          )}

                          {po.payment_status !== 'PAID' && (
                            <button
                              onClick={() => handleOpenRazorpay(po)}
                              className="btn btn-primary btn-sm"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '0.35rem 0.75rem',
                                whiteSpace: 'nowrap',
                                flexShrink: 0
                              }}
                              title="Pay with Razorpay Gateway"
                            >
                              <CreditCard size={13} /> Pay Now
                            </button>
                          )}

                          {po.status === 'DRAFT' || po.status === 'PENDING_APPROVAL' ? (
                            <button
                              onClick={() => handleApprovePO(po.id)}
                              className="btn btn-success btn-sm"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '0.35rem 0.75rem',
                                whiteSpace: 'nowrap',
                                flexShrink: 0
                              }}
                              title="Approve & Increase Stock"
                            >
                              <Check size={14} /> Intake Stock
                            </button>
                          ) : (
                            <span style={{ color: 'var(--success)', fontWeight: 700, fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                              <CheckCircle size={13} /> Stock Added
                            </span>
                          )}

                          {po.status === 'APPROVED' && (
                            <button
                              onClick={() => handleOpenProcessReturn(po)}
                              className="btn btn-secondary btn-sm"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '0.35rem 0.65rem',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                whiteSpace: 'nowrap',
                                flexShrink: 0
                              }}
                              title="Initiate Purchase Return / RTV"
                            >
                              <RotateCcw size={13} color="#ef4444" /> Return
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenDeletePO(po)}
                            className="btn btn-danger btn-sm"
                            style={{ padding: '0.35rem 0.45rem', flexShrink: 0 }}
                            title="Delete Purchase Order"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        </>
      )}

      {activeTab === 'suppliers' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button onClick={() => setIsSupplierModalOpen(true)} className="btn btn-primary btn-sm">
              <Plus size={14} /> Add New Supplier
            </button>
          </div>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-container" style={{ border: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Supplier / Company</th>
                    <th>Contact Person</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>GSTIN</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        No suppliers registered. Click "Add New Supplier" to add one!
                      </td>
                    </tr>
                  ) : (
                    suppliers.map((s) => (
                      <tr key={s.id}>
                        <td style={{ fontWeight: 700 }}>{s.name}</td>
                        <td>{s.contact_person || '—'}</td>
                        <td>{s.phone}</td>
                        <td>{s.email || '—'}</td>
                        <td><code>{s.gstin || '—'}</code></td>
                        <td><Badge status={s.status} /></td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            onClick={() => handleOpenDeleteSupplier(s)}
                            className="btn btn-danger btn-sm"
                            style={{ padding: '0.25rem 0.45rem', fontSize: '0.75rem' }}
                            title="Delete Supplier"
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
          </div>
        </div>
      )}

      {activeTab === 'returns' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button
              onClick={handleOpenProcessReturn}
              className="btn btn-danger btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <RotateCcw size={14} /> Process Purchase Return
            </button>
          </div>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-container" style={{ border: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Return #</th>
                    <th>Linked PO</th>
                    <th>Supplier</th>
                    <th>Warehouse</th>
                    <th>Items Returned</th>
                    <th>Refund Value</th>
                    <th>Reason</th>
                    <th>RMA Status</th>
                    <th>Date</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {returns.length === 0 ? (
                    <tr>
                      <td colSpan={10} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                        No purchase returns recorded yet. Click "Process Purchase Return" to submit an RMA return request.
                      </td>
                    </tr>
                  ) : (
                    returns.map((r) => {
                      const isPending = !r.status || r.status === 'PENDING_APPROVAL';
                      const isApproved = r.status === 'APPROVED';
                      const isRejected = r.status === 'REJECTED';

                      return (
                        <tr key={r.id} style={{ background: isPending ? '#fffdf7' : 'transparent' }}>
                          <td style={{ fontWeight: 700, color: isApproved ? 'var(--success)' : isPending ? '#d97706' : '#ef4444' }}>
                            {r.return_number}
                          </td>
                          <td>
                            {r.purchase_id ? (
                              <span style={{ fontWeight: 600, color: 'var(--primary)', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                                PO #{r.purchase_id}
                              </span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Direct Return</span>
                            )}
                          </td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{r.supplier_name}</div>
                          </td>
                          <td>{r.warehouse_name}</td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                              {(r.items || []).map((item, idx) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>{item.product_name}</span>
                                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#dc2626', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '1px 6px', borderRadius: '4px' }}>-{item.quantity} qty</span>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td style={{ fontWeight: 800, color: '#0f172a' }}>₹{parseFloat(r.total_refund || 0).toLocaleString()}</td>
                          <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{r.reason}</td>
                          <td>
                            {isApproved && (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '0.2rem 0.6rem',
                                  borderRadius: '6px',
                                  fontSize: '0.725rem',
                                  fontWeight: 700,
                                  background: '#ecfdf5',
                                  color: '#047857',
                                  border: '1px solid #a7f3d0'
                                }}
                              >
                                <CheckCircle size={12} /> Accepted (Deducted)
                              </span>
                            )}
                            {isPending && (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '0.2rem 0.6rem',
                                  borderRadius: '6px',
                                  fontSize: '0.725rem',
                                  fontWeight: 700,
                                  background: '#fffbeb',
                                  color: '#b45309',
                                  border: '1px solid #fde68a'
                                }}
                              >
                                <Clock size={12} /> Awaiting Review
                              </span>
                            )}
                            {isRejected && (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '0.2rem 0.6rem',
                                  borderRadius: '6px',
                                  fontSize: '0.725rem',
                                  fontWeight: 700,
                                  background: '#fef2f2',
                                  color: '#b91c1c',
                                  border: '1px solid #fecaca'
                                }}
                                title={r.rejection_reason || 'Declined'}
                              >
                                <XCircle size={12} /> Declined
                              </span>
                            )}
                          </td>
                          <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                            {new Date(r.created_at || r.createdAt).toLocaleDateString()}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '5px', justifyContent: 'flex-end', alignItems: 'center' }}>
                              <button
                                onClick={() => {
                                  setSelectedReturnForReview(r);
                                  setIsReviewReturnModalOpen(true);
                                  setIsRejectingFormOpen(false);
                                  setRejectionReasonInput('');
                                }}
                                className={`btn btn-sm ${isPending ? 'btn-primary' : 'btn-secondary'}`}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '0.28rem 0.6rem',
                                  fontSize: '0.75rem',
                                  fontWeight: 600
                                }}
                                title="Review / Inspect Return Request"
                              >
                                {isPending ? <CheckCheck size={13} /> : <Eye size={13} />}
                                {isPending ? 'Review & Act' : 'Details'}
                              </button>

                              <button
                                onClick={() => handleOpenDeleteReturn(r)}
                                className="btn btn-danger btn-sm"
                                style={{ padding: '0.28rem 0.45rem', fontSize: '0.75rem' }}
                                title="Delete Return Record"
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
        </div>
      )}

      {/* New Purchase Order Modal */}
      <Modal isOpen={isPOModalOpen} onClose={() => setIsPOModalOpen(false)} title="Create Purchase Order" maxWidth="820px">
        <form onSubmit={handleCreatePO}>
          <div className="form-row">
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label className="form-label" style={{ margin: 0 }}>Select Supplier *</label>
                {suppliers.length === 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsPOModalOpen(false);
                      setIsSupplierModalOpen(true);
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                  >
                    + Add Supplier
                  </button>
                )}
              </div>
              <CustomSelect
                value={poForm.supplierId}
                onChange={(e) => setPoForm({ ...poForm, supplierId: e.target.value })}
                placeholder="Select Supplier"
                options={[
                  { value: '', label: 'Select Supplier' },
                  ...suppliers.map((s) => ({ value: s.id, label: `${s.name} (${s.phone || 'No phone'})` }))
                ]}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Receiving Warehouse *</label>
              <CustomSelect
                value={poForm.warehouseId}
                onChange={(e) => setPoForm({ ...poForm, warehouseId: e.target.value })}
                placeholder="Select Receiving Warehouse"
                options={[
                  { value: '', label: 'Select Receiving Warehouse' },
                  ...warehouses.map((w) => ({ value: w.id, label: `${w.name} (${w.code})` }))
                ]}
              />
            </div>
          </div>

          {products.length === 0 && (
            <div
              style={{
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                marginTop: '0.75rem',
                marginBottom: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={18} color="#2563eb" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '0.8rem', color: '#1e40af' }}>
                  <strong>Product Catalog is empty:</strong> Add products to your catalog first before procuring them.
                </span>
              </div>
              <Link to="/products" className="btn btn-primary btn-sm" style={{ whiteSpace: 'nowrap', textDecoration: 'none' }}>
                + Add Products to Catalog
              </Link>
            </div>
          )}

          <div style={{ marginTop: '1.25rem', marginBottom: '0.65rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>Order Line Items</span>
              <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: '6px' }}>
                ({poForm.items.length} {poForm.items.length === 1 ? 'item' : 'items'})
              </span>
            </div>
            <button type="button" onClick={handleAddItemRow} className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Plus size={13} /> Add Row
            </button>
          </div>

          {/* Table Header Bar with Clear Labels */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '3.2fr 1.1fr 1.6fr 1.1fr 1.4fr 36px',
              gap: '0.65rem',
              padding: '0.55rem 0.75rem',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              marginBottom: '0.5rem',
              fontSize: '0.725rem',
              fontWeight: 700,
              color: '#475569',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}
          >
            <div>Product Item *</div>
            <div style={{ textAlign: 'center' }}>Qty *</div>
            <div>Unit Cost (₹) *</div>
            <div style={{ textAlign: 'center' }}>Tax / GST (%)</div>
            <div style={{ textAlign: 'right' }}>Total Amount</div>
            <div></div>
          </div>

          {/* Line Items Rows */}
          {poForm.items.map((item, index) => {
            const lineQty = parseInt(item.quantity, 10) || 0;
            const lineCost = parseFloat(item.unitPrice) || 0;
            const lineTax = parseFloat(item.taxRate) || 0;
            const lineTotal = (lineQty * lineCost) * (1 + lineTax / 100);

            return (
              <div
                key={index}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '3.2fr 1.1fr 1.6fr 1.1fr 1.4fr 36px',
                  gap: '0.65rem',
                  alignItems: 'center',
                  marginBottom: '0.5rem',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  padding: '0.65rem 0.75rem',
                  borderRadius: '8px'
                }}
              >
                <div>
                  <CustomSelect
                    value={item.productId}
                    onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                    placeholder="Select Product"
                    size="sm"
                    options={[
                      { value: '', label: 'Select Product' },
                      ...products.map((p) => ({ value: p.id, label: `${p.name} (${p.product_code})` }))
                    ]}
                  />
                </div>

                <div>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                    required
                    style={{ padding: '0.45rem 0.5rem', textAlign: 'center' }}
                  />
                </div>

                <div>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <span style={{ position: 'absolute', left: '8px', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', pointerEvents: 'none' }}>₹</span>
                    <input
                      type="number"
                      className="form-input"
                      value={item.unitPrice || 0}
                      readOnly
                      title="Auto-filled from Product Catalog Purchase Price"
                      style={{
                        padding: '0.45rem 0.5rem 0.45rem 1.4rem',
                        background: '#f1f5f9',
                        color: '#334155',
                        fontWeight: 600,
                        cursor: 'not-allowed'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type="number"
                      className="form-input"
                      value={item.taxRate || 0}
                      readOnly
                      title="Auto-filled from Product GST Rate"
                      style={{
                        padding: '0.45rem 1.4rem 0.45rem 0.5rem',
                        textAlign: 'center',
                        background: '#f1f5f9',
                        color: '#334155',
                        fontWeight: 600,
                        cursor: 'not-allowed'
                      }}
                    />
                    <span style={{ position: 'absolute', right: '8px', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', pointerEvents: 'none' }}>%</span>
                  </div>
                </div>

                <div style={{ textAlign: 'right', fontWeight: 700, fontSize: '0.9rem', color: '#0f172a', fontFamily: 'monospace' }}>
                  ₹{lineTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </div>

                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  {poForm.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItemRow(index)}
                      className="btn btn-danger btn-sm"
                      style={{ padding: '0.35rem', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      title="Remove Item"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Financial Summary Breakdown Card */}
          <div
            style={{
              marginTop: '1.25rem',
              padding: '1rem',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#64748b', marginBottom: '0.35rem' }}>
              <span>Items Subtotal (Excl. Tax):</span>
              <span style={{ fontWeight: 600, color: '#0f172a' }}>
                ₹{getFinancials().subtotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem' }}>
              <span>Estimated Tax (GST):</span>
              <span style={{ fontWeight: 600, color: '#10b981' }}>
                +₹{getFinancials().taxTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </span>
            </div>
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.65rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>Total Order Value:</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>
                ₹{getFinancials().grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={() => setIsPOModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create Purchase Order
            </button>
          </div>
        </form>
      </Modal>

      {/* Supplier Modal */}
      <Modal isOpen={isSupplierModalOpen} onClose={() => setIsSupplierModalOpen(false)} title="Add Supplier">
        <form onSubmit={handleCreateSupplier}>
          <div className="form-group">
            <label className="form-label">Supplier / Company Name *</label>
            <input
              type="text"
              className="form-input"
              value={supplierForm.name}
              onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Contact Person</label>
              <input
                type="text"
                className="form-input"
                value={supplierForm.contactPerson}
                onChange={(e) => setSupplierForm({ ...supplierForm, contactPerson: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number *</label>
              <input
                type="tel"
                className="form-input"
                value={supplierForm.phone}
                onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                value={supplierForm.email}
                onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">GSTIN / Tax ID</label>
              <input
                type="text"
                className="form-input"
                value={supplierForm.gstin}
                onChange={(e) => setSupplierForm({ ...supplierForm, gstin: e.target.value })}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={() => setIsSupplierModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Supplier
            </button>
          </div>
        </form>
      </Modal>

      {/* Return Modal (Process Purchase Return - Option A: Pure PO Linked) */}
      <Modal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        title="Process Purchase Return"
        maxWidth="820px"
      >
        <form onSubmit={handleCreateReturn}>
          {/* PO Selector */}
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label" style={{ fontWeight: 700, color: '#0f172a' }}>
              Select Purchase Order to Return From *
            </label>
            <CustomSelect
              value={returnForm.purchaseId}
              onChange={(e) => handleSelectPOForReturn(e.target.value)}
              placeholder="Select Purchase Order"
              options={[
                { value: '', label: 'Select Purchase Order' },
                ...purchases.map((p) => ({
                  value: String(p.id),
                  label: `${p.po_number} • ${p.supplier_name} • ₹${parseFloat(p.grand_total).toLocaleString()} (${p.warehouse_name})`
                }))
              ]}
            />
          </div>

          {/* PO Context Banner */}
          {returnForm.purchaseId ? (
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                marginBottom: '1rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.75rem'
              }}
            >
              <div>
                <span style={{ fontSize: '0.725rem', color: '#64748b', display: 'block', fontWeight: 600 }}>Purchase Order</span>
                <strong style={{ fontSize: '0.875rem', color: 'var(--primary)' }}>{returnForm.poNumber}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.725rem', color: '#64748b', display: 'block', fontWeight: 600 }}>Supplier</span>
                <strong style={{ fontSize: '0.875rem', color: '#0f172a' }}>
                  {suppliers.find((s) => String(s.id) === String(returnForm.supplierId))?.name || returnForm.supplierName || 'Supplier'}
                </strong>
              </div>
              <div>
                <span style={{ fontSize: '0.725rem', color: '#64748b', display: 'block', fontWeight: 600 }}>Warehouse Hub</span>
                <strong style={{ fontSize: '0.875rem', color: '#0f172a' }}>
                  {returnForm.warehouseName || 'Main Warehouse'}
                </strong>
              </div>
            </div>
          ) : (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', marginBottom: '1rem', fontSize: '0.85rem' }}>
              Please select a purchase order above to review and select items for return.
            </div>
          )}

          {/* Items Table for Return */}
          {returnForm.purchaseId && (
            <div style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>
              <div style={{ marginBottom: '0.45rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>
                  Select Items to Return & Deduct from Stock
                </span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '32px 3fr 1.2fr 1.2fr 1.4fr',
                  gap: '0.5rem',
                  padding: '0.45rem 0.65rem',
                  background: '#f1f5f9',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '0.725rem',
                  fontWeight: 700,
                  color: '#475569',
                  textTransform: 'uppercase'
                }}
              >
                <div></div>
                <div>Product Item</div>
                <div style={{ textAlign: 'center' }}>Return Qty</div>
                <div style={{ textAlign: 'right' }}>Unit Price</div>
                <div style={{ textAlign: 'right' }}>Refund Amount</div>
              </div>

              {(returnForm.items || []).map((item, idx) => {
                const qty = parseInt(item.quantity, 10) || 0;
                const price = parseFloat(item.unitPrice) || 0;
                const lineTotal = qty * price;

                return (
                  <div
                    key={idx}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '32px 3fr 1.2fr 1.2fr 1.4fr',
                      gap: '0.5rem',
                      alignItems: 'center',
                      padding: '0.55rem 0.65rem',
                      background: item.selected !== false ? '#ffffff' : '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      marginTop: '0.35rem'
                    }}
                  >
                    <div>
                      <input
                        type="checkbox"
                        checked={item.selected !== false}
                        onChange={(e) => handleReturnItemChange(idx, 'selected', e.target.checked)}
                        style={{ accentColor: 'var(--primary)', width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                    </div>

                    <div>
                      <strong style={{ fontSize: '0.85rem', color: '#0f172a', display: 'block' }}>{item.productName}</strong>
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        SKU: {item.productCode} • Purchased: {item.purchasedQty}
                      </span>
                    </div>

                    <div>
                      <input
                        type="number"
                        min="1"
                        max={item.purchasedQty || 9999}
                        className="form-input"
                        value={item.quantity}
                        disabled={item.selected === false}
                        onChange={(e) => handleReturnItemChange(idx, 'quantity', e.target.value)}
                        required
                        style={{ padding: '0.35rem 0.5rem', textAlign: 'center' }}
                      />
                    </div>

                    <div style={{ textAlign: 'right', fontWeight: 600, fontSize: '0.85rem', color: '#334155' }}>
                      ₹{price.toLocaleString()}
                    </div>

                    <div style={{ textAlign: 'right', fontWeight: 700, fontSize: '0.875rem', color: item.selected !== false ? '#ef4444' : '#94a3b8' }}>
                      ₹{lineTotal.toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {returnForm.purchaseId && (
            <>
              <div className="form-row" style={{ marginTop: '0.75rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Reason for Return *</label>
                  <CustomSelect
                    value={returnForm.reason}
                    onChange={(e) => setReturnForm({ ...returnForm, reason: e.target.value })}
                    options={[
                      { value: 'Defective / Damaged items on delivery', label: 'Defective / Damaged items on delivery' },
                      { value: 'Wrong product specification delivered', label: 'Wrong product specification delivered' },
                      { value: 'Excess items delivered by supplier', label: 'Excess items delivered by supplier' },
                      { value: 'Quality check failure on inspection', label: 'Quality check failure on inspection' },
                      { value: 'Supplier recall / Return request', label: 'Supplier recall / Return request' },
                      { value: 'Other reason', label: 'Other reason' }
                    ]}
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Notes / Remarks (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={returnForm.notes}
                    onChange={(e) => setReturnForm({ ...returnForm, notes: e.target.value })}
                    placeholder="e.g. Return authorization reference"
                  />
                </div>
              </div>

              {/* Refund Value Calculation Card */}
              <div
                style={{
                  padding: '0.75rem 1rem',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  marginTop: '0.75rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>Estimated Refund Value:</span>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>
                    Submitting creates an RMA request. Stock will only be deducted once reviewed and accepted.
                  </span>
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary)' }}>
                  ₹
                  {(returnForm.items || [])
                    .filter((item) => item.selected !== false)
                    .reduce((sum, item) => sum + (parseInt(item.quantity, 10) || 0) * (parseFloat(item.unitPrice) || 0), 0)
                    .toLocaleString()}
                </div>
              </div>
            </>
          )}

          <div className="modal-footer">
            <button
              type="button"
              onClick={() => setIsReturnModalOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!returnForm.purchaseId || (returnForm.items || []).filter(i => i.selected !== false).length === 0}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Send size={14} /> Submit Return Request
            </button>
          </div>
        </form>
      </Modal>

      {/* Review Return Request / RMA Inspection Modal */}
      <Modal
        isOpen={isReviewReturnModalOpen}
        onClose={() => {
          setIsReviewReturnModalOpen(false);
          setSelectedReturnForReview(null);
          setIsRejectingFormOpen(false);
          setRejectionReasonInput('');
        }}
        title={`Review Purchase Return Request (${selectedReturnForReview?.return_number || ''})`}
        maxWidth="740px"
      >
        {selectedReturnForReview && (
          <div>
            {/* Header Status & Context Banner */}
            <div
              style={{
                background: selectedReturnForReview.status === 'APPROVED' ? '#ecfdf5' : selectedReturnForReview.status === 'REJECTED' ? '#fef2f2' : '#fffbeb',
                border: `1px solid ${selectedReturnForReview.status === 'APPROVED' ? '#a7f3d0' : selectedReturnForReview.status === 'REJECTED' ? '#fecaca' : '#fde68a'}`,
                borderRadius: '8px',
                padding: '0.85rem 1rem',
                marginBottom: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <span style={{ fontSize: '0.725rem', color: '#64748b', display: 'block', fontWeight: 600 }}>RMA Status</span>
                <strong
                  style={{
                    fontSize: '0.95rem',
                    color: selectedReturnForReview.status === 'APPROVED' ? '#047857' : selectedReturnForReview.status === 'REJECTED' ? '#b91c1c' : '#b45309'
                  }}
                >
                  {selectedReturnForReview.status === 'APPROVED'
                    ? '✓ Accepted by Supplier (Live Stock Deducted)'
                    : selectedReturnForReview.status === 'REJECTED'
                    ? '✕ Declined by Supplier (Stock Unaffected)'
                    : '⏳ Awaiting Supplier / Manager Review'}
                </strong>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.725rem', color: '#64748b', display: 'block', fontWeight: 600 }}>Total Credit / Refund</span>
                <strong style={{ fontSize: '1.2rem', color: '#0f172a' }}>
                  ₹{parseFloat(selectedReturnForReview.total_refund || 0).toLocaleString()}
                </strong>
              </div>
            </div>

            {/* Return Context Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.75rem',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '0.85rem 1rem',
                marginBottom: '1rem'
              }}
            >
              <div>
                <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', fontWeight: 600 }}>Supplier</span>
                <strong style={{ fontSize: '0.875rem', color: '#0f172a' }}>{selectedReturnForReview.supplier_name}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', fontWeight: 600 }}>Warehouse Hub</span>
                <strong style={{ fontSize: '0.875rem', color: '#0f172a' }}>{selectedReturnForReview.warehouse_name}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', fontWeight: 600 }}>Submitted By</span>
                <span style={{ fontSize: '0.85rem', color: '#334155', fontWeight: 600 }}>
                  {selectedReturnForReview.created_by || 'Staff'} ({new Date(selectedReturnForReview.created_at || selectedReturnForReview.createdAt).toLocaleDateString()})
                </span>
              </div>
            </div>

            {/* Defect Reason & Remarks */}
            <div style={{ marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>
                Defect Reason & Inspection Notes:
              </span>
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '0.65rem 0.85rem', borderRadius: '6px', fontSize: '0.85rem', color: '#334155' }}>
                <strong>{selectedReturnForReview.reason}</strong>
                {selectedReturnForReview.notes && (
                  <div style={{ marginTop: '4px', fontSize: '0.8rem', color: '#64748b' }}>
                    Remarks: {selectedReturnForReview.notes}
                  </div>
                )}
              </div>
            </div>

            {/* Rejection Note if Rejected */}
            {selectedReturnForReview.status === 'REJECTED' && selectedReturnForReview.rejection_reason && (
              <div style={{ marginBottom: '1rem', background: '#fef2f2', border: '1px solid #fecaca', padding: '0.65rem 0.85rem', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#b91c1c', display: 'block' }}>
                  Decline Rationale (by {selectedReturnForReview.reviewed_by || 'Reviewer'}):
                </span>
                <p style={{ margin: '3px 0 0 0', fontSize: '0.85rem', color: '#7f1d1d' }}>
                  {selectedReturnForReview.rejection_reason}
                </p>
              </div>
            )}

            {/* Items List */}
            <div style={{ marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 700, display: 'block', marginBottom: '0.45rem' }}>
                Items Requested for Return:
              </span>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '3fr 1fr 1.2fr 1.2fr',
                    padding: '0.45rem 0.75rem',
                    background: '#f1f5f9',
                    fontSize: '0.725rem',
                    fontWeight: 700,
                    color: '#475569',
                    textTransform: 'uppercase'
                  }}
                >
                  <div>Product Item</div>
                  <div style={{ textAlign: 'center' }}>Return Qty</div>
                  <div style={{ textAlign: 'right' }}>Unit Price</div>
                  <div style={{ textAlign: 'right' }}>Total</div>
                </div>
                {(selectedReturnForReview.items || []).map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '3fr 1fr 1.2fr 1.2fr',
                      padding: '0.6rem 0.75rem',
                      borderTop: '1px solid #f1f5f9',
                      fontSize: '0.85rem',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <strong style={{ color: '#0f172a' }}>{item.product_name}</strong>
                      <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>
                        SKU: {item.product_code}
                      </span>
                    </div>
                    <div style={{ textAlign: 'center', fontWeight: 700, color: '#ef4444' }}>
                      {item.quantity}
                    </div>
                    <div style={{ textAlign: 'right', color: '#334155' }}>
                      ₹{parseFloat(item.unit_price || 0).toLocaleString()}
                    </div>
                    <div style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                      ₹{parseFloat(item.total_price || (item.quantity * item.unit_price) || 0).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Rejection Form Input (Toggleable when declining) */}
            {isRejectingFormOpen && (!selectedReturnForReview.status || selectedReturnForReview.status === 'PENDING_APPROVAL') && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '0.85rem', borderRadius: '8px', marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#991b1b', display: 'block', marginBottom: '0.35rem' }}>
                  Specify Reason for Declining Return *
                </label>
                <textarea
                  rows={2}
                  className="form-input"
                  placeholder="e.g. Defect not covered under warranty / Damage occurred post-delivery"
                  value={rejectionReasonInput}
                  onChange={(e) => setRejectionReasonInput(e.target.value)}
                  style={{ width: '100%', fontSize: '0.85rem' }}
                />
              </div>
            )}

            {/* Modal Actions Footer */}
            <div className="modal-footer" style={{ marginTop: '0.75rem' }}>
              <button
                type="button"
                onClick={() => {
                  setIsReviewReturnModalOpen(false);
                  setSelectedReturnForReview(null);
                  setIsRejectingFormOpen(false);
                }}
                className="btn btn-secondary"
              >
                Close
              </button>

              {(!selectedReturnForReview.status || selectedReturnForReview.status === 'PENDING_APPROVAL') && (
                <>
                  {!isRejectingFormOpen ? (
                    <button
                      type="button"
                      onClick={() => setIsRejectingFormOpen(true)}
                      className="btn btn-danger"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                    >
                      <XCircle size={14} /> Decline Return
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleRejectReturn(selectedReturnForReview.id)}
                      disabled={actionLoading}
                      className="btn btn-danger"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                    >
                      {actionLoading ? <RefreshCw size={14} className="spin" /> : <XCircle size={14} />} Confirm Decline
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleApproveReturn(selectedReturnForReview.id)}
                    disabled={actionLoading}
                    className="btn btn-success"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                  >
                    {actionLoading ? <RefreshCw size={14} className="spin" /> : <CheckCircle size={14} />} Accept & Deduct Stock
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Settle Purchase Payment Modal */}
      <Modal
        isOpen={isPayModalOpen}
        onClose={() => {
          setIsPayModalOpen(false);
          setPayTargetPO(null);
        }}
        title="Settle Purchase Payment"
        maxWidth="560px"
      >
        {payTargetPO && (
          <form onSubmit={handleSubmitPayment}>
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '0.85rem 1rem',
                marginBottom: '1.25rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '0.75rem'
              }}
            >
              <div>
                <span style={{ fontSize: '0.725rem', color: '#64748b', display: 'block' }}>
                  Purchase Order
                </span>
                <strong style={{ fontSize: '0.875rem', color: 'var(--primary)' }}>
                  {payTargetPO.po_number}
                </strong>
              </div>
              <div>
                <span style={{ fontSize: '0.725rem', color: '#64748b', display: 'block' }}>
                  Supplier / Vendor
                </span>
                <strong style={{ fontSize: '0.875rem', color: '#0f172a' }}>{payTargetPO.supplier_name}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.725rem', color: '#64748b', display: 'block' }}>
                  Receiving Warehouse
                </span>
                <span style={{ fontSize: '0.825rem', fontWeight: 600, color: '#334155' }}>
                  {payTargetPO.warehouse_name}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '0.725rem', color: '#64748b', display: 'block' }}>
                  Total Payable Due
                </span>
                <strong style={{ fontSize: '1rem', color: '#0f172a', fontFamily: 'monospace' }}>
                  ₹{parseFloat(payTargetPO.due_amount || payTargetPO.grand_total).toLocaleString('en-IN')}
                </strong>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Payment Method *</label>
                <CustomSelect
                  value={payForm.paymentMethod}
                  onChange={(e) => setPayForm({ ...payForm, paymentMethod: e.target.value })}
                  options={[
                    { value: 'BANK_TRANSFER', label: 'Bank Transfer (NEFT / RTGS)' },
                    { value: 'UPI', label: 'UPI / Direct Transfer' },
                    { value: 'CARD', label: 'Corporate Card' },
                    { value: 'CHEQUE', label: 'Company Cheque / DD' },
                    { value: 'CASH', label: 'Cash on Delivery' }
                  ]}
                />
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Amount to Pay (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  max={parseFloat(payTargetPO.due_amount || payTargetPO.grand_total)}
                  className="form-input"
                  value={payForm.amount}
                  onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">Transaction Reference / Cheque No *</label>
              <input
                type="text"
                className="form-input"
                value={payForm.transactionId}
                onChange={(e) => setPayForm({ ...payForm, transactionId: e.target.value })}
                placeholder="e.g. UTR-98231048 or CHQ-004921"
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">Notes / Remarks (Optional)</label>
              <input
                type="text"
                className="form-input"
                value={payForm.notes}
                onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })}
                placeholder="e.g. Cleared against supplier invoice"
              />
            </div>

            {payTargetPO.status !== 'APPROVED' && (
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#334155',
                  marginBottom: '1.25rem',
                  cursor: 'pointer'
                }}
              >
                <input
                  type="checkbox"
                  checked={payForm.autoApproveStock}
                  onChange={(e) => setPayForm({ ...payForm, autoApproveStock: e.target.checked })}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                />
                <span>Automatically intake & increase warehouse stock upon payment</span>
              </label>
            )}

            <div className="modal-footer">
              <button
                type="button"
                onClick={() => {
                  setIsPayModalOpen(false);
                  setPayTargetPO(null);
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Confirm Payment (₹{parseFloat(payForm.amount || 0).toLocaleString('en-IN')})
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => !deleteConfirm.loading && setDeleteConfirm((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirmDelete}
        title={deleteConfirm.title}
        message={deleteConfirm.message}
        itemName={deleteConfirm.itemName}
        confirmText="Delete"
        variant="danger"
        loading={deleteConfirm.loading}
      />

      {/* Enterprise GST Tax Invoice & Download Modal */}
      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => {
          setIsInvoiceModalOpen(false);
          setSelectedInvoicePO(null);
          setInvoicePaymentInfo(null);
          setIsPaymentSuccessModal(false);
        }}
        purchase={selectedInvoicePO}
        paymentInfo={invoicePaymentInfo}
        isPaymentSuccess={isPaymentSuccessModal}
        suppliers={suppliers}
        warehouses={warehouses}
        tenant={user}
      />
    </div>
  );
}
