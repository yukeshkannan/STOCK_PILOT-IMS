import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import Preloader from '../../components/Preloader';
import {
  Building,
  Users,
  ShieldCheck,
  Plus,
  RefreshCw,
  X,
  Search,
  Mail,
  ChevronRight,
  Shield,
  Activity,
  CheckCircle2,
  Clock,
  Layers,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [formLoading, setFormLoading] = useState(false);

  // Custom Confirm Modal state (Zero browser alert/confirm boxes)
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    tenant: null
  });

  const [formData, setFormData] = useState({
    company_name: '',
    company_code: '',
    email: '',
    phone: '',
    address: '',
    tax_number: ''
  });

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/dashboard');
      setStats(res?.data || null);
    } catch (err) {
      console.error('Error fetching admin dashboard:', err);
      toast.error('Failed to load platform statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'company_code' ? value.toUpperCase() : value
    }));
  };

  const handleCreateTenant = async (e) => {
    e.preventDefault();
    if (!formData.company_name || !formData.company_code || !formData.email) {
      toast.warning('Please fill in Company Name, Code, and Primary Admin Email');
      return;
    }

    try {
      setFormLoading(true);
      await api.post('/admin/tenants', formData);
      toast.success(`Organization [${formData.company_name}] provisioned successfully`);
      setIsModalOpen(false);
      setFormData({
        company_name: '',
        company_code: '',
        email: '',
        phone: '',
        address: '',
        tax_number: ''
      });
      fetchStats();
      window.dispatchEvent(new CustomEvent('stockpilot_tenants_changed'));
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to register tenant company');
    } finally {
      setFormLoading(false);
    }
  };

  const openToggleConfirmModal = (tenant) => {
    setConfirmModal({
      isOpen: true,
      tenant
    });
  };

  const executeToggleSuspend = async () => {
    const tenant = confirmModal.tenant;
    if (!tenant) return;

    const isSuspended = tenant.status === 'SUSPENDED';
    const actionUrl = isSuspended
      ? `/admin/tenants/${tenant.id}/activate`
      : `/admin/tenants/${tenant.id}/suspend`;

    try {
      await api.patch(actionUrl);
      toast.success(`${tenant.company_name} ${isSuspended ? 'activated' : 'suspended'}`);
      setConfirmModal({ isOpen: false, tenant: null });
      fetchStats();
      window.dispatchEvent(new CustomEvent('stockpilot_tenants_changed'));
    } catch (err) {
      toast.error(err.message || 'Failed to update tenant status');
    }
  };

  if (loading && !stats) {
    return (
      <Preloader
        message="Loading Super Admin Command Center..."
        submessage="Fetching real-time platform organizations, telemetry, and system stats"
      />
    );
  }

  // Tenants List & Filtering - Pure live data from API
  const tenantsList = stats?.recentTenants || [];

  const recentLogs = stats?.recentLogs || [];

  const filteredTenants = tenantsList.filter((t) => {
    const matchesSearch =
      t.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.company_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.email.toLowerCase().includes(searchTerm.toLowerCase());

    if (statusFilter === 'ACTIVE') return matchesSearch && t.status === 'ACTIVE';
    if (statusFilter === 'SUSPENDED') return matchesSearch && t.status === 'SUSPENDED';
    return matchesSearch;
  });

  return (
    <div>
      {/* Top Header Banner - Clean Title & Actions */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Super Admin Portal</h1>
          <p className="page-subtitle">
            Global Multi-Tenant SaaS Infrastructure & Organization Provisioning Command Center
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
          <button onClick={fetchStats} className="btn btn-secondary" disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spin' : ''} /> Refresh Data
          </button>
          <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
            <Plus size={18} /> Provision New Tenant
          </button>
        </div>
      </div>

      {/* 4 Core Executive KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '1.25rem',
          marginBottom: '1.75rem'
        }}
      >
        {/* KPI 1: Active Organizations */}
        <div
          className="card kpi-card"
          style={{
            padding: '1.4rem 1.6rem',
            background: 'linear-gradient(135deg, #ffffff 70%, #faf5ff 100%)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.725rem', fontWeight: 700, color: '#982A86', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Active Organizations
              </span>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem', letterSpacing: '-0.02em' }}>
                {stats?.activeTenants ?? tenantsList.filter(t => t.status === 'ACTIVE').length}
                <span style={{ fontSize: '1rem', fontWeight: 500, color: '#64748b' }}> / {stats?.totalTenants ?? tenantsList.length} Total</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.78rem', color: '#059669', fontWeight: 600, marginTop: '0.45rem' }}>
                <CheckCircle2 size={13} /> {stats?.suspendedTenants ? `${stats.suspendedTenants} Suspended` : 'All Systems Active'}
              </div>
            </div>

            <div
              className="kpi-icon-box"
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: '#fdf2fb',
                border: '1px solid #f3c7ec',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#982A86',
                boxShadow: '0 2px 8px rgba(152, 42, 134, 0.12)'
              }}
            >
              <Building size={22} />
            </div>
          </div>
        </div>

        {/* KPI 2: Total Registered Users */}
        <div
          className="card kpi-card"
          style={{
            padding: '1.4rem 1.6rem',
            background: 'linear-gradient(135deg, #ffffff 70%, #f0fdf4 100%)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.725rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Platform Users
              </span>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem', letterSpacing: '-0.02em' }}>
                {stats?.totalUsers ?? 0}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.78rem', color: '#64748b', fontWeight: 500, marginTop: '0.45rem' }}>
                <Users size={13} color="#059669" /> Across all business tenants
              </div>
            </div>

            <div
              className="kpi-icon-box"
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#059669',
                boxShadow: '0 2px 8px rgba(5, 150, 105, 0.12)'
              }}
            >
              <Users size={22} />
            </div>
          </div>
        </div>

        {/* KPI 3: Pending Onboardings */}
        <div
          className="card kpi-card"
          style={{
            padding: '1.4rem 1.6rem',
            background: 'linear-gradient(135deg, #ffffff 70%, #fffbeb 100%)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.725rem', fontWeight: 700, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Pending Approvals
              </span>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem', letterSpacing: '-0.02em' }}>
                {stats?.pendingRegistrations ?? 0}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.78rem', color: '#64748b', fontWeight: 500, marginTop: '0.45rem' }}>
                <Clock size={13} color="#d97706" /> Self-serve onboarding queue
              </div>
            </div>

            <div
              className="kpi-icon-box"
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: '#fffbeb',
                border: '1px solid #fde68a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#d97706',
                boxShadow: '0 2px 8px rgba(217, 119, 6, 0.12)'
              }}
            >
              <Layers size={22} />
            </div>
          </div>
        </div>

        {/* KPI 4: Security & Compliance Health */}
        <div
          className="card kpi-card"
          style={{
            padding: '1.4rem 1.6rem',
            background: 'linear-gradient(135deg, #ffffff 70%, #f8fafc 100%)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.725rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Security & Audit Status
              </span>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem', letterSpacing: '-0.02em' }}>
                100% <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#059669' }}>Verified</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.78rem', color: '#64748b', fontWeight: 500, marginTop: '0.45rem' }}>
                <ShieldCheck size={13} color="#059669" /> Multi-tenant RBAC enforced
              </div>
            </div>

            <div
              className="kpi-icon-box"
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: '#f1f5f9',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#475569',
                boxShadow: '0 2px 8px rgba(71, 85, 105, 0.12)'
              }}
            >
              <Shield size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* MAIN: Registered Business Tenants Directory */}
      <div
        className="card"
        style={{
          position: 'relative',
          overflow: 'hidden',
          marginBottom: '1.85rem'
        }}
      >
        {/* Top Header & Summary Strip */}
        <div className="card-header" style={{ marginBottom: '1.25rem' }}>
          <div>
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
              <Building size={18} color="#982A86" /> Registered Business Tenants Directory
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem', fontWeight: 400 }}>
              Full management directory of provisioned multi-tenant business organizations
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <span
              style={{
                fontSize: '0.78rem',
                fontWeight: 600,
                color: '#64748b'
              }}
            >
              {tenantsList.filter(t => t.status === 'ACTIVE').length} Active / {tenantsList.length} Total
            </span>

            <Link
              to="/admin/tenants"
              style={{
                fontSize: '0.825rem',
                color: '#982A86',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              Full Management View <ChevronRight size={14} />
            </Link>
          </div>
        </div>

        {/* Search & Status Filter Toolbar */}
        <div
          style={{
            display: 'flex',
            gap: '0.85rem',
            alignItems: 'center',
            marginBottom: '1.25rem',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
            <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search by Company Code, Name, or Email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '2.4rem', fontSize: '0.825rem' }}
            />
          </div>

          <div className="segmented-control">
            {['ALL', 'ACTIVE', 'SUSPENDED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`segmented-tab ${statusFilter === st ? 'active' : ''}`}
                style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
              >
                {st} ({st === 'ALL' ? tenantsList.length : tenantsList.filter(t => t.status === st).length})
              </button>
            ))}
          </div>
        </div>

        {/* Table - Clean Box-Free Display */}
        <div className="data-table-container-full">
          <table className="data-table">
            <thead>
              <tr>
                <th>Organization & Tax ID</th>
                <th>Company Code</th>
                <th>Primary Admin Email</th>
                <th>Location & Contact</th>
                <th>Active Users</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                    No tenant businesses match the selected search or filter criteria.
                  </td>
                </tr>
              ) : (
                filteredTenants.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <div>
                        <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' }}>
                          {t.company_name}
                        </div>
                        <div style={{ fontSize: '0.725rem', color: '#64748b', marginTop: '1px' }}>
                          GSTIN: <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{t.tax_number || 'Standard Registration'}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          color: '#982A86',
                          fontSize: '0.85rem',
                          background: '#fdf2fb',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          border: '1px solid #f3c7ec'
                        }}
                      >
                        {t.company_code}
                      </span>
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.825rem', color: '#334155' }}>
                        <Mail size={13} color="#94a3b8" /> {t.email}
                      </div>
                    </td>

                    <td>
                      <div style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 500 }}>
                        {t.phone || '—'}
                      </div>
                      <div style={{ fontSize: '0.725rem', color: '#94a3b8', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {t.address || 'Head Office'}
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.825rem', fontWeight: 600, color: '#334155', whiteSpace: 'nowrap' }}>
                        <Users size={14} color="#982A86" />
                        <span>{(t.users || []).length} Users</span>
                      </div>
                    </td>

                    <td>
                      <span className={`badge ${t.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: t.status === 'ACTIVE' ? '#10b981' : '#ef4444' }}></span>
                        {t.status === 'ACTIVE' ? 'Active' : 'Suspended'}
                      </span>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => openToggleConfirmModal(t)}
                        className={`btn btn-sm ${t.status === 'SUSPENDED' ? 'btn-success' : 'btn-danger'}`}
                        style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                      >
                        {t.status === 'SUSPENDED' ? 'Activate Access' : 'Suspend'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECONDARY: Real-Time Audit & Security Activity Stream */}
      <div className="card" style={{ marginBottom: '1.85rem' }}>
        <div className="card-header" style={{ marginBottom: '1rem' }}>
          <div>
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
              <Activity size={18} color="#982A86" /> Recent Platform Audit & Security Events
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.15rem' }}>
              Live security trails and administrative events across organizations
            </p>
          </div>
          <Link
            to="/admin/audit"
            style={{
              fontSize: '0.825rem',
              color: '#982A86',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
          >
            View Full Audit Logs <ChevronRight size={14} />
          </Link>
        </div>

        {recentLogs && recentLogs.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {recentLogs.slice(0, 5).map((log, idx) => (
              <div
                key={log.id || idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '0.825rem',
                  flexWrap: 'wrap',
                  gap: '0.5rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flex: '1', minWidth: '280px' }}>
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: log.action?.includes('SUSPEND') ? '#ef4444' : log.action?.includes('ACTIVE') || log.action?.includes('PROVISION') ? '#10b981' : '#982A86',
                      flexShrink: 0
                    }}
                  />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, color: '#0f172a' }}>
                        {log.action}
                      </span>
                      {log.tenant_name && (
                        <span style={{ fontSize: '0.72rem', background: '#f5f3ff', color: '#7c3aed', padding: '0.1rem 0.45rem', borderRadius: '4px', fontWeight: 600, border: '1px solid #ddd6fe' }}>
                          {log.tenant_name}
                        </span>
                      )}
                    </div>
                    <div style={{ color: '#475569', fontSize: '0.8rem', marginTop: '2px' }}>{log.description}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                  <span style={{ fontWeight: 600, color: '#64748b' }}>{log.user_name || 'System'}</span>
                  <span>•</span>
                  <span>{log.created_at ? new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#94a3b8', fontSize: '0.85rem' }}>
            <Activity size={24} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
            <div>No recent platform audit logs recorded yet.</div>
          </div>
        )}
      </div>

      {/* Provision New Tenant Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#0f172a' }}>
                  <Building size={20} color="#982A86" /> Provision New Tenant Organization
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.15rem' }}>
                  Allocate dedicated tenant database schema and initial admin login
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="btn btn-ghost btn-sm"
                style={{ padding: '0.35rem', borderRadius: '6px' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTenant}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label className="form-label">Company Name *</label>
                  <input
                    type="text"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleInputChange}
                    placeholder="e.g. Acme Corp Ltd"
                    className="form-input"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Company Code *</label>
                  <input
                    type="text"
                    name="company_code"
                    value={formData.company_code}
                    onChange={handleInputChange}
                    placeholder="e.g. ACM001"
                    className="form-input"
                    style={{ textTransform: 'uppercase', fontFamily: 'monospace' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label className="form-label">Primary Admin Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="admin@acme.com"
                    className="form-input"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Contact Phone</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+91 98765 43210"
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label">GSTIN / Tax ID</label>
                <input
                  type="text"
                  name="tax_number"
                  value={formData.tax_number}
                  onChange={handleInputChange}
                  placeholder="e.g. 29ABCDE1234F1Z5"
                  className="form-input"
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Registered Office Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="e.g. 100 Feet Road, Indiranagar, Bengaluru"
                  className="form-input"
                />
              </div>

              <div className="modal-footer" style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem', margin: 0 }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-secondary"
                  disabled={formLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={formLoading}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
                >
                  {formLoading ? 'Provisioning...' : 'Provision Organization'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Suspend / Activate Confirm Modal */}
      {confirmModal.isOpen && (
        <div className="modal-overlay" onClick={() => setConfirmModal({ isOpen: false, tenant: null })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
              {confirmModal.tenant?.status === 'SUSPENDED' ? 'Activate Tenant Access?' : 'Suspend Tenant Access?'}
            </h3>
            <p style={{ fontSize: '0.825rem', color: '#64748b', marginTop: '0.35rem', lineHeight: 1.4 }}>
              Are you sure you want to {confirmModal.tenant?.status === 'SUSPENDED' ? 'restore' : 'suspend'} access for{' '}
              <strong>{confirmModal.tenant?.company_name}</strong>?
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1.5rem' }}>
              <button
                onClick={() => setConfirmModal({ isOpen: false, tenant: null })}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={executeToggleSuspend}
                className={`btn ${confirmModal.tenant?.status === 'SUSPENDED' ? 'btn-success' : 'btn-danger'}`}
              >
                Yes, {confirmModal.tenant?.status === 'SUSPENDED' ? 'Activate Organization' : 'Suspend Organization'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
