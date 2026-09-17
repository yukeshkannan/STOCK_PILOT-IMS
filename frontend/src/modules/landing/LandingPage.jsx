import React, { useState } from 'react';
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
  Lock,
  LogIn
} from 'lucide-react';
import logoImg from '../../assets/logo.png';
import './LandingPage.css';

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [billingPeriod, setBillingPeriod] = useState('monthly'); // 'monthly' | 'annual'

  const getDashboardLink = () => {
    if (user?.isSuperAdmin) return '/admin';
    return '/dashboard';
  };

  // Actual Platform Pricing (in Indian Rupees ₹) from Subscription System
  const pricingPlans = [
    {
      name: 'Starter Pilot',
      badge: 'SINGLE STORE & BOUTIQUE',
      price: billingPeriod === 'annual' ? '₹4,990' : '₹499',
      period: billingPeriod === 'annual' ? '/year' : '/month',
      billed: billingPeriod === 'annual' ? 'Billed annually (₹4,990/yr)' : 'Billed monthly',
      desc: 'Ideal for independent retailers, single outlets, and high-velocity boutique counters.',
      features: [
        'Up to 1,500 Products & Barcode SKUs',
        '2 Warehouse / Store Outlets',
        'Up to 5 Staff Accounts (RBAC)',
        'High-Speed Counter POS & Thermal Printing',
        'Stock Transfers & Approvals',
        'Purchase Orders & Supplier Tracking',
        'Tax Invoices & Digital E-Bills',
        'Standard Email & Chat Support'
      ],
      popular: false,
      cta: 'Get Starter — ₹499/mo'
    },
    {
      name: 'Growth Enterprise',
      badge: 'MOST POPULAR FOR CHAINS',
      price: billingPeriod === 'annual' ? '₹14,990' : '₹1,499',
      period: billingPeriod === 'annual' ? '/year' : '/month',
      billed: billingPeriod === 'annual' ? 'Billed annually (₹14,990/yr)' : 'Billed monthly',
      desc: 'Engineered for fast-growing multi-store chains and regional distribution hubs.',
      features: [
        'Unlimited Products & Dynamic Barcodes',
        'Up to 5 Warehouses & Store Outlets',
        'Up to 15 Team Members',
        'Inter-Warehouse Stock Transfer & In-Transit Flow',
        'Automated Safety Thresholds & PO Triggers',
        'Goods Received Note (GRN) Inwarding & RMA Workflow',
        'Live COGS, Gross Profit & Financial Telemetry',
        'GST Tax Invoices & WhatsApp E-Bills',
        'Priority 24/7 Phone & Ticket Support'
      ],
      popular: true,
      cta: 'Get Growth — ₹1,499/mo'
    },
    {
      name: 'Custom Fleet',
      badge: 'LARGE SCALE ENTERPRISE',
      price: billingPeriod === 'annual' ? '₹39,990' : '₹3,999',
      period: billingPeriod === 'annual' ? '/year' : '/month',
      billed: billingPeriod === 'annual' ? 'Billed annually (₹39,990/yr)' : 'Billed monthly / Custom SLA',
      desc: 'Dedicated enterprise infrastructure with custom ERP integrations and tailored SLAs.',
      features: [
        'Unlimited Warehouses, Outlets & POS Counters',
        'Unlimited Team Members & Multi-Branch GSTIN Support',
        'Dedicated Tenant Database & Real-Time Backup',
        'Custom Hardware, Weighing Scale & ERP Integrations',
        'Custom SSO (SAML / Okta) & Audit Trail Exports',
        'Dedicated Enterprise Account Manager',
        '99.99% Guaranteed SLA Uptime Agreement'
      ],
      popular: false,
      cta: 'Get Enterprise — ₹3,999/mo'
    }
  ];

  // Core Features Grid
  const platformFeatures = [
    {
      icon: Warehouse,
      title: 'Multi-Warehouse & Hub Logistics',
      desc: 'Seamlessly transfer stock between central hubs and retail branches with automated in-transit tracking and safety stock thresholds.',
      badge: 'Logistics'
    },
    {
      icon: ShoppingBag,
      title: 'High-Speed POS & Thermal Billing',
      desc: 'Instant barcode scanning, multi-mode split payments (Cash, UPI, Card), fast thermal receipt generation, and offline resiliency.',
      badge: 'Retail POS'
    },
    {
      icon: ShoppingCart,
      title: 'Smart Procurement & Auto POs',
      desc: 'Automate vendor purchase orders based on reorder points. Manage Goods Received Notes (GRN) and track accounts payable.',
      badge: 'Procurement'
    },
    {
      icon: Receipt,
      title: 'GST Invoicing & Digital E-Bills',
      desc: 'Generate 100% tax-compliant GST invoices and send instant paperless digital bill links directly to customers.',
      badge: 'Compliance'
    },
    {
      icon: TrendingUp,
      title: 'Real-Time COGS & Financial Margins',
      desc: 'Automated weighted-average cost calculation, live gross margin telemetry, and branch-level profitability reporting.',
      badge: 'Telemetry'
    },
    {
      icon: Lock,
      title: 'Enterprise RBAC & Audit Trails',
      desc: 'Granular permissions for cashiers, store managers, and admins with tamper-proof audit trails for every stock adjustment.',
      badge: 'Security'
    }
  ];

  // 4-Step Operational Lifecycle
  const workflowSteps = [
    {
      num: '01',
      title: 'Procure & Inward',
      desc: 'Create supplier purchase orders and receive stock via Goods Received Notes (GRN) with batch tracking.'
    },
    {
      num: '02',
      title: 'Transfer & Distribute',
      desc: 'Allocate goods across warehouses and branches with dispatch approval workflows and real-time transit updates.'
    },
    {
      num: '03',
      title: 'Sell at Counter POS',
      desc: 'Cashiers scan barcodes, apply promotional discounts, accept split payments, and print thermal receipts in seconds.'
    },
    {
      num: '04',
      title: 'Analyze & Replenish',
      desc: 'Monitor live COGS, track high-margin SKUs, and let automated safety alerts trigger new procurement cycles.'
    }
  ];

  return (
    <div className="landing-container" data-theme="light">
      {/* Navigation Bar */}
      <header className="landing-header">
        <div className="landing-header-inner">
          <div className="landing-brand">
            <div className="brand-icon-box">
              <img src={logoImg} alt="StockPilot" className="brand-logo-img" />
            </div>
            <span className="brand-title">StockPilot</span>
          </div>

          <nav className="landing-nav">
            <a href="#features" className="nav-link">Features</a>
            <a href="#workflow" className="nav-link">How It Works</a>
            <a href="#pricing" className="nav-link">Pricing Plans</a>
            <Link to="/login" className="nav-link">Sign In</Link>
          </nav>

          <div className="landing-actions">
            {isAuthenticated ? (
              <Link to={getDashboardLink()} className="btn-landing-primary">
                <span>Dashboard</span>
                <ArrowRight size={15} />
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn-landing-signin">
                  <span>Sign In</span>
                </Link>
                <Link to="/register" className="btn-landing-primary">
                  <span>Get Started</span>
                  <ArrowRight size={14} className="landing-btn-arrow" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="landing-hero">
        <h1 className="hero-title hero-title-stitch">
          Inventory Management <br />
          Software for Fast–Growing <br />
          <span className="hero-title-highlight">Multi–Store Retailers</span>
        </h1>

        <p className="hero-subtitle hero-subtitle-stitch">
          Seamlessly synchronize multi-channel inventory, high-speed POS billing, digital e-invoices, and automated warehouse replenishment across all your outlets and central hubs.
        </p>

        <div className="hero-cta-group hero-cta-stitch">
          {isAuthenticated ? (
            <Link to={getDashboardLink()} className="btn-hero-primary-stitch">
              <span>Go to Workspace Dashboard</span>
              <ArrowRight size={18} />
            </Link>
          ) : (
            <>
              <Link to="/register" className="btn-hero-primary-stitch">
                <span>Start 14-Day Free Trial</span>
                <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="btn-hero-secondary-stitch">
                <LogIn size={18} />
                <span>Sign In to Workspace</span>
              </Link>
            </>
          )}
        </div>

        {!isAuthenticated && (
          <div className="hero-existing-user-hint">
            <span>Already registered? </span>
            <Link to="/login" className="hero-login-inline-link">
              Sign in to your account &rarr;
            </Link>
          </div>
        )}

        {/* Trust Proof Badges */}
        <div className="hero-trust-bar-stitch">
          <div className="trust-item-stitch">
            <CheckCircle2 size={16} className="text-emerald" />
            <span>Used by 1,400+ retail brands</span>
          </div>
          <span className="trust-dot">•</span>
          <div className="trust-item-stitch">
            <CheckCircle2 size={16} className="text-blue" />
            <span>99.99% Cloud Uptime</span>
          </div>
          <span className="trust-dot">•</span>
          <div className="trust-item-stitch">
            <CheckCircle2 size={16} className="text-primary" />
            <span>GST &amp; E-Way Bill Ready</span>
          </div>
        </div>
      </section>

      {/* SECTION 1: Core Features & Capabilities */}
      <section id="features" className="landing-section features-section">
        <div className="section-header">
          <span className="section-tag">CORE PLATFORM MODULES</span>
          <h2 className="section-title">Built for Multi-Location Retail &amp; Logistics</h2>
          <p className="section-subtitle">
            Everything your business needs to eliminate stock discrepancies, speed up billing, and automate replenishment.
          </p>
        </div>

        <div className="features-grid-custom">
          {platformFeatures.map((feat, idx) => (
            <div key={idx} className="feature-card-custom">
              <div className="feature-card-header">
                <div className="feature-icon-box">
                  <feat.icon size={22} />
                </div>
                <span className="feature-badge-pill">{feat.badge}</span>
              </div>
              <h3 className="feature-card-title">{feat.title}</h3>
              <p className="feature-card-desc">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 2: 4-Step Operational Lifecycle */}
      <section id="workflow" className="landing-section workflow-section">
        <div className="section-header">
          <span className="section-tag">OPERATIONAL LIFECYCLE</span>
          <h2 className="section-title">How StockPilot Powers Your Daily Flow</h2>
          <p className="section-subtitle">
            From initial purchase order to final point-of-sale checkout, every unit is tracked in real time.
          </p>
        </div>

        <div className="workflow-grid-custom">
          {workflowSteps.map((step, idx) => (
            <div key={idx} className="workflow-card-custom">
              <div className="workflow-step-num">{step.num}</div>
              <h3 className="workflow-step-title">{step.title}</h3>
              <p className="workflow-step-desc">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Transparent Pricing Cards (Indian Rupees ₹) */}
      <section id="pricing" className="landing-section pricing-section">
        <div className="section-header">
          <span className="section-tag">TRANSPARENT PRICING</span>
          <h2 className="section-title">Plans That Grow With Your Business</h2>
          <p className="section-subtitle">
            Every plan includes an unlimited <strong>14-Day Free Trial</strong>. No credit card required to start.
          </p>
        </div>

        <div className="pricing-grid-stitch">
          {pricingPlans.map((plan, idx) => (
            <div key={idx} className={`pricing-card-stitch ${plan.popular ? 'popular' : ''}`}>
              {plan.popular && (
                <div className="popular-badge-stitch">
                  ⭐ Recommended for Multi-Store
                </div>
              )}
              
              <div className="plan-header-stitch">
                <span className="plan-tag-stitch">{plan.badge}</span>
                <h3 className="plan-name-stitch">{plan.name}</h3>
                <p className="plan-desc-stitch">{plan.desc}</p>
                
                <div className="plan-price-stitch">
                  <span className="price-val-stitch">{plan.price}</span>
                  <span className="price-period-stitch">{plan.period}</span>
                </div>
                <span className="plan-billed-stitch">
                  <span className="trial-sub-highlight">14-Day Free Trial</span> • {plan.billed}
                </span>
              </div>

              <div className="plan-divider-stitch" />

              <ul className="plan-features-stitch">
                {plan.features.map((f, i) => (
                  <li key={i}>
                    <div className="feature-bullet-circle">
                      <Check size={13} className="bullet-check" />
                    </div>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <div className="plan-cta-wrapper-stitch">
                <Link
                  to="/register"
                  className={`btn-plan-stitch ${plan.popular ? 'btn-plan-stitch-popular' : 'btn-plan-stitch-regular'}`}
                >
                  {plan.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Clean Footer */}
      <footer className="landing-footer">
        <div className="footer-inner">
          <div className="footer-brand-col">
            <div className="landing-brand">
              <div className="brand-icon-box">
                <img src={logoImg} alt="StockPilot" className="brand-logo-img" />
              </div>
              <span className="brand-title">StockPilot</span>
            </div>
            <p className="footer-desc">
              Enterprise Multi-Tenant Inventory, POS Billing, Multi-Warehouse Transfers &amp; Financial Telemetry Platform.
            </p>
          </div>

          <div className="footer-links-group">
            <div className="footer-col">
              <h4>Quick Links</h4>
              <a href="#features">Features</a>
              <a href="#workflow">How It Works</a>
              <a href="#pricing">Pricing Plans</a>
              <Link to="/login">Sign In</Link>
            </div>
            <div className="footer-col">
              <h4>Portals</h4>
              <Link to="/login">Tenant Portal</Link>
              <Link to="/admin/login">Super Admin</Link>
              <Link to="/register">Create Account</Link>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} StockPilot Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
