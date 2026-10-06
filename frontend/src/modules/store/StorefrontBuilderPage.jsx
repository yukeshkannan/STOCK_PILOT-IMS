import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import api from '../../services/api';
import { toast } from 'react-toastify';
import {
  Store,
  Palette,
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
  SlidersHorizontal,
  X,
  RefreshCw,
  Image as ImageIcon
} from 'lucide-react';
import Modal from '../../components/Modal';
import { WhatsAppBrandIcon } from './PublicStorePage';
import './StorefrontBuilderPage.css';

// 6 Curated Theme Palettes matching StockPilot Platform
export const THEME_PRESETS = [
  {
    id: 'CLEAN_LIGHT',
    name: 'StockPilot Signature',
    description: 'Signature Knack Berry Plum (#982A86) with crisp white surfaces',
    primary: '#982A86',
    accent: '#10b981',
    bg: '#ffffff',
    card: '#ffffff',
    text: '#0f172a'
  },
  {
    id: 'MINIMAL_WHITE',
    name: 'Minimalist Slate',
    description: 'Neutral monochrome for boutique fashion & curated lifestyle stores',
    primary: '#0f172a',
    accent: '#2563eb',
    bg: '#f8fafc',
    card: '#ffffff',
    text: '#09090b'
  },
  {
    id: 'ROYAL_INDIGO',
    name: 'Royal Indigo',
    description: 'Deep royal blue & cyan for corporate brands, gadgets & B2B retail',
    primary: '#4f46e5',
    accent: '#06b6d4',
    bg: '#f8fafc',
    card: '#ffffff',
    text: '#0f172a'
  },
  {
    id: 'VIBRANT_RETAIL',
    name: 'Vibrant Retail',
    description: 'High-energy crimson & amber for supermarkets, marts & groceries',
    primary: '#e11d48',
    accent: '#f59e0b',
    bg: '#ffffff',
    card: '#ffffff',
    text: '#18181b'
  },
  {
    id: 'EMERALD_NATURE',
    name: 'Emerald Organic',
    description: 'Fresh botanical greens for wellness, beauty & natural organics',
    primary: '#059669',
    accent: '#10b981',
    bg: '#f0fdf4',
    card: '#ffffff',
    text: '#064e3b'
  },
  {
    id: 'MODERN_DARK',
    name: 'Midnight Dark',
    description: 'Modern luxury dark aesthetic for electronics, gaming & watches',
    primary: '#982A86',
    accent: '#10b981',
    bg: '#0f172a',
    card: '#1e293b',
    text: '#f8fafc'
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
    description: 'Cinematic hero banner with title, description, CTA button, and background image overlay.',
    defaultData: {
      badge: 'Official Online Store',
      title: 'Welcome to Our Online Store',
      subtitle: 'Shop the freshest arrivals, exclusive offers, and verified products delivered quickly.',
      ctaText: 'Explore Catalog',
      imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=80'
    }
  },
  {
    type: 'FLASH_SALE',
    name: 'Flash Sale Countdown',
    category: 'Promotions',
    icon: Flame,
    badgeText: 'High Converting',
    description: 'Urgency countdown banner with days, hours, mins, secs countdown and promo discount tag.',
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
    type: 'PRODUCT_GRID',
    name: 'Product Catalog Grid',
    category: 'Catalog & Store',
    icon: Package,
    badgeText: 'Core',
    description: 'Complete catalog with real-time stock, category filter chips, search bar & GST calculation.',
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
    description: 'Smooth horizontal scrolling slider showcasing trending, featured, or new arrivals.',
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
    description: 'Visual category cards with direct category collection filtering on click.',
    defaultData: {
      title: 'Explore by Category',
      subtitle: 'Find exactly what you need with quick category filters'
    }
  },
  {
    type: 'TRUST_BADGES',
    name: 'Value Proposition Strip',
    category: 'Trust & Proof',
    icon: ShieldCheck,
    badgeText: 'Assurance',
    description: '4-column value strip with icons (Express Dispatch, 100% Genuine, Flexible Payments, WhatsApp).',
    defaultData: {
      badges: [
        { icon: 'Zap', title: 'Express Dispatch', desc: 'Fast doorstep delivery' },
        { icon: 'ShieldCheck', title: '100% Genuine', desc: 'Verified from authorized stock' },
        { icon: 'CreditCard', title: 'Flexible Payments', desc: 'UPI, Card & COD' },
        { icon: 'Phone', title: 'Direct Store Support', desc: 'Instant WhatsApp assistance' }
      ]
    }
  },
  {
    type: 'BRAND_STORY',
    name: 'Brand Story Narrative',
    category: 'About & Branding',
    icon: FileText,
    badgeText: 'Story',
    description: 'Split 2-column image + narrative story showcasing your business mission and credibility.',
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

  // Studio Workbench Tabs: 'layers' | 'add' | 'theme' | 'inspector'
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
        id: 'sec-flash',
        type: 'FLASH_SALE',
        enabled: true,
        data: {
          badge: 'FLASH DEAL',
          endsIn: 'Limited Weekend Promo',
          title: 'Super Saver Weekend Deals',
          subtitle: 'Exclusive direct discounts on handpicked catalog products. Don’t miss out!',
          discountText: 'UP TO 40% OFF',
          ctaText: 'Shop Deals Now'
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

  // Update Selected Section Data (INSTANT REACTIVE DISPATCH)
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

  // Active Store Colors
  const primaryColor = config.branding?.primaryColor || '#982A86';
  const accentColor = config.branding?.accentColor || '#10b981';
  const bgColor = config.branding?.bgColor || '#ffffff';
  const cardColor = config.branding?.cardColor || '#ffffff';
  const textColor = config.branding?.textColor || '#0f172a';

  return (
    <div className="store-builder-integrated-page">
      {/* 1. STOCKPILOT STANDARD PAGE HEADER */}
      <div className="page-header store-builder-page-header">
        <div className="page-header-title-box">
          <div className="title-with-badge">
            <h1 className="page-title">Online Storefront Studio</h1>
            <span className="badge badge-success">
              <span className="live-pulsing-dot" /> Live Active
            </span>
          </div>
          <p className="page-subtitle">
            Visually customize, reorder with drag & drop, and publish your digital e-commerce store
          </p>
        </div>

        {/* Action Buttons styled with StockPilot Theme */}
        <div className="store-header-actions-row">
          <div className="device-switcher-pill">
            <button
              type="button"
              className={`device-btn ${previewDevice === 'desktop' ? 'active' : ''}`}
              onClick={() => setPreviewDevice('desktop')}
              title="Desktop Full Screen"
            >
              <Monitor size={14} /> <span>Desktop</span>
            </button>
            <button
              type="button"
              className={`device-btn ${previewDevice === 'tablet' ? 'active' : ''}`}
              onClick={() => setPreviewDevice('tablet')}
              title="Tablet (768px)"
            >
              <Tablet size={14} /> <span>Tablet</span>
            </button>
            <button
              type="button"
              className={`device-btn ${previewDevice === 'mobile' ? 'active' : ''}`}
              onClick={() => setPreviewDevice('mobile')}
              title="Mobile (390px)"
            >
              <Smartphone size={14} /> <span>Mobile</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsTemplateModalOpen(true)}
            className="btn btn-secondary btn-sm"
          >
            <Sparkles size={14} color="#982A86" /> <span>1-Click Templates</span>
          </button>

          <button
            type="button"
            onClick={handleCopyUrl}
            className="btn btn-secondary btn-sm"
            title="Copy Public Storefront Link"
          >
            {copiedUrl ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
            <span>{copiedUrl ? 'Copied' : 'Copy Link'}</span>
          </button>

          <a
            href={liveStoreUrl}
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary btn-sm"
            title="Open Live Public Storefront"
          >
            <ExternalLink size={14} /> <span>View Store</span>
          </a>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary btn-sm btn-publish-brand"
          >
            {saving ? (
              <>
                <RefreshCw size={14} className="spin" /> <span>Publishing...</span>
              </>
            ) : (
              <>
                <Zap size={14} /> <span>Publish Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. MAIN SPLIT WORKBENCH LAYOUT */}
      <div className="builder-workbench-layout">
        {/* LEFT STUDIO PANEL (SECTIONS, BLOCKS, THEME, INSPECTOR) */}
        <aside className="card builder-studio-panel">
          {/* Studio Tab Headers */}
          <div className="studio-tabs-header">
            <button
              type="button"
              className={`studio-tab-btn ${activeTab === 'layers' ? 'active' : ''}`}
              onClick={() => setActiveTab('layers')}
            >
              <Layers size={15} /> <span>Layers ({config.sections.length})</span>
            </button>
            <button
              type="button"
              className={`studio-tab-btn ${activeTab === 'add' ? 'active' : ''}`}
              onClick={() => setActiveTab('add')}
            >
              <Plus size={15} /> <span>Add Block</span>
            </button>
            <button
              type="button"
              className={`studio-tab-btn ${activeTab === 'theme' ? 'active' : ''}`}
              onClick={() => setActiveTab('theme')}
            >
              <Palette size={15} /> <span>Theme</span>
            </button>
            <button
              type="button"
              className={`studio-tab-btn ${activeTab === 'inspector' ? 'active' : ''}`}
              onClick={() => setActiveTab('inspector')}
            >
              <Settings size={15} /> <span>Inspector</span>
            </button>
          </div>

          {/* TAB 1: LAYERS & DRAG-AND-DROP REORDER */}
          {activeTab === 'layers' && (
            <div className="studio-tab-content">
              <div className="content-intro-strip">
                <div>
                  <h4 className="content-title">Page Layout Sequence</h4>
                  <p className="content-subtitle">Drag & drop handles or click arrows to reorder.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('add')}
                  className="btn btn-secondary btn-xs"
                >
                  <Plus size={13} /> Add Block
                </button>
              </div>

              <div className="layers-reorder-stack">
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
                      className={`layer-row-card ${isSelected ? 'selected' : ''} ${isHidden ? 'hidden-layer' : ''} ${
                        dragOverIndex === idx ? 'drag-target-line' : ''
                      }`}
                    >
                      <div className="layer-row-left">
                        <span className="drag-handle-grip" title="Drag to reorder" onClick={(e) => e.stopPropagation()}>
                          <GripVertical size={16} />
                        </span>
                        <div className="layer-block-icon" style={{ background: `${primaryColor}15`, color: primaryColor }}>
                          <IconComp size={15} />
                        </div>
                        <div className="layer-text-wrap">
                          <span className="layer-title">{def.name}</span>
                          <span className="layer-type">{sec.type}</span>
                        </div>
                      </div>

                      <div className="layer-row-actions" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => moveSection(idx, 'up')}
                          disabled={idx === 0}
                          className="btn-icon-action"
                          title="Move Up"
                        >
                          <ArrowUp size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveSection(idx, 'down')}
                          disabled={idx === config.sections.length - 1}
                          className="btn-icon-action"
                          title="Move Down"
                        >
                          <ArrowDown size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleSection(idx)}
                          className="btn-icon-action"
                          title={isHidden ? 'Show Section' : 'Hide Section'}
                        >
                          {isHidden ? <EyeOff size={14} color="#94a3b8" /> : <Eye size={14} color="#10b981" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => duplicateSection(idx)}
                          className="btn-icon-action"
                          title="Duplicate Section"
                        >
                          <CopyPlus size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteSection(idx)}
                          className="btn-icon-action delete"
                          title="Delete Section"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('add')}
                className="btn btn-secondary btn-block add-section-block-btn"
              >
                <Plus size={15} /> <span>Add New Modular Block</span>
              </button>
            </div>
          )}

          {/* TAB 2: ADD BLOCK LIBRARY (12 BLOCKS) */}
          {activeTab === 'add' && (
            <div className="studio-tab-content">
              <div className="content-intro-strip">
                <div>
                  <h4 className="content-title">Modular Blocks Catalog</h4>
                  <p className="content-subtitle">Click any block to insert it into your storefront.</p>
                </div>
              </div>

              <div className="block-library-catalog">
                {AVAILABLE_BLOCK_TYPES.map((block) => {
                  const IconComp = block.icon;
                  return (
                    <div key={block.type} className="block-catalog-item card">
                      <div className="block-item-top">
                        <div className="block-icon-circle" style={{ background: `${primaryColor}15`, color: primaryColor }}>
                          <IconComp size={18} />
                        </div>
                        <div className="block-tag-wrap">
                          <span className="badge badge-secondary">{block.category}</span>
                          <span className="badge badge-primary">{block.badgeText}</span>
                        </div>
                      </div>
                      <h5 className="block-title">{block.name}</h5>
                      <p className="block-description">{block.description}</p>
                      <button
                        type="button"
                        onClick={() => addBlockToPage(block.type)}
                        className="btn btn-primary btn-sm btn-add-to-page"
                      >
                        <Plus size={14} /> <span>Add to Page</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: THEME, COLORS & BRANDING */}
          {activeTab === 'theme' && (
            <div className="studio-tab-content">
              <div className="content-intro-strip">
                <div>
                  <h4 className="content-title">Theme & Color Tokens</h4>
                  <p className="content-subtitle">Live color palettes and brand identity.</p>
                </div>
              </div>

              {/* Theme Palettes */}
              <div className="form-group-section">
                <label className="section-label">Curated Color Palettes</label>
                <div className="palettes-selection-grid">
                  {THEME_PRESETS.map((preset) => (
                    <div
                      key={preset.id}
                      onClick={() => handleApplyPreset(preset)}
                      className={`palette-card ${config.theme === preset.id ? 'active' : ''}`}
                    >
                      <div className="palette-strip">
                        <span style={{ background: preset.primary }} />
                        <span style={{ background: preset.accent }} />
                        <span style={{ background: preset.bg }} />
                        <span style={{ background: preset.text }} />
                      </div>
                      <div className="palette-info">
                        <strong>{preset.name}</strong>
                        <span>{preset.description}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Color Pickers */}
              <div className="form-group-section">
                <label className="section-label">Custom Theme Accents</label>
                <div className="color-pickers-2col">
                  <div className="color-picker-box">
                    <span className="picker-lbl">Primary Brand</span>
                    <div className="picker-input-wrap">
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
                  <div className="color-picker-box">
                    <span className="picker-lbl">Accent Highlight</span>
                    <div className="picker-input-wrap">
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
                  <div className="color-picker-box">
                    <span className="picker-lbl">Background</span>
                    <div className="picker-input-wrap">
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
                  <div className="color-picker-box">
                    <span className="picker-lbl">Main Text</span>
                    <div className="picker-input-wrap">
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

              {/* Brand Identity */}
              <div className="form-group-section">
                <label className="section-label">Store Brand Information</label>
                <div className="form-stack-fields">
                  <div>
                    <label className="form-label">Storefront Name</label>
                    <input
                      type="text"
                      className="form-control"
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
                    <label className="form-label">Tagline Description</label>
                    <input
                      type="text"
                      className="form-control"
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
                    <label className="form-label">Logo Image URL</label>
                    <input
                      type="url"
                      className="form-control"
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
              <div className="form-group-section">
                <div className="toggle-heading-row">
                  <div>
                    <label className="section-label" style={{ margin: 0 }}>Top Announcement Bar</label>
                    <p className="field-hint">Sticky top notification strip across the storefront</p>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle-checkbox"
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
                    className="form-control"
                    style={{ marginTop: '0.5rem' }}
                    value={config.announcement?.text || ''}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        announcement: { ...prev.announcement, text: e.target.value }
                      }))
                    }
                    placeholder="E.g. Free express delivery on orders above ₹499"
                  />
                )}
              </div>
            </div>
          )}

          {/* TAB 4: SECTION INSPECTOR (SETTINGS FOR SELECTED SECTION) */}
          {activeTab === 'inspector' && selectedSection && (
            <div className="studio-tab-content">
              <div className="content-intro-strip">
                <div>
                  <span className="badge badge-primary">{selectedSection.type}</span>
                  <h4 className="content-title" style={{ marginTop: '0.2rem' }}>Configure Section</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('layers')}
                  className="btn btn-secondary btn-xs"
                >
                  &larr; Back to Layers
                </button>
              </div>

              <div className="inspector-form-body">
                {selectedSection.type === 'HERO_BANNER' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Badge Label</label>
                      <input
                        type="text"
                        className="form-control"
                        value={selectedSection.data?.badge || ''}
                        onChange={(e) => updateSelectedSectionData('badge', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Hero Headline</label>
                      <input
                        type="text"
                        className="form-control"
                        value={selectedSection.data?.title || ''}
                        onChange={(e) => updateSelectedSectionData('title', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Subtitle Description</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        value={selectedSection.data?.subtitle || ''}
                        onChange={(e) => updateSelectedSectionData('subtitle', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">CTA Button Text</label>
                      <input
                        type="text"
                        className="form-control"
                        value={selectedSection.data?.ctaText || ''}
                        onChange={(e) => updateSelectedSectionData('ctaText', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Hero Background Image URL</label>
                      <input
                        type="url"
                        className="form-control"
                        value={selectedSection.data?.imageUrl || ''}
                        onChange={(e) => updateSelectedSectionData('imageUrl', e.target.value)}
                      />
                    </div>
                  </>
                )}

                {selectedSection.type === 'FLASH_SALE' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Urgency Badge</label>
                      <input
                        type="text"
                        className="form-control"
                        value={selectedSection.data?.badge || ''}
                        onChange={(e) => updateSelectedSectionData('badge', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Ends In Label</label>
                      <input
                        type="text"
                        className="form-control"
                        value={selectedSection.data?.endsIn || ''}
                        onChange={(e) => updateSelectedSectionData('endsIn', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Flash Sale Headline</label>
                      <input
                        type="text"
                        className="form-control"
                        value={selectedSection.data?.title || ''}
                        onChange={(e) => updateSelectedSectionData('title', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Promo Subtitle</label>
                      <textarea
                        className="form-control"
                        rows={2}
                        value={selectedSection.data?.subtitle || ''}
                        onChange={(e) => updateSelectedSectionData('subtitle', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Discount Pill Tag</label>
                      <input
                        type="text"
                        className="form-control"
                        value={selectedSection.data?.discountText || ''}
                        onChange={(e) => updateSelectedSectionData('discountText', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">CTA Button Label</label>
                      <input
                        type="text"
                        className="form-control"
                        value={selectedSection.data?.ctaText || ''}
                        onChange={(e) => updateSelectedSectionData('ctaText', e.target.value)}
                      />
                    </div>
                  </>
                )}

                {selectedSection.type === 'PRODUCT_GRID' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Catalog Section Title</label>
                      <input
                        type="text"
                        className="form-control"
                        value={selectedSection.data?.title || ''}
                        onChange={(e) => updateSelectedSectionData('title', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Catalog Subtitle</label>
                      <input
                        type="text"
                        className="form-control"
                        value={selectedSection.data?.subtitle || ''}
                        onChange={(e) => updateSelectedSectionData('subtitle', e.target.value)}
                      />
                    </div>
                    <div className="toggle-heading-row" style={{ marginTop: '0.5rem' }}>
                      <span className="form-label" style={{ margin: 0 }}>Show Live Search Input</span>
                      <input
                        type="checkbox"
                        className="toggle-checkbox"
                        checked={selectedSection.data?.showSearch !== false}
                        onChange={(e) => updateSelectedSectionData('showSearch', e.target.checked)}
                      />
                    </div>
                    <div className="toggle-heading-row" style={{ marginTop: '0.5rem' }}>
                      <span className="form-label" style={{ margin: 0 }}>Show Category Chips</span>
                      <input
                        type="checkbox"
                        className="toggle-checkbox"
                        checked={selectedSection.data?.showCategories !== false}
                        onChange={(e) => updateSelectedSectionData('showCategories', e.target.checked)}
                      />
                    </div>
                    <div className="toggle-heading-row" style={{ marginTop: '0.5rem' }}>
                      <span className="form-label" style={{ margin: 0 }}>Show Real-time Stock Badge</span>
                      <input
                        type="checkbox"
                        className="toggle-checkbox"
                        checked={selectedSection.data?.showStockBadge !== false}
                        onChange={(e) => updateSelectedSectionData('showStockBadge', e.target.checked)}
                      />
                    </div>
                  </>
                )}

                {selectedSection.type === 'PRODUCT_CAROUSEL' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Carousel Headline</label>
                      <input
                        type="text"
                        className="form-control"
                        value={selectedSection.data?.title || ''}
                        onChange={(e) => updateSelectedSectionData('title', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Carousel Subtitle</label>
                      <input
                        type="text"
                        className="form-control"
                        value={selectedSection.data?.subtitle || ''}
                        onChange={(e) => updateSelectedSectionData('subtitle', e.target.value)}
                      />
                    </div>
                  </>
                )}

                {selectedSection.type === 'CATEGORY_TILES' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Section Title</label>
                      <input
                        type="text"
                        className="form-control"
                        value={selectedSection.data?.title || ''}
                        onChange={(e) => updateSelectedSectionData('title', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Section Subtitle</label>
                      <input
                        type="text"
                        className="form-control"
                        value={selectedSection.data?.subtitle || ''}
                        onChange={(e) => updateSelectedSectionData('subtitle', e.target.value)}
                      />
                    </div>
                  </>
                )}

                {selectedSection.type === 'BRAND_STORY' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Heritage Tag</label>
                      <input
                        type="text"
                        className="form-control"
                        value={selectedSection.data?.badge || ''}
                        onChange={(e) => updateSelectedSectionData('badge', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Story Headline</label>
                      <input
                        type="text"
                        className="form-control"
                        value={selectedSection.data?.title || ''}
                        onChange={(e) => updateSelectedSectionData('title', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Story Narrative</label>
                      <textarea
                        className="form-control"
                        rows={4}
                        value={selectedSection.data?.narrative || ''}
                        onChange={(e) => updateSelectedSectionData('narrative', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Story Image URL</label>
                      <input
                        type="url"
                        className="form-control"
                        value={selectedSection.data?.imageUrl || ''}
                        onChange={(e) => updateSelectedSectionData('imageUrl', e.target.value)}
                      />
                    </div>
                  </>
                )}

                {selectedSection.type === 'NEWSLETTER_BAR' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Coupon Code</label>
                      <input
                        type="text"
                        className="form-control"
                        value={selectedSection.data?.couponCode || ''}
                        onChange={(e) => updateSelectedSectionData('couponCode', e.target.value.toUpperCase())}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Offer Headline</label>
                      <input
                        type="text"
                        className="form-control"
                        value={selectedSection.data?.title || ''}
                        onChange={(e) => updateSelectedSectionData('title', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Offer Terms / Subtitle</label>
                      <input
                        type="text"
                        className="form-control"
                        value={selectedSection.data?.subtitle || ''}
                        onChange={(e) => updateSelectedSectionData('subtitle', e.target.value)}
                      />
                    </div>
                  </>
                )}

                {selectedSection.type === 'CONTACT_MAP' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Card Title</label>
                      <input
                        type="text"
                        className="form-control"
                        value={selectedSection.data?.title || ''}
                        onChange={(e) => updateSelectedSectionData('title', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Card Subtitle</label>
                      <input
                        type="text"
                        className="form-control"
                        value={selectedSection.data?.subtitle || ''}
                        onChange={(e) => updateSelectedSectionData('subtitle', e.target.value)}
                      />
                    </div>
                  </>
                )}

                {selectedSection.type === 'FAQ_ACCORDION' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">FAQ Title</label>
                      <input
                        type="text"
                        className="form-control"
                        value={selectedSection.data?.title || ''}
                        onChange={(e) => updateSelectedSectionData('title', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">FAQ Subtitle</label>
                      <input
                        type="text"
                        className="form-control"
                        value={selectedSection.data?.subtitle || ''}
                        onChange={(e) => updateSelectedSectionData('subtitle', e.target.value)}
                      />
                    </div>
                  </>
                )}

                {selectedSection.type === 'TESTIMONIALS' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Reviews Title</label>
                      <input
                        type="text"
                        className="form-control"
                        value={selectedSection.data?.title || ''}
                        onChange={(e) => updateSelectedSectionData('title', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Reviews Subtitle</label>
                      <input
                        type="text"
                        className="form-control"
                        value={selectedSection.data?.subtitle || ''}
                        onChange={(e) => updateSelectedSectionData('subtitle', e.target.value)}
                      />
                    </div>
                  </>
                )}

                {selectedSection.type === 'IMAGE_LOOKBOOK' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Lookbook Title</label>
                      <input
                        type="text"
                        className="form-control"
                        value={selectedSection.data?.title || ''}
                        onChange={(e) => updateSelectedSectionData('title', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Lookbook Subtitle</label>
                      <input
                        type="text"
                        className="form-control"
                        value={selectedSection.data?.subtitle || ''}
                        onChange={(e) => updateSelectedSectionData('subtitle', e.target.value)}
                      />
                    </div>
                  </>
                )}

                {selectedSection.type === 'TRUST_BADGES' && (
                  <div className="alert alert-info" style={{ fontSize: '0.8rem', padding: '0.75rem' }}>
                    <ShieldCheck size={16} /> <span>The trust badges strip shows 4 certified store guarantees.</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </aside>

        {/* RIGHT LIVE PREVIEW CANVAS */}
        <section className="card builder-canvas-stage">
          <div className="canvas-stage-top-meta">
            <span className="stage-device-badge">
              Preview Mode: <strong>{previewDevice.toUpperCase()}</strong>
            </span>
            <span className="stage-reactive-hint">
              ⚡ Live Synchronized Canvas • Click any section to configure
            </span>
          </div>

          <div className="canvas-scroll-viewport">
            <div className={`canvas-device-frame device-frame-${previewDevice}`}>
              {/* Phone Notch for Mobile View */}
              {previewDevice === 'mobile' && (
                <div className="device-phone-notch">
                  <span className="notch-pill" />
                </div>
              )}

              {/* RENDER STOREFRONT CANVAS */}
              <div
                className="clean-storefront-wrapper embedded-canvas-store"
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

                {/* Store Header */}
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

                {/* MODULAR SECTIONS STACK */}
                <div className="canvas-modular-stack">
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
                        className={`modular-canvas-block ${isSelected ? 'is-selected' : ''} ${isHidden ? 'is-hidden' : ''}`}
                      >
                        {/* Hover / Selected Floating Toolbar */}
                        <div className="canvas-block-floating-bar" onClick={(e) => e.stopPropagation()}>
                          <div className="floating-tag" style={{ color: primaryColor }}>
                            <GripVertical size={13} />
                            <span>{sec.type}</span>
                          </div>
                          <div className="floating-btns-group">
                            <button
                              type="button"
                              onClick={() => moveSection(idx, 'up')}
                              disabled={idx === 0}
                              title="Move Up"
                            >
                              <ArrowUp size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveSection(idx, 'down')}
                              disabled={idx === config.sections.length - 1}
                              title="Move Down"
                            >
                              <ArrowDown size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedSectionId(sec.id);
                                setActiveTab('inspector');
                              }}
                              title="Configure in Inspector"
                            >
                              <Settings size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => duplicateSection(idx)}
                              title="Duplicate"
                            >
                              <CopyPlus size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteSection(idx)}
                              className="del-btn"
                              title="Delete"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>

                        {/* SECTION BODY */}
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

              {/* Mobile Home Bar */}
              {previewDevice === 'mobile' && (
                <div className="device-phone-home-bar">
                  <span className="home-pill" />
                </div>
              )}
            </div>
          </div>
        </section>
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
              Select an industry template to automatically apply tailored modular layouts and matching color palettes.
            </p>
            <div className="templates-selection-grid">
              {INDUSTRY_TEMPLATES.map((tmpl) => {
                const IconComp = tmpl.icon;
                return (
                  <div key={tmpl.id} className="template-card-choice" onClick={() => handleApplyTemplate(tmpl.id)}>
                    <div className="template-card-top">
                      <div className="template-icon-circle">
                        <IconComp size={20} color="#982A86" />
                      </div>
                      <span className="badge badge-success">{tmpl.sections.length} Blocks</span>
                    </div>
                    <h4>{tmpl.name}</h4>
                    <p>{tmpl.tagline}</p>
                    <div className="template-blocks-chips">
                      {tmpl.sections.slice(0, 4).map((s) => (
                        <span key={s} className="badge badge-secondary">{s.replace('_', ' ')}</span>
                      ))}
                      {tmpl.sections.length > 4 && <span className="badge badge-secondary">+{tmpl.sections.length - 4} more</span>}
                    </div>
                    <button type="button" className="btn btn-primary btn-sm btn-block" style={{ marginTop: '0.6rem' }}>
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
              <label className="form-label">Product Name</label>
              <input
                type="text"
                required
                className="form-control"
                value={productEditForm.name}
                onChange={(e) => setProductEditForm({ ...productEditForm, name: e.target.value })}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Selling Price (₹)</label>
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
                <label className="form-label">GST Rate (%)</label>
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
              <label className="form-label">Direct Image URL</label>
              <input
                type="url"
                className="form-control"
                placeholder="https://images.unsplash.com/photo-..."
                value={productEditForm.imageUrl}
                onChange={(e) => setProductEditForm({ ...productEditForm, imageUrl: e.target.value })}
              />
              <span className="field-hint">Paste an image URL from Unsplash or CDN to display on the storefront.</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
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
              >
                {isSavingProduct ? 'Saving...' : 'Save Product Details'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
