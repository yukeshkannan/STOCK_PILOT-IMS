import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';
import {
  Sparkles,
  Building2,
  Receipt,
  PackagePlus,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X,
  Plus,
  Loader2,
  Store,
  UploadCloud,
  Check,
  Zap
} from 'lucide-react';
import './OnboardingWizardModal.css';

const SAMPLE_STARTER_PRODUCTS = [
  {
    name: 'Thermal POS Receipt Printer (80mm USB)',
    categoryName: 'Electronics',
    purchasePrice: 2200,
    sellingPrice: 3499,
    taxRate: 18,
    initialStock: 15,
    unit: 'PCS'
  },
  {
    name: 'Thermal Receipt Paper Rolls (80mm - Box of 24)',
    categoryName: 'Store Supplies',
    purchasePrice: 450,
    sellingPrice: 850,
    taxRate: 12,
    initialStock: 40,
    unit: 'BOX'
  },
  {
    name: 'Cash Register Drawer Steel 4-Slot',
    categoryName: 'Hardware',
    purchasePrice: 1800,
    sellingPrice: 2800,
    taxRate: 18,
    initialStock: 8,
    unit: 'UNIT'
  },
  {
    name: 'Heavy Duty Storage & Shipping Box (Set of 25)',
    categoryName: 'Store Supplies',
    purchasePrice: 400,
    sellingPrice: 750,
    taxRate: 18,
    initialStock: 30,
    unit: 'SET'
  }
];

export default function OnboardingWizardModal({ isOpen, onClose, onComplete, defaultWarehouseId, companyName }) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Store & Brand Profile
  const [storeInfo, setStoreInfo] = useState({
    businessName: companyName || '',
    phone: '',
    address: '',
    currency: 'INR',
    logoUrl: ''
  });

  // Step 2: GST & Invoice Setup
  const [taxInfo, setTaxInfo] = useState({
    taxNumber: '',
    invoicePrefix: 'INV-2026-',
    defaultTaxRate: '18',
    enableThermalPrint: true
  });

  // Step 3: Fast Inventory Intake
  const [quickProduct, setQuickProduct] = useState({
    name: '',
    sellingPrice: '',
    purchasePrice: '',
    initialStock: '10',
    taxRate: '18'
  });
  const [seedingDemo, setSeedingDemo] = useState(false);
  const [seededCount, setSeededCount] = useState(0);

  if (!isOpen) return null;

  const handleSeedDemoProducts = async () => {
    try {
      setSeedingDemo(true);
      let created = 0;
      for (const prod of SAMPLE_STARTER_PRODUCTS) {
        try {
          await api.post('/products', {
            name: prod.name,
            purchasePrice: prod.purchasePrice,
            sellingPrice: prod.sellingPrice,
            taxRate: prod.taxRate,
            initialStock: prod.initialStock,
            unit: prod.unit,
            warehouseId: defaultWarehouseId || undefined
          });
          created++;
        } catch (e) {
          console.warn('Failed seeding item:', prod.name, e);
        }
      }
      setSeededCount(created);
      toast.success(`Successfully loaded ${created} starter products into inventory!`);
    } catch (err) {
      toast.error('Failed to load sample products.');
    } finally {
      setSeedingDemo(false);
    }
  };

  const handleAddQuickProduct = async (e) => {
    e.preventDefault();
    if (!quickProduct.name.trim() || !quickProduct.sellingPrice) {
      toast.warn('Please provide at least a Product Name and Selling Price.');
      return;
    }

    try {
      setLoading(true);
      await api.post('/products', {
        name: quickProduct.name.trim(),
        sellingPrice: parseFloat(quickProduct.sellingPrice),
        purchasePrice: parseFloat(quickProduct.purchasePrice) || Math.round(parseFloat(quickProduct.sellingPrice) * 0.7),
        taxRate: parseFloat(quickProduct.taxRate) || 18,
        initialStock: parseInt(quickProduct.initialStock, 10) || 0,
        warehouseId: defaultWarehouseId || undefined
      });
      toast.success(`Added "${quickProduct.name}" to inventory!`);
      setQuickProduct({
        name: '',
        sellingPrice: '',
        purchasePrice: '',
        initialStock: '10',
        taxRate: '18'
      });
      setSeededCount((prev) => prev + 1);
    } catch (err) {
      toast.error(err?.message || 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAndFinish = async (targetRoute = '/dashboard', openStore = false) => {
    try {
      setLoading(true);
      // Update tenant settings if tax/phone were entered
      if (taxInfo.taxNumber || storeInfo.phone || storeInfo.address) {
        try {
          await api.put('/tenants/current', {
            phone: storeInfo.phone,
            address: storeInfo.address,
            tax_number: taxInfo.taxNumber
          });
        } catch (e) {
          // ignore background update error
        }
      }

      toast.success('Workspace & Online Store ready! Welcome aboard.');
      localStorage.setItem('stockpilot_onboarding_completed', 'true');
      if (onComplete) onComplete();
      onClose();

      if (openStore) {
        window.open(`/store/${(companyName || 'store').toLowerCase().replace(/[^a-z0-9]/g, '-')}`, '_blank');
      }
      navigate(targetRoute);
    } catch (err) {
      toast.error('Setup finished with warnings.');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="onboarding-modal-overlay">
      <div className="onboarding-modal-container">
        {/* Header with Steps */}
        <div className="onboarding-modal-header">
          <div className="onboarding-header-title">
            <div className="onboarding-badge-icon">
              <Sparkles size={18} className="text-brand-sparkle" />
            </div>
            <div>
              <h3>Welcome to StockPilot!</h3>
              <p>Let's get your store completely ready for sales in 3 easy steps.</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-close-onboarding" title="Skip Wizard">
            <X size={20} />
          </button>
        </div>

        {/* Stepper Indicator */}
        <div className="onboarding-stepper">
          <div className={`step-pill ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'done' : ''}`}>
            <span className="step-num">{currentStep > 1 ? <Check size={14} /> : '1'}</span>
            <span className="step-label">Store &amp; Branding</span>
          </div>
          <div className="step-connector" />
          <div className={`step-pill ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'done' : ''}`}>
            <span className="step-num">{currentStep > 2 ? <Check size={14} /> : '2'}</span>
            <span className="step-label">GST &amp; Invoices</span>
          </div>
          <div className="step-connector" />
          <div className={`step-pill ${currentStep === 3 ? 'active' : ''}`}>
            <span className="step-num">3</span>
            <span className="step-label">Fast Inventory</span>
          </div>
        </div>

        {/* Step Body */}
        <div className="onboarding-modal-body">
          {/* STEP 1: Store & Brand Profile */}
          {currentStep === 1 && (
            <div className="step-content animate-fade-in">
              <div className="step-hero">
                <Store size={28} className="step-hero-icon" />
                <div>
                  <h4>Store Profile &amp; Location</h4>
                  <p>Confirm your business details to print on POS receipts and invoices.</p>
                </div>
              </div>

              <div className="onboarding-form-grid">
                <div className="form-group-full">
                  <label>Business / Outlet Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Maruthi Super Store"
                    value={storeInfo.businessName}
                    onChange={(e) => setStoreInfo({ ...storeInfo, businessName: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Customer Support Phone / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={storeInfo.phone}
                    onChange={(e) => setStoreInfo({ ...storeInfo, phone: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Store Currency</label>
                  <select
                    value={storeInfo.currency}
                    onChange={(e) => setStoreInfo({ ...storeInfo, currency: e.target.value })}
                  >
                    <option value="INR">₹ INR (Indian Rupee)</option>
                    <option value="USD">$ USD (US Dollar)</option>
                    <option value="AED">AED (UAE Dirham)</option>
                    <option value="EUR">€ EUR (Euro)</option>
                  </select>
                </div>

                <div className="form-group-full">
                  <label>Shop / Outlet Address (Printed on Bills)</label>
                  <textarea
                    rows={2}
                    placeholder="Shop #4, Main Bazaar Road, Opp. Bus Stand..."
                    value={storeInfo.address}
                    onChange={(e) => setStoreInfo({ ...storeInfo, address: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: GST & Invoice Setup */}
          {currentStep === 2 && (
            <div className="step-content animate-fade-in">
              <div className="step-hero">
                <Receipt size={28} className="step-hero-icon" />
                <div>
                  <h4>GST &amp; Invoicing Defaults</h4>
                  <p>Configure tax brackets and invoice series for instant billing.</p>
                </div>
              </div>

              <div className="onboarding-form-grid">
                <div className="form-group">
                  <label>GSTIN / Tax Number (Optional)</label>
                  <input
                    type="text"
                    placeholder="33AAAAA0000A1Z5"
                    value={taxInfo.taxNumber}
                    onChange={(e) => setTaxInfo({ ...taxInfo, taxNumber: e.target.value.toUpperCase() })}
                  />
                  <span className="field-hint">Leave blank if unregistered or composition scheme.</span>
                </div>

                <div className="form-group">
                  <label>Default GST Bracket</label>
                  <select
                    value={taxInfo.defaultTaxRate}
                    onChange={(e) => setTaxInfo({ ...taxInfo, defaultTaxRate: e.target.value })}
                  >
                    <option value="0">0% (Exempt / Nil)</option>
                    <option value="5">5% (Essential items)</option>
                    <option value="12">12% (Standard)</option>
                    <option value="18">18% (Most Common Services &amp; Goods)</option>
                    <option value="28">28% (Luxury / Auto)</option>
                  </select>
                </div>

                <div className="form-group-full">
                  <label>Invoice Number Prefix</label>
                  <input
                    type="text"
                    placeholder="INV-2026-"
                    value={taxInfo.invoicePrefix}
                    onChange={(e) => setTaxInfo({ ...taxInfo, invoicePrefix: e.target.value })}
                  />
                  <span className="field-hint">Your bills will generate as: <strong>{taxInfo.invoicePrefix}0001</strong></span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Fast Inventory Intake */}
          {currentStep === 3 && (
            <div className="step-content animate-fade-in">
              <div className="step-hero">
                <PackagePlus size={28} className="step-hero-icon" />
                <div>
                  <h4>Populate Your Inventory</h4>
                  <p>Load instant demo products or add your first retail item.</p>
                </div>
              </div>

              <div className="inventory-options-grid">
                {/* 1-Click Demo Data Seed */}
                <div className="option-seed-card">
                  <div className="seed-header">
                    <Zap size={22} className="text-amber" />
                    <div>
                      <h5>1-Click Instant Demo Pack</h5>
                      <p>Load 4 ready-to-bill retail electronics &amp; store items with stock.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleSeedDemoProducts}
                    disabled={seedingDemo || seededCount > 0}
                    className="btn-seed-action"
                  >
                    {seedingDemo ? (
                      <>
                        <Loader2 size={16} className="spinner" /> Loading items...
                      </>
                    ) : seededCount > 0 ? (
                      <>
                        <CheckCircle2 size={16} className="text-emerald" /> {seededCount} Items Loaded!
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} /> Load 4 Sample Products Now
                      </>
                    )}
                  </button>
                </div>

                <div className="or-divider-stitch">
                  <span>OR ADD MANUALLY</span>
                </div>

                {/* Quick Add Product Form */}
                <form onSubmit={handleAddQuickProduct} className="quick-product-form">
                  <div className="quick-grid">
                    <div className="form-group-full">
                      <label>Product Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Cotton T-Shirt L / 1L Sunflower Oil"
                        value={quickProduct.name}
                        onChange={(e) => setQuickProduct({ ...quickProduct, name: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Selling Price (₹) *</label>
                      <input
                        type="number"
                        placeholder="499"
                        value={quickProduct.sellingPrice}
                        onChange={(e) => setQuickProduct({ ...quickProduct, sellingPrice: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Initial In-Stock Units</label>
                      <input
                        type="number"
                        placeholder="25"
                        value={quickProduct.initialStock}
                        onChange={(e) => setQuickProduct({ ...quickProduct, initialStock: e.target.value })}
                      />
                    </div>
                  </div>
                  <button type="submit" disabled={loading} className="btn-add-quick-prod">
                    {loading ? <Loader2 size={16} className="spinner" /> : <Plus size={16} />}
                    <span>Add Item</span>
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Navigation */}
        <div className="onboarding-modal-footer">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => prev - 1)}
              className="btn-onboarding-back"
            >
              <ArrowLeft size={16} /> Back
            </button>
          ) : (
            <button type="button" onClick={onClose} className="btn-onboarding-skip">
              Skip for now
            </button>
          )}

          {currentStep < 3 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => prev + 1)}
              className="btn-onboarding-next"
            >
              <span>Continue</span>
              <ArrowRight size={16} />
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '0.65rem' }}>
              <button
                type="button"
                onClick={() => handleSaveAndFinish('/dashboard', true)}
                disabled={loading}
                className="btn-onboarding-back"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Store size={16} />
                <span>View Live Store ↗</span>
              </button>
              <button
                type="button"
                onClick={() => handleSaveAndFinish('/dashboard', false)}
                disabled={loading}
                className="btn-onboarding-finish"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="spinner" /> Activating...
                  </>
                ) : (
                  <>
                    <span>Enter Dashboard</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
