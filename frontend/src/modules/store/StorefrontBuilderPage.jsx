import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../../services/api';
import { toast } from 'react-toastify';
import {
  Store,
  Palette,
  Layout,
  Megaphone,
  Image as ImageIcon,
  Sparkles,
  Phone,
  CheckCircle2,
  ExternalLink,
  Copy,
  Save,
  Monitor,
  Smartphone,
  Eye,
  ShoppingBag,
  Zap,
  ShieldCheck,
  CreditCard,
  Sliders,
  Check,
  Star,
  Plus,
  Trash2,
  MapPin,
  Clock,
  ChevronDown,
  ChevronUp,
  Search,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Lock,
  Link as LinkIcon,
  Globe,
  GripVertical,
  Package
} from 'lucide-react';
import { WhatsAppBrandIcon } from './PublicStorePage';
import './StorefrontBuilderPage.css';

export const THEME_PRESETS = [
  {
    id: 'CLEAN_LIGHT',
    name: 'StockPilot Signature',
    description: 'Crisp white surface with signature Knack Berry Plum accents',
    primary: '#982A86',
    accent: '#10b981',
    bg: '#ffffff',
    card: '#ffffff',
    text: '#0f172a',
    border: '#e2e8f0'
  },
  {
    id: 'MINIMAL_WHITE',
    name: 'Minimalist Slate',
    description: 'Neutral monochrome for boutique fashion and lifestyle stores',
    primary: '#0f172a',
    accent: '#2563eb',
    bg: '#f8fafc',
    card: '#ffffff',
    text: '#09090b',
    border: '#e2e8f0'
  },
  {
    id: 'ROYAL_INDIGO',
    name: 'Royal Indigo',
    description: 'Deep royal blue & cyan for tech, corporate & B2B brands',
    primary: '#4f46e5',
    accent: '#06b6d4',
    bg: '#f8fafc',
    card: '#ffffff',
    text: '#0f172a',
    border: '#e2e8f0'
  },
  {
    id: 'VIBRANT_RETAIL',
    name: 'Vibrant Retail',
    description: 'High-energy crimson & amber for supermarkets & marts',
    primary: '#e11d48',
    accent: '#f59e0b',
    bg: '#ffffff',
    card: '#ffffff',
    text: '#18181b',
    border: '#e2e8f0'
  },
  {
    id: 'EMERALD_NATURE',
    name: 'Emerald Organic',
    description: 'Fresh botanical greens for wellness, beauty & organics',
    primary: '#059669',
    accent: '#10b981',
    bg: '#f0fdf4',
    card: '#ffffff',
    text: '#064e3b',
    border: '#bbf7d0'
  },
  {
    id: 'MODERN_DARK',
    name: 'Midnight Dark',
    description: 'Modern dark aesthetic for electronics & luxury goods',
    primary: '#982A86',
    accent: '#10b981',
    bg: '#0f172a',
    card: '#1e293b',
    text: '#f8fafc',
    border: 'rgba(255,255,255,0.08)'
  }
];

export const BANNER_IMAGE_PRESETS = [
  {
    category: 'Fashion & Apparel',
    url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=80',
    title: 'Modern Retail Boutique'
  },
  {
    category: 'Electronics & Tech',
    url: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=1600&q=80',
    title: 'Gadgets & Audio'
  },
  {
    category: 'Supermarket & Grocery',
    url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1600&q=80',
    title: 'Organic Food & Fresh Mart'
  },
  {
    category: 'Footwear & Shoes',
    url: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&w=1600&q=80',
    title: 'Sneakers & Leather Shoes'
  },
  {
    category: 'Luxury & Accessories',
    url: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=1600&q=80',
    title: 'Store Interior & Watches'
  }
];

export const DEFAULT_NAV_LINKS = [
  { id: '1', label: 'Home', url: '#home', enabled: true },
  { id: '2', label: 'Products', url: '#products', enabled: true },
  { id: '3', label: 'About', url: '#about', enabled: true },
  { id: '4', label: 'Testimonials', url: '#testimonials', enabled: true },
  { id: '5', label: 'Contact', url: '#contact', enabled: true }
];

export default function StorefrontBuilderPage() {
  const { user } = useSelector((state) => state.auth);
  const companyCode = user?.companyCode || user?.company_code || (user?.companyName ? user.companyName.trim().toUpperCase().replace(/[^A-Z0-9]/g, '') : 'STORE');
  const liveStoreUrl = `${window.location.origin}/store/${companyCode}`;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Real Tenant Products & Stocks State
  const [tenantProducts, setTenantProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [builderProductSearch, setBuilderProductSearch] = useState('');
  const [selectedSimCategory, setSelectedSimCategory] = useState('ALL');

  // Dynamic categories from purchased products
  const purchasedCategories = useMemo(() => {
    const cats = new Set();
    tenantProducts.forEach((p) => {
      const cat = p.category?.name || p.category_name || (typeof p.category === 'string' ? p.category : null);
      if (cat && cat.trim()) cats.add(cat.trim());
    });
    return Array.from(cats);
  }, [tenantProducts]);

  // Active Sidebar Mode: 'sections' | 'theme'
  const [activeTab, setActiveTab] = useState('sections');

  // Accordion open states
  const [openAccordions, setOpenAccordions] = useState({
    navbar: true,
    announcement: false,
    hero: false,
    products: false,
    testimonials: false,
    contact: false
  });

  const toggleAccordion = (key) => {
    setOpenAccordions((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const [previewDevice, setPreviewDevice] = useState('desktop');
  const [simTestimonialIndex, setSimTestimonialIndex] = useState(0);

  const [config, setConfig] = useState({
    template: 'CUSTOM',
    theme: 'CLEAN_LIGHT',
    branding: {
      storeName: user?.companyName || 'My Online Store',
      tagline: 'Quality Products Delivered Directly to Your Doorstep',
      primaryColor: '#982A86',
      accentColor: '#10b981',
      bgColor: '#ffffff',
      cardColor: '#ffffff',
      textColor: '#0f172a',
      logoUrl: '',
      bannerUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=80'
    },
    announcement: {
      enabled: false,
      text: 'Free express delivery on orders above ₹499 | 100% Genuine Quality Guaranteed'
    },
    navbar: {
      enabled: true,
      showPhone: true,
      showAddress: true,
      showWhatsApp: true,
      showCart: true,
      navLinks: DEFAULT_NAV_LINKS
    },
    hero: {
      enabled: true,
      badge: 'Official Online Store',
      title: `Welcome to ${user?.companyName || 'Our Store'}`,
      subtitle: 'Shop the freshest arrivals, exclusive store offers, and verified products delivered quickly.',
      ctaText: 'Explore Catalog',
      secondaryCtaText: 'Contact Store',
      imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=80'
    },
    productsSection: {
      enabled: true,
      title: 'Featured Catalog',
      subtitle: 'Browse all available products in real-time inventory',
      showSearch: true,
      showCategories: true,
      showStockBadge: true,
      showOnlyInStock: true,
      selectedProductIds: []
    },
    testimonials: {
      enabled: true,
      title: 'What Our Customers Say',
      subtitle: 'Verified reviews from direct buyers across India',
      reviews: [
        {
          id: 1,
          name: 'Priya Sharma',
          rating: 5,
          comment: 'Outstanding product quality and super fast delivery. The ordering experience was seamless!',
          role: 'Verified Buyer',
          location: 'Chennai'
        },
        {
          id: 2,
          name: 'Rajesh Kumar',
          rating: 5,
          comment: '100% genuine stock. Direct WhatsApp updates made the whole checkout effortless.',
          role: 'Verified Customer',
          location: 'Bengaluru'
        },
        {
          id: 3,
          name: 'Sneha Patel',
          rating: 5,
          comment: 'Great pricing and prompt customer assistance. We will definitely continue ordering!',
          role: 'Verified Buyer',
          location: 'Mumbai'
        }
      ]
    },
    contact: {
      enabled: true,
      title: 'Visit Our Store & Contact',
      subtitle: 'Reach out to our team directly for inquiries and bulk quotes',
      address: user?.address || 'Retail Center, Main Commercial Street, Chennai',
      phone: user?.phone || '8056685161',
      email: user?.email || 'store@stockpilot.io',
      hours: 'Mon - Sat: 9:00 AM - 9:00 PM',
      whatsappNumber: user?.phone || '8056685161',
      whatsappMessage: `Hello! I would like to inquire about products from ${user?.companyName || 'your store'}.`
    },
    sections: {
      categoriesEnabled: true,
      featuredProductsEnabled: true,
      trustBadgesEnabled: true,
      testimonialsEnabled: true,
      contactFooterEnabled: true
    },
    trustBadges: [
      { icon: 'Zap', title: 'Express Dispatch', desc: 'Fast doorstep delivery' },
      { icon: 'ShieldCheck', title: '100% Genuine', desc: 'Verified authorized stock' },
      { icon: 'CreditCard', title: 'Flexible Payments', desc: 'UPI, Card & COD' },
      { icon: 'Phone', title: 'Store Support', desc: 'Instant WhatsApp assistance' }
    ],
    whatsapp: {
      enabled: true,
      phoneNumber: user?.phone || '',
      defaultMessage: `Hello! I would like to inquire about products from ${user?.companyName || 'your store'}.`
    }
  });

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await api.get('/tenants/store-config');
      if (res?.data) {
        setConfig((prev) => {
          const loadedNav = res.data.navbar || {};
          const mergedNavLinks = Array.isArray(loadedNav.navLinks) && loadedNav.navLinks.length > 0
            ? loadedNav.navLinks
            : DEFAULT_NAV_LINKS;

          return {
            ...prev,
            ...res.data,
            branding: { ...prev.branding, ...(res.data.branding || {}) },
            announcement: { ...prev.announcement, ...(res.data.announcement || {}) },
            navbar: {
              ...prev.navbar,
              ...loadedNav,
              navLinks: mergedNavLinks
            },
            hero: { ...prev.hero, ...(res.data.hero || {}) },
            productsSection: { ...prev.productsSection, ...(res.data.productsSection || {}) },
            testimonials: {
              ...prev.testimonials,
              ...(res.data.testimonials || {}),
              reviews: res.data.testimonials?.reviews || prev.testimonials.reviews
            },
            contact: { ...prev.contact, ...(res.data.contact || {}) },
            sections: { ...prev.sections, ...(res.data.sections || {}) },
            whatsapp: { ...prev.whatsapp, ...(res.data.whatsapp || {}) }
          };
        });
      }
    } catch (err) {
      console.warn('Using default store config:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTenantProducts = async () => {
    try {
      setLoadingProducts(true);
      const [prodRes, stockRes, purRes] = await Promise.allSettled([
        api.get('/products?limit=200'),
        api.get('/inventory/stocks'),
        api.get('/purchases?limit=200')
      ]);

      const rawProds = prodRes.status === 'fulfilled' ? (prodRes.value?.data?.products || (Array.isArray(prodRes.value?.data) ? prodRes.value.data : [])) : [];
      const rawStocks = stockRes.status === 'fulfilled' ? (stockRes.value?.data || []) : [];
      const rawPurchases = purRes.status === 'fulfilled' ? (purRes.value?.data?.purchases || (Array.isArray(purRes.value?.data) ? purRes.value.data : [])) : [];

      const stockMap = {};
      rawStocks.forEach((s) => {
        stockMap[s.product_id] = (stockMap[s.product_id] || 0) + (Number(s.current_stock) || 0);
      });

      // ONLY include products that have been purchased via a purchase order
      const purchasedProductIds = new Set();
      rawPurchases.forEach((po) => {
        if (po.status !== 'CANCELLED' && Array.isArray(po.items)) {
          po.items.forEach((item) => {
            if (item.product_id) purchasedProductIds.add(Number(item.product_id));
          });
        }
      });

      const onlyPurchased = rawProds
        .filter((p) => purchasedProductIds.has(Number(p.id)))
        .map((p) => {
          const stock = stockMap[p.id] !== undefined ? stockMap[p.id] : 0;
          return {
            ...p,
            currentStock: stock,
            isPurchased: true
          };
        });

      setTenantProducts(onlyPurchased);
    } catch (err) {
      console.warn('Failed to load products for storefront builder:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchConfig();
    fetchTenantProducts();
  }, []);

  const handleApplyPreset = (preset) => {
    setConfig((prev) => ({
      ...prev,
      theme: preset.id,
      branding: {
        ...prev.branding,
        primaryColor: preset.primary,
        accentColor: preset.accent,
        bgColor: preset.bg,
        cardColor: preset.card,
        textColor: preset.text
      }
    }));
    toast.info(`Applied "${preset.name}" palette!`);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put('/tenants/store-config', config);
      toast.success('Storefront theme & navigation published live!');
    } catch (err) {
      toast.error(err?.message || 'Failed to save store configuration.');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(liveStoreUrl);
    setCopiedUrl(true);
    toast.success('Public store URL copied to clipboard!');
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  // Dynamic Navigation Links Helpers
  const handleAddNavLink = () => {
    const newLink = {
      id: Date.now().toString(),
      label: 'New Link',
      url: '#products',
      enabled: true
    };
    setConfig((prev) => ({
      ...prev,
      navbar: {
        ...prev.navbar,
        navLinks: [...(prev.navbar.navLinks || []), newLink]
      }
    }));
  };

  const handleRemoveNavLink = (id) => {
    setConfig((prev) => ({
      ...prev,
      navbar: {
        ...prev.navbar,
        navLinks: (prev.navbar.navLinks || []).filter((item) => item.id !== id)
      }
    }));
  };

  const handleUpdateNavLink = (id, field, value) => {
    setConfig((prev) => ({
      ...prev,
      navbar: {
        ...prev.navbar,
        navLinks: (prev.navbar.navLinks || []).map((item) =>
          item.id === id ? { ...item, [field]: value } : item
        )
      }
    }));
  };

  // Review Manager Helpers
  const handleAddReview = () => {
    const newRev = {
      id: Date.now(),
      name: 'Happy Customer',
      rating: 5,
      comment: 'Excellent quality and quick doorstep delivery!',
      role: 'Verified Buyer',
      location: 'Chennai'
    };
    setConfig((prev) => ({
      ...prev,
      testimonials: {
        ...prev.testimonials,
        reviews: [...prev.testimonials.reviews, newRev]
      }
    }));
  };

  const handleRemoveReview = (id) => {
    setConfig((prev) => ({
      ...prev,
      testimonials: {
        ...prev.testimonials,
        reviews: prev.testimonials.reviews.filter((r) => r.id !== id)
      }
    }));
  };

  const handleUpdateReview = (id, field, value) => {
    setConfig((prev) => ({
      ...prev,
      testimonials: {
        ...prev.testimonials,
        reviews: prev.testimonials.reviews.map((r) =>
          r.id === id ? { ...r, [field]: value } : r
        )
      }
    }));
  };

  const selectedPreset = THEME_PRESETS.find((p) => p.id === config.theme) || THEME_PRESETS[0];

  const simReviews = config.testimonials?.reviews || [];
  const maxSimIndex = Math.max(0, simReviews.length - 3);
  const visibleSimReviews =
    simReviews.length <= 3
      ? simReviews
      : simReviews.slice(simTestimonialIndex, simTestimonialIndex + 3);

  const activeNavLinks = (config.navbar?.navLinks || DEFAULT_NAV_LINKS).filter(
    (l) => l.enabled !== false
  );

  return (
    <div className="shopify-builder-container">
      {/* Header Bar */}
      <header className="shopify-builder-header">
        <div className="builder-header-left">
          <div className="builder-store-badge">
            <Store size={22} strokeWidth={2.2} />
          </div>
          <div>
            <div className="builder-title-row">
              <h2>{config.branding.storeName || 'Online Store'}</h2>
            </div>
            <p className="builder-subtext">
              Storefront Theme Customizer • Real-Time Dynamic Controls
            </p>
          </div>
        </div>

        <div className="builder-header-actions">
          <button
            type="button"
            onClick={handleCopyUrl}
            className="shopify-btn-outline"
          >
            {copiedUrl ? <CheckCheck size={14} color="#059669" /> : <Copy size={14} />}
            <span>{copiedUrl ? 'Copied!' : 'Copy Link'}</span>
          </button>

          <a
            href={liveStoreUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shopify-btn-outline"
          >
            <ExternalLink size={14} />
            <span>Visit Live Store</span>
          </a>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="shopify-btn-primary"
          >
            <Save size={15} />
            <span>{saving ? 'Publishing...' : 'Save & Publish'}</span>
          </button>
        </div>
      </header>

      {/* Main Builder Workspace */}
      <div className="shopify-builder-layout">
        {/* LEFT PANEL: Sections & Theme Settings */}
        <aside className="shopify-sidebar-panel">
          {/* Mode Switcher */}
          <div className="sidebar-mode-switcher">
            <button
              type="button"
              className={`mode-tab-btn ${activeTab === 'sections' ? 'active' : ''}`}
              onClick={() => setActiveTab('sections')}
            >
              <Layout size={15} />
              <span>Page Sections</span>
            </button>
            <button
              type="button"
              className={`mode-tab-btn ${activeTab === 'theme' ? 'active' : ''}`}
              onClick={() => setActiveTab('theme')}
            >
              <Palette size={15} />
              <span>Theme & Colors</span>
            </button>
          </div>

          <div className="sidebar-content-scroll">
            {/* TAB 1: THEME & BRANDING */}
            {activeTab === 'theme' && (
              <>
                {/* Theme Color Palettes */}
                <div className="form-group">
                  <label>Curated Color Palettes</label>
                  <div className="theme-presets-grid">
                    {THEME_PRESETS.map((preset) => (
                      <div
                        key={preset.id}
                        className={`theme-card ${config.theme === preset.id ? 'active' : ''}`}
                        onClick={() => handleApplyPreset(preset)}
                      >
                        <div className="preset-colors-row">
                          <span style={{ background: preset.bg }} />
                          <span style={{ background: preset.primary }} />
                          <span style={{ background: preset.accent }} />
                          <span style={{ background: preset.card }} />
                        </div>
                        <div className="preset-info">
                          <strong>{preset.name}</strong>
                          <p>{preset.description}</p>
                        </div>
                        {config.theme === preset.id && (
                          <div className="preset-check">
                            <CheckCircle2 size={16} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Brand Colors Customizer */}
                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.85rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Palette size={16} color="#982A86" />
                    <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>
                      Custom Color Palette
                    </strong>
                  </div>

                  <div className="color-fields-row">
                    <div className="form-group">
                      <label>Primary Brand Color</label>
                      <div className="color-input-wrap">
                        <input
                          type="color"
                          value={config.branding.primaryColor}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              branding: { ...config.branding, primaryColor: e.target.value }
                            })
                          }
                        />
                        <input
                          type="text"
                          className="shopify-input-sm"
                          value={config.branding.primaryColor}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              branding: { ...config.branding, primaryColor: e.target.value }
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Accent & CTA Color</label>
                      <div className="color-input-wrap">
                        <input
                          type="color"
                          value={config.branding.accentColor}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              branding: { ...config.branding, accentColor: e.target.value }
                            })
                          }
                        />
                        <input
                          type="text"
                          className="shopify-input-sm"
                          value={config.branding.accentColor}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              branding: { ...config.branding, accentColor: e.target.value }
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* TAB 2: PAGE SECTIONS ACCORDION LIST */}
            {activeTab === 'sections' && (
              <>
                {/* 1. Header & Navigation (Dynamic Logo, Title & Nav Links) */}
                <div className={`builder-accordion-card ${openAccordions.navbar ? 'expanded' : ''}`}>
                  <div className="accordion-header" onClick={() => toggleAccordion('navbar')}>
                    <div className="accordion-header-left">
                      <div className="accordion-icon-wrap">
                        <Store size={16} />
                      </div>
                      <div className="accordion-titles">
                        <h4>Header & Navigation</h4>
                        <span>Logo, title & dynamic nav menu</span>
                      </div>
                    </div>
                    <div className="accordion-header-right">
                      {openAccordions.navbar ? <ChevronUp size={16} color="#94a3b8" /> : <ChevronDown size={16} color="#94a3b8" />}
                    </div>
                  </div>

                  {openAccordions.navbar && (
                    <div className="accordion-body">
                      {/* Brand Title & Slogan */}
                      <div className="form-group">
                        <label>Store Brand Title</label>
                        <input
                          type="text"
                          className="shopify-input"
                          value={config.branding.storeName}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              branding: { ...config.branding, storeName: e.target.value }
                            })
                          }
                          placeholder="e.g. ZARA Flagship Store"
                        />
                      </div>

                      <div className="form-group">
                        <label>Tagline / Subtitle</label>
                        <input
                          type="text"
                          className="shopify-input"
                          value={config.branding.tagline}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              branding: { ...config.branding, tagline: e.target.value }
                            })
                          }
                          placeholder="e.g. Quality Products Delivered to Your Doorstep"
                        />
                      </div>

                      <div className="form-group">
                        <label>Custom Brand Logo URL (Optional)</label>
                        <input
                          type="text"
                          className="shopify-input"
                          value={config.branding.logoUrl || ''}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              branding: { ...config.branding, logoUrl: e.target.value }
                            })
                          }
                          placeholder="https://yourdomain.com/logo.png"
                        />
                      </div>

                      {/* Dynamic Navigation Links Manager */}
                      <div style={{ marginTop: '0.5rem' }}>
                        <div className="reviews-list-header">
                          <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a' }}>
                            Navigation Menu Links ({config.navbar?.navLinks?.length || 0})
                          </label>
                          <button
                            type="button"
                            onClick={handleAddNavLink}
                            className="shopify-btn-sm"
                          >
                            <Plus size={13} /> Add Link
                          </button>
                        </div>

                        <div className="nav-links-manager-list">
                          {(config.navbar?.navLinks || DEFAULT_NAV_LINKS).map((item) => (
                            <div key={item.id} className="nav-link-editor-item">
                              <input
                                type="text"
                                className="shopify-input-sm"
                                style={{ width: '110px', fontWeight: 600 }}
                                value={item.label}
                                onChange={(e) =>
                                  handleUpdateNavLink(item.id, 'label', e.target.value)
                                }
                                placeholder="Label"
                              />

                              <input
                                type="text"
                                className="shopify-input-sm"
                                value={item.url}
                                onChange={(e) =>
                                  handleUpdateNavLink(item.id, 'url', e.target.value)
                                }
                                placeholder="#section or url"
                              />

                              <label className="shopify-switch" title="Toggle visibility">
                                <input
                                  type="checkbox"
                                  checked={item.enabled !== false}
                                  onChange={(e) =>
                                    handleUpdateNavLink(item.id, 'enabled', e.target.checked)
                                  }
                                />
                                <span className="switch-slider" />
                              </label>

                              <button
                                type="button"
                                onClick={() => handleRemoveNavLink(item.id)}
                                className="btn-trash-sm"
                                title="Remove Link"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                        <div className="toggle-item">
                          <span>Show WhatsApp Quick Chat Button</span>
                          <label className="shopify-switch">
                            <input
                              type="checkbox"
                              checked={config.navbar?.showWhatsApp !== false}
                              onChange={(e) =>
                                setConfig({
                                  ...config,
                                  navbar: { ...config.navbar, showWhatsApp: e.target.checked }
                                })
                              }
                            />
                            <span className="switch-slider" />
                          </label>
                        </div>

                        <div className="toggle-item">
                          <span>Show Store Address & Contact Meta</span>
                          <label className="shopify-switch">
                            <input
                              type="checkbox"
                              checked={config.navbar?.showAddress !== false}
                              onChange={(e) =>
                                setConfig({
                                  ...config,
                                  navbar: { ...config.navbar, showAddress: e.target.checked }
                                })
                              }
                            />
                            <span className="switch-slider" />
                          </label>
                        </div>

                        <div className="toggle-item">
                          <span>Show Shopping Bag / Cart</span>
                          <label className="shopify-switch">
                            <input
                              type="checkbox"
                              checked={config.navbar?.showCart !== false}
                              onChange={(e) =>
                                setConfig({
                                  ...config,
                                  navbar: { ...config.navbar, showCart: e.target.checked }
                                })
                              }
                            />
                            <span className="switch-slider" />
                          </label>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Announcement Bar */}
                <div className={`builder-accordion-card ${openAccordions.announcement ? 'expanded' : ''}`}>
                  <div className="accordion-header" onClick={() => toggleAccordion('announcement')}>
                    <div className="accordion-header-left">
                      <div className="accordion-icon-wrap">
                        <Megaphone size={16} />
                      </div>
                      <div className="accordion-titles">
                        <h4>Announcement Bar</h4>
                        <span>Top banner notice</span>
                      </div>
                    </div>
                    <div className="accordion-header-right">
                      <label className="shopify-switch" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={config.announcement?.enabled}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              announcement: { ...config.announcement, enabled: e.target.checked }
                            })
                          }
                        />
                        <span className="switch-slider" />
                      </label>
                      {openAccordions.announcement ? <ChevronUp size={16} color="#94a3b8" /> : <ChevronDown size={16} color="#94a3b8" />}
                    </div>
                  </div>

                  {openAccordions.announcement && (
                    <div className="accordion-body">
                      <div className="form-group">
                        <label>Announcement Text</label>
                        <input
                          type="text"
                          className="shopify-input"
                          value={config.announcement?.text || ''}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              announcement: { ...config.announcement, text: e.target.value }
                            })
                          }
                          placeholder="e.g. Free express delivery on orders above ₹499"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Hero Showcase Banner */}
                <div className={`builder-accordion-card ${openAccordions.hero ? 'expanded' : ''}`}>
                  <div className="accordion-header" onClick={() => toggleAccordion('hero')}>
                    <div className="accordion-header-left">
                      <div className="accordion-icon-wrap">
                        <ImageIcon size={16} />
                      </div>
                      <div className="accordion-titles">
                        <h4>Hero Showcase Banner</h4>
                        <span>Primary storefront showcase</span>
                      </div>
                    </div>
                    <div className="accordion-header-right">
                      <label className="shopify-switch" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={config.hero.enabled}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              hero: { ...config.hero, enabled: e.target.checked }
                            })
                          }
                        />
                        <span className="switch-slider" />
                      </label>
                      {openAccordions.hero ? <ChevronUp size={16} color="#94a3b8" /> : <ChevronDown size={16} color="#94a3b8" />}
                    </div>
                  </div>

                  {openAccordions.hero && (
                    <div className="accordion-body">
                      <div className="form-group">
                        <label>Slogan Badge</label>
                        <input
                          type="text"
                          className="shopify-input"
                          value={config.hero.badge}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              hero: { ...config.hero, badge: e.target.value }
                            })
                          }
                          placeholder="e.g. Official Online Store"
                        />
                      </div>

                      <div className="form-group">
                        <label>Main Headline</label>
                        <input
                          type="text"
                          className="shopify-input"
                          value={config.hero.title}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              hero: { ...config.hero, title: e.target.value }
                            })
                          }
                          placeholder="e.g. Welcome to Our Store"
                        />
                      </div>

                      <div className="form-group">
                        <label>Subtitle / Description</label>
                        <textarea
                          rows={2}
                          className="shopify-input"
                          value={config.hero.subtitle}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              hero: { ...config.hero, subtitle: e.target.value }
                            })
                          }
                          placeholder="e.g. Shop the freshest arrivals and exclusive store offers..."
                        />
                      </div>

                      <div className="form-group">
                        <label>Primary CTA Text</label>
                        <input
                          type="text"
                          className="shopify-input"
                          value={config.hero.ctaText}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              hero: { ...config.hero, ctaText: e.target.value }
                            })
                          }
                          placeholder="e.g. Explore Catalog"
                        />
                      </div>

                      <div className="form-group">
                        <label>Secondary CTA Text</label>
                        <input
                          type="text"
                          className="shopify-input"
                          value={config.hero.secondaryCtaText}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              hero: { ...config.hero, secondaryCtaText: e.target.value }
                            })
                          }
                          placeholder="e.g. Contact Store"
                        />
                      </div>

                      {/* Image Presets */}
                      <div className="form-group">
                        <label>Background Presets</label>
                        <div className="image-presets-row">
                          {BANNER_IMAGE_PRESETS.map((p, idx) => (
                            <div
                              key={idx}
                              className={`image-preset-thumb ${config.hero.imageUrl === p.url ? 'active' : ''}`}
                              onClick={() =>
                                setConfig({
                                  ...config,
                                  hero: { ...config.hero, imageUrl: p.url }
                                })
                              }
                              title={p.title}
                            >
                              <img src={p.url} alt={p.title} />
                              <span>{p.category}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Custom Hero Image URL</label>
                        <input
                          type="text"
                          className="shopify-input-sm"
                          value={config.hero.imageUrl}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              hero: { ...config.hero, imageUrl: e.target.value }
                            })
                          }
                          placeholder="https://images.unsplash.com/..."
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Products & Catalog */}
                <div className={`builder-accordion-card ${openAccordions.products ? 'expanded' : ''}`}>
                  <div className="accordion-header" onClick={() => toggleAccordion('products')}>
                    <div className="accordion-header-left">
                      <div className="accordion-icon-wrap">
                        <ShoppingBag size={16} />
                      </div>
                      <div className="accordion-titles">
                        <h4>Products & Catalog</h4>
                        <span>Grid, search & category filters</span>
                      </div>
                    </div>
                    <div className="accordion-header-right">
                      <label className="shopify-switch" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={config.productsSection?.enabled !== false}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              productsSection: {
                                ...config.productsSection,
                                enabled: e.target.checked
                              }
                            })
                          }
                        />
                        <span className="switch-slider" />
                      </label>
                      {openAccordions.products ? <ChevronUp size={16} color="#94a3b8" /> : <ChevronDown size={16} color="#94a3b8" />}
                    </div>
                  </div>

                  {openAccordions.products && (
                    <div className="accordion-body">
                      <div className="form-group">
                        <label>Catalog Section Title</label>
                        <input
                          type="text"
                          className="shopify-input"
                          value={config.productsSection?.title || 'Featured Catalog'}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              productsSection: {
                                ...config.productsSection,
                                title: e.target.value
                              }
                            })
                          }
                        />
                      </div>

                      <div className="toggle-item">
                        <span>Enable Live Search Bar</span>
                        <label className="shopify-switch">
                          <input
                            type="checkbox"
                            checked={config.productsSection?.showSearch !== false}
                            onChange={(e) =>
                              setConfig({
                                ...config,
                                productsSection: {
                                  ...config.productsSection,
                                  showSearch: e.target.checked
                                }
                              })
                            }
                          />
                          <span className="switch-slider" />
                        </label>
                      </div>

                      <div className="toggle-item">
                        <span>Enable Category Filters</span>
                        <label className="shopify-switch">
                          <input
                            type="checkbox"
                            checked={config.sections.categoriesEnabled}
                            onChange={(e) =>
                              setConfig({
                                ...config,
                                sections: {
                                  ...config.sections,
                                  categoriesEnabled: e.target.checked
                                }
                              })
                            }
                          />
                          <span className="switch-slider" />
                        </label>
                      </div>

                      <div className="toggle-item">
                        <span>Show Stock Availability Badges</span>
                        <label className="shopify-switch">
                          <input
                            type="checkbox"
                            checked={config.productsSection?.showStockBadge !== false}
                            onChange={(e) =>
                              setConfig({
                                ...config,
                                productsSection: {
                                  ...config.productsSection,
                                  showStockBadge: e.target.checked
                                }
                              })
                            }
                          />
                          <span className="switch-slider" />
                        </label>
                      </div>

                      <div className="toggle-item">
                        <span>Only Show In-Stock Items</span>
                        <label className="shopify-switch">
                          <input
                            type="checkbox"
                            checked={config.productsSection?.showOnlyInStock !== false}
                            onChange={(e) =>
                              setConfig({
                                ...config,
                                productsSection: {
                                  ...config.productsSection,
                                  showOnlyInStock: e.target.checked
                                }
                              })
                            }
                          />
                          <span className="switch-slider" />
                        </label>
                      </div>

                      {/* Real Tenant Products Selection & Management */}
                      <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                          <div>
                            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b' }}>
                              Purchased Catalog ({tenantProducts.length} Items)
                            </span>
                            <p style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '1px' }}>
                              Only items purchased into inventory are shown
                            </p>
                          </div>
                          <div>
                            <Link
                              to="/purchases"
                              target="_blank"
                              style={{
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                color: '#982A86',
                                textDecoration: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}
                              title="Go to Purchases"
                            >
                              + New PO <ExternalLink size={10} />
                            </Link>
                          </div>
                        </div>

                        {/* Search in builder */}
                        <div style={{ marginBottom: '0.65rem' }}>
                          <input
                            type="text"
                            placeholder="Search purchased items..."
                            value={builderProductSearch}
                            onChange={(e) => setBuilderProductSearch(e.target.value)}
                            className="shopify-input"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                          />
                        </div>

                        {/* Product Checkbox List */}
                        <div style={{ maxHeight: '220px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.4rem' }}>
                          {tenantProducts.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '1.25rem 0.5rem', color: '#64748b' }}>
                              <ShoppingBag size={26} color="#94a3b8" style={{ marginBottom: '0.35rem' }} />
                              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155' }}>
                                No Purchased Products in Inventory
                              </div>
                              <p style={{ fontSize: '0.7rem', color: '#94a3b8', margin: '0.25rem 0 0.65rem' }}>
                                Products must be purchased via a Purchase Order before they can appear in your online store.
                              </p>
                              <Link
                                to="/purchases"
                                target="_blank"
                                className="shopify-btn-primary"
                                style={{ fontSize: '0.72rem', padding: '0.35rem 0.85rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              >
                                Go to Purchases <ExternalLink size={11} />
                              </Link>
                            </div>
                          ) : (
                            tenantProducts
                              .filter((p) => (p.name || '').toLowerCase().includes(builderProductSearch.toLowerCase()) || (p.product_code || '').toLowerCase().includes(builderProductSearch.toLowerCase()))
                              .map((p) => {
                                const isIncluded = !config.productsSection?.selectedProductIds || config.productsSection.selectedProductIds.length === 0 || config.productsSection.selectedProductIds.includes(p.id);
                                return (
                                  <label
                                    key={p.id}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.55rem',
                                      padding: '0.35rem 0.45rem',
                                      borderRadius: '6px',
                                      background: isIncluded ? '#fdf4fc' : '#ffffff',
                                      cursor: 'pointer',
                                      marginBottom: '2px',
                                      fontSize: '0.78rem'
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isIncluded}
                                      onChange={(e) => {
                                        const currentIds = config.productsSection?.selectedProductIds?.length > 0
                                          ? [...config.productsSection.selectedProductIds]
                                          : tenantProducts.map((tp) => tp.id);

                                        let newIds;
                                        if (e.target.checked) {
                                          newIds = [...new Set([...currentIds, p.id])];
                                        } else {
                                          newIds = currentIds.filter((id) => id !== p.id);
                                        }

                                        setConfig({
                                          ...config,
                                          productsSection: {
                                            ...config.productsSection,
                                            selectedProductIds: newIds
                                          }
                                        });
                                      }}
                                    />
                                    <div style={{ flex: 1, minWidth: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <span style={{ fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {p.name}
                                      </span>
                                      <span style={{ fontSize: '0.7rem', color: p.currentStock > 0 ? '#059669' : '#dc2626', fontWeight: 700, marginLeft: '6px' }}>
                                        {p.currentStock > 0 ? `${p.currentStock} in stock` : 'Out of stock'}
                                      </span>
                                    </div>
                                  </label>
                                );
                              })
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 5. Customer Reviews Carousel */}
                <div className={`builder-accordion-card ${openAccordions.testimonials ? 'expanded' : ''}`}>
                  <div className="accordion-header" onClick={() => toggleAccordion('testimonials')}>
                    <div className="accordion-header-left">
                      <div className="accordion-icon-wrap">
                        <Star size={16} />
                      </div>
                      <div className="accordion-titles">
                        <h4>Customer Reviews</h4>
                        <span>Testimonials carousel</span>
                      </div>
                    </div>
                    <div className="accordion-header-right">
                      <label className="shopify-switch" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={config.testimonials?.enabled !== false}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              testimonials: {
                                ...config.testimonials,
                                enabled: e.target.checked
                              }
                            })
                          }
                        />
                        <span className="switch-slider" />
                      </label>
                      {openAccordions.testimonials ? <ChevronUp size={16} color="#94a3b8" /> : <ChevronDown size={16} color="#94a3b8" />}
                    </div>
                  </div>

                  {openAccordions.testimonials && (
                    <div className="accordion-body">
                      <div className="form-group">
                        <label>Section Heading</label>
                        <input
                          type="text"
                          className="shopify-input"
                          value={config.testimonials?.title || 'What Our Customers Say'}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              testimonials: {
                                ...config.testimonials,
                                title: e.target.value
                              }
                            })
                          }
                        />
                      </div>

                      <div className="reviews-list-header">
                        <h4>Customer Reviews ({config.testimonials?.reviews?.length || 0})</h4>
                        <button
                          type="button"
                          onClick={handleAddReview}
                          className="shopify-btn-sm"
                        >
                          <Plus size={13} /> Add Review
                        </button>
                      </div>

                      {(config.testimonials?.reviews || []).map((rev, idx) => (
                        <div key={rev.id || idx} className="review-editor-card">
                          <div className="review-editor-top">
                            <input
                              type="text"
                              className="shopify-input-sm"
                              value={rev.name}
                              onChange={(e) =>
                                handleUpdateReview(rev.id, 'name', e.target.value)
                              }
                              placeholder="Name"
                            />
                            <input
                              type="text"
                              className="shopify-input-sm"
                              value={rev.location}
                              onChange={(e) =>
                                handleUpdateReview(rev.id, 'location', e.target.value)
                              }
                              placeholder="City"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveReview(rev.id)}
                              className="btn-trash-sm"
                              title="Delete Review"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                          <textarea
                            rows={2}
                            className="shopify-input-sm"
                            value={rev.comment}
                            onChange={(e) =>
                              handleUpdateReview(rev.id, 'comment', e.target.value)
                            }
                            placeholder="Feedback text..."
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 6. Contact & Footer */}
                <div className={`builder-accordion-card ${openAccordions.contact ? 'expanded' : ''}`}>
                  <div className="accordion-header" onClick={() => toggleAccordion('contact')}>
                    <div className="accordion-header-left">
                      <div className="accordion-icon-wrap">
                        <MapPin size={16} />
                      </div>
                      <div className="accordion-titles">
                        <h4>Contact & Store Info</h4>
                        <span>Location, phone & hours</span>
                      </div>
                    </div>
                    <div className="accordion-header-right">
                      <label className="shopify-switch" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={config.contact?.enabled !== false}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              contact: { ...config.contact, enabled: e.target.checked }
                            })
                          }
                        />
                        <span className="switch-slider" />
                      </label>
                      {openAccordions.contact ? <ChevronUp size={16} color="#94a3b8" /> : <ChevronDown size={16} color="#94a3b8" />}
                    </div>
                  </div>

                  {openAccordions.contact && (
                    <div className="accordion-body">
                      <div className="form-group">
                        <label>Physical Address</label>
                        <input
                          type="text"
                          className="shopify-input"
                          value={config.contact?.address || ''}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              contact: { ...config.contact, address: e.target.value }
                            })
                          }
                          placeholder="e.g. 124 Grand Trunk Road, Chennai"
                        />
                      </div>

                      <div className="form-group">
                        <label>Support Phone</label>
                        <input
                          type="tel"
                          className="shopify-input"
                          value={config.contact?.phone || ''}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              contact: { ...config.contact, phone: e.target.value }
                            })
                          }
                          placeholder="e.g. +91 9876543210"
                        />
                      </div>

                      <div className="form-group">
                        <label>WhatsApp Number</label>
                        <input
                          type="tel"
                          className="shopify-input"
                          value={config.whatsapp?.phoneNumber || ''}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              whatsapp: {
                                ...config.whatsapp,
                                phoneNumber: e.target.value
                              },
                              contact: {
                                ...config.contact,
                                whatsappNumber: e.target.value
                              }
                            })
                          }
                          placeholder="e.g. 8056685161"
                        />
                      </div>

                      <div className="form-group">
                        <label>Operating Hours</label>
                        <input
                          type="text"
                          className="shopify-input"
                          value={config.contact?.hours || 'Mon - Sat: 9:00 AM - 9:00 PM'}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              contact: { ...config.contact, hours: e.target.value }
                            })
                          }
                          placeholder="e.g. Mon - Sat: 9:00 AM - 9:00 PM"
                        />
                      </div>

                      <div className="toggle-item">
                        <span>Show Guarantee Trust Badges</span>
                        <label className="shopify-switch">
                          <input
                            type="checkbox"
                            checked={config.sections.trustBadgesEnabled}
                            onChange={(e) =>
                              setConfig({
                                ...config,
                                sections: {
                                  ...config.sections,
                                  trustBadgesEnabled: e.target.checked
                                }
                              })
                            }
                          />
                          <span className="switch-slider" />
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </aside>

        {/* RIGHT PANEL: Real-Time Live Preview Canvas */}
        <main className="shopify-preview-panel">
          {/* Top Browser Toolbar */}
          <div className="preview-top-toolbar">
            <div className="preview-browser-bar">
              <div className="browser-dots">
                <span className="dot-red" />
                <span className="dot-yellow" />
                <span className="dot-green" />
              </div>
              <div className="browser-url-pill">
                <Lock size={12} color="#10b981" />
                <span>stockpilot.io/store/</span>
                <strong>{companyCode}</strong>
              </div>
            </div>

            <div className="device-switcher">
              <button
                type="button"
                className={`dev-btn ${previewDevice === 'desktop' ? 'active' : ''}`}
                onClick={() => setPreviewDevice('desktop')}
              >
                <Monitor size={14} />
                <span>Desktop</span>
              </button>
              <button
                type="button"
                className={`dev-btn ${previewDevice === 'mobile' ? 'active' : ''}`}
                onClick={() => setPreviewDevice('mobile')}
              >
                <Smartphone size={14} />
                <span>Mobile</span>
              </button>
            </div>
          </div>

          {/* Viewport Container */}
          <div className="preview-viewport-container">
            <div
              className={previewDevice === 'desktop' ? 'sim-frame-desktop' : 'sim-frame-mobile'}
              style={{
                backgroundColor: config.branding.bgColor || selectedPreset.bg,
                color: config.branding.textColor || selectedPreset.text
              }}
            >
              {/* 0. Optional Announcement Bar */}
              {config.announcement?.enabled && config.announcement?.text && (
                <div
                  style={{
                    background: config.branding.primaryColor,
                    color: '#ffffff',
                    padding: '0.4rem 0.8rem',
                    textAlign: 'center',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    letterSpacing: '0.02em'
                  }}
                >
                  {config.announcement.text}
                </div>
              )}

              {/* 1. Header / Navbar with Dynamic Logo, Title & Navigation Links */}
              {previewDevice === 'mobile' ? (
                <div
                  className="sim-mobile-header-wrap"
                  style={{
                    background: config.branding.cardColor || selectedPreset.card,
                    borderColor: selectedPreset.border || '#e2e8f0',
                    color: config.branding.textColor || selectedPreset.text
                  }}
                >
                  {/* Mobile Top Row */}
                  <div className="sim-mobile-top-bar">
                    <div className="sim-brand-block">
                      <div
                        className="sim-brand-logo"
                        style={{
                          background: config.branding.logoUrl ? 'transparent' : config.branding.primaryColor,
                          width: '28px',
                          height: '28px',
                          borderRadius: '6px'
                        }}
                      >
                        {config.branding.logoUrl ? (
                          <img
                            src={config.branding.logoUrl}
                            alt="Logo"
                            style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '6px' }}
                          />
                        ) : (
                          <Store size={14} />
                        )}
                      </div>
                      <div>
                        <h3
                          className="sim-brand-name"
                          style={{
                            fontSize: '0.85rem',
                            color: config.branding.textColor || selectedPreset.text
                          }}
                        >
                          {config.branding.storeName}
                        </h3>
                      </div>
                    </div>

                    <div className="sim-nav-actions">
                      {config.navbar?.showWhatsApp !== false && (
                        <button className="sim-btn-whatsapp-icon" title="Chat on WhatsApp">
                          <WhatsAppBrandIcon size={14} color="#25D366" />
                        </button>
                      )}
                      {config.navbar?.showCart !== false && (
                        <button
                          className="sim-btn-cart-icon"
                          style={{ background: config.branding.primaryColor }}
                          title="Shopping Bag"
                        >
                          <ShoppingBag size={13} />
                          <span className="sim-cart-count-badge">2</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Mobile Nav Links Row - Scrollable Horizontal Pills */}
                  {activeNavLinks.length > 0 && (
                    <div className="sim-mobile-nav-scroll">
                      {activeNavLinks.map((l) => (
                        <a
                          key={l.id}
                          href={l.url || '#'}
                          className="sim-mobile-nav-pill"
                          onClick={(e) => {
                            if (l.url?.startsWith('#')) {
                              e.preventDefault();
                              const el = document.querySelector(l.url);
                              if (el) el.scrollIntoView({ behavior: 'smooth' });
                            }
                          }}
                        >
                          {l.label}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <nav
                  className="sim-navbar"
                  style={{
                    background: config.branding.cardColor || selectedPreset.card,
                    borderColor: selectedPreset.border || '#e2e8f0',
                    color: config.branding.textColor || selectedPreset.text
                  }}
                >
                  <div className="sim-brand-block">
                    <div
                      className="sim-brand-logo"
                      style={{ background: config.branding.logoUrl ? 'transparent' : config.branding.primaryColor }}
                    >
                      {config.branding.logoUrl ? (
                        <img
                          src={config.branding.logoUrl}
                          alt="Logo"
                          style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '8px' }}
                        />
                      ) : (
                        <Store size={18} />
                      )}
                    </div>
                    <div>
                      <h3
                        className="sim-brand-name"
                        style={{ color: config.branding.textColor || selectedPreset.text }}
                      >
                        {config.branding.storeName}
                      </h3>
                      <span className="sim-brand-tagline">{config.branding.tagline}</span>
                    </div>
                  </div>

                  {/* Dynamic Simulator Nav Links in Single Horizontal Row */}
                  {activeNavLinks.length > 0 && (
                    <div className="sim-nav-menu">
                      {activeNavLinks.map((l) => (
                        <a
                          key={l.id}
                          href={l.url || '#'}
                          className="sim-nav-link"
                          onClick={(e) => {
                            if (l.url?.startsWith('#')) {
                              e.preventDefault();
                              const el = document.querySelector(l.url);
                              if (el) el.scrollIntoView({ behavior: 'smooth' });
                            }
                          }}
                        >
                          {l.label}
                        </a>
                      ))}
                    </div>
                  )}

                  <div className="sim-nav-actions">
                    {config.navbar?.showWhatsApp !== false && (
                      <button className="sim-btn-whatsapp">
                        <WhatsAppBrandIcon size={14} color="#25D366" />
                        <span>WhatsApp</span>
                      </button>
                    )}
                    {config.navbar?.showCart !== false && (
                      <button
                        className="sim-btn-cart"
                        style={{ background: config.branding.primaryColor }}
                      >
                        <ShoppingBag size={14} /> Bag (2)
                      </button>
                    )}
                  </div>
                </nav>
              )}

              {/* 2. Full-Screen Hero Showcase Banner */}
              {config.hero.enabled && (
                <section
                  id="home"
                  className="sim-hero-section-fullscreen"
                  style={{
                    backgroundImage: config.hero.imageUrl
                      ? `linear-gradient(rgba(15, 23, 42, 0.72), rgba(15, 23, 42, 0.88)), url('${config.hero.imageUrl}')`
                      : `linear-gradient(135deg, ${config.branding.primaryColor}22 0%, #0f172a 100%)`
                  }}
                >
                  <div className="sim-hero-content">
                    {config.hero.badge && (
                      <div className="sim-hero-badge-pill" style={{ color: '#34d399' }}>
                        <span className="badge-bullet" />
                        {config.hero.badge}
                      </div>
                    )}
                    <h1 className="sim-hero-giant-title">{config.hero.title}</h1>
                    <p className="sim-hero-desc">{config.hero.subtitle}</p>
                    <div className="sim-hero-actions-row">
                      <button
                        className="sim-btn-hero-cta"
                        style={{ background: config.branding.primaryColor }}
                      >
                        {config.hero.ctaText}
                        <ArrowRight size={14} />
                      </button>
                      {config.hero.secondaryCtaText && (
                        <button className="sim-btn-hero-whatsapp">
                          <WhatsAppBrandIcon size={14} color="#25D366" />
                          <span>{config.hero.secondaryCtaText}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </section>
              )}

              {/* 3. Trust Badges Strip (About Section) */}
              {config.sections.trustBadgesEnabled && (
                <div
                  id="about"
                  className="sim-trust-strip"
                  style={{
                    background: config.branding.cardColor || selectedPreset.card,
                    borderColor: selectedPreset.border || '#e2e8f0'
                  }}
                >
                  {config.trustBadges.map((badge, idx) => (
                    <div key={idx} className="sim-trust-item">
                      <ShieldCheck size={16} color={config.branding.accentColor} />
                      <div>
                        <strong>{badge.title}</strong>
                        <span>{badge.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 4. Products Catalog Section */}
              {config.productsSection?.enabled !== false && (
                <section id="products" className="sim-catalog-section">
                  <div className="sim-catalog-header">
                    <div>
                      <h2 style={{ color: config.branding.textColor || selectedPreset.text }}>
                        {config.productsSection?.title || 'Featured Catalog'}
                      </h2>
                      <p>Browse verified real-time items</p>
                    </div>

                    {config.productsSection?.showSearch !== false && (
                      <div className="sim-search-bar">
                        <Search size={13} />
                        <input type="text" placeholder="Search catalog..." readOnly />
                      </div>
                    )}
                  </div>

                  {/* Category Chips - Dynamic from Real Purchased Products */}
                  {config.sections.categoriesEnabled && purchasedCategories.length > 0 && (
                    <div className="sim-category-chips">
                      <span
                        className={`sim-chip ${selectedSimCategory === 'ALL' ? 'active' : ''}`}
                        style={selectedSimCategory === 'ALL' ? { background: config.branding.primaryColor } : {}}
                        onClick={() => setSelectedSimCategory('ALL')}
                      >
                        All Items ({tenantProducts.length})
                      </span>
                      {purchasedCategories.map((catName) => (
                        <span
                          key={catName}
                          className={`sim-chip ${selectedSimCategory === catName ? 'active' : ''}`}
                          style={selectedSimCategory === catName ? { background: config.branding.primaryColor } : {}}
                          onClick={() => setSelectedSimCategory(catName)}
                        >
                          {catName}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="sim-product-cards-grid">
                    {tenantProducts.length === 0 ? (
                      <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2.5rem 1rem', color: '#64748b' }}>
                        <ShoppingBag size={34} color="#94a3b8" style={{ marginBottom: '0.65rem' }} />
                        <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: config.branding.textColor || selectedPreset.text }}>
                          No Purchased Products in Inventory Yet
                        </h4>
                        <p style={{ fontSize: '0.78rem', marginTop: '0.25rem', color: '#94a3b8', maxWidth: '380px', margin: '0.25rem auto 1rem' }}>
                          Only products purchased into inventory will be displayed on your live customer storefront.
                        </p>
                        <Link
                          to="/purchases"
                          target="_blank"
                          className="shopify-btn-primary"
                          style={{ fontSize: '0.78rem', padding: '0.4rem 1rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          Go to Purchases <ExternalLink size={12} />
                        </Link>
                      </div>
                    ) : (
                      tenantProducts
                        .filter((p) => {
                          const isSelected = !config.productsSection?.selectedProductIds || config.productsSection.selectedProductIds.length === 0 || config.productsSection.selectedProductIds.includes(p.id);
                          const inStockCheck = config.productsSection?.showOnlyInStock !== false ? p.currentStock > 0 : true;
                          const catName = p.category?.name || p.category_name || (typeof p.category === 'string' ? p.category : null);
                          const catCheck = selectedSimCategory === 'ALL' || catName === selectedSimCategory;
                          return isSelected && inStockCheck && catCheck;
                        })
                        .map((p, i) => (
                          <div
                            key={p.id || i}
                            className="sim-product-card"
                            style={{
                              background: config.branding.cardColor || selectedPreset.card,
                              borderColor: selectedPreset.border || '#e2e8f0'
                            }}
                          >
                            <div className="sim-card-img" style={{ height: '140px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {p.image_url ? (
                                <img src={p.image_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: '#94a3b8' }}>
                                  <Package size={28} />
                                  <span style={{ fontSize: '0.68rem', fontWeight: 600 }}>{p.category?.name || 'Item'}</span>
                                </div>
                              )}
                              {p.category?.name && (
                                <span className="sim-cat-pill">{p.category.name}</span>
                              )}
                            </div>
                            <div className="sim-card-body">
                              <h4 style={{ color: config.branding.textColor || selectedPreset.text }}>
                                {p.name}
                              </h4>
                              <div className="sim-card-price-row">
                                <span
                                  className="sim-price"
                                  style={{ color: config.branding.textColor || selectedPreset.text }}
                                >
                                  ₹{parseFloat(p.selling_price || p.purchase_price || 0).toLocaleString('en-IN')}
                                </span>
                                <button
                                  className="sim-btn-add"
                                  style={{ background: config.branding.primaryColor }}
                                >
                                  + Add
                                </button>
                              </div>
                              {config.productsSection?.showStockBadge !== false && (
                                <div style={{ fontSize: '0.68rem', marginTop: '4px', fontWeight: 600, color: p.currentStock > 0 ? '#059669' : '#dc2626' }}>
                                  {p.currentStock > 0 ? `In Stock (${p.currentStock})` : 'Out of Stock'}
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </section>
              )}

              {/* 5. Testimonials 3-Card Carousel */}
              {config.testimonials?.enabled !== false && (
                <section
                  id="testimonials"
                  className="sim-testimonials-section"
                  style={{
                    background: '#f8fafc',
                    borderColor: selectedPreset.border || '#e2e8f0'
                  }}
                >
                  <div className="sim-section-header-carousel">
                    <div>
                      <h2 style={{ color: '#0f172a' }}>
                        {config.testimonials?.title || 'What Our Customers Say'}
                      </h2>
                      <p>{config.testimonials?.subtitle || 'Verified reviews from buyers'}</p>
                    </div>

                    {simReviews.length > 3 && (
                      <div className="sim-carousel-arrows">
                        <button
                          onClick={() =>
                            setSimTestimonialIndex((prev) =>
                              prev > 0 ? prev - 1 : maxSimIndex
                            )
                          }
                          className="sim-btn-arrow"
                        >
                          <ChevronLeft size={14} />
                        </button>
                        <button
                          onClick={() =>
                            setSimTestimonialIndex((prev) =>
                              prev < maxSimIndex ? prev + 1 : 0
                            )
                          }
                          className="sim-btn-arrow"
                        >
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="sim-reviews-grid-3">
                    {visibleSimReviews.map((rev, idx) => (
                      <div
                        key={idx}
                        className="sim-review-card"
                        style={{
                          background: '#ffffff',
                          borderColor: '#e2e8f0'
                        }}
                      >
                        <div className="sim-review-stars">
                          {[...Array(5)].map((_, s) => (
                            <Star key={s} size={11} fill="#f59e0b" color="#f59e0b" />
                          ))}
                        </div>
                        <p className="sim-review-comment" style={{ color: '#334155' }}>
                          "{rev.comment}"
                        </p>
                        <div className="sim-reviewer-info">
                          <div
                            className="sim-reviewer-avatar"
                            style={{ background: config.branding.primaryColor }}
                          >
                            {rev.name ? rev.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <strong style={{ color: '#0f172a' }}>{rev.name}</strong>
                            <span>{rev.location || 'Verified Buyer'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* 6. Contact & Footer */}
              {config.contact?.enabled !== false && (
                <footer
                  id="contact"
                  className="sim-store-footer"
                  style={{
                    background: '#ffffff',
                    borderColor: selectedPreset.border || '#e2e8f0',
                    color: '#0f172a'
                  }}
                >
                  <div className="sim-footer-grid">
                    <div>
                      <div className="sim-brand-block" style={{ marginBottom: '0.6rem' }}>
                        <div
                          className="sim-brand-logo"
                          style={{
                            width: '28px',
                            height: '28px',
                            background: config.branding.primaryColor
                          }}
                        >
                          <Store size={15} />
                        </div>
                        <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#0f172a' }}>
                          {config.branding.storeName}
                        </h4>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>
                        {config.branding.tagline}
                      </p>
                    </div>

                    <div className="sim-footer-contact-items">
                      {config.contact?.address && (
                        <div className="sim-contact-item">
                          <MapPin size={13} color={config.branding.accentColor} />
                          <span>{config.contact.address}</span>
                        </div>
                      )}
                      {config.contact?.phone && (
                        <div className="sim-contact-item">
                          <Phone size={13} color={config.branding.accentColor} />
                          <span>{config.contact.phone}</span>
                        </div>
                      )}
                      {config.contact?.hours && (
                        <div className="sim-contact-item">
                          <Clock size={13} color={config.branding.accentColor} />
                          <span>{config.contact.hours}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="sim-footer-bottom">
                    <span>
                      © {new Date().getFullYear()} {config.branding.storeName}. All rights reserved.
                    </span>
                    <span>Powered by StockPilot IMS</span>
                  </div>
                </footer>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
