import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { updateProfile } from '../../app/authSlice';
import {
  Building2,
  FileText,
  Copy,
  Check,
  Save,
  RotateCcw,
  Sparkles,
  Hash,
  Mail,
  Phone,
  MapPin,
  Receipt
} from 'lucide-react';
import './SettingsPage.css';

export default function SettingsPage() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const initialFormState = {
    companyName: user?.companyName || '',
    companyCode: user?.companyCode || '',
    email: user?.email || '',
    phone: '',
    address: '',
    taxNumber: '',
    invoiceFooter: ''
  };

  const [settings, setSettings] = useState(initialFormState);
  const [initialSettings, setInitialSettings] = useState(initialFormState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [plan, setPlan] = useState(user?.plan || 'TRIAL');

  useEffect(() => {
    const fetchSettings = async () => {
      if (user?.isSuperAdmin || !user?.tenantId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await api.get('/tenants/settings');
        if (res?.data) {
          const d = res.data;
          const fetchedData = {
            companyName: d.companyName || d.company_name || user?.companyName || '',
            companyCode: d.companyCode || d.company_code || user?.companyCode || '',
            email: d.email || user?.email || '',
            phone: d.phone || '',
            address: d.address || '',
            taxNumber: d.taxNumber || d.tax_number || '',
            invoiceFooter: d.invoiceFooter || d.invoice_footer || ''
          };

          if (d.plan) {
            setPlan(d.plan);
          }

          setSettings(fetchedData);
          setInitialSettings(fetchedData);
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
        toast.error('Failed to load company settings');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [user]);

  const isDirty = JSON.stringify(settings) !== JSON.stringify(initialSettings);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleCopyCode = () => {
    if (!settings.companyCode) return;
    navigator.clipboard.writeText(settings.companyCode);
    setCopiedCode(true);
    toast.success(`Copied workspace ID: ${settings.companyCode}`);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleReset = () => {
    setSettings(initialSettings);
    toast.info('Changes discarded');
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!settings.companyName.trim()) {
      toast.warning('Company Name is required');
      return;
    }
    if (!settings.email.trim()) {
      toast.warning('Billing Email is required');
      return;
    }

    try {
      setSaving(true);
      await api.put('/tenants/settings', settings);

      // Update Redux state so global Navbar/Sidebar reflect name changes immediately
      dispatch(updateProfile({
        companyName: settings.companyName,
        email: settings.email
      }));

      setInitialSettings(settings);
      toast.success('Company settings saved successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to update company settings');
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'SP';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="settings-container">
        <div className="page-header">
          <div>
            <h1 className="page-title">Company Settings</h1>
            <p className="page-subtitle">Loading workspace configuration...</p>
          </div>
        </div>
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem auto' }} />
          Loading company details...
        </div>
      </div>
    );
  }

  return (
    <div className="settings-container">
      {/* Page Header */}
      <div className="settings-header">
        <div className="settings-title-wrap">
          <h1 className="settings-title">Company Settings</h1>
          <p className="settings-subtitle">
            Manage your company profile, business contact details, and invoice information
          </p>
        </div>

        <div className="settings-actions">
          {isDirty && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleReset}
              disabled={saving}
            >
              <RotateCcw size={15} />
              <span>Discard</span>
            </button>
          )}

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving || !isDirty}
          >
            {saving ? (
              <>
                <div className="spinner-sm" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Grid: Left Identity Card | Right Settings Sections */}
      <div className="settings-grid">
        {/* Left Column: Organization Identity Card */}
        <div className="settings-sidebar-card">
          <div className="settings-company-summary">
            <div className="settings-avatar">
              {getInitials(settings.companyName)}
            </div>

            <h3 className="settings-company-name">
              {settings.companyName || 'StockPilot Business'}
            </h3>

            <button
              type="button"
              className="settings-company-code-pill"
              onClick={handleCopyCode}
              title="Click to copy Workspace ID"
            >
              <Hash size={12} />
              <span>{settings.companyCode || 'WORKSPACE_ID'}</span>
              {copiedCode ? <Check size={12} color="#059669" /> : <Copy size={12} />}
            </button>

            <Link
              to="/subscription"
              className={`settings-plan-badge ${plan.toLowerCase()}`}
              title="Click to manage subscription plan"
            >
              <Sparkles size={11} />
              <span>{plan} Plan</span>
            </Link>
          </div>

          <div className="settings-quick-info">
            <div className="settings-quick-info-item">
              <Mail size={14} />
              <span>{settings.email || 'No email set'}</span>
            </div>
            {settings.phone && (
              <div className="settings-quick-info-item">
                <Phone size={14} />
                <span>{settings.phone}</span>
              </div>
            )}
            {settings.taxNumber && (
              <div className="settings-quick-info-item">
                <Receipt size={14} />
                <span>GSTIN: {settings.taxNumber}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Clean Settings Form */}
        <form onSubmit={handleSave} className="settings-form-wrapper">
          {/* Card 1: Company Profile */}
          <div className="settings-card">
            <div className="settings-card-header">
              <div className="settings-card-icon">
                <Building2 size={18} color="var(--primary)" />
              </div>
              <div>
                <h2 className="settings-card-title">Company Information</h2>
                <p className="settings-card-subtitle">Primary business details and registered address</p>
              </div>
            </div>

            <div className="settings-form-grid">
              <div className="form-group">
                <label className="form-label">Company Name *</label>
                <input
                  type="text"
                  name="companyName"
                  className="form-input"
                  value={settings.companyName}
                  onChange={handleChange}
                  placeholder="e.g. Zara Enterprises"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Workspace Tenant ID</label>
                <div className="settings-inline-readonly">
                  <span>{settings.companyCode || 'N/A'}</span>
                  <button
                    type="button"
                    className="settings-copy-btn"
                    onClick={handleCopyCode}
                    title="Copy Tenant ID"
                  >
                    {copiedCode ? <Check size={14} color="#059669" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Official Email Address *</label>
                <input
                  type="email"
                  name="email"
                  className="form-input"
                  value={settings.email}
                  onChange={handleChange}
                  placeholder="admin@company.com"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Contact Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  className="form-input"
                  value={settings.phone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                />
              </div>

              <div className="form-group settings-form-full">
                <label className="form-label">Registered Business Address</label>
                <textarea
                  name="address"
                  rows={2}
                  className="form-textarea"
                  value={settings.address}
                  onChange={handleChange}
                  placeholder="Street, City, State, Postal Code, Country"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Legal & Invoicing */}
          <div className="settings-card">
            <div className="settings-card-header">
              <div className="settings-card-icon">
                <FileText size={18} color="var(--primary)" />
              </div>
              <div>
                <h2 className="settings-card-title">Tax & Invoicing</h2>
                <p className="settings-card-subtitle">Tax registration and invoice footer terms</p>
              </div>
            </div>

            <div className="settings-form-grid">
              <div className="form-group settings-form-full">
                <label className="form-label">GSTIN / Tax ID</label>
                <input
                  type="text"
                  name="taxNumber"
                  className="form-input"
                  value={settings.taxNumber}
                  onChange={handleChange}
                  placeholder="e.g. 33AAAAA0000A1Z5"
                />
              </div>

              <div className="form-group settings-form-full">
                <label className="form-label">Invoice Footer Note & Terms</label>
                <textarea
                  name="invoiceFooter"
                  rows={2}
                  className="form-textarea"
                  value={settings.invoiceFooter}
                  onChange={handleChange}
                  placeholder="e.g. Thank you for your business! Goods once sold cannot be returned without original bill."
                />
              </div>
            </div>
          </div>

          {/* Bottom Save Bar */}
          <div className="settings-save-footer">
            {isDirty && (
              <div className="settings-dirty-badge">
                <span>● Unsaved changes</span>
              </div>
            )}

            {isDirty && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleReset}
                disabled={saving}
              >
                <RotateCcw size={15} />
                <span>Discard</span>
              </button>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving || !isDirty}
            >
              {saving ? (
                <>
                  <div className="spinner-sm" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
