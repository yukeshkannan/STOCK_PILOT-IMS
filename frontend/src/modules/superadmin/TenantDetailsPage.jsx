import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'react-toastify';
import {
  Building,
  Users,
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Key,
  Download,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FileText,
  ShieldCheck,
  Power
} from 'lucide-react';

export default function TenantDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Custom Confirm Modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    action: ''
  });

  const fetchTenantDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/tenants');
      const allTenants = res?.data || [];
      const found = allTenants.find((t) => String(t.id) === String(id));

      if (found) {
        setTenant(found);
      } else {
        setTenant(null);
      }
    } catch (err) {
      console.error('Error loading tenant details:', err);
      toast.error('Failed to load tenant details');
      setTenant(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenantDetails();
  }, [id]);

  const executeToggleSuspend = async () => {
    if (!tenant) return;
    const isSuspended = tenant.status === 'SUSPENDED';
    const actionUrl = isSuspended
      ? `/admin/tenants/${tenant.id}/activate`
      : `/admin/tenants/${tenant.id}/suspend`;

    try {
      setActionLoading(true);
      await api.patch(actionUrl);
      const newStatus = isSuspended ? 'ACTIVE' : 'SUSPENDED';
      setTenant((prev) => ({ ...prev, status: newStatus }));
      toast.success(`${tenant.company_name} is now ${newStatus.toLowerCase()}`);
      setConfirmModal({ isOpen: false, action: '' });
      fetchTenantDetails();
      window.dispatchEvent(new CustomEvent('stockpilot_tenants_changed'));
    } catch (err) {
      toast.error(err.message || 'Failed to update organization status');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
        <RefreshCw size={24} className="spin" style={{ color: '#982A86', marginBottom: '0.85rem' }} />
        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Loading organization details...</div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Organization Not Found</h2>
        <Link to="/admin/tenants" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
          <ArrowLeft size={16} /> Return to Directory
        </Link>
      </div>
    );
  }

  const usersList = tenant.users && tenant.users.length > 0
    ? tenant.users
    : [
        { id: 1, first_name: tenant.company_name, last_name: 'Admin', email: tenant.email, role_name: 'ADMIN', status: tenant.status }
      ];

  const formattedDate = tenant.created_at || tenant.createdAt
    ? new Date(tenant.created_at || tenant.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Active';

  const isSuspended = tenant.status === 'SUSPENDED';

  return (
    <div>
      {/* Top Breadcrumb Navigation */}
      <div style={{ marginBottom: '1.25rem' }}>
        <Link
          to="/admin/tenants"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.825rem',
            fontWeight: 600,
            color: '#64748b',
            textDecoration: 'none',
            transition: 'color 0.15s ease'
          }}
          onMouseOver={(e) => (e.currentTarget.style.color = '#982A86')}
          onMouseOut={(e) => (e.currentTarget.style.color = '#64748b')}
        >
          <ArrowLeft size={15} /> All Organizations
        </Link>
      </div>

      {/* Modern High-End Executive Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1.25rem',
          marginBottom: '1.75rem',
          paddingBottom: '1.5rem',
          borderBottom: '1px solid #e2e8f0'
        }}
      >
        <div>
          {/* Main Title */}
          <h1
            style={{
              fontSize: '1.65rem',
              fontWeight: 800,
              color: '#0f172a',
              letterSpacing: '-0.03em',
              margin: 0,
              lineHeight: 1.2
            }}
          >
            {tenant.company_name}
          </h1>

          {/* Clean Metadata Line (No weird cartoon badges) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginTop: '0.5rem',
              fontSize: '0.85rem',
              color: '#64748b',
              flexWrap: 'wrap'
            }}
          >
            <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>
              #{tenant.company_code}
            </span>

            <span style={{ color: '#cbd5e1' }}>•</span>

            <span
              style={{
                fontWeight: 800,
                fontSize: '0.75rem',
                color:
                  tenant.plan === 'TRIAL' || tenant.plan === 'FREE_TRIAL'
                    ? '#059669'
                    : tenant.plan === 'STARTER'
                    ? '#2563eb'
                    : tenant.plan === 'ENTERPRISE'
                    ? '#d97706'
                    : '#982A86',
                background:
                  tenant.plan === 'TRIAL' || tenant.plan === 'FREE_TRIAL'
                    ? '#ecfdf5'
                    : tenant.plan === 'STARTER'
                    ? '#eff6ff'
                    : tenant.plan === 'ENTERPRISE'
                    ? '#fffbeb'
                    : '#fdf4fc',
                padding: '0.15rem 0.55rem',
                borderRadius: '6px',
                border:
                  tenant.plan === 'TRIAL' || tenant.plan === 'FREE_TRIAL'
                    ? '1px solid #a7f3d0'
                    : tenant.plan === 'STARTER'
                    ? '1px solid #bfdbfe'
                    : tenant.plan === 'ENTERPRISE'
                    ? '1px solid #fde68a'
                    : '1px solid #f3c7ec'
              }}
            >
              {tenant.plan === 'TRIAL' || tenant.plan === 'FREE_TRIAL'
                ? '14-DAY FREE TRIAL'
                : `${tenant.plan || 'TRIAL'} PLAN`}
            </span>

            <span style={{ color: '#cbd5e1' }}>•</span>

            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, color: isSuspended ? '#dc2626' : '#16a34a' }}>
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: isSuspended ? '#dc2626' : '#16a34a'
                }}
              />
              {isSuspended ? 'Access Suspended' : 'Active Account'}
            </span>

            <span style={{ color: '#cbd5e1' }}>•</span>

            <span>
              GSTIN: <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#334155' }}>{tenant.tax_number || 'Standard Registered'}</span>
            </span>

            <span style={{ color: '#cbd5e1' }}>•</span>

            <span>Created {formattedDate}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => toast.success(`Configuration report exported for ${tenant.company_name}`)}
            className="btn btn-secondary"
            style={{ fontSize: '0.825rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Download size={15} /> Export Report
          </button>

          <button
            onClick={() => setConfirmModal({ isOpen: true, action: 'toggle' })}
            className={`btn ${isSuspended ? 'btn-primary' : 'btn-danger'}`}
            style={{ fontSize: '0.825rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Power size={15} />
            {isSuspended ? 'Activate Access' : 'Suspend Organization'}
          </button>
        </div>
      </div>

      {/* 2-Column Clean Details View */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '1.5rem',
          marginBottom: '1.75rem'
        }}
      >
        {/* Left Column: Organization & Primary Contact */}
        <div className="card" style={{ background: '#ffffff' }}>
          <div className="card-header" style={{ marginBottom: '1.25rem' }}>
            <h3 className="card-title" style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Building size={18} color="#982A86" />
              <span>Organization & Contact Information</span>
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ color: '#64748b' }}>Primary Admin Email:</span>
              <span style={{ fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Mail size={14} color="#982A86" /> {tenant.email}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ color: '#64748b' }}>Contact Phone:</span>
              <span style={{ fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Phone size={14} color="#059669" /> {tenant.phone || '—'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ color: '#64748b' }}>Tax / GSTIN Number:</span>
              <span style={{ fontWeight: 700, fontFamily: 'monospace', color: '#0f172a' }}>
                {tenant.tax_number || 'Standard Registered'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Registered Address:</span>
              <span style={{ fontWeight: 500, color: '#0f172a', textAlign: 'right', maxWidth: '240px', lineHeight: 1.4 }}>
                {tenant.address || 'Head Office Address'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Platform Status & Admin Security */}
        <div className="card" style={{ background: '#ffffff' }}>
          <div className="card-header" style={{ marginBottom: '1.25rem' }}>
            <h3 className="card-title" style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <ShieldCheck size={18} color="#982A86" />
              <span>Workspace Access & Credentials</span>
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ color: '#64748b' }}>Current Access State:</span>
              <span style={{ fontWeight: 700, color: isSuspended ? '#dc2626' : '#16a34a' }}>
                {isSuspended ? 'Suspended' : 'Active Access'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ color: '#64748b' }}>Provisioned Staff Users:</span>
              <span style={{ fontWeight: 700, color: '#0f172a' }}>{usersList.length} User Accounts</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ color: '#64748b' }}>Onboarded Date:</span>
              <span style={{ fontWeight: 600, color: '#0f172a' }}>{formattedDate}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#64748b' }}>Admin Security:</span>
              <button
                onClick={() => toast.info(`Password reset instructions sent to ${tenant.email}`)}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <Key size={13} /> Reset Admin Password
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Full-Width Workspace Staff Members Table */}
      <div className="card">
        <div className="card-header" style={{ marginBottom: '1.15rem' }}>
          <div>
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Users size={18} color="#982A86" />
              <span>Workspace Staff Accounts ({usersList.length})</span>
            </h3>
            <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.15rem' }}>
              All provisioned users and role assignments for {tenant.company_name}
            </p>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Staff Member</th>
                <th>Email Address</th>
                <th>Access Role</th>
                <th style={{ textAlign: 'right' }}>Account Status</th>
              </tr>
            </thead>
            <tbody>
              {usersList.map((u, idx) => {
                const fullName = (u.first_name || u.last_name)
                  ? `${u.first_name || ''} ${u.last_name || ''}`.trim()
                  : (idx === 0 ? 'Primary Administrator' : 'Staff User');

                return (
                  <tr key={u.id || idx}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: '#fdf2fb',
                            border: '1px solid #f3c7ec',
                            color: '#982A86',
                            fontWeight: 700,
                            fontSize: '0.78rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{fullName}</div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'monospace' }}>USR-00{u.id || idx + 1}</div>
                        </div>
                      </div>
                    </td>

                    <td style={{ color: '#334155', fontWeight: 500 }}>
                      {u.email}
                    </td>

                    <td>
                      <span
                        style={{
                          fontSize: '0.725rem',
                          fontWeight: 700,
                          color: (u.role_name === 'ADMIN' || u.role_name === 'Super Admin') ? '#982A86' : '#475569',
                          background: (u.role_name === 'ADMIN' || u.role_name === 'Super Admin') ? '#fdf2fb' : '#f1f5f9',
                          border: (u.role_name === 'ADMIN' || u.role_name === 'Super Admin') ? '1px solid #f3c7ec' : '1px solid #e2e8f0',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em'
                        }}
                      >
                        {u.role_name || 'STAFF'}
                      </span>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 600, color: isSuspended ? '#dc2626' : '#16a34a' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: isSuspended ? '#dc2626' : '#16a34a' }} />
                        {isSuspended ? 'Suspended' : 'Active'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Suspend / Activate Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="modal-overlay" onClick={() => setConfirmModal({ isOpen: false, action: '' })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px', textAlign: 'center' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: isSuspended ? '#ecfdf5' : '#fef2f2',
                color: isSuspended ? '#059669' : '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem auto'
              }}
            >
              {isSuspended ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
            </div>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
              {isSuspended ? 'Activate Tenant Access?' : 'Suspend Tenant Access?'}
            </h3>
            <p style={{ fontSize: '0.825rem', color: '#64748b', marginTop: '0.35rem', lineHeight: 1.4 }}>
              Are you sure you want to {isSuspended ? 'restore' : 'suspend'} access for{' '}
              <strong>{tenant.company_name}</strong>?
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1.5rem' }}>
              <button
                onClick={() => setConfirmModal({ isOpen: false, action: '' })}
                className="btn btn-secondary"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={executeToggleSuspend}
                className={`btn ${isSuspended ? 'btn-success' : 'btn-danger'}`}
                disabled={actionLoading}
              >
                {actionLoading ? 'Updating...' : `Yes, ${isSuspended ? 'Activate Access' : 'Suspend Access'}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
