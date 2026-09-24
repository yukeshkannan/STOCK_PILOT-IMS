import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Check,
  Warehouse,
  ShoppingBag,
  ShoppingCart,
  Receipt,
  TrendingUp,
  LogIn,
  Scan,
  Plus,
  Minus,
  Printer,
  ChevronDown,
  Layers,
  Sparkles,
  BarChart3,
  Building2,
  HelpCircle,
  Zap
} from 'lucide-react';
import logoImg from '../../assets/logo.png';
import './LandingPage.css';

const DEMO_PRODUCTS = [
  { id: 'SKU-001', name: 'Premium Cotton Polo Shirt', price: 799, tax: 18, category: 'Apparel', stock: 45 },
  { id: 'SKU-002', name: 'Artisan Coffee Beans (500g)', price: 450, tax: 5, category: 'Beverage', stock: 120 },
  { id: 'SKU-003', name: 'Wireless Earbuds Pro Gen-2', price: 1999, tax: 18, category: 'Electronics', stock: 28 },
  { id: 'SKU-004', name: 'Organic Cold-Pressed Oil 1L', price: 340, tax: 5, category: 'Grocery', stock: 80 }
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [billingPeriod, setBillingPeriod] = useState('monthly'); // 'monthly' | 'annual'

  // Interactive Live POS Simulator state
  const [posCart, setPosCart] = useState([
    { ...DEMO_PRODUCTS[0], qty: 1 },
    { ...DEMO_PRODUCTS[1], qty: 2 }
  ]);
  const [simulatedBillPrinted, setSimulatedBillPrinted] = useState(false);

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  const getDashboardLink = () => {
    if (user?.isSuperAdmin) return '/admin';
    return '/dashboard';
  };

  // Cart Handlers
  const handleAddToCart = (product) => {
    setSimulatedBillPrinted(false);
    setPosCart((prev) => {
      const exists = prev.find((item) => item.id === product.id);
      if (exists) {
        return prev.map((item) => (item.id === product.id ? { ...item, qty: item.qty + 1 } : item));
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const handleUpdateQty = (productId, delta) => {
    setSimulatedBillPrinted(false);
    setPosCart((prev) =>
      prev
        .map((item) => {
          if (item.id === productId) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const posSubtotal = useMemo(() => {
    return posCart.reduce((sum, item) => sum + item.price * item.qty, 0);
  }, [posCart]);

  const posTax = useMemo(() => {
    return Math.round(posCart.reduce((sum, item) => sum + (item.price * item.qty * item.tax) / 100, 0));
  }, [posCart]);

  const posGrandTotal = posSubtotal + posTax;

  // Real, Synchronized Pricing Plans matching SubscriptionPage
  const pricingPlans = [
    {
      id: 'STARTER',
      name: 'Starter',
      badge: 'SINGLE STORE & BOUTIQUE',
      price: billingPeriod === 'annual' ? '₹4,990' : '₹499',
      period: billingPeriod === 'annual' ? '/year' : '/month',
      billed: billingPeriod === 'annual' ? 'Billed annually (save 20%)' : 'Billed monthly',
      desc: 'Essential inventory and barcode POS billing for independent retail outlets.',
      features: [
        '2 Warehouse / Store Outlets',
        'Up to 5 Staff Accounts (RBAC)',
        'Barcode POS & Thermal Receipt Printing',
        'Inter-Store Stock Transfers & Approvals',
        'Purchase Orders & Supplier Inwarding',
        'Tax Invoices & Digital E-Bill Links',
        'Standard Email & Chat Support'
      ],
      popular: false,
      cta: 'Start 14-Day Free Trial'
    },
    {
      id: 'PRO',
      name: 'Pro Growth',
      badge: 'MOST POPULAR FOR MULTI-STORE',
      price: billingPeriod === 'annual' ? '₹14,990' : '₹1,499',
      period: billingPeriod === 'annual' ? '/year' : '/month',
      billed: billingPeriod === 'annual' ? 'Billed annually (save 20%)' : 'Billed monthly',
      desc: 'Complete logistics, safety thresholds, and financial telemetry for growing retail chains.',
      features: [
        '5 Warehouses & Retail Stores',
        'Up to 15 Team Members',
        'High-Speed Multi-Counter POS Terminal',
        'Automated Low Stock Safety Alerts',
        'Purchase Return (RMA) & Credit Notes',
        'Live Gross Profit & COGS Telemetry',
        'GST Breakdown & B2B Tax Filing Reports',
        'Priority Phone & Ticket Support'
      ],
      popular: true,
      cta: 'Start 14-Day Free Trial'
    },
    {
      id: 'ENTERPRISE',
      name: 'Enterprise',
      badge: 'LARGE SCALE HUBS',
      price: billingPeriod === 'annual' ? '₹39,990' : '₹3,999',
      period: billingPeriod === 'annual' ? '/year' : '/month',
      billed: billingPeriod === 'annual' ? 'Billed annually (save 20%)' : 'Billed monthly',
      desc: 'Dedicated enterprise infrastructure with custom ERP, weighing scales & hardware SLAs.',
      features: [
        'Unlimited Warehouses & Outlets',
        'Unlimited Team Members',
        'Multi-Branch GSTIN & Company Code Hub',
        'Dedicated Tenant Database & Auto-Backups',
        'Custom Hardware & Weighing Scale API',
        'Full Audit Trail & Security Logs',
        'Dedicated Account Manager & 99.99% SLA'
      ],
      popular: false,
      cta: 'Start 14-Day Free Trial'
    }
  ];

  // Core Platform Modules (Real-world concise pillars)
  const platformFeatures = [
    {
      icon: Warehouse,
      title: 'Multi-Warehouse Logistics',
      desc: 'Track stock across central hubs and retail branches with automated in-transit tracking, safety stock levels, and transfer approvals.',
      tag: 'Logistics'
    },
    {
      icon: ShoppingBag,
      title: 'High-Speed POS & Billing',
      desc: 'Lightning-fast barcode lookup, split payments (UPI, Cash, Card), instant thermal receipt printing, and WhatsApp digital e-bills.',
      tag: 'Retail POS'
    },
    {
      icon: ShoppingCart,
      title: 'Procurement & Auto POs',
      desc: 'Create vendor purchase orders based on reorder points. Manage Goods Received Notes (GRN) and track purchase returns seamlessly.',
      tag: 'Procurement'
    },
    {
      icon: TrendingUp,
      title: 'Real-Time Profit Telemetry',
      desc: 'Automated weighted-average COGS calculations, live gross profit margins, and branch-level inventory valuation.',
      tag: 'Analytics'
    }
  ];

  // Real-world FAQs
  const faqs = [
    {
      q: 'How does the 14-day free trial work?',
      a: 'You get full access to all StockPilot features for 14 days without entering any credit card or payment information. You can create warehouses, add products, and test POS billing immediately.'
    },
    {
      q: 'Can I create a public online storefront for customer catalog orders?',
      a: 'Yes! StockPilot includes a built-in public e-commerce storefront builder where your customers can browse live products, view catalogs, and place orders directly.'
    },
    {
      q: 'How does inter-store stock transfer and approvals work?',
      a: 'You can initiate stock transfers between any of your warehouses. Stock is tracked as "in-transit" in real-time until the receiving branch manager inspects and approves the delivery.'
    },
    {
      q: 'Is StockPilot accessible as a mobile app (PWA)?',
      a: 'Yes. StockPilot is a Progressive Web App (PWA). You can install it on Android, iOS, Windows, and Mac for fast full-screen counter billing and offline resilience.'
    }
  ];

  return (
    <div className="landing-container">
      {/* ========================================================================= */}
      {/* NAVBAR                                                                    */}
      {/* ========================================================================= */}
      <header className="landing-header">
        <div className="landing-header-inner">
          {/* Brand Logo */}
          <Link to="/" className="landing-brand">
            <div className="brand-icon-box">
              <img src={logoImg} alt="StockPilot" className="brand-logo-img" />
            </div>
            <span className="brand-title">
              <span>Stock</span>
              <span style={{ color: '#982A86' }}>Pilot</span>
            </span>
          </Link>

          {/* Clean Real SaaS Navigation Links */}
          <nav className="landing-nav">
            <a href="#features" className="nav-link">Features</a>
            <a href="#demo-sandbox" className="nav-link">Live POS Demo</a>
            <a href="#pricing" className="nav-link">Pricing</a>
            <a href="#faq" className="nav-link">FAQ</a>
          </nav>

          {/* Right Action CTAs */}
          <div className="landing-actions">
            {isAuthenticated ? (
              <Link to={getDashboardLink()} className="btn-nav-primary">
                <span>Go to Workspace</span>
                <ArrowRight size={15} />
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn-nav-ghost">
                  <LogIn size={15} />
                  <span>Sign In</span>
                </Link>
                <Link to="/register" className="btn-nav-primary">
                  <span>Start Free Trial</span>
                  <ArrowRight size={15} />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* HERO SECTION                                                              */}
      {/* ========================================================================= */}
      <section className="landing-hero">
        <div className="hero-inner-box">
          <h1 className="hero-title">
            Smart Inventory, Multi-Store POS <br />
            <span className="hero-title-accent">&amp; Warehouse Logistics.</span>
          </h1>

          <p className="hero-subtitle">
            A unified cloud system to track inventory across warehouses, execute instant barcode POS billing, and automate supplier procurement with zero stock discrepancies.
          </p>

          <div className="hero-ctas">
            {isAuthenticated ? (
              <Link to={getDashboardLink()} className="btn-hero-primary">
                <span>Open Workspace</span>
                <ArrowRight size={17} />
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn-hero-primary">
                  <span>Start 14-Day Free Trial</span>
                  <ArrowRight size={17} />
                </Link>
                <a href="#demo-sandbox" className="btn-hero-secondary">
                  <Scan size={17} />
                  <span>Try Interactive POS Demo</span>
                </a>
              </>
            )}
          </div>

          {/* Realtime Trust Indicators */}
          <div className="hero-trust-row">
            <div className="trust-item">
              <CheckCircle2 size={16} className="text-emerald" />
              <span>No Credit Card Required</span>
            </div>
            <span className="trust-dot">•</span>
            <div className="trust-item">
              <CheckCircle2 size={16} className="text-emerald" />
              <span>Multi-Warehouse Ready</span>
            </div>
            <span className="trust-dot">•</span>
            <div className="trust-item">
              <CheckCircle2 size={16} className="text-emerald" />
              <span>GST &amp; E-Way Bill Compliant</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* INTERACTIVE LIVE POS BILLING SANDBOX                                      */}
      {/* ========================================================================= */}
      <section id="demo-sandbox" className="landing-section demo-sandbox-section">
        <div className="section-header">
          <span className="section-tag">LIVE INTERACTIVE DEMO</span>
          <h2 className="section-title">Experience Ultra-Fast POS Billing</h2>
          <p className="section-subtitle">
            Tap items below to add to cart and watch instant GST calculations and receipt generation in action.
          </p>
        </div>

        <div className="pos-sandbox-container">
          <div className="sandbox-grid">
            {/* Left: Product Selector */}
            <div className="sandbox-products-pane">
              <div className="pane-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Scan size={18} style={{ color: '#982A86' }} />
                  <h4>Quick Catalog Tap &amp; Scan</h4>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Tap to Add</span>
              </div>

              <div className="sandbox-items-grid">
                {DEMO_PRODUCTS.map((prod) => (
                  <button
                    key={prod.id}
                    onClick={() => handleAddToCart(prod)}
                    className="sandbox-item-card"
                    type="button"
                  >
                    <div className="item-card-top">
                      <span className="item-category-tag">{prod.category}</span>
                      <span className="item-stock-tag">{prod.stock} in stock</span>
                    </div>
                    <div className="item-name">{prod.name}</div>
                    <div className="item-bottom">
                      <span className="item-price">₹{prod.price}</span>
                      <span className="btn-add-tag">+ Add</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Live POS Cart Simulator */}
            <div className="sandbox-cart-pane">
              <div className="pane-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Receipt size={18} style={{ color: '#982A86' }} />
                  <h4>Live Billing Counter</h4>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 700 }}>● Instant Sync</span>
              </div>

              <div className="sandbox-cart-list">
                {posCart.length === 0 ? (
                  <div className="empty-cart-msg">
                    <span>Cart is empty. Tap items on the left to add!</span>
                  </div>
                ) : (
                  posCart.map((item) => (
                    <div key={item.id} className="sandbox-cart-row">
                      <div className="cart-row-info">
                        <span className="cart-item-title">{item.name}</span>
                        <span className="cart-item-meta">₹{item.price} each • {item.tax}% GST</span>
                      </div>
                      <div className="cart-qty-ctrls">
                        <button onClick={() => handleUpdateQty(item.id, -1)} className="btn-qty-mini" type="button">
                          <Minus size={12} />
                        </button>
                        <span className="qty-val">{item.qty}</span>
                        <button onClick={() => handleUpdateQty(item.id, 1)} className="btn-qty-mini" type="button">
                          <Plus size={12} />
                        </button>
                      </div>
                      <div className="cart-item-total">₹{(item.price * item.qty).toLocaleString('en-IN')}</div>
                    </div>
                  ))
                )}
              </div>

              {/* Totals & Simulated Print */}
              <div className="sandbox-cart-summary">
                <div className="summary-line">
                  <span>Subtotal</span>
                  <span>₹{posSubtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="summary-line">
                  <span>Estimated GST (CGST + SGST)</span>
                  <span>₹{posTax.toLocaleString('en-IN')}</span>
                </div>
                <div className="summary-line total-line">
                  <span>Grand Total</span>
                  <span className="grand-val">₹{posGrandTotal.toLocaleString('en-IN')}</span>
                </div>

                <div className="sandbox-actions-row">
                  <button
                    onClick={() => setSimulatedBillPrinted(true)}
                    disabled={posCart.length === 0}
                    className="btn-print-simulator"
                    type="button"
                  >
                    <Printer size={16} />
                    <span>{simulatedBillPrinted ? '✓ Thermal Receipt Ready' : 'Simulate Instant Print & E-Bill'}</span>
                  </button>
                  <Link to="/register" className="btn-sandbox-signup">
                    <span>Get Real App</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* CORE CAPABILITIES                                                         */}
      {/* ========================================================================= */}
      <section id="features" className="landing-section">
        <div className="section-header">
          <span className="section-tag">CORE PLATFORM PILLARS</span>
          <h2 className="section-title">Built for Multi-Location Retail &amp; Logistics</h2>
          <p className="section-subtitle">
            Everything your business needs to eliminate stock shrinkage, speed up counter sales, and automate replenishment.
          </p>
        </div>

        <div className="features-grid">
          {platformFeatures.map((feat, idx) => (
            <div key={idx} className="feature-card">
              <div className="feature-card-header">
                <div className="feature-icon-box">
                  <feat.icon size={22} style={{ color: '#982A86' }} />
                </div>
                <span className="feature-tag">{feat.tag}</span>
              </div>
              <h3 className="feature-title">{feat.title}</h3>
              <p className="feature-desc">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* TRANSPARENT PRICING SECTION                                               */}
      {/* ========================================================================= */}
      <section id="pricing" className="landing-section pricing-section">
        <div className="section-header">
          <span className="section-tag">TRANSPARENT PRICING</span>
          <h2 className="section-title">Plans That Scale With Your Business</h2>
          <p className="section-subtitle">
            Every plan includes an unlimited <strong>14-Day Free Trial</strong>. Upgrade or cancel anytime.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="pricing-toggle-wrap">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`pricing-toggle-btn ${billingPeriod === 'monthly' ? 'active' : ''}`}
              type="button"
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingPeriod('annual')}
              className={`pricing-toggle-btn ${billingPeriod === 'annual' ? 'active' : ''}`}
              type="button"
            >
              Annual Billing <span className="annual-badge">Save 20%</span>
            </button>
          </div>
        </div>

        <div className="pricing-grid">
          {pricingPlans.map((plan) => (
            <div key={plan.id} className={`pricing-card ${plan.popular ? 'popular' : ''}`}>
              {plan.popular && (
                <div className="popular-ribbon">
                  ★ RECOMMENDED FOR MULTI-STORE
                </div>
              )}

              <div className="plan-header">
                <span className="plan-badge">{plan.badge}</span>
                <h3 className="plan-name">{plan.name}</h3>
                <p className="plan-desc">{plan.desc}</p>

                <div className="plan-price-row">
                  <span className="price-amount">{plan.price}</span>
                  <span className="price-cycle">{plan.period}</span>
                </div>
                <div className="plan-billing-note">
                  <span className="trial-highlight">14-Day Free Trial</span> • {plan.billed}
                </div>
              </div>

              <div className="plan-divider" />

              <ul className="plan-features-list">
                {plan.features.map((f, i) => (
                  <li key={i}>
                    <div className="bullet-icon">
                      <Check size={13} />
                    </div>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <div className="plan-cta-row">
                <Link
                  to="/register"
                  className={`btn-plan ${plan.popular ? 'btn-plan-popular' : 'btn-plan-outline'}`}
                >
                  {plan.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* FREQUENTLY ASKED QUESTIONS                                                */}
      {/* ========================================================================= */}
      <section id="faq" className="landing-section">
        <div className="section-header">
          <span className="section-tag">COMMON QUESTIONS</span>
          <h2 className="section-title">Frequently Asked Questions</h2>
          <p className="section-subtitle">
            Quick answers about hardware compatibility, free trial, and multi-location deployment.
          </p>
        </div>

        <div className="faq-container">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className={`faq-item ${openFaqIndex === idx ? 'open' : ''}`}
              onClick={() => setOpenFaqIndex(openFaqIndex === idx ? -1 : idx)}
            >
              <div className="faq-question">
                <span>{faq.q}</span>
                <ChevronDown size={18} className="faq-chevron" />
              </div>
              {openFaqIndex === idx && (
                <div className="faq-answer">
                  <p>{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* BOTTOM CTA BANNER                                                         */}
      {/* ========================================================================= */}
      <section className="landing-bottom-cta">
        <div className="bottom-cta-card">
          <div className="cta-content">
            <h2>Ready to Transform Your Retail Operations?</h2>
            <p>Join hundreds of businesses managing multi-warehouse stock and fast POS checkouts on StockPilot.</p>
          </div>
          <div className="cta-action">
            <Link to="/register" className="btn-cta-large">
              <span>Start 14-Day Free Trial</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* FOOTER                                                                    */}
      {/* ========================================================================= */}
      <footer className="landing-footer">
        <div className="footer-inner">
          <div className="footer-brand-col">
            <div className="landing-brand">
              <div className="brand-icon-box">
                <img src={logoImg} alt="StockPilot" className="brand-logo-img" />
              </div>
              <span className="brand-title">
                <span>Stock</span><span style={{ color: '#982A86' }}>Pilot</span>
              </span>
            </div>
            <p className="footer-desc">
              Enterprise Multi-Tenant Inventory, POS Billing &amp; Warehouse Logistics Platform.
            </p>
          </div>

          <div className="footer-links-col">
            <h4>Platform</h4>
            <a href="#features">Features</a>
            <a href="#demo-sandbox">Live POS Demo</a>
            <a href="#pricing">Pricing Plans</a>
            <a href="#faq">FAQ</a>
          </div>

          <div className="footer-links-col">
            <h4>Portals</h4>
            <Link to="/login">Sign In</Link>
            <Link to="/register">Create Account</Link>
            <Link to="/admin/login">Super Admin</Link>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} StockPilot Technologies Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
