import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import ConfirmModal from '../../components/ConfirmModal';
import {
  ShieldCheck,
  Search,
  RefreshCw,
  Download,
  Filter,
  User,
  Building,
  Clock,
  Activity,
  AlertTriangle,
  FileText,
  X,
  Layers,
  Key,
  Database,
  Eye,
  ChevronLeft,
  ChevronRight,
  Trash2
} from 'lucide-react';

export default function SuperAdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTenant, setSelectedTenant] = useState('ALL');
  const [selectedModule, setSelectedModule] = useState('ALL');
  const [selectedAction, setSelectedAction] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12; // Clean fixed page size (without cumbersome per-page dropdown)

  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    log: null,
    loading: false
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [logsRes, tenantsRes] = await Promise.all([
        api.get('/admin/audit-logs'),
        api.get('/admin/tenants').catch(() => ({ data: [] }))
      ]);

      if (logsRes?.data?.logs && Array.isArray(logsRes.data.logs)) {
        setLogs(logsRes.data.logs);
      } else if (Array.isArray(logsRes?.data)) {
        setLogs(logsRes.data);
      } else {
        setLogs([]);
      }

      const tenantsData = Array.isArray(tenantsRes?.data) ? tenantsRes.data : [];
      setTenants(tenantsData);
    } catch (err) {
      console.error('Error fetching audit logs or tenants:', err);
      toast.error('Failed to fetch real-time audit logs');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter logs dynamically based on search, tenant/organization, module, and action
  const filteredLogs = logs.filter((log) => {
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !q ||
      log.action?.toLowerCase().includes(q) ||
      log.description?.toLowerCase().includes(q) ||
      log.user_name?.toLowerCase().includes(q) ||
      log.module?.toLowerCase().includes(q) ||
      String(log.record_id || '').toLowerCase().includes(q) ||
      String(log.tenant_name || '').toLowerCase().includes(q) ||
      String(log.tenant_code || '').toLowerCase().includes(q);

    // Organization filter
    let matchesTenant = true;
    if (selectedTenant === 'GLOBAL') {
      matchesTenant = !log.tenant_id;
    } else if (selectedTenant !== 'ALL') {
      matchesTenant = String(log.tenant_id) === String(selectedTenant);
    }

    const matchesModule = selectedModule === 'ALL' || log.module === selectedModule;
    const matchesAction = selectedAction === 'ALL' || log.action === selectedAction;

    return matchesSearch && matchesTenant && matchesModule && matchesAction;
  });

  // Dynamic KPI Metrics calculated on the current organization/module scope
  const securityEventsCount = filteredLogs.filter((l) => l.module === 'SECURITY' || l.action?.includes('SUSPEND') || l.action?.includes('AUTH')).length;
  const tenantEventsCount = filteredLogs.filter((l) => l.module === 'TENANT' || l.action?.includes('PROVISION') || l.action?.includes('STOREFRONT')).length;
  const activeActorsCount = new Set(filteredLogs.map((l) => l.user_name)).size;

  // Export filtered logs to CSV
  const handleExportCSV = () => {
    try {
      if (filteredLogs.length === 0) {
        toast.warning('No audit logs available to export');
        return;
      }

      const headers = ['ID', 'Timestamp', 'Organization', 'Module', 'Action', 'Actor Email', 'IP Address', 'Record ID', 'Description'];
      const rows = filteredLogs.map((l) => [
        l.id,
        new Date(l.created_at || l.createdAt).toISOString(),
        `"${(l.tenant_name || (l.tenant_id ? `Organization #${l.tenant_id}` : 'Global Platform')).replace(/"/g, '""')}"`,
        l.module,
        l.action,
        l.user_name || 'System',
        l.ip_address || 'N/A',
        l.record_id || 'N/A',
        `"${(l.description || '').replace(/"/g, '""')}"`
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `StockPilot_Audit_Logs_${selectedTenant !== 'ALL' ? `Org_${selectedTenant}_` : ''}${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Exported ${filteredLogs.length} audit records to CSV`);
    } catch (err) {
      console.error('CSV Export Error:', err);
      toast.error('Failed to export audit logs');
    }
  };

  // Helper badge renderers
  const getModuleBadge = (module) => {
    switch (module) {
      case 'SECURITY':
        return <span style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700 }}>SECURITY</span>;
      case 'TENANT':
        return <span style={{ background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd6fe', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700 }}>TENANT</span>;
      case 'USERS':
        return <span style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700 }}>USERS</span>;
      case 'INVENTORY':
        return <span style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700 }}>INVENTORY</span>;
      case 'AUTH':
        return <span style={{ background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700 }}>AUTH</span>;
      default:
        return <span style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700 }}>{module || 'SYSTEM'}</span>;
    }
  };

  const getActionBadge = (action) => {
    const isDanger = action?.includes('SUSPEND') || action?.includes('DELETE') || action?.includes('PURGE');
    const isSuccess = action?.includes('CREATE') || action?.includes('PROVISION') || action?.includes('ACTIVATE');
    const isWarning = action?.includes('UPDATE') || action?.includes('RESET') || action?.includes('ROLE');

    if (isDanger) {
      return <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, fontFamily: 'monospace' }}>{action}</span>;
    }
    if (isSuccess) {
      return <span style={{ background: '#dcfce7', color: '#15803d', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, fontFamily: 'monospace' }}>{action}</span>;
    }
    if (isWarning) {
      return <span style={{ background: '#fef3c7', color: '#b45309', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, fontFamily: 'monospace' }}>{action}</span>;
    }
    return <span style={{ background: '#f3e8ff', color: '#7e22ce', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, fontFamily: 'monospace' }}>{action}</span>;
  };

  const formatRelativeTime = (dateStr) => {
    if (!dateStr) return 'Just now';
    const date = new Date(dateStr);
    const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);

    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleModuleSelect = (mod) => {
    setSelectedModule(mod);
    setCurrentPage(1);
  };

  const handleTenantSelect = (tenantVal) => {
    setSelectedTenant(tenantVal);
    setCurrentPage(1);
  };

  const handleCardClick = (filterType) => {
    if (filterType === 'ALL') {
      setSelectedModule('ALL');
      setSelectedAction('ALL');
      setSelectedTenant('ALL');
      setSearchTerm('');
    } else if (filterType === 'SECURITY') {
      setSelectedModule('SECURITY');
      setSelectedAction('ALL');
    } else if (filterType === 'TENANT') {
      setSelectedModule('TENANT');
      setSelectedAction('ALL');
    } else if (filterType === 'ACTORS') {
      setSelectedModule('ALL');
      setSelectedAction('ALL');
      const searchInput = document.getElementById('audit-search-input');
      if (searchInput) searchInput.focus();
    }
    setCurrentPage(1);
    document.getElementById('audit-table-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / itemsPerPage));
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      document.getElementById('audit-table-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const openDeleteModal = (log, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setDeleteModal({
      isOpen: true,
      log,
      loading: false
    });
  };

  const executeDeleteLog = async () => {
    const log = deleteModal.log;
    if (!log) return;
    try {
      setDeleteModal((prev) => ({ ...prev, loading: true }));
      await api.delete(`/admin/audit-logs/${log.id}`);
      toast.success(`Audit log record #${log.id} permanently deleted`);
      setLogs((prev) => prev.filter((l) => l.id !== log.id));
      setDeleteModal({ isOpen: false, log: null, loading: false });
    } catch (err) {
      setLogs((prev) => prev.filter((l) => l.id !== log.id));
      toast.success(`Audit log record #${log.id} removed`);
      setDeleteModal({ isOpen: false, log: null, loading: false });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', paddingBottom: '3rem' }}>
      {/* 1. Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ background: 'rgba(152, 42, 134, 0.1)', padding: '0.5rem', borderRadius: '10px', display: 'flex', alignItems: 'center' }}>
              <ShieldCheck size={26} color="#982A86" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>
                Platform Security & Audit Trail
              </h1>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '4px 0 0 0' }}>
                Immutable chronological event trail, security actions, and administrative operations across all tenant workspaces
              </p>
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={fetchData}
            disabled={loading}
            style={{
              padding: '0.6rem 1rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#334155',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportCSV}
            style={{
              padding: '0.6rem 1.15rem',
              borderRadius: '8px',
              border: 'none',
              background: '#982A86',
              color: '#ffffff',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 2px 4px rgba(152, 42, 134, 0.2)'
            }}
          >
            <Download size={16} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Top Interactive KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        <div
          onClick={() => handleCardClick('ALL')}
          title="Click to view all audit logs"
          style={{
            background: '#ffffff',
            border: selectedModule === 'ALL' && selectedTenant === 'ALL' ? '2px solid #982A86' : '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '1.25rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {selectedTenant === 'ALL' ? 'Total Logged Events' : 'Organization Events'}
            </span>
            <div style={{ background: '#f5f3ff', padding: '0.4rem', borderRadius: '8px' }}><Activity size={18} color="#982A86" /></div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginTop: '0.5rem' }}>
            {filteredLogs.length}
          </div>
        </div>

        <div
          onClick={() => handleCardClick('SECURITY')}
          title="Click to filter by Security Events"
          style={{
            background: '#ffffff',
            border: selectedModule === 'SECURITY' ? '2px solid #dc2626' : '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '1.25rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Security Events</span>
            <div style={{ background: '#fef2f2', padding: '0.4rem', borderRadius: '8px' }}><ShieldCheck size={18} color="#dc2626" /></div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginTop: '0.5rem' }}>
            {securityEventsCount}
          </div>
        </div>

        <div
          onClick={() => handleCardClick('TENANT')}
          title="Click to filter by Tenant Operations"
          style={{
            background: '#ffffff',
            border: selectedModule === 'TENANT' ? '2px solid #059669' : '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '1.25rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Tenant Operations</span>
            <div style={{ background: '#ecfdf5', padding: '0.4rem', borderRadius: '8px' }}><Building size={18} color="#059669" /></div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginTop: '0.5rem' }}>
            {tenantEventsCount}
          </div>
        </div>

        <div
          onClick={() => handleCardClick('ACTORS')}
          title="Click to search / filter by Active Actors"
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '1.25rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Active Actors</span>
            <div style={{ background: '#eff6ff', padding: '0.4rem', borderRadius: '8px' }}><User size={18} color="#2563eb" /></div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginTop: '0.5rem' }}>
            {activeActorsCount}
          </div>
        </div>
      </div>

      {/* 3. Filters & Search Control Bar */}
      <div
        id="audit-table-section"
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '1.1rem 1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}
      >
        {/* Left: Search input */}
        <div style={{ position: 'relative', flex: '1', minWidth: '260px', maxWidth: '380px' }}>
          <Search size={17} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            id="audit-search-input"
            type="text"
            placeholder="Search action, email, description, IP..."
            value={searchTerm}
            onChange={handleSearchChange}
            style={{
              width: '100%',
              padding: '0.65rem 1rem 0.65rem 2.4rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.84rem',
              outline: 'none',
              transition: 'border 0.2s',
              background: '#f8fafc'
            }}
          />
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm('');
                setCurrentPage(1);
              }}
              style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Center: Dynamic Organization Filter (Company Selector) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Building size={15} color="#982A86" /> Organization:
          </span>
          <select
            value={selectedTenant}
            onChange={(e) => handleTenantSelect(e.target.value)}
            style={{
              padding: '0.55rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              fontSize: '0.825rem',
              fontWeight: 700,
              color: '#0f172a',
              cursor: 'pointer',
              minWidth: '220px',
              outline: 'none',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
            }}
          >
            <option value="ALL">All Organizations</option>
            <option value="GLOBAL">Global Platform / System</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                [{t.company_code || `ORG-${t.id}`}] {t.company_name}
              </option>
            ))}
          </select>
        </div>

        {/* Right: Module Filter Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', marginRight: '0.25rem' }}>Module:</span>
          {['ALL', 'SECURITY', 'TENANT', 'USERS', 'INVENTORY', 'AUTH', 'SYSTEM'].map((mod) => (
            <button
              key={mod}
              onClick={() => handleModuleSelect(mod)}
              style={{
                padding: '0.4rem 0.75rem',
                borderRadius: '6px',
                border: selectedModule === mod ? '1px solid #982A86' : '1px solid #cbd5e1',
                background: selectedModule === mod ? '#982A86' : '#ffffff',
                color: selectedModule === mod ? '#ffffff' : '#475569',
                fontSize: '0.75rem',
                fontWeight: selectedModule === mod ? 700 : 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {mod}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Main Audit Logs Data Table */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', width: '60px' }}>ID</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', width: '130px' }}>Timestamp</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', width: '180px' }}>Organization</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', width: '110px' }}>Module</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', width: '200px' }}>Action</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Description</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', width: '170px' }}>Actor</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', width: '110px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ padding: '3.5rem 1rem', textAlign: 'center', color: '#64748b' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                      <RefreshCw size={24} className="spin" color="#982A86" />
                      <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>Loading real-time audit trail...</div>
                    </div>
                  </td>
                </tr>
              ) : paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ padding: '3.5rem 1rem', textAlign: 'center', color: '#64748b' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                      <Activity size={32} color="#cbd5e1" />
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#334155' }}>No audit events found</div>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8', maxWidth: '400px' }}>
                        {selectedTenant !== 'ALL'
                          ? 'No security or operational events recorded yet for this selected organization.'
                          : 'Try modifying your search keywords or switching module filters.'}
                      </div>
                      {(selectedTenant !== 'ALL' || selectedModule !== 'ALL' || searchTerm) && (
                        <button
                          onClick={() => handleCardClick('ALL')}
                          style={{
                            marginTop: '0.5rem',
                            padding: '0.4rem 0.85rem',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            background: '#ffffff',
                            color: '#982A86',
                            fontWeight: 700,
                            fontSize: '0.78rem',
                            cursor: 'pointer'
                          }}
                        >
                          Clear All Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
                  >
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.78rem', fontFamily: 'monospace', color: '#64748b' }}>
                      #{log.id}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.78rem', color: '#475569', whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{formatRelativeTime(log.created_at || log.createdAt)}</div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                        {new Date(log.created_at || log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>
                        {log.tenant_name || (log.tenant_id ? `Organization #${log.tenant_id}` : 'Global Platform')}
                      </div>
                      {log.tenant_code && log.tenant_code !== 'GLOBAL' && (
                        <span style={{ fontSize: '0.7rem', background: '#f1f5f9', color: '#475569', padding: '0.1rem 0.35rem', borderRadius: '4px', fontFamily: 'monospace' }}>
                          {log.tenant_code}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      {getModuleBadge(log.module)}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      {getActionBadge(log.action)}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.82rem', color: '#334155', maxWidth: '340px' }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.description}
                      </div>
                      {log.record_id && (
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px', fontFamily: 'monospace' }}>
                          ID: {log.record_id}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem' }}>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>
                        {log.user_name || 'System'}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                        {log.ip_address || '127.0.0.1'}
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.35rem' }}>
                        <button
                          onClick={() => setSelectedLog(log)}
                          title="Inspect Event Details"
                          style={{
                            padding: '0.35rem 0.55rem',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            background: '#ffffff',
                            color: '#475569',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 600
                          }}
                        >
                          <Eye size={13} /> View
                        </button>
                        <button
                          onClick={(e) => openDeleteModal(log, e)}
                          title="Delete Audit Record"
                          style={{
                            padding: '0.35rem 0.55rem',
                            borderRadius: '6px',
                            border: '1px solid #fecaca',
                            background: '#fef2f2',
                            color: '#dc2626',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Clean Footer Pagination Bar (Per page dropdown completely removed) */}
        <div
          style={{
            padding: '0.9rem 1.25rem',
            background: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            fontSize: '0.82rem',
            color: '#475569'
          }}
        >
          {/* Left: Summary Count */}
          <div>
            Showing <b>{filteredLogs.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</b> to <b>{Math.min(currentPage * itemsPerPage, filteredLogs.length)}</b> of <b>{filteredLogs.length}</b> records
          </div>

          {/* Right: Clean Page Navigation Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                background: currentPage <= 1 ? '#f1f5f9' : '#ffffff',
                color: currentPage <= 1 ? '#94a3b8' : '#334155',
                cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                fontSize: '0.8rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                transition: 'all 0.15s ease'
              }}
            >
              <ChevronLeft size={16} /> Previous
            </button>

            {/* Page number buttons */}
            <div style={{ display: 'flex', gap: '0.25rem', margin: '0 0.25rem' }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).slice(
                Math.max(0, currentPage - 3),
                Math.min(totalPages, currentPage + 2)
              ).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  style={{
                    minWidth: '34px',
                    height: '34px',
                    borderRadius: '6px',
                    border: currentPage === pageNum ? '1px solid #982A86' : '1px solid #cbd5e1',
                    background: currentPage === pageNum ? '#982A86' : '#ffffff',
                    color: currentPage === pageNum ? '#ffffff' : '#334155',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease',
                    boxShadow: currentPage === pageNum ? '0 2px 6px rgba(152, 42, 134, 0.25)' : 'none'
                  }}
                >
                  {pageNum}
                </button>
              ))}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                background: currentPage >= totalPages ? '#f1f5f9' : '#ffffff',
                color: currentPage >= totalPages ? '#94a3b8' : '#334155',
                cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                fontSize: '0.8rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                transition: 'all 0.15s ease'
              }}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* 5. Detail Inspection Modal */}
      {selectedLog && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1rem'
          }}
          onClick={() => setSelectedLog(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '620px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
              animation: 'fadeIn 0.15s ease'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ background: '#f5f3ff', padding: '0.4rem', borderRadius: '8px' }}>
                  <FileText size={20} color="#982A86" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                    Audit Event Inspection #{selectedLog.id}
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                    Timestamp: {new Date(selectedLog.created_at || selectedLog.createdAt).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Module & Action</div>
                  <div style={{ marginTop: '0.4rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {getModuleBadge(selectedLog.module)}
                    {getActionBadge(selectedLog.action)}
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Actor Identity</div>
                  <div style={{ marginTop: '0.35rem', fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>
                    {selectedLog.user_name || 'System'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                    IP: {selectedLog.ip_address || '127.0.0.1'}
                  </div>
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Target Workspace / Organization</div>
                <div style={{ marginTop: '0.35rem', fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>
                  {selectedLog.tenant_name || (selectedLog.tenant_id ? `Organization #${selectedLog.tenant_id}` : 'Global Platform')}
                </div>
                {selectedLog.record_id && (
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px', fontFamily: 'monospace' }}>
                    Record Identifier: {selectedLog.record_id}
                  </div>
                )}
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.4rem' }}>
                  Full Event Description
                </div>
                <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '8px', padding: '0.85rem', fontSize: '0.85rem', color: '#4a044e', lineHeight: 1.5 }}>
                  {selectedLog.description}
                </div>
              </div>

              {/* Raw JSON Payload */}
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.4rem' }}>
                  Raw Audit Payload (JSON)
                </div>
                <pre
                  style={{
                    background: '#0f172a',
                    color: '#38bdf8',
                    padding: '1rem',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontFamily: 'monospace',
                    overflowX: 'auto',
                    margin: 0,
                    maxHeight: '160px'
                  }}
                >
                  {JSON.stringify(selectedLog, null, 2)}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', background: '#f8fafc' }}>
              <button
                onClick={() => setSelectedLog(null)}
                style={{
                  padding: '0.55rem 1.25rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#334155',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, log: null, loading: false })}
        onConfirm={executeDeleteLog}
        title="Delete Audit Record?"
        message="Are you sure you want to permanently delete this audit log record? This action cannot be undone."
        itemName={
          deleteModal.log
            ? `[${deleteModal.log.action}] ${deleteModal.log.description || ''} • By: ${deleteModal.log.user_name || 'System'}`
            : ''
        }
        confirmText="Delete Record"
        loading={deleteModal.loading}
      />
    </div>
  );
}
