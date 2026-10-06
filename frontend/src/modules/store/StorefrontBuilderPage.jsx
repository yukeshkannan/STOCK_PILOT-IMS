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
  Image as ImageIcon,
  Instagram,
  Facebook,
  Twitter,
  Globe,
  Mail
} from 'lucide-react';
import Modal from '../../components/Modal';
import { WhatsAppBrandIcon } from './PublicStorePage';
import './PublicStorePage.css';
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

export const DEFAULT_FOOTER = {
  enabled: true,
  brandBio: 'Direct digital storefront backed by verified central inventory with guaranteed genuine products, fast doorstep dispatch, and instant WhatsApp support.',
  copyrightText: 'All rights reserved.',
  showSocials: true,
  socials: {
    whatsapp: '',
    instagram: 'https://instagram.com',
    facebook: 'https://facebook.com',
    twitter: 'https://twitter.com'
  },
  col1Title: 'Quick Links',
  col1Links: [
    { id: 'fl-1', label: 'Home', url: '#home' },
    { id: 'fl-2', label: 'All Products', url: '#products' },
    { id: 'fl-3', label: 'Brand Story', url: '#about' },
    { id: 'fl-4', label: 'Customer Reviews', url: '#testimonials' }
  ],
  col2Title: 'Customer Care & Policies',
  col2Links: [
    { id: 'fl-5', label: 'Shipping & Delivery', url: '#faq' },
    { id: 'fl-6', label: 'Terms & Conditions', url: '#terms' },
    { id: 'fl-7', label: 'Returns & Refunds', url: '#returns' },
    { id: 'fl-8', label: 'Privacy Policy', url: '#privacy' }
  ],
  showPaymentBadges: true,
  paymentBadges: {
    upi: true,
    cards: true,
    netbanking: true,
    cod: true,
    genuine: true
  }
};

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
  const [insertAtIndex, setInsertAtIndex] = useState(null);

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
    },
    footer: DEFAULT_FOOTER
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

          const loadedFooter = loaded.footer || {};
          const mergedFooter = {
            ...DEFAULT_FOOTER,
            ...loadedFooter,
            socials: { ...DEFAULT_FOOTER.socials, ...(loadedFooter.socials || {}) },
            col1Links: Array.isArray(loadedFooter.col1Links) && loadedFooter.col1Links.length > 0 ? loadedFooter.col1Links : DEFAULT_FOOTER.col1Links,
            col2Links: Array.isArray(loadedFooter.col2Links) && loadedFooter.col2Links.length > 0 ? loadedFooter.col2Links : DEFAULT_FOOTER.col2Links,
            paymentBadges: { ...DEFAULT_FOOTER.paymentBadges, ...(loadedFooter.paymentBadges || {}) }
          };

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
            contact: { ...prev.contact, ...(loaded.contact || {}) },
            footer: mergedFooter
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
    if (selectedSectionId === 'HEADER_NAVBAR') {
      return {
        id: 'HEADER_NAVBAR',
        type: 'HEADER_NAVBAR',
        name: 'Store Header & Navigation'
      };
    }
    if (selectedSectionId === 'FOOTER_MASTER') {
      return {
        id: 'FOOTER_MASTER',
        type: 'FOOTER_MASTER',
        name: 'Store Footer & Legal Notice'
      };
    }
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

  // Add block from library (with support for between-section insertion)
  const addBlockToPage = (blockType) => {
    const def = AVAILABLE_BLOCK_TYPES.find((b) => b.type === blockType);
    if (!def) return;
    const newSec = {
      id: `sec-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type: blockType,
      enabled: true,
      data: JSON.parse(JSON.stringify(def.defaultData))
    };
    setConfig((prev) => {
      const updated = [...(prev.sections || [])];
      if (insertAtIndex !== null && insertAtIndex >= 0 && insertAtIndex <= updated.length) {
        updated.splice(insertAtIndex, 0, newSec);
      } else {
        updated.push(newSec);
      }
      return {
        ...prev,
        sections: updated
      };
    });
    setInsertAtIndex(null);
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

  // Helper dispatchers for Store Header, Branding, Announcement, Contact & Nav Links
  const updateBranding = (field, value) => {
    setConfig((prev) => ({
      ...prev,
      branding: {
        ...(prev.branding || {}),
        [field]: value
      }
    }));
  };

  const updateAnnouncement = (field, value) => {
    setConfig((prev) => ({
      ...prev,
      announcement: {
        ...(prev.announcement || {}),
        [field]: value
      }
    }));
  };

  const updateContact = (field, value) => {
    setConfig((prev) => ({
      ...prev,
      contact: {
        ...(prev.contact || {}),
        [field]: value
      }
    }));
  };

  const updateNavbarLink = (id, field, value) => {
    setConfig((prev) => {
      const currentLinks = prev.navbar?.navLinks || DEFAULT_NAV_LINKS;
      const updated = currentLinks.map((item) => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      });
      return {
        ...prev,
        navbar: {
          ...(prev.navbar || {}),
          navLinks: updated
        }
      };
    });
  };

  const addNavbarLink = () => {
    setConfig((prev) => {
      const currentLinks = prev.navbar?.navLinks || DEFAULT_NAV_LINKS;
      const newId = `nav-${Date.now()}`;
      const newLink = {
        id: newId,
        label: 'New Link',
        url: '#',
        enabled: true
      };
      return {
        ...prev,
        navbar: {
          ...(prev.navbar || {}),
          navLinks: [...currentLinks, newLink]
        }
      };
    });
    toast.success('Added new navigation menu link');
  };

  const deleteNavbarLink = (id) => {
    setConfig((prev) => {
      const currentLinks = prev.navbar?.navLinks || DEFAULT_NAV_LINKS;
      return {
        ...prev,
        navbar: {
          ...(prev.navbar || {}),
          navLinks: currentLinks.filter((item) => item.id !== id)
        }
      };
    });
    toast.info('Removed menu link');
  };

  // Helper dispatchers for Store Footer Master
  const updateFooter = (field, value) => {
    setConfig((prev) => ({
      ...prev,
      footer: {
        ...(prev.footer || DEFAULT_FOOTER),
        [field]: value
      }
    }));
  };

  const updateFooterSocial = (network, value) => {
    setConfig((prev) => ({
      ...prev,
      footer: {
        ...(prev.footer || DEFAULT_FOOTER),
        socials: {
          ...((prev.footer && prev.footer.socials) || DEFAULT_FOOTER.socials),
          [network]: value
        }
      }
    }));
  };

  const updateFooterPaymentBadge = (badgeKey, value) => {
    setConfig((prev) => ({
      ...prev,
      footer: {
        ...(prev.footer || DEFAULT_FOOTER),
        paymentBadges: {
          ...((prev.footer && prev.footer.paymentBadges) || DEFAULT_FOOTER.paymentBadges),
          [badgeKey]: value
        }
      }
    }));
  };

  const updateFooterLink = (col, linkId, field, value) => {
    setConfig((prev) => {
      const footer = prev.footer || DEFAULT_FOOTER;
      const key = col === 1 ? 'col1Links' : 'col2Links';
      const list = footer[key] || [];
      const updated = list.map((item) => (item.id === linkId ? { ...item, [field]: value } : item));
      return {
        ...prev,
        footer: {
          ...footer,
          [key]: updated
        }
      };
    });
  };

  const addFooterLink = (col) => {
    setConfig((prev) => {
      const footer = prev.footer || DEFAULT_FOOTER;
      const key = col === 1 ? 'col1Links' : 'col2Links';
      const list = footer[key] || [];
      const newLink = {
        id: `fl-${Date.now()}`,
        label: 'New Link',
        url: '#'
      };
      return {
        ...prev,
        footer: {
          ...footer,
          [key]: [...list, newLink]
        }
      };
    });
    toast.success(`Added link to Footer Column ${col}`);
  };

  const deleteFooterLink = (col, linkId) => {
    setConfig((prev) => {
      const footer = prev.footer || DEFAULT_FOOTER;
      const key = col === 1 ? 'col1Links' : 'col2Links';
      const list = footer[key] || [];
      return {
        ...prev,
        footer: {
          ...footer,
          [key]: list.filter((item) => item.id !== linkId)
        }
      };
    });
    toast.info('Footer link removed');
  };

  // Helper dispatchers for dynamic items in IMAGE_LOOKBOOK
  const addLookbookItem = () => {
    if (!selectedSection) return;
    const currentItems = selectedSection.data?.items || [
      { imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80', caption: 'Flagship Store' }
    ];
    const newItem = {
      imageUrl: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&w=800&q=80',
      caption: `Gallery Photo #${currentItems.length + 1}`
    };
    updateSelectedSectionData('items', [...currentItems, newItem]);
    toast.success('Added photo to lookbook');
  };

  const updateLookbookItem = (index, field, value) => {
    if (!selectedSection) return;
    const currentItems = [...(selectedSection.data?.items || [])];
    if (currentItems[index]) {
      currentItems[index] = { ...currentItems[index], [field]: value };
      updateSelectedSectionData('items', currentItems);
    }
  };

  const deleteLookbookItem = (index) => {
    if (!selectedSection) return;
    const currentItems = [...(selectedSection.data?.items || [])];
    if (currentItems.length <= 1) {
      toast.warning('Lookbook must have at least one photo.');
      return;
    }
    currentItems.splice(index, 1);
    updateSelectedSectionData('items', currentItems);
    toast.info('Photo removed from lookbook');
  };

  // Helper dispatchers for dynamic items in FAQ_ACCORDION
  const addFaqItem = () => {
    if (!selectedSection) return;
    const currentFaqs = selectedSection.data?.faqs || [];
    const newFaq = {
      q: 'New Question?',
      a: 'Add detailed answer here to assist your online customers.'
    };
    updateSelectedSectionData('faqs', [...currentFaqs, newFaq]);
    toast.success('Added question to FAQ list');
  };

  const updateFaqItem = (index, field, value) => {
    if (!selectedSection) return;
    const currentFaqs = [...(selectedSection.data?.faqs || [])];
    if (currentFaqs[index]) {
      currentFaqs[index] = { ...currentFaqs[index], [field]: value };
      updateSelectedSectionData('faqs', currentFaqs);
    }
  };

  const deleteFaqItem = (index) => {
    if (!selectedSection) return;
    const currentFaqs = [...(selectedSection.data?.faqs || [])];
    if (currentFaqs.length <= 1) {
      toast.warning('FAQ must have at least one question.');
      return;
    }
    currentFaqs.splice(index, 1);
    updateSelectedSectionData('faqs', currentFaqs);
    toast.info('FAQ item removed');
  };

  // Helper dispatchers for dynamic items in TESTIMONIALS
  const addReviewItem = () => {
    if (!selectedSection) return;
    const currentReviews = selectedSection.data?.reviews || [];
    const newRev = {
      id: Date.now(),
      name: 'Customer Name',
      rating: 5,
      comment: 'Excellent product quality and prompt dispatch!',
      role: 'Verified Buyer',
      location: 'City, State'
    };
    updateSelectedSectionData('reviews', [...currentReviews, newRev]);
    toast.success('Added customer review');
  };

  const updateReviewItem = (index, field, value) => {
    if (!selectedSection) return;
    const currentReviews = [...(selectedSection.data?.reviews || [])];
    if (currentReviews[index]) {
      currentReviews[index] = { ...currentReviews[index], [field]: value };
      updateSelectedSectionData('reviews', currentReviews);
    }
  };

  const deleteReviewItem = (index) => {
    if (!selectedSection) return;
    const currentReviews = [...(selectedSection.data?.reviews || [])];
    if (currentReviews.length <= 1) {
      toast.warning('Reviews section must have at least one review.');
      return;
    }
    currentReviews.splice(index, 1);
    updateSelectedSectionData('reviews', currentReviews);
    toast.info('Review removed');
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
              <Layers size={15} /> <span>Layers ({config.sections.length + 2})</span>
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
                {/* MASTER PINNED LAYER: STORE HEADER & NAVIGATION */}
                <div
                  onClick={() => {
                    setSelectedSectionId('HEADER_NAVBAR');
                    setActiveTab('inspector');
                  }}
                  className={`layer-row-card master-header-card ${selectedSectionId === 'HEADER_NAVBAR' ? 'selected' : ''}`}
                >
                  <div className="layer-row-left">
                    <span className="master-header-pin-badge" title="Master Global Layer (Always Pinned at Top)">
                      <SlidersHorizontal size={13} />
                    </span>
                    <div className="layer-block-icon master-icon-glow" style={{ background: `${primaryColor}18`, color: primaryColor }}>
                      <Store size={15} />
                    </div>
                    <div className="layer-text-wrap">
                      <div className="layer-title-badge-row">
                        <span className="layer-title">Store Header & Navigation</span>
                        <span className="master-layer-pill">Master Layer</span>
                      </div>
                      <span className="layer-type">Branding, Logo, Announcement Bar & Nav Links</span>
                    </div>
                  </div>

                  <div className="layer-row-actions" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSectionId('HEADER_NAVBAR');
                        setActiveTab('inspector');
                      }}
                      className="btn-icon-action"
                      title="Configure Store Header & Navigation"
                    >
                      <Settings size={14} color={primaryColor} />
                    </button>
                  </div>
                </div>

                {/* Section Separator */}
                <div className="layers-body-divider">
                  <span>Page Body Blocks ({config.sections.length})</span>
                </div>

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

                {/* MASTER PINNED LAYER: STORE FOOTER */}
                <div className="layers-body-divider" style={{ marginTop: '0.75rem' }}>
                  <span>Store Footer (Pinned at Bottom)</span>
                </div>
                <div
                  onClick={() => {
                    setSelectedSectionId('FOOTER_MASTER');
                    setActiveTab('inspector');
                  }}
                  className={`layer-row-card master-header-card ${selectedSectionId === 'FOOTER_MASTER' ? 'selected' : ''}`}
                >
                  <div className="layer-row-left">
                    <span className="master-header-pin-badge" title="Master Global Layer (Always Pinned at Bottom)">
                      <SlidersHorizontal size={13} />
                    </span>
                    <div className="layer-block-icon master-icon-glow" style={{ background: `${primaryColor}18`, color: primaryColor }}>
                      <Layers size={15} />
                    </div>
                    <div className="layer-text-wrap">
                      <div className="layer-title-badge-row">
                        <span className="layer-title">Store Footer & Legal Notice</span>
                        <span className="master-layer-pill">Master Layer</span>
                      </div>
                      <span className="layer-type">Bio, Social Links, Menus & Badges</span>
                    </div>
                  </div>

                  <div className="layer-row-actions" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSectionId('FOOTER_MASTER');
                        setActiveTab('inspector');
                      }}
                      className="btn-icon-action"
                      title="Configure Store Footer"
                    >
                      <Settings size={14} color={primaryColor} />
                    </button>
                  </div>
                </div>
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
                  <p className="content-subtitle">
                    {insertAtIndex !== null
                      ? `Click any block below to insert at position #${insertAtIndex + 1}`
                      : 'Click any block to insert it into your storefront.'}
                  </p>
                </div>
                {insertAtIndex !== null && (
                  <button
                    type="button"
                    onClick={() => setInsertAtIndex(null)}
                    className="btn btn-secondary btn-xs"
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    Clear Position
                  </button>
                )}
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
            </div>
          )}

          {/* TAB 4: SECTION INSPECTOR (SETTINGS FOR SELECTED SECTION) */}
          {activeTab === 'inspector' && selectedSection && (
            <div className="studio-tab-content">
              <div className="content-intro-strip inspector-header-strip">
                <div>
                  <div className="inspector-badge-row">
                    <span className="badge badge-primary inspector-type-badge">
                      {(selectedSection.type === 'HEADER_NAVBAR' || selectedSection.type === 'FOOTER_MASTER') ? 'GLOBAL MASTER' : selectedSection.type}
                    </span>
                    {(selectedSection.type !== 'HEADER_NAVBAR' && selectedSection.type !== 'FOOTER_MASTER') && (
                      <span className="badge badge-secondary inspector-seq-badge">
                        Section #{config.sections.findIndex((s) => s.id === selectedSection.id) + 1}
                      </span>
                    )}
                  </div>
                  <h4 className="content-title" style={{ marginTop: '0.2rem' }}>
                    {selectedSection.type === 'HEADER_NAVBAR'
                      ? 'Store Header & Navigation'
                      : selectedSection.type === 'FOOTER_MASTER'
                      ? 'Store Footer & Legal Notice'
                      : (AVAILABLE_BLOCK_TYPES.find((b) => b.type === selectedSection.type)?.name || 'Configure Section')}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('layers')}
                  className="btn btn-secondary btn-xs btn-back-layers"
                >
                  <ChevronLeft size={13} /> <span>Layers</span>
                </button>
              </div>

              <div className="inspector-form-body">
                {/* 0. GLOBAL MASTER: STORE HEADER & NAVBAR */}
                {selectedSection.type === 'HEADER_NAVBAR' && (
                  <div className="inspector-fields-stack">
                    {/* Brand Identity & Logo Card */}
                    <div className="builder-field-card">
                      <div className="builder-card-header">
                        <Store size={15} color={primaryColor} />
                        <span className="builder-card-title">Brand Identity & Logo</span>
                      </div>

                      <div className="builder-input-group">
                        <label className="builder-field-label">
                          <span>Storefront Name</span>
                          <span className="builder-field-hint">Displays on header</span>
                        </label>
                        <input
                          type="text"
                          className="builder-input"
                          value={config.branding?.storeName || ''}
                          onChange={(e) => updateBranding('storeName', e.target.value)}
                          placeholder="My Store Name"
                        />
                      </div>

                      <div className="builder-input-group">
                        <label className="builder-field-label">
                          <span>Tagline</span>
                          <span className="builder-field-hint">Brand motto</span>
                        </label>
                        <input
                          type="text"
                          className="builder-input"
                          value={config.branding?.tagline || ''}
                          onChange={(e) => updateBranding('tagline', e.target.value)}
                          placeholder="Quality products delivered to your door"
                        />
                      </div>

                      <div className="builder-input-group">
                        <label className="builder-field-label">
                          <span>Logo Image URL</span>
                          <span className="builder-field-hint">PNG / SVG / WebP</span>
                        </label>
                        <input
                          type="url"
                          className="builder-input"
                          value={config.branding?.logoUrl || ''}
                          onChange={(e) => updateBranding('logoUrl', e.target.value)}
                          placeholder="https://example.com/logo.png"
                        />
                      </div>

                      {config.branding?.logoUrl ? (
                        <div className="builder-logo-preview-box">
                          <img
                            src={config.branding.logoUrl}
                            alt="Logo"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                          <span className="logo-preview-badge">Active Logo</span>
                        </div>
                      ) : (
                        <div className="builder-logo-empty-box">
                          <Store size={20} color="#94a3b8" />
                          <span>Using default store icon</span>
                        </div>
                      )}
                    </div>

                    {/* Announcement Notification Bar Card */}
                    <div className="builder-field-card">
                      <div className="builder-toggle-row">
                        <div className="toggle-info-col">
                          <span className="builder-card-title">Top Announcement Bar</span>
                          <span className="builder-field-hint">Sticky top notification strip</span>
                        </div>
                        <label className="builder-switch-wrapper">
                          <input
                            type="checkbox"
                            checked={config.announcement?.enabled !== false}
                            onChange={(e) => updateAnnouncement('enabled', e.target.checked)}
                          />
                          <span className="builder-switch-slider" />
                        </label>
                      </div>

                      {config.announcement?.enabled !== false && (
                        <div className="builder-input-group" style={{ marginTop: '0.4rem' }}>
                          <label className="builder-field-label">
                            <span>Announcement Message</span>
                          </label>
                          <input
                            type="text"
                            className="builder-input"
                            value={config.announcement?.text || ''}
                            onChange={(e) => updateAnnouncement('text', e.target.value)}
                            placeholder="E.g. Free express delivery on orders above ₹499"
                          />
                        </div>
                      )}
                    </div>

                    {/* Navigation Menu Links Manager */}
                    <div className="builder-field-card">
                      <div className="builder-card-header" style={{ justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Layers size={15} color={primaryColor} />
                          <span className="builder-card-title">Navigation Menu Links</span>
                        </div>
                        <button
                          type="button"
                          onClick={addNavbarLink}
                          className="btn btn-secondary btn-xs btn-add-link"
                        >
                          <Plus size={12} /> <span>Add Link</span>
                        </button>
                      </div>
                      <p className="builder-field-hint" style={{ margin: '0 0 0.5rem 0' }}>
                        Links displayed on top navigation bar that customers click to navigate.
                      </p>

                      <div className="nav-links-editor-stack">
                        {(config.navbar?.navLinks || DEFAULT_NAV_LINKS).map((link, lIdx) => (
                          <div key={link.id || lIdx} className={`nav-link-row-item ${link.enabled === false ? 'is-disabled' : ''}`}>
                            <div className="nav-link-inputs">
                              <input
                                type="text"
                                className="builder-input input-sm"
                                value={link.label || ''}
                                onChange={(e) => updateNavbarLink(link.id, 'label', e.target.value)}
                                placeholder="Link Label"
                              />
                              <input
                                type="text"
                                className="builder-input input-sm url-field"
                                value={link.url || ''}
                                onChange={(e) => updateNavbarLink(link.id, 'url', e.target.value)}
                                placeholder="Anchor (#products)"
                              />
                            </div>
                            <div className="nav-link-actions">
                              <button
                                type="button"
                                onClick={() => updateNavbarLink(link.id, 'enabled', link.enabled === false ? true : false)}
                                className="btn-icon-action"
                                title={link.enabled === false ? 'Show Link' : 'Hide Link'}
                              >
                                {link.enabled === false ? <EyeOff size={14} color="#94a3b8" /> : <Eye size={14} color="#10b981" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteNavbarLink(link.id)}
                                className="btn-icon-action delete"
                                title="Remove Link"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Store Contact & Utility Strip */}
                    <div className="builder-field-card">
                      <div className="builder-card-header">
                        <Phone size={15} color={primaryColor} />
                        <span className="builder-card-title">Contact & Utility Bar</span>
                      </div>

                      <div className="builder-input-group">
                        <label className="builder-field-label">
                          <span>Physical Address</span>
                        </label>
                        <input
                          type="text"
                          className="builder-input"
                          value={config.contact?.address || ''}
                          onChange={(e) => updateContact('address', e.target.value)}
                          placeholder="Retail Center, Commercial Street"
                        />
                      </div>

                      <div className="builder-input-group">
                        <label className="builder-field-label">
                          <span>Support Phone Number</span>
                        </label>
                        <input
                          type="text"
                          className="builder-input"
                          value={config.contact?.phone || ''}
                          onChange={(e) => updateContact('phone', e.target.value)}
                          placeholder="+91 98765 43210"
                        />
                      </div>

                      <div className="builder-input-group">
                        <label className="builder-field-label">
                          <span>WhatsApp Support Number</span>
                        </label>
                        <input
                          type="text"
                          className="builder-input"
                          value={config.contact?.whatsappNumber || ''}
                          onChange={(e) => updateContact('whatsappNumber', e.target.value)}
                          placeholder="+91 98765 43210"
                        />
                      </div>

                      <div className="builder-input-group">
                        <label className="builder-field-label">
                          <span>Business Hours</span>
                        </label>
                        <input
                          type="text"
                          className="builder-input"
                          value={config.contact?.hours || ''}
                          onChange={(e) => updateContact('hours', e.target.value)}
                          placeholder="Mon - Sat: 9:00 AM - 9:00 PM"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 0B. GLOBAL MASTER: STORE FOOTER & LEGAL NOTICE */}
                {selectedSection.type === 'FOOTER_MASTER' && (
                  <div className="inspector-fields-stack">
                    {/* Brand Bio & Copyright Card */}
                    <div className="builder-field-card">
                      <div className="builder-card-header">
                        <Store size={15} color={primaryColor} />
                        <span className="builder-card-title">Store Footer Branding & Bio</span>
                      </div>

                      <div className="builder-input-group">
                        <label className="builder-field-label">
                          <span>Store Bio & Mission</span>
                          <span className="builder-field-hint">Short summary in Col 1</span>
                        </label>
                        <textarea
                          className="builder-textarea"
                          rows={3}
                          value={config.footer?.brandBio || ''}
                          onChange={(e) => updateFooter('brandBio', e.target.value)}
                          placeholder="Direct digital storefront backed by verified central inventory..."
                        />
                      </div>

                      <div className="builder-input-group">
                        <label className="builder-field-label">
                          <span>Copyright Notice</span>
                          <span className="builder-field-hint">Displays on bottom bar</span>
                        </label>
                        <input
                          type="text"
                          className="builder-input"
                          value={config.footer?.copyrightText || ''}
                          onChange={(e) => updateFooter('copyrightText', e.target.value)}
                          placeholder="All rights reserved."
                        />
                      </div>
                    </div>

                    {/* Column 1 Quick Links Manager */}
                    <div className="builder-field-card">
                      <div className="builder-card-header" style={{ justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Layers size={15} color={primaryColor} />
                          <span className="builder-card-title">Column 1 Quick Links</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => addFooterLink(1)}
                          className="btn btn-secondary btn-xs btn-add-link"
                        >
                          <Plus size={12} /> <span>Add Link</span>
                        </button>
                      </div>

                      <div className="builder-input-group" style={{ marginBottom: '0.6rem' }}>
                        <label className="builder-field-label">
                          <span>Column 1 Title</span>
                        </label>
                        <input
                          type="text"
                          className="builder-input"
                          value={config.footer?.col1Title || ''}
                          onChange={(e) => updateFooter('col1Title', e.target.value)}
                          placeholder="Quick Links"
                        />
                      </div>

                      <div className="nav-links-editor-stack">
                        {(config.footer?.col1Links || DEFAULT_FOOTER.col1Links).map((link, lIdx) => (
                          <div key={link.id || lIdx} className="nav-link-row-item">
                            <div className="nav-link-inputs">
                              <input
                                type="text"
                                className="builder-input input-sm"
                                value={link.label || ''}
                                onChange={(e) => updateFooterLink(1, link.id, 'label', e.target.value)}
                                placeholder="Link Label"
                              />
                              <input
                                type="text"
                                className="builder-input input-sm url-field"
                                value={link.url || ''}
                                onChange={(e) => updateFooterLink(1, link.id, 'url', e.target.value)}
                                placeholder="URL (#home)"
                              />
                            </div>
                            <div className="nav-link-actions">
                              <button
                                type="button"
                                onClick={() => deleteFooterLink(1, link.id)}
                                className="btn-icon-action delete"
                                title="Remove Link"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Column 2 Policy & Legal Links Manager */}
                    <div className="builder-field-card">
                      <div className="builder-card-header" style={{ justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <FileText size={15} color={primaryColor} />
                          <span className="builder-card-title">Column 2 Customer Care Links</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => addFooterLink(2)}
                          className="btn btn-secondary btn-xs btn-add-link"
                        >
                          <Plus size={12} /> <span>Add Link</span>
                        </button>
                      </div>

                      <div className="builder-input-group" style={{ marginBottom: '0.6rem' }}>
                        <label className="builder-field-label">
                          <span>Column 2 Title</span>
                        </label>
                        <input
                          type="text"
                          className="builder-input"
                          value={config.footer?.col2Title || ''}
                          onChange={(e) => updateFooter('col2Title', e.target.value)}
                          placeholder="Customer Care & Policies"
                        />
                      </div>

                      <div className="nav-links-editor-stack">
                        {(config.footer?.col2Links || DEFAULT_FOOTER.col2Links).map((link, lIdx) => (
                          <div key={link.id || lIdx} className="nav-link-row-item">
                            <div className="nav-link-inputs">
                              <input
                                type="text"
                                className="builder-input input-sm"
                                value={link.label || ''}
                                onChange={(e) => updateFooterLink(2, link.id, 'label', e.target.value)}
                                placeholder="Link Label"
                              />
                              <input
                                type="text"
                                className="builder-input input-sm url-field"
                                value={link.url || ''}
                                onChange={(e) => updateFooterLink(2, link.id, 'url', e.target.value)}
                                placeholder="URL (#faq)"
                              />
                            </div>
                            <div className="nav-link-actions">
                              <button
                                type="button"
                                onClick={() => deleteFooterLink(2, link.id)}
                                className="btn-icon-action delete"
                                title="Remove Link"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Social Media Links Card */}
                    <div className="builder-field-card">
                      <div className="builder-toggle-row">
                        <div className="toggle-info-col">
                          <span className="builder-card-title">Social Media Channels</span>
                          <span className="builder-field-hint">Display brand social profile icons</span>
                        </div>
                        <label className="builder-switch-wrapper">
                          <input
                            type="checkbox"
                            checked={config.footer?.showSocials !== false}
                            onChange={(e) => updateFooter('showSocials', e.target.checked)}
                          />
                          <span className="builder-switch-slider" />
                        </label>
                      </div>

                      {config.footer?.showSocials !== false && (
                        <div className="builder-input-stack" style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <div className="builder-input-group">
                            <label className="builder-field-label">
                              <span>WhatsApp Chat Link / Number</span>
                            </label>
                            <input
                              type="text"
                              className="builder-input"
                              value={config.footer?.socials?.whatsapp || ''}
                              onChange={(e) => updateFooterSocial('whatsapp', e.target.value)}
                              placeholder="+91 98765 43210 or wa.me/..."
                            />
                          </div>

                          <div className="builder-input-group">
                            <label className="builder-field-label">
                              <span>Instagram URL</span>
                            </label>
                            <input
                              type="url"
                              className="builder-input"
                              value={config.footer?.socials?.instagram || ''}
                              onChange={(e) => updateFooterSocial('instagram', e.target.value)}
                              placeholder="https://instagram.com/yourstore"
                            />
                          </div>

                          <div className="builder-input-group">
                            <label className="builder-field-label">
                              <span>Facebook Page URL</span>
                            </label>
                            <input
                              type="url"
                              className="builder-input"
                              value={config.footer?.socials?.facebook || ''}
                              onChange={(e) => updateFooterSocial('facebook', e.target.value)}
                              placeholder="https://facebook.com/yourstore"
                            />
                          </div>

                          <div className="builder-input-group">
                            <label className="builder-field-label">
                              <span>Twitter / X Profile URL</span>
                            </label>
                            <input
                              type="url"
                              className="builder-input"
                              value={config.footer?.socials?.twitter || ''}
                              onChange={(e) => updateFooterSocial('twitter', e.target.value)}
                              placeholder="https://x.com/yourstore"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Payment Badges Card */}
                    <div className="builder-field-card">
                      <div className="builder-toggle-row">
                        <div className="toggle-info-col">
                          <span className="builder-card-title">Accepted Payment Badges & Guarantees</span>
                          <span className="builder-field-hint">Display trust icons at footer bottom</span>
                        </div>
                        <label className="builder-switch-wrapper">
                          <input
                            type="checkbox"
                            checked={config.footer?.showPaymentBadges !== false}
                            onChange={(e) => updateFooter('showPaymentBadges', e.target.checked)}
                          />
                          <span className="builder-switch-slider" />
                        </label>
                      </div>

                      {config.footer?.showPaymentBadges !== false && (
                        <div className="badges-toggles-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.45rem', marginTop: '0.75rem' }}>
                          <label className="badge-checkbox-label">
                            <input
                              type="checkbox"
                              checked={config.footer?.paymentBadges?.upi !== false}
                              onChange={(e) => updateFooterPaymentBadge('upi', e.target.checked)}
                            />
                            <span>UPI (GPay, PhonePe)</span>
                          </label>

                          <label className="badge-checkbox-label">
                            <input
                              type="checkbox"
                              checked={config.footer?.paymentBadges?.cards !== false}
                              onChange={(e) => updateFooterPaymentBadge('cards', e.target.checked)}
                            />
                            <span>RuPay / Visa / Mastercard</span>
                          </label>

                          <label className="badge-checkbox-label">
                            <input
                              type="checkbox"
                              checked={config.footer?.paymentBadges?.netbanking !== false}
                              onChange={(e) => updateFooterPaymentBadge('netbanking', e.target.checked)}
                            />
                            <span>Net Banking</span>
                          </label>

                          <label className="badge-checkbox-label">
                            <input
                              type="checkbox"
                              checked={config.footer?.paymentBadges?.cod !== false}
                              onChange={(e) => updateFooterPaymentBadge('cod', e.target.checked)}
                            />
                            <span>Cash on Delivery</span>
                          </label>

                          <label className="badge-checkbox-label">
                            <input
                              type="checkbox"
                              checked={config.footer?.paymentBadges?.genuine !== false}
                              onChange={(e) => updateFooterPaymentBadge('genuine', e.target.checked)}
                            />
                            <span>100% Genuine Direct Stock</span>
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 1. HERO_BANNER */}
                {selectedSection.type === 'HERO_BANNER' && (
                  <div className="inspector-fields-stack">
                    <div className="builder-field-card">
                      <div className="builder-input-group">
                        <label className="builder-field-label">
                          <span>Badge Label</span>
                          <span className="builder-field-hint">Top pill badge</span>
                        </label>
                        <input
                          type="text"
                          className="builder-input"
                          value={selectedSection.data?.badge || ''}
                          onChange={(e) => updateSelectedSectionData('badge', e.target.value)}
                          placeholder="Official Online Store"
                        />
                      </div>

                      <div className="builder-input-group">
                        <label className="builder-field-label">
                          <span>Hero Headline</span>
                          <span className="builder-field-hint">Main hero title</span>
                        </label>
                        <input
                          type="text"
                          className="builder-input"
                          value={selectedSection.data?.title || ''}
                          onChange={(e) => updateSelectedSectionData('title', e.target.value)}
                          placeholder="Welcome to Our Store"
                        />
                      </div>

                      <div className="builder-input-group">
                        <label className="builder-field-label">
                          <span>Subtitle Description</span>
                          <span className="builder-field-hint">Story & promo description</span>
                        </label>
                        <textarea
                          className="builder-textarea"
                          rows={3}
                          value={selectedSection.data?.subtitle || ''}
                          onChange={(e) => updateSelectedSectionData('subtitle', e.target.value)}
                          placeholder="Shop the freshest arrivals and verified products..."
                        />
                      </div>

                      <div className="builder-input-group">
                        <label className="builder-field-label">
                          <span>CTA Button Text</span>
                          <span className="builder-field-hint">Call to action</span>
                        </label>
                        <input
                          type="text"
                          className="builder-input"
                          value={selectedSection.data?.ctaText || ''}
                          onChange={(e) => updateSelectedSectionData('ctaText', e.target.value)}
                          placeholder="Explore Catalog"
                        />
                      </div>

                      <div className="builder-input-group">
                        <label className="builder-field-label">
                          <span>Hero Background Image URL</span>
                          <span className="builder-field-hint">High resolution wallpaper</span>
                        </label>
                        <input
                          type="url"
                          className="builder-input"
                          value={selectedSection.data?.imageUrl || ''}
                          onChange={(e) => updateSelectedSectionData('imageUrl', e.target.value)}
                          placeholder="https://images.unsplash.com/..."
                        />
                      </div>

                      {selectedSection.data?.imageUrl && (
                        <div className="builder-img-preview-box">
                          <img
                            src={selectedSection.data.imageUrl}
                            alt="Hero Preview"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                          <div className="img-preview-overlay">
                            <span>Live Hero Preview</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 2. FLASH_SALE */}
                {selectedSection.type === 'FLASH_SALE' && (
                  <div className="inspector-fields-stack">
                    <div className="builder-field-card">
                      <div className="builder-input-group">
                        <label className="builder-field-label">
                          <span>Urgency Badge</span>
                        </label>
                        <input
                          type="text"
                          className="builder-input"
                          value={selectedSection.data?.badge || ''}
                          onChange={(e) => updateSelectedSectionData('badge', e.target.value)}
                          placeholder="FLASH DEAL"
                        />
                      </div>

                      <div className="builder-input-group">
                        <label className="builder-field-label">
                          <span>Ends In Label</span>
                        </label>
                        <input
                          type="text"
                          className="builder-input"
                          value={selectedSection.data?.endsIn || ''}
                          onChange={(e) => updateSelectedSectionData('endsIn', e.target.value)}
                          placeholder="Limited Weekend Promo"
                        />
                      </div>

                      <div className="builder-input-group">
                        <label className="builder-field-label">
                          <span>Flash Sale Headline</span>
                        </label>
                        <input
                          type="text"
                          className="builder-input"
                          value={selectedSection.data?.title || ''}
                          onChange={(e) => updateSelectedSectionData('title', e.target.value)}
                          placeholder="Super Saver Weekend Deals"
                        />
                      </div>

                      <div className="builder-input-group">
                        <label className="builder-field-label">
                          <span>Promo Subtitle</span>
                        </label>
                        <textarea
                          className="builder-textarea"
                          rows={2}
                          value={selectedSection.data?.subtitle || ''}
                          onChange={(e) => updateSelectedSectionData('subtitle', e.target.value)}
                          placeholder="Exclusive direct discounts on handpicked catalog items..."
                        />
                      </div>

                      <div className="builder-input-group">
                        <label className="builder-field-label">
                          <span>Discount Pill Tag</span>
                        </label>
                        <input
                          type="text"
                          className="builder-input"
                          value={selectedSection.data?.discountText || ''}
                          onChange={(e) => updateSelectedSectionData('discountText', e.target.value)}
                          placeholder="UP TO 40% OFF"
                        />
                      </div>

                      <div className="builder-input-group">
                        <label className="builder-field-label">
                          <span>CTA Button Label</span>
                        </label>
                        <input
                          type="text"
                          className="builder-input"
                          value={selectedSection.data?.ctaText || ''}
                          onChange={(e) => updateSelectedSectionData('ctaText', e.target.value)}
                          placeholder="Shop Deals Now"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. PRODUCT_GRID */}
                {selectedSection.type === 'PRODUCT_GRID' && (
                  <div className="inspector-fields-stack">
                    <div className="builder-field-card">
                      <div className="builder-input-group">
                        <label className="builder-field-label">
                          <span>Catalog Section Title</span>
                        </label>
                        <input
                          type="text"
                          className="builder-input"
                          value={selectedSection.data?.title || ''}
                          onChange={(e) => updateSelectedSectionData('title', e.target.value)}
                          placeholder="Featured Catalog"
                        />
                      </div>

                      <div className="builder-input-group">
                        <label className="builder-field-label">
                          <span>Catalog Subtitle</span>
                        </label>
                        <input
                          type="text"
                          className="builder-input"
                          value={selectedSection.data?.subtitle || ''}
                          onChange={(e) => updateSelectedSectionData('subtitle', e.target.value)}
                          placeholder="Browse all available items in real-time inventory"
                        />
                      </div>
                    </div>

                    <div className="builder-field-card">
                      <div className="builder-card-header">
                        <SlidersHorizontal size={15} color={primaryColor} />
                        <span className="builder-card-title">Display & Interactive Features</span>
                      </div>

                      <div className="builder-toggle-row">
                        <div className="toggle-info-col">
                          <span className="toggle-main-label">Live Search Filter</span>
                          <span className="builder-field-hint">Search input for customer filtering</span>
                        </div>
                        <label className="builder-switch-wrapper">
                          <input
                            type="checkbox"
                            checked={selectedSection.data?.showSearch !== false}
                            onChange={(e) => updateSelectedSectionData('showSearch', e.target.checked)}
                          />
                          <span className="builder-switch-slider" />
                        </label>
                      </div>

                      <div className="builder-toggle-row">
                        <div className="toggle-info-col">
                          <span className="toggle-main-label">Category Filter Chips</span>
                          <span className="builder-field-hint">Interactive categories horizontal bar</span>
                        </div>
                        <label className="builder-switch-wrapper">
                          <input
                            type="checkbox"
                            checked={selectedSection.data?.showCategories !== false}
                            onChange={(e) => updateSelectedSectionData('showCategories', e.target.checked)}
                          />
                          <span className="builder-switch-slider" />
                        </label>
                      </div>

                      <div className="builder-toggle-row">
                        <div className="toggle-info-col">
                          <span className="toggle-main-label">Real-time Stock Badges</span>
                          <span className="builder-field-hint">In-Stock / Low Stock indicators</span>
                        </div>
                        <label className="builder-switch-wrapper">
                          <input
                            type="checkbox"
                            checked={selectedSection.data?.showStockBadge !== false}
                            onChange={(e) => updateSelectedSectionData('showStockBadge', e.target.checked)}
                          />
                          <span className="builder-switch-slider" />
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. PRODUCT_CAROUSEL */}
                {selectedSection.type === 'PRODUCT_CAROUSEL' && (
                  <div className="inspector-fields-stack">
                    <div className="builder-field-card">
                      <div className="builder-input-group">
                        <label className="builder-field-label">
                          <span>Carousel Headline</span>
                        </label>
                        <input
                          type="text"
                          className="builder-input"
                          value={selectedSection.data?.title || ''}
                          onChange={(e) => updateSelectedSectionData('title', e.target.value)}
                          placeholder="Trending Highlights"
                        />
                      </div>

                      <div className="builder-input-group">
                        <label className="builder-field-label">
                          <span>Carousel Subtitle</span>
                        </label>
                        <input
                          type="text"
                          className="builder-input"
                          value={selectedSection.data?.subtitle || ''}
                          onChange={(e) => updateSelectedSectionData('subtitle', e.target.value)}
                          placeholder="Top-selling picks delivered directly from central warehouse"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. CATEGORY_TILES */}
                {selectedSection.type === 'CATEGORY_TILES' && (
                  <div className="inspector-fields-stack">
                    <div className="builder-field-card">
                      <div className="builder-input-group">
                        <label className="builder-field-label">
                          <span>Section Title</span>
                        </label>
                        <input
                          type="text"
                          className="builder-input"
                          value={selectedSection.data?.title || ''}
                          onChange={(e) => updateSelectedSectionData('title', e.target.value)}
                          placeholder="Explore by Category"
                        />
                      </div>

                      <div className="builder-input-group">
                        <label className="builder-field-label">
                          <span>Section Subtitle</span>
                        </label>
                        <input
                          type="text"
                          className="builder-input"
                          value={selectedSection.data?.subtitle || ''}
                          onChange={(e) => updateSelectedSectionData('subtitle', e.target.value)}
                          placeholder="Find exactly what you need with quick category filters"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. BRAND_STORY */}
                {selectedSection.type === 'BRAND_STORY' && (
                  <div className="inspector-fields-stack">
                    <div className="builder-field-card">
                      <div className="builder-input-group">
                        <label className="builder-field-label">
                          <span>Heritage Tag</span>
                        </label>
                        <input
                          type="text"
                          className="builder-input"
                          value={selectedSection.data?.badge || ''}
                          onChange={(e) => updateSelectedSectionData('badge', e.target.value)}
                          placeholder="OUR HERITAGE"
                        />
                      </div>

                      <div className="builder-input-group">
                        <label className="builder-field-label">
                          <span>Story Headline</span>
                        </label>
                        <input
                          type="text"
                          className="builder-input"
                          value={selectedSection.data?.title || ''}
                          onChange={(e) => updateSelectedSectionData('title', e.target.value)}
                          placeholder="Crafted with Passion & Precision"
                        />
                      </div>

                      <div className="builder-input-group">
                        <label className="builder-field-label">
                          <span>Story Narrative</span>
                        </label>
                        <textarea
                          className="builder-textarea"
                          rows={4}
                          value={selectedSection.data?.narrative || ''}
                          onChange={(e) => updateSelectedSectionData('narrative', e.target.value)}
                          placeholder="Founded with a clear vision: to bring authenticated products..."
                        />
                      </div>

                      <div className="builder-input-group">
                        <label className="builder-field-label">
                          <span>Story Image URL</span>
                        </label>
                        <input
                          type="url"
                          className="builder-input"
                          value={selectedSection.data?.imageUrl || ''}
                          onChange={(e) => updateSelectedSectionData('imageUrl', e.target.value)}
                          placeholder="https://images.unsplash.com/..."
                        />
                      </div>

                      {selectedSection.data?.imageUrl && (
                        <div className="builder-img-preview-box">
                          <img
                            src={selectedSection.data.imageUrl}
                            alt="Story Preview"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                          <div className="img-preview-overlay">
                            <span>Story Visual Preview</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 7. NEWSLETTER_BAR */}
                {selectedSection.type === 'NEWSLETTER_BAR' && (
                  <div className="inspector-fields-stack">
                    <div className="builder-field-card">
                      <div className="builder-input-group">
                        <label className="builder-field-label">
                          <span>Coupon Code</span>
                        </label>
                        <input
                          type="text"
                          className="builder-input"
                          value={selectedSection.data?.couponCode || ''}
                          onChange={(e) => updateSelectedSectionData('couponCode', e.target.value.toUpperCase())}
                          placeholder="WELCOME10"
                        />
                      </div>

                      <div className="builder-input-group">
                        <label className="builder-field-label">
                          <span>Offer Headline</span>
                        </label>
                        <input
                          type="text"
                          className="builder-input"
                          value={selectedSection.data?.title || ''}
                          onChange={(e) => updateSelectedSectionData('title', e.target.value)}
                          placeholder="Get 10% Off Your First Direct Order"
                        />
                      </div>

                      <div className="builder-input-group">
                        <label className="builder-field-label">
                          <span>Offer Terms / Subtitle</span>
                        </label>
                        <input
                          type="text"
                          className="builder-input"
                          value={selectedSection.data?.subtitle || ''}
                          onChange={(e) => updateSelectedSectionData('subtitle', e.target.value)}
                          placeholder="Subscribe to receive private discount codes & flash sale alerts"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 8. CONTACT_MAP */}
                {selectedSection.type === 'CONTACT_MAP' && (
                  <div className="inspector-fields-stack">
                    <div className="builder-field-card">
                      <div className="builder-card-header">
                        <MapPin size={15} color={primaryColor} />
                        <span className="builder-card-title">Store Contact Card</span>
                      </div>

                      <div className="builder-input-group">
                        <label className="builder-field-label">
                          <span>Card Title</span>
                        </label>
                        <input
                          type="text"
                          className="builder-input"
                          value={selectedSection.data?.title || ''}
                          onChange={(e) => updateSelectedSectionData('title', e.target.value)}
                          placeholder="Visit Our Store & Contact"
                        />
                      </div>

                      <div className="builder-input-group">
                        <label className="builder-field-label">
                          <span>Card Subtitle</span>
                        </label>
                        <input
                          type="text"
                          className="builder-input"
                          value={selectedSection.data?.subtitle || ''}
                          onChange={(e) => updateSelectedSectionData('subtitle', e.target.value)}
                          placeholder="Reach out directly for inquiries or orders"
                        />
                      </div>
                    </div>

                    <div className="builder-field-card">
                      <div className="builder-card-header">
                        <Phone size={15} color={primaryColor} />
                        <span className="builder-card-title">Direct Store Contact Details</span>
                      </div>

                      <div className="builder-input-group">
                        <label className="builder-field-label">
                          <span>Store Address</span>
                        </label>
                        <input
                          type="text"
                          className="builder-input"
                          value={selectedSection.data?.address !== undefined ? selectedSection.data.address : (config.contact?.address || '')}
                          onChange={(e) => updateSelectedSectionData('address', e.target.value)}
                          placeholder="Retail Center, Commercial Street"
                        />
                      </div>

                      <div className="builder-input-group">
                        <label className="builder-field-label">
                          <span>Operating Hours</span>
                        </label>
                        <input
                          type="text"
                          className="builder-input"
                          value={selectedSection.data?.hours !== undefined ? selectedSection.data.hours : (config.contact?.hours || '')}
                          onChange={(e) => updateSelectedSectionData('hours', e.target.value)}
                          placeholder="Mon - Sat: 9:00 AM - 9:00 PM"
                        />
                      </div>

                      <div className="builder-input-group">
                        <label className="builder-field-label">
                          <span>Direct Phone Number</span>
                        </label>
                        <input
                          type="text"
                          className="builder-input"
                          value={selectedSection.data?.phone !== undefined ? selectedSection.data.phone : (config.contact?.phone || '')}
                          onChange={(e) => updateSelectedSectionData('phone', e.target.value)}
                          placeholder="+91 98765 43210"
                        />
                      </div>

                      <div className="builder-input-group">
                        <label className="builder-field-label">
                          <span>Direct WhatsApp Number</span>
                        </label>
                        <input
                          type="text"
                          className="builder-input"
                          value={selectedSection.data?.whatsappNumber !== undefined ? selectedSection.data.whatsappNumber : (config.contact?.whatsappNumber || '')}
                          onChange={(e) => updateSelectedSectionData('whatsappNumber', e.target.value)}
                          placeholder="+91 98765 43210"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 9. FAQ_ACCORDION */}
                {selectedSection.type === 'FAQ_ACCORDION' && (
                  <div className="inspector-fields-stack">
                    <div className="builder-field-card">
                      <div className="builder-input-group">
                        <label className="builder-field-label">
                          <span>FAQ Title</span>
                        </label>
                        <input
                          type="text"
                          className="builder-input"
                          value={selectedSection.data?.title || ''}
                          onChange={(e) => updateSelectedSectionData('title', e.target.value)}
                          placeholder="Frequently Asked Questions"
                        />
                      </div>

                      <div className="builder-input-group">
                        <label className="builder-field-label">
                          <span>FAQ Subtitle</span>
                        </label>
                        <input
                          type="text"
                          className="builder-input"
                          value={selectedSection.data?.subtitle || ''}
                          onChange={(e) => updateSelectedSectionData('subtitle', e.target.value)}
                          placeholder="Everything you need to know about deliveries, returns & warranties"
                        />
                      </div>
                    </div>

                    {/* Dynamic Questions & Answers List */}
                    <div className="builder-field-card">
                      <div className="builder-card-header" style={{ justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <HelpCircle size={15} color={primaryColor} />
                          <span className="builder-card-title">Questions & Answers ({(selectedSection.data?.faqs || []).length})</span>
                        </div>
                        <button
                          type="button"
                          onClick={addFaqItem}
                          className="btn btn-secondary btn-xs btn-add-link"
                        >
                          <Plus size={12} /> <span>Add Question</span>
                        </button>
                      </div>

                      <div className="dynamic-items-editor-stack" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                        {(selectedSection.data?.faqs || []).map((faq, fIdx) => (
                          <div key={fIdx} className="dynamic-item-card" style={{ padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Q#{fIdx + 1}</span>
                              <button
                                type="button"
                                onClick={() => deleteFaqItem(fIdx)}
                                className="btn-icon-action delete"
                                title="Delete Question"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                            <div className="builder-input-group" style={{ marginBottom: '0.4rem' }}>
                              <label className="builder-field-label" style={{ fontSize: '0.75rem' }}>Question</label>
                              <input
                                type="text"
                                className="builder-input input-sm"
                                value={faq.q || ''}
                                onChange={(e) => updateFaqItem(fIdx, 'q', e.target.value)}
                                placeholder="How long does delivery take?"
                              />
                            </div>
                            <div className="builder-input-group">
                              <label className="builder-field-label" style={{ fontSize: '0.75rem' }}>Answer</label>
                              <textarea
                                className="builder-textarea input-sm"
                                rows={2}
                                value={faq.a || ''}
                                onChange={(e) => updateFaqItem(fIdx, 'a', e.target.value)}
                                placeholder="Standard delivery takes 2-4 business days..."
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 10. TESTIMONIALS */}
                {selectedSection.type === 'TESTIMONIALS' && (
                  <div className="inspector-fields-stack">
                    <div className="builder-field-card">
                      <div className="builder-input-group">
                        <label className="builder-field-label">
                          <span>Reviews Title</span>
                        </label>
                        <input
                          type="text"
                          className="builder-input"
                          value={selectedSection.data?.title || ''}
                          onChange={(e) => updateSelectedSectionData('title', e.target.value)}
                          placeholder="What Our Customers Say"
                        />
                      </div>

                      <div className="builder-input-group">
                        <label className="builder-field-label">
                          <span>Reviews Subtitle</span>
                        </label>
                        <input
                          type="text"
                          className="builder-input"
                          value={selectedSection.data?.subtitle || ''}
                          onChange={(e) => updateSelectedSectionData('subtitle', e.target.value)}
                          placeholder="Verified buyer feedback across India"
                        />
                      </div>
                    </div>

                    {/* Dynamic Reviews Manager */}
                    <div className="builder-field-card">
                      <div className="builder-card-header" style={{ justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Star size={15} color="#f59e0b" />
                          <span className="builder-card-title">Customer Reviews ({(selectedSection.data?.reviews || []).length})</span>
                        </div>
                        <button
                          type="button"
                          onClick={addReviewItem}
                          className="btn btn-secondary btn-xs btn-add-link"
                        >
                          <Plus size={12} /> <span>Add Review</span>
                        </button>
                      </div>

                      <div className="dynamic-items-editor-stack" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                        {(selectedSection.data?.reviews || []).map((rev, rIdx) => (
                          <div key={rev.id || rIdx} className="dynamic-item-card" style={{ padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Review #{rIdx + 1}</span>
                              <button
                                type="button"
                                onClick={() => deleteReviewItem(rIdx)}
                                className="btn-icon-action delete"
                                title="Remove Review"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px', gap: '0.4rem', marginBottom: '0.4rem' }}>
                              <input
                                type="text"
                                className="builder-input input-sm"
                                value={rev.name || ''}
                                onChange={(e) => updateReviewItem(rIdx, 'name', e.target.value)}
                                placeholder="Reviewer Name"
                              />
                              <select
                                className="builder-input input-sm"
                                value={rev.rating || 5}
                                onChange={(e) => updateReviewItem(rIdx, 'rating', Number(e.target.value))}
                              >
                                <option value={5}>⭐⭐⭐⭐⭐ (5)</option>
                                <option value={4}>⭐⭐⭐⭐ (4)</option>
                                <option value={3}>⭐⭐⭐ (3)</option>
                              </select>
                            </div>
                            <textarea
                              className="builder-textarea input-sm"
                              rows={2}
                              value={rev.comment || ''}
                              onChange={(e) => updateReviewItem(rIdx, 'comment', e.target.value)}
                              placeholder="Review comment..."
                              style={{ marginBottom: '0.4rem' }}
                            />
                            <input
                              type="text"
                              className="builder-input input-sm"
                              value={rev.location || ''}
                              onChange={(e) => updateReviewItem(rIdx, 'location', e.target.value)}
                              placeholder="City / Role (e.g. Chennai • Verified Buyer)"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 11. IMAGE_LOOKBOOK */}
                {selectedSection.type === 'IMAGE_LOOKBOOK' && (
                  <div className="inspector-fields-stack">
                    <div className="builder-field-card">
                      <div className="builder-input-group">
                        <label className="builder-field-label">
                          <span>Lookbook Title</span>
                        </label>
                        <input
                          type="text"
                          className="builder-input"
                          value={selectedSection.data?.title || ''}
                          onChange={(e) => updateSelectedSectionData('title', e.target.value)}
                          placeholder="Store Showcase & Visual Lookbook"
                        />
                      </div>

                      <div className="builder-input-group">
                        <label className="builder-field-label">
                          <span>Lookbook Subtitle</span>
                        </label>
                        <input
                          type="text"
                          className="builder-input"
                          value={selectedSection.data?.subtitle || ''}
                          onChange={(e) => updateSelectedSectionData('subtitle', e.target.value)}
                          placeholder="Step inside our store atmosphere and curated collections"
                        />
                      </div>
                    </div>

                    {/* Dynamic Photos Manager */}
                    <div className="builder-field-card">
                      <div className="builder-card-header" style={{ justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <ImageIcon size={15} color={primaryColor} />
                          <span className="builder-card-title">Gallery Photos ({(selectedSection.data?.items || []).length})</span>
                        </div>
                        <button
                          type="button"
                          onClick={addLookbookItem}
                          className="btn btn-secondary btn-xs btn-add-link"
                        >
                          <Plus size={12} /> <span>Add Photo</span>
                        </button>
                      </div>

                      <div className="dynamic-items-editor-stack" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                        {(selectedSection.data?.items || []).map((item, lIdx) => (
                          <div key={lIdx} className="dynamic-item-card" style={{ padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Photo #{lIdx + 1}</span>
                              <button
                                type="button"
                                onClick={() => deleteLookbookItem(lIdx)}
                                className="btn-icon-action delete"
                                title="Remove Photo"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                            {item.imageUrl && (
                              <div style={{ width: '100%', height: '90px', borderRadius: '6px', overflow: 'hidden', marginBottom: '0.4rem', border: '1px solid #e2e8f0' }}>
                                <img
                                  src={item.imageUrl}
                                  alt="Preview"
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                              </div>
                            )}
                            <div className="builder-input-group" style={{ marginBottom: '0.4rem' }}>
                              <label className="builder-field-label" style={{ fontSize: '0.75rem' }}>Image URL</label>
                              <input
                                type="url"
                                className="builder-input input-sm"
                                value={item.imageUrl || ''}
                                onChange={(e) => updateLookbookItem(lIdx, 'imageUrl', e.target.value)}
                                placeholder="https://images.unsplash.com/..."
                              />
                            </div>
                            <div className="builder-input-group">
                              <label className="builder-field-label" style={{ fontSize: '0.75rem' }}>Caption / Hover Text</label>
                              <input
                                type="text"
                                className="builder-input input-sm"
                                value={item.caption || ''}
                                onChange={(e) => updateLookbookItem(lIdx, 'caption', e.target.value)}
                                placeholder="Flagship Store Experience"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 12. TRUST_BADGES */}
                {selectedSection.type === 'TRUST_BADGES' && (
                  <div className="inspector-fields-stack">
                    <div className="builder-field-card">
                      <div className="builder-card-header">
                        <ShieldCheck size={16} color={primaryColor} />
                        <span className="builder-card-title">Value Proposition & Trust Strip</span>
                      </div>
                      <p className="builder-field-hint" style={{ margin: '0 0 0.5rem 0' }}>
                        Displays 4 certified store guarantees: Express Dispatch, 100% Genuine, Flexible Payments & WhatsApp Support.
                      </p>
                      <div className="trust-badges-preview-grid">
                        <div className="trust-pill-preview">
                          <Zap size={14} color="#f59e0b" /> <span>Express Dispatch</span>
                        </div>
                        <div className="trust-pill-preview">
                          <ShieldCheck size={14} color="#10b981" /> <span>100% Genuine</span>
                        </div>
                        <div className="trust-pill-preview">
                          <CreditCard size={14} color="#3b82f6" /> <span>Flexible Payments</span>
                        </div>
                        <div className="trust-pill-preview">
                          <Phone size={14} color="#982A86" /> <span>Direct Support</span>
                        </div>
                      </div>
                    </div>
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
                {/* Store Announcement Bar */}
                {config.announcement?.enabled !== false && config.announcement?.text && (
                  <div className="clean-announcement-strip" style={{ background: primaryColor }}>
                    <Sparkles size={13} />
                    <span>{config.announcement.text}</span>
                  </div>
                )}

                {/* Top Contact Utility Strip (if contact info present) */}
                {(config.contact?.address || config.contact?.phone) && (
                  <div className="clean-top-utility-strip">
                    <div className="utility-strip-inner">
                      <div className="utility-left">
                        {config.contact?.address && <span><MapPin size={11} /> {config.contact.address}</span>}
                        {config.contact?.phone && <span><Phone size={11} /> {config.contact.phone}</span>}
                      </div>
                      <div className="utility-right">
                        <span>⚡ Verified Official Online Store</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Main Store Header */}
                <header
                  className={`clean-store-header interactive-canvas-header ${selectedSectionId === 'HEADER_NAVBAR' ? 'is-selected' : ''}`}
                  onClick={() => {
                    setSelectedSectionId('HEADER_NAVBAR');
                    setActiveTab('inspector');
                  }}
                  title="Click to configure Store Header, Branding & Navigation"
                >
                  {selectedSectionId === 'HEADER_NAVBAR' && (
                    <div className="canvas-header-selected-indicator">
                      <Settings size={12} />
                      <span>Configuring Store Header & Navigation</span>
                    </div>
                  )}
                  <div className="clean-header-container">
                    <div className="clean-brand-section">
                      <div className="clean-brand-avatar" style={{ background: config.branding?.logoUrl ? 'transparent' : primaryColor }}>
                        {config.branding?.logoUrl ? (
                          <img src={config.branding.logoUrl} alt="Store" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '12px' }} />
                        ) : (
                          <Store size={22} />
                        )}
                      </div>
                      <div className="clean-brand-text">
                        <h1 className="clean-store-title">{config.branding?.storeName || 'My Online Store'}</h1>
                      </div>
                    </div>

                    <nav className="clean-nav-menu">
                      {(config.navbar?.navLinks || DEFAULT_NAV_LINKS).filter((l) => l.enabled !== false).map((l) => (
                        <span key={l.id || l.label} className="clean-nav-link">{l.label}</span>
                      ))}
                    </nav>

                    <div className="clean-header-actions">
                      <button type="button" className="btn-clean-cart">
                        <ShoppingBag size={17} />
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
                    const blockDef = AVAILABLE_BLOCK_TYPES.find((b) => b.type === sec.type);
                    const blockDisplayName = blockDef?.name || sec.type;

                    return (
                      <React.Fragment key={sec.id || idx}>
                        {/* Elementor-style Between-Block Add Divider */}
                        <div
                          className="canvas-between-dropzone"
                          onClick={(e) => {
                            e.stopPropagation();
                            setInsertAtIndex(idx);
                            setActiveTab('add');
                          }}
                        >
                          <button type="button" className="btn-between-add-block" title="Add Section Here">
                            <Plus size={12} />
                            <span>Add Section Here</span>
                          </button>
                        </div>

                        <div
                          onClick={() => {
                            setSelectedSectionId(sec.id);
                            setActiveTab('inspector');
                          }}
                          className={`modular-canvas-block ${isSelected ? 'is-selected' : ''} ${isHidden ? 'is-hidden' : ''}`}
                        >
                          {/* Elementor-style Floating Action Toolbar */}
                          <div className="canvas-block-floating-bar" onClick={(e) => e.stopPropagation()}>
                            <div className="floating-tag" style={{ color: primaryColor }}>
                              <GripVertical size={13} />
                              <span>{blockDisplayName}</span>
                            </div>
                            <div className="floating-btns-group">
                              <button
                                type="button"
                                onClick={() => moveSection(idx, 'up')}
                                disabled={idx === 0}
                                title="Move Up (↑)"
                              >
                                <ArrowUp size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => moveSection(idx, 'down')}
                                disabled={idx === config.sections.length - 1}
                                title="Move Down (↓)"
                              >
                                <ArrowDown size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedSectionId(sec.id);
                                  setActiveTab('inspector');
                                }}
                                title="Configure in Inspector (⚙)"
                              >
                                <Settings size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => duplicateSection(idx)}
                                title="Duplicate Section"
                              >
                                <CopyPlus size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteSection(idx)}
                                className="del-btn"
                                title="Delete Section"
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
                                  <div>
                                    <h4>Store Address</h4>
                                    <p>{sData.address || config.contact?.address || 'Commercial Center, Main St'}</p>
                                  </div>
                                </div>
                                <div className="clean-contact-info-card">
                                  <div className="clean-contact-icon-box" style={{ background: `${primaryColor}15`, color: primaryColor }}><Clock size={20} /></div>
                                  <div>
                                    <h4>Operating Hours</h4>
                                    <p>{sData.hours || config.contact?.hours || 'Mon - Sat: 9:00 AM - 9:00 PM'}</p>
                                  </div>
                                </div>
                                <div className="clean-contact-info-card">
                                  <div className="clean-contact-icon-box" style={{ background: `${primaryColor}15`, color: primaryColor }}><Phone size={20} /></div>
                                  <div>
                                    <h4>Direct Line</h4>
                                    <p>{sData.phone || config.contact?.phone || 'Direct Support'}</p>
                                    {(sData.whatsappNumber || config.contact?.whatsappNumber) && (
                                      <span className="contact-wa-hint">
                                        <WhatsAppBrandIcon size={12} color="#25D366" /> Direct WhatsApp Available
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </section>
                        )}
                      </div>
                    </React.Fragment>
                  );
                })}

                {/* Elementor-style Bottom Add Zone */}
                <div
                  className="canvas-bottom-add-zone"
                  onClick={() => {
                    setInsertAtIndex(config.sections.length);
                    setActiveTab('add');
                  }}
                >
                  <button type="button" className="btn-bottom-add-block">
                    <Plus size={15} />
                    <span>Add New Modular Block to Page</span>
                  </button>
                </div>
              </div>

                {/* Store Footer - Master Interactive Layer */}
                <footer
                  className={`clean-store-footer-section clean-store-footer-luxury ${selectedSectionId === 'FOOTER_MASTER' ? 'selected-canvas-footer' : ''}`}
                  onClick={() => {
                    setSelectedSectionId('FOOTER_MASTER');
                    setActiveTab('inspector');
                  }}
                  title="Click to configure Store Footer in Inspector"
                >
                  <div className="clean-footer-container">
                    <div className="clean-footer-luxury-grid">
                      {/* Col 1: Brand & Bio */}
                      <div className="clean-footer-brand-col">
                        <div className="clean-footer-brand-header">
                          <div className="clean-footer-logo-wrap" style={{ background: config.branding?.logoUrl ? 'transparent' : primaryColor }}>
                            {config.branding?.logoUrl ? (
                              <img src={config.branding.logoUrl} alt="Store Logo" />
                            ) : (
                              <Store size={20} color="#ffffff" />
                            )}
                          </div>
                          <div>
                            <h3 className="clean-footer-store-name">{config.branding?.storeName || 'My Online Store'}</h3>
                            <p className="clean-footer-tagline">{config.branding?.tagline || 'Quality Products Delivered Directly'}</p>
                          </div>
                        </div>

                        <p className="clean-footer-bio-text">
                          {config.footer?.brandBio || DEFAULT_FOOTER.brandBio}
                        </p>

                        {/* Social Links */}
                        {config.footer?.showSocials !== false && (
                          <div className="clean-footer-social-row">
                            {config.footer?.socials?.whatsapp && (
                              <a href={`https://wa.me/${config.footer.socials.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="social-icon-btn whatsapp" onClick={(e) => e.stopPropagation()}>
                                <WhatsAppBrandIcon size={15} color="#25D366" />
                              </a>
                            )}
                            {config.footer?.socials?.instagram && (
                              <a href={config.footer.socials.instagram} target="_blank" rel="noreferrer" className="social-icon-btn instagram" onClick={(e) => e.stopPropagation()}>
                                <Instagram size={15} />
                              </a>
                            )}
                            {config.footer?.socials?.facebook && (
                              <a href={config.footer.socials.facebook} target="_blank" rel="noreferrer" className="social-icon-btn facebook" onClick={(e) => e.stopPropagation()}>
                                <Facebook size={15} />
                              </a>
                            )}
                            {config.footer?.socials?.twitter && (
                              <a href={config.footer.socials.twitter} target="_blank" rel="noreferrer" className="social-icon-btn twitter" onClick={(e) => e.stopPropagation()}>
                                <Twitter size={15} />
                              </a>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Col 2: Column 1 Quick Links */}
                      <div className="clean-footer-links-col">
                        <h4 className="clean-footer-col-title">{config.footer?.col1Title || 'Quick Links'}</h4>
                        <ul className="clean-footer-links-list">
                          {(config.footer?.col1Links || DEFAULT_FOOTER.col1Links).map((link, idx) => (
                            <li key={link.id || idx}>
                              <a href={link.url || '#'} onClick={(e) => e.preventDefault()}>{link.label}</a>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Col 3: Column 2 Policy Links */}
                      <div className="clean-footer-links-col">
                        <h4 className="clean-footer-col-title">{config.footer?.col2Title || 'Customer Care'}</h4>
                        <ul className="clean-footer-links-list">
                          {(config.footer?.col2Links || DEFAULT_FOOTER.col2Links).map((link, idx) => (
                            <li key={link.id || idx}>
                              <a href={link.url || '#'} onClick={(e) => e.preventDefault()}>{link.label}</a>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Col 4: Store Support & Location */}
                      <div className="clean-footer-contact-col">
                        <h4 className="clean-footer-col-title">Store & Contact</h4>
                        <ul className="clean-footer-contact-details">
                          <li>
                            <MapPin size={15} color={accentColor} />
                            <span>{config.contact?.address || 'Commercial Center, Main St'}</span>
                          </li>
                          <li>
                            <Clock size={15} color={accentColor} />
                            <span>{config.contact?.hours || 'Mon - Sat: 9:00 AM - 9:00 PM'}</span>
                          </li>
                          {config.contact?.phone && (
                            <li>
                              <Phone size={15} color={accentColor} />
                              <span>{config.contact.phone}</span>
                            </li>
                          )}
                        </ul>

                        {(config.contact?.whatsappNumber || config.contact?.phone) && (
                          <div className="clean-footer-wa-action">
                            <a
                              href={`https://wa.me/${(config.contact?.whatsappNumber || config.contact?.phone).replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="btn-footer-whatsapp"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <WhatsAppBrandIcon size={16} color="#25D366" />
                              <span>Instant WhatsApp Chat</span>
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Bar: Copyright & Payment Badges */}
                    <div className="clean-footer-bottom-luxury">
                      <div className="footer-bottom-left">
                        <p>© {new Date().getFullYear()} {config.branding?.storeName || 'Store'}. {config.footer?.copyrightText || DEFAULT_FOOTER.copyrightText}</p>
                        <p className="clean-powered-tag">Powered by <strong>StockPilot IMS</strong></p>
                      </div>

                      {config.footer?.showPaymentBadges !== false && (
                        <div className="clean-footer-payment-badges-row">
                          {config.footer?.paymentBadges?.upi !== false && (
                            <span className="payment-badge-pill">UPI</span>
                          )}
                          {config.footer?.paymentBadges?.cards !== false && (
                            <span className="payment-badge-pill">RuPay / Cards</span>
                          )}
                          {config.footer?.paymentBadges?.netbanking !== false && (
                            <span className="payment-badge-pill">Net Banking</span>
                          )}
                          {config.footer?.paymentBadges?.cod !== false && (
                            <span className="payment-badge-pill">Cash on Delivery</span>
                          )}
                          {config.footer?.paymentBadges?.genuine !== false && (
                            <span className="payment-badge-pill genuine"><ShieldCheck size={12} color="#10b981" /> 100% Genuine</span>
                          )}
                        </div>
                      )}
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
