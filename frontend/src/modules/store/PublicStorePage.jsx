import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { openRazorpayCheckout } from '../../services/razorpay';
import {
  Store,
  ShoppingBag,
  Search,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Phone,
  MapPin,
  ArrowRight,
  Menu,
  Lock,
  Eye,
  EyeOff,
  X,
  CreditCard,
  Banknote,
  QrCode,
  Globe,
  FileText,
  Loader2,
  Package,
  Layers,
  SlidersHorizontal,
  ExternalLink,
  Star,
  Clock,
  Mail,
  Zap,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Check,
  Truck,
  User,
  ArrowUpDown,
  ShoppingBasket,
  Sparkles,
  HelpCircle,
  Tag,
  Percent,
  Flame,
  Instagram,
  Facebook,
  Twitter,
  LogOut,
  Edit3,
  UserCheck,
  Save
} from 'lucide-react';
import './PublicStorePage.css';

// Official WhatsApp Brand SVG Icon
export const WhatsAppBrandIcon = ({ size = 18, color = '#25D366', className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={color}
    className={className}
    style={{ flexShrink: 0 }}
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const SORT_OPTIONS = [
  { value: 'DEFAULT', label: 'Featured' },
  { value: 'PRICE_LOW', label: 'Price: Low to High' },
  { value: 'PRICE_HIGH', label: 'Price: High to Low' },
  { value: 'NAME_ASC', label: 'Name: A to Z' }
];

export default function PublicStorePage() {
  const { companyCode, invoiceNumber: urlInvoiceNumber } = useParams();
  const catalogRef = useRef(null);
  const sortDropdownRef = useRef(null);
  const accountDropdownRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [storeData, setStoreData] = useState(null);
  const [error, setError] = useState('');

  // Filtering, Search & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [sortBy, setSortBy] = useState('DEFAULT');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Testimonials Carousel index (3 per view)
  const [testimonialIndex, setTestimonialIndex] = useState(0);

  // Hero Section Dynamic Carousel Slide Index
  const [activeHeroSlideIndex, setActiveHeroSlideIndex] = useState(0);

  // Quick View Modal
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  // Cart State
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Checkout Form State
  const [customer, setCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    deliveryType: 'DELIVERY', // 'DELIVERY' | 'PICKUP'
    paymentMethod: 'CASH' // 'CASH' | 'UPI'
  });
  const [cashTendered, setCashTendered] = useState('');
  const [isPaidAtCounter, setIsPaidAtCounter] = useState(true);

  // Order State
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);

  // Customer Account & Authentication State (Tenant Scoped)
  const [customerUser, setCustomerUser] = useState(null);
  const [customerToken, setCustomerToken] = useState('');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('LOGIN'); // 'LOGIN' | 'REGISTER' | 'OTP'
  const [authFormData, setAuthFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [isCustomerAccountOpen, setIsCustomerAccountOpen] = useState(false);
  const [customerDrawerTab, setCustomerDrawerTab] = useState('ORDERS'); // 'ORDERS' | 'PROFILE'
  const [customerOrders, setCustomerOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    pincode: ''
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Live Order Tracking State
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [trackingOrderData, setTrackingOrderData] = useState(null);
  const [trackingInvoiceInput, setTrackingInvoiceInput] = useState(urlInvoiceNumber || '');
  const [isTrackingLoading, setIsTrackingLoading] = useState(false);

  // Restore customer session from localStorage
  useEffect(() => {
    if (!companyCode) return;
    try {
      const codeKey = companyCode.toUpperCase();
      const savedUserStr = localStorage.getItem(`stockpilot_customer_user_${codeKey}`);
      const savedToken = localStorage.getItem(`stockpilot_customer_token_${codeKey}`);
      if (savedUserStr && savedToken) {
        const u = JSON.parse(savedUserStr);
        setCustomerUser(u);
        setCustomerToken(savedToken);
        setProfileForm({
          name: u.name || '',
          phone: u.phone || '',
          email: u.email || '',
          address: u.address || '',
          city: u.city || '',
          pincode: u.pincode || ''
        });
        setCustomer((prev) => ({
          ...prev,
          name: u.name || prev.name,
          phone: u.phone || prev.phone,
          email: u.email || prev.email,
          address: u.address || prev.address
        }));
      }
    } catch (e) {}
  }, [companyCode]);

  // Auto-track order if invoice number is in URL
  useEffect(() => {
    if (urlInvoiceNumber && companyCode) {
      handleTrackOrder(urlInvoiceNumber);
    }
  }, [urlInvoiceNumber, companyCode]);

  // 1-Second Countdown Timer for Flash Sale Blocks
  const [countdown, setCountdown] = useState({ days: 2, hours: 14, minutes: 35, seconds: 48 });
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        if (prev.days > 0) return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Accordion open/close state for FAQ blocks
  const [openFaqKeys, setOpenFaqKeys] = useState({ 0: true });
  const toggleFaq = (key) => setOpenFaqKeys((prev) => ({ ...prev, [key]: !prev[key] }));

  // One-click coupon code copy state
  const [copiedPromoCode, setCopiedPromoCode] = useState(false);
  const handleCopyCode = (code) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(code);
    }
    setCopiedPromoCode(true);
    toast.success(`Coupon code "${code}" copied to clipboard!`, { autoClose: 1500 });
    setTimeout(() => setCopiedPromoCode(false), 2500);
  };

  // Horizontal scroll controller for Product Carousel blocks
  const carouselTrackRef = useRef(null);
  const scrollCarousel = (direction) => {
    if (carouselTrackRef.current) {
      const scrollAmount = direction === 'left' ? -340 : 340;
      carouselTrackRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Close sort & account dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target)) {
        setIsSortOpen(false);
      }
      if (accountDropdownRef.current && !accountDropdownRef.current.contains(event.target)) {
        setIsAccountDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchStoreCatalog = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/products/public/store/${companyCode}`);
      if (res?.success && res?.data) {
        setStoreData(res.data);
      } else if (res?.data) {
        setStoreData(res.data);
      } else {
        setError('Store catalog currently unavailable.');
      }
    } catch (err) {
      setError(err?.message || `Store with code "${companyCode}" not found.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (companyCode) {
      fetchStoreCatalog();
    }
  }, [companyCode]);

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    if (!storeData?.products) return [];
    let list = storeData.products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.product_code && p.product_code.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCat =
        selectedCategory === 'ALL' ||
        (p.category && p.category.name === selectedCategory) ||
        (p.category_id && String(p.category_id) === String(selectedCategory));

      return matchesSearch && matchesCat;
    });

    if (sortBy === 'PRICE_LOW') {
      list = [...list].sort((a, b) => parseFloat(a.selling_price || 0) - parseFloat(b.selling_price || 0));
    } else if (sortBy === 'PRICE_HIGH') {
      list = [...list].sort((a, b) => parseFloat(b.selling_price || 0) - parseFloat(a.selling_price || 0));
    } else if (sortBy === 'NAME_ASC') {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    }

    return list;
  }, [storeData, searchQuery, selectedCategory, sortBy]);

  // Strict stock evaluator - prevents showing 'In Stock' if current stock is 0
  const isProductInStock = (prod) => {
    if (!prod) return false;
    if (prod.inStock === false) return false;
    if (prod.availableStock !== undefined && Number(prod.availableStock) <= 0) return false;
    if (prod.inStock === true) return true;
    if (prod.availableStock !== undefined && Number(prod.availableStock) > 0) return true;
    return false;
  };

  // Cart Actions
  const addToCart = (product) => {
    const isAvailable = isProductInStock(product);
    if (!isAvailable) {
      toast.error(`"${product.name}" is currently out of stock.`, { autoClose: 2000 });
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        if (product.availableStock !== undefined && existing.quantity >= Number(product.availableStock)) {
          toast.warning(`Cannot add more than available stock (${product.availableStock} available).`);
          return prev;
        }
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      const rawTax = product.tax_rate !== undefined && product.tax_rate !== null ? product.tax_rate : product.taxRate;
      const parsedTax = rawTax !== undefined && rawTax !== null && !isNaN(parseFloat(rawTax)) ? parseFloat(rawTax) : 0;
      return [
        ...prev,
        {
          id: product.id,
          productId: product.id,
          productCode: product.product_code,
          name: product.name,
          unitPrice: parseFloat(product.selling_price) || 0,
          purchasePrice: parseFloat(product.purchase_price) || 0,
          taxRate: parsedTax,
          unit: product.unit || 'PCS',
          quantity: 1,
          availableStock: product.availableStock !== undefined ? Number(product.availableStock) : 999,
          imageUrl: product.image_url
        }
      ];
    });
    toast.success(`Added ${product.name} to bag`, { autoClose: 1200 });
  };

  const updateQuantity = (productId, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === productId) {
            const newQty = item.quantity + delta;
            if (delta > 0 && item.availableStock !== undefined && newQty > item.availableStock) {
              toast.warning(`Maximum available stock is ${item.availableStock}`);
              return item;
            }
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  // Cart Financials with Dynamic Tax Calculation per product
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  }, [cart]);

  const cartTax = useMemo(() => {
    return cart.reduce((sum, item) => {
      const rate = typeof item.taxRate === 'number' ? item.taxRate : (parseFloat(item.taxRate) || 0);
      return sum + (item.unitPrice * item.quantity * (rate / 100));
    }, 0);
  }, [cart]);

  const effectiveTaxPercent = useMemo(() => {
    if (cartSubtotal <= 0) return 0;
    return parseFloat(((cartTax / cartSubtotal) * 100).toFixed(1));
  }, [cartTax, cartSubtotal]);

  const deliveryFee = useMemo(() => {
    if (customer.deliveryType === 'PICKUP') return 0;
    return cartSubtotal >= 499 ? 0 : 49;
  }, [cartSubtotal, customer.deliveryType]);

  const cartGrandTotal = Math.round(cartSubtotal + cartTax + deliveryFee);
  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Cash change calculations
  const tenderedNum = parseFloat(cashTendered) || 0;
  const changeDue = Math.max(0, tenderedNum - cartGrandTotal);
  const shortage = Math.max(0, cartGrandTotal - tenderedNum);

  // Place Order Handler with Cash Tender and Razorpay UPI support
  const submitOrder = async (orderOverrides = {}) => {
    try {
      setPlacingOrder(true);
      const chosenMethod = orderOverrides.paymentMethod || customer.paymentMethod || 'CASH';
      const isCash = chosenMethod === 'CASH' || chosenMethod === 'COD';

      let isPaid = false;
      let paidAmount = 0;

      if (orderOverrides.isPaid !== undefined) {
        isPaid = orderOverrides.isPaid;
        paidAmount = orderOverrides.paidAmount !== undefined ? orderOverrides.paidAmount : (isPaid ? cartGrandTotal : 0);
      } else if (isCash) {
        isPaid = Boolean(isPaidAtCounter || (tenderedNum >= cartGrandTotal && tenderedNum > 0));
        paidAmount = isPaid ? cartGrandTotal : 0;
      }

      const payload = {
        companyCode: companyCode.toUpperCase(),
        customerName: customer.name.trim(),
        customerPhone: customer.phone.trim(),
        customerEmail: customer.email ? customer.email.trim() : null,
        customerAddress: customer.deliveryType === 'DELIVERY' ? customer.address : 'Store Counter Pickup',
        paymentMethod: chosenMethod === 'UPI' ? 'UPI' : 'CASH',
        isPaid,
        paidAmount,
        paymentReference: orderOverrides.paymentReference || (isCash ? (tenderedNum > 0 ? `CASH_TENDER_₹${tenderedNum}` : null) : null),
        cashTendered: isCash ? tenderedNum : 0,
        changeReturned: isCash ? changeDue : 0,
        items: cart.map((item) => ({
          productId: item.id,
          productCode: item.productCode,
          productName: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          purchasePrice: item.purchasePrice,
          taxRate: item.taxRate
        })),
        notes: `Online Storefront Order (${customer.deliveryType})${isCash && tenderedNum > 0 ? ` | Tendered: ₹${tenderedNum}, Change: ₹${changeDue}` : ''}${orderOverrides.paymentReference ? ` | Ref: ${orderOverrides.paymentReference}` : ''}`
      };

      const res = await api.post('/sales/public/order', payload);
      const orderRes = res?.data || res;

      setOrderSuccess(orderRes);
      setCart([]);
      setIsCartOpen(false);
      toast.success(isPaid ? 'Payment received & Order placed successfully!' : 'Order placed successfully!');
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to place order. Please try again.');
    } finally {
      setPlacingOrder(false);
    }
  };

  // Customer Authentication Handlers
  const handleCustomerRegister = async (e) => {
    if (e) e.preventDefault();
    setAuthError('');

    if (!authFormData.name?.trim() || !authFormData.phone?.trim() || !authFormData.password) {
      const msg = 'Please fill in Full Name, Mobile Number, and Password';
      setAuthError(msg);
      toast.warn(msg);
      return;
    }

    if (authFormData.password !== authFormData.confirmPassword) {
      const msg = 'Passwords do not match. Please verify both password fields.';
      setAuthError(msg);
      toast.error(msg);
      return;
    }

    if (authFormData.password.length < 6) {
      const msg = 'Password must be at least 6 characters long';
      setAuthError(msg);
      toast.warn(msg);
      return;
    }

    const cleanPhone = authFormData.phone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      const msg = 'Please enter a valid 10-digit mobile number';
      setAuthError(msg);
      toast.warn(msg);
      return;
    }

    try {
      setAuthLoading(true);
      const res = await api.post('/sales/public/customer/register', {
        companyCode: companyCode.toUpperCase(),
        name: authFormData.name.trim(),
        phone: cleanPhone,
        email: authFormData.email?.trim() || null,
        password: authFormData.password,
        address: ''
      });
      const data = res?.data || res;
      setCustomerUser(data.customer);
      setCustomerToken(data.token);
      try {
        const codeKey = companyCode.toUpperCase();
        localStorage.setItem(`stockpilot_customer_token_${codeKey}`, data.token);
        localStorage.setItem(`stockpilot_customer_user_${codeKey}`, JSON.stringify(data.customer));
      } catch (e) {}

      setCustomer((prev) => ({
        ...prev,
        name: data.customer.name,
        phone: data.customer.phone,
        email: data.customer.email || prev.email,
        address: data.customer.address || prev.address
      }));
      setIsAuthModalOpen(false);
      setAuthFormData({ name: '', phone: '', email: '', password: '', confirmPassword: '' });
      toast.success(`Account created successfully! Welcome to ${storeTitle}, ${data.customer.name}!`);
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Registration failed. Mobile may already be registered.';
      setAuthError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleCustomerLogin = async (e) => {
    if (e) e.preventDefault();
    setAuthError('');

    if (!authFormData.phone?.trim() || !authFormData.password) {
      const msg = 'Please enter your Mobile Number / Email and Password';
      setAuthError(msg);
      toast.warn(msg);
      return;
    }

    try {
      setAuthLoading(true);
      const res = await api.post('/sales/public/customer/login', {
        companyCode: companyCode.toUpperCase(),
        identifier: authFormData.phone.trim(),
        password: authFormData.password
      });
      const data = res?.data || res;
      setCustomerUser(data.customer);
      setCustomerToken(data.token);
      try {
        const codeKey = companyCode.toUpperCase();
        localStorage.setItem(`stockpilot_customer_token_${codeKey}`, data.token);
        localStorage.setItem(`stockpilot_customer_user_${codeKey}`, JSON.stringify(data.customer));
      } catch (e) {}

      setCustomer((prev) => ({
        ...prev,
        name: data.customer.name,
        phone: data.customer.phone,
        email: data.customer.email || prev.email,
        address: data.customer.address || prev.address
      }));
      setIsAuthModalOpen(false);
      setAuthFormData({ name: '', phone: '', email: '', password: '', confirmPassword: '' });
      toast.success(`Welcome back, ${data.customer.name}!`);
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Invalid credentials. Please verify your phone/email and password.';
      setAuthError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleCustomerLogout = () => {
    try {
      const codeKey = companyCode.toUpperCase();
      localStorage.removeItem(`stockpilot_customer_token_${codeKey}`);
      localStorage.removeItem(`stockpilot_customer_user_${codeKey}`);
      localStorage.removeItem(`stockpilot_customer_${codeKey}`);
    } catch (e) {}
    setCustomerUser(null);
    setCustomerToken('');
    setIsCustomerAccountOpen(false);
    setIsAccountDropdownOpen(false);
    toast.info('Logged out from store account');
  };

  const handleSaveCustomerProfile = async (e) => {
    if (e) e.preventDefault();
    if (!companyCode || !customerUser) return;
    try {
      setIsSavingProfile(true);
      const res = await api.put('/sales/public/customer/profile', {
        companyCode: companyCode.toUpperCase(),
        customerId: customerUser.id,
        phone: customerUser.phone,
        name: profileForm.name,
        email: profileForm.email,
        address: profileForm.address
      });
      if (res?.success && res?.data) {
        const updated = res.data;
        const mergedUser = { ...customerUser, ...updated };
        setCustomerUser(mergedUser);
        const codeKey = companyCode.toUpperCase();
        localStorage.setItem(`stockpilot_customer_user_${codeKey}`, JSON.stringify(mergedUser));
        setCustomer((prev) => ({
          ...prev,
          name: updated.name || prev.name,
          email: updated.email || prev.email,
          address: updated.address || prev.address
        }));
        toast.success('Your profile and delivery address have been updated successfully!');
      } else {
        toast.error(res?.message || 'Failed to update profile');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleFetchCustomerOrders = async (targetPhone) => {
    const phoneToQuery = targetPhone || customerUser?.phone || customer.phone;
    if (!phoneToQuery) return;
    try {
      setLoadingOrders(true);
      const res = await api.get(`/sales/public/customer/orders?companyCode=${companyCode.toUpperCase()}&phone=${phoneToQuery}`);
      const list = res?.data || res || [];
      setCustomerOrders(Array.isArray(list) ? list : []);
    } catch (err) {
      console.warn('Orders fetch error:', err.message);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleTrackOrder = async (inv) => {
    const rawCode = inv || trackingInvoiceInput;
    if (!rawCode || !rawCode.trim()) {
      toast.warn('Please enter an invoice number to track');
      return;
    }
    const cleanCode = rawCode.trim().replace(/^#+/, '').trim();
    try {
      setIsTrackingLoading(true);
      const res = await api.get(`/sales/public/order/track/${encodeURIComponent(cleanCode)}?companyCode=${companyCode.toUpperCase()}`);
      const rawData = res?.data || res;
      const payload = rawData?.data || rawData;
      if (payload?.order) {
        setTrackingOrderData({
          ...payload.order,
          timeline: payload.order.timeline || payload.timeline
        });
        setIsTrackingModalOpen(true);
      } else if (payload?.invoiceNumber) {
        setTrackingOrderData(payload);
        setIsTrackingModalOpen(true);
      } else {
        toast.error('Order not found. Please check invoice number.');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Unable to track order');
    } finally {
      setIsTrackingLoading(false);
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      toast.warn('Your bag is empty.');
      return;
    }
    const cleanPhone = (customer.phone || '').replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10) {
      toast.warn('Please provide a valid 10-digit mobile number for order dispatch updates.');
      return;
    }
    if (!customer.name?.trim()) {
      toast.warn('Please provide your Full Name.');
      return;
    }
    if (customer.deliveryType === 'DELIVERY' && !customer.address?.trim()) {
      toast.warn('Please provide your complete Delivery Address.');
      return;
    }

    if (customer.paymentMethod === 'UPI') {
      try {
        setPlacingOrder(true);
        await openRazorpayCheckout({
          amount: cartGrandTotal,
          companyName: storeData?.tenant?.companyName || 'StockPilot Store',
          description: `Order Payment (${customer.name})`,
          userEmail: customer.email,
          userPhone: customer.phone,
          themeColor: primaryColor,
          onSuccess: async (rzpResponse) => {
            await submitOrder({
              paymentMethod: 'UPI',
              isPaid: true,
              paidAmount: cartGrandTotal,
              paymentReference: rzpResponse.razorpay_payment_id || `RZP_${Date.now()}`
            });
          },
          onDismiss: (err) => {
            setPlacingOrder(false);
            if (err?.description) {
              toast.warn(`Payment dismissed: ${err.description}`);
            } else {
              toast.info('Payment window closed. You can complete payment or choose Cash.');
            }
          }
        });
      } catch (err) {
        setPlacingOrder(false);
        toast.error(err.message || 'Razorpay checkout initialization failed.');
      }
    } else {
      // Cash payment
      await submitOrder({ paymentMethod: 'CASH' });
    }
  };

  const scrollToCatalog = () => {
    if (catalogRef.current) {
      catalogRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const storeConfig = storeData?.storeConfig || {};
  const heroConfig = storeConfig.hero || {};
  const sectionsConfig = storeConfig.sections || {};
  const productsSection = storeConfig.productsSection || {};
  const testimonials = storeConfig.testimonials || {};
  const contactConfig = storeConfig.contact || {};
  const allReviews = testimonials.reviews || [];

  // Dynamic Modular Sections Normalization (Backward compatibility for legacy stores) - Must run before any conditional returns
  const dynamicSections = useMemo(() => {
    if (!storeData) return [];
    if (Array.isArray(storeConfig.sections) && storeConfig.sections.length > 0) {
      return storeConfig.sections.filter((s) => s.enabled !== false);
    }
    // Backward compatibility fallback for existing stores
    const legacy = [];
    if (heroConfig.enabled !== false) {
      legacy.push({ id: 'sec-hero', type: 'HERO_BANNER', enabled: true, data: heroConfig });
    }
    if (sectionsConfig.trustBadgesEnabled !== false) {
      legacy.push({ id: 'sec-trust', type: 'TRUST_BADGES', enabled: true, data: { badges: storeConfig.trustBadges } });
    }
    legacy.push({ id: 'sec-catalog', type: 'PRODUCT_GRID', enabled: true, data: productsSection });
    if (testimonials.enabled !== false && allReviews.length > 0) {
      legacy.push({ id: 'sec-testimonials', type: 'TESTIMONIALS', enabled: true, data: testimonials });
    }
    if (contactConfig.enabled !== false) {
      legacy.push({ id: 'sec-contact', type: 'CONTACT_MAP', enabled: true, data: contactConfig });
    }
    return legacy;
  }, [storeData, storeConfig, heroConfig, sectionsConfig, productsSection, testimonials, contactConfig, allReviews]);

  if (loading) {
    return (
      <div className="clean-store-loading">
        <Loader2 size={36} className="spinner text-primary" />
        <p>Loading {companyCode?.toUpperCase()} Storefront...</p>
      </div>
    );
  }

  if (error || !storeData) {
    return (
      <div className="clean-store-error">
        <Store size={44} className="text-muted" />
        <h2>Store Not Found</h2>
        <p>{error || `We couldn't find a storefront with code "${companyCode}".`}</p>
        <Link to="/" className="btn-clean-primary">
          Go to StockPilot Home
        </Link>
      </div>
    );
  }

  const { tenant, categories = [], products = [] } = storeData;
  const branding = storeConfig.branding || {};
  const navbarConfig = storeConfig.navbar || {};
  const footerConfig = storeConfig.footer || {};

  const storeTitle = branding.storeName || tenant?.companyName || tenant?.company_name || 'Retail Store';
  const tagline = branding.tagline || 'Verified In-Stock Quality Products';
  const rawPhone = contactConfig.whatsappNumber || contactConfig.phone || tenant?.phone || '';
  const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
  const whatsappUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
        contactConfig.whatsappMessage || `Hello ${storeTitle}, I have an inquiry regarding your products.`
      )}`
    : null;

  const primaryColor = branding.primaryColor || '#982A86';
  const accentColor = branding.accentColor || '#10b981';
  const bgColor = branding.bgColor || '#ffffff';
  const cardColor = branding.cardColor || '#ffffff';
  const textColor = branding.textColor || '#0f172a';

  // Testimonials Carousel Slice (3 per view)
  const maxTestimonialIndex = Math.max(0, allReviews.length - 3);
  const visibleReviews = allReviews.length <= 3 
    ? allReviews 
    : allReviews.slice(testimonialIndex, testimonialIndex + 3);

  const handlePrevTestimonials = () => {
    setTestimonialIndex((prev) => (prev > 0 ? prev - 1 : maxTestimonialIndex));
  };

  const handleNextTestimonials = () => {
    setTestimonialIndex((prev) => (prev < maxTestimonialIndex ? prev + 1 : 0));
  };

  // Dynamic Navigation Links
  const defaultNavLinks = [
    { id: '1', label: 'Home', url: '#home', enabled: true },
    { id: '2', label: 'Products', url: '#products', enabled: true },
    { id: '3', label: 'About', url: '#about', enabled: true },
    { id: '4', label: 'Testimonials', url: '#testimonials', enabled: true },
    { id: '5', label: 'Contact', url: '#contact', enabled: true }
  ];
  const navLinks = Array.isArray(navbarConfig.navLinks) ? navbarConfig.navLinks : defaultNavLinks;

  const activeSortOption = SORT_OPTIONS.find((opt) => opt.value === sortBy) || SORT_OPTIONS[0];

  // Enterprise Storefront Section Renderer for all 12 Modular Blocks
  const renderDynamicStorefrontSection = (sec) => {
    if (!sec || sec.enabled === false) return null;
    const sData = sec.data || {};

    switch (sec.type) {
      case 'HERO_BANNER': {
        const pattern = sData.pattern || heroConfig.pattern || 'SPLIT';
        const heroTitle = sData.title || `Welcome to ${storeTitle}`;
        const heroSubtitle = sData.subtitle || tagline;
        const heroBadge = sData.badge || 'Official Online Store';
        const heroCta = sData.ctaText || 'Explore Catalog';
        const heroImg = sData.imageUrl || heroConfig.imageUrl || 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=1600&q=80';

        if (pattern === 'CAROUSEL') {
          const slides = sData.slides && sData.slides.length > 0 ? sData.slides : (
            heroConfig.slides && heroConfig.slides.length > 0 ? heroConfig.slides : [
              {
                id: 'slide-1',
                badge: heroBadge,
                title: heroTitle,
                subtitle: heroSubtitle,
                ctaText: heroCta,
                ctaUrl: '#products',
                imageUrl: heroImg
              }
            ]
          );
          const currentSlide = slides[activeHeroSlideIndex % slides.length] || slides[0];
          return (
            <section
              key={sec.id}
              id="home"
              className="clean-hero-carousel-pattern"
              style={{
                backgroundImage: currentSlide.imageUrl
                  ? `linear-gradient(180deg, rgba(15, 23, 42, 0.70) 0%, rgba(15, 23, 42, 0.86) 60%, rgba(15, 23, 42, 0.98) 85%, #0f172a 100%), url('${currentSlide.imageUrl}')`
                  : `linear-gradient(135deg, ${primaryColor}22 0%, #0f172a 100%)`
              }}
            >
              <div className="clean-hero-content-wrapper">
                {currentSlide.badge && (
                  <div className="clean-hero-badge-pill" style={{ color: '#34d399' }}>
                    <span className="badge-bullet" />
                    {currentSlide.badge}
                  </div>
                )}
                <h2 className="clean-hero-giant-title">{currentSlide.title || heroTitle}</h2>
                <p className="clean-hero-description">{currentSlide.subtitle || heroSubtitle}</p>
                <div className="clean-hero-actions-row">
                  <button
                    onClick={scrollToCatalog}
                    className="btn-hero-primary"
                    style={{ background: primaryColor }}
                  >
                    {currentSlide.ctaText || heroCta}
                    <ArrowRight size={17} />
                  </button>
                  {whatsappUrl && (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-hero-whatsapp"
                    >
                      <WhatsAppBrandIcon size={18} color="#25D366" />
                      <span>Contact Store</span>
                    </a>
                  )}
                </div>
              </div>

              {slides.length > 1 && (
                <div className="hero-carousel-controls-overlay">
                  <button
                    type="button"
                    className="btn-carousel-arrow prev"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveHeroSlideIndex((prev) => (prev > 0 ? prev - 1 : slides.length - 1));
                    }}
                    aria-label="Previous Slide"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <div className="hero-carousel-dots">
                    {slides.map((_, sIdx) => (
                      <button
                        key={sIdx}
                        type="button"
                        className={`hero-dot ${sIdx === (activeHeroSlideIndex % slides.length) ? 'active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveHeroSlideIndex(sIdx);
                        }}
                        aria-label={`Go to slide ${sIdx + 1}`}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    className="btn-carousel-arrow next"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveHeroSlideIndex((prev) => (prev < slides.length - 1 ? prev + 1 : 0));
                    }}
                    aria-label="Next Slide"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
            </section>
          );
        }

        if (pattern === 'SPLIT') {
          return (
            <section key={sec.id} id="home" className="clean-hero-split-pattern">
              <div className="hero-split-left-content">
                {heroBadge && (
                  <div className="clean-hero-badge-pill" style={{ color: primaryColor, background: `${primaryColor}15` }}>
                    <span className="badge-bullet" style={{ background: primaryColor }} />
                    {heroBadge}
                  </div>
                )}
                <h2 className="clean-hero-giant-title">{heroTitle}</h2>
                <p className="clean-hero-description">{heroSubtitle}</p>
                <div className="clean-hero-actions-row">
                  <button
                    onClick={scrollToCatalog}
                    className="btn-hero-primary"
                    style={{ background: primaryColor }}
                  >
                    {heroCta}
                    <ArrowRight size={17} />
                  </button>
                  {whatsappUrl && (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-hero-whatsapp"
                    >
                      <WhatsAppBrandIcon size={18} color="#25D366" />
                      <span>Contact Store</span>
                    </a>
                  )}
                </div>
              </div>
              <div className="hero-split-right-visual">
                <div className="hero-product-showcase-frame">
                  <img
                    src={heroImg}
                    alt={heroTitle}
                    onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=1200&q=80'; }}
                  />
                  <div className="hero-floating-badge-card">
                    <ShieldCheck size={20} color="#10b981" />
                    <div>
                      <strong>100% Genuine Certified</strong>
                      <span>Direct Warehouse Dispatch</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          );
        }

        // CINEMATIC (Fullscreen centered)
        return (
          <section
            key={sec.id}
            id="home"
            className="clean-hero-fullscreen"
            style={{
              backgroundImage: heroImg
                ? `linear-gradient(rgba(15, 23, 42, 0.72), rgba(15, 23, 42, 0.88)), url('${heroImg}')`
                : `linear-gradient(135deg, ${primaryColor}22 0%, #0f172a 100%)`
            }}
          >
            <div className="clean-hero-content-wrapper">
              {heroBadge && (
                <div className="clean-hero-badge-pill" style={{ color: '#34d399' }}>
                  <span className="badge-bullet" />
                  {heroBadge}
                </div>
              )}
              <h2 className="clean-hero-giant-title">{heroTitle}</h2>
              <p className="clean-hero-description">{heroSubtitle}</p>
              <div className="clean-hero-actions-row">
                <button
                  onClick={scrollToCatalog}
                  className="btn-hero-primary"
                  style={{ background: primaryColor }}
                >
                  {heroCta}
                  <ArrowRight size={17} />
                </button>
                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-hero-whatsapp"
                  >
                    <WhatsAppBrandIcon size={18} color="#25D366" />
                    <span>Contact Store</span>
                  </a>
                )}
              </div>
            </div>
          </section>
        );
      }

      case 'TRUST_BADGES': {
        const badgesList = sData.badges || storeConfig.trustBadges || [
          { icon: 'Zap', title: 'Express Dispatch', desc: 'Fast doorstep delivery' },
          { icon: 'ShieldCheck', title: '100% Genuine', desc: 'Verified from authorized stock' },
          { icon: 'CreditCard', title: 'Flexible Payments', desc: 'UPI, Card & Cash on Delivery' },
          { icon: 'Phone', title: 'Direct Store Support', desc: 'Instant WhatsApp & Call help' }
        ];
        return (
          <section key={sec.id} id="about" className="clean-trust-strip-section" style={{ background: cardColor }}>
            <div className="clean-trust-strip-container">
              {badgesList.map((badge, idx) => (
                <div key={idx} className="clean-trust-item">
                  <ShieldCheck size={20} color={accentColor} />
                  <div>
                    <strong>{badge.title}</strong>
                    <span>{badge.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      }

      case 'FLASH_SALE': {
        const endsInText = sData.endsIn || 'Limited Time Promo';
        const saleBadge = sData.badge || 'FLASH DEAL';
        const saleTitle = sData.title || 'Super Saver Weekend Deals';
        const saleSubtitle = sData.subtitle || 'Exclusive direct discounts on handpicked catalog products. Don’t miss out!';
        const discountText = sData.discountText || 'UP TO 40% OFF';
        return (
          <section key={sec.id} className="clean-flashsale-banner" style={{ borderLeft: `4px solid ${primaryColor}` }}>
            <div className="clean-flashsale-content">
              <div className="clean-flashsale-info">
                <div className="clean-urgency-pill">
                  <Flame size={14} color="#ef4444" />
                  <span>{saleBadge}</span>
                  <span className="dot-divider">•</span>
                  <span>{endsInText}</span>
                </div>
                <h3>{saleTitle}</h3>
                <p>{saleSubtitle}</p>
                {discountText && (
                  <div className="clean-flashsale-tag">
                    <Tag size={13} /> {discountText}
                  </div>
                )}
              </div>
              <div className="clean-flashsale-action-box">
                <div className="clean-countdown-display">
                  <div className="countdown-unit">
                    <span className="countdown-num">{String(countdown.days).padStart(2, '0')}</span>
                    <span className="countdown-lbl">Days</span>
                  </div>
                  <span className="countdown-colon">:</span>
                  <div className="countdown-unit">
                    <span className="countdown-num">{String(countdown.hours).padStart(2, '0')}</span>
                    <span className="countdown-lbl">Hours</span>
                  </div>
                  <span className="countdown-colon">:</span>
                  <div className="countdown-unit">
                    <span className="countdown-num">{String(countdown.minutes).padStart(2, '0')}</span>
                    <span className="countdown-lbl">Mins</span>
                  </div>
                  <span className="countdown-colon">:</span>
                  <div className="countdown-unit">
                    <span className="countdown-num">{String(countdown.seconds).padStart(2, '0')}</span>
                    <span className="countdown-lbl">Secs</span>
                  </div>
                </div>
                <button
                  onClick={scrollToCatalog}
                  className="btn-flashsale-cta"
                  style={{ background: primaryColor }}
                >
                  <Zap size={15} />
                  <span>{sData.ctaText || 'Shop Deals Now'}</span>
                </button>
              </div>
            </div>
          </section>
        );
      }

      case 'PRODUCT_GRID': {
        return (
          <main key={sec.id} id="products" ref={catalogRef} className="clean-store-main">
            <div className="clean-section-header-row">
              <div>
                <h2 className="clean-section-title">
                  {sData.title || productsSection.title || 'Featured Catalog'}
                </h2>
                <p className="clean-section-subtitle">
                  {sData.subtitle || productsSection.subtitle || 'Browse all available products in real-time inventory'}
                </p>
              </div>

              <div className="clean-sort-wrapper" ref={sortDropdownRef}>
                <span className="clean-sort-label">Sort:</span>
                <div className="custom-dropdown-container">
                  <button
                    type="button"
                    className={`custom-sort-trigger ${isSortOpen ? 'active' : ''}`}
                    onClick={() => setIsSortOpen(!isSortOpen)}
                    aria-haspopup="listbox"
                    aria-expanded={isSortOpen}
                  >
                    <SlidersHorizontal size={14} className="sort-icon-prefix" />
                    <span className="sort-trigger-text">{activeSortOption.label}</span>
                    <ChevronDown size={15} className={`sort-chevron ${isSortOpen ? 'rotated' : ''}`} />
                  </button>

                  {isSortOpen && (
                    <div className="custom-sort-menu animate-popover" role="listbox">
                      {SORT_OPTIONS.map((option) => {
                        const isSelected = option.value === sortBy;
                        return (
                          <div
                            key={option.value}
                            role="option"
                            aria-selected={isSelected}
                            className={`custom-sort-item ${isSelected ? 'selected' : ''}`}
                            onClick={() => {
                              setSortBy(option.value);
                              setIsSortOpen(false);
                            }}
                          >
                            <span>{option.label}</span>
                            {isSelected && <Check size={15} className="sort-check-icon" />}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Controls: Search & Category Navigation */}
            <div className="clean-controls-bar">
              {sData.showSearch !== false && productsSection.showSearch !== false && (
                <div className="clean-search-input-wrap">
                  <Search size={16} className="clean-search-icon" />
                  <input
                    type="text"
                    placeholder="Search products, descriptions, codes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="clean-btn-clear">
                      <X size={14} />
                    </button>
                  )}
                </div>
              )}

              {sData.showCategories !== false && sectionsConfig.categoriesEnabled !== false && (
                <div className="clean-category-chips">
                  <button
                    onClick={() => setSelectedCategory('ALL')}
                    className={`clean-chip ${selectedCategory === 'ALL' ? 'active' : ''}`}
                    style={selectedCategory === 'ALL' ? { background: primaryColor } : {}}
                  >
                    All Items ({products.length})
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.name)}
                      className={`clean-chip ${selectedCategory === cat.name ? 'active' : ''}`}
                      style={selectedCategory === cat.name ? { background: primaryColor } : {}}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Grid / Clean Empty State */}
            {filteredProducts.length === 0 ? (
              <div className="clean-empty-state">
                <Package size={44} className="text-muted" />
                <h3>No products found</h3>
                <p>
                  {searchQuery
                    ? `No items matching "${searchQuery}".`
                    : 'This store currently has no active products listed in the catalog.'}
                </p>
              </div>
            ) : (
              <div className="clean-product-grid">
                {filteredProducts.map((prod) => {
                  const cartItem = cart.find((item) => item.id === prod.id);
                  const inStock = isProductInStock(prod);
                  const price = parseFloat(prod.selling_price || 0);

                  return (
                    <div key={prod.id} className="clean-product-card">
                      <div
                        className="clean-card-image-wrap"
                        onClick={() => setQuickViewProduct(prod)}
                      >
                        {prod.image_url ? (
                          <img src={prod.image_url} alt={prod.name} className="clean-product-img" />
                        ) : (
                          <div className="clean-no-image">
                            <Package size={36} />
                          </div>
                        )}
                        {prod.category?.name && (
                          <span className="clean-category-tag">{prod.category.name}</span>
                        )}
                        {(sData.showStockBadge !== false && productsSection.showStockBadge !== false) && (
                          <span className={`clean-stock-tag ${inStock ? 'in-stock' : 'out-stock'}`}>
                            {inStock ? 'In Stock' : 'Out of Stock'}
                          </span>
                        )}
                      </div>

                      <div className="clean-card-body">
                        <div className="clean-card-info">
                          <span className="clean-sku">{prod.product_code || `PRD-${prod.id}`}</span>
                          <h3
                            className="clean-product-name"
                            onClick={() => setQuickViewProduct(prod)}
                          >
                            {prod.name}
                          </h3>
                          {prod.description && (
                            <p className="clean-product-desc">{prod.description}</p>
                          )}
                        </div>

                        <div className="clean-card-footer">
                          <div className="clean-price-box">
                            <span className="clean-price">₹{price.toLocaleString('en-IN')}</span>
                            <span className="clean-tax-hint">incl. GST</span>
                          </div>

                          {cartItem ? (
                            <div className="clean-stepper">
                              <button
                                onClick={() => updateQuantity(prod.id, -1)}
                                className="clean-btn-step"
                                aria-label="Decrease"
                              >
                                <Minus size={13} />
                              </button>
                              <span className="clean-step-val">{cartItem.quantity}</span>
                              <button
                                onClick={() => updateQuantity(prod.id, 1)}
                                className="clean-btn-step"
                                aria-label="Increase"
                              >
                                <Plus size={13} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addToCart(prod)}
                              disabled={!inStock}
                              className="clean-btn-add"
                              style={{ background: primaryColor }}
                            >
                              <Plus size={14} /> Add
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        );
      }

      case 'PRODUCT_CAROUSEL': {
        const carouselTitle = sData.title || 'Trending Highlights';
        const carouselSubtitle = sData.subtitle || 'Top-selling picks delivered directly from our central inventory';
        const carouselProducts = products.slice(0, 10);
        return (
          <section key={sec.id} className="clean-carousel-section">
            <div className="clean-carousel-container">
              <div className="clean-carousel-header-row">
                <div>
                  <div className="clean-pill-tag" style={{ color: accentColor }}>
                    <Sparkles size={13} /> Curated Picks
                  </div>
                  <h2 className="clean-section-title">{carouselTitle}</h2>
                  <p className="clean-section-subtitle">{carouselSubtitle}</p>
                </div>
                <div className="clean-carousel-controls">
                  <button
                    onClick={() => scrollCarousel('left')}
                    className="btn-carousel-nav"
                    aria-label="Previous Products"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => scrollCarousel('right')}
                    className="btn-carousel-nav"
                    aria-label="Next Products"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>

              <div className="clean-carousel-track-container" ref={carouselTrackRef}>
                <div className="clean-carousel-track">
                  {carouselProducts.map((prod) => {
                    const cartItem = cart.find((item) => item.id === prod.id);
                    const inStock = isProductInStock(prod);
                    const price = parseFloat(prod.selling_price || 0);

                    return (
                      <div key={prod.id} className="clean-carousel-card">
                        <div
                          className="clean-card-image-wrap"
                          onClick={() => setQuickViewProduct(prod)}
                        >
                          {prod.image_url ? (
                            <img src={prod.image_url} alt={prod.name} className="clean-product-img" />
                          ) : (
                            <div className="clean-no-image">
                              <Package size={36} />
                            </div>
                          )}
                          {prod.category?.name && (
                            <span className="clean-category-tag">{prod.category.name}</span>
                          )}
                        </div>
                        <div className="clean-card-body">
                          <h4 onClick={() => setQuickViewProduct(prod)} className="clean-product-name">
                            {prod.name}
                          </h4>
                          <div className="clean-card-footer" style={{ marginTop: '0.6rem' }}>
                            <span className="clean-price">₹{price.toLocaleString('en-IN')}</span>
                            {cartItem ? (
                              <div className="clean-stepper">
                                <button onClick={() => updateQuantity(prod.id, -1)} className="clean-btn-step">
                                  <Minus size={12} />
                                </button>
                                <span className="clean-step-val">{cartItem.quantity}</span>
                                <button onClick={() => updateQuantity(prod.id, 1)} className="clean-btn-step">
                                  <Plus size={12} />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => addToCart(prod)}
                                disabled={!inStock}
                                className="clean-btn-add"
                                style={{ background: primaryColor }}
                              >
                                <Plus size={13} /> Add
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        );
      }

      case 'CATEGORY_TILES': {
        const catTiles = categories.length > 0 ? categories : [
          { id: '1', name: 'Apparel & Fashion' },
          { id: '2', name: 'Electronics & Audio' },
          { id: '3', name: 'Home & Kitchen' },
          { id: '4', name: 'Personal Care' }
        ];
        return (
          <section key={sec.id} className="clean-categories-tiles-section">
            <div className="clean-categories-tiles-container">
              <div className="clean-categories-header">
                <h2 className="clean-section-title">{sData.title || 'Explore by Category'}</h2>
                <p className="clean-section-subtitle">{sData.subtitle || 'Find exactly what you need with quick category filters'}</p>
              </div>
              <div className="clean-category-tiles-grid">
                {catTiles.map((cat, idx) => (
                  <div
                    key={cat.id || idx}
                    className="clean-category-tile-card"
                    onClick={() => {
                      setSelectedCategory(cat.name);
                      scrollToCatalog();
                    }}
                  >
                    <div className="category-tile-icon" style={{ background: `${primaryColor}15`, color: primaryColor }}>
                      <Layers size={22} />
                    </div>
                    <h4>{cat.name}</h4>
                    <span className="category-tile-badge">View Collection &rarr;</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      }

      case 'BRAND_STORY': {
        const storeBrand = config?.branding?.storeName || 'Our Store';
        const storyTitle = sData.title || `Crafted for ${storeBrand}`;
        const storyTag = sData.badge || 'OUR HERITAGE';
        const storyText = sData.narrative || `Founded with a clear vision: to bring authenticated, premium-grade products directly to our community at ${storeBrand}. Every single item in our inventory is inspected, certified, and dispatched from verified facilities to guarantee genuine quality.`;
        const storyImg = sData.imageUrl || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80';
        const floatingBadge = sData.floatingBadge || '100% Verified Origin';
        const point1Title = sData.point1Title || 'Direct Sourcing';
        const point1Desc = sData.point1Desc || 'Zero intermediaries, authentic inventory';
        const point2Title = sData.point2Title || 'Rapid Dispatch';
        const point2Desc = sData.point2Desc || 'Same-day verification and tracking updates';
        return (
          <section key={sec.id} id="story" className="clean-story-section">
            <div className="clean-story-container">
              <div className="clean-story-grid">
                <div className="clean-story-media-wrap">
                  <img src={storyImg} alt={storyTitle} />
                  <div className="clean-story-badge-floating" style={{ background: primaryColor }}>
                    <span>{floatingBadge}</span>
                  </div>
                </div>
                <div className="clean-story-content">
                  <div className="clean-pill-tag" style={{ color: primaryColor }}>{storyTag}</div>
                  <h2>{storyTitle}</h2>
                  <p className="clean-story-body-text">{storyText}</p>
                  <div className="clean-story-points">
                    <div className="clean-story-point-item">
                      <CheckCircle2 size={18} color={accentColor} />
                      <div>
                        <strong>{point1Title}</strong>
                        <span>{point1Desc}</span>
                      </div>
                    </div>
                    <div className="clean-story-point-item">
                      <CheckCircle2 size={18} color={accentColor} />
                      <div>
                        <strong>{point2Title}</strong>
                        <span>{point2Desc}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        );
      }

      case 'IMAGE_LOOKBOOK': {
        const lookbookTitle = sData.title || 'Store Showcase & Visual Lookbook';
        const lookbookSub = sData.subtitle || 'Step inside our store atmosphere and curated collections';
        const items = sData.items || [
          {
            imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80',
            caption: 'Flagship Store Experience'
          },
          {
            imageUrl: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=800&q=80',
            caption: 'Handcrafted Quality'
          },
          {
            imageUrl: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&w=800&q=80',
            caption: 'Latest Season Arrivals'
          }
        ];
        return (
          <section key={sec.id} className="clean-lookbook-section">
            <div className="clean-lookbook-container">
              <div className="clean-lookbook-header">
                <h2 className="clean-section-title">{lookbookTitle}</h2>
                <p className="clean-section-subtitle">{lookbookSub}</p>
              </div>
              <div className="clean-lookbook-grid">
                {items.map((item, idx) => (
                  <div key={idx} className="clean-lookbook-item">
                    <img src={item.imageUrl} alt={item.caption || `Lookbook ${idx + 1}`} />
                    {item.caption && (
                      <div className="clean-lookbook-overlay">
                        <span>{item.caption}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      }

      case 'TESTIMONIALS': {
        const reviewList = sData.reviews || testimonials.reviews || [];
        if (reviewList.length === 0) return null;
        const visibleRev = reviewList.length <= 3 ? reviewList : reviewList.slice(testimonialIndex, testimonialIndex + 3);

        return (
          <section key={sec.id} id="testimonials" className="clean-testimonials-section">
            <div className="clean-testimonials-container">
              <div className="clean-section-header-carousel">
                <div>
                  <div className="clean-pill-tag" style={{ color: accentColor }}>
                    Verified Buyer Feedback
                  </div>
                  <h2 className="clean-section-title">
                    {sData.title || testimonials.title || 'What Our Customers Say'}
                  </h2>
                  <p className="clean-section-subtitle">
                    {sData.subtitle || testimonials.subtitle || 'Real feedback from verified buyers across India'}
                  </p>
                </div>

                {reviewList.length > 3 && (
                  <div className="clean-carousel-controls">
                    <button onClick={handlePrevTestimonials} className="btn-carousel-nav" aria-label="Previous Testimonials">
                      <ChevronLeft size={18} />
                    </button>
                    <button onClick={handleNextTestimonials} className="btn-carousel-nav" aria-label="Next Testimonials">
                      <ChevronRight size={18} />
                    </button>
                  </div>
                )}
              </div>

              <div className="clean-reviews-grid-3">
                {visibleRev.map((rev, idx) => (
                  <div key={rev.id || idx} className="clean-review-card">
                    <div className="clean-review-header-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.4rem' }}>
                      <div className="clean-review-stars">
                        {[...Array(rev.rating || 5)].map((_, s) => (
                          <Star key={s} size={14} fill="#f59e0b" color="#f59e0b" />
                        ))}
                      </div>
                      <span className="review-verified-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '0.68rem', fontWeight: 700, color: '#059669', background: '#ecfdf5', padding: '0.15rem 0.45rem', borderRadius: '999px', border: '1px solid #a7f3d0' }}>
                        <CheckCircle2 size={11} color="#10b981" /> Verified
                      </span>
                    </div>
                    <p className="clean-review-comment">"{rev.comment}"</p>
                    <div className="clean-reviewer-meta">
                      <div className="clean-reviewer-avatar" style={{ background: primaryColor }}>
                        {rev.name ? rev.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <strong>{rev.name}</strong>
                        <span>{rev.location || 'Verified Buyer'} • {rev.role || 'Direct Customer'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      }

      case 'FAQ_ACCORDION': {
        const faqList = sData.faqs || [
          { q: 'How long does delivery take?', a: 'Standard deliveries are dispatched within 24 hours and typically reach your address within 2-4 business days.' },
          { q: 'What payment methods do you accept?', a: 'We accept instant UPI (Google Pay, PhonePe, Paytm), Credit & Debit Cards, Netbanking via Razorpay, and Cash on Delivery.' },
          { q: 'Are all products 100% genuine?', a: 'Yes! All inventory in our catalog is backed by verified direct stock, checked before dispatch, and covered with GST invoices.' },
          { q: 'Can I track my order on WhatsApp?', a: 'Absolutely. Immediately after placing your order, you can confirm via WhatsApp to receive tracking updates directly on your chat.' }
        ];
        return (
          <section key={sec.id} id="faq" className="clean-faq-section">
            <div className="clean-faq-container">
              <div className="clean-faq-header">
                <div className="clean-pill-tag" style={{ color: primaryColor }}>
                  <HelpCircle size={13} /> Questions & Answers
                </div>
                <h2 className="clean-section-title">{sData.title || 'Frequently Asked Questions'}</h2>
                <p className="clean-section-subtitle">{sData.subtitle || 'Everything you need to know about purchasing, shipping, and returns'}</p>
              </div>
              <div className="clean-faq-list">
                {faqList.map((item, idx) => {
                  const isOpen = !!openFaqKeys[idx];
                  return (
                    <div key={idx} className={`clean-faq-item ${isOpen ? 'active' : ''}`}>
                      <button
                        type="button"
                        onClick={() => toggleFaq(idx)}
                        className="clean-faq-question-btn"
                        aria-expanded={isOpen}
                      >
                        <span>{item.q}</span>
                        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                      {isOpen && (
                        <div className="clean-faq-answer">
                          <p>{item.a}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        );
      }

      case 'NEWSLETTER_BAR': {
        const couponCode = sData.couponCode || 'FIRST10';
        return (
          <section key={sec.id} className="clean-newsletter-bar-section">
            <div className="clean-newsletter-card" style={{ borderLeft: `4px solid ${primaryColor}` }}>
              <div className="clean-newsletter-info">
                <div className="clean-pill-tag" style={{ color: accentColor }}>
                  <Sparkles size={13} /> Exclusive Customer Offer
                </div>
                <h3>{sData.title || 'Unlock 10% Off Your Next Purchase'}</h3>
                <p>{sData.subtitle || 'Use this special coupon code during checkout to enjoy an instant discount on all orders.'}</p>
              </div>
              <div className="clean-coupon-pill-wrap">
                <button
                  type="button"
                  onClick={() => handleCopyCode(couponCode)}
                  className="clean-coupon-pill"
                >
                  <Tag size={15} />
                  <span>{couponCode}</span>
                  <span className="copy-label">{copiedPromoCode ? 'Copied!' : 'Click to Copy'}</span>
                </button>
              </div>
            </div>
          </section>
        );
      }

      case 'CONTACT_MAP': {
        return (
          <section key={sec.id} id="contact" className="clean-contact-map-section" style={{ background: cardColor }}>
            <div className="clean-contact-card-container">
              <div className="clean-contact-header">
                <h2 className="clean-section-title">{sData.title || contactConfig.title || 'Visit Our Store & Contact'}</h2>
                <p className="clean-section-subtitle">{sData.subtitle || contactConfig.subtitle || 'Reach out directly for inquiries, custom orders, or customer support'}</p>
              </div>
              <div className="clean-contact-grid-modern">
                <div className="clean-contact-info-card">
                  <div className="clean-contact-icon-box" style={{ background: `${primaryColor}15`, color: primaryColor }}>
                    <MapPin size={22} />
                  </div>
                  <div>
                    <h4>Store Address</h4>
                    <p>{sData.address || contactConfig.address || tenant?.address || 'Retail Center, Commercial Street'}</p>
                  </div>
                </div>

                <div className="clean-contact-info-card">
                  <div className="clean-contact-icon-box" style={{ background: `${primaryColor}15`, color: primaryColor }}>
                    <Clock size={22} />
                  </div>
                  <div>
                    <h4>Operating Hours</h4>
                    <p>{sData.hours || contactConfig.hours || 'Mon - Sat: 9:00 AM - 9:00 PM'}</p>
                  </div>
                </div>

                <div className="clean-contact-info-card">
                  <div className="clean-contact-icon-box" style={{ background: `${primaryColor}15`, color: primaryColor }}>
                    <Phone size={22} />
                  </div>
                  <div>
                    <h4>Direct Contact</h4>
                    <p>{sData.phone || contactConfig.phone || tenant?.phone || 'Direct Line Available'}</p>
                    <p style={{ fontSize: '0.8rem', color: '#64748b' }}>{sData.email || contactConfig.email || tenant?.email || ''}</p>
                  </div>
                </div>

                {whatsappUrl && (
                  <div className="clean-contact-info-card whatsapp-special">
                    <div className="clean-contact-icon-box" style={{ background: '#25D36622' }}>
                      <WhatsAppBrandIcon size={24} color="#25D366" />
                    </div>
                    <div>
                      <h4>Instant WhatsApp Chat</h4>
                      <p>Chat directly with store operators for fast assistance.</p>
                      <a href={whatsappUrl} target="_blank" rel="noreferrer" className="btn-clean-whatsapp" style={{ marginTop: '0.5rem' }}>
                        <WhatsAppBrandIcon size={16} color="#25D366" />
                        <span>Chat Now</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div
      className="clean-storefront-wrapper"
      style={{
        '--store-primary': primaryColor,
        '--store-accent': accentColor,
        '--store-bg': bgColor,
        '--store-card': cardColor,
        '--store-text-main': textColor
      }}
    >
      {/* 1. Header & Navbar (Customer-Facing with 3-Zone Architecture & Responsive Drawer) */}
      <header className="clean-store-header">
        <div className="clean-header-container">
          {/* ZONE 1 (LEFT): Brand Identity & Store Name */}
          <div className="clean-brand-section">
            <div className="clean-brand-avatar" style={{ background: branding.logoUrl ? 'transparent' : primaryColor }}>
              {branding.logoUrl ? (
                <img
                  src={branding.logoUrl}
                  alt={storeTitle}
                  style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '12px' }}
                />
              ) : (
                <Store size={22} />
              )}
            </div>
            <div>
              <h1 className="clean-store-title">{storeTitle}</h1>
              {navbarConfig.showAddress !== false && (contactConfig.address || tenant.address) && (
                <div className="clean-store-meta">
                  <span>
                    <MapPin size={12} /> {contactConfig.address || tenant.address}
                  </span>
                  {navbarConfig.showPhone !== false && (contactConfig.phone || tenant.phone) && (
                    <span>
                      <Phone size={12} /> {contactConfig.phone || tenant.phone}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ZONE 2 (CENTER): Desktop Single-Row Navigation Menu */}
          {navLinks && navLinks.length > 0 && (
            <nav className="clean-nav-menu desktop-only">
              {navLinks
                .filter((link) => link.enabled !== false)
                .map((link) => (
                  <a
                    key={link.id || link.label}
                    href={link.url || '#'}
                    onClick={(e) => {
                      if (link.url?.startsWith('#')) {
                        e.preventDefault();
                        if (link.url === '#home') {
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                          return;
                        }
                        const target = document.querySelector(link.url);
                        if (target) {
                          target.scrollIntoView({ behavior: 'smooth' });
                        }
                      }
                    }}
                    className="clean-nav-link"
                  >
                    {link.label}
                  </a>
                ))}
            </nav>
          )}

          {/* ZONE 3 (RIGHT): Search & Header Action Pills */}
          <div className="clean-header-actions">
            {/* Search bar in Navbar (Desktop & Tablet only) */}
            {navbarConfig.showSearch !== false && (
              <div className="clean-nav-search-bar desktop-tablet-only">
                <Search size={15} color="#94a3b8" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search catalog..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      scrollToCatalog();
                    }
                  }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="clean-nav-search-clear"
                    aria-label="Clear search"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            )}

            {/* Live Order Tracking Trigger - Only shown for signed-in customers */}
            {customerUser && (
              <button
                type="button"
                onClick={() => {
                  setIsTrackingModalOpen(true);
                }}
                className="btn-clean-track-nav desktop-only"
                title="Track Order Status"
              >
                <Truck size={16} />
                <span>Track</span>
              </button>
            )}

            {/* Customer Auth / My Account Dropdown (Amazon-Style Customer Hub) */}
            {navbarConfig.showCustomerAuth !== false && (
              customerUser ? (
                <div className="customer-account-nav-wrap desktop-only" ref={accountDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsAccountDropdownOpen((prev) => !prev)}
                    className="btn-clean-customer-auth logged-in"
                    title="Account & Orders Menu"
                  >
                    <div className="customer-avatar-mini" style={{ background: primaryColor }}>
                      {customerUser.name ? customerUser.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="customer-nav-user-text">
                      <span className="customer-nav-greeting">Hello,</span>
                      <span className="customer-nav-name">{customerUser.name ? customerUser.name.split(' ')[0] : 'Account'}</span>
                    </div>
                    <ChevronDown size={14} className={`dropdown-chevron ${isAccountDropdownOpen ? 'open' : ''}`} />
                  </button>

                  {isAccountDropdownOpen && (
                    <div className="customer-nav-dropdown-menu">
                      <div className="dropdown-user-header">
                        <div className="dropdown-avatar" style={{ background: primaryColor }}>
                          {customerUser.name ? customerUser.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="dropdown-meta">
                          <div className="dropdown-name">{customerUser.name}</div>
                          <div className="dropdown-phone">+91 {customerUser.phone}</div>
                          <span className="dropdown-badge">Verified Customer</span>
                        </div>
                      </div>

                      <div className="dropdown-divider" />

                      <button
                        type="button"
                        className="dropdown-item"
                        onClick={() => {
                          setIsAccountDropdownOpen(false);
                          setCustomerDrawerTab('ORDERS');
                          handleFetchCustomerOrders(customerUser.phone);
                          setIsCustomerAccountOpen(true);
                        }}
                      >
                        <Package size={16} className="item-icon" />
                        <div>
                          <strong>My Orders & Tracking</strong>
                          <span>View live fulfillment & digital receipts</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        className="dropdown-item"
                        onClick={() => {
                          setIsAccountDropdownOpen(false);
                          setCustomerDrawerTab('PROFILE');
                          setIsCustomerAccountOpen(true);
                        }}
                      >
                        <UserCheck size={16} className="item-icon" />
                        <div>
                          <strong>Profile & Delivery Address</strong>
                          <span>Update name, email & address</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        className="dropdown-item"
                        onClick={() => {
                          setIsAccountDropdownOpen(false);
                          setIsTrackingModalOpen(true);
                        }}
                      >
                        <Truck size={16} className="item-icon" />
                        <div>
                          <strong>Track Order by Invoice #</strong>
                          <span>Track status for any past bill</span>
                        </div>
                      </button>

                      <div className="dropdown-divider" />

                      <button
                        type="button"
                        className="dropdown-item dropdown-logout-item"
                        onClick={() => {
                          setIsAccountDropdownOpen(false);
                          handleCustomerLogout();
                        }}
                      >
                        <LogOut size={16} className="item-icon" />
                        <strong>Log Out from Store</strong>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalMode('LOGIN');
                    setIsAuthModalOpen(true);
                  }}
                  className="btn-clean-customer-auth desktop-only"
                  title="Customer Sign In"
                >
                  <User size={16} />
                  <span>Sign In</span>
                </button>
              )
            )}

            {navbarConfig.showWhatsApp !== false && whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-clean-whatsapp desktop-only"
                title="Chat on WhatsApp"
              >
                <WhatsAppBrandIcon size={18} color="#25D366" />
                <span>WhatsApp</span>
              </a>
            )}

            {navbarConfig.showCart !== false && (
              <button
                onClick={() => setIsCartOpen(true)}
                className="btn-clean-cart"
                aria-label="View Shopping Bag"
              >
                <ShoppingBag size={18} />
                <span>Bag</span>
                {totalCartCount > 0 && (
                  <span className="clean-cart-pill">{totalCartCount}</span>
                )}
              </button>
            )}

            {/* Mobile / Tablet Menu Hamburger Toggle */}
            <button
              type="button"
              className="btn-clean-mobile-toggle"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              aria-label={isMobileMenuOpen ? "Close Menu" : "Open Navigation Menu"}
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile / Tablet Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="clean-mobile-nav-drawer animate-popover">
            {navbarConfig.showSearch !== false && (
              <div className="mobile-drawer-search">
                <Search size={16} color="#94a3b8" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search store catalog..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setIsMobileMenuOpen(false);
                      scrollToCatalog();
                    }
                  }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="clean-nav-search-clear"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            )}

            <div className="mobile-drawer-links">
              {navLinks && navLinks
                .filter((link) => link.enabled !== false)
                .map((link) => (
                  <a
                    key={link.id || link.label}
                    href={link.url || '#'}
                    onClick={(e) => {
                      setIsMobileMenuOpen(false);
                      if (link.url?.startsWith('#')) {
                        e.preventDefault();
                        if (link.url === '#home') {
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                          return;
                        }
                        const target = document.querySelector(link.url);
                        if (target) {
                          target.scrollIntoView({ behavior: 'smooth' });
                        }
                      }
                    }}
                    className="mobile-drawer-link"
                  >
                    <span>{link.label}</span>
                    <ArrowRight size={14} />
                  </a>
                ))}
            </div>

            <div className="mobile-drawer-actions">
              {customerUser && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsTrackingModalOpen(true);
                  }}
                  className="mobile-drawer-action-btn"
                >
                  <Truck size={16} />
                  <span>Track Order Status</span>
                </button>
              )}

              {navbarConfig.showCustomerAuth !== false && (
                customerUser ? (
                  <div className="mobile-drawer-logged-user">
                    <div className="mobile-user-card-header">
                      <div className="mobile-user-avatar" style={{ background: primaryColor }}>
                        {customerUser.name ? customerUser.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div className="mobile-user-details">
                        <strong className="mobile-user-name">{customerUser.name}</strong>
                        <span className="mobile-user-phone">+91 {customerUser.phone}</span>
                      </div>
                    </div>
                    <div className="mobile-user-card-links">
                      <button
                        type="button"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          setCustomerDrawerTab('ORDERS');
                          handleFetchCustomerOrders(customerUser.phone);
                          setIsCustomerAccountOpen(true);
                        }}
                        className="mobile-drawer-action-btn"
                      >
                        <Package size={16} />
                        <span>My Orders & Tracking</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          setCustomerDrawerTab('PROFILE');
                          setIsCustomerAccountOpen(true);
                        }}
                        className="mobile-drawer-action-btn"
                      >
                        <UserCheck size={16} />
                        <span>Edit Profile & Delivery Address</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          handleCustomerLogout();
                        }}
                        className="mobile-drawer-action-btn mobile-logout-btn"
                      >
                        <LogOut size={16} />
                        <span>Log Out from Account</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setAuthModalMode('LOGIN');
                      setIsAuthModalOpen(true);
                    }}
                    className="mobile-drawer-action-btn"
                  >
                    <User size={16} />
                    <span>Sign In to Account</span>
                  </button>
                )
              )}

              {navbarConfig.showWhatsApp !== false && whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="mobile-drawer-action-btn whatsapp"
                >
                  <WhatsAppBrandIcon size={17} color="#25D366" />
                  <span>Chat on WhatsApp</span>
                </a>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Dynamic Modular Storefront Sections (Ordered by Drag & Drop) */}
      {dynamicSections.map((sec, idx) => (
        <React.Fragment key={sec.id || `${sec.type}-${idx}`}>
          {renderDynamicStorefrontSection(sec)}
        </React.Fragment>
      ))}

      {/* 5. Contact & Store Footer Section */}
      {footerConfig.enabled !== false && (
        <footer id="contact" className="clean-store-footer-section clean-store-footer-luxury">
          <div className="clean-footer-container">
            <div className="clean-footer-luxury-grid">
              {/* Col 1: Brand & Bio */}
              <div className="clean-footer-brand-col">
                <div className="clean-footer-brand-header">
                  <div className="clean-footer-logo-wrap" style={{ background: branding.logoUrl ? 'transparent' : primaryColor }}>
                    {branding.logoUrl ? (
                      <img src={branding.logoUrl} alt={storeTitle} />
                    ) : (
                      <Store size={22} color="#ffffff" />
                    )}
                  </div>
                  <div>
                    <h3 className="clean-footer-store-name">{storeTitle}</h3>
                    <p className="clean-footer-tagline">{tagline}</p>
                  </div>
                </div>

                <p className="clean-footer-bio-text">
                  {footerConfig.brandBio || 'Direct digital storefront backed by verified central inventory with guaranteed genuine products, fast doorstep dispatch, and instant WhatsApp support.'}
                </p>

                {/* Social Links */}
                {footerConfig.showSocials !== false && (
                  <div className="clean-footer-social-row">
                    {(footerConfig.socials?.whatsapp || cleanPhone) && (
                      <a
                        href={footerConfig.socials?.whatsapp ? `https://wa.me/${footerConfig.socials.whatsapp.replace(/\D/g, '')}` : whatsappUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="social-icon-btn whatsapp"
                        aria-label="WhatsApp"
                      >
                        <WhatsAppBrandIcon size={16} color="#25D366" />
                      </a>
                    )}
                    {footerConfig.socials?.instagram && (
                      <a href={footerConfig.socials.instagram} target="_blank" rel="noreferrer" className="social-icon-btn instagram" aria-label="Instagram">
                        <Instagram size={16} />
                      </a>
                    )}
                    {footerConfig.socials?.facebook && (
                      <a href={footerConfig.socials.facebook} target="_blank" rel="noreferrer" className="social-icon-btn facebook" aria-label="Facebook">
                        <Facebook size={16} />
                      </a>
                    )}
                    {footerConfig.socials?.twitter && (
                      <a href={footerConfig.socials.twitter} target="_blank" rel="noreferrer" className="social-icon-btn twitter" aria-label="Twitter">
                        <Twitter size={16} />
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Col 2: Column 1 Quick Links */}
              <div className="clean-footer-links-col">
                <h4 className="clean-footer-col-title">{footerConfig.col1Title || 'Quick Links'}</h4>
                <ul className="clean-footer-links-list">
                  {(footerConfig.col1Links && footerConfig.col1Links.length > 0 ? footerConfig.col1Links : [
                    { id: '1', label: 'Home', url: '#home' },
                    { id: '2', label: 'Products', url: '#products' },
                    { id: '3', label: 'About', url: '#about' },
                    { id: '4', label: 'Reviews', url: '#testimonials' }
                  ]).map((link, idx) => (
                    <li key={link.id || idx}>
                      <a href={link.url || '#'}>{link.label}</a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Col 3: Column 2 Policy Links */}
              <div className="clean-footer-links-col">
                <h4 className="clean-footer-col-title">{footerConfig.col2Title || 'Customer Care'}</h4>
                <ul className="clean-footer-links-list">
                  {(footerConfig.col2Links && footerConfig.col2Links.length > 0 ? footerConfig.col2Links : [
                    { id: '1', label: 'Shipping & Delivery', url: '#faq' },
                    { id: '2', label: 'Terms & Conditions', url: '#terms' },
                    { id: '3', label: 'Refund Policy', url: '#returns' },
                    { id: '4', label: 'Privacy Policy', url: '#privacy' }
                  ]).map((link, idx) => (
                    <li key={link.id || idx}>
                      <a href={link.url || '#'}>{link.label}</a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Col 4: Store Support & Location */}
              <div className="clean-footer-contact-col">
                <h4 className="clean-footer-col-title">Store & Contact</h4>
                <ul className="clean-footer-contact-details">
                  {(contactConfig.address || tenant?.address) && (
                    <li>
                      <MapPin size={16} color={accentColor} />
                      <span>{contactConfig.address || tenant?.address}</span>
                    </li>
                  )}
                  {contactConfig.hours && (
                    <li>
                      <Clock size={16} color={accentColor} />
                      <span>{contactConfig.hours}</span>
                    </li>
                  )}
                  {(contactConfig.phone || tenant?.phone) && (
                    <li>
                      <Phone size={16} color={accentColor} />
                      <span>{contactConfig.phone || tenant?.phone}</span>
                    </li>
                  )}
                  {(contactConfig.email || tenant?.email) && (
                    <li>
                      <Mail size={16} color={accentColor} />
                      <span>{contactConfig.email || tenant?.email}</span>
                    </li>
                  )}
                </ul>

                {whatsappUrl && (
                  <div className="clean-footer-wa-action">
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-footer-whatsapp"
                    >
                      <WhatsAppBrandIcon size={16} color="#ffffff" />
                      <span>Instant WhatsApp Chat</span>
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Bar: Copyright & Payment Badges */}
            <div className="clean-footer-bottom-luxury">
              <div className="footer-bottom-left">
                <p>© {new Date().getFullYear()} {storeTitle}. {footerConfig.copyrightText || 'All rights reserved.'}</p>
                <p className="clean-powered-tag">Powered by <strong>StockPilot IMS</strong></p>
              </div>

              {footerConfig.showPaymentBadges !== false && (
                <div className="clean-footer-payment-badges-row">
                  {footerConfig.paymentBadges?.upi !== false && (
                    <span className="payment-badge-pill">
                      <QrCode size={13} className="badge-ico" /> UPI
                    </span>
                  )}
                  {footerConfig.paymentBadges?.cards !== false && (
                    <span className="payment-badge-pill">
                      <CreditCard size={13} className="badge-ico" /> Cards / RuPay
                    </span>
                  )}
                  {footerConfig.paymentBadges?.netbanking !== false && (
                    <span className="payment-badge-pill">
                      <Globe size={13} className="badge-ico" /> Net Banking
                    </span>
                  )}
                  {footerConfig.paymentBadges?.cod !== false && (
                    <span className="payment-badge-pill">
                      <Banknote size={13} className="badge-ico" /> Cash on Delivery
                    </span>
                  )}
                  {footerConfig.paymentBadges?.genuine !== false && (
                    <span className="payment-badge-pill genuine">
                      <ShieldCheck size={14} color="#10b981" className="badge-ico" /> 100% Genuine
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </footer>
      )}

      {/* 6. High-End Slide-Over Shopping Bag Drawer */}
      {isCartOpen && (
        <div className="clean-drawer-overlay" onClick={() => setIsCartOpen(false)}>
          <div className="clean-drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="clean-drawer-header">
              <div className="clean-drawer-title">
                <div className="drawer-title-icon" style={{ background: primaryColor }}>
                  <ShoppingBag size={18} />
                </div>
                <div>
                  <h3>Shopping Bag</h3>
                  <span className="drawer-items-count">{totalCartCount} item{totalCartCount !== 1 ? 's' : ''} in cart</span>
                </div>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="clean-btn-close-circle"
                aria-label="Close Shopping Bag"
              >
                <X size={18} />
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="clean-drawer-empty-premium">
                <div className="empty-cart-illustration" style={{ background: `${primaryColor}12` }}>
                  <ShoppingBasket size={52} color={primaryColor} />
                </div>
                <h4>Your shopping bag is empty</h4>
                <p>
                  Looks like you haven't added any products yet. Discover in-stock items from our catalog!
                </p>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    scrollToCatalog();
                  }}
                  className="btn-start-shopping"
                  style={{ background: primaryColor }}
                >
                  <ShoppingBag size={16} />
                  <span>Start Shopping</span>
                </button>
              </div>
            ) : (
              <div className="clean-drawer-content">
                {/* Free Shipping Progress Indicator */}
                <div className="free-shipping-pill">
                  <div className="shipping-icon-wrap">
                    <Truck size={15} color="#10b981" />
                  </div>
                  <span>
                    {cartSubtotal >= 499 ? (
                      <strong className="text-emerald">Free express delivery unlocked!</strong>
                    ) : (
                      <>Add <strong>₹{(499 - cartSubtotal).toLocaleString('en-IN')}</strong> more for free delivery</>
                    )}
                  </span>
                </div>

                {/* Cart Items List */}
                <div className="clean-cart-items-list">
                  {cart.map((item) => (
                    <div key={item.id} className="clean-cart-item-card">
                      <div className="cart-item-thumb">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} />
                        ) : (
                          <Package size={22} className="text-muted" />
                        )}
                      </div>
                      <div className="clean-cart-item-details">
                        <h4>{item.name}</h4>
                        <span className="clean-cart-unit-price">
                          ₹{item.unitPrice.toLocaleString('en-IN')} / {item.unit}
                        </span>
                        <div className="clean-cart-item-controls">
                          <div className="clean-stepper-sm">
                            <button
                              onClick={() => updateQuantity(item.id, -1)}
                              aria-label="Decrease quantity"
                            >
                              <Minus size={12} />
                            </button>
                            <span>{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, 1)}
                              aria-label="Increase quantity"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                          <span className="clean-cart-item-total">
                            ₹{(item.unitPrice * item.quantity).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="clean-btn-trash-item"
                        title="Remove item"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Bill Breakdown */}
                <div className="clean-bill-card">
                  <div className="clean-bill-row">
                    <span>Items Subtotal</span>
                    <span>₹{cartSubtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="clean-bill-row">
                    <span>Estimated GST {effectiveTaxPercent > 0 ? `(${effectiveTaxPercent}%)` : ''}</span>
                    <span>₹{Math.round(cartTax).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="clean-bill-row">
                    <span>Delivery</span>
                    <span className="text-emerald">{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</span>
                  </div>
                  <div className="clean-bill-row clean-bill-total">
                    <span>Total Payable</span>
                    <span className="total-amount-large">₹{cartGrandTotal.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Frictionless Clean Checkout Form */}
                <form onSubmit={handlePlaceOrder} className="clean-checkout-form">
                  <div className="checkout-contact-section">
                    <div className="checkout-section-header">
                      <div className="checkout-section-title-wrap">
                        <h4 className="checkout-section-main-title">Customer &amp; Delivery Details</h4>
                        <p className="checkout-section-sub">Quick order details for instant dispatch &amp; tracking</p>
                      </div>
                      <div className="checkout-trust-badge">
                        <ShieldCheck size={14} className="text-emerald" />
                        <span>Instant Checkout</span>
                      </div>
                    </div>

                    {customerUser ? (
                      /* Logged In Customer Badge */
                      <div className="checkout-logged-user-card">
                        <div className="checkout-logged-avatar">
                          {customerUser.name ? customerUser.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="checkout-logged-meta">
                          <div className="checkout-logged-row">
                            <strong className="checkout-logged-name">{customerUser.name}</strong>
                            <span className="checkout-logged-tag">
                              <CheckCircle2 size={12} /> Logged In
                            </span>
                          </div>
                          <div className="checkout-logged-details">
                            <span>+91 {customerUser.phone}</span>
                            {customerUser.email && <span>• {customerUser.email}</span>}
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Guest Customer Inputs */
                      <div className="checkout-guest-container">
                        <div className="checkout-guest-login-bar">
                          <span>Already a customer?</span>
                          <button
                            type="button"
                            onClick={() => {
                              setAuthModalMode('LOGIN');
                              setIsAuthModalOpen(true);
                            }}
                            className="btn-guest-login-link"
                          >
                            Sign In for 1-click order
                          </button>
                        </div>

                        <div className="clean-input-group">
                          <label>Full Name <span className="req-star">*</span></label>
                          <div className="input-with-icon">
                            <User size={15} className="input-icon" />
                            <input
                              type="text"
                              placeholder="e.g. Ramesh Kumar"
                              required
                              value={customer.name}
                              onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="clean-form-grid">
                          <div className="clean-input-group">
                            <label>Mobile Number <span className="req-star">*</span></label>
                            <div className="input-with-icon input-phone-wrap">
                              <span className="input-prefix-tag">🇮🇳 +91</span>
                              <input
                                type="tel"
                                maxLength={10}
                                placeholder="10-digit number"
                                required
                                value={customer.phone}
                                onChange={(e) => setCustomer({ ...customer, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                              />
                            </div>
                          </div>
                          <div className="clean-input-group">
                            <label>Email Address <span className="opt-tag">(Optional)</span></label>
                            <div className="input-with-icon">
                              <Mail size={15} className="input-icon" />
                              <input
                                type="email"
                                placeholder="For order invoice"
                                value={customer.email}
                                onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Delivery Mode Tabs */}
                    <div className="clean-delivery-toggle">
                      <button
                        type="button"
                        onClick={() => setCustomer({ ...customer, deliveryType: 'DELIVERY' })}
                        className={`clean-toggle-btn ${customer.deliveryType === 'DELIVERY' ? 'active' : ''}`}
                      >
                        <Truck size={14} /> Doorstep Delivery
                      </button>
                      <button
                        type="button"
                        onClick={() => setCustomer({ ...customer, deliveryType: 'PICKUP' })}
                        className={`clean-toggle-btn ${customer.deliveryType === 'PICKUP' ? 'active' : ''}`}
                      >
                        <Store size={14} /> Store Pickup
                      </button>
                    </div>

                    {customer.deliveryType === 'DELIVERY' && (
                      <div className="clean-input-group checkout-address-group">
                        <label>Delivery Address <span className="req-star">*</span></label>
                        <textarea
                          rows={2}
                          placeholder="Flat / House No, Street name, Area, City & Pincode"
                          required
                          value={customer.address}
                          onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                        />
                      </div>
                    )}
                  </div>

                  {/* Payment Mode Selector */}
                  <div className="clean-payment-group">
                    <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.45rem', display: 'block' }}>
                      Payment Method
                    </label>
                    <div className="clean-payment-options">
                      <label className={`clean-pay-radio ${customer.paymentMethod === 'CASH' || customer.paymentMethod === 'COD' ? 'selected' : ''}`}>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="CASH"
                          checked={customer.paymentMethod === 'CASH' || customer.paymentMethod === 'COD'}
                          onChange={() => setCustomer({ ...customer, paymentMethod: 'CASH' })}
                        />
                        <div>
                          <strong>Cash Payment</strong>
                          <span>Cash on Delivery or Counter Cash</span>
                        </div>
                      </label>

                      <label className={`clean-pay-radio ${customer.paymentMethod === 'UPI' ? 'selected' : ''}`}>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="UPI"
                          checked={customer.paymentMethod === 'UPI'}
                          onChange={() => setCustomer({ ...customer, paymentMethod: 'UPI' })}
                        />
                        <div>
                          <strong>UPI / Razorpay</strong>
                          <span>Test Mode (GPay, PhonePe, Cards)</span>
                        </div>
                      </label>
                    </div>

                    {/* Cash Tendered & Balance Calculator */}
                    {(customer.paymentMethod === 'CASH' || customer.paymentMethod === 'COD') && (
                      <div style={{
                        marginTop: '0.85rem',
                        padding: '0.85rem',
                        borderRadius: '8px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.65rem'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>
                            Cash Tendered by Customer:
                          </span>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.74rem', color: '#059669', fontWeight: 600, cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={isPaidAtCounter}
                              onChange={(e) => setIsPaidAtCounter(e.target.checked)}
                            />
                            Mark as Paid Now
                          </label>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <div style={{ position: 'relative', flex: 1 }}>
                            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: '#64748b' }}>₹</span>
                            <input
                              type="number"
                              step="1"
                              placeholder={`Enter amount (e.g. ${cartGrandTotal})`}
                              value={cashTendered}
                              onChange={(e) => setCashTendered(e.target.value)}
                              style={{
                                width: '100%',
                                padding: '0.45rem 0.65rem 0.45rem 1.6rem',
                                borderRadius: '6px',
                                border: '1px solid #cbd5e1',
                                fontSize: '0.9rem',
                                fontWeight: 700,
                                color: '#0f172a'
                              }}
                            />
                          </div>
                        </div>

                        {/* Quick amount suggestion chips */}
                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            onClick={() => setCashTendered(String(cartGrandTotal))}
                            style={{
                              padding: '0.2rem 0.45rem',
                              fontSize: '0.72rem',
                              borderRadius: '4px',
                              background: '#ffffff',
                              border: '1px solid #cbd5e1',
                              cursor: 'pointer',
                              fontWeight: 600
                            }}
                          >
                            Exact (₹{cartGrandTotal.toLocaleString('en-IN')})
                          </button>
                          <button
                            type="button"
                            onClick={() => setCashTendered(String(cartGrandTotal + 100))}
                            style={{
                              padding: '0.2rem 0.45rem',
                              fontSize: '0.72rem',
                              borderRadius: '4px',
                              background: '#ffffff',
                              border: '1px solid #cbd5e1',
                              cursor: 'pointer',
                              fontWeight: 600
                            }}
                          >
                            +₹100
                          </button>
                          <button
                            type="button"
                            onClick={() => setCashTendered(String(cartGrandTotal + 500))}
                            style={{
                              padding: '0.2rem 0.45rem',
                              fontSize: '0.72rem',
                              borderRadius: '4px',
                              background: '#ffffff',
                              border: '1px solid #cbd5e1',
                              cursor: 'pointer',
                              fontWeight: 600
                            }}
                          >
                            +₹500
                          </button>
                          {cartGrandTotal > 500 && (
                            <button
                              type="button"
                              onClick={() => setCashTendered(String(Math.ceil(cartGrandTotal / 1000) * 1000))}
                              style={{
                                padding: '0.2rem 0.45rem',
                                fontSize: '0.72rem',
                                borderRadius: '4px',
                                background: '#ffffff',
                                border: '1px solid #cbd5e1',
                                cursor: 'pointer',
                                fontWeight: 600
                              }}
                            >
                              Round ₹{(Math.ceil(cartGrandTotal / 1000) * 1000).toLocaleString('en-IN')}
                            </button>
                          )}
                        </div>

                        {/* Balance / Change Indicator */}
                        {tenderedNum > 0 && (
                          <div style={{
                            padding: '0.5rem 0.75rem',
                            borderRadius: '6px',
                            background: changeDue > 0 ? '#ecfdf5' : (shortage > 0 ? '#fef3c7' : '#f0fdf4'),
                            border: `1px solid ${changeDue > 0 ? '#a7f3d0' : (shortage > 0 ? '#fde68a' : '#bbf7d0')}`,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: changeDue > 0 ? '#047857' : (shortage > 0 ? '#b45309' : '#15803d') }}>
                              {changeDue > 0 ? 'Change to Return to Customer:' : (shortage > 0 ? 'Amount Remaining / Shortage:' : 'Exact Amount Tendered:')}
                            </span>
                            <span style={{ fontSize: '0.95rem', fontWeight: 800, color: changeDue > 0 ? '#059669' : (shortage > 0 ? '#d97706' : '#16a34a') }}>
                              ₹{(changeDue > 0 ? changeDue : (shortage > 0 ? shortage : 0)).toLocaleString('en-IN')}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Razorpay Test Mode Badge */}
                    {customer.paymentMethod === 'UPI' && (
                      <div style={{
                        marginTop: '0.75rem',
                        padding: '0.65rem 0.85rem',
                        borderRadius: '8px',
                        background: '#eff6ff',
                        border: '1px solid #bfdbfe',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.55rem'
                      }}>
                        <ShieldCheck size={18} color="#2563eb" />
                        <div>
                          <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#1e40af' }}>
                            Razorpay Sandbox / Test Mode
                          </div>
                          <div style={{ fontSize: '0.68rem', color: '#3b82f6' }}>
                            Simulates real UPI, Card &amp; Netbanking payments. No real money deducted.
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={placingOrder}
                    className="btn-clean-checkout-submit"
                    style={{ background: primaryColor }}
                  >
                    {placingOrder ? (
                      <>
                        <Loader2 size={16} className="spinner" />
                        <span>Processing Order...</span>
                      </>
                    ) : (
                      <span>
                        {customer.paymentMethod === 'UPI'
                          ? `Pay with Razorpay • ₹${cartGrandTotal.toLocaleString('en-IN')}`
                          : `Place Order • ₹${cartGrandTotal.toLocaleString('en-IN')}`}
                      </span>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Product View Modal */}
      {quickViewProduct && (
        <div className="clean-modal-overlay" onClick={() => setQuickViewProduct(null)}>
          <div className="clean-modal-card" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setQuickViewProduct(null)} className="clean-btn-modal-close">
              <X size={18} />
            </button>

            <div className="clean-modal-grid">
              <div className="clean-modal-image-col">
                {quickViewProduct.image_url ? (
                  <img src={quickViewProduct.image_url} alt={quickViewProduct.name} />
                ) : (
                  <div className="clean-modal-no-img">
                    <Package size={48} />
                  </div>
                )}
              </div>
              <div className="clean-modal-info-col">
                <span className="clean-modal-cat">{quickViewProduct.category?.name || 'Product'}</span>
                <h2>{quickViewProduct.name}</h2>
                <span className="clean-modal-sku">SKU: {quickViewProduct.product_code || `PRD-${quickViewProduct.id}`}</span>

                <div className="clean-modal-price">
                  ₹{parseFloat(quickViewProduct.selling_price || 0).toLocaleString('en-IN')}
                  <span className="clean-tax-tag">incl. GST</span>
                </div>

                <p className="clean-modal-desc">
                  {quickViewProduct.description || 'Quality retail product from verified stock.'}
                </p>

                {(() => {
                  const qvInStock = isProductInStock(quickViewProduct);
                  return (
                    <div className="clean-modal-actions">
                      <span className={`clean-stock-tag ${qvInStock ? 'in-stock' : 'out-stock'}`} style={{ marginBottom: '0.75rem', display: 'inline-flex' }}>
                        {qvInStock ? 'In Stock — Ready to Dispatch' : 'Currently Out of Stock'}
                      </span>
                      <button
                        onClick={() => {
                          if (!qvInStock) return;
                          addToCart(quickViewProduct);
                          setQuickViewProduct(null);
                        }}
                        disabled={!qvInStock}
                        className="btn-clean-primary"
                        style={{
                          background: qvInStock ? primaryColor : '#94a3b8',
                          cursor: qvInStock ? 'pointer' : 'not-allowed',
                          opacity: qvInStock ? 1 : 0.65
                        }}
                      >
                        {qvInStock ? (
                          <>
                            <Plus size={16} /> Add to Bag
                          </>
                        ) : (
                          <span>Out of Stock</span>
                        )}
                      </button>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Success Modal */}
      {orderSuccess && (
        <div className="clean-modal-overlay">
          <div className="clean-modal-success-card">
            <div className="clean-success-icon" style={{ color: accentColor }}>
              <CheckCircle2 size={48} />
            </div>
            <h2>Order Placed Successfully!</h2>
            <p>Your order with <strong>{storeTitle}</strong> has been logged in the system.</p>

            <div className="clean-success-details">
              <div><span>Invoice #:</span> <strong>#{orderSuccess.invoiceNumber || 'INV-LIVE'}</strong></div>
              <div><span>Total:</span> <strong>₹{parseFloat(orderSuccess.grandTotal || cartGrandTotal).toLocaleString('en-IN')}</strong></div>
            </div>

            <div className="clean-success-actions">
              <Link
                to={orderSuccess.ebillUrl || `/e-bill/${orderSuccess.invoiceNumber}`}
                className="btn-clean-primary"
                style={{ background: primaryColor }}
              >
                <FileText size={16} /> View Digital Invoice
              </Link>
              <button
                type="button"
                onClick={() => setOrderSuccess(null)}
                className="btn-clean-outline"
              >
                Continue Browsing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Authentication Modal (Login / Register) */}
      {isAuthModalOpen && (
        <div className="clean-modal-overlay" onClick={() => setIsAuthModalOpen(false)}>
          <div className="clean-customer-auth-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => {
                setIsAuthModalOpen(false);
                setAuthError('');
              }}
              className="clean-btn-modal-close"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>

            <div className="customer-auth-header">
              <div className="customer-auth-brand-badge" style={{ background: `${primaryColor}15`, color: primaryColor }}>
                <Store size={24} />
              </div>
              <h3 className="auth-header-title">
                {authModalMode === 'LOGIN' ? `Welcome Back` : `Create Your Account`}
              </h3>
              <p className="auth-header-sub">
                {authModalMode === 'LOGIN'
                  ? `Sign in to track your orders, access fast checkout, and reorder from ${storeTitle}.`
                  : `Join ${storeTitle} to save delivery addresses and access live order tracking.`}
              </p>
            </div>

            {/* Segmented Pill Switcher */}
            <div className="auth-mode-pill-switcher">
              <button
                type="button"
                className={`auth-tab-pill ${authModalMode === 'LOGIN' ? 'active' : ''}`}
                onClick={() => {
                  setAuthModalMode('LOGIN');
                  setAuthError('');
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`auth-tab-pill ${authModalMode === 'REGISTER' ? 'active' : ''}`}
                onClick={() => {
                  setAuthModalMode('REGISTER');
                  setAuthError('');
                }}
              >
                Create Account
              </button>
            </div>

            {authError && (
              <div className="auth-error-banner">
                <span className="auth-error-icon">!</span>
                <span>{authError}</span>
              </div>
            )}

            <form
              onSubmit={authModalMode === 'LOGIN' ? handleCustomerLogin : handleCustomerRegister}
              className="customer-auth-form"
            >
              {authModalMode === 'REGISTER' && (
                <div className="auth-field-group">
                  <label>Full Name <span className="req-star">*</span></label>
                  <div className="auth-field-input-wrap">
                    <User size={16} className="auth-field-icon" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Kumar"
                      value={authFormData.name}
                      onChange={(e) => setAuthFormData({ ...authFormData, name: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <div className="auth-field-group">
                <label>
                  {authModalMode === 'LOGIN' ? 'Mobile Number or Email' : 'Mobile Number'}{' '}
                  <span className="req-star">*</span>
                </label>
                <div className="auth-field-input-wrap">
                  {authModalMode === 'LOGIN' ? (
                    <User size={16} className="auth-field-icon" />
                  ) : (
                    <span className="auth-prefix-tag">🇮🇳 +91</span>
                  )}
                  <input
                    type={authModalMode === 'LOGIN' ? 'text' : 'tel'}
                    required
                    maxLength={authModalMode === 'LOGIN' ? 60 : 10}
                    placeholder={
                      authModalMode === 'LOGIN'
                        ? '10-digit mobile or email address'
                        : '10-digit mobile number'
                    }
                    value={authFormData.phone}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (authModalMode === 'REGISTER') {
                        setAuthFormData({ ...authFormData, phone: val.replace(/\D/g, '').slice(0, 10) });
                      } else {
                        setAuthFormData({ ...authFormData, phone: val });
                      }
                    }}
                  />
                </div>
              </div>

              {authModalMode === 'REGISTER' && (
                <div className="auth-field-group">
                  <label>Email Address <span className="opt-tag">(Optional)</span></label>
                  <div className="auth-field-input-wrap">
                    <Mail size={16} className="auth-field-icon" />
                    <input
                      type="email"
                      placeholder="name@example.com (for tax invoice)"
                      value={authFormData.email}
                      onChange={(e) => setAuthFormData({ ...authFormData, email: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <div className="auth-field-group">
                <label>Password <span className="req-star">*</span></label>
                <div className="auth-field-input-wrap">
                  <Lock size={16} className="auth-field-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder={authModalMode === 'REGISTER' ? 'At least 6 characters' : 'Enter your password'}
                    value={authFormData.password}
                    onChange={(e) => setAuthFormData({ ...authFormData, password: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="btn-auth-pw-toggle"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {authModalMode === 'REGISTER' && (
                <div className="auth-field-group">
                  <label>Confirm Password <span className="req-star">*</span></label>
                  <div className="auth-field-input-wrap">
                    <Lock size={16} className="auth-field-icon" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder="Re-enter your password"
                      value={authFormData.confirmPassword}
                      onChange={(e) => setAuthFormData({ ...authFormData, confirmPassword: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="btn-auth-pw-toggle"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="btn-customer-auth-submit"
                style={{ background: primaryColor }}
              >
                {authLoading ? (
                  <>
                    <Loader2 size={16} className="clean-spin" />
                    <span>Please wait...</span>
                  </>
                ) : (
                  <span>{authModalMode === 'LOGIN' ? 'Sign In to Account' : 'Create My Account'}</span>
                )}
              </button>

              <div className="auth-footer-toggle">
                {authModalMode === 'LOGIN' ? (
                  <p>
                    New to {storeTitle}?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthModalMode('REGISTER');
                        setAuthError('');
                      }}
                      className="auth-link-highlight"
                      style={{ color: primaryColor }}
                    >
                      Create an account
                    </button>
                  </p>
                ) : (
                  <p>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthModalMode('LOGIN');
                        setAuthError('');
                      }}
                      className="auth-link-highlight"
                      style={{ color: primaryColor }}
                    >
                      Sign in here
                    </button>
                  </p>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Account & Orders Drawer */}
      {isCustomerAccountOpen && (
        <div className="clean-modal-overlay" onClick={() => setIsCustomerAccountOpen(false)}>
          <aside className="clean-customer-account-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="customer-drawer-header">
              <div className="drawer-user-meta">
                <div className="drawer-user-avatar" style={{ background: primaryColor }}>
                  {customerUser?.name ? customerUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <h4>{customerUser?.name || 'Customer Account'}</h4>
                  <p>+91 {customerUser?.phone || customer.phone || 'Verified Customer'}</p>
                  {customerUser?.email && <span className="drawer-user-email">{customerUser.email}</span>}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomerAccountOpen(false)}
                className="clean-btn-modal-close"
                aria-label="Close Account"
              >
                <X size={18} />
              </button>
            </div>

            {/* Segmented Tabs (Orders vs Profile) */}
            <div className="customer-drawer-nav-tabs">
              <button
                type="button"
                className={`drawer-tab-nav-btn ${customerDrawerTab === 'ORDERS' ? 'active' : ''}`}
                onClick={() => setCustomerDrawerTab('ORDERS')}
                style={customerDrawerTab === 'ORDERS' ? { borderBottomColor: primaryColor, color: primaryColor } : {}}
              >
                <Package size={15} />
                <span>My Orders</span>
                {customerOrders.length > 0 && <span className="drawer-tab-pill">{customerOrders.length}</span>}
              </button>
              <button
                type="button"
                className={`drawer-tab-nav-btn ${customerDrawerTab === 'PROFILE' ? 'active' : ''}`}
                onClick={() => setCustomerDrawerTab('PROFILE')}
                style={customerDrawerTab === 'PROFILE' ? { borderBottomColor: primaryColor, color: primaryColor } : {}}
              >
                <UserCheck size={15} />
                <span>Edit Profile & Address</span>
              </button>
            </div>

            <div className="customer-drawer-body">
              {customerDrawerTab === 'ORDERS' ? (
                <>
                  {/* Quick Actions Bar */}
                  <div className="drawer-actions-bar">
                    <button
                      type="button"
                      onClick={() => handleFetchCustomerOrders(customerUser?.phone)}
                      className="btn-drawer-refresh"
                    >
                      <Clock size={14} />
                      <span>Refresh Orders</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomerAccountOpen(false);
                        setIsTrackingModalOpen(true);
                      }}
                      className="btn-drawer-track"
                      style={{ color: primaryColor }}
                    >
                      <Truck size={14} />
                      <span>Track by Invoice #</span>
                    </button>
                  </div>

                  {/* Order History Section */}
                  <div className="drawer-section-heading">
                    <h5>Orders & Delivery Records</h5>
                    <span className="order-count-tag">{customerOrders.length}</span>
                  </div>

                  {loadingOrders ? (
                    <div className="drawer-orders-loading">
                      <Loader2 size={24} className="spinner text-primary" />
                      <p>Retrieving your order records...</p>
                    </div>
                  ) : customerOrders.length === 0 ? (
                    <div className="drawer-empty-orders">
                      <Package size={40} className="text-muted" />
                      <h6>No Orders Yet</h6>
                      <p>When you place an order, live tracking and digital receipts will appear right here.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomerAccountOpen(false);
                          scrollToCatalog();
                        }}
                        className="btn-clean-primary"
                        style={{ background: primaryColor, marginTop: '0.75rem', fontSize: '0.82rem' }}
                      >
                        Start Shopping
                      </button>
                    </div>
                  ) : (
                    <div className="drawer-orders-list">
                      {customerOrders.map((ord) => (
                        <div key={ord.id || ord.invoice_number} className="drawer-order-card">
                          <div className="order-card-top">
                            <div>
                              <span className="order-inv-num">#{ord.invoice_number}</span>
                              <span className="order-date-text">
                                {new Date(ord.createdAt || ord.sale_date).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>
                            <div
                              className={`order-status-badge status-${(ord.order_status || 'PLACED').toLowerCase()}`}
                            >
                              {ord.order_status || 'PLACED'}
                            </div>
                          </div>

                          <div className="order-card-middle">
                            <div className="order-total-amount">
                              ₹{parseFloat(ord.grand_total || 0).toLocaleString('en-IN')}
                            </div>
                            <div className="order-pay-method">
                              {ord.payment_method || 'CASH'} • {ord.payment_status === 'PAID' ? 'Paid' : 'Unpaid'}
                            </div>
                          </div>

                          {ord.items && ord.items.length > 0 && (
                            <p className="order-items-brief">
                              {ord.items.map((it) => `${it.product_name} (${it.quantity})`).join(', ')}
                            </p>
                          )}

                          {ord.tracking_number && (
                            <div className="order-tracking-hint">
                              <Truck size={12} />
                              <span>Tracking: <strong>{ord.tracking_number}</strong> {ord.courier_name ? `via ${ord.courier_name}` : ''}</span>
                            </div>
                          )}

                          <div className="order-card-actions">
                            <button
                              type="button"
                              onClick={() => {
                                setIsCustomerAccountOpen(false);
                                handleTrackOrder(ord.invoice_number);
                              }}
                              className="btn-order-track-card"
                              style={{ background: `${primaryColor}15`, color: primaryColor }}
                            >
                              <Truck size={14} />
                              <span>Track Live Status</span>
                            </button>
                            <Link
                              to={`/e-bill/${ord.invoice_number}`}
                              target="_blank"
                              rel="noreferrer"
                              className="btn-order-ebill-card"
                            >
                              <FileText size={14} />
                              <span>E-Bill</span>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                /* EDIT PROFILE & DELIVERY ADDRESS TAB */
                <form onSubmit={handleSaveCustomerProfile} className="drawer-profile-form">
                  <div className="profile-form-intro">
                    <h5>Profile & Delivery Details</h5>
                    <p>Keep your contact and doorstep address updated for fast checkout and delivery updates.</p>
                  </div>

                  <div className="form-group-clean">
                    <label>Full Name</label>
                    <input
                      type="text"
                      className="clean-input"
                      placeholder="Your Full Name"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="form-group-clean">
                    <label>Mobile Number</label>
                    <div className="input-with-badge">
                      <input
                        type="tel"
                        className="clean-input"
                        value={profileForm.phone}
                        disabled
                        style={{ background: '#f8fafc', color: '#64748b', cursor: 'not-allowed' }}
                      />
                      <span className="verified-badge-mini">
                        <CheckCheck size={12} /> Verified
                      </span>
                    </div>
                    <span className="input-hint-clean">Mobile number linked to your verified account.</span>
                  </div>

                  <div className="form-group-clean">
                    <label>Email Address</label>
                    <input
                      type="email"
                      className="clean-input"
                      placeholder="name@example.com (for e-receipts)"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, email: e.target.value }))}
                    />
                  </div>

                  <div className="form-group-clean">
                    <label>Primary Delivery Address</label>
                    <textarea
                      rows={3}
                      className="clean-input clean-textarea"
                      placeholder="Flat/House No., Street Name, Landmark, Area..."
                      value={profileForm.address}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, address: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="form-row-2col">
                    <div className="form-group-clean">
                      <label>City / Town</label>
                      <input
                        type="text"
                        className="clean-input"
                        placeholder="City"
                        value={profileForm.city}
                        onChange={(e) => setProfileForm((prev) => ({ ...prev, city: e.target.value }))}
                      />
                    </div>
                    <div className="form-group-clean">
                      <label>Pincode</label>
                      <input
                        type="text"
                        maxLength={6}
                        className="clean-input"
                        placeholder="6-digit PIN"
                        value={profileForm.pincode}
                        onChange={(e) => setProfileForm((prev) => ({ ...prev, pincode: e.target.value }))}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="btn-clean-primary"
                    style={{
                      background: primaryColor,
                      width: '100%',
                      marginTop: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.45rem'
                    }}
                  >
                    {isSavingProfile ? (
                      <>
                        <Loader2 size={16} className="spinner" />
                        <span>Saving Changes...</span>
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        <span>Save Profile & Delivery Details</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            <div className="customer-drawer-footer">
              <button
                type="button"
                onClick={handleCustomerLogout}
                className="btn-customer-logout"
              >
                <LogOut size={16} />
                <span>Log Out from Store</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Live Order Tracking Modal */}
      {isTrackingModalOpen && (
        <div className="clean-modal-overlay" onClick={() => setIsTrackingModalOpen(false)}>
          <div className="clean-order-tracking-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setIsTrackingModalOpen(false)}
              className="clean-btn-modal-close"
              aria-label="Close Tracking"
            >
              <X size={18} />
            </button>

            <div className="tracking-modal-header">
              <div className="tracking-header-icon" style={{ background: `${primaryColor}15`, color: primaryColor }}>
                <Truck size={24} />
              </div>
              <div>
                <h3>Live Order Tracking</h3>
                <p>Real-time delivery progression from dispatch to doorstep</p>
              </div>
            </div>

            {/* Quick Invoice Search Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleTrackOrder(trackingInvoiceInput);
              }}
              className="tracking-search-bar"
            >
              <input
                type="text"
                placeholder="Enter Invoice Number (e.g. INV-1002)"
                value={trackingInvoiceInput}
                onChange={(e) => setTrackingInvoiceInput(e.target.value)}
                required
              />
              <button
                type="submit"
                disabled={isTrackingLoading}
                className="btn-clean-primary"
                style={{ background: primaryColor }}
              >
                {isTrackingLoading ? <Loader2 size={15} className="spinner" /> : 'Track'}
              </button>
            </form>

            {isTrackingLoading ? (
              <div className="tracking-loading-state">
                <Loader2 size={32} className="spinner text-primary" />
                <p>Querying real-time fulfillment status...</p>
              </div>
            ) : trackingOrderData ? (
              <div className="tracking-content-body">
                {/* Order Summary Pill */}
                <div className="tracking-summary-pill">
                  <div>
                    <span className="summary-label">Invoice</span>
                    <strong>#{trackingOrderData.invoiceNumber}</strong>
                  </div>
                  <div>
                    <span className="summary-label">Placed On</span>
                    <span>
                      {new Date(trackingOrderData.orderDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="summary-label">Order Total</span>
                    <strong>₹{parseFloat(trackingOrderData.grandTotal || 0).toLocaleString('en-IN')}</strong>
                  </div>
                  <div>
                    <span className="summary-label">Status</span>
                    <span className={`order-status-badge status-${(trackingOrderData.orderStatus || 'PLACED').toLowerCase()}`}>
                      {trackingOrderData.orderStatus || 'PLACED'}
                    </span>
                  </div>
                </div>

                {/* 6-Stage Visual Stepper Timeline */}
                <div className="tracking-stepper-container">
                  <div className="tracking-stepper-title">Fulfillment Progress</div>
                  <div className="tracking-stepper-flow">
                    {(trackingOrderData.timeline || [
                      { step: 'PLACED', label: 'Order Placed', desc: 'Order logged', completed: true, active: false },
                      { step: 'CONFIRMED', label: 'Confirmed', desc: 'Approved by store', completed: true, active: false },
                      { step: 'PACKED', label: 'Packed', desc: 'Packed at hub', completed: false, active: true },
                      { step: 'SHIPPED', label: 'Dispatched', desc: 'With courier', completed: false, active: false },
                      { step: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', desc: 'On delivery route', completed: false, active: false },
                      { step: 'DELIVERED', label: 'Delivered', desc: 'Doorstep delivered', completed: false, active: false }
                    ]).map((st, sIdx) => {
                      const isDone = Boolean(st.completed);
                      const isCurrent = Boolean(st.active);
                      return (
                        <div
                          key={st.step || sIdx}
                          className={`tracking-step-node ${isDone ? 'done' : ''} ${isCurrent ? 'active' : ''}`}
                        >
                          <div className="step-marker-col">
                            <div
                              className="step-circle"
                              style={isDone || isCurrent ? { background: isDone ? '#10b981' : primaryColor, color: '#fff' } : {}}
                            >
                              {isDone ? <Check size={14} /> : <span>{sIdx + 1}</span>}
                            </div>
                            {sIdx < 5 && <div className={`step-connector ${isDone ? 'done' : ''}`} />}
                          </div>
                          <div className="step-info-col">
                            <strong className="step-label">{st.label}</strong>
                            <p className="step-desc">{st.desc}</p>
                            {st.timestamp && (
                              <span className="step-timestamp">
                                {new Date(st.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Courier / Shipping Details */}
                {(trackingOrderData.courierName || trackingOrderData.trackingNumber) && (
                  <div className="tracking-courier-card">
                    <Package size={20} color={primaryColor} />
                    <div>
                      <strong>Carrier: {trackingOrderData.courierName || 'Store Express Logistics'}</strong>
                      {trackingOrderData.trackingNumber && (
                        <p>AWB / Tracking Number: <code>{trackingOrderData.trackingNumber}</code></p>
                      )}
                    </div>
                  </div>
                )}

                {/* Delivery Address */}
                {trackingOrderData.deliveryAddress && (
                  <div className="tracking-address-card">
                    <MapPin size={18} color="#64748b" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <span className="label">Delivering To:</span>
                      <p>{trackingOrderData.deliveryAddress}</p>
                    </div>
                  </div>
                )}

                {/* Order Items */}
                {trackingOrderData.items && trackingOrderData.items.length > 0 && (
                  <div className="tracking-items-card">
                    <h6>Items in this shipment:</h6>
                    <ul className="tracking-items-list">
                      {trackingOrderData.items.map((it, idx) => (
                        <li key={idx}>
                          <span>{it.name} &times; {it.quantity}</span>
                          <strong>₹{parseFloat(it.totalPrice || it.unitPrice * it.quantity || 0).toLocaleString('en-IN')}</strong>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* WhatsApp Support Action */}
                {whatsappUrl && (
                  <div className="tracking-support-prompt">
                    <span>Have questions about this delivery?</span>
                    <a
                      href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                        `Hello ${storeTitle}, I am inquiring about my Order #${trackingOrderData.invoiceNumber} (Status: ${trackingOrderData.orderStatus || 'Pending'}).`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-clean-whatsapp"
                      style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
                    >
                      <WhatsAppBrandIcon size={15} color="#25D366" />
                      <span>Chat Support</span>
                    </a>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
