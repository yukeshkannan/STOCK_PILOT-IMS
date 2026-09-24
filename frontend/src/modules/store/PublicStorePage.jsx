import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../../services/api';
import { toast } from 'react-toastify';
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
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Check,
  Truck,
  User,
  ArrowUpDown,
  ShoppingBasket
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
    paymentMethod: 'COD' // 'COD' | 'UPI'
  });

  // Order State
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);

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
      return [
        ...prev,
        {
          id: product.id,
          productId: product.id,
          productCode: product.product_code,
          name: product.name,
          unitPrice: parseFloat(product.selling_price) || 0,
          purchasePrice: parseFloat(product.purchase_price) || 0,
          taxRate: parseFloat(product.tax_rate) || 18,
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

  // Cart Financials
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  }, [cart]);

  const cartTax = useMemo(() => {
    return Math.round(cartSubtotal * 0.18); // 18% GST standard
  }, [cartSubtotal]);

  const cartGrandTotal = cartSubtotal + cartTax;
  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Place Order Handler
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

    try {
      setPlacingOrder(true);
      const payload = {
        companyCode: companyCode.toUpperCase(),
        customerName: customer.name.trim(),
        customerPhone: customer.phone.trim(),
        customerEmail: customer.email ? customer.email.trim() : null,
        customerAddress: customer.deliveryType === 'DELIVERY' ? customer.address : 'Store Counter Pickup',
        paymentMethod: customer.paymentMethod,
        items: cart.map((item) => ({
          productId: item.id,
          productCode: item.productCode,
          productName: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          purchasePrice: item.purchasePrice,
          taxRate: item.taxRate
        })),
        notes: `Online Storefront Order (${customer.deliveryType})`
      };

      const res = await api.post('/sales/public/order', payload);
      const orderRes = res?.data || res;

      setOrderSuccess(orderRes);
      setCart([]);
      setIsCartOpen(false);
      toast.success('Order placed successfully!');
    } catch (err) {
      toast.error(err?.message || 'Failed to place order. Please try again.');
    } finally {
      setPlacingOrder(false);
    }
  };

  const scrollToCatalog = () => {
    if (catalogRef.current) {
      catalogRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

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

  const { tenant, categories = [], products = [], storeConfig = {} } = storeData;
  const branding = storeConfig.branding || {};
  const navbarConfig = storeConfig.navbar || {};
  const heroConfig = storeConfig.hero || {};
  const productsSection = storeConfig.productsSection || {};
  const testimonials = storeConfig.testimonials || {};
  const contactConfig = storeConfig.contact || {};
  const sectionsConfig = storeConfig.sections || {};

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
  const allReviews = testimonials.reviews || [];
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

      {/* 2. Full-Screen Majestic Hero Showcase Section */}
      {heroConfig.enabled !== false && (
        <section
          id="home"
          className="clean-hero-fullscreen"
          style={{
            backgroundImage: heroConfig.imageUrl
              ? `linear-gradient(rgba(15, 23, 42, 0.72), rgba(15, 23, 42, 0.88)), url('${heroConfig.imageUrl}')`
              : `linear-gradient(135deg, ${primaryColor}22 0%, #0f172a 100%)`
          }}
        >
          <div className="clean-hero-content-wrapper">
            {heroConfig.badge && (
              <div className="clean-hero-badge-pill" style={{ color: '#34d399' }}>
                <span className="badge-bullet" />
                {heroConfig.badge}
              </div>
            )}
            <h2 className="clean-hero-giant-title">
              {heroConfig.title || `Welcome to ${storeTitle}`}
            </h2>
            <p className="clean-hero-description">
              {heroConfig.subtitle || tagline}
            </p>
            <div className="clean-hero-actions-row">
              <button
                onClick={scrollToCatalog}
                className="btn-hero-primary"
                style={{ background: primaryColor }}
              >
                {heroConfig.ctaText || 'Explore Catalog'}
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
      )}

      {/* 2.5 Trust Badges & Store Overview (About Anchor) */}
      {sectionsConfig.trustBadgesEnabled !== false && (
        <section id="about" className="clean-trust-strip-section" style={{ background: cardColor }}>
          <div className="clean-trust-strip-container">
            {(storeConfig.trustBadges || [
              { icon: 'Zap', title: 'Express Dispatch', desc: 'Fast doorstep delivery' },
              { icon: 'ShieldCheck', title: '100% Genuine', desc: 'Verified from authorized stock' },
              { icon: 'CreditCard', title: 'Flexible Payments', desc: 'UPI, Card & Cash on Delivery' },
              { icon: 'Phone', title: 'Direct Store Support', desc: 'Instant WhatsApp & Call help' }
            ]).map((badge, idx) => (
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
      )}

      {/* 3. Featured Catalog Section (Products Anchor) */}
      <main id="products" ref={catalogRef} className="clean-store-main">
        <div className="clean-section-header-row">
          <div>
            <h2 className="clean-section-title">
              {productsSection.title || 'Featured Catalog'}
            </h2>
            <p className="clean-section-subtitle">
              {productsSection.subtitle || 'Browse all available products in real-time inventory'}
            </p>
          </div>

          {/* Sleek Custom Sort Dropdown */}
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
                <ChevronDown
                  size={15}
                  className={`sort-chevron ${isSortOpen ? 'rotated' : ''}`}
                />
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
          {productsSection.showSearch !== false && (
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

          {sectionsConfig.categoriesEnabled !== false && (
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
                  {/* Image Container */}
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
                    {productsSection.showStockBadge !== false && (
                      <span className={`clean-stock-tag ${inStock ? 'in-stock' : 'out-stock'}`}>
                        {inStock ? 'In Stock' : 'Out of Stock'}
                      </span>
                    )}
                  </div>

                  {/* Body */}
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

                    {/* Price & Action */}
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

      {/* 4. Testimonials & Customer Reviews Section (3 Cards with Carousel Arrows) */}
      {testimonials.enabled !== false && allReviews.length > 0 && (
        <section id="testimonials" className="clean-testimonials-section">
          <div className="clean-testimonials-container">
            <div className="clean-section-header-carousel">
              <div>
                <div className="clean-pill-tag" style={{ color: accentColor }}>
                  Verified Buyer Feedback
                </div>
                <h2 className="clean-section-title">
                  {testimonials.title || 'What Our Customers Say'}
                </h2>
                <p className="clean-section-subtitle">
                  {testimonials.subtitle || 'Real feedback from verified buyers across India'}
                </p>
              </div>

              {allReviews.length > 3 && (
                <div className="clean-carousel-controls">
                  <button
                    onClick={handlePrevTestimonials}
                    className="btn-carousel-nav"
                    aria-label="Previous Testimonials"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={handleNextTestimonials}
                    className="btn-carousel-nav"
                    aria-label="Next Testimonials"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </div>

            <div className="clean-reviews-grid-3">
              {visibleReviews.map((rev, idx) => (
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
      )}

      {/* 5. Contact & Store Footer Section */}
      {contactConfig.enabled !== false && (
        <footer id="contact" className="clean-store-footer-section">
          <div className="clean-footer-container">
            <div className="clean-footer-grid">
              {/* Col 1: Store Brand */}
              <div className="clean-footer-brand-col">
                <div className="clean-brand-section">
                  <div className="clean-brand-avatar" style={{ background: primaryColor }}>
                    <Store size={22} />
                  </div>
                  <div>
                    <h3 className="clean-store-title" style={{ fontSize: '1.15rem' }}>{storeTitle}</h3>
                    <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>
                      {tagline}
                    </p>
                  </div>
                </div>
                <p className="clean-footer-bio">
                  Direct digital storefront powered by StockPilot IMS multi-tenant inventory & billing engine.
                </p>
                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-clean-whatsapp"
                    style={{ display: 'inline-flex', marginTop: '0.75rem' }}
                  >
                    <WhatsAppBrandIcon size={18} color="#25D366" />
                    <span>Direct WhatsApp Chat</span>
                  </a>
                )}
              </div>

              {/* Col 2: Store Information */}
              <div className="clean-footer-info-col">
                <h4>Store & Location</h4>
                <ul className="clean-footer-contact-list">
                  {(contactConfig.address || tenant.address) && (
                    <li>
                      <MapPin size={16} color={accentColor} />
                      <span>{contactConfig.address || tenant.address}</span>
                    </li>
                  )}
                  {(contactConfig.phone || tenant.phone) && (
                    <li>
                      <Phone size={16} color={accentColor} />
                      <span>{contactConfig.phone || tenant.phone}</span>
                    </li>
                  )}
                  {(contactConfig.email || tenant.email) && (
                    <li>
                      <Mail size={16} color={accentColor} />
                      <span>{contactConfig.email || tenant.email}</span>
                    </li>
                  )}
                  {contactConfig.hours && (
                    <li>
                      <Clock size={16} color={accentColor} />
                      <span>{contactConfig.hours}</span>
                    </li>
                  )}
                </ul>
              </div>

              {/* Col 3: Customer Assurance */}
              <div className="clean-footer-info-col">
                <h4>Customer Assurance</h4>
                <div className="clean-footer-badges">
                  <div className="footer-badge-pill">
                    <ShieldCheck size={14} color={accentColor} /> 100% Genuine Stock
                  </div>
                  <div className="footer-badge-pill">
                    <Zap size={14} color={accentColor} /> Express Dispatch
                  </div>
                  <div className="footer-badge-pill">
                    <CreditCard size={14} color={accentColor} /> Flexible UPI & COD
                  </div>
                </div>
              </div>
            </div>

            <div className="clean-footer-bottom-bar">
              <p>© {new Date().getFullYear()} {storeTitle}. All rights reserved.</p>
              <p className="clean-powered-tag">
                Powered by <strong>StockPilot IMS</strong>
              </p>
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
                    <span>Estimated GST (18%)</span>
                    <span>₹{cartTax.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="clean-bill-row">
                    <span>Delivery</span>
                    <span className="text-emerald">{cartSubtotal >= 499 ? 'FREE' : '₹49'}</span>
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
                    <label>Payment Mode</label>
                    <div className="clean-payment-options">
                      <label className={`clean-pay-radio ${customer.paymentMethod === 'COD' ? 'selected' : ''}`}>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="COD"
                          checked={customer.paymentMethod === 'COD'}
                          onChange={() => setCustomer({ ...customer, paymentMethod: 'COD' })}
                        />
                        <div>
                          <strong>Cash on Delivery</strong>
                          <span>Pay upon doorstep delivery</span>
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
                          <strong>Instant UPI Pay</strong>
                          <span>GPay, PhonePe, Paytm QR</span>
                        </div>
                      </label>
                    </div>
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
                      <span>Place Order • ₹{cartGrandTotal.toLocaleString('en-IN')}</span>
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
