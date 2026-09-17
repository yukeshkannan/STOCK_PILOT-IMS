import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import api from '../../services/api';
import Modal from '../../components/Modal';
import Badge from '../../components/Badge';
import PrintInvoiceModal from '../../components/PrintInvoiceModal';
import CustomSelect from '../../components/CustomSelect';
import {
  ShoppingBag,
  Plus,
  ArrowLeftRight,
  UserCheck,
  Search,
  Printer,
  PlusCircle,
  Trash2,
  AlertTriangle,
  UserPlus,
  Users,
  Footprints,
  CreditCard,
  Building2,
  Receipt,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ExternalLink,
  CheckCircle2,
  Package,
  RotateCcw,
  FileText,
  Eye
} from 'lucide-react';

export default function SalesPage() {
  const { user } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('sales'); // 'sales' | 'customers' | 'returns'
  const [customerSubTab, setCustomerSubTab] = useState('regular'); // 'regular' | 'walkin'

  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [returns, setReturns] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search queries
  const [salesSearch, setSalesSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [returnsSearch, setReturnsSearch] = useState('');

  // Modals & Action States
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);
  const [isDeletingSale, setIsDeletingSale] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [isDeletingCustomer, setIsDeletingCustomer] = useState(false);
  const [walkinToDelete, setWalkinToDelete] = useState(null);
  const [isDeletingWalkin, setIsDeletingWalkin] = useState(false);
  const [returnToDelete, setReturnToDelete] = useState(null);
  const [isDeletingReturn, setIsDeletingReturn] = useState(false);

  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isProcessingReturn, setIsProcessingReturn] = useState(false);
  const [selectedReturnDetail, setSelectedReturnDetail] = useState(null);
  const [isReturnDetailModalOpen, setIsReturnDetailModalOpen] = useState(false);

  // Customer Form State
  const [customerForm, setCustomerForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    gstin: '',
    creditLimit: 50000
  });

  // Professional Invoice-Lookup Return Form State
  const [returnInvoiceId, setReturnInvoiceId] = useState('');
  const [selectedSaleForReturn, setSelectedSaleForReturn] = useState(null);
  const [returnItemsState, setReturnItemsState] = useState([]); // [{ productId, productCode, productName, unitPrice, originalQty, returnQty, selected: boolean }]
  const [returnCondition, setReturnCondition] = useState('GOOD'); // 'GOOD' | 'DAMAGED'
  const [returnReason, setReturnReason] = useState('Customer requested return in original condition');
  const [returnNotes, setReturnNotes] = useState('');

  const userRole = (user?.roleName || user?.role || '').toUpperCase();
  const isSuperAdmin = Boolean(user?.isSuperAdmin) || userRole === 'SUPER_ADMIN';
  const isGlobalAdmin = isSuperAdmin || (userRole === 'ADMIN' && !user?.warehouseId);
  const isBranchScoped = Boolean(user?.warehouseId) && !isGlobalAdmin;

  const visibleSales = useMemo(() => {
    let list = sales;
    if (isBranchScoped && user?.warehouseId) {
      list = list.filter((s) => String(s.warehouse_id) === String(user.warehouseId));
    }
    if (salesSearch.trim()) {
      const q = salesSearch.toLowerCase();
      list = list.filter(
        (s) =>
          (s.invoice_number && s.invoice_number.toLowerCase().includes(q)) ||
          (s.customer_name && s.customer_name.toLowerCase().includes(q)) ||
          (s.customer_phone && s.customer_phone.includes(q)) ||
          (s.payment_method && s.payment_method.toLowerCase().includes(q))
      );
    }
    return list;
  }, [sales, isBranchScoped, user?.warehouseId, salesSearch]);

  const visibleReturns = useMemo(() => {
    let list = returns;
    if (returnsSearch.trim()) {
      const q = returnsSearch.toLowerCase();
      list = list.filter(
        (r) =>
          (r.return_number && r.return_number.toLowerCase().includes(q)) ||
          (r.customer_name && r.customer_name.toLowerCase().includes(q)) ||
          (r.sale?.invoice_number && r.sale.invoice_number.toLowerCase().includes(q)) ||
          (r.created_by && r.created_by.toLowerCase().includes(q)) ||
          (r.reason && r.reason.toLowerCase().includes(q)) ||
          (r.notes && r.notes.toLowerCase().includes(q)) ||
          (r.warehouse_name && r.warehouse_name.toLowerCase().includes(q))
      );
    }
    return list;
  }, [returns, returnsSearch]);

  // Aggregate Walk-in Customers from Sales records
  const walkInCustomers = useMemo(() => {
    const map = new Map();
    sales.forEach((s) => {
      const isRegistered = s.customer_id && customers.some((c) => c.id === s.customer_id);
      if (!isRegistered) {
        const phone = (s.customer_phone || '').trim();
        const rawName = (s.customer_name || '').trim();
        const name = rawName || 'Walk-in Customer';
        const key = phone ? `phone_${phone}` : `name_${name.toLowerCase()}`;

        if (!map.has(key)) {
          map.set(key, {
            key,
            name: name,
            phone: phone || '',
            billsCount: 0,
            totalSpent: 0,
            lastVisit: s.sale_date || s.created_at,
            lastInvoice: s.invoice_number,
            warehouseName: s.warehouse_name,
            invoices: []
          });
        }

        const entry = map.get(key);
        entry.billsCount += 1;
        entry.totalSpent += parseFloat(s.grand_total) || 0;
        entry.invoices.push(s);
        if (new Date(s.sale_date || s.created_at) > new Date(entry.lastVisit)) {
          entry.lastVisit = s.sale_date || s.created_at;
          entry.lastInvoice = s.invoice_number;
          if (name !== 'Walk-in Customer' && entry.name === 'Walk-in Customer') {
            entry.name = name;
          }
        }
      }
    });

    let list = Array.from(map.values()).sort(
      (a, b) => new Date(b.lastVisit) - new Date(a.lastVisit)
    );

    if (customerSearch.trim() && customerSubTab === 'walkin') {
      const q = customerSearch.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          (c.lastInvoice && c.lastInvoice.toLowerCase().includes(q))
      );
    }

    return list;
  }, [sales, customers, customerSearch, customerSubTab]);

  // Filtered Regular Customers
  const filteredRegularCustomers = useMemo(() => {
    let list = customers;
    if (customerSearch.trim() && customerSubTab === 'regular') {
      const q = customerSearch.toLowerCase();
      list = list.filter(
        (c) =>
          (c.name && c.name.toLowerCase().includes(q)) ||
          (c.phone && c.phone.includes(q)) ||
          (c.email && c.email.toLowerCase().includes(q)) ||
          (c.address && c.address.toLowerCase().includes(q))
      );
    }
    return list;
  }, [customers, customerSearch, customerSubTab]);

  // Statistics for Customer Page
  const customerStats = useMemo(() => {
    const totalWalkinRevenue = walkInCustomers.reduce((acc, c) => acc + c.totalSpent, 0);
    const totalCreditDue = customers.reduce(
      (acc, c) => acc + (parseFloat(c.current_balance) || 0),
      0
    );
    return {
      regularCount: customers.length,
      walkinCount: walkInCustomers.length,
      walkinRevenue: totalWalkinRevenue,
      creditDue: totalCreditDue
    };
  }, [customers, walkInCustomers]);

  // Live Calculated Total Refund in Modal
  const calculatedTotalRefund = useMemo(() => {
    return returnItemsState
      .filter((it) => it.selected && it.returnQty > 0)
      .reduce((acc, it) => acc + it.unitPrice * it.returnQty, 0);
  }, [returnItemsState]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [saleRes, custRes, retRes, whRes, prdRes] = await Promise.all([
        api.get('/sales'),
        api.get('/customers'),
        api.get('/sales-returns').catch(() => ({ data: [] })),
        api.get('/warehouses'),
        api.get('/products?limit=100')
      ]);

      setSales(saleRes?.data || []);
      setCustomers(custRes?.data || []);
      setReturns(retRes?.data || []);
      setWarehouses(whRes?.data || []);
      setProducts(prdRes?.data || []);
    } catch (err) {
      console.error('Error fetching sales data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    try {
      await api.post('/customers', {
        ...customerForm,
        creditLimit: parseFloat(customerForm.creditLimit) || 50000
      });
      toast.success('Customer registered successfully');
      setIsCustomerModalOpen(false);
      setCustomerForm({ name: '', phone: '', email: '', address: '', gstin: '', creditLimit: 50000 });
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to create customer');
    }
  };

  const handleQuickConvertWalkin = (walkin) => {
    setCustomerForm({
      name: walkin.name === 'Walk-in Customer' ? '' : walkin.name,
      phone: walkin.phone === '—' ? '' : walkin.phone,
      email: '',
      address: '',
      gstin: '',
      creditLimit: 50000
    });
    setIsCustomerModalOpen(true);
  };

  const handleDeleteSale = async () => {
    if (!invoiceToDelete) return;
    try {
      setIsDeletingSale(true);
      await api.delete(`/sales/${invoiceToDelete.id}`);
      toast.success(`Invoice #${invoiceToDelete.invoice_number} deleted & stock restored successfully!`);
      setInvoiceToDelete(null);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to delete sale invoice');
    } finally {
      setIsDeletingSale(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return;
    try {
      setIsDeletingCustomer(true);
      await api.delete(`/customers/${customerToDelete.id}`);
      toast.success(`Customer "${customerToDelete.name}" deleted successfully!`);
      setCustomerToDelete(null);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to delete customer');
    } finally {
      setIsDeletingCustomer(false);
    }
  };

  const handleDeleteWalkin = async () => {
    if (!walkinToDelete) return;
    try {
      setIsDeletingWalkin(true);
      const invs = walkinToDelete.invoices || [];
      for (const inv of invs) {
        await api.delete(`/sales/${inv.id}`);
      }
      toast.success(`Walk-in customer "${walkinToDelete.name}" records deleted and inventory restocked!`);
      setWalkinToDelete(null);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to delete walk-in customer records');
    } finally {
      setIsDeletingWalkin(false);
    }
  };

  const handleDeleteReturn = async () => {
    if (!returnToDelete) return;
    try {
      setIsDeletingReturn(true);
      await api.delete(`/sales-returns/${returnToDelete.id}`);
      toast.success(`Sales Return #${returnToDelete.return_number} deleted successfully!`);
      setReturnToDelete(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to delete sales return');
    } finally {
      setIsDeletingReturn(false);
    }
  };

  // Open Invoice-Lookup Return Modal
  const handleOpenReturnModal = (sale = null) => {
    if (sale) {
      setReturnInvoiceId(String(sale.id));
      setSelectedSaleForReturn(sale);
      const itemsList = (sale.items || []).map((item) => ({
        productId: item.product_id || item.productId,
        productCode: item.product_code || item.productCode || `PRD-${item.product_id}`,
        productName: item.product_name || item.productName || 'Product',
        unitPrice: parseFloat(item.unit_price || item.unitPrice) || 0,
        originalQty: parseInt(item.quantity, 10) || 1,
        returnQty: parseInt(item.quantity, 10) || 1,
        selected: true
      }));
      setReturnItemsState(itemsList);
    } else {
      setReturnInvoiceId('');
      setSelectedSaleForReturn(null);
      setReturnItemsState([]);
    }
    setReturnCondition('GOOD');
    setReturnReason('Customer requested return in original condition');
    setReturnNotes('');
    setIsReturnModalOpen(true);
  };

  const handleSelectInvoiceForReturn = (invoiceId) => {
    setReturnInvoiceId(invoiceId);
    if (!invoiceId) {
      setSelectedSaleForReturn(null);
      setReturnItemsState([]);
      return;
    }
    const sale = sales.find((s) => String(s.id) === String(invoiceId) || s.invoice_number === invoiceId);
    if (sale) {
      setSelectedSaleForReturn(sale);
      const itemsList = (sale.items || []).map((item) => ({
        productId: item.product_id || item.productId,
        productCode: item.product_code || item.productCode || `PRD-${item.product_id}`,
        productName: item.product_name || item.productName || 'Product',
        unitPrice: parseFloat(item.unit_price || item.unitPrice) || 0,
        originalQty: parseInt(item.quantity, 10) || 1,
        returnQty: parseInt(item.quantity, 10) || 1,
        selected: true
      }));
      setReturnItemsState(itemsList);
    }
  };

  const handleCreateReturn = async (e) => {
    e.preventDefault();
    if (!selectedSaleForReturn) {
      toast.warning('Please select an original sales invoice to process return');
      return;
    }

    const selectedItemsToReturn = returnItemsState.filter((it) => it.selected && it.returnQty > 0);
    if (selectedItemsToReturn.length === 0) {
      toast.warning('Please select at least one item and quantity to return');
      return;
    }

    try {
      setIsProcessingReturn(true);
      await api.post('/sales-returns', {
        saleId: selectedSaleForReturn.id,
        customerId: selectedSaleForReturn.customer_id || null,
        customerName: selectedSaleForReturn.customer_name || 'Customer',
        warehouseId: selectedSaleForReturn.warehouse_id || warehouses[0]?.id || 1,
        warehouseName: selectedSaleForReturn.warehouse_name || 'Main Warehouse',
        condition: returnCondition,
        reason: returnReason + (returnNotes ? ` (${returnNotes})` : ''),
        items: selectedItemsToReturn.map((it) => ({
          productId: it.productId,
          productCode: it.productCode,
          productName: it.productName,
          quantity: it.returnQty,
          unitPrice: it.unitPrice
        }))
      });

      toast.success(`Sales return processed & stock (${returnCondition === 'GOOD' ? 'Restocked' : 'Marked Damaged'}) updated!`);
      setIsReturnModalOpen(false);
      setSelectedSaleForReturn(null);
      setReturnInvoiceId('');
      setReturnItemsState([]);
      setActiveTab('returns');
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to process sales return');
    } finally {
      setIsProcessingReturn(false);
    }
  };

  return (
    <div>
      {/* Top Header */}
      <div className="page-header" style={{ marginBottom: '1.25rem' }}>
        <div>
          <h1 className="page-title" style={{ fontSize: '1.4rem', fontWeight: 800 }}>Sales & POS Invoicing</h1>
          <p className="page-subtitle" style={{ fontSize: '0.85rem' }}>
            Generate GST tax invoices, manage regular & walk-in customers, and process smart sales returns
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="segmented-control">
            <button
              onClick={() => setActiveTab('sales')}
              className={`segmented-tab ${activeTab === 'sales' ? 'active' : ''}`}
            >
              <ShoppingBag size={15} /> Sales Invoices ({sales.length})
            </button>
            <button
              onClick={() => setActiveTab('customers')}
              className={`segmented-tab ${activeTab === 'customers' ? 'active' : ''}`}
            >
              <Users size={15} /> Customers ({customers.length + walkInCustomers.length})
            </button>
            <button
              onClick={() => setActiveTab('returns')}
              className={`segmented-tab ${activeTab === 'returns' ? 'active' : ''}`}
            >
              <ArrowLeftRight size={15} /> Sales Returns ({returns.length})
            </button>
          </div>

          <Link to="/sales/new" className="btn btn-primary btn-sm" style={{ boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)' }}>
            <PlusCircle size={14} /> POS / New Sale
          </Link>
        </div>
      </div>

      {/* TAB 1: SALES INVOICES */}
      {activeTab === 'sales' && (
        <div>
          {/* Sales Search Bar & Stats */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
              <Search size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '2.35rem', height: '38px', fontSize: '0.84rem' }}
                placeholder="Search by invoice #, customer, phone..."
                value={salesSearch}
                onChange={(e) => setSalesSearch(e.target.value)}
              />
            </div>
            <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
              Showing <strong>{visibleSales.length}</strong> of {sales.length} invoices
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
            <div className="table-container" style={{ border: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th>Invoice #</th>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Warehouse</th>
                    <th>Grand Total</th>
                    <th>Paid</th>
                    <th>Payment Method</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleSales.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8', fontSize: '0.88rem' }}>
                        <Receipt size={36} style={{ margin: '0 auto 0.5rem auto', opacity: 0.4, display: 'block' }} />
                        No sales invoices match your search. Click "POS / New Sale" to bill a customer!
                      </td>
                    </tr>
                  ) : (
                    visibleSales.map((s) => (
                      <tr key={s.id}>
                        <td style={{ fontWeight: 700, color: '#7c3aed', fontFamily: 'monospace', fontSize: '0.86rem' }}>
                          {s.invoice_number}
                        </td>
                        <td style={{ fontSize: '0.78rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                          {new Date(s.sale_date || s.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>{s.customer_name}</div>
                          {s.customer_phone && (
                            <div style={{ fontSize: '0.73rem', color: '#64748b' }}>{s.customer_phone}</div>
                          )}
                        </td>
                        <td style={{ color: '#475569', fontSize: '0.82rem' }}>{s.warehouse_name}</td>
                        <td style={{ fontWeight: 700, color: '#0f172a' }}>
                          ₹{parseFloat(s.grand_total).toLocaleString('en-IN')}
                        </td>
                        <td style={{ color: '#16a34a', fontWeight: 600 }}>
                          ₹{parseFloat(s.paid_amount || 0).toLocaleString('en-IN')}
                        </td>
                        <td>
                          <span
                            style={{
                              fontSize: '0.73rem',
                              fontWeight: 700,
                              color: '#7c3aed',
                              background: '#f5f3ff',
                              border: '1px solid #ede9fe',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '6px'
                            }}
                          >
                            {s.payment_method}
                          </span>
                        </td>
                        <td>
                          <Badge status={s.payment_status} />
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '0.35rem', alignItems: 'center' }}>
                            <button
                              onClick={() => setSelectedInvoice(s)}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                              title="Print / View Invoice"
                            >
                              <Printer size={13} /> Print
                            </button>
                            <button
                              onClick={() => handleOpenReturnModal(s)}
                              className="btn btn-secondary btn-sm"
                              style={{
                                padding: '0.3rem 0.55rem',
                                fontSize: '0.75rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                color: '#0284c7',
                                background: '#f0f9ff',
                                borderColor: '#bae6fd'
                              }}
                              title="Process Sales Return for this Invoice"
                            >
                              <ArrowLeftRight size={13} /> Return
                            </button>
                            <button
                              onClick={() => setInvoiceToDelete(s)}
                              className="btn btn-sm"
                              style={{
                                padding: '0.3rem 0.55rem',
                                fontSize: '0.75rem',
                                color: '#dc2626',
                                background: '#fef2f2',
                                border: '1px solid #fee2e2',
                                borderRadius: '6px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                cursor: 'pointer'
                              }}
                              title="Delete Invoice & Restock Inventory"
                            >
                              <Trash2 size={13} /> Delete
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
        </div>
      )}

      {/* TAB 2: CUSTOMERS (SPLIT INTO REGULAR & WALK-IN) */}
      {activeTab === 'customers' && (
        <div>
          {/* Customer KPI Metric Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem',
              marginBottom: '1.25rem'
            }}
          >
            <div
              className="card"
              style={{
                padding: '1rem 1.25rem',
                border: '1px solid #e0e7ff',
                background: 'linear-gradient(135deg, #ffffff 0%, #f5f3ff 100%)',
                borderRadius: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ padding: '0.6rem', borderRadius: '10px', background: '#ede9fe', color: '#7c3aed' }}>
                  <Building2 size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                    Regular / Registered
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>
                    {customerStats.regularCount}
                  </div>
                </div>
              </div>
            </div>

            <div
              className="card"
              style={{
                padding: '1rem 1.25rem',
                border: '1px solid #e2e8f0',
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                borderRadius: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ padding: '0.6rem', borderRadius: '10px', background: '#e0f2fe', color: '#0284c7' }}>
                  <Footprints size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                    Walk-in Customers
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>
                    {customerStats.walkinCount}
                  </div>
                </div>
              </div>
            </div>

            <div
              className="card"
              style={{
                padding: '1rem 1.25rem',
                border: '1px solid #e2e8f0',
                background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)',
                borderRadius: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ padding: '0.6rem', borderRadius: '10px', background: '#dcfce7', color: '#16a34a' }}>
                  <ShoppingBag size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                    Walk-in Revenue
                  </div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#16a34a' }}>
                    ₹{customerStats.walkinRevenue.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </div>

            <div
              className="card"
              style={{
                padding: '1rem 1.25rem',
                border: '1px solid #fee2e2',
                background: 'linear-gradient(135deg, #ffffff 0%, #fef2f2 100%)',
                borderRadius: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ padding: '0.6rem', borderRadius: '10px', background: '#fee2e2', color: '#dc2626' }}>
                  <CreditCard size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                    Outstanding EMI Dues
                  </div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#dc2626' }}>
                    ₹{customerStats.creditDue.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sub-Tabs Selector & Search/Action Controls */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
              gap: '0.75rem',
              flexWrap: 'wrap'
            }}
          >
            <div style={{ display: 'flex', gap: '0.5rem', background: '#f1f5f9', padding: '0.25rem', borderRadius: '10px' }}>
              <button
                type="button"
                onClick={() => setCustomerSubTab('regular')}
                style={{
                  padding: '0.45rem 0.9rem',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  background: customerSubTab === 'regular' ? '#ffffff' : 'transparent',
                  color: customerSubTab === 'regular' ? '#7c3aed' : '#64748b',
                  boxShadow: customerSubTab === 'regular' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  transition: 'all 0.15s ease'
                }}
              >
                <Building2 size={14} /> Regular / Registered ({customers.length})
              </button>
              <button
                type="button"
                onClick={() => setCustomerSubTab('walkin')}
                style={{
                  padding: '0.45rem 0.9rem',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  background: customerSubTab === 'walkin' ? '#ffffff' : 'transparent',
                  color: customerSubTab === 'walkin' ? '#0284c7' : '#64748b',
                  boxShadow: customerSubTab === 'walkin' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  transition: 'all 0.15s ease'
                }}
              >
                <Footprints size={14} /> Walk-in Customers ({walkInCustomers.length})
              </button>
            </div>

            <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', width: '260px' }}>
                <Search size={14} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '2.2rem', height: '36px', fontSize: '0.82rem' }}
                  placeholder={`Search ${customerSubTab === 'regular' ? 'regular' : 'walk-in'} customers...`}
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                />
              </div>

              {customerSubTab === 'regular' && (
                <button onClick={() => setIsCustomerModalOpen(true)} className="btn btn-primary btn-sm" style={{ height: '36px' }}>
                  <UserPlus size={14} /> Add Regular Customer
                </button>
              )}
            </div>
          </div>

          {/* SUBTAB CONTENT: REGULAR CUSTOMERS */}
          {customerSubTab === 'regular' && (
            <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
              <div className="table-container" style={{ border: 'none' }}>
                <table className="data-table">
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      <th>Customer / Business</th>
                      <th>Mobile Number</th>
                      <th>Email Address</th>
                      <th>Outstanding Balance</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRegularCustomers.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
                          <Users size={36} style={{ margin: '0 auto 0.5rem auto', opacity: 0.4, display: 'block' }} />
                          No registered regular customers found. Click "Add Regular Customer" to register one!
                        </td>
                      </tr>
                    ) : (
                      filteredRegularCustomers.map((c) => (
                        <tr key={c.id}>
                          <td>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>{c.name}</div>
                            {c.gstin && <div style={{ fontSize: '0.72rem', color: '#64748b' }}>GSTIN: {c.gstin}</div>}
                          </td>
                          <td style={{ fontSize: '0.84rem', fontWeight: 600, color: '#0369a1' }}>
                            {c.phone ? `+91 ${c.phone.replace(/\D/g, '').slice(-10)}` : '—'}
                          </td>
                          <td style={{ fontSize: '0.84rem', color: '#64748b' }}>{c.email || '—'}</td>
                          <td>
                            <span
                              style={{
                                fontWeight: 700,
                                color: parseFloat(c.current_balance) > 0 ? '#dc2626' : '#16a34a'
                              }}
                            >
                              ₹{parseFloat(c.current_balance || 0).toLocaleString('en-IN')}
                            </span>
                          </td>
                          <td>
                            <Badge status={c.status} />
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              onClick={() => setCustomerToDelete(c)}
                              className="btn btn-sm"
                              style={{
                                padding: '0.25rem 0.5rem',
                                fontSize: '0.75rem',
                                color: '#dc2626',
                                background: '#fef2f2',
                                border: '1px solid #fee2e2',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                              }}
                              title="Delete Customer"
                            >
                              <Trash2 size={13} /> Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SUBTAB CONTENT: WALK-IN CUSTOMERS */}
          {customerSubTab === 'walkin' && (
            <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
              <div className="table-container" style={{ border: 'none' }}>
                <table className="data-table">
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      <th>Walk-in Customer Name</th>
                      <th>Mobile Number</th>
                      <th>Total Visits / Bills</th>
                      <th>Total Amount Spent</th>
                      <th>Last Purchase Date</th>
                      <th>Last Invoice</th>
                      <th style={{ textAlign: 'right' }}>Quick Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {walkInCustomers.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
                          <Footprints size={36} style={{ margin: '0 auto 0.5rem auto', opacity: 0.4, display: 'block' }} />
                          No walk-in customer records found in sales history.
                        </td>
                      </tr>
                    ) : (
                      walkInCustomers.map((w) => (
                        <tr key={w.key}>
                          <td style={{ fontWeight: 700, color: '#0f172a' }}>
                            {w.name}
                          </td>
                          <td>
                            {w.phone && w.phone !== '—' ? (
                              <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#0369a1' }}>
                                +91 {w.phone.replace(/\D/g, '').slice(-10)}
                              </span>
                            ) : (
                              <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.8rem' }}>Unspecified</span>
                            )}
                          </td>
                          <td>
                            <span
                              style={{
                                background: '#e0f2fe',
                                color: '#0369a1',
                                fontWeight: 700,
                                fontSize: '0.78rem',
                                padding: '0.2rem 0.55rem',
                                borderRadius: '12px'
                              }}
                            >
                              {w.billsCount} bill{w.billsCount > 1 ? 's' : ''}
                            </span>
                          </td>
                          <td style={{ fontWeight: 700, color: '#16a34a' }}>
                            ₹{w.totalSpent.toLocaleString('en-IN')}
                          </td>
                          <td style={{ fontSize: '0.78rem', color: '#64748b' }}>
                            {new Date(w.lastVisit).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td>
                            <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#7c3aed', fontWeight: 600 }}>
                              {w.lastInvoice}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '0.35rem', alignItems: 'center' }}>
                              <button
                                onClick={() => handleQuickConvertWalkin(w)}
                                className="btn btn-secondary btn-sm"
                                style={{
                                  padding: '0.25rem 0.55rem',
                                  fontSize: '0.75rem',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.3rem',
                                  color: '#7c3aed',
                                  borderColor: '#ddd6fe',
                                  background: '#f5f3ff'
                                }}
                                title="Register as Regular Customer"
                              >
                                <UserPlus size={13} /> Register as Regular
                              </button>
                              <button
                                onClick={() => setWalkinToDelete(w)}
                                className="btn btn-sm"
                                style={{
                                  padding: '0.25rem 0.5rem',
                                  fontSize: '0.75rem',
                                  color: '#dc2626',
                                  background: '#fef2f2',
                                  border: '1px solid #fee2e2',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.25rem'
                                }}
                                title="Delete Walk-in Customer Records"
                              >
                                <Trash2 size={13} /> Delete
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
          )}
        </div>
      )}

      {/* TAB 3: SALES RETURNS */}
      {activeTab === 'returns' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
              <Search size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '2.35rem', height: '38px', fontSize: '0.84rem' }}
                placeholder="Search returns by return #, customer, reason..."
                value={returnsSearch}
                onChange={(e) => setReturnsSearch(e.target.value)}
              />
            </div>
            <button
              onClick={() => handleOpenReturnModal()}
              className="btn btn-primary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)' }}
            >
              <RotateCcw size={14} /> Process Invoice Return
            </button>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
            <div className="table-container" style={{ border: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th>Return #</th>
                    <th>Original Invoice</th>
                    <th>Customer Name & Phone</th>
                    <th>Processed By</th>
                    <th>Warehouse Outlet</th>
                    <th>Condition / Stock Impact</th>
                    <th>Return Reason</th>
                    <th>Refund Total</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleReturns.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#94a3b8' }}>
                        <ArrowLeftRight size={38} style={{ margin: '0 auto 0.65rem auto', opacity: 0.4, display: 'block' }} />
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#64748b' }}>No customer returns recorded yet</div>
                        <div style={{ fontSize: '0.8rem', marginTop: '3px' }}>Click "Process Invoice Return" to refund or exchange customer items</div>
                      </td>
                    </tr>
                  ) : (
                    visibleReturns.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <div style={{ fontWeight: 700, color: '#7c3aed', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                            {r.return_number}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '1px' }}>
                            {new Date(r.created_at || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </div>
                        </td>
                        <td>
                          {r.sale?.invoice_number ? (
                            <span
                              style={{
                                fontFamily: 'monospace',
                                fontSize: '0.78rem',
                                color: '#0369a1',
                                background: '#f0f9ff',
                                border: '1px solid #bae6fd',
                                padding: '0.2rem 0.45rem',
                                borderRadius: '4px',
                                fontWeight: 700
                              }}
                            >
                              {r.sale.invoice_number}
                            </span>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontStyle: 'italic' }}>Direct / Manual</span>
                          )}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>{r.customer_name}</div>
                          {r.sale?.customer_phone ? (
                            <div style={{ fontSize: '0.73rem', color: '#64748b' }}>
                              +91 {r.sale.customer_phone.replace(/\D/g, '').slice(-10)}
                            </div>
                          ) : null}
                        </td>
                        <td>
                          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>
                            {r.created_by || 'Cashier'}
                          </div>
                        </td>
                        <td style={{ color: '#475569', fontSize: '0.82rem' }}>{r.warehouse_name}</td>
                        <td>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              padding: '0.2rem 0.55rem',
                              borderRadius: '6px',
                              background: r.condition === 'GOOD' ? '#dcfce7' : '#fee2e2',
                              color: r.condition === 'GOOD' ? '#166534' : '#991b1b',
                              border: r.condition === 'GOOD' ? '1px solid #bbf7d0' : '1px solid #fecaca',
                              display: 'inline-block',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {r.condition === 'GOOD' ? 'Good (Restocked)' : 'Damaged (Quarantined)'}
                          </span>
                        </td>
                        <td style={{ maxWidth: '220px' }}>
                          <div style={{ fontSize: '0.82rem', color: '#0f172a', fontWeight: 600, lineHeight: 1.3 }}>
                            {r.reason}
                          </div>
                          {r.notes && (
                            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px', fontStyle: 'italic' }}>
                              Note: {r.notes}
                            </div>
                          )}
                        </td>
                        <td style={{ fontWeight: 800, color: '#16a34a', fontSize: '0.9rem' }}>
                          ₹{parseFloat(r.total_refund).toLocaleString('en-IN')}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedReturnDetail(r);
                                setIsReturnDetailModalOpen(true);
                              }}
                              className="btn btn-secondary btn-sm"
                              style={{
                                width: '32px',
                                height: '32px',
                                padding: 0,
                                borderRadius: '8px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--primary)',
                                background: 'var(--primary-light)',
                                border: '1px solid #ddd6fe',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                              title="View Return Audit & Item Details"
                            >
                              <Eye size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setReturnToDelete(r)}
                              className="btn btn-sm"
                              style={{
                                width: '32px',
                                height: '32px',
                                padding: 0,
                                borderRadius: '8px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#dc2626',
                                background: '#fef2f2',
                                border: '1px solid #fee2e2',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                              title="Delete Sales Return"
                            >
                              <Trash2 size={14} />
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
        </div>
      )}

      {/* SALES RETURN AUDIT & ITEM BREAKDOWN MODAL */}
      <Modal
        isOpen={isReturnDetailModalOpen}
        onClose={() => {
          setIsReturnDetailModalOpen(false);
          setSelectedReturnDetail(null);
        }}
        title={`Sales Return Audit Details (${selectedReturnDetail?.return_number || ''})`}
        maxWidth="720px"
      >
        {selectedReturnDetail && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Header Status & Refund Banner */}
            <div
              style={{
                background: selectedReturnDetail.condition === 'GOOD' 
                  ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' 
                  : 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                border: `1px solid ${selectedReturnDetail.condition === 'GOOD' ? '#bbf7d0' : '#fecaca'}`,
                borderRadius: '12px',
                padding: '1rem 1.25rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    color: selectedReturnDetail.condition === 'GOOD' ? '#15803d' : '#b91c1c',
                    display: 'block',
                    marginBottom: '2px'
                  }}
                >
                  Inventory Stock Action
                </span>
                <div
                  style={{
                    fontSize: '0.925rem',
                    fontWeight: 800,
                    color: selectedReturnDetail.condition === 'GOOD' ? '#14532d' : '#7f1d1d'
                  }}
                >
                  {selectedReturnDetail.condition === 'GOOD'
                    ? 'Marked Good — Automatically Restocked into Warehouse Inventory'
                    : 'Marked Damaged — Quarantined (Not added to Saleable Stock)'}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', display: 'block' }}>
                  Total Refund Paid
                </span>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#16a34a', letterSpacing: '-0.5px' }}>
                  ₹{parseFloat(selectedReturnDetail.total_refund || 0).toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* Audit Metadata 3-Column Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '0.75rem'
              }}
            >
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '0.75rem 0.9rem'
                }}
              >
                <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Customer</div>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a', marginTop: '2px' }}>
                  {selectedReturnDetail.customer_name}
                </div>
                {selectedReturnDetail.sale?.customer_phone && (
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace', marginTop: '1px' }}>
                    +91 {selectedReturnDetail.sale.customer_phone.replace(/\D/g, '').slice(-10)}
                  </div>
                )}
              </div>

              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '0.75rem 0.9rem'
                }}
              >
                <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Original Invoice #</div>
                <div style={{ marginTop: '2px' }}>
                  <span
                    style={{
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      color: 'var(--primary)',
                      background: 'var(--primary-light)',
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}
                  >
                    {selectedReturnDetail.sale?.invoice_number || 'Direct Return'}
                  </span>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '3px' }}>
                  Processed by: <strong>{selectedReturnDetail.created_by || 'Admin'}</strong>
                </div>
              </div>

              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '0.75rem 0.9rem'
                }}
              >
                <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Store & Date</div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#334155', marginTop: '2px' }}>
                  {selectedReturnDetail.warehouse_name}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '1px' }}>
                  {new Date(selectedReturnDetail.created_at || Date.now()).toLocaleString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>

            {/* Return Reason Callout */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderLeft: '4px solid var(--primary)',
                borderRadius: '8px',
                padding: '0.75rem 1rem'
              }}
            >
              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Reason for Return:
              </div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a', marginTop: '2px' }}>
                {selectedReturnDetail.reason}
              </div>
              {selectedReturnDetail.notes && (
                <div style={{ fontSize: '0.76rem', color: '#475569', marginTop: '3px', fontStyle: 'italic' }}>
                  Notes: {selectedReturnDetail.notes}
                </div>
              )}
            </div>

            {/* Returned Product Items Table */}
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
                Returned Items Breakdown:
              </div>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                <table className="data-table" style={{ margin: 0, width: '100%' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      <th style={{ fontSize: '0.72rem', textTransform: 'uppercase' }}>SKU Code</th>
                      <th style={{ fontSize: '0.72rem', textTransform: 'uppercase' }}>Product Name</th>
                      <th style={{ fontSize: '0.72rem', textTransform: 'uppercase', textAlign: 'center' }}>Quantity</th>
                      <th style={{ fontSize: '0.72rem', textTransform: 'uppercase', textAlign: 'right' }}>Unit Price</th>
                      <th style={{ fontSize: '0.72rem', textTransform: 'uppercase', textAlign: 'right' }}>Refund Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedReturnDetail.items || []).map((it, idx) => (
                      <tr key={idx}>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
                          {it.product_code}
                        </td>
                        <td style={{ fontWeight: 700, color: '#0f172a' }}>{it.product_name}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span
                            style={{
                              background: 'var(--primary-light)',
                              color: 'var(--primary)',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '0.75rem'
                            }}
                          >
                            {it.quantity} units
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', color: '#475569', fontSize: '0.82rem' }}>
                          ₹{parseFloat(it.unit_price).toLocaleString('en-IN')}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: '#16a34a' }}>
                          ₹{parseFloat(it.total_price).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="modal-footer" style={{ marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
              <button
                type="button"
                onClick={() => window.print()}
                className="btn btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Printer size={14} /> Print Return Credit Slip
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsReturnDetailModalOpen(false);
                  setSelectedReturnDetail(null);
                }}
                className="btn btn-primary"
                style={{
                  background: 'var(--primary)',
                  color: '#ffffff',
                  fontWeight: 700,
                  minWidth: '90px'
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Customer Create Modal */}
      <Modal isOpen={isCustomerModalOpen} onClose={() => setIsCustomerModalOpen(false)} title="Register Customer">
        <form onSubmit={handleCreateCustomer}>
          <div className="form-group">
            <label className="form-label">Customer / Business Name *</label>
            <input
              type="text"
              className="form-input"
              value={customerForm.name}
              onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
              placeholder="e.g. Ramesh Kumar or Surya Enterprises"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Phone Number *</label>
              <input
                type="tel"
                className="form-input"
                value={customerForm.phone}
                onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                placeholder="10-digit mobile number"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                value={customerForm.email}
                onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                placeholder="customer@example.com"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Address</label>
              <input
                type="text"
                className="form-input"
                value={customerForm.address}
                onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                placeholder="City, Area"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Credit Limit (₹)</label>
              <input
                type="number"
                className="form-input"
                value={customerForm.creditLimit}
                onChange={(e) => setCustomerForm({ ...customerForm, creditLimit: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">GSTIN (Optional)</label>
            <input
              type="text"
              className="form-input"
              value={customerForm.gstin}
              onChange={(e) => setCustomerForm({ ...customerForm, gstin: e.target.value })}
              placeholder="e.g. 33AAAAA0000A1Z5"
            />
          </div>

          <div className="modal-footer" style={{ marginTop: '1.5rem' }}>
            <button type="button" onClick={() => setIsCustomerModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save & Register Customer
            </button>
          </div>
        </form>
      </Modal>

      {/* Professional Invoice-Lookup Sales Return Modal */}
      <Modal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        title="Process Invoice Sales Return"
      >
        <form onSubmit={handleCreateReturn}>
          {/* Step 1: Select Invoice */}
          <div className="form-group" style={{ marginBottom: '1.15rem' }}>
            <label className="form-label" style={{ fontWeight: 700, color: '#0f172a' }}>
              Select Original Sales Invoice *
            </label>
            <CustomSelect
              value={returnInvoiceId}
              onChange={(e) => handleSelectInvoiceForReturn(e.target.value)}
              placeholder="Search or Select Invoice #..."
              options={[
                { value: '', label: 'Select Invoice #' },
                ...sales.map((s) => ({
                  value: String(s.id),
                  label: `${s.invoice_number} • ${s.customer_name} • ₹${parseFloat(s.grand_total).toLocaleString('en-IN')} (${new Date(s.sale_date || s.created_at).toLocaleDateString()})`
                }))
              ]}
            />
          </div>

          {/* Step 2: Invoice Context Card */}
          {selectedSaleForReturn && (
            <div
              style={{
                background: 'linear-gradient(135deg, #f8fafc 0%, #f5f3ff 100%)',
                border: '1px solid #ede9fe',
                borderRadius: '10px',
                padding: '0.85rem 1rem',
                marginBottom: '1.25rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '0.75rem',
                fontSize: '0.82rem'
              }}
            >
              <div>
                <span style={{ color: '#64748b', fontSize: '0.72rem', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Invoice #</span>
                <span style={{ fontWeight: 700, color: '#7c3aed', fontFamily: 'monospace' }}>{selectedSaleForReturn.invoice_number}</span>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.72rem', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Customer</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{selectedSaleForReturn.customer_name}</span>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.72rem', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Billed Date</span>
                <span style={{ fontWeight: 600, color: '#334155' }}>
                  {new Date(selectedSaleForReturn.sale_date || selectedSaleForReturn.created_at).toLocaleDateString('en-IN')}
                </span>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.72rem', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Warehouse Outlet</span>
                <span style={{ fontWeight: 600, color: '#334155' }}>{selectedSaleForReturn.warehouse_name}</span>
              </div>
            </div>
          )}

          {/* Step 3: Interactive Line Items Selection */}
          {selectedSaleForReturn && (
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label className="form-label" style={{ fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  Select Items & Return Quantity *
                </label>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Check item to return and adjust quantity
                </span>
              </div>

              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', background: '#ffffff' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', textAlign: 'left' }}>
                      <th style={{ padding: '0.6rem 0.75rem', width: '36px' }}>#</th>
                      <th style={{ padding: '0.6rem 0.75rem' }}>Product</th>
                      <th style={{ padding: '0.6rem 0.75rem' }}>Unit Price</th>
                      <th style={{ padding: '0.6rem 0.75rem', textAlign: 'center' }}>Billed Qty</th>
                      <th style={{ padding: '0.6rem 0.75rem', textAlign: 'center', width: '100px' }}>Return Qty</th>
                      <th style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>Refund Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {returnItemsState.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', background: item.selected ? '#faf5ff' : 'transparent' }}>
                        <td style={{ padding: '0.6rem 0.75rem' }}>
                          <input
                            type="checkbox"
                            checked={item.selected}
                            onChange={(e) => {
                              const updated = [...returnItemsState];
                              updated[idx].selected = e.target.checked;
                              setReturnItemsState(updated);
                            }}
                            style={{ cursor: 'pointer' }}
                          />
                        </td>
                        <td style={{ padding: '0.6rem 0.75rem' }}>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{item.productName}</div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'monospace' }}>{item.productCode}</div>
                        </td>
                        <td style={{ padding: '0.6rem 0.75rem', fontWeight: 600, color: '#334155' }}>
                          ₹{item.unitPrice.toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '0.6rem 0.75rem', textAlign: 'center', fontWeight: 600, color: '#64748b' }}>
                          {item.originalQty}
                        </td>
                        <td style={{ padding: '0.6rem 0.75rem', textAlign: 'center' }}>
                          <input
                            type="number"
                            min="1"
                            max={item.originalQty}
                            disabled={!item.selected}
                            value={item.returnQty}
                            onChange={(e) => {
                              const val = Math.max(1, Math.min(item.originalQty, parseInt(e.target.value, 10) || 1));
                              const updated = [...returnItemsState];
                              updated[idx].returnQty = val;
                              setReturnItemsState(updated);
                            }}
                            style={{
                              width: '65px',
                              padding: '0.25rem 0.45rem',
                              border: '1.5px solid #cbd5e1',
                              borderRadius: '6px',
                              textAlign: 'center',
                              fontWeight: 700,
                              fontSize: '0.82rem',
                              background: item.selected ? '#ffffff' : '#f1f5f9'
                            }}
                          />
                        </td>
                        <td style={{ padding: '0.6rem 0.75rem', textAlign: 'right', fontWeight: 700, color: item.selected ? '#7c3aed' : '#94a3b8' }}>
                          {item.selected ? `₹${(item.unitPrice * item.returnQty).toLocaleString('en-IN')}` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Step 4: Condition & Return Reason */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700 }}>Item Condition & Stock Action *</label>
              <CustomSelect
                value={returnCondition}
                onChange={(e) => setReturnCondition(e.target.value)}
                options={[
                  { value: 'GOOD', label: 'GOOD (Restock to Available Sellable Stock)' },
                  { value: 'DAMAGED', label: 'DAMAGED (Quarantine / Write-off Defective)' }
                ]}
              />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700 }}>Return Reason *</label>
              <CustomSelect
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                options={[
                  { value: 'Customer requested return in original condition', label: 'Customer Changed Mind / Original Condition' },
                  { value: 'Defective or damaged product', label: 'Defective or Faulty Item' },
                  { value: 'Incorrect size, variant or color', label: 'Incorrect Size / Variant' },
                  { value: 'Product not matching expectation', label: 'Product Mismatch' },
                  { value: 'Other reason', label: 'Other Reason (See Notes)' }
                ]}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label">Additional Return Notes</label>
            <input
              type="text"
              className="form-input"
              value={returnNotes}
              onChange={(e) => setReturnNotes(e.target.value)}
              placeholder="e.g. Unopened package, customer received UPI refund"
            />
          </div>

          {/* Step 5: Live Calculated Refund Summary Banner */}
          {selectedSaleForReturn && (
            <div
              style={{
                background: '#f0fdf4',
                border: '1.5px solid #bbf7d0',
                borderRadius: '10px',
                padding: '0.85rem 1.15rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.25rem'
              }}
            >
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>
                  Total Refund Value
                </div>
                <div style={{ fontSize: '0.75rem', color: '#15803d' }}>
                  {returnItemsState.filter((it) => it.selected && it.returnQty > 0).length} item(s) selected
                </div>
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#16a34a' }}>
                ₹{calculatedTotalRefund.toLocaleString('en-IN')}
              </div>
            </div>
          )}

          <div className="modal-footer">
            <button
              type="button"
              onClick={() => setIsReturnModalOpen(false)}
              className="btn btn-secondary"
              disabled={isProcessingReturn}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isProcessingReturn || !selectedSaleForReturn || calculatedTotalRefund <= 0}
              style={{
                background: 'var(--primary)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                opacity: (!selectedSaleForReturn || calculatedTotalRefund <= 0 || isProcessingReturn) ? 0.65 : 1,
                cursor: (!selectedSaleForReturn || calculatedTotalRefund <= 0 || isProcessingReturn) ? 'not-allowed' : 'pointer',
                boxShadow: (selectedSaleForReturn && calculatedTotalRefund > 0) ? '0 4px 14px var(--primary-glow)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              {isProcessingReturn ? 'Processing Return...' : `Confirm & Process Return (₹${calculatedTotalRefund.toLocaleString('en-IN')})`}
            </button>
          </div>
        </form>
      </Modal>

      {/* Invoice Modal */}
      {selectedInvoice && (
        <PrintInvoiceModal
          isOpen={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          sale={selectedInvoice}
          tenant={user}
        />
      )}

      {/* Delete Invoice Confirmation Modal */}
      {invoiceToDelete && (
        <Modal
          isOpen={!!invoiceToDelete}
          onClose={() => setInvoiceToDelete(null)}
          title="Delete Invoice Confirmation"
        >
          <div style={{ padding: '0.25rem 0' }}>
            {/* Header Icon + Title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '1.25rem' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 2px 8px rgba(220, 38, 38, 0.15)'
              }}>
                <Trash2 size={22} strokeWidth={2.2} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.01em' }}>
                  Are you sure you want to delete this invoice?
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: '0.825rem', color: '#64748b' }}>
                  This action cannot be undone. Please confirm the details below.
                </p>
              </div>
            </div>

            {/* Summary Card */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '0.9rem 1.1rem',
              marginBottom: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed #e2e8f0', paddingBottom: '0.55rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={14} color="#94a3b8" /> Invoice #
                </span>
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', fontFamily: 'monospace', letterSpacing: '0.02em' }}>
                  {invoiceToDelete.invoice_number}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed #e2e8f0', paddingBottom: '0.55rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={14} color="#94a3b8" /> Customer
                </span>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#334155' }}>
                  {invoiceToDelete.customer_name || 'Walk-in Customer'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Receipt size={14} color="#94a3b8" /> Total Amount
                </span>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                  ₹{parseFloat(invoiceToDelete.grand_total || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Restock Warning Banner */}
            <div style={{
              background: '#fff7ed',
              border: '1px solid #fed7aa',
              borderRadius: '8px',
              padding: '0.75rem 0.9rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.65rem'
            }}>
              <RotateCcw size={16} color="#ea580c" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '0.775rem', color: '#9a3412', lineHeight: 1.45 }}>
                <strong style={{ color: '#7c2d12' }}>Inventory Restock Notice:</strong> All items in this invoice will be automatically restored back to stock inventory and any customer credit balance will be reversed.
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.65rem', borderTop: '1px solid #f1f5f9' }}>
              <button
                type="button"
                onClick={() => setInvoiceToDelete(null)}
                className="btn btn-secondary"
                disabled={isDeletingSale}
                style={{ borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteSale}
                disabled={isDeletingSale}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  padding: '0.55rem 1.15rem',
                  background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                  color: '#ffffff',
                  border: 'none',
                  boxShadow: '0 2px 6px rgba(220, 38, 38, 0.25)',
                  cursor: isDeletingSale ? 'not-allowed' : 'pointer',
                  opacity: isDeletingSale ? 0.75 : 1
                }}
              >
                <Trash2 size={15} />
                {isDeletingSale ? 'Deleting & Restocking...' : 'Yes, Delete Invoice'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Customer Confirmation Modal */}
      {customerToDelete && (
        <Modal
          isOpen={!!customerToDelete}
          onClose={() => setCustomerToDelete(null)}
          title="Delete Customer Confirmation"
        >
          <div style={{ padding: '0.25rem 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '1.25rem' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 2px 8px rgba(220, 38, 38, 0.15)'
              }}>
                <Trash2 size={22} strokeWidth={2.2} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.01em' }}>
                  Remove Regular Customer?
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: '0.825rem', color: '#64748b' }}>
                  Are you sure you want to remove <strong>{customerToDelete.name}</strong>?
                </p>
              </div>
            </div>

            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '0.9rem 1.1rem',
              marginBottom: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.55rem',
              fontSize: '0.85rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Phone:</span>
                <span style={{ fontWeight: 600, color: '#1e293b' }}>{customerToDelete.phone || '—'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Company:</span>
                <span style={{ fontWeight: 600, color: '#1e293b' }}>{customerToDelete.company_name || '—'}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.65rem', borderTop: '1px solid #f1f5f9' }}>
              <button
                type="button"
                onClick={() => setCustomerToDelete(null)}
                className="btn btn-secondary"
                disabled={isDeletingCustomer}
                style={{ borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteCustomer}
                disabled={isDeletingCustomer}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  padding: '0.55rem 1.15rem',
                  background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                  color: '#ffffff',
                  border: 'none',
                  boxShadow: '0 2px 6px rgba(220, 38, 38, 0.25)',
                  cursor: isDeletingCustomer ? 'not-allowed' : 'pointer',
                  opacity: isDeletingCustomer ? 0.75 : 1
                }}
              >
                <Trash2 size={15} />
                {isDeletingCustomer ? 'Deleting...' : 'Delete Customer'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Walk-in Customer Confirmation Modal */}
      {walkinToDelete && (
        <Modal
          isOpen={!!walkinToDelete}
          onClose={() => setWalkinToDelete(null)}
          title="Delete Walk-in Customer Records"
        >
          <div style={{ padding: '0.25rem 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '1.25rem' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 2px 8px rgba(220, 38, 38, 0.15)'
              }}>
                <Trash2 size={22} strokeWidth={2.2} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.01em' }}>
                  Delete Walk-in Customer Records?
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: '0.825rem', color: '#64748b' }}>
                  This will remove all transaction records associated with this profile.
                </p>
              </div>
            </div>

            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '0.9rem 1.1rem',
              marginBottom: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed #e2e8f0', paddingBottom: '0.55rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={14} color="#94a3b8" /> Customer Name
                </span>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a' }}>
                  {walkinToDelete.name}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed #e2e8f0', paddingBottom: '0.55rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Phone size={14} color="#94a3b8" /> Phone Number
                </span>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#334155' }}>
                  {walkinToDelete.phone && walkinToDelete.phone !== '—' ? `+91 ${walkinToDelete.phone.replace(/\D/g, '').slice(-10)}` : 'Unspecified'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Receipt size={14} color="#94a3b8" /> Total Invoices
                </span>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                  {walkinToDelete.billsCount} bill(s) &bull; ₹{walkinToDelete.totalSpent.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div style={{
              background: '#fff7ed',
              border: '1px solid #fed7aa',
              borderRadius: '8px',
              padding: '0.75rem 0.9rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.65rem'
            }}>
              <RotateCcw size={16} color="#ea580c" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '0.775rem', color: '#9a3412', lineHeight: 1.45 }}>
                <strong style={{ color: '#7c2d12' }}>Inventory Restock Notice:</strong> Deleting this will cancel all associated invoice records for this walk-in customer and restock all purchased quantities back into warehouse inventory.
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.65rem', borderTop: '1px solid #f1f5f9' }}>
              <button
                type="button"
                onClick={() => setWalkinToDelete(null)}
                className="btn btn-secondary"
                disabled={isDeletingWalkin}
                style={{ borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteWalkin}
                disabled={isDeletingWalkin}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  padding: '0.55rem 1.15rem',
                  background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                  color: '#ffffff',
                  border: 'none',
                  boxShadow: '0 2px 6px rgba(220, 38, 38, 0.25)',
                  cursor: isDeletingWalkin ? 'not-allowed' : 'pointer',
                  opacity: isDeletingWalkin ? 0.75 : 1
                }}
              >
                <Trash2 size={15} />
                {isDeletingWalkin ? 'Deleting & Restocking...' : 'Yes, Delete Walk-in Records'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Sales Return Confirmation Modal */}
      {returnToDelete && (
        <Modal
          isOpen={!!returnToDelete}
          onClose={() => setReturnToDelete(null)}
          title="Delete Return Confirmation"
        >
          <div style={{ padding: '0.25rem 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '1.25rem' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 2px 8px rgba(220, 38, 38, 0.15)'
              }}>
                <Trash2 size={22} strokeWidth={2.2} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.01em' }}>
                  Delete Sales Return Record?
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: '0.825rem', color: '#64748b' }}>
                  This will remove this return transaction audit record.
                </p>
              </div>
            </div>

            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '0.9rem 1.1rem',
              marginBottom: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed #e2e8f0', paddingBottom: '0.55rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <RotateCcw size={14} color="#94a3b8" /> Return #
                </span>
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#7c3aed', fontFamily: 'monospace' }}>
                  {returnToDelete.return_number}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed #e2e8f0', paddingBottom: '0.55rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={14} color="#94a3b8" /> Customer
                </span>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a' }}>
                  {returnToDelete.customer_name}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Receipt size={14} color="#94a3b8" /> Total Refund Amount
                </span>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: '#16a34a' }}>
                  ₹{parseFloat(returnToDelete.total_refund || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {returnToDelete.condition === 'GOOD' ? (
              <div style={{
                background: '#fff7ed',
                border: '1px solid #fed7aa',
                borderRadius: '8px',
                padding: '0.75rem 0.9rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.65rem'
              }}>
                <RotateCcw size={16} color="#ea580c" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '0.775rem', color: '#9a3412', lineHeight: 1.45 }}>
                  <strong style={{ color: '#7c2d12' }}>Stock Reversal Notice:</strong> This return was marked as <em>Good Condition</em> and previously restocked inventory. Deleting this record will deduct the returned stock back out of warehouse inventory.
                </div>
              </div>
            ) : (
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '0.75rem 0.9rem',
                marginBottom: '1.25rem',
                fontSize: '0.775rem',
                color: '#64748b'
              }}>
                This return was marked as <em>Damaged / Quarantined</em> and did not alter sellable stock.
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.65rem', borderTop: '1px solid #f1f5f9' }}>
              <button
                type="button"
                onClick={() => setReturnToDelete(null)}
                className="btn btn-secondary"
                disabled={isDeletingReturn}
                style={{ borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteReturn}
                disabled={isDeletingReturn}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  padding: '0.55rem 1.15rem',
                  background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                  color: '#ffffff',
                  border: 'none',
                  boxShadow: '0 2px 6px rgba(220, 38, 38, 0.25)',
                  cursor: isDeletingReturn ? 'not-allowed' : 'pointer',
                  opacity: isDeletingReturn ? 0.75 : 1
                }}
              >
                <Trash2 size={15} />
                {isDeletingReturn ? 'Deleting...' : 'Yes, Delete Return'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
