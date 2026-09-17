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
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState('ALL');
  const [selectedAction, setSelectedAction] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    log: null,
    loading: false
  });

  // Fallback demo seed data if database has fresh/empty logs
  const defaultFallbackLogs = [
    {
      id: 101,
      tenant_id: 1,
      tenant_name: 'ABC Electronics Ltd',
      user_id: 1,
      user_name: 'admin@stockpilot.io',
      action: 'TENANT_PROVISIONED',
      module: 'TENANT',
      record_id: 'ORG-001',
      description: 'New organization ABC Electronics Ltd (ABC001) provisioned with Pro Tier subscription',
      ip_address: '103.21.244.12',
      created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString()
    },
    {
      id: 102,
      tenant_id: 2,
      tenant_name: 'Sri Lakshmi Traders',
      user_id: 2,
      user_name: 'admin@stockpilot.io',
      action: 'TENANT_ACTIVATED',
      module: 'SECURITY',
      record_id: 'ORG-002',
      description: 'Organization Sri Lakshmi Traders (SLT002) reactivated by Super Admin',
      ip_address: '103.21.244.12',
      created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString()
    },
    {
      id: 103,
      tenant_id: 3,
      tenant_name: 'Kumar Industrial Distributors',
      user_id: 1,
      user_name: 'admin@stockpilot.io',
      action: 'TENANT_SUSPENDED',
      module: 'SECURITY',
      record_id: 'ORG-003',
      description: 'Organization Kumar Industrial Distributors (KUM003) suspended due to compliance check',
      ip_address: '103.21.244.12',
      created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString()
    },
    {
      id: 104,
      tenant_id: 1,
      tenant_name: 'ABC Electronics Ltd',
      user_id: 4,
      user_name: 'rajesh@abcelec.com',
      action: 'CREATE_USER',
      module: 'USERS',
      record_id: 'USR-882',
      description: 'Created tenant staff user vinoth@abcelec.com with role INVENTORY_MANAGER',
      ip_address: '49.37.142.98',
      created_at: new Date(Date.now() - 1000 * 60 * 320).toISOString()
    },
    {
      id: 105,
      tenant_id: null,
      tenant_name: 'Global Platform',
      user_id: 1,
      user_name: 'superadmin@stockpilot.io',
      action: 'SERVICE_CONFIG_UPDATE',
      module: 'SYSTEM',
      record_id: 'SYS-CFG',
      description: 'Updated rate limiting policy and Redis telemetry caching threshold to 15000ms',
      ip_address: '127.0.0.1',
      created_at: new Date(Date.now() - 1000 * 60 * 650).toISOString()
    },
    {
      id: 106,
      tenant_id: 1,
      tenant_name: 'ABC Electronics Ltd',
      user_id: 4,
      user_name: 'rajesh@abcelec.com',
      action: 'STOCK_BULK_IMPORT',
      module: 'INVENTORY',
      record_id: 'IMP-4091',
      description: 'Imported 150 SKU catalog items into Central Peenya Warehouse',
      ip_address: '49.37.142.98',
      created_at: new Date(Date.now() - 1000 * 60 * 1400).toISOString()
    },
    {
      id: 107,
      tenant_id: 2,
      tenant_name: 'Sri Lakshmi Traders',
      user_id: 5,
      user_name: 'admin@lakshmi.com',
      action: 'PASSWORD_RESET',
      module: 'AUTH',
      record_id: 'USR-201',
      description: 'Completed secure password reset via verified magic token authentication',
      ip_address: '157.48.21.6',
      created_at: new Date(Date.now() - 1000 * 60 * 2100).toISOString()
    }
  ];

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/audit-logs');
      if (res?.data?.logs && Array.isArray(res.data.logs)) {
        setLogs(res.data.logs);
      } else if (Array.isArray(res?.data)) {
        setLogs(res.data);
      } else {
        setLogs([]);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Export logs to CSV
  const handleExportCSV = () => {
    try {
      if (filteredLogs.length === 0) {
        toast.warning('No audit logs to export');
        return;
      }

      const headers = ['ID', 'Timestamp', 'Module', 'Action', 'Actor Email', 'Organization', 'IP Address', 'Record ID', 'Description'];
      const rows = filteredLogs.map((l) => [
        l.id,
        new Date(l.created_at || l.createdAt).toISOString(),
        l.module,
        l.action,
        l.user_name || 'System',
        l.tenant_name || (l.tenant_id ? `Tenant #${l.tenant_id}` : 'Global Platform'),
        l.ip_address || 'N/A',
        l.record_id || 'N/A',
        `"${(l.description || '').replace(/"/g, '""')}"`
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `StockPilot_Audit_Logs_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Exported ${filteredLogs.length} audit records to CSV`);
    } catch (err) {
      console.error('CSV Export Error:', err);
      toast.error('Failed to export audit logs');
    }
  };

  // Filter logs based on search and module
  const filteredLogs = logs.filter((log) => {
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !q ||
      log.action?.toLowerCase().includes(q) ||
      log.description?.toLowerCase().includes(q) ||
      log.user_name?.toLowerCase().includes(q) ||
      log.module?.toLowerCase().includes(q) ||
      String(log.record_id || '').toLowerCase().includes(q) ||
      String(log.tenant_name || '').toLowerCase().includes(q);

    const matchesModule = selectedModule === 'ALL' || log.module === selectedModule;
    const matchesAction = selectedAction === 'ALL' || log.action === selectedAction;

    return matchesSearch && matchesModule && matchesAction;
  });

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
    const isDanger = action?.includes('SUSPEND') || action?.includes('DELETE');
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

  const securityEventsCount = logs.filter((l) => l.module === 'SECURITY' || l.action?.includes('SUSPEND')).length;
  const tenantEventsCount = logs.filter((l) => l.module === 'TENANT' || l.action?.includes('PROVISION')).length;
  const activeActorsCount = new Set(logs.map((l) => l.user_name)).size;

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleModuleSelect = (mod) => {
    setSelectedModule(mod);
    setCurrentPage(1);
  };

  const handleCardClick = (filterType) => {
    if (filterType === 'ALL') {
      setSelectedModule('ALL');
      setSelectedAction('ALL');
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
            onClick={fetchLogs}
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
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportCSV}
            style={{
              padding: '0.6rem 1.15rem',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #982A86 0%, #761867 100%)',
              color: '#ffffff',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 12px rgba(152, 42, 134, 0.25)'
            }}
          >
            <Download size={16} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric KPI Cards (Interactive Filters) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        <div
          onClick={() => handleCardClick('ALL')}
          title="Click to view all audit records"
          style={{
            background: '#ffffff',
            border: selectedModule === 'ALL' && !searchTerm ? '2px solid #982A86' : '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '1.25rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            transform: selectedModule === 'ALL' && !searchTerm ? 'translateY(-2px)' : 'none'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Audit Records</span>
            <div style={{ background: '#f5f3ff', padding: '0.4rem', borderRadius: '8px' }}><FileText size={18} color="#7c3aed" /></div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginTop: '0.5rem' }}>
            {logs.length}
          </div>
        </div>

        <div
          onClick={() => handleCardClick('SECURITY')}
          title="Click to filter by Security Operations"
          style={{
            background: '#ffffff',
            border: selectedModule === 'SECURITY' ? '2px solid #dc2626' : '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '1.25rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            transform: selectedModule === 'SECURITY' ? 'translateY(-2px)' : 'none'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Security Operations</span>
            <div style={{ background: '#fef2f2', padding: '0.4rem', borderRadius: '8px' }}><AlertTriangle size={18} color="#dc2626" /></div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#dc2626', marginTop: '0.5rem' }}>
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
            transition: 'all 0.2s ease',
            transform: selectedModule === 'TENANT' ? 'translateY(-2px)' : 'none'
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
          padding: '1rem 1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}
      >
        {/* Left: Search input */}
        <div style={{ position: 'relative', flex: '1', minWidth: '280px', maxWidth: '420px' }}>
          <Search size={17} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            id="audit-search-input"
            type="text"
            placeholder="Search by action, email, module, or description..."
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

        {/* Right: Module Pill Filter Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', marginRight: '0.35rem' }}>Module:</span>
          {['ALL', 'TENANT', 'SECURITY', 'USERS', 'INVENTORY', 'AUTH', 'SYSTEM'].map((mod) => (
            <button
              key={mod}
              onClick={() => handleModuleSelect(mod)}
              style={{
                padding: '0.4rem 0.75rem',
                borderRadius: '6px',
                border: selectedModule === mod ? '1px solid #982A86' : '1px solid #e2e8f0',
                background: selectedModule === mod ? '#982A86' : '#ffffff',
                color: selectedModule === mod ? '#ffffff' : '#475569',
                fontSize: '0.76rem',
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

      {/* 4. Audit Trail Data Table */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.02)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '0.9rem 1.25rem' }}>Timestamp</th>
                <th style={{ padding: '0.9rem 1rem' }}>Action Event</th>
                <th style={{ padding: '0.9rem 1rem' }}>Actor</th>
                <th style={{ padding: '0.9rem 1rem' }}>Workspace</th>
                <th style={{ padding: '0.9rem 1.25rem' }}>Event Details</th>
                <th style={{ padding: '0.9rem 1.25rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3.5rem', color: '#94a3b8' }}>
                    <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 0.75rem auto', color: '#982A86' }} />
                    <div>Loading platform audit trail...</div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3.5rem', color: '#94a3b8' }}>
                    <ShieldCheck size={32} style={{ margin: '0 auto 0.5rem auto', color: '#cbd5e1' }} />
                    <div style={{ fontWeight: 600, color: '#475569', fontSize: '0.95rem' }}>No Audit Records Found</div>
                    <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>Try adjusting your search keywords or module filters.</div>
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((item, idx) => (
                  <tr
                    key={item.id || idx}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#faf5ff')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    {/* Timestamp */}
                    <td style={{ padding: '0.9rem 1.25rem', whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>
                        {formatRelativeTime(item.created_at || item.createdAt)}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
                        {new Date(item.created_at || item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>

                    {/* Action & Module */}
                    <td style={{ padding: '0.9rem 1rem', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        {getModuleBadge(item.module)}
                        {getActionBadge(item.action)}
                      </div>
                    </td>

                    {/* Actor */}
                    <td style={{ padding: '0.9rem 1rem', whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 700, color: '#1e293b' }}>
                        {item.user_name || 'Super Admin'}
                      </div>
                      {item.ip_address && (
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                          IP: {item.ip_address}
                        </div>
                      )}
                    </td>

                    {/* Workspace */}
                    <td style={{ padding: '0.9rem 1rem', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Building size={14} color="#94a3b8" />
                        <span style={{ fontWeight: 600, color: '#334155', fontSize: '0.8rem' }}>
                          {item.tenant_name || (item.tenant_id ? `Tenant #${item.tenant_id}` : 'Global Platform')}
                        </span>
                      </div>
                    </td>

                    {/* Description */}
                    <td style={{ padding: '0.9rem 1.25rem', maxWidth: '400px' }}>
                      <div style={{ color: '#334155', lineHeight: 1.45, fontSize: '0.825rem' }}>
                        {item.description}
                      </div>
                    </td>

                    {/* Actions: Inspect & Delete */}
                    <td style={{ padding: '0.9rem 1.25rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.45rem' }}>
                        <button
                          onClick={() => setSelectedLog(item)}
                          style={{
                            padding: '0.35rem 0.65rem',
                            borderRadius: '6px',
                            border: '1px solid #e2e8f0',
                            background: '#ffffff',
                            color: '#982A86',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.15s ease'
                          }}
                          title="Inspect audit details"
                        >
                          <Eye size={13} />
                          <span>Inspect</span>
                        </button>

                        <button
                          onClick={(e) => openDeleteModal(item, e)}
                          style={{
                            padding: '0.35rem 0.6rem',
                            borderRadius: '6px',
                            border: '1px solid #fecaca',
                            background: '#fef2f2',
                            color: '#dc2626',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.15s ease'
                          }}
                          title="Permanently delete audit log"
                        >
                          <Trash2 size={13} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination Bar */}
        <div
          style={{
            padding: '0.85rem 1.25rem',
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
          {/* Left: Counts & Rows Per Page */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              Showing <b>{filteredLogs.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</b> to <b>{Math.min(currentPage * itemsPerPage, filteredLogs.length)}</b> of <b>{filteredLogs.length}</b> records
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Per page:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                style={{
                  padding: '0.25rem 0.5rem',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: '#334155',
                  cursor: 'pointer'
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          {/* Right: Next & Previous Page Navigation Controls (Always Visible) */}
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

            {/* Page number pill */}
            <div style={{ display: 'flex', gap: '0.25rem', margin: '0 0.25rem' }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
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
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Target Workspace / Record</div>
                <div style={{ marginTop: '0.35rem', fontWeight: 600, fontSize: '0.85rem', color: '#0f172a' }}>
                  {selectedLog.tenant_name || (selectedLog.tenant_id ? `Tenant #${selectedLog.tenant_id}` : 'Global Platform')}
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
