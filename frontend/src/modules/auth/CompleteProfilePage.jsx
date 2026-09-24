import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setCredentials, logout } from '../../app/authSlice';
import api from '../../services/api';
import BrandLogo from '../../components/BrandLogo';
import {
  Building2,
  Building,
  Phone,
  MapPin,
  FileText,
  ShieldAlert,
  ArrowRight,
  LogOut,
  ArrowLeft,
  CheckCircle2
} from 'lucide-react';

const POPULAR_CITIES = [
  // Tamil Nadu
  { city: 'Karur', state: 'Tamil Nadu' },
  { city: 'Chennai', state: 'Tamil Nadu' },
  { city: 'Coimbatore', state: 'Tamil Nadu' },
  { city: 'Madurai', state: 'Tamil Nadu' },
  { city: 'Tiruchirappalli', state: 'Tamil Nadu' },
  { city: 'Salem', state: 'Tamil Nadu' },
  { city: 'Tiruppur', state: 'Tamil Nadu' },
  { city: 'Erode', state: 'Tamil Nadu' },
  { city: 'Vellore', state: 'Tamil Nadu' },
  { city: 'Thanjavur', state: 'Tamil Nadu' },
  { city: 'Dindigul', state: 'Tamil Nadu' },
  { city: 'Tirunelveli', state: 'Tamil Nadu' },
  { city: 'Tuticorin', state: 'Tamil Nadu' },
  { city: 'Nagercoil', state: 'Tamil Nadu' },
  { city: 'Kanchipuram', state: 'Tamil Nadu' },
  { city: 'Hosur', state: 'Tamil Nadu' },
  { city: 'Cuddalore', state: 'Tamil Nadu' },
  { city: 'Kumbakonam', state: 'Tamil Nadu' },
  { city: 'Sivakasi', state: 'Tamil Nadu' },
  { city: 'Pollachi', state: 'Tamil Nadu' },
  { city: 'Pudukkottai', state: 'Tamil Nadu' },
  { city: 'Namakkal', state: 'Tamil Nadu' },
  { city: 'Theni', state: 'Tamil Nadu' },
  { city: 'Virudhunagar', state: 'Tamil Nadu' },
  { city: 'Karaikudi', state: 'Tamil Nadu' },
  { city: 'Nagapattinam', state: 'Tamil Nadu' },
  { city: 'Villupuram', state: 'Tamil Nadu' },
  { city: 'Ranipet', state: 'Tamil Nadu' },
  { city: 'Ambur', state: 'Tamil Nadu' },
  { city: 'Tiruvannamalai', state: 'Tamil Nadu' },
  // Major Metros & National Hubs
  { city: 'Bengaluru', state: 'Karnataka' },
  { city: 'Mysuru', state: 'Karnataka' },
  { city: 'Mangaluru', state: 'Karnataka' },
  { city: 'Hyderabad', state: 'Telangana' },
  { city: 'Visakhapatnam', state: 'Andhra Pradesh' },
  { city: 'Vijayawada', state: 'Andhra Pradesh' },
  { city: 'Kochi', state: 'Kerala' },
  { city: 'Thiruvananthapuram', state: 'Kerala' },
  { city: 'Kozhikode', state: 'Kerala' },
  { city: 'Mumbai', state: 'Maharashtra' },
  { city: 'Pune', state: 'Maharashtra' },
  { city: 'Nagpur', state: 'Maharashtra' },
  { city: 'Delhi', state: 'Delhi' },
  { city: 'Noida', state: 'Uttar Pradesh' },
  { city: 'Gurugram', state: 'Haryana' },
  { city: 'Ahmedabad', state: 'Gujarat' },
  { city: 'Surat', state: 'Gujarat' },
  { city: 'Jaipur', state: 'Rajasthan' },
  { city: 'Kolkata', state: 'West Bengal' },
  { city: 'Indore', state: 'Madhya Pradesh' },
  { city: 'Lucknow', state: 'Uttar Pradesh' },
  { city: 'Chandigarh', state: 'Punjab' }
];

export default function CompleteProfilePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  // Toggle between Center Prompt View and Organization Setup Form View
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [formData, setFormData] = useState({
    companyName: '',
    phone: '',
    city: '',
    taxNumber: '',
    plan: 'TRIAL'
  });

  const [citySuggestions, setCitySuggestions] = useState([]);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const cityWrapperRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (cityWrapperRef.current && !cityWrapperRef.current.contains(event.target)) {
        setShowCityDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === 'city') {
      if (value.trim().length > 0) {
        const query = value.toLowerCase().trim();
        const filtered = POPULAR_CITIES.filter(
          (c) =>
            c.city.toLowerCase().includes(query) ||
            c.state.toLowerCase().includes(query) ||
            `${c.city}, ${c.state}`.toLowerCase().includes(query)
        );
        setCitySuggestions(filtered.slice(0, 7));
        setShowCityDropdown(true);
      } else {
        setCitySuggestions([]);
        setShowCityDropdown(false);
      }
    }
  };

  const handleSelectCity = (cityItem) => {
    setFormData((prev) => ({
      ...prev,
      city: `${cityItem.city}, ${cityItem.state}`
    }));
    setShowCityDropdown(false);
  };

  const handleSelectPlan = (planKey) => {
    setFormData((prev) => ({ ...prev, plan: planKey }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.companyName.trim()) {
      setError('Company / Business Name is required.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/auth/complete-profile', {
        companyName: formData.companyName.trim(),
        phone: formData.phone.trim(),
        city: formData.city.trim(),
        taxNumber: formData.taxNumber.trim(),
        plan: formData.plan
      });

      if (res?.success) {
        dispatch(setCredentials(res.data));
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err?.message || 'Failed to setup organization profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    dispatch(logout());
    navigate('/login');
  };

  // 1. Center Prompt Landing View
  if (!isFormOpen) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'radial-gradient(circle at 50% 20%, rgba(152, 42, 134, 0.08), transparent 70%), var(--bg-app)',
          padding: '1.5rem'
        }}
      >
        <div style={{ width: '100%', maxWidth: '480px' }}>
          {/* Brand Logo Header */}
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <BrandLogo size="lg" showSubtitle={false} />
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.4rem', fontWeight: 600 }}>
              Multi-Tenant Inventory & Business Operations SaaS
            </p>
          </div>

          {/* Centered Prompt Card */}
          <div
            className="card"
            style={{
              padding: '2.5rem 2.25rem',
              textAlign: 'center',
              boxShadow: '0 20px 40px -15px rgba(152, 42, 134, 0.12)',
              borderRadius: '16px',
              border: '1px solid rgba(152, 42, 134, 0.12)'
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #fdf4fc 0%, #fae8f8 100%)',
                color: '#982A86',
                border: '1.5px solid #f3c7ec',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem',
                boxShadow: '0 8px 16px -4px rgba(152, 42, 134, 0.15)'
              }}
            >
              <Building2 size={32} />
            </div>

            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
              Complete Your Organization Profile
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.75rem', lineHeight: 1.6 }}>
              Welcome, <strong>{user?.firstName || 'Business Owner'}</strong>! To unlock your inventory workspace, live stock tracking, and point of sale billing terminal, please complete your organization setup.
            </p>

            {/* Complete Now Action Button */}
            <button
              type="button"
              onClick={() => setIsFormOpen(true)}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.85rem',
                fontSize: '0.95rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                borderRadius: '10px',
                boxShadow: '0 6px 18px 0 rgba(152, 42, 134, 0.35)',
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}
            >
              <span>Complete Setup Now</span>
              <ArrowRight size={18} />
            </button>

            {/* Sign Out Option with Clean Hover */}
            <div style={{ marginTop: '1.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '1.1rem' }}>
              <button
                type="button"
                onClick={handleSignOut}
                style={{
                  background: 'transparent',
                  border: '1px solid transparent',
                  color: '#64748b',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.4rem 0.9rem',
                  borderRadius: '20px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#fef2f2';
                  e.currentTarget.style.color = '#e11d48';
                  e.currentTarget.style.borderColor = '#fecdd3';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(225, 29, 72, 0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#64748b';
                  e.currentTarget.style.borderColor = 'transparent';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <LogOut size={15} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Organization Setup Form View - Spacious, Clean Real-World Design
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(circle at 50% 12%, rgba(152, 42, 134, 0.08), transparent 70%), var(--bg-app)',
        padding: 'max(env(safe-area-inset-top, 0px), 1.75rem) 1rem max(env(safe-area-inset-bottom, 0px), 1.75rem) 1rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {/* Top Header Bar */}
      <div style={{ maxWidth: '780px', width: '100%', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => setIsFormOpen(false)}
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '0.45rem 0.85rem',
              color: '#475569',
              fontSize: '0.825rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#cbd5e1';
              e.currentTarget.style.color = '#0f172a';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.color = '#475569';
            }}
          >
            <ArrowLeft size={15} /> Back
          </button>

          <BrandLogo size="sm" showSubtitle={false} />

          <button
            type="button"
            onClick={handleSignOut}
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '0.45rem 0.95rem',
              color: '#64748b',
              fontSize: '0.825rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#fef2f2';
              e.currentTarget.style.color = '#e11d48';
              e.currentTarget.style.borderColor = '#fecdd3';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#ffffff';
              e.currentTarget.style.color = '#64748b';
              e.currentTarget.style.borderColor = '#e2e8f0';
            }}
          >
            <LogOut size={15} style={{ flexShrink: 0 }} />
            <span style={{ whiteSpace: 'nowrap' }}>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Form Card Container (Wide & Spacious) */}
      <div
        className="card"
        style={{
          maxWidth: '780px',
          width: '100%',
          padding: '1.75rem 1.5rem',
          borderRadius: '16px',
          boxShadow: '0 20px 40px -15px rgba(152, 42, 134, 0.12)',
          border: '1px solid rgba(152, 42, 134, 0.12)'
        }}
      >
        {/* Title Header */}
        <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Organization Workspace Setup
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.35rem', marginBottom: 0 }}>
            Enter your business details to configure and activate your workspace
          </p>
        </div>

        {error && (
          <div
            style={{
              background: 'var(--danger-bg)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem 1rem',
              color: 'var(--danger)',
              fontSize: '0.85rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem'
            }}
          >
            <ShieldAlert size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Business Details Responsive Grid (1 column on mobile, 2 columns on desktop) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            {/* Company / Legal Name */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                Company / Legal Name *
              </label>
              <div style={{ position: 'relative' }}>
                <Building size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '11px' }} />
                <input
                  type="text"
                  name="companyName"
                  required
                  className="form-input"
                  style={{ paddingLeft: '2.5rem', fontSize: '0.875rem' }}
                  placeholder="e.g. Zara Retailers Pvt Ltd"
                  value={formData.companyName}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Business Phone Number */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                Business Phone Number
              </label>
              <div style={{ position: 'relative' }}>
                <Phone size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '11px' }} />
                <input
                  type="tel"
                  name="phone"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem', fontSize: '0.875rem' }}
                  placeholder="e.g. +91 98765 43210"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Row 2: Real-Time City Location & GSTIN (Responsive Grid) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            {/* City / Warehouse Location with Real-Time Suggestions */}
            <div className="form-group" style={{ marginBottom: 0, position: 'relative' }} ref={cityWrapperRef}>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                City & State Location
              </label>
              <div style={{ position: 'relative' }}>
                <MapPin size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '11px' }} />
                <input
                  type="text"
                  name="city"
                  autoComplete="off"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem', fontSize: '0.875rem' }}
                  placeholder="Type city (e.g. Karur, Chennai)..."
                  value={formData.city}
                  onChange={handleChange}
                  onFocus={() => {
                    if (formData.city.trim().length > 0 && citySuggestions.length > 0) {
                      setShowCityDropdown(true);
                    }
                  }}
                />
              </div>

              {/* Real-time Autocomplete Dropdown Popup */}
              {showCityDropdown && citySuggestions.length > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    zIndex: 50,
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    boxShadow: '0 12px 24px -6px rgba(0, 0, 0, 0.15)',
                    marginTop: '4px',
                    maxHeight: '200px',
                    overflowY: 'auto'
                  }}
                >
                  {citySuggestions.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSelectCity(item)}
                      style={{
                        padding: '0.55rem 0.85rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.825rem',
                        color: '#1e293b',
                        borderBottom: idx === citySuggestions.length - 1 ? 'none' : '1px solid #f8fafc',
                        transition: 'background 0.12s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#fdf4fc';
                        e.currentTarget.style.color = '#982A86';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#ffffff';
                        e.currentTarget.style.color = '#1e293b';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <MapPin size={13} color="#982A86" />
                        <span style={{ fontWeight: 600 }}>{item.city}</span>
                      </div>
                      <span style={{ fontSize: '0.72rem', color: '#64748b', background: '#f1f5f9', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 500 }}>
                        {item.state}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* GSTIN / Tax ID */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                GSTIN / Tax ID (Optional)
              </label>
              <div style={{ position: 'relative' }}>
                <FileText size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '11px' }} />
                <input
                  type="text"
                  name="taxNumber"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem', fontSize: '0.875rem' }}
                  placeholder="e.g. 33AAAAA0000A1Z5"
                  value={formData.taxNumber}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Choose Workspace Plan */}
          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.85rem' }}>
              <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Select Workspace Plan
              </label>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Change or upgrade anytime from settings
              </span>
            </div>

            {/* Plan Cards Grid: Responsive (2x2 on mobile, 4 in a row on tablet/desktop) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
              {/* 14-Day Free Trial */}
              <div
                onClick={() => handleSelectPlan('TRIAL')}
                style={{
                  border: formData.plan === 'TRIAL' ? '2px solid #982A86' : '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '0.85rem 0.75rem',
                  cursor: 'pointer',
                  background: formData.plan === 'TRIAL' ? '#fdf4fc' : '#ffffff',
                  position: 'relative',
                  transition: 'all 0.15s ease',
                  textAlign: 'left',
                  boxShadow: formData.plan === 'TRIAL' ? '0 4px 14px rgba(152, 42, 134, 0.12)' : 'none'
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '6px',
                    background: '#059669',
                    color: '#ffffff',
                    fontSize: '0.55rem',
                    fontWeight: 800,
                    padding: '0.1rem 0.35rem',
                    borderRadius: '4px',
                    letterSpacing: '0.04em'
                  }}
                >
                  RECOMMENDED
                </div>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#059669', marginBottom: '0.2rem' }}>
                  14-DAY TRIAL
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>
                  ₹0 <span style={{ fontSize: '0.65rem', fontWeight: 500, color: '#64748b' }}>/14 days</span>
                </div>
                <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '0.35rem', lineHeight: 1.3 }}>
                  Full Pro Access • 5 Warehouses
                </div>
              </div>

              {/* STARTER */}
              <div
                onClick={() => handleSelectPlan('STARTER')}
                style={{
                  border: formData.plan === 'STARTER' ? '2px solid #982A86' : '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '0.85rem 0.75rem',
                  cursor: 'pointer',
                  background: formData.plan === 'STARTER' ? '#fdf4fc' : '#ffffff',
                  transition: 'all 0.15s ease',
                  textAlign: 'left',
                  boxShadow: formData.plan === 'STARTER' ? '0 4px 14px rgba(152, 42, 134, 0.12)' : 'none'
                }}
              >
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#059669', marginBottom: '0.2rem' }}>
                  STARTER
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>
                  ₹499 <span style={{ fontSize: '0.65rem', fontWeight: 500, color: '#64748b' }}>/mo</span>
                </div>
                <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '0.35rem', lineHeight: 1.3 }}>
                  2 Warehouses • 5 Staff
                </div>
              </div>

              {/* PRO GROWTH */}
              <div
                onClick={() => handleSelectPlan('PRO')}
                style={{
                  border: formData.plan === 'PRO' ? '2px solid #982A86' : '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '0.85rem 0.75rem',
                  cursor: 'pointer',
                  background: formData.plan === 'PRO' ? '#fdf4fc' : '#ffffff',
                  position: 'relative',
                  transition: 'all 0.15s ease',
                  textAlign: 'left',
                  boxShadow: formData.plan === 'PRO' ? '0 4px 14px rgba(152, 42, 134, 0.12)' : 'none'
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '6px',
                    background: '#982A86',
                    color: '#ffffff',
                    fontSize: '0.55rem',
                    fontWeight: 800,
                    padding: '0.1rem 0.35rem',
                    borderRadius: '4px',
                    letterSpacing: '0.04em'
                  }}
                >
                  POPULAR
                </div>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#982A86', marginBottom: '0.2rem' }}>
                  PRO GROWTH
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>
                  ₹1,499 <span style={{ fontSize: '0.65rem', fontWeight: 500, color: '#64748b' }}>/mo</span>
                </div>
                <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '0.35rem', lineHeight: 1.3 }}>
                  5 Warehouses • 15 Staff
                </div>
              </div>

              {/* ENTERPRISE */}
              <div
                onClick={() => handleSelectPlan('ENTERPRISE')}
                style={{
                  border: formData.plan === 'ENTERPRISE' ? '2px solid #982A86' : '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '0.85rem 0.75rem',
                  cursor: 'pointer',
                  background: formData.plan === 'ENTERPRISE' ? '#fdf4fc' : '#ffffff',
                  transition: 'all 0.15s ease',
                  textAlign: 'left',
                  boxShadow: formData.plan === 'ENTERPRISE' ? '0 4px 14px rgba(152, 42, 134, 0.12)' : 'none'
                }}
              >
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#d97706', marginBottom: '0.2rem' }}>
                  ENTERPRISE
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>
                  ₹3,999 <span style={{ fontSize: '0.65rem', fontWeight: 500, color: '#64748b' }}>/mo</span>
                </div>
                <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '0.35rem', lineHeight: 1.3 }}>
                  Unlimited Warehouses • SLA
                </div>
              </div>
            </div>
          </div>

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '0.85rem',
              fontSize: '0.925rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              borderRadius: '10px',
              boxShadow: '0 6px 18px 0 rgba(152, 42, 134, 0.35)',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? (
              <span>Activating Workspace...</span>
            ) : (
              <>
                <CheckCircle2 size={18} />
                <span>Save & Launch Workspace</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

