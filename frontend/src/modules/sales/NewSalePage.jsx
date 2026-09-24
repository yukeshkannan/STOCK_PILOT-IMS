import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import api from '../../services/api';
import Modal from '../../components/Modal';
import PrintInvoiceModal from '../../components/PrintInvoiceModal';
import CustomSelect from '../../components/CustomSelect';
import { openRazorpayCheckout } from '../../services/razorpay';
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Printer,
  CreditCard,
  User,
  Warehouse,
  Search,
  CheckCircle,
  ArrowLeft,
  DollarSign,
  PackageSearch,
  Zap,
  Receipt,
  QrCode,
  Banknote,
  Building2,
  X,
  Phone,
  Send,
  MessageSquare,
  CheckCircle2,
  Calculator,
  ArrowRight,
  Sparkles,
  RotateCcw
} from 'lucide-react';

export default function NewSalePage() {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);

  // POS State
  const [warehouseId, setWarehouseId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [customerMode, setCustomerMode] = useState('WALK_IN'); // 'WALK_IN' | 'REGISTERED'
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [cartItems, setCartItems] = useState([]);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [paidAmount, setPaidAmount] = useState(0);

  // Search & Category Filters
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Cash Tender Calculator Modal State
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  const [cashTenderedInput, setCashTenderedInput] = useState('');

  // Post-sale Digital Receipt State
  const [saleSuccessData, setSaleSuccessData] = useState(null);
  const [isViewPrintInvoiceOpen, setIsViewPrintInvoiceOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const userRole = (user?.roleName || user?.role || '').toUpperCase();
  const isSuperAdmin = Boolean(user?.isSuperAdmin) || userRole === 'SUPER_ADMIN';
  const isGlobalAdmin = isSuperAdmin || (userRole === 'ADMIN' && !user?.warehouseId);
  const isBranchScoped = Boolean(user?.warehouseId) && !isGlobalAdmin;
  const branchWhId = user?.warehouseId ? String(user.warehouseId) : '';
  const branchWhName = user?.warehouseName || user?.warehouse_name || '';

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const [prdRes, custRes, whRes, stkRes] = await Promise.all([
          api.get('/products?limit=500'),
          api.get('/customers'),
          api.get('/warehouses'),
          api.get('/inventory?limit=1000').catch(() => ({ data: [] }))
        ]);

        const prds = prdRes?.data || [];
        const custs = custRes?.data || [];
        const whs = whRes?.data || [];
        const stks = stkRes?.data || [];

        setProducts(prds);
        setCustomers(custs);
        setWarehouses(whs);
        setStocks(stks);

        if (isBranchScoped && branchWhId) {
          setWarehouseId(branchWhId);
        } else {
          setWarehouseId('');
        }
      } catch (err) {
        console.error('Error loading POS data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, [isBranchScoped, branchWhId]);

  // Extract unique product categories for fast filtering
  const categories = useMemo(() => {
    const cats = new Set();
    products.forEach((p) => {
      const name = p.category?.name || p.category_name || (typeof p.category === 'string' ? p.category : null);
      if (name) cats.add(name);
    });
    return Array.from(cats);
  }, [products]);

  // Real-time stock calculator per product & selected warehouse
  const getAvailableStock = (productId) => {
    const targetWhId = warehouseId ? parseInt(warehouseId, 10) : null;
    const matchingStocks = stocks.filter((s) => s.product_id === productId || s.productId === productId);

    if (matchingStocks.length > 0) {
      if (targetWhId) {
        const whStock = matchingStocks.find((s) => s.warehouse_id === targetWhId || s.warehouseId === targetWhId);
        return whStock ? Math.max(0, parseInt(whStock.current_stock, 10) || 0) : 0;
      }
      return matchingStocks.reduce((sum, s) => sum + Math.max(0, parseInt(s.current_stock, 10) || 0), 0);
    }

    const prod = products.find((p) => p.id === productId);
    return prod ? Math.max(0, prod.current_stock ?? prod.total_stock ?? 0) : 0;
  };

  const handleAddToCart = (product) => {
    const available = getAvailableStock(product.id);
    const existingIndex = cartItems.findIndex((item) => item.productId === product.id);
    const currentInCart = existingIndex > -1 ? cartItems[existingIndex].quantity : 0;

    if (available <= 0) {
      toast.error(`"${product.name}" is currently Out of Stock (0 Available)`);
      return;
    }

    if (currentInCart + 1 > available) {
      toast.warning(`Cannot add more "${product.name}". Only ${available} units available in stock!`);
      return;
    }

    if (existingIndex > -1) {
      const updated = [...cartItems];
      updated[existingIndex].quantity += 1;
      setCartItems(updated);
    } else {
      setCartItems([
        ...cartItems,
        {
          productId: product.id,
          productCode: product.product_code,
          productName: product.name,
          unitPrice: parseFloat(product.selling_price) || 0,
          costPrice: parseFloat(product.purchase_price) || 0,
          quantity: 1,
          taxRate: parseFloat(product.tax_rate) || 18,
          discountAmount: 0
        }
      ]);
    }
  };

  const handleQuantityChange = (index, delta) => {
    const item = cartItems[index];
    if (!item) return;

    if (delta > 0) {
      const available = getAvailableStock(item.productId);
      if (item.quantity + delta > available) {
        toast.warning(`Cannot exceed available stock! Only ${available} units of "${item.productName}" available.`);
        return;
      }
    }

    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      handleRemoveItem(index);
    } else {
      const updated = [...cartItems];
      updated[index] = { ...updated[index], quantity: newQty };
      setCartItems(updated);
    }
  };

  const handleRemoveItem = (index) => {
    setCartItems(cartItems.filter((_, i) => i !== index));
  };

  const handleClearCart = () => {
    if (cartItems.length > 0) {
      setCartItems([]);
      setDiscountAmount(0);
    }
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  };

  const calculateTotalTax = () => {
    return cartItems.reduce((acc, item) => {
      const itemSub = item.unitPrice * item.quantity;
      return acc + itemSub * (item.taxRate / 100);
    }, 0);
  };

  const subtotal = calculateSubtotal();
  const totalTax = calculateTotalTax();
  const discount = parseFloat(discountAmount) || 0;
  const grandTotal = Math.max(0, subtotal + totalTax - discount);
  const totalItemsCount = cartItems.reduce((acc, i) => acc + i.quantity, 0);

  // Auto-sync paidAmount with grandTotal
  useEffect(() => {
    setPaidAmount(grandTotal);
  }, [grandTotal]);

  const handleCustomerSelect = (id) => {
    setCustomerId(id);
    if (!id) {
      setCustomerName('');
      setCustomerPhone('');
      return;
    }
    const cust = customers.find((c) => c.id === parseInt(id, 10));
    if (cust) {
      setCustomerName(cust.name);
      setCustomerPhone(cust.phone || '');
    }
  };

  const executeSaleCreation = async ({ transactionId = null, tenderAmount = null, changeAmount = 0, overridePaymentMethod = null } = {}) => {
    try {
      setSubmitting(true);
      const selectedWh = warehouses.find((w) => String(w.id) === String(warehouseId));
      const finalWhId = selectedWh ? selectedWh.id : (parseInt(warehouseId, 10) || 1);
      const finalWhName = selectedWh ? selectedWh.name : (branchWhName || 'Main Warehouse');
      const activePayMethod = overridePaymentMethod || paymentMethod;

      const payload = {
        customerId: customerMode === 'REGISTERED' && customerId ? parseInt(customerId, 10) : null,
        customerName: customerName.trim() || 'Walk-in Customer',
        customerPhone: customerPhone.trim() || null,
        warehouseId: finalWhId,
        warehouseName: finalWhName,
        discountAmount: discount,
        paymentMethod: activePayMethod,
        transactionId: transactionId || null,
        paidAmount: parseFloat(paidAmount) >= 0 ? parseFloat(paidAmount) : grandTotal,
        items: cartItems.map((item) => ({
          productId: item.productId,
          productCode: item.productCode,
          productName: item.productName,
          unitPrice: item.unitPrice,
          costPrice: item.costPrice,
          quantity: item.quantity,
          taxRate: item.taxRate,
          discountAmount: item.discountAmount || 0
        }))
      };

      const idempotencyKey = `pos-sale-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
      const res = await api.post('/sales', payload, {
        headers: {
          'x-idempotency-key': idempotencyKey
        }
      });
      const created = res?.data || res;

      toast.success(`Sale #${created.invoice_number || 'Order'} billed & inventory adjusted!`);
      
      setSaleSuccessData({
        sale: created,
        tenderAmount: tenderAmount !== null ? parseFloat(tenderAmount) : grandTotal,
        changeAmount: Math.max(0, parseFloat(changeAmount) || 0),
        itemsCount: cartItems.reduce((acc, i) => acc + i.quantity, 0),
        itemsList: cartItems.map((i) => ({
          name: i.productName,
          qty: i.quantity,
          unitPrice: i.unitPrice,
          total: i.unitPrice * i.quantity
        })),
        subtotalAmount: subtotal,
        discountAmount: discount,
        paymentMethod: activePayMethod,
        customerName: customerName.trim() || 'Walk-in Customer',
        customerPhone: customerPhone.trim(),
        warehouseName: finalWhName,
        transactionId
      });

      setCartItems([]);
      setDiscountAmount(0);
      setIsCashModalOpen(false);
    } catch (err) {
      const errMsg = err.message || err.response?.data?.message || 'Sale checkout failed. Please verify warehouse stock.';
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleInitiatePayment = (e) => {
    if (e) e.preventDefault();
    if (cartItems.length === 0) {
      toast.warning('Please add at least one product to the sale ticket');
      return;
    }

    if (!warehouseId && !isBranchScoped) {
      toast.warning('Please select the billing warehouse / store outlet from the top header');
      return;
    }

    // MANDATORY REAL-TIME STOCK PRE-FLIGHT CHECK
    for (const item of cartItems) {
      const available = getAvailableStock(item.productId);
      if (item.quantity > available) {
        toast.error(`Insufficient stock for "${item.productName}". Available: ${available} units, but requested: ${item.quantity}.`);
        return;
      }
    }

    // MANDATORY VALIDATION: Customer Name & 10-Digit Mobile Number
    const trimmedName = (customerName || '').trim();
    const rawPhone = (customerPhone || '').replace(/\D/g, '');

    if (customerMode === 'WALK_IN') {
      if (!trimmedName || trimmedName.toLowerCase() === 'walk-in customer') {
        toast.warning('Customer Name is required. Please enter the customer name.');
        return;
      }
      if (!rawPhone || rawPhone.length < 10) {
        toast.warning('Valid 10-digit Customer Mobile Number is required.');
        return;
      }
    } else if (customerMode === 'REGISTERED') {
      if (!customerId) {
        toast.warning('Please select a Registered Client.');
        return;
      }
      if (!rawPhone || rawPhone.length < 10) {
        toast.warning('Registered customer must have a valid 10-digit mobile number.');
        return;
      }
    }

    // Flow 1: Cash Payment -> Process directly with live change calculation
    if (paymentMethod === 'CASH') {
      const tendered = parseFloat(cashTenderedInput || grandTotal);
      const change = Math.max(0, tendered - grandTotal);
      executeSaleCreation({
        tenderAmount: tendered,
        changeAmount: change,
        overridePaymentMethod: 'CASH'
      });
      return;
    }

    // Flow 2: Online Digital Payments (UPI / Card / Bank) -> Open Official Razorpay Checkout Popup
    if (paymentMethod === 'UPI' || paymentMethod === 'CARD' || paymentMethod === 'BANK_TRANSFER') {
      try {
        openRazorpayCheckout({
          amount: grandTotal,
          poNumber: `POS-${Date.now().toString().slice(-6)}`,
          companyName: user?.companyName || 'StockPilot Store',
          userPhone: customerPhone || user?.phone || '',
          userEmail: user?.email || '',
          onSuccess: (rzpResponse) => {
            executeSaleCreation({
              transactionId: rzpResponse.razorpay_payment_id,
              overridePaymentMethod: paymentMethod
            });
          },
          onDismiss: (error) => {
            if (error) {
              toast.error('Payment verification cancelled or failed.');
            }
          }
        });
      } catch (rzpErr) {
        toast.error(rzpErr.message || 'Failed to initialize payment gateway');
      }
      return;
    }

    // Flow 3: EMI / Installments Credit
    executeSaleCreation({ overridePaymentMethod: 'CREDIT' });
  };

  const handleSendWhatsAppReceipt = (data) => {
    const rawPhone = (customerPhone || data?.customerPhone || '').replace(/\D/g, '');
    if (!rawPhone || rawPhone.length < 10) {
      toast.warning('Please enter a valid 10-digit customer mobile number');
      return;
    }

    const phoneWithCountry = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;
    const invNo = data?.sale?.invoice_number || `INV-${data?.sale?.id || 'RECEIPT'}`;
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    const store = user?.companyName || user?.company_name || 'Store';
    const branch = data?.warehouseName || 'Main Store';

    // Prioritize dynamically entered customerName
    const activeName = (customerName && customerName !== 'Walk-in Customer') 
      ? customerName.trim() 
      : (data?.customerName && data?.customerName !== 'Walk-in Customer' ? data.customerName.trim() : '');
    const greetingRecipient = activeName || 'Valued Customer';
    const billToRecipient = activeName || 'Walk-in Customer';

    // Build Itemized lines
    let itemsBlock = '';
    if (data?.itemsList && data?.itemsList.length > 0) {
      itemsBlock = data.itemsList
        .map((it) => `• ${it.name} (x${it.qty}) : ₹${it.total.toLocaleString('en-IN')}`)
        .join('\n');
    } else {
      itemsBlock = `• Billed Items (${data?.itemsCount || 1} units)`;
    }

    const msg =
      `*GREETINGS FROM ${store.toUpperCase()}!*\n` +
      `Dear *${greetingRecipient}*, thank you for shopping with us today. We truly appreciate your visit and hope you had a wonderful experience!\n\n` +
      `─────────────────────────\n` +
      `*OFFICIAL TAX INVOICE / E-RECEIPT*\n` +
      `─────────────────────────\n` +
      `• *Invoice No:* #${invNo}\n` +
      `• *Date & Time:* ${dateStr}, ${timeStr}\n` +
      `• *Store Outlet:* ${branch}\n` +
      `• *Customer:* ${billToRecipient} (+91 ${rawPhone.slice(-10)})\n` +
      `─────────────────────────\n` +
      `*PURCHASE SUMMARY:*\n` +
      `${itemsBlock}\n` +
      `─────────────────────────\n` +
      `*PAYMENT BREAKDOWN:*\n` +
      (data?.discountAmount > 0 ? `• *Discount Applied:* -₹${data.discountAmount.toLocaleString('en-IN')}\n` : '') +
      `• *Grand Total:* ₹${parseFloat(data?.sale?.grand_total || 0).toLocaleString('en-IN')}\n` +
      `• *Payment Mode:* ${data?.paymentMethod}\n` +
      (data?.transactionId ? `• *Txn ID:* ${data.transactionId}\n` : '') +
      (data?.paymentMethod === 'CASH' && data?.tenderAmount ? `• *Cash Tendered:* ₹${data.tenderAmount.toLocaleString('en-IN')}\n` : '') +
      (data?.paymentMethod === 'CASH' && data?.changeAmount > 0 ? `• *Change Returned:* ₹${data.changeAmount.toLocaleString('en-IN')}\n` : '') +
      `─────────────────────────\n` +
      `Link: ${window.location.origin}/e-bill/${encodeURIComponent(invNo)}\n` +
      `─────────────────────────\n` +
      `*Thank you for your trust & visit!*\n` +
      `_Please keep this digital e-receipt for your records, warranty & easy returns._\n` +
      (user?.phone ? `_Need support? Call: ${user.phone}_\n` : '');

    const waUrl = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    toast.success(`WhatsApp E-Receipt opened for ${greetingRecipient} (+91 ${rawPhone.slice(-10)})`);
  };

  const handleStartNextSale = () => {
    setSaleSuccessData(null);
    setCustomerMode('WALK_IN');
    setCustomerId('');
    setCustomerName('Walk-in Customer');
    setCustomerPhone('');
    setCartItems([]);
    setDiscountAmount(0);
    setProductSearch('');
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.product_code.toLowerCase().includes(productSearch.toLowerCase());

    const categoryName = p.category?.name || p.category_name || (typeof p.category === 'string' ? p.category : '');
    const matchesCategory = selectedCategory === 'ALL' || categoryName === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const paymentOptions = [
    { id: 'UPI', label: 'UPI / QR', icon: <QrCode size={15} /> },
    { id: 'CASH', label: 'Cash', icon: <Banknote size={15} /> },
    { id: 'CARD', label: 'Card / POS', icon: <CreditCard size={15} /> },
    { id: 'BANK_TRANSFER', label: 'Bank', icon: <Building2 size={15} /> },
    { id: 'CREDIT', label: 'EMI', icon: <Receipt size={15} /> }
  ];

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', paddingBottom: '2rem' }}>
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & NAVIGATION                                                */}
      {/* ========================================================================= */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <Link
            to="/sales"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              padding: '6px 12px',
              borderRadius: '8px',
              color: '#475569',
              fontSize: '0.825rem',
              fontWeight: 600,
              textDecoration: 'none',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
              transition: 'all 0.15s ease'
            }}
          >
            <ArrowLeft size={15} /> Sales
          </Link>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
            POS Terminal & Invoicing
          </h1>
        </div>

        {/* Counter Info & Warehouse Selection */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ minWidth: '220px' }}>
            {isBranchScoped ? (
              <div
                style={{
                  height: '36px',
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '0 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#334155',
                  fontWeight: 600,
                  fontSize: '0.8rem'
                }}
              >
                <Warehouse size={14} color="#64748b" />
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {branchWhName || (warehouses.find((w) => String(w.id) === String(warehouseId))?.name) || 'Branch Hub'}
                </span>
              </div>
            ) : (
              <CustomSelect
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                placeholder="Select Store / Warehouse *"
                options={[
                  { value: '', label: 'Select Store / Warehouse *' },
                  ...warehouses.map((w) => ({ value: String(w.id), label: `${w.name} (${w.code})` }))
                ]}
              />
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MAIN 2-COLUMN POS LAYOUT                                               */}
      {/* ========================================================================= */}
      <div className="pos-main-layout">
        {/* ======================================================================= */}
        {/* LEFT COLUMN: PRODUCT CATALOG & QUICK SEARCH                             */}
        {/* ======================================================================= */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {/* Search & Category Filter Bar */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              padding: '0.85rem',
              boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)'
            }}
          >
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.65rem' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search
                  size={15}
                  color="#94a3b8"
                  style={{ position: 'absolute', left: '12px', top: '10px' }}
                />
                <input
                  type="text"
                  style={{
                    width: '100%',
                    height: '36px',
                    paddingLeft: '2.25rem',
                    paddingRight: productSearch ? '2rem' : '0.75rem',
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    color: '#0f172a',
                    outline: 'none',
                    transition: 'all 0.15s ease'
                  }}
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search SKU or item name..."
                  autoFocus
                />
                {productSearch && (
                  <button
                    type="button"
                    onClick={() => setProductSearch('')}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '9px',
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Category Pills */}
            <div
              style={{
                display: 'flex',
                gap: '6px',
                overflowX: 'auto',
                paddingBottom: '2px',
                scrollbarWidth: 'none'
              }}
            >
              <button
                type="button"
                onClick={() => setSelectedCategory('ALL')}
                style={{
                  background: selectedCategory === 'ALL' ? '#0f172a' : '#f1f5f9',
                  color: selectedCategory === 'ALL' ? '#ffffff' : '#475569',
                  border: 'none',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                All ({products.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    background: selectedCategory === cat ? '#0f172a' : '#f1f5f9',
                    color: selectedCategory === cat ? '#ffffff' : '#475569',
                    border: 'none',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
              gap: '0.75rem',
              maxHeight: 'calc(100vh - 220px)',
              overflowY: 'auto',
              paddingRight: '2px'
            }}
          >
            {filteredProducts.length === 0 ? (
              <div
                style={{
                  gridColumn: '1 / -1',
                  background: '#ffffff',
                  borderRadius: '12px',
                  border: '1px dashed #cbd5e1',
                  padding: '3rem 1.5rem',
                  textAlign: 'center',
                  color: '#64748b'
                }}
              >
                <PackageSearch size={32} color="#94a3b8" style={{ margin: '0 auto 0.5rem' }} />
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#334155' }}>No items match your search</div>
                <div style={{ fontSize: '0.775rem', marginTop: '2px' }}>Try typing a different product SKU or code</div>
              </div>
            ) : (
              filteredProducts.map((p) => {
                const inCart = cartItems.find((ci) => ci.productId === p.id);
                const available = getAvailableStock(p.id);
                const isOutOfStock = available <= 0;

                return (
                  <div
                    key={p.id}
                    onClick={() => handleAddToCart(p)}
                    style={{
                      background: '#ffffff',
                      borderRadius: '12px',
                      border: inCart ? '1.5px solid var(--primary)' : isOutOfStock ? '1px dashed #cbd5e1' : '1px solid #e2e8f0',
                      padding: '0.85rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: inCart ? '0 2px 8px rgba(99, 102, 241, 0.12)' : '0 1px 3px rgba(15, 23, 42, 0.03)',
                      cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                      opacity: isOutOfStock ? 0.62 : 1,
                      transition: 'all 0.15s ease',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      if (!isOutOfStock) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(15, 23, 42, 0.08)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isOutOfStock) {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = inCart ? '0 2px 8px rgba(99, 102, 241, 0.12)' : '0 1px 3px rgba(15, 23, 42, 0.03)';
                      }
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                        <span
                          style={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            color: '#64748b',
                            background: '#f1f5f9',
                            padding: '1px 5px',
                            borderRadius: '4px'
                          }}
                        >
                          {p.product_code}
                        </span>

                        {isOutOfStock ? (
                          <span
                            style={{
                              fontSize: '0.62rem',
                              fontWeight: 700,
                              color: '#dc2626',
                              background: '#fee2e2',
                              padding: '1px 5px',
                              borderRadius: '4px'
                            }}
                          >
                            Out of Stock
                          </span>
                        ) : available <= 5 ? (
                          <span
                            style={{
                              fontSize: '0.62rem',
                              fontWeight: 700,
                              color: '#d97706',
                              background: '#fef3c7',
                              padding: '1px 5px',
                              borderRadius: '4px'
                            }}
                          >
                            Only {available} left
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: '0.62rem',
                              fontWeight: 700,
                              color: '#16a34a',
                              background: '#dcfce7',
                              padding: '1px 5px',
                              borderRadius: '4px'
                            }}
                          >
                            {available} in stock
                          </span>
                        )}
                      </div>

                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          color: isOutOfStock ? '#64748b' : '#0f172a',
                          marginTop: '6px',
                          lineHeight: 1.3,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          minHeight: '2.3rem'
                        }}
                      >
                        {p.name}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>
                        {p.category?.name || p.category_name || (typeof p.category === 'string' ? p.category : 'General')}
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: '0.75rem',
                        paddingTop: '0.5rem',
                        borderTop: '1px solid #f1f5f9'
                      }}
                    >
                      <div>
                        <span style={{ fontWeight: 800, fontSize: '0.95rem', color: isOutOfStock ? '#94a3b8' : '#0f172a' }}>
                          ₹{parseFloat(p.selling_price).toLocaleString()}
                        </span>
                      </div>
                      <button
                        type="button"
                        disabled={isOutOfStock}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(p);
                        }}
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '6px',
                          background: isOutOfStock ? '#f1f5f9' : 'var(--primary-light)',
                          color: isOutOfStock ? '#94a3b8' : 'var(--primary)',
                          border: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                          transition: 'all 0.12s ease'
                        }}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ======================================================================= */}
        {/* RIGHT COLUMN: ACTIVE ORDER TICKET & REGISTER CHECKOUT                   */}
        {/* ======================================================================= */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 16px rgba(15, 23, 42, 0.05)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Ticket Header */}
          <div
            style={{
              padding: '0.9rem 1.15rem',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#fafbfc'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Receipt size={18} color="var(--primary)" />
              <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>
                Order Ticket
              </span>
              <span
                style={{
                  fontSize: '0.725rem',
                  fontWeight: 700,
                  background: '#f1f5f9',
                  color: '#475569',
                  padding: '2px 7px',
                  borderRadius: '6px'
                }}
              >
                {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'}
              </span>
            </div>

            {cartItems.length > 0 && (
              <button
                type="button"
                onClick={handleClearCart}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ef4444',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 6px'
                }}
              >
                <Trash2 size={13} /> Clear
              </button>
            )}
          </div>

          {/* ========================================================================= */}
          {/* STATE A: POST-SALE DIGITAL RECEIPT SLIP (WHEN SALE IS COMPLETED)          */}
          {/* ========================================================================= */}
          {saleSuccessData ? (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '480px' }}>
              {/* Slip Header Badge */}
              <div
                style={{
                  padding: '1.25rem 1.15rem 1rem',
                  borderBottom: '1px dashed #cbd5e1',
                  background: '#f8fafc',
                  textAlign: 'center'
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: '#16a34a',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 0.5rem',
                    boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)'
                  }}
                >
                  <CheckCircle2 size={22} />
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                  Sale #{saleSuccessData.sale?.invoice_number || 'INV-SUCCESS'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px', fontWeight: 600 }}>
                  {saleSuccessData.warehouseName} • {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                </div>
              </div>

              {/* Amount & Tender Breakdown */}
              <div style={{ padding: '0.85rem 1.15rem', background: '#ffffff', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>Total Paid</span>
                  <span style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                    ₹{parseFloat(saleSuccessData.sale?.grand_total || 0).toLocaleString()}
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    background: '#f8fafc',
                    fontSize: '0.775rem',
                    fontWeight: 600,
                    color: '#475569'
                  }}
                >
                  <span>Payment Mode</span>
                  <span style={{ fontWeight: 800, color: '#0f172a' }}>{saleSuccessData.paymentMethod}</span>
                </div>

                {saleSuccessData.paymentMethod === 'CASH' && (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '0.5rem',
                      marginTop: '0.5rem'
                    }}
                  >
                    <div style={{ padding: '6px 10px', borderRadius: '6px', background: '#f8fafc', fontSize: '0.75rem' }}>
                      <span style={{ color: '#64748b' }}>Tendered: </span>
                      <strong style={{ color: '#0f172a' }}>₹{saleSuccessData.tenderAmount.toLocaleString()}</strong>
                    </div>
                    <div style={{ padding: '6px 10px', borderRadius: '6px', background: '#f0fdf4', fontSize: '0.75rem', border: '1px solid #bbf7d0' }}>
                      <span style={{ color: '#166534' }}>Change: </span>
                      <strong style={{ color: '#16a34a' }}>₹{saleSuccessData.changeAmount.toLocaleString()}</strong>
                    </div>
                  </div>
                )}
              </div>

              {/* Items Compact Preview */}
              <div
                style={{
                  padding: '0.75rem 1.15rem',
                  maxHeight: '160px',
                  overflowY: 'auto',
                  borderBottom: '1px dashed #cbd5e1',
                  background: '#fafafa'
                }}
              >
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                  Billed Items ({saleSuccessData.itemsCount})
                </div>
                {saleSuccessData.itemsList?.map((it, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.775rem', marginBottom: '0.3rem', color: '#334155' }}>
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
                      {it.name} <span style={{ color: '#94a3b8' }}>x{it.qty}</span>
                    </span>
                    <span style={{ fontWeight: 700 }}>₹{it.total.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              {/* Delivery Actions & Next Customer Controls */}
              <div style={{ padding: '0.85rem 1.15rem', background: '#ffffff', display: 'flex', flexDirection: 'column', gap: '0.55rem', marginTop: 'auto' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Deliver Digital E-Bill to Customer
                </div>

                {/* Customer Name & Phone Input Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.45rem' }}>
                  <div style={{ position: 'relative' }}>
                    <User size={13} style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      type="text"
                      placeholder="Customer Name"
                      value={customerName === 'Walk-in Customer' ? '' : customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.5rem 0.5rem 1.75rem',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: '#0f172a',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div style={{ position: 'relative' }}>
                    <Phone size={13} style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      type="tel"
                      placeholder="Mobile (10 digits)"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.5rem 0.5rem 1.75rem',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: '#0f172a',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                {/* WhatsApp Dispatch Button */}
                <button
                  type="button"
                  onClick={() => handleSendWhatsAppReceipt(saleSuccessData)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    background: '#16a34a',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '0.875rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(22, 163, 74, 0.25)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <MessageSquare size={16} />
                  <span>Send WhatsApp E-Bill</span>
                </button>

                {/* Print Slip Action */}
                <button
                  type="button"
                  onClick={() => setIsViewPrintInvoiceOpen(true)}
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    borderRadius: '8px',
                    background: '#ffffff',
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.825rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Printer size={15} />
                  <span>Print Slip / Tax Invoice</span>
                </button>

                {/* Next Customer Button */}
                <button
                  type="button"
                  onClick={handleStartNextSale}
                  style={{
                    width: '100%',
                    marginTop: '0.2rem',
                    padding: '0.8rem',
                    borderRadius: '8px',
                    background: 'var(--primary)',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '0.9rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px var(--primary-glow)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>Next Customer</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* STATE B: ACTIVE TICKET & INLINE CASH TENDER FLOW                          */
            /* ========================================================================= */
            <>
              {/* Customer Segmented Selector */}
              <div style={{ padding: '0.85rem 1.15rem', borderBottom: '1px solid #f1f5f9', background: '#ffffff' }}>
                <div
                  style={{
                    display: 'flex',
                    background: '#f1f5f9',
                    padding: '2px',
                    borderRadius: '8px',
                    marginBottom: '0.65rem'
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setCustomerMode('WALK_IN');
                      setCustomerId('');
                      setCustomerName('');
                    }}
                    style={{
                      flex: 1,
                      padding: '5px 0',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      border: 'none',
                      borderRadius: '6px',
                      background: customerMode === 'WALK_IN' ? '#ffffff' : 'transparent',
                      color: customerMode === 'WALK_IN' ? '#0f172a' : '#64748b',
                      boxShadow: customerMode === 'WALK_IN' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    Walk-in Customer
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomerMode('REGISTERED')}
                    style={{
                      flex: 1,
                      padding: '5px 0',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      border: 'none',
                      borderRadius: '6px',
                      background: customerMode === 'REGISTERED' ? '#ffffff' : 'transparent',
                      color: customerMode === 'REGISTERED' ? '#0f172a' : '#64748b',
                      boxShadow: customerMode === 'REGISTERED' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    Registered Client
                  </button>
                </div>

                {customerMode === 'REGISTERED' ? (
                  <div>
                    <CustomSelect
                      value={customerId}
                      onChange={(e) => handleCustomerSelect(e.target.value)}
                      placeholder="Search Registered Customer..."
                      options={customers.map((c) => ({
                        value: String(c.id),
                        label: `${c.name} • ${c.phone || 'No phone'}`
                      }))}
                    />
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.5rem' }}>
                    <input
                      type="text"
                      required
                      style={{
                        height: '34px',
                        padding: '0 10px',
                        background: '#ffffff',
                        border: '1.5px solid #cbd5e1',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        color: '#0f172a',
                        fontWeight: 600
                      }}
                      placeholder="Customer Name *"
                      value={customerName === 'Walk-in Customer' ? '' : customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      style={{
                        height: '34px',
                        padding: '0 10px',
                        background: '#ffffff',
                        border: '1.5px solid #cbd5e1',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        color: '#0f172a',
                        fontWeight: 600
                      }}
                      placeholder="Phone Number * (10 Digits)"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* Cart Item Rows */}
              <div
                style={{
                  padding: '0.85rem 1.15rem',
                  maxHeight: '220px',
                  minHeight: '120px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}
              >
                {cartItems.length === 0 ? (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '2.5rem 1rem',
                      color: '#94a3b8',
                      textAlign: 'center'
                    }}
                  >
                    <ShoppingBag size={28} color="#cbd5e1" style={{ marginBottom: '0.5rem' }} />
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#64748b' }}>Ticket is empty</div>
                    <div style={{ fontSize: '0.75rem', marginTop: '2px' }}>Click any product to add to order</div>
                  </div>
                ) : (
                  cartItems.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.5rem 0.65rem',
                        background: '#f8fafc',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        gap: '0.5rem'
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: '0.825rem',
                            color: '#0f172a',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {item.productName}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '1px' }}>
                          ₹{item.unitPrice.toLocaleString()} • {item.taxRate}% GST
                        </div>
                      </div>

                      {/* Quantity Stepper */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          background: '#ffffff',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          overflow: 'hidden'
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(idx, -1)}
                          style={{
                            width: '24px',
                            height: '24px',
                            background: 'none',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: '#475569'
                          }}
                        >
                          <Minus size={12} />
                        </button>
                        <span
                          style={{
                            width: '26px',
                            textAlign: 'center',
                            fontSize: '0.775rem',
                            fontWeight: 800,
                            color: '#0f172a'
                          }}
                        >
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(idx, 1)}
                          style={{
                            width: '24px',
                            height: '24px',
                            background: 'none',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: '#475569'
                          }}
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      {/* Line Total & Remove */}
                      <div style={{ textAlign: 'right', minWidth: '70px' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#0f172a' }}>
                          ₹{(item.unitPrice * item.quantity).toLocaleString()}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            fontSize: '0.675rem',
                            fontWeight: 600,
                            padding: 0
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Pricing & Ledger Summary */}
              <div
                style={{
                  padding: '0.85rem 1.15rem',
                  background: '#f8fafc',
                  borderTop: '1px solid #e2e8f0',
                  borderBottom: '1px solid #e2e8f0'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748b', marginBottom: '0.35rem' }}>
                  <span>Subtotal</span>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>₹{subtotal.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748b', marginBottom: '0.35rem' }}>
                  <span>Estimated GST Tax</span>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>₹{totalTax.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#64748b', marginBottom: '0.45rem' }}>
                  <span>Discount (₹)</span>
                  <input
                    type="number"
                    min="0"
                    style={{
                      width: '85px',
                      height: '28px',
                      padding: '0 6px',
                      textAlign: 'right',
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: '#0f172a'
                    }}
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(e.target.value)}
                  />
                </div>

                {/* Total Highlight */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    paddingTop: '0.45rem',
                    borderTop: '1px dashed #cbd5e1',
                    marginTop: '0.25rem'
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Payable Amount</span>
                  </div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                    ₹{grandTotal.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Payment Method Quick-Selector */}
              <div style={{ padding: '0.75rem 1.15rem', background: '#ffffff' }}>
                <div style={{ fontSize: '0.725rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.45rem' }}>
                  Payment Method
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.45rem', marginBottom: '0.65rem' }}>
                  {paymentOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setPaymentMethod(opt.id);
                        if (opt.id === 'CASH') {
                          setCashTenderedInput(String(grandTotal));
                        }
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '5px',
                        padding: '6px 4px',
                        borderRadius: '8px',
                        border: paymentMethod === opt.id ? '1.5px solid var(--primary)' : '1px solid #e2e8f0',
                        background: paymentMethod === opt.id ? 'var(--primary-light)' : '#ffffff',
                        color: paymentMethod === opt.id ? 'var(--primary)' : '#475569',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.12s ease'
                      }}
                    >
                      {opt.icon}
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Inline Cash Tender Calculator (Only when Cash is chosen) */}
              {paymentMethod === 'CASH' && grandTotal > 0 && (
                <div
                  style={{
                    padding: '0.75rem 1.15rem',
                    background: '#f8fafc',
                    borderTop: '1px solid #e2e8f0'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <label style={{ fontSize: '0.725rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Cash Received (₹)
                    </label>
                    {(() => {
                      const tendered = parseFloat(cashTenderedInput || 0);
                      const change = tendered - grandTotal;
                      if (tendered > 0) {
                        return change >= 0 ? (
                          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#16a34a' }}>
                            Change Due: ₹{change.toLocaleString()}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#dc2626' }}>
                            Shortage: ₹{Math.abs(change).toLocaleString()}
                          </span>
                        );
                      }
                      return null;
                    })()}
                  </div>

                  <div style={{ position: 'relative', marginBottom: '0.45rem' }}>
                    <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: '#64748b' }}>
                      ₹
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={cashTenderedInput}
                      onChange={(e) => setCashTenderedInput(e.target.value)}
                      placeholder="Enter cash amount"
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.65rem 0.5rem 1.85rem',
                        borderRadius: '8px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '0.95rem',
                        fontWeight: 800,
                        color: '#0f172a',
                        outline: 'none',
                        background: '#ffffff'
                      }}
                    />
                  </div>

                  {/* Quick Tender Denomination Chips */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    <button
                      type="button"
                      onClick={() => setCashTenderedInput(String(grandTotal))}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '5px',
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color: '#475569',
                        cursor: 'pointer'
                      }}
                    >
                      Exact (₹{grandTotal.toLocaleString()})
                    </button>
                    {[500, 1000, 2000, 5000].map((denom) => (
                      <button
                        key={denom}
                        type="button"
                        onClick={() => setCashTenderedInput(String(denom))}
                        style={{
                          padding: '3px 8px',
                          borderRadius: '5px',
                          background: '#ffffff',
                          border: '1px solid #e2e8f0',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          color: '#334155',
                          cursor: 'pointer'
                        }}
                      >
                        ₹{denom.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Complete Sale Action Button */}
              <div style={{ padding: '0.75rem 1.15rem', background: '#ffffff', borderTop: '1px solid #f1f5f9' }}>
                <button
                  type="button"
                  onClick={handleInitiatePayment}
                  disabled={submitting || cartItems.length === 0}
                  style={{
                    width: '100%',
                    padding: '0.85rem',
                    borderRadius: '10px',
                    background: cartItems.length === 0 ? '#cbd5e1' : 'var(--primary)',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '0.95rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: cartItems.length === 0 ? 'not-allowed' : 'pointer',
                    boxShadow: cartItems.length === 0 ? 'none' : '0 4px 14px var(--primary-glow)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Zap size={17} />
                  <span>
                    {submitting
                      ? 'Processing Transaction...'
                      : paymentMethod === 'CASH'
                      ? `Charge Cash • ₹${grandTotal.toLocaleString()}`
                      : paymentMethod === 'UPI' || paymentMethod === 'CARD'
                      ? `Pay with Razorpay • ₹${grandTotal.toLocaleString()}`
                      : paymentMethod === 'CREDIT'
                      ? `Complete EMI Sale • ₹${grandTotal.toLocaleString()}`
                      : `Complete Sale • ₹${grandTotal.toLocaleString()}`}
                  </span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Optional Physical Print Modal (Triggered on Demand) */}
      {isViewPrintInvoiceOpen && saleSuccessData && (
        <PrintInvoiceModal
          isOpen={isViewPrintInvoiceOpen}
          onClose={() => setIsViewPrintInvoiceOpen(false)}
          sale={saleSuccessData.sale}
          tenant={user}
        />
      )}
    </div>
  );
}
