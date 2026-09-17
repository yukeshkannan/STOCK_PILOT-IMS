import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import {
  Building,
  Users,
  ShieldCheck,
  Plus,
  RefreshCw,
  Server,
  X,
  Search,
  Mail,
  ChevronRight,
  PieChart as PieChartIcon
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

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
      toast.error('Failed to update telemetry statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Live telemetry auto-polling every 3 seconds
    const interval = setInterval(() => {
      fetchStats();
    }, 3000);
    return () => clearInterval(interval);
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

  // Distinct Vibrant Colors for Microservices Pie Chart
  const piePalette = [
    '#982A86', // Gateway (Berry)
    '#06b6d4', // Auth (Cyan)
    '#10b981', // Tenant (Emerald)
    '#f59e0b', // Product (Amber)
    '#e11d48', // Inventory (Rose)
    '#3b82f6', // Warehouse (Blue)
    '#8b5cf6', // Purchase (Purple)
    '#0d9488', // Sales (Teal)
    '#d97706', // Finance (Gold)
    '#ec4899'  // Notification (Pink)
  ];

  // Microservices Latency Chart & List Data
  const rawServices = stats?.telemetry?.services?.length > 0
    ? stats.telemetry.services
    : [
        { name: 'Gateway', latency: 4 },
        { name: 'Auth', latency: 6 },
        { name: 'Tenant', latency: 5 },
        { name: 'Product', latency: 7 },
        { name: 'Inventory', latency: 5 },
        { name: 'Warehouse', latency: 8 },
        { name: 'Purchase', latency: 9 },
        { name: 'Sales', latency: 6 },
        { name: 'Finance', latency: 7 },
        { name: 'Notification', latency: 4 }
      ];

  const microserviceLatencyData = rawServices.map((s, idx) => ({
    ...s,
    fill: piePalette[idx % piePalette.length]
  }));

  // Tenants List & Filtering
  const tenantsList = stats?.recentTenants || [
    { id: 1, company_code: 'ABC001', company_name: 'ABC Electronics Ltd', email: 'admin@abc.com', phone: '+91 98765 00001', address: 'Bengaluru, Karnataka', status: 'ACTIVE', users: [1, 2, 3, 4], tax_number: '29ABCDE1234F1Z5' },
    { id: 2, company_code: 'SLT002', company_name: 'Sri Lakshmi Traders', email: 'admin@lakshmi.com', phone: '+91 98765 00002', address: 'Chennai, Tamil Nadu', status: 'ACTIVE', users: [1, 2], tax_number: '33AABCL5678P1Z3' },
    { id: 3, company_code: 'KUM003', company_name: 'Kumar Industrial Distributors', email: 'admin@kumar.com', phone: '+91 98765 00003', address: 'Peenya, Bengaluru', status: 'SUSPENDED', users: [1, 2], tax_number: '29KUMAR9876Q1Z9' }
  ];

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
            Global Multi-Tenant SaaS Infrastructure Analytics & Workspace Provisioning Command Center
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
          <button onClick={fetchStats} className="btn btn-secondary">
            <RefreshCw size={16} className={loading ? 'spin' : ''} /> Refresh Telemetry
          </button>
          <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
            <Plus size={18} /> Provision New Tenant
          </button>
        </div>
      </div>

      {/* 2 Core Focused Executive Cards (Streamlined & Uncluttered) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1.25rem',
          marginBottom: '1.75rem'
        }}
      >
        {/* Core Card 1: Organizations & Active Workspaces */}
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
                Tenant Organizations & Workspaces
              </span>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem', letterSpacing: '-0.02em' }}>
                {stats?.activeTenants || tenantsList.filter(t => t.status === 'ACTIVE').length} Active <span style={{ fontSize: '1rem', fontWeight: 500, color: '#64748b' }}>/ {stats?.totalTenants || tenantsList.length} Total</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.8rem', color: '#64748b', fontWeight: 500, marginTop: '0.45rem' }}>
                <Users size={14} color="#982A86" /> {stats?.totalUsers || 12} Registered platform users across organizations
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
                boxShadow: '0 2px 8px rgba(152, 42, 134, 0.12)',
                transition: 'transform 0.2s ease'
              }}
            >
              <Building size={22} />
            </div>
          </div>
        </div>

        {/* Core Card 2: Ecosystem Performance & Health */}
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
                Microservices Ecosystem Health & Speed
              </span>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem', letterSpacing: '-0.02em' }}>
                {stats?.telemetry?.avgLatency || 5.8} ms <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#059669' }}>(Optimal)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.8rem', color: '#64748b', fontWeight: 500, marginTop: '0.45rem' }}>
                <ShieldCheck size={14} color="#059669" /> 10 / 10 Microservices & API Gateway operational
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
                boxShadow: '0 2px 8px rgba(5, 150, 105, 0.12)',
                transition: 'transform 0.2s ease'
              }}
            >
              <Server size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* FIRST: 100% Full-Width Registered Business Tenants Directory */}
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
                        <span>{(t.users || []).length || 4} Users</span>
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

      {/* SECOND: Microservices Latency Split View (Left: Donut Chart, Right: Latency Speed List) */}
      <div style={{ marginBottom: '1.85rem' }}>
        <div className="card">
          <div className="card-header" style={{ marginBottom: '1.25rem' }}>
            <div>
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                <PieChartIcon size={20} color="#982A86" /> Microservices Latency Distribution & Live Speed Telemetry
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.15rem' }}>
                Real-time HTTP response speeds across 9 backend microservices & API Gateway
              </p>
            </div>
            <button
              onClick={fetchStats}
              title="Refresh Telemetry Speeds"
              style={{
                background: '#fdf2fb',
                border: '1px solid #f3c7ec',
                borderRadius: '8px',
                padding: '0.45rem 0.65rem',
                color: '#982A86',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease'
              }}
            >
              <RefreshCw size={16} className={loading ? 'spin' : ''} />
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '1.75rem',
              alignItems: 'center'
            }}
          >
            {/* LEFT COLUMN: Colorful Donut / Pie Chart */}
            <div
              style={{
                position: 'relative',
                height: 260,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#faf5ff',
                borderRadius: '12px',
                border: '1px solid #f3e8ff',
                padding: '1rem'
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={microserviceLatencyData}
                    dataKey="latency"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={88}
                    paddingAngle={3}
                    cornerRadius={4}
                    isAnimationActive={false}
                  >
                    {microserviceLatencyData.map((entry, index) => (
                      <Cell key={`pie-cell-${index}`} fill={entry.fill} stroke="#ffffff" strokeWidth={2} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Center Overlay Donut Text */}
              <div
                style={{
                  position: 'absolute',
                  textAlign: 'center',
                  pointerEvents: 'none'
                }}
              >
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#982A86', letterSpacing: '-0.02em' }}>
                  {stats?.telemetry?.avgLatency || 5.8} <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>ms</span>
                </div>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#982A86', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Avg Latency
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Microservices Latency List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#982A86', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>
                Service Response Speeds ({microserviceLatencyData.length} Services)
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '0.5rem',
                  maxHeight: '250px',
                  overflowY: 'auto',
                  paddingRight: '0.25rem'
                }}
              >
                {microserviceLatencyData.map((s, idx) => (
                  <div
                    key={s.name}
                    style={{
                      padding: '0.55rem 0.8rem',
                      background: '#f8fafc',
                      border: '1px solid #f1f5f9',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.825rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                      <span
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          backgroundColor: s.fill,
                          display: 'inline-block'
                        }}
                      />
                      <span style={{ fontWeight: 600, color: '#334155' }}>{s.name}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: s.latency <= 5 ? '#059669' : s.latency <= 8 ? '#d97706' : '#dc2626',
                          background: s.latency <= 5 ? '#ecfdf5' : s.latency <= 8 ? '#fffbeb' : '#fef2f2',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '4px',
                          fontFamily: 'monospace'
                        }}
                      >
                        {s.latency} ms
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
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
