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
  X,
  CreditCard,
  Banknote,
  QrCode,
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
  Twitter
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
  const { companyCode } = useParams();
  const catalogRef = useRef(null);
  const sortDropdownRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [storeData, setStoreData] = useState(null);
  const [error, setError] = useState('');

  // Filtering, Search & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [sortBy, setSortBy] = useState('DEFAULT');
  const [isSortOpen, setIsSortOpen] = useState(false);

  // Testimonials Carousel index (3 per view)
  const [testimonialIndex, setTestimonialIndex] = useState(0);

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

  // Close sort dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target)) {
        setIsSortOpen(false);
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

  // Cart Actions
  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
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
          availableStock: product.availableStock || 999,
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

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      toast.warn('Your bag is empty.');
      return;
    }
    if (!customer.name.trim() || !customer.phone.trim()) {
      toast.warn('Please provide your Name and Mobile Number.');
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
        const heroTitle = sData.title || `Welcome to ${storeTitle}`;
        const heroSubtitle = sData.subtitle || tagline;
        const heroBadge = sData.badge || 'Official Online Store';
        const heroCta = sData.ctaText || 'Explore Catalog';
        const heroImg = sData.imageUrl || heroConfig.imageUrl;
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
                  const inStock = prod.inStock !== false && (prod.availableStock === undefined || prod.availableStock > 0);
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
                    const inStock = prod.inStock !== false && (prod.availableStock === undefined || prod.availableStock > 0);
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
                    <div className="clean-review-stars">
                      {[...Array(rev.rating || 5)].map((_, s) => (
                        <Star key={s} size={15} fill="#f59e0b" color="#f59e0b" />
                      ))}
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
      {/* 1. Header & Navbar (Customer-Facing with Dynamic Navigation Links) */}
      <header className="clean-store-header">
        <div className="clean-header-container">
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

          {/* Dynamic Navigation Menu */}
          {navLinks && navLinks.length > 0 && (
            <nav className="clean-nav-menu">
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

          <div className="clean-header-actions">
            {navbarConfig.showWhatsApp !== false && whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-clean-whatsapp"
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
          </div>
        </div>
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
                    <span className="payment-badge-pill">UPI</span>
                  )}
                  {footerConfig.paymentBadges?.cards !== false && (
                    <span className="payment-badge-pill">RuPay / Cards</span>
                  )}
                  {footerConfig.paymentBadges?.netbanking !== false && (
                    <span className="payment-badge-pill">Net Banking</span>
                  )}
                  {footerConfig.paymentBadges?.cod !== false && (
                    <span className="payment-badge-pill">Cash on Delivery</span>
                  )}
                  {footerConfig.paymentBadges?.genuine !== false && (
                    <span className="payment-badge-pill genuine"><ShieldCheck size={12} color="#10b981" /> 100% Genuine</span>
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

                {/* Checkout Customer Form */}
                <form onSubmit={handlePlaceOrder} className="clean-checkout-form">
                  <h4 className="clean-form-heading">Delivery &amp; Customer Details</h4>

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

                  <div className="clean-form-grid">
                    <div className="clean-input-group">
                      <label>Full Name *</label>
                      <div className="input-with-icon">
                        <User size={14} className="input-icon" />
                        <input
                          type="text"
                          placeholder="e.g. Ramesh"
                          required
                          value={customer.name}
                          onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="clean-input-group">
                      <label>Mobile Number *</label>
                      <div className="input-with-icon">
                        <Phone size={14} className="input-icon" />
                        <input
                          type="tel"
                          placeholder="10-digit mobile"
                          required
                          value={customer.phone}
                          onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="clean-input-group">
                    <label>Email Address (Optional)</label>
                    <div className="input-with-icon">
                      <Mail size={14} className="input-icon" />
                      <input
                        type="email"
                        placeholder="For digital e-invoice receipt"
                        value={customer.email}
                        onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                      />
                    </div>
                  </div>

                  {customer.deliveryType === 'DELIVERY' && (
                    <div className="clean-input-group">
                      <label>Delivery Address *</label>
                      <textarea
                        rows={2}
                        placeholder="Flat/House, Street, Area, City & Pincode"
                        required
                        value={customer.address}
                        onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                      />
                    </div>
                  )}

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

                <div className="clean-modal-actions">
                  <button
                    onClick={() => {
                      addToCart(quickViewProduct);
                      setQuickViewProduct(null);
                    }}
                    className="btn-clean-primary"
                    style={{ background: primaryColor }}
                  >
                    <Plus size={16} /> Add to Bag
                  </button>
                </div>
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
                onClick={() => setOrderSuccess(null)}
                className="btn-clean-outline"
              >
                Continue Browsing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
