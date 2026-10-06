import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../../services/api';
import { toast } from 'react-toastify';
import {
  Store,
  Palette,
  Layout,
  Sparkles,
  Phone,
  CheckCircle2,
  ExternalLink,
  Copy,
  Save,
  Monitor,
  Tablet,
  Smartphone,
  Eye,
  EyeOff,
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
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  GripVertical,
  Package,
  Settings,
  Flame,
  Tag,
  HelpCircle,
  FileText,
  Layers,
  CopyPlus,
  Info,
  CheckCheck,
  X,
  SlidersHorizontal,
  Image as ImageIcon
} from 'lucide-react';
import Modal from '../../components/Modal';
import { WhatsAppBrandIcon } from './PublicStorePage';
import './StorefrontBuilderPage.css';

// 6 Handcrafted Theme Palettes matching StockPilot Platform
export const THEME_PRESETS = [
  {
    id: 'CLEAN_LIGHT',
    name: 'StockPilot Signature',
    description: 'Crisp white surface with signature Berry Plum (#982A86) accents',
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
    description: 'Neutral monochrome for boutique fashion and curated lifestyle stores',
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
    description: 'Deep royal blue & cyan for corporate brands, gadgets & B2B retail',
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
    description: 'High-energy crimson & amber for supermarkets, marts & groceries',
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
    description: 'Fresh botanical greens for wellness, beauty & natural organics',
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
    description: 'Modern luxury dark aesthetic for electronics, gaming & watches',
    primary: '#982A86',
    accent: '#10b981',
    bg: '#0f172a',
    card: '#1e293b',
    text: '#f8fafc',
    border: 'rgba(255,255,255,0.08)'
  }
];

// 12 Enterprise Modular Blocks Definitions
export const AVAILABLE_BLOCK_TYPES = [
  {
    type: 'HERO_BANNER',
    name: 'Hero Showcase Banner',
    category: 'Header & Intro',
    icon: Sparkles,
    badgeText: 'Essential',
    description: 'Full-width cinematic hero banner with headline, badges, CTA buttons and image overlay.',
    defaultData: {
      badge: 'Official Online Store',
      title: 'Welcome to Our Online Store',
      subtitle: 'Shop the freshest arrivals, exclusive offers, and verified products delivered quickly.',
      ctaText: 'Explore Catalog',
      imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=80'
    }
  },
  {
    type: 'PRODUCT_GRID',
    name: 'Product Catalog Grid',
    category: 'Catalog & Store',
    icon: Package,
    badgeText: 'Core',
    description: 'Full interactive catalog with real-time inventory, category filter chips, search & GST calculation.',
    defaultData: {
      title: 'Featured Catalog',
      subtitle: 'Browse all available products in real-time inventory',
      showSearch: true,
      showCategories: true,
      showStockBadge: true
    }
  },
  {
    type: 'PRODUCT_CAROUSEL',
    name: 'Product Carousel Slider',
    category: 'Catalog & Store',
    icon: Sliders,
    badgeText: 'Dynamic',
    description: 'Smooth horizontal scrolling slider showcasing trending, featured, or new arrival products.',
    defaultData: {
      title: 'Trending Highlights',
      subtitle: 'Top-selling picks delivered directly from our central inventory'
    }
  },
  {
    type: 'CATEGORY_TILES',
    name: 'Visual Category Cards',
    category: 'Navigation',
    icon: Layers,
    badgeText: 'Discovery',
    description: 'Visual category cards with intuitive icons and direct collection filtering.',
    defaultData: {
      title: 'Explore by Category',
      subtitle: 'Find exactly what you need with quick category filters'
    }
  },
  {
    type: 'FLASH_SALE',
    name: 'Flash Sale Countdown',
    category: 'Promotions',
    icon: Flame,
    badgeText: 'High Converting',
    description: 'High-urgency promotional banner with live days, hours, mins, secs countdown timer.',
    defaultData: {
      badge: 'FLASH DEAL',
      endsIn: 'Limited Weekend Promo',
      title: 'Super Saver Weekend Deals',
      subtitle: 'Exclusive direct discounts on handpicked catalog products. Don’t miss out!',
      discountText: 'UP TO 40% OFF',
      ctaText: 'Shop Deals Now'
    }
  },
  {
    type: 'TRUST_BADGES',
    name: 'Value Proposition Strip',
    category: 'Trust & Proof',
    icon: ShieldCheck,
    badgeText: 'Assurance',
    description: '4-column value strip with icons (Express Dispatch, 100% Genuine, Flexible Payments, WhatsApp Support).',
    defaultData: {
      badges: [
        { icon: 'Zap', title: 'Express Dispatch', desc: 'Fast doorstep delivery' },
        { icon: 'ShieldCheck', title: '100% Genuine', desc: 'Verified from authorized stock' },
        { icon: 'CreditCard', title: 'Flexible Payments', desc: 'UPI, Card & COD' },
        { icon: 'Phone', title: 'Direct Store Support', desc: 'Instant WhatsApp & Call help' }
      ]
    }
  },
  {
    type: 'BRAND_STORY',
    name: 'Brand Story & About',
    category: 'About & Branding',
    icon: FileText,
    badgeText: 'Story',
    description: 'Split 2-column image + narrative story showcasing your business vision and credibility.',
    defaultData: {
      badge: 'OUR HERITAGE',
      title: 'Crafted with Passion & Precision',
      narrative: 'Founded with a clear vision: to bring authenticated, premium-grade products directly to our community. Every single item in our inventory is inspected, certified, and dispatched from verified facilities to guarantee genuine quality.',
      imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80'
    }
  },
  {
    type: 'IMAGE_LOOKBOOK',
    name: 'Visual Lookbook Gallery',
    category: 'Media & Visuals',
    icon: ImageIcon,
    badgeText: 'Lifestyle',
    description: 'Curated photo lookbook gallery showcasing store aesthetics, product photography, or lookbooks.',
    defaultData: {
      title: 'Store Showcase & Visual Lookbook',
      subtitle: 'Step inside our store atmosphere and curated collections',
      items: [
        { imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80', caption: 'Flagship Store Experience' },
        { imageUrl: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=800&q=80', caption: 'Handcrafted Quality' },
        { imageUrl: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&w=800&q=80', caption: 'Latest Season Arrivals' }
      ]
    }
  },
  {
    type: 'TESTIMONIALS',
    name: 'Customer Reviews Carousel',
    category: 'Trust & Proof',
    icon: Star,
    badgeText: 'Social Proof',
    description: 'Verified buyer feedback cards with 5-star ratings, buyer name, role, and city location.',
    defaultData: {
      title: 'What Our Customers Say',
      subtitle: 'Real feedback from verified buyers across India',
      reviews: [
        { id: 1, name: 'Priya Sharma', rating: 5, comment: 'Outstanding product quality and super fast delivery. The ordering experience was seamless!', role: 'Verified Buyer', location: 'Chennai' },
        { id: 2, name: 'Rajesh Kumar', rating: 5, comment: '100% genuine stock. Direct WhatsApp updates made the whole checkout effortless.', role: 'Verified Customer', location: 'Bengaluru' },
        { id: 3, name: 'Sneha Patel', rating: 5, comment: 'Great pricing and prompt customer assistance. We will definitely continue ordering!', role: 'Verified Buyer', location: 'Mumbai' }
      ]
    }
  },
  {
    type: 'FAQ_ACCORDION',
    name: 'FAQ Accordion List',
    category: 'Information & Support',
    icon: HelpCircle,
    badgeText: 'Support',
    description: 'Expandable Q&A accordion resolving questions about shipping time, payment modes, and returns.',
    defaultData: {
      title: 'Frequently Asked Questions',
      subtitle: 'Everything you need to know about purchasing, shipping, and returns',
      faqs: [
        { q: 'How long does delivery take?', a: 'Standard deliveries are dispatched within 24 hours and typically reach your address within 2-4 business days.' },
        { q: 'What payment methods do you accept?', a: 'We accept instant UPI (Google Pay, PhonePe, Paytm), Credit & Debit Cards, Netbanking via Razorpay, and Cash on Delivery.' },
        { q: 'Are all products 100% genuine?', a: 'Yes! All inventory in our catalog is backed by verified direct stock, checked before dispatch, and covered with GST invoices.' },
        { q: 'Can I track my order on WhatsApp?', a: 'Absolutely. Immediately after placing your order, you can confirm via WhatsApp to receive tracking updates directly on your chat.' }
      ]
    }
  },
  {
    type: 'NEWSLETTER_BAR',
    name: 'Promo Coupon Offer Bar',
    category: 'Promotions',
    icon: Tag,
    badgeText: 'Incentive',
    description: 'Promotional discount banner with one-click copyable coupon code pill.',
    defaultData: {
      title: 'Unlock 10% Off Your Next Purchase',
      subtitle: 'Use this special coupon code during checkout to enjoy an instant discount on all orders.',
      couponCode: 'FIRST10'
    }
  },
  {
    type: 'CONTACT_MAP',
    name: 'Store Locator & Contact',
    category: 'Information & Support',
    icon: MapPin,
    badgeText: 'Contact',
    description: 'Physical location card with operating hours, phone, email, and instant WhatsApp chat button.',
    defaultData: {
      title: 'Visit Our Store & Contact',
      subtitle: 'Reach out directly for inquiries, custom orders, or customer support'
    }
  }
];

// 5 Industry 1-Click Templates
export const INDUSTRY_TEMPLATES = [
  {
    id: 'FASHION_BOUTIQUE',
    name: 'Fashion Boutique',
    tagline: 'Modern Apparel, Accessories & Lifestyle',
    theme: 'CLEAN_LIGHT',
    icon: Sparkles,
    sections: ['HERO_BANNER', 'FLASH_SALE', 'PRODUCT_CAROUSEL', 'CATEGORY_TILES', 'PRODUCT_GRID', 'IMAGE_LOOKBOOK', 'BRAND_STORY', 'TESTIMONIALS', 'FAQ_ACCORDION', 'CONTACT_MAP']
  },
  {
    id: 'RETAIL_SUPERMART',
    name: 'Retail Supermarket',
    tagline: 'Groceries, Daily Essentials & FMCG',
    theme: 'VIBRANT_RETAIL',
    icon: Package,
    sections: ['FLASH_SALE', 'HERO_BANNER', 'CATEGORY_TILES', 'PRODUCT_GRID', 'TRUST_BADGES', 'NEWSLETTER_BAR', 'TESTIMONIALS', 'CONTACT_MAP']
  },
  {
    id: 'TECH_ELECTRONICS',
    name: 'Tech & Electronics Hub',
    tagline: 'Smartphones, Audio Gear & Gadgets',
    theme: 'MODERN_DARK',
    icon: Zap,
    sections: ['HERO_BANNER', 'TRUST_BADGES', 'PRODUCT_CAROUSEL', 'PRODUCT_GRID', 'FLASH_SALE', 'BRAND_STORY', 'FAQ_ACCORDION', 'CONTACT_MAP']
  },
  {
    id: 'ORGANIC_WELLNESS',
    name: 'Organic & Wellness Mart',
    tagline: 'Farm Fresh, Ayurvedic & Health',
    theme: 'EMERALD_NATURE',
    icon: ShieldCheck,
    sections: ['HERO_BANNER', 'TRUST_BADGES', 'CATEGORY_TILES', 'PRODUCT_GRID', 'BRAND_STORY', 'NEWSLETTER_BAR', 'TESTIMONIALS', 'FAQ_ACCORDION', 'CONTACT_MAP']
  },
  {
    id: 'LUXURY_LIFESTYLE',
    name: 'Luxury & Lifestyle Studio',
    tagline: 'High-end Watches, Jewelry & Decor',
    theme: 'MINIMAL_WHITE',
    icon: Star,
    sections: ['HERO_BANNER', 'IMAGE_LOOKBOOK', 'PRODUCT_CAROUSEL', 'PRODUCT_GRID', 'BRAND_STORY', 'TESTIMONIALS', 'NEWSLETTER_BAR', 'CONTACT_MAP']
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

  // Studio Mode: 'layers' | 'add' | 'theme' | 'inspector'
  const [activeTab, setActiveTab] = useState('layers');
  const [selectedSectionId, setSelectedSectionId] = useState(null);

  // Device Switcher: 'desktop' | 'tablet' | 'mobile'
  const [previewDevice, setPreviewDevice] = useState('desktop');

  // 1-Click Templates Modal
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  // Drag and Drop State
  const [draggedSectionIndex, setDraggedSectionIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Real Tenant Products & Stocks State
  const [tenantProducts, setTenantProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [builderProductSearch, setBuilderProductSearch] = useState('');
  const [selectedSimCategory, setSelectedSimCategory] = useState('ALL');

  // Product Settings & Image Configuration Modal State
  const [editingProduct, setEditingProduct] = useState(null);
  const [isEditProductModalOpen, setIsEditProductModalOpen] = useState(false);
  const [productEditForm, setProductEditForm] = useState({
    name: '',
    productCode: '',
    sellingPrice: '',
    purchasePrice: '',
    taxRate: '',
    imageUrl: '',
    description: ''
  });
  const [isSavingProduct, setIsSavingProduct] = useState(false);

  // Master Configuration State
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
      logoUrl: ''
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
    sections: [
      {
        id: 'sec-hero',
        type: 'HERO_BANNER',
        enabled: true,
        data: {
          badge: 'Official Online Store',
          title: `Welcome to ${user?.companyName || 'Our Store'}`,
          subtitle: 'Shop the freshest arrivals, exclusive store offers, and verified products delivered quickly.',
          ctaText: 'Explore Catalog',
          imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=80'
        }
      },
      {
        id: 'sec-trust',
        type: 'TRUST_BADGES',
        enabled: true,
        data: {
          badges: [
            { icon: 'Zap', title: 'Express Dispatch', desc: 'Fast doorstep delivery' },
            { icon: 'ShieldCheck', title: '100% Genuine', desc: 'Verified authorized stock' },
            { icon: 'CreditCard', title: 'Flexible Payments', desc: 'UPI, Card & COD' },
            { icon: 'Phone', title: 'Store Support', desc: 'Instant WhatsApp assistance' }
          ]
        }
      },
      {
        id: 'sec-catalog',
        type: 'PRODUCT_GRID',
        enabled: true,
        data: {
          title: 'Featured Catalog',
          subtitle: 'Browse all available products in real-time inventory',
          showSearch: true,
          showCategories: true,
          showStockBadge: true
        }
      },
      {
        id: 'sec-testimonials',
        type: 'TESTIMONIALS',
        enabled: true,
        data: {
          title: 'What Our Customers Say',
          subtitle: 'Verified reviews from direct buyers across India',
          reviews: [
            { id: 1, name: 'Priya Sharma', rating: 5, comment: 'Outstanding product quality and super fast delivery. The ordering experience was seamless!', role: 'Verified Buyer', location: 'Chennai' },
            { id: 2, name: 'Rajesh Kumar', rating: 5, comment: '100% genuine stock. Direct WhatsApp updates made the whole checkout effortless.', role: 'Verified Customer', location: 'Bengaluru' },
            { id: 3, name: 'Sneha Patel', rating: 5, comment: 'Great pricing and prompt customer assistance. We will definitely continue ordering!', role: 'Verified Buyer', location: 'Mumbai' }
          ]
        }
      },
      {
        id: 'sec-contact',
        type: 'CONTACT_MAP',
        enabled: true,
        data: {
          title: 'Visit Our Store & Contact',
          subtitle: 'Reach out directly for inquiries, custom orders, or customer support'
        }
      }
    ],
    contact: {
      address: user?.address || 'Retail Center, Commercial Street',
      phone: user?.phone || '',
      email: user?.email || '',
      hours: 'Mon - Sat: 9:00 AM - 9:00 PM',
      whatsappNumber: user?.phone || ''
    }
  });

  // Fetch initial config and normalize sections
  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await api.get('/tenants/store-config');
      if (res?.data) {
        setConfig((prev) => {
          const loaded = res.data;
          const loadedNav = loaded.navbar || {};
          const mergedNavLinks = Array.isArray(loadedNav.navLinks) && loadedNav.navLinks.length > 0
            ? loadedNav.navLinks
            : DEFAULT_NAV_LINKS;

          // Normalize sections array if stored as legacy object or missing
          let normalizedSections = prev.sections;
          if (Array.isArray(loaded.sections) && loaded.sections.length > 0) {
            normalizedSections = loaded.sections;
          } else if (loaded.hero || loaded.productsSection) {
            normalizedSections = [
              {
                id: 'sec-hero',
                type: 'HERO_BANNER',
                enabled: loaded.hero?.enabled !== false,
                data: loaded.hero || prev.sections[0].data
              },
              {
                id: 'sec-trust',
                type: 'TRUST_BADGES',
                enabled: loaded.sections?.trustBadgesEnabled !== false,
                data: { badges: loaded.trustBadges || prev.sections[1].data.badges }
              },
              {
                id: 'sec-catalog',
                type: 'PRODUCT_GRID',
                enabled: true,
                data: loaded.productsSection || prev.sections[2].data
              },
              {
                id: 'sec-testimonials',
                type: 'TESTIMONIALS',
                enabled: loaded.testimonials?.enabled !== false,
                data: loaded.testimonials || prev.sections[3].data
              },
              {
                id: 'sec-contact',
                type: 'CONTACT_MAP',
                enabled: loaded.contact?.enabled !== false,
                data: loaded.contact || prev.sections[4].data
              }
            ];
          }

          return {
            ...prev,
            ...loaded,
            branding: { ...prev.branding, ...(loaded.branding || {}) },
            announcement: { ...prev.announcement, ...(loaded.announcement || {}) },
            navbar: {
              ...prev.navbar,
              ...loadedNav,
              navLinks: mergedNavLinks
            },
            sections: normalizedSections,
            contact: { ...prev.contact, ...(loaded.contact || {}) }
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
      const [prodRes, stockRes] = await Promise.allSettled([
        api.get('/products?limit=200'),
        api.get('/inventory')
      ]);

      const rawProds = prodRes.status === 'fulfilled' ? (prodRes.value?.data?.products || (Array.isArray(prodRes.value?.data) ? prodRes.value.data : [])) : [];
      const rawStocks = stockRes.status === 'fulfilled' ? (stockRes.value?.data || []) : [];

      const stockMap = {};
      rawStocks.forEach((s) => {
        stockMap[s.product_id] = (stockMap[s.product_id] || 0) + (Number(s.current_stock) || 0);
      });

      const catalogProducts = rawProds
        .filter((p) => !p.status || p.status === 'ACTIVE')
        .map((p) => {
          const stock = stockMap[p.id] !== undefined ? stockMap[p.id] : 0;
          return {
            ...p,
            currentStock: stock,
            inStock: stock > 0
          };
        });

      setTenantProducts(catalogProducts);
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

  // Distinct categories from products
  const catalogCategories = useMemo(() => {
    const cats = new Set();
    tenantProducts.forEach((p) => {
      const cat = p.category?.name || p.category_name || (typeof p.category === 'string' ? p.category : null);
      if (cat && cat.trim()) cats.add(cat.trim());
    });
    return Array.from(cats);
  }, [tenantProducts]);

  // Selected section object
  const selectedSection = useMemo(() => {
    if (!selectedSectionId) return config.sections[0] || null;
    return config.sections.find((s) => s.id === selectedSectionId) || config.sections[0] || null;
  }, [selectedSectionId, config.sections]);

  // Save changes to backend
  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put('/tenants/store-config', config);
      toast.success('Storefront published live successfully! All changes are now live.');
    } catch (err) {
      toast.error(err?.message || 'Failed to publish store configuration.');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(liveStoreUrl);
    setCopiedUrl(true);
    toast.success('Live store URL copied to clipboard!');
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  // Drag and Drop Handlers
  const handleDragStart = (e, index) => {
    setDraggedSectionIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedSectionIndex === null || draggedSectionIndex === targetIndex) {
      setDraggedSectionIndex(null);
      setDragOverIndex(null);
      return;
    }
    const updated = [...config.sections];
    const [moved] = updated.splice(draggedSectionIndex, 1);
    updated.splice(targetIndex, 0, moved);
    setConfig((prev) => ({ ...prev, sections: updated }));
    setDraggedSectionIndex(null);
    setDragOverIndex(null);
    toast.success('Section reordered!');
  };

  const handleDragEnd = () => {
    setDraggedSectionIndex(null);
    setDragOverIndex(null);
  };

  // Up/Down Arrow Reordering
  const moveSection = (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= config.sections.length) return;
    const updated = [...config.sections];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setConfig((prev) => ({ ...prev, sections: updated }));
  };

  // Toggle Section visibility
  const toggleSection = (index) => {
    const updated = [...config.sections];
    updated[index] = { ...updated[index], enabled: updated[index].enabled === false ? true : false };
    setConfig((prev) => ({ ...prev, sections: updated }));
  };

  // Duplicate Section
  const duplicateSection = (index) => {
    const original = config.sections[index];
    const clone = {
      ...original,
      id: `sec-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      data: JSON.parse(JSON.stringify(original.data || {}))
    };
    const updated = [...config.sections];
    updated.splice(index + 1, 0, clone);
    setConfig((prev) => ({ ...prev, sections: updated }));
    setSelectedSectionId(clone.id);
    setActiveTab('inspector');
    toast.success(`Duplicated "${original.type}"!`);
  };

  // Delete Section
  const deleteSection = (index) => {
    if (config.sections.length <= 1) {
      toast.warning('A store must have at least one section.');
      return;
    }
    const target = config.sections[index];
    const updated = config.sections.filter((_, i) => i !== index);
    setConfig((prev) => ({ ...prev, sections: updated }));
    if (selectedSectionId === target.id) {
      setSelectedSectionId(updated[0]?.id || null);
    }
    toast.info('Section removed from page');
  };

  // Add block from library
  const addBlockToPage = (blockType) => {
    const def = AVAILABLE_BLOCK_TYPES.find((b) => b.type === blockType);
    if (!def) return;
    const newSec = {
      id: `sec-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type: blockType,
      enabled: true,
      data: JSON.parse(JSON.stringify(def.defaultData))
    };
    setConfig((prev) => ({
      ...prev,
      sections: [...(prev.sections || []), newSec]
    }));
    setSelectedSectionId(newSec.id);
    setActiveTab('inspector');
    toast.success(`Added ${def.name} to page!`);
  };

  // 1-Click Template Application
  const handleApplyTemplate = (templateId) => {
    const tmpl = INDUSTRY_TEMPLATES.find((t) => t.id === templateId);
    if (!tmpl) return;
    const preset = THEME_PRESETS.find((p) => p.id === tmpl.theme) || THEME_PRESETS[0];

    const newSections = tmpl.sections.map((type, idx) => {
      const def = AVAILABLE_BLOCK_TYPES.find((b) => b.type === type);
      return {
        id: `sec-${idx + 1}-${type.toLowerCase()}`,
        type,
        enabled: true,
        data: JSON.parse(JSON.stringify(def?.defaultData || {}))
      };
    });

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
      },
      sections: newSections
    }));
    if (newSections.length > 0) {
      setSelectedSectionId(newSections[0].id);
    }
    setIsTemplateModalOpen(false);
    toast.success(`Applied "${tmpl.name}" layout & palette!`);
  };

  // Apply Theme Preset
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

  // Update Selected Section Data
  const updateSelectedSectionData = (field, value) => {
    if (!selectedSection) return;
    setConfig((prev) => {
      const updated = prev.sections.map((sec) => {
        if (sec.id === selectedSection.id) {
          return {
            ...sec,
            data: {
              ...(sec.data || {}),
              [field]: value
            }
          };
        }
        return sec;
      });
      return { ...prev, sections: updated };
    });
  };

  // Product Inline Edit Modal Handlers
  const handleOpenEditProduct = (p) => {
    setEditingProduct(p);
    setProductEditForm({
      name: p.name || '',
      productCode: p.product_code || p.productCode || '',
      sellingPrice: String(p.selling_price || p.sellingPrice || ''),
      purchasePrice: String(p.purchase_price || p.purchasePrice || ''),
      taxRate: String(p.tax_rate !== undefined && p.tax_rate !== null ? p.tax_rate : (p.taxRate || 0)),
      imageUrl: p.image_url || p.imageUrl || '',
      description: p.description || ''
    });
    setIsEditProductModalOpen(true);
  };

  const handleSaveProductEdit = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      setIsSavingProduct(true);
      const updatePayload = {
        name: productEditForm.name.trim(),
        productCode: productEditForm.productCode.trim(),
        sellingPrice: parseFloat(productEditForm.sellingPrice) || 0,
        purchasePrice: parseFloat(productEditForm.purchasePrice) || 0,
        taxRate: parseFloat(productEditForm.taxRate) || 0,
        imageUrl: productEditForm.imageUrl ? productEditForm.imageUrl.trim() : null,
        description: productEditForm.description ? productEditForm.description.trim() : ''
      };

      await api.put(`/products/${editingProduct.id}`, updatePayload);
      toast.success(`Updated ${productEditForm.name} & image URL!`);
      setIsEditProductModalOpen(false);
      setEditingProduct(null);
      await fetchTenantProducts();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to update product');
    } finally {
      setIsSavingProduct(false);
    }
  };

  const primaryColor = config.branding?.primaryColor || '#982A86';
  const accentColor = config.branding?.accentColor || '#10b981';
  const bgColor = config.branding?.bgColor || '#ffffff';
  const cardColor = config.branding?.cardColor || '#ffffff';
  const textColor = config.branding?.textColor || '#0f172a';

  return (
    <div className="studio-builder-fullscreen">
      {/* 1. TOP STUDIO CONTROL BAR */}
      <header className="studio-topbar">
        <div className="studio-topbar-left">
          <Link to="/dashboard" className="studio-exit-btn" title="Back to Company Dashboard">
            <ChevronLeft size={16} />
            <span>Exit Studio</span>
          </Link>
          <div className="studio-divider" />
          <div className="studio-brand-box">
            <div className="studio-avatar" style={{ background: primaryColor }}>
              <Store size={16} />
            </div>
            <div>
              <div className="studio-store-title-wrap">
                <span className="studio-store-name">{config.branding?.storeName || 'My Online Store'}</span>
                <span className="studio-live-pill">
                  <span className="live-pulsing-dot" /> Live
                </span>
              </div>
              <span className="studio-code-sub">Code: {companyCode}</span>
            </div>
          </div>
        </div>

        {/* Device Viewport Toggle (Desktop, Tablet, Mobile) */}
        <div className="studio-device-switcher">
          <button
            type="button"
            className={`device-btn ${previewDevice === 'desktop' ? 'active' : ''}`}
            onClick={() => setPreviewDevice('desktop')}
            title="Desktop Full Screen Preview"
          >
            <Monitor size={15} />
            <span>Desktop</span>
          </button>
          <button
            type="button"
            className={`device-btn ${previewDevice === 'tablet' ? 'active' : ''}`}
            onClick={() => setPreviewDevice('tablet')}
            title="Tablet Preview (768px)"
          >
            <Tablet size={15} />
            <span>Tablet</span>
          </button>
          <button
            type="button"
            className={`device-btn ${previewDevice === 'mobile' ? 'active' : ''}`}
            onClick={() => setPreviewDevice('mobile')}
            title="Mobile iPhone Preview (390px)"
          >
            <Smartphone size={15} />
            <span>Mobile</span>
          </button>
        </div>

        {/* Actions: 1-Click Templates, Copy Link, Open Live, Publish */}
        <div className="studio-topbar-right">
          <button
            type="button"
            onClick={() => setIsTemplateModalOpen(true)}
            className="btn-studio-ghost"
            title="Choose from 5 industry-ready templates"
          >
            <Sparkles size={15} color="#982A86" />
            <span>1-Click Templates</span>
          </button>

          <button
            type="button"
            onClick={handleCopyUrl}
            className="btn-studio-ghost"
            title="Copy Public Storefront URL"
          >
            {copiedUrl ? <Check size={15} color="#10b981" /> : <Copy size={15} />}
            <span>{copiedUrl ? 'Copied!' : 'Copy Link'}</span>
          </button>

          <a
            href={liveStoreUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-studio-ghost"
            title="View Live Storefront in new tab"
          >
            <ExternalLink size={15} />
            <span>View Live</span>
          </a>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn-studio-publish"
            style={{ background: primaryColor }}
          >
            {saving ? (
              <>
                <span className="studio-spinner" />
                <span>Publishing...</span>
              </>
            ) : (
              <>
                <Zap size={15} />
                <span>Publish Changes</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* 2. MAIN STUDIO WORKSPACE */}
      <div className="studio-workspace">
        {/* LEFT STUDIO SIDEBAR */}
        <aside className="studio-sidebar">
          {/* Studio Tab Navigation */}
          <nav className="studio-tab-bar">
            <button
              type="button"
              className={`studio-tab-item ${activeTab === 'layers' ? 'active' : ''}`}
              onClick={() => setActiveTab('layers')}
            >
              <Layers size={16} />
              <span>Layers</span>
              <span className="tab-count-pill">{config.sections.length}</span>
            </button>
            <button
              type="button"
              className={`studio-tab-item ${activeTab === 'add' ? 'active' : ''}`}
              onClick={() => setActiveTab('add')}
            >
              <Plus size={16} />
              <span>Add Block</span>
            </button>
            <button
              type="button"
              className={`studio-tab-item ${activeTab === 'theme' ? 'active' : ''}`}
              onClick={() => setActiveTab('theme')}
            >
              <Palette size={16} />
              <span>Theme</span>
            </button>
            <button
              type="button"
              className={`studio-tab-item ${activeTab === 'inspector' ? 'active' : ''}`}
              onClick={() => setActiveTab('inspector')}
            >
              <Settings size={16} />
              <span>Inspector</span>
            </button>
          </nav>

          {/* TAB 1: LAYERS & DRAG-AND-DROP REORDER */}
          {activeTab === 'layers' && (
            <div className="studio-sidebar-content">
              <div className="sidebar-section-header">
                <div>
                  <h3 className="sidebar-heading">Page Structure & Order</h3>
                  <p className="sidebar-subheading">Drag & drop or use arrows to reorder sections.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('add')}
                  className="btn-mini-add"
                  title="Add New Block"
                >
                  <Plus size={14} /> Add
                </button>
              </div>

              <div className="layers-list">
                {config.sections.map((sec, idx) => {
                  const def = AVAILABLE_BLOCK_TYPES.find((b) => b.type === sec.type) || {
                    name: sec.type,
                    icon: Package
                  };
                  const IconComp = def.icon;
                  const isSelected = selectedSection?.id === sec.id;
                  const isHidden = sec.enabled === false;

                  return (
                    <div
                      key={sec.id || idx}
                      draggable
                      onDragStart={(e) => handleDragStart(e, idx)}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDrop={(e) => handleDrop(e, idx)}
                      onDragEnd={handleDragEnd}
                      onClick={() => {
                        setSelectedSectionId(sec.id);
                        setActiveTab('inspector');
                      }}
                      className={`layer-item-card ${isSelected ? 'selected' : ''} ${isHidden ? 'hidden-layer' : ''} ${
                        dragOverIndex === idx ? 'drag-over-target' : ''
                      }`}
                    >
                      <div className="layer-item-left">
                        <span className="drag-handle" title="Drag to reorder" onClick={(e) => e.stopPropagation()}>
                          <GripVertical size={16} />
                        </span>
                        <div className="layer-icon-badge" style={{ background: `${primaryColor}18`, color: primaryColor }}>
                          <IconComp size={15} />
                        </div>
                        <div className="layer-info">
                          <span className="layer-name">{def.name}</span>
                          <span className="layer-type-tag">{sec.type}</span>
                        </div>
                      </div>

                      <div className="layer-actions" onClick={(e) => e.stopPropagation()}>
                        {/* Up Arrow */}
                        <button
                          type="button"
                          onClick={() => moveSection(idx, 'up')}
                          disabled={idx === 0}
                          className="btn-layer-action"
                          title="Move Up"
                        >
                          <ArrowUp size={13} />
                        </button>
                        {/* Down Arrow */}
                        <button
                          type="button"
                          onClick={() => moveSection(idx, 'down')}
                          disabled={idx === config.sections.length - 1}
                          className="btn-layer-action"
                          title="Move Down"
                        >
                          <ArrowDown size={13} />
                        </button>
                        {/* Eye Visibility Toggle */}
                        <button
                          type="button"
                          onClick={() => toggleSection(idx)}
                          className="btn-layer-action"
                          title={isHidden ? 'Show Section' : 'Hide Section'}
                        >
                          {isHidden ? <EyeOff size={14} color="#94a3b8" /> : <Eye size={14} color="#10b981" />}
                        </button>
                        {/* Duplicate */}
                        <button
                          type="button"
                          onClick={() => duplicateSection(idx)}
                          className="btn-layer-action"
                          title="Duplicate Section"
                        >
                          <CopyPlus size={14} />
                        </button>
                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => deleteSection(idx)}
                          className="btn-layer-action delete"
                          title="Remove Section"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quick Append Button at Bottom */}
              <div className="layers-footer">
                <button
                  type="button"
                  onClick={() => setActiveTab('add')}
                  className="btn-append-block"
                >
                  <Plus size={15} />
                  <span>Add New Section Block</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: ADD BLOCK LIBRARY (12 BLOCKS) */}
          {activeTab === 'add' && (
            <div className="studio-sidebar-content">
              <div className="sidebar-section-header">
                <div>
                  <h3 className="sidebar-heading">Modular Block Library</h3>
                  <p className="sidebar-subheading">Choose any enterprise block to add to your page.</p>
                </div>
              </div>

              <div className="blocks-catalog-grid">
                {AVAILABLE_BLOCK_TYPES.map((block) => {
                  const IconComp = block.icon;
                  const alreadyAdded = config.sections.some((s) => s.type === block.type);

                  return (
                    <div key={block.type} className="block-catalog-card">
                      <div className="block-catalog-top">
                        <div className="block-catalog-icon" style={{ background: `${primaryColor}15`, color: primaryColor }}>
                          <IconComp size={20} />
                        </div>
                        <div className="block-catalog-meta">
                          <span className="block-category-pill">{block.category}</span>
                          <span className="block-badge-pill">{block.badgeText}</span>
                        </div>
                      </div>
                      <h4 className="block-catalog-name">{block.name}</h4>
                      <p className="block-catalog-desc">{block.description}</p>
                      <button
                        type="button"
                        onClick={() => addBlockToPage(block.type)}
                        className="btn-add-block-cta"
                        style={{ borderColor: primaryColor, color: primaryColor }}
                      >
                        <Plus size={14} />
                        <span>Add to Storefront</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: THEME, COLORS & BRANDING */}
          {activeTab === 'theme' && (
            <div className="studio-sidebar-content">
              <div className="sidebar-section-header">
                <div>
                  <h3 className="sidebar-heading">Theme Styling & Branding</h3>
                  <p className="sidebar-subheading">Curated palettes and customized store branding.</p>
                </div>
              </div>

              {/* Theme Palettes Grid */}
              <div className="studio-group">
                <label className="studio-label">Curated Color Palettes</label>
                <div className="presets-mini-grid">
                  {THEME_PRESETS.map((preset) => (
                    <div
                      key={preset.id}
                      onClick={() => handleApplyPreset(preset)}
                      className={`preset-chip-card ${config.theme === preset.id ? 'active' : ''}`}
                    >
                      <div className="preset-swatches-strip">
                        <span style={{ background: preset.primary }} />
                        <span style={{ background: preset.accent }} />
                        <span style={{ background: preset.bg }} />
                        <span style={{ background: preset.text }} />
                      </div>
                      <div className="preset-chip-info">
                        <strong>{preset.name}</strong>
                        <span>{preset.description}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Color Pickers */}
              <div className="studio-group">
                <label className="studio-label">Custom Theme Tokens</label>
                <div className="color-pickers-grid">
                  <div className="color-field">
                    <span>Primary Brand</span>
                    <div className="color-input-wrap">
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            branding: { ...prev.branding, primaryColor: e.target.value }
                          }))
                        }
                      />
                      <code>{primaryColor}</code>
                    </div>
                  </div>
                  <div className="color-field">
                    <span>Accent Highlight</span>
                    <div className="color-input-wrap">
                      <input
                        type="color"
                        value={accentColor}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            branding: { ...prev.branding, accentColor: e.target.value }
                          }))
                        }
                      />
                      <code>{accentColor}</code>
                    </div>
                  </div>
                  <div className="color-field">
                    <span>Background</span>
                    <div className="color-input-wrap">
                      <input
                        type="color"
                        value={bgColor}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            branding: { ...prev.branding, bgColor: e.target.value }
                          }))
                        }
                      />
                      <code>{bgColor}</code>
                    </div>
                  </div>
                  <div className="color-field">
                    <span>Text Main</span>
                    <div className="color-input-wrap">
                      <input
                        type="color"
                        value={textColor}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            branding: { ...prev.branding, textColor: e.target.value }
                          }))
                        }
                      />
                      <code>{textColor}</code>
                    </div>
                  </div>
                </div>
              </div>

              {/* Store Identity */}
              <div className="studio-group">
                <label className="studio-label">Store Brand & Identity</label>
                <div className="form-stack">
                  <div>
                    <span className="field-label">Store Name</span>
                    <input
                      type="text"
                      className="studio-input"
                      value={config.branding?.storeName || ''}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          branding: { ...prev.branding, storeName: e.target.value }
                        }))
                      }
                    />
                  </div>
                  <div>
                    <span className="field-label">Tagline</span>
                    <input
                      type="text"
                      className="studio-input"
                      value={config.branding?.tagline || ''}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          branding: { ...prev.branding, tagline: e.target.value }
                        }))
                      }
                    />
                  </div>
                  <div>
                    <span className="field-label">Logo Image URL (Optional)</span>
                    <input
                      type="url"
                      className="studio-input"
                      placeholder="https://.../logo.png"
                      value={config.branding?.logoUrl || ''}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          branding: { ...prev.branding, logoUrl: e.target.value }
                        }))
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Announcement Bar */}
              <div className="studio-group">
                <div className="toggle-row">
                  <div>
                    <label className="studio-label">Top Announcement Bar</label>
                    <span className="field-hint">Sticky promotion bar across the top of the storefront</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.announcement?.enabled !== false}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        announcement: { ...prev.announcement, enabled: e.target.checked }
                      }))
                    }
                  />
                </div>
                {config.announcement?.enabled !== false && (
                  <input
                    type="text"
                    className="studio-input"
                    value={config.announcement?.text || ''}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        announcement: { ...prev.announcement, text: e.target.value }
                      }))
                    }
                    placeholder="Announcement banner text..."
                  />
                )}
              </div>
            </div>
          )}

          {/* TAB 4: SECTION INSPECTOR (SETTINGS FOR SELECTED SECTION) */}
          {activeTab === 'inspector' && selectedSection && (
            <div className="studio-sidebar-content">
              <div className="sidebar-section-header">
                <div>
                  <span className="inspector-pill">{selectedSection.type}</span>
                  <h3 className="sidebar-heading">Section Configuration</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('layers')}
                  className="btn-mini-back"
                  title="Back to Layers"
                >
                  &larr; Layers
                </button>
              </div>

              {/* Inspector Content based on Block Type */}
              <div className="inspector-form-stack">
                {selectedSection.type === 'HERO_BANNER' && (
                  <>
                    <div>
                      <span className="field-label">Badge Text</span>
                      <input
                        type="text"
                        className="studio-input"
                        value={selectedSection.data?.badge || ''}
                        onChange={(e) => updateSelectedSectionData('badge', e.target.value)}
                      />
                    </div>
                    <div>
                      <span className="field-label">Main Title</span>
                      <input
                        type="text"
                        className="studio-input"
                        value={selectedSection.data?.title || ''}
                        onChange={(e) => updateSelectedSectionData('title', e.target.value)}
                      />
                    </div>
                    <div>
                      <span className="field-label">Subtitle Description</span>
                      <textarea
                        className="studio-textarea"
                        rows={3}
                        value={selectedSection.data?.subtitle || ''}
                        onChange={(e) => updateSelectedSectionData('subtitle', e.target.value)}
                      />
                    </div>
                    <div>
                      <span className="field-label">CTA Button Label</span>
                      <input
                        type="text"
                        className="studio-input"
                        value={selectedSection.data?.ctaText || ''}
                        onChange={(e) => updateSelectedSectionData('ctaText', e.target.value)}
                      />
                    </div>
                    <div>
                      <span className="field-label">Hero Background Image URL</span>
                      <input
                        type="url"
                        className="studio-input"
                        value={selectedSection.data?.imageUrl || ''}
                        onChange={(e) => updateSelectedSectionData('imageUrl', e.target.value)}
                      />
                    </div>
                  </>
                )}

                {selectedSection.type === 'FLASH_SALE' && (
                  <>
                    <div>
                      <span className="field-label">Sale Urgency Badge</span>
                      <input
                        type="text"
                        className="studio-input"
                        value={selectedSection.data?.badge || ''}
                        onChange={(e) => updateSelectedSectionData('badge', e.target.value)}
                      />
                    </div>
                    <div>
                      <span className="field-label">Ends In Label</span>
                      <input
                        type="text"
                        className="studio-input"
                        value={selectedSection.data?.endsIn || ''}
                        onChange={(e) => updateSelectedSectionData('endsIn', e.target.value)}
                      />
                    </div>
                    <div>
                      <span className="field-label">Sale Title</span>
                      <input
                        type="text"
                        className="studio-input"
                        value={selectedSection.data?.title || ''}
                        onChange={(e) => updateSelectedSectionData('title', e.target.value)}
                      />
                    </div>
                    <div>
                      <span className="field-label">Sale Subtitle</span>
                      <textarea
                        className="studio-textarea"
                        rows={2}
                        value={selectedSection.data?.subtitle || ''}
                        onChange={(e) => updateSelectedSectionData('subtitle', e.target.value)}
                      />
                    </div>
                    <div>
                      <span className="field-label">Discount Pill Text</span>
                      <input
                        type="text"
                        className="studio-input"
                        value={selectedSection.data?.discountText || ''}
                        onChange={(e) => updateSelectedSectionData('discountText', e.target.value)}
                      />
                    </div>
                    <div>
                      <span className="field-label">CTA Button Text</span>
                      <input
                        type="text"
                        className="studio-input"
                        value={selectedSection.data?.ctaText || ''}
                        onChange={(e) => updateSelectedSectionData('ctaText', e.target.value)}
                      />
                    </div>
                  </>
                )}

                {selectedSection.type === 'PRODUCT_GRID' && (
                  <>
                    <div>
                      <span className="field-label">Catalog Title</span>
                      <input
                        type="text"
                        className="studio-input"
                        value={selectedSection.data?.title || ''}
                        onChange={(e) => updateSelectedSectionData('title', e.target.value)}
                      />
                    </div>
                    <div>
                      <span className="field-label">Catalog Subtitle</span>
                      <input
                        type="text"
                        className="studio-input"
                        value={selectedSection.data?.subtitle || ''}
                        onChange={(e) => updateSelectedSectionData('subtitle', e.target.value)}
                      />
                    </div>
                    <div className="toggle-row">
                      <span>Enable Live Search Bar</span>
                      <input
                        type="checkbox"
                        checked={selectedSection.data?.showSearch !== false}
                        onChange={(e) => updateSelectedSectionData('showSearch', e.target.checked)}
                      />
                    </div>
                    <div className="toggle-row">
                      <span>Show Category Navigation Chips</span>
                      <input
                        type="checkbox"
                        checked={selectedSection.data?.showCategories !== false}
                        onChange={(e) => updateSelectedSectionData('showCategories', e.target.checked)}
                      />
                    </div>
                    <div className="toggle-row">
                      <span>Show Real-Time Stock Badge</span>
                      <input
                        type="checkbox"
                        checked={selectedSection.data?.showStockBadge !== false}
                        onChange={(e) => updateSelectedSectionData('showStockBadge', e.target.checked)}
                      />
                    </div>
                  </>
                )}

                {selectedSection.type === 'PRODUCT_CAROUSEL' && (
                  <>
                    <div>
                      <span className="field-label">Carousel Headline</span>
                      <input
                        type="text"
                        className="studio-input"
                        value={selectedSection.data?.title || ''}
                        onChange={(e) => updateSelectedSectionData('title', e.target.value)}
                      />
                    </div>
                    <div>
                      <span className="field-label">Carousel Subtitle</span>
                      <input
                        type="text"
                        className="studio-input"
                        value={selectedSection.data?.subtitle || ''}
                        onChange={(e) => updateSelectedSectionData('subtitle', e.target.value)}
                      />
                    </div>
                  </>
                )}

                {selectedSection.type === 'CATEGORY_TILES' && (
                  <>
                    <div>
                      <span className="field-label">Section Title</span>
                      <input
                        type="text"
                        className="studio-input"
                        value={selectedSection.data?.title || ''}
                        onChange={(e) => updateSelectedSectionData('title', e.target.value)}
                      />
                    </div>
                    <div>
                      <span className="field-label">Section Subtitle</span>
                      <input
                        type="text"
                        className="studio-input"
                        value={selectedSection.data?.subtitle || ''}
                        onChange={(e) => updateSelectedSectionData('subtitle', e.target.value)}
                      />
                    </div>
                  </>
                )}

                {selectedSection.type === 'BRAND_STORY' && (
                  <>
                    <div>
                      <span className="field-label">Badge Tag</span>
                      <input
                        type="text"
                        className="studio-input"
                        value={selectedSection.data?.badge || ''}
                        onChange={(e) => updateSelectedSectionData('badge', e.target.value)}
                      />
                    </div>
                    <div>
                      <span className="field-label">Story Headline</span>
                      <input
                        type="text"
                        className="studio-input"
                        value={selectedSection.data?.title || ''}
                        onChange={(e) => updateSelectedSectionData('title', e.target.value)}
                      />
                    </div>
                    <div>
                      <span className="field-label">Brand Narrative</span>
                      <textarea
                        className="studio-textarea"
                        rows={4}
                        value={selectedSection.data?.narrative || ''}
                        onChange={(e) => updateSelectedSectionData('narrative', e.target.value)}
                      />
                    </div>
                    <div>
                      <span className="field-label">Story Image URL</span>
                      <input
                        type="url"
                        className="studio-input"
                        value={selectedSection.data?.imageUrl || ''}
                        onChange={(e) => updateSelectedSectionData('imageUrl', e.target.value)}
                      />
                    </div>
                  </>
                )}

                {selectedSection.type === 'IMAGE_LOOKBOOK' && (
                  <>
                    <div>
                      <span className="field-label">Lookbook Title</span>
                      <input
                        type="text"
                        className="studio-input"
                        value={selectedSection.data?.title || ''}
                        onChange={(e) => updateSelectedSectionData('title', e.target.value)}
                      />
                    </div>
                    <div>
                      <span className="field-label">Subtitle</span>
                      <input
                        type="text"
                        className="studio-input"
                        value={selectedSection.data?.subtitle || ''}
                        onChange={(e) => updateSelectedSectionData('subtitle', e.target.value)}
                      />
                    </div>
                  </>
                )}

                {selectedSection.type === 'NEWSLETTER_BAR' && (
                  <>
                    <div>
                      <span className="field-label">Coupon Code</span>
                      <input
                        type="text"
                        className="studio-input"
                        value={selectedSection.data?.couponCode || ''}
                        onChange={(e) => updateSelectedSectionData('couponCode', e.target.value.toUpperCase())}
                      />
                    </div>
                    <div>
                      <span className="field-label">Headline</span>
                      <input
                        type="text"
                        className="studio-input"
                        value={selectedSection.data?.title || ''}
                        onChange={(e) => updateSelectedSectionData('title', e.target.value)}
                      />
                    </div>
                    <div>
                      <span className="field-label">Offer Terms / Subtitle</span>
                      <input
                        type="text"
                        className="studio-input"
                        value={selectedSection.data?.subtitle || ''}
                        onChange={(e) => updateSelectedSectionData('subtitle', e.target.value)}
                      />
                    </div>
                  </>
                )}

                {selectedSection.type === 'CONTACT_MAP' && (
                  <>
                    <div>
                      <span className="field-label">Title</span>
                      <input
                        type="text"
                        className="studio-input"
                        value={selectedSection.data?.title || ''}
                        onChange={(e) => updateSelectedSectionData('title', e.target.value)}
                      />
                    </div>
                    <div>
                      <span className="field-label">Subtitle</span>
                      <input
                        type="text"
                        className="studio-input"
                        value={selectedSection.data?.subtitle || ''}
                        onChange={(e) => updateSelectedSectionData('subtitle', e.target.value)}
                      />
                    </div>
                  </>
                )}

                {selectedSection.type === 'FAQ_ACCORDION' && (
                  <>
                    <div>
                      <span className="field-label">Title</span>
                      <input
                        type="text"
                        className="studio-input"
                        value={selectedSection.data?.title || ''}
                        onChange={(e) => updateSelectedSectionData('title', e.target.value)}
                      />
                    </div>
                    <div>
                      <span className="field-label">Subtitle</span>
                      <input
                        type="text"
                        className="studio-input"
                        value={selectedSection.data?.subtitle || ''}
                        onChange={(e) => updateSelectedSectionData('subtitle', e.target.value)}
                      />
                    </div>
                  </>
                )}

                {selectedSection.type === 'TESTIMONIALS' && (
                  <>
                    <div>
                      <span className="field-label">Title</span>
                      <input
                        type="text"
                        className="studio-input"
                        value={selectedSection.data?.title || ''}
                        onChange={(e) => updateSelectedSectionData('title', e.target.value)}
                      />
                    </div>
                    <div>
                      <span className="field-label">Subtitle</span>
                      <input
                        type="text"
                        className="studio-input"
                        value={selectedSection.data?.subtitle || ''}
                        onChange={(e) => updateSelectedSectionData('subtitle', e.target.value)}
                      />
                    </div>
                  </>
                )}

                {selectedSection.type === 'TRUST_BADGES' && (
                  <div className="inspector-hint-box">
                    <ShieldCheck size={16} color={accentColor} />
                    <span>The trust badges strip presents 4 verified guarantees on your storefront.</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </aside>

        {/* CENTER STUDIO CANVAS (INTERACTIVE LIVE PREVIEW) */}
        <main className="studio-canvas-area">
          <div className={`canvas-viewport-frame device-${previewDevice}`}>
            {/* Tablet/Mobile Device Frame Embellishments */}
            {previewDevice === 'mobile' && (
              <div className="phone-notch-bar">
                <span className="dynamic-island" />
              </div>
            )}

            {/* LIVE STORE EMBEDDED RENDERER */}
            <div
              className="clean-storefront-wrapper canvas-store-wrapper"
              style={{
                '--store-primary': primaryColor,
                '--store-accent': accentColor,
                '--store-bg': bgColor,
                '--store-card': cardColor,
                '--store-text-main': textColor
              }}
            >
              {/* Announcement Bar */}
              {config.announcement?.enabled !== false && config.announcement?.text && (
                <div className="clean-announcement-strip" style={{ background: primaryColor }}>
                  <Sparkles size={13} />
                  <span>{config.announcement.text}</span>
                </div>
              )}

              {/* Storefront Header */}
              <header className="clean-store-header">
                <div className="clean-header-container">
                  <div className="clean-brand-section">
                    <div className="clean-brand-avatar" style={{ background: config.branding?.logoUrl ? 'transparent' : primaryColor }}>
                      {config.branding?.logoUrl ? (
                        <img src={config.branding.logoUrl} alt="Store" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '12px' }} />
                      ) : (
                        <Store size={22} />
                      )}
                    </div>
                    <div>
                      <h1 className="clean-store-title">{config.branding?.storeName || 'My Online Store'}</h1>
                      <div className="clean-store-meta">
                        <span><MapPin size={12} /> {config.contact?.address || 'Retail Center, Commercial St'}</span>
                        <span><Phone size={12} /> {config.contact?.phone || 'Direct Support'}</span>
                      </div>
                    </div>
                  </div>

                  <nav className="clean-nav-menu">
                    {(config.navbar?.navLinks || DEFAULT_NAV_LINKS).filter((l) => l.enabled !== false).map((l) => (
                      <span key={l.id || l.label} className="clean-nav-link">{l.label}</span>
                    ))}
                  </nav>

                  <div className="clean-header-actions">
                    <button type="button" className="btn-clean-cart">
                      <ShoppingBag size={18} />
                      <span>Bag</span>
                      <span className="clean-cart-pill">0</span>
                    </button>
                  </div>
                </div>
              </header>

              {/* DYNAMIC MODULAR SECTIONS ON CANVAS */}
              <div className="canvas-sections-container">
                {config.sections.map((sec, idx) => {
                  const sData = sec.data || {};
                  const isSelected = selectedSection?.id === sec.id;
                  const isHidden = sec.enabled === false;

                  return (
                    <div
                      key={sec.id || idx}
                      onClick={() => {
                        setSelectedSectionId(sec.id);
                        setActiveTab('inspector');
                      }}
                      className={`canvas-section-wrapper ${isSelected ? 'selected-on-canvas' : ''} ${isHidden ? 'hidden-on-canvas' : ''}`}
                    >
                      {/* Floating Studio Section Toolbar */}
                      <div className="studio-canvas-floating-toolbar" onClick={(e) => e.stopPropagation()}>
                        <div className="floating-badge">
                          <GripVertical size={13} className="floating-drag-icon" />
                          <span>{sec.type}</span>
                        </div>
                        <div className="floating-actions">
                          <button
                            type="button"
                            onClick={() => moveSection(idx, 'up')}
                            disabled={idx === 0}
                            title="Move Section Up"
                          >
                            <ArrowUp size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveSection(idx, 'down')}
                            disabled={idx === config.sections.length - 1}
                            title="Move Section Down"
                          >
                            <ArrowDown size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSectionId(sec.id);
                              setActiveTab('inspector');
                            }}
                            title="Configure Settings"
                          >
                            <Settings size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => duplicateSection(idx)}
                            title="Clone Section"
                          >
                            <CopyPlus size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteSection(idx)}
                            className="btn-del"
                            title="Delete Section"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      {/* RENDER DYNAMIC SECTION BODY ON CANVAS */}
                      {sec.type === 'HERO_BANNER' && (
                        <section
                          className="clean-hero-fullscreen"
                          style={{
                            backgroundImage: sData.imageUrl
                              ? `linear-gradient(rgba(15, 23, 42, 0.72), rgba(15, 23, 42, 0.88)), url('${sData.imageUrl}')`
                              : `linear-gradient(135deg, ${primaryColor}22 0%, #0f172a 100%)`
                          }}
                        >
                          <div className="clean-hero-content-wrapper">
                            {sData.badge && (
                              <div className="clean-hero-badge-pill" style={{ color: '#34d399' }}>
                                <span className="badge-bullet" />
                                {sData.badge}
                              </div>
                            )}
                            <h2 className="clean-hero-giant-title">{sData.title || 'Welcome to Our Store'}</h2>
                            <p className="clean-hero-description">{sData.subtitle || 'Fresh catalog items verified in stock'}</p>
                            <div className="clean-hero-actions-row">
                              <button type="button" className="btn-hero-primary" style={{ background: primaryColor }}>
                                {sData.ctaText || 'Explore Catalog'} <ArrowRight size={17} />
                              </button>
                            </div>
                          </div>
                        </section>
                      )}

                      {sec.type === 'FLASH_SALE' && (
                        <section className="clean-flashsale-banner" style={{ borderLeft: `4px solid ${primaryColor}` }}>
                          <div className="clean-flashsale-content">
                            <div className="clean-flashsale-info">
                              <div className="clean-urgency-pill">
                                <Flame size={14} color="#ef4444" />
                                <span>{sData.badge || 'FLASH DEAL'}</span>
                                <span className="dot-divider">•</span>
                                <span>{sData.endsIn || 'Ends Soon'}</span>
                              </div>
                              <h3>{sData.title || 'Special Weekend Flash Sale'}</h3>
                              <p>{sData.subtitle || 'Grab exclusive direct discounts on catalog products'}</p>
                              {sData.discountText && (
                                <div className="clean-flashsale-tag">
                                  <Tag size={13} /> {sData.discountText}
                                </div>
                              )}
                            </div>
                            <div className="clean-flashsale-action-box">
                              <div className="clean-countdown-display">
                                <div className="countdown-unit">
                                  <span className="countdown-num">02</span>
                                  <span className="countdown-lbl">Days</span>
                                </div>
                                <span className="countdown-colon">:</span>
                                <div className="countdown-unit">
                                  <span className="countdown-num">14</span>
                                  <span className="countdown-lbl">Hours</span>
                                </div>
                                <span className="countdown-colon">:</span>
                                <div className="countdown-unit">
                                  <span className="countdown-num">35</span>
                                  <span className="countdown-lbl">Mins</span>
                                </div>
                                <span className="countdown-colon">:</span>
                                <div className="countdown-unit">
                                  <span className="countdown-num">48</span>
                                  <span className="countdown-lbl">Secs</span>
                                </div>
                              </div>
                              <button type="button" className="btn-flashsale-cta" style={{ background: primaryColor }}>
                                <Zap size={15} /> <span>{sData.ctaText || 'Shop Deals Now'}</span>
                              </button>
                            </div>
                          </div>
                        </section>
                      )}

                      {sec.type === 'TRUST_BADGES' && (
                        <section className="clean-trust-strip-section" style={{ background: cardColor }}>
                          <div className="clean-trust-strip-container">
                            {(sData.badges || [
                              { title: 'Express Dispatch', desc: 'Fast doorstep delivery' },
                              { title: '100% Genuine', desc: 'Verified authorized stock' },
                              { title: 'Flexible Payments', desc: 'UPI, Card & COD' },
                              { title: 'Store Support', desc: 'Instant WhatsApp assistance' }
                            ]).map((badge, bIdx) => (
                              <div key={bIdx} className="clean-trust-item">
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

                      {sec.type === 'PRODUCT_GRID' && (
                        <main className="clean-store-main">
                          <div className="clean-section-header-row">
                            <div>
                              <h2 className="clean-section-title">{sData.title || 'Featured Catalog'}</h2>
                              <p className="clean-section-subtitle">{sData.subtitle || 'Browse real-time store inventory'}</p>
                            </div>
                            <div className="clean-sort-wrapper">
                              <span className="clean-sort-label">Sort:</span>
                              <div className="custom-dropdown-container">
                                <button type="button" className="custom-sort-trigger">
                                  <SlidersHorizontal size={14} className="sort-icon-prefix" />
                                  <span className="sort-trigger-text">Featured</span>
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="clean-controls-bar">
                            {sData.showSearch !== false && (
                              <div className="clean-search-input-wrap">
                                <Search size={16} className="clean-search-icon" />
                                <input
                                  type="text"
                                  placeholder="Search live store products..."
                                  value={builderProductSearch}
                                  onChange={(e) => setBuilderProductSearch(e.target.value)}
                                />
                              </div>
                            )}
                            {sData.showCategories !== false && (
                              <div className="clean-category-chips">
                                <button
                                  type="button"
                                  onClick={() => setSelectedSimCategory('ALL')}
                                  className={`clean-chip ${selectedSimCategory === 'ALL' ? 'active' : ''}`}
                                  style={selectedSimCategory === 'ALL' ? { background: primaryColor } : {}}
                                >
                                  All Items ({tenantProducts.length})
                                </button>
                                {catalogCategories.map((c) => (
                                  <button
                                    key={c}
                                    type="button"
                                    onClick={() => setSelectedSimCategory(c)}
                                    className={`clean-chip ${selectedSimCategory === c ? 'active' : ''}`}
                                    style={selectedSimCategory === c ? { background: primaryColor } : {}}
                                  >
                                    {c}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Grid items */}
                          <div className="clean-product-grid">
                            {(tenantProducts.length > 0 ? tenantProducts : [
                              { id: 1, name: 'Sample Premium Product', selling_price: '499', inStock: true },
                              { id: 2, name: 'Sample Classic Item', selling_price: '899', inStock: true },
                              { id: 3, name: 'Sample Special Edition', selling_price: '1299', inStock: true }
                            ])
                              .filter((p) => {
                                const matchSearch = !builderProductSearch || p.name.toLowerCase().includes(builderProductSearch.toLowerCase());
                                const matchCat = selectedSimCategory === 'ALL' || (p.category?.name === selectedSimCategory);
                                return matchSearch && matchCat;
                              })
                              .slice(0, 6)
                              .map((prod) => (
                                <div key={prod.id} className="clean-product-card">
                                  <div className="clean-card-image-wrap">
                                    {prod.image_url ? (
                                      <img src={prod.image_url} alt={prod.name} className="clean-product-img" />
                                    ) : (
                                      <div className="clean-no-image">
                                        <Package size={36} />
                                      </div>
                                    )}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenEditProduct(prod);
                                      }}
                                      className="btn-card-quick-edit"
                                      title="Edit Product Image & Price"
                                    >
                                      <Settings size={12} /> Edit Photo
                                    </button>
                                  </div>
                                  <div className="clean-card-body">
                                    <div className="clean-card-info">
                                      <span className="clean-sku">{prod.product_code || `PRD-${prod.id}`}</span>
                                      <h3 className="clean-product-name">{prod.name}</h3>
                                    </div>
                                    <div className="clean-card-footer">
                                      <div className="clean-price-box">
                                        <span className="clean-price">₹{parseFloat(prod.selling_price || 0).toLocaleString('en-IN')}</span>
                                        <span className="clean-tax-hint">incl. GST</span>
                                      </div>
                                      <button type="button" className="clean-btn-add" style={{ background: primaryColor }}>
                                        <Plus size={14} /> Add
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </main>
                      )}

                      {sec.type === 'PRODUCT_CAROUSEL' && (
                        <section className="clean-carousel-section">
                          <div className="clean-carousel-container">
                            <div className="clean-carousel-header-row">
                              <div>
                                <div className="clean-pill-tag" style={{ color: accentColor }}>
                                  <Sparkles size={13} /> Curated Picks
                                </div>
                                <h2 className="clean-section-title">{sData.title || 'Trending Highlights'}</h2>
                                <p className="clean-section-subtitle">{sData.subtitle || 'Top-selling picks delivered directly'}</p>
                              </div>
                              <div className="clean-carousel-controls">
                                <button type="button" className="btn-carousel-nav"><ChevronLeft size={18} /></button>
                                <button type="button" className="btn-carousel-nav"><ChevronRight size={18} /></button>
                              </div>
                            </div>
                            <div className="clean-carousel-track-container">
                              <div className="clean-carousel-track">
                                {(tenantProducts.length > 0 ? tenantProducts.slice(0, 4) : [
                                  { id: 1, name: 'Curated Highlight A', selling_price: '599' },
                                  { id: 2, name: 'Curated Highlight B', selling_price: '899' },
                                  { id: 3, name: 'Curated Highlight C', selling_price: '1199' }
                                ]).map((prod) => (
                                  <div key={prod.id} className="clean-carousel-card">
                                    <div className="clean-card-image-wrap">
                                      {prod.image_url ? (
                                        <img src={prod.image_url} alt={prod.name} className="clean-product-img" />
                                      ) : (
                                        <div className="clean-no-image"><Package size={32} /></div>
                                      )}
                                    </div>
                                    <div className="clean-card-body">
                                      <h4 className="clean-product-name">{prod.name}</h4>
                                      <div className="clean-card-footer" style={{ marginTop: '0.5rem' }}>
                                        <span className="clean-price">₹{parseFloat(prod.selling_price || 0).toLocaleString('en-IN')}</span>
                                        <button type="button" className="clean-btn-add" style={{ background: primaryColor }}>
                                          <Plus size={13} /> Add
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </section>
                      )}

                      {sec.type === 'CATEGORY_TILES' && (
                        <section className="clean-categories-tiles-section">
                          <div className="clean-categories-tiles-container">
                            <div className="clean-categories-header">
                              <h2 className="clean-section-title">{sData.title || 'Explore by Category'}</h2>
                              <p className="clean-section-subtitle">{sData.subtitle || 'Find what you need with quick category filters'}</p>
                            </div>
                            <div className="clean-category-tiles-grid">
                              {(catalogCategories.length > 0 ? catalogCategories : ['Fashion', 'Electronics', 'Kitchen', 'Wellness']).map((c, cIdx) => (
                                <div key={cIdx} className="clean-category-tile-card">
                                  <div className="category-tile-icon" style={{ background: `${primaryColor}15`, color: primaryColor }}>
                                    <Layers size={22} />
                                  </div>
                                  <h4>{c}</h4>
                                  <span className="category-tile-badge">View Collection &rarr;</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </section>
                      )}

                      {sec.type === 'BRAND_STORY' && (
                        <section className="clean-story-section">
                          <div className="clean-story-container">
                            <div className="clean-story-grid">
                              <div className="clean-story-media-wrap">
                                <img src={sData.imageUrl || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80'} alt="Story" />
                                <div className="clean-story-badge-floating" style={{ background: primaryColor }}>
                                  <span>100% Verified Origin</span>
                                </div>
                              </div>
                              <div className="clean-story-content">
                                <div className="clean-pill-tag" style={{ color: primaryColor }}>{sData.badge || 'OUR HERITAGE'}</div>
                                <h2>{sData.title || 'Crafted with Passion & Precision'}</h2>
                                <p className="clean-story-body-text">{sData.narrative || 'Authenticated products direct to your doorstep.'}</p>
                                <div className="clean-story-points">
                                  <div className="clean-story-point-item">
                                    <CheckCircle2 size={18} color={accentColor} />
                                    <div><strong>Direct Sourcing</strong><span>Zero intermediaries</span></div>
                                  </div>
                                  <div className="clean-story-point-item">
                                    <CheckCircle2 size={18} color={accentColor} />
                                    <div><strong>Rapid Dispatch</strong><span>Same-day tracking updates</span></div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </section>
                      )}

                      {sec.type === 'IMAGE_LOOKBOOK' && (
                        <section className="clean-lookbook-section">
                          <div className="clean-lookbook-container">
                            <div className="clean-lookbook-header">
                              <h2 className="clean-section-title">{sData.title || 'Visual Lookbook'}</h2>
                              <p className="clean-section-subtitle">{sData.subtitle || 'Step inside our store atmosphere'}</p>
                            </div>
                            <div className="clean-lookbook-grid">
                              {(sData.items || [
                                { imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&q=80', caption: 'Flagship Store' },
                                { imageUrl: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=600&q=80', caption: 'Handcrafted Quality' },
                                { imageUrl: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&w=600&q=80', caption: 'Latest Arrivals' }
                              ]).map((item, lIdx) => (
                                <div key={lIdx} className="clean-lookbook-item">
                                  <img src={item.imageUrl} alt={item.caption || `Look ${lIdx + 1}`} />
                                  <div className="clean-lookbook-overlay"><span>{item.caption}</span></div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </section>
                      )}

                      {sec.type === 'TESTIMONIALS' && (
                        <section className="clean-testimonials-section">
                          <div className="clean-testimonials-container">
                            <div className="clean-section-header-carousel">
                              <div>
                                <div className="clean-pill-tag" style={{ color: accentColor }}>Verified Buyer Feedback</div>
                                <h2 className="clean-section-title">{sData.title || 'Customer Reviews'}</h2>
                                <p className="clean-section-subtitle">{sData.subtitle || 'Real feedback from direct buyers'}</p>
                              </div>
                            </div>
                            <div className="clean-reviews-grid-3">
                              {(sData.reviews || [
                                { name: 'Priya Sharma', comment: 'Outstanding quality and fast delivery!', rating: 5, location: 'Chennai' },
                                { name: 'Rajesh Kumar', comment: 'Authentic items, prompt WhatsApp updates.', rating: 5, location: 'Bengaluru' },
                                { name: 'Sneha Patel', comment: 'Great pricing and prompt support!', rating: 5, location: 'Mumbai' }
                              ]).slice(0, 3).map((rev, rIdx) => (
                                <div key={rIdx} className="clean-review-card">
                                  <div className="clean-review-stars">
                                    {[...Array(rev.rating || 5)].map((_, s) => (
                                      <Star key={s} size={15} fill="#f59e0b" color="#f59e0b" />
                                    ))}
                                  </div>
                                  <p className="clean-review-comment">"{rev.comment}"</p>
                                  <div className="clean-reviewer-meta">
                                    <div className="clean-reviewer-avatar" style={{ background: primaryColor }}>
                                      {rev.name ? rev.name.charAt(0) : 'U'}
                                    </div>
                                    <div>
                                      <strong>{rev.name}</strong>
                                      <span>{rev.location || 'Verified Buyer'}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </section>
                      )}

                      {sec.type === 'FAQ_ACCORDION' && (
                        <section className="clean-faq-section">
                          <div className="clean-faq-container">
                            <div className="clean-faq-header">
                              <div className="clean-pill-tag" style={{ color: primaryColor }}><HelpCircle size={13} /> Q&A</div>
                              <h2 className="clean-section-title">{sData.title || 'Frequently Asked Questions'}</h2>
                              <p className="clean-section-subtitle">{sData.subtitle || 'Everything you need to know'}</p>
                            </div>
                            <div className="clean-faq-list">
                              {(sData.faqs || [
                                { q: 'How long does delivery take?', a: 'Standard deliveries are dispatched within 24 hours.' },
                                { q: 'What payment methods do you accept?', a: 'UPI, Credit/Debit cards & Cash on Delivery.' }
                              ]).map((item, qIdx) => (
                                <div key={qIdx} className="clean-faq-item active">
                                  <button type="button" className="clean-faq-question-btn">
                                    <span>{item.q}</span>
                                    <ChevronUp size={18} />
                                  </button>
                                  <div className="clean-faq-answer"><p>{item.a}</p></div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </section>
                      )}

                      {sec.type === 'NEWSLETTER_BAR' && (
                        <section className="clean-newsletter-bar-section">
                          <div className="clean-newsletter-card" style={{ borderLeft: `4px solid ${primaryColor}` }}>
                            <div className="clean-newsletter-info">
                              <div className="clean-pill-tag" style={{ color: accentColor }}><Sparkles size={13} /> Exclusive Offer</div>
                              <h3>{sData.title || 'Unlock 10% Off Your Next Purchase'}</h3>
                              <p>{sData.subtitle || 'Use this special code during checkout'}</p>
                            </div>
                            <div className="clean-coupon-pill-wrap">
                              <div className="clean-coupon-pill">
                                <Tag size={15} />
                                <span>{sData.couponCode || 'FIRST10'}</span>
                                <span className="copy-label">Code</span>
                              </div>
                            </div>
                          </div>
                        </section>
                      )}

                      {sec.type === 'CONTACT_MAP' && (
                        <section className="clean-contact-map-section" style={{ background: cardColor }}>
                          <div className="clean-contact-card-container">
                            <div className="clean-contact-header">
                              <h2 className="clean-section-title">{sData.title || 'Visit Our Store & Contact'}</h2>
                              <p className="clean-section-subtitle">{sData.subtitle || 'Reach out directly for inquiries or orders'}</p>
                            </div>
                            <div className="clean-contact-grid-modern">
                              <div className="clean-contact-info-card">
                                <div className="clean-contact-icon-box" style={{ background: `${primaryColor}15`, color: primaryColor }}><MapPin size={20} /></div>
                                <div><h4>Store Address</h4><p>{config.contact?.address || 'Commercial Center, Main St'}</p></div>
                              </div>
                              <div className="clean-contact-info-card">
                                <div className="clean-contact-icon-box" style={{ background: `${primaryColor}15`, color: primaryColor }}><Clock size={20} /></div>
                                <div><h4>Operating Hours</h4><p>{config.contact?.hours || 'Mon - Sat: 9:00 AM - 9:00 PM'}</p></div>
                              </div>
                              <div className="clean-contact-info-card">
                                <div className="clean-contact-icon-box" style={{ background: `${primaryColor}15`, color: primaryColor }}><Phone size={20} /></div>
                                <div><h4>Direct Line</h4><p>{config.contact?.phone || 'Direct Support'}</p></div>
                              </div>
                            </div>
                          </div>
                        </section>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Store Footer */}
              <footer className="clean-store-footer-section">
                <div className="clean-footer-container">
                  <div className="clean-footer-bottom-bar">
                    <p>© {new Date().getFullYear()} {config.branding?.storeName || 'Store'}. All rights reserved.</p>
                    <p className="clean-powered-tag">Powered by <strong>StockPilot IMS</strong></p>
                  </div>
                </div>
              </footer>
            </div>

            {/* Mobile Home Bar Embellishment */}
            {previewDevice === 'mobile' && (
              <div className="phone-home-indicator-bar">
                <span className="home-line" />
              </div>
            )}
          </div>
        </main>
      </div>

      {/* 3. 1-CLICK INDUSTRY TEMPLATES MODAL */}
      {isTemplateModalOpen && (
        <Modal
          isOpen={isTemplateModalOpen}
          onClose={() => setIsTemplateModalOpen(false)}
          title="Choose a 1-Click Storefront Template"
        >
          <div className="templates-modal-content">
            <p className="templates-modal-subtitle">
              Select an industry template to automatically apply tailored layouts, color themes, and modular blocks.
            </p>
            <div className="templates-selection-grid">
              {INDUSTRY_TEMPLATES.map((tmpl) => {
                const IconComp = tmpl.icon;
                return (
                  <div key={tmpl.id} className="template-card-choice" onClick={() => handleApplyTemplate(tmpl.id)}>
                    <div className="template-card-top">
                      <div className="template-icon-circle">
                        <IconComp size={22} color="#982A86" />
                      </div>
                      <span className="template-pill-badge">{tmpl.sections.length} Blocks</span>
                    </div>
                    <h4>{tmpl.name}</h4>
                    <p>{tmpl.tagline}</p>
                    <div className="template-blocks-chips">
                      {tmpl.sections.slice(0, 4).map((s) => (
                        <span key={s} className="mini-block-chip">{s.replace('_', ' ')}</span>
                      ))}
                      {tmpl.sections.length > 4 && <span className="mini-block-chip">+{tmpl.sections.length - 4} more</span>}
                    </div>
                    <button type="button" className="btn-apply-template">
                      Apply This Template &rarr;
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </Modal>
      )}

      {/* 4. PRODUCT QUICK-EDIT MODAL (IMAGE & PRICING) */}
      {isEditProductModalOpen && (
        <Modal
          isOpen={isEditProductModalOpen}
          onClose={() => setIsEditProductModalOpen(false)}
          title={`Edit Product: ${editingProduct?.name || ''}`}
        >
          <form onSubmit={handleSaveProductEdit} className="product-quick-edit-form">
            <div className="form-group">
              <label>Product Name</label>
              <input
                type="text"
                required
                className="form-control"
                value={productEditForm.name}
                onChange={(e) => setProductEditForm({ ...productEditForm, name: e.target.value })}
              />
            </div>
            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label>Selling Price (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  className="form-control"
                  value={productEditForm.sellingPrice}
                  onChange={(e) => setProductEditForm({ ...productEditForm, sellingPrice: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>GST Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-control"
                  value={productEditForm.taxRate}
                  onChange={(e) => setProductEditForm({ ...productEditForm, taxRate: e.target.value })}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Direct Image URL</label>
              <input
                type="url"
                className="form-control"
                placeholder="https://images.unsplash.com/photo-..."
                value={productEditForm.imageUrl}
                onChange={(e) => setProductEditForm({ ...productEditForm, imageUrl: e.target.value })}
              />
              <span className="field-hint">Paste an image URL from Unsplash or your CDN to display on the storefront.</span>
            </div>
            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
              <button
                type="button"
                onClick={() => setIsEditProductModalOpen(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingProduct}
                className="btn btn-primary"
                style={{ background: '#982A86', borderColor: '#982A86' }}
              >
                {isSavingProduct ? 'Saving...' : 'Save Product'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
