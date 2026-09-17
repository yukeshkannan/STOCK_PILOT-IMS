import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'react-toastify';
import ConfirmModal from '../../components/ConfirmModal';
import {
  Building,
  Users,
  RefreshCw,
  Search,
  Plus,
  X,
  Mail,
  ChevronRight,
  Trash2
} from 'lucide-react';

export default function SuperAdminTenants() {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  // Custom Confirmation Modal state (Zero browser alert/confirm boxes)
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    tenant: null
  });

  // Permanent Delete Confirmation Modal state
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    tenant: null,
    loading: false
  });

  const [formData, setFormData] = useState({
    company_name: '',
    company_code: '',
    email: '',
    phone: '',
    address: '',
    tax_number: ''
  });

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const [tenantsRes, pendingRes] = await Promise.allSettled([
        api.get('/admin/tenants'),
        api.get('/admin/pending-registrations')
      ]);

      const activeTenants = tenantsRes.status === 'fulfilled' ? (tenantsRes.value?.data || []) : [];
      const pendingTenants = pendingRes.status === 'fulfilled' ? (pendingRes.value?.data || []) : [];

      setTenants([...activeTenants, ...pendingTenants]);
    } catch (err) {
      console.error('Error fetching tenants:', err);
      toast.error('Failed to load tenants directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
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
      fetchTenants();
      window.dispatchEvent(new CustomEvent('stockpilot_tenants_changed'));
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to register tenant company');
    } finally {
      setFormLoading(false);
    }
  };

  const handlePlanChange = async (tenantId, newPlan, e) => {
    e.stopPropagation();
    try {
      await api.patch(`/admin/tenants/${tenantId}/plan`, { plan: newPlan });
      toast.success(`Plan updated to ${newPlan}`);
      fetchTenants();
      window.dispatchEvent(new CustomEvent('stockpilot_tenants_changed'));
    } catch (err) {
      toast.error(err?.message || 'Failed to update plan');
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
      fetchTenants();
      window.dispatchEvent(new CustomEvent('stockpilot_tenants_changed'));
    } catch (err) {
      toast.error(err.message || 'Failed to update tenant status');
    }
  };

  const openDeleteConfirmModal = (tenant) => {
    setDeleteModal({
      isOpen: true,
      tenant,
      loading: false
    });
  };

  const executeDeleteTenant = async () => {
    const tenant = deleteModal.tenant;
    if (!tenant) return;

    setDeleteModal((prev) => ({ ...prev, loading: true }));
    try {
      if (tenant.is_pending_setup) {
        const cleanId = tenant.pending_user_id || String(tenant.id).replace('pending-', '');
        await api.delete(`/admin/pending-registrations/${cleanId}`);
        toast.success(`Pending registration record [${tenant.email}] deleted successfully.`);
      } else {
        await api.delete(`/admin/tenants/${tenant.id}`);
        toast.success(`Organization [${tenant.company_name}] and all related data purged permanently.`);
      }
      setDeleteModal({ isOpen: false, tenant: null, loading: false });
      fetchTenants();
      window.dispatchEvent(new CustomEvent('stockpilot_tenants_changed'));
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to delete organization');
      setDeleteModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const filteredTenants = tenants.filter((t) => {
    const nameMatch = (t.company_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const codeMatch = (t.company_code || '').toLowerCase().includes(searchTerm.toLowerCase());
    const emailMatch = (t.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSearch = nameMatch || codeMatch || emailMatch;

    if (statusFilter === 'ACTIVE') return matchesSearch && t.status === 'ACTIVE';
    if (statusFilter === 'SUSPENDED') return matchesSearch && t.status === 'SUSPENDED';
    if (statusFilter === 'PENDING_SETUP') return matchesSearch && (t.status === 'PENDING_SETUP' || t.is_pending_setup);
    return matchesSearch;
  });

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Tenant Business Organizations Directory</h1>
          <p className="page-subtitle">
            Manage all registered multi-tenant SaaS companies, monitor user volume, and provision workspaces
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.85rem' }}>
          <button onClick={fetchTenants} className="btn btn-secondary">
            <RefreshCw size={16} className={loading ? 'spin' : ''} /> Refresh Directory
          </button>
          <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
            <Plus size={18} /> Provision New Tenant
          </button>
        </div>
      </div>

      {/* Main Directory Table Container */}
      <div className="card" style={{ marginBottom: '1.6rem' }}>
        {/* Search & Filter Toolbar */}
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            alignItems: 'center',
            marginBottom: '1.25rem',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ flex: 1, position: 'relative', minWidth: '280px' }}>
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
            {[
              { key: 'ALL', label: 'ALL' },
              { key: 'ACTIVE', label: 'ACTIVE' },
              { key: 'SUSPENDED', label: 'SUSPENDED' },
              { key: 'PENDING_SETUP', label: 'PENDING SETUP' }
            ].map((tab) => {
              const count = tab.key === 'ALL'
                ? tenants.length
                : tab.key === 'PENDING_SETUP'
                  ? tenants.filter(t => t.status === 'PENDING_SETUP' || t.is_pending_setup).length
                  : tenants.filter(t => t.status === tab.key && !t.is_pending_setup).length;

              return (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key)}
                  className={`segmented-tab ${statusFilter === tab.key ? 'active' : ''}`}
                  style={{
                    fontSize: '0.75rem',
                    padding: '0.35rem 0.75rem',
                    color: tab.key === 'PENDING_SETUP' && count > 0 && statusFilter !== tab.key ? '#d97706' : undefined,
                    fontWeight: tab.key === 'PENDING_SETUP' && count > 0 ? 700 : undefined
                  }}
                >
                  {tab.label} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* 100% Full-Width Table - Clean Box-Free Layout */}
        <div className="data-table-container-full">
          <table className="data-table">
            <thead>
              <tr>
                <th>Organization & GSTIN</th>
                <th>Company Code</th>
                <th>Primary Email</th>
                <th>Location & Phone</th>
                <th>Active Users</th>
                <th>Subscription Tier</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Platform Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                    No tenant businesses found matching search criteria.
                  </td>
                </tr>
              ) : (
                filteredTenants.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => {
                      if (!t.is_pending_setup) {
                        navigate(`/admin/tenants/${t.id}`);
                      }
                    }}
                    style={{
                      cursor: t.is_pending_setup ? 'default' : 'pointer',
                      background: t.is_pending_setup ? '#fffdfa' : undefined
                    }}
                    title={t.is_pending_setup ? 'Incomplete Registration - Pending Workspace Setup' : 'Click row to open dedicated organization details page'}
                  >
                    <td>
                      <div>
                        <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' }}>
                          {t.company_name}
                        </div>
                        <div style={{ fontSize: '0.725rem', color: t.is_pending_setup ? '#d97706' : '#64748b', marginTop: '1px', fontWeight: t.is_pending_setup ? 600 : 400 }}>
                          {t.is_pending_setup ? 'Awaiting Workspace Setup' : `GSTIN: ${t.tax_number || 'Standard Registration'}`}
                        </div>
                      </div>
                    </td>

                    <td>
                      {t.is_pending_setup ? (
                        <span
                          style={{
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            color: '#b45309',
                            fontSize: '0.75rem',
                            background: '#fef3c7',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            border: '1px solid #fde68a'
                          }}
                        >
                          PENDING
                        </span>
                      ) : (
                        <span
                          style={{
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            color: '#7c3aed',
                            fontSize: '0.85rem',
                            background: '#f5f3ff',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            border: '1px solid #ddd6fe'
                          }}
                        >
                          {t.company_code}
                        </span>
                      )}
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.825rem', color: '#334155' }}>
                        <Mail size={13} color="#94a3b8" /> {t.email}
                      </div>
                    </td>

                    <td>
                      <div style={{ fontSize: '0.8rem', color: t.is_pending_setup ? '#94a3b8' : '#475569', fontWeight: 500 }}>
                        {t.is_pending_setup ? 'Incomplete Profile' : (t.phone || '—')}
                      </div>
                      <div style={{ fontSize: '0.725rem', color: '#94a3b8', maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {t.address || 'Head Office'}
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.825rem', fontWeight: 600, color: '#334155', whiteSpace: 'nowrap' }}>
                        <Users size={14} color={t.is_pending_setup ? '#d97706' : '#7c3aed'} />
                        <span>{t.is_pending_setup ? '1 Pending User' : `${(t.users || []).length || 4} Users`}</span>
                      </div>
                    </td>

                    <td onClick={(e) => e.stopPropagation()}>
                      {t.is_pending_setup ? (
                        <span
                          style={{
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            color: '#64748b',
                            background: '#f1f5f9',
                            padding: '0.25rem 0.55rem',
                            borderRadius: '6px',
                            display: 'inline-block'
                          }}
                        >
                          TRIAL (Pending)
                        </span>
                      ) : (
                        <select
                          className="form-select"
                          style={{
                            fontSize: '0.74rem',
                            fontWeight: 800,
                            padding: '0.25rem 0.55rem',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            width: 'auto',
                            background:
                              t.plan === 'TRIAL' || t.plan === 'FREE_TRIAL'
                                ? '#ecfdf5'
                                : t.plan === 'STARTER'
                                ? '#eff6ff'
                                : t.plan === 'ENTERPRISE'
                                ? '#fffbeb'
                                : '#fdf4fc',
                            color:
                              t.plan === 'TRIAL' || t.plan === 'FREE_TRIAL'
                                ? '#059669'
                                : t.plan === 'STARTER'
                                ? '#2563eb'
                                : t.plan === 'ENTERPRISE'
                                ? '#d97706'
                                : '#982A86',
                            border:
                              t.plan === 'TRIAL' || t.plan === 'FREE_TRIAL'
                                ? '1px solid #a7f3d0'
                                : t.plan === 'STARTER'
                                ? '1px solid #bfdbfe'
                                : t.plan === 'ENTERPRISE'
                                ? '1px solid #fde68a'
                                : '1px solid #f3c7ec'
                          }}
                          value={t.plan || 'TRIAL'}
                          onChange={(e) => handlePlanChange(t.id, e.target.value, e)}
                          title="Change organization subscription tier"
                        >
                          <option value="TRIAL">14-DAY TRIAL (₹0)</option>
                          <option value="STARTER">STARTER (₹499)</option>
                          <option value="PRO">PRO GROWTH (₹1,499)</option>
                          <option value="ENTERPRISE">ENTERPRISE (₹3,999)</option>
                        </select>
                      )}
                    </td>

                    <td>
                      {t.is_pending_setup ? (
                        <span
                          className="badge"
                          style={{
                            background: '#fffbeb',
                            color: '#b45309',
                            border: '1px solid #fde68a',
                            fontWeight: 700
                          }}
                        >
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b' }}></span>
                          Pending Setup
                        </span>
                      ) : (
                        <span className={`badge ${t.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: t.status === 'ACTIVE' ? '#10b981' : '#ef4444' }}></span>
                          {t.status === 'ACTIVE' ? 'Active' : 'Suspended'}
                        </span>
                      )}
                    </td>

                    <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                        {!t.is_pending_setup && (
                          <button
                            onClick={() => openToggleConfirmModal(t)}
                            className={`btn btn-sm ${t.status === 'SUSPENDED' ? 'btn-success' : 'btn-secondary'}`}
                            style={{
                              fontSize: '0.75rem',
                              padding: '0.3rem 0.65rem',
                              background: t.status === 'SUSPENDED' ? '#ecfdf5' : '#f8fafc',
                              color: t.status === 'SUSPENDED' ? '#059669' : '#475569',
                              border: t.status === 'SUSPENDED' ? '1px solid #a7f3d0' : '1px solid #cbd5e1'
                            }}
                          >
                            {t.status === 'SUSPENDED' ? 'Activate' : 'Suspend'}
                          </button>
                        )}

                        <button
                          onClick={() => openDeleteConfirmModal(t)}
                          className="btn btn-sm"
                          style={{
                            fontSize: '0.75rem',
                            padding: '0.3rem 0.55rem',
                            background: '#fef2f2',
                            color: '#dc2626',
                            border: '1px solid #fecaca',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            cursor: 'pointer'
                          }}
                          title={t.is_pending_setup ? 'Permanently Purge Pending Registration Record' : 'Permanently Delete Tenant & Purge All Data'}
                        >
                          <Trash2 size={13} />
                          <span>{t.is_pending_setup ? 'Purge' : 'Delete'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ultra-Minimalist Action Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="modal-overlay" onClick={() => setConfirmModal({ isOpen: false, tenant: null })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '390px', padding: '1.5rem' }}>
            <div style={{ textAlign: 'left' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem' }}>
                {confirmModal.tenant?.status === 'SUSPENDED' ? 'Activate' : 'Suspend'} {confirmModal.tenant?.company_name}?
              </h3>

              <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.45, marginBottom: '1.35rem' }}>
                {confirmModal.tenant?.status === 'SUSPENDED'
                  ? 'This will restore platform access for all users in this tenant organization.'
                  : 'This will temporarily block platform access for all users in this organization.'}
              </p>

              <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setConfirmModal({ isOpen: false, tenant: null })}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={executeToggleSuspend}
                  className={`btn ${confirmModal.tenant?.status === 'SUSPENDED' ? 'btn-primary' : 'btn-danger'} btn-sm`}
                >
                  {confirmModal.tenant?.status === 'SUSPENDED' ? 'Activate Access' : 'Suspend Tenant'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Permanent Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, tenant: null, loading: false })}
        onConfirm={executeDeleteTenant}
        title={deleteModal.tenant?.is_pending_setup ? 'Purge Pending Registration?' : 'Delete Tenant Company?'}
        message={
          deleteModal.tenant?.is_pending_setup
            ? 'Are you sure you want to permanently delete this pending registration and free up the email?'
            : 'Are you sure you want to delete this tenant organization and all associated records?'
        }
        itemName={
          deleteModal.tenant
            ? `${deleteModal.tenant.company_name} (${deleteModal.tenant.company_code || deleteModal.tenant.email})`
            : ''
        }
        confirmText={deleteModal.tenant?.is_pending_setup ? 'Purge Account' : 'Delete Company'}
        loading={deleteModal.loading}
      />

      {/* Onboard Tenant Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
                  Provision New Business Tenant
                </h2>
                <p style={{ fontSize: '0.825rem', color: '#64748b', marginTop: '0.2rem' }}>
                  Register a new organization and initialize its isolated database workspace
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateTenant}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Company / Organization Name *</label>
                  <input
                    type="text"
                    name="company_name"
                    required
                    placeholder="e.g. Apex Global Traders"
                    value={formData.company_name}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Unique Company Code (Code) *</label>
                  <input
                    type="text"
                    name="company_code"
                    required
                    placeholder="e.g. APX004"
                    value={formData.company_code}
                    onChange={handleInputChange}
                    className="form-input"
                    maxLength={10}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Primary Admin Email *</label>
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="admin@apex.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Contact Phone</label>
                  <input
                    type="text"
                    name="phone"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">GSTIN / Tax Number</label>
                  <input
                    type="text"
                    name="tax_number"
                    placeholder="29ABCDE1234F1Z5"
                    value={formData.tax_number}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Head Office Address</label>
                  <input
                    type="text"
                    name="address"
                    placeholder="Whitefield, Bengaluru"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="btn btn-primary"
                >
                  {formLoading ? 'Provisioning Tenant...' : 'Initialize & Register Tenant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
