import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LifeBuoy,
  Search,
  CheckCircle2,
  Clock,
  Send,
  Lock,
  MessageSquare,
  Building2,
  Phone,
  UserCheck,
  Zap,
  ExternalLink,
  Flame,
  Copy,
  Trash2,
  Users,
  FileText
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../services/api';
import CustomSelect from '../../components/CustomSelect';
import ConfirmModal from '../../components/ConfirmModal';
import './SuperAdminTicketsPage.css';

const getInitials = (name) => {
  if (!name) return 'U';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const STATUS_OPTIONS = [
  { value: 'OPEN', label: 'OPEN' },
  { value: 'IN_PROGRESS', label: 'IN PROGRESS' },
  { value: 'WAITING_CLIENT', label: 'WAITING CLIENT' },
  { value: 'RESOLVED', label: 'RESOLVED' },
  { value: 'CLOSED', label: 'CLOSED' }
];

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'LOW' },
  { value: 'MEDIUM', label: 'MEDIUM' },
  { value: 'HIGH', label: 'HIGH' },
  { value: 'CRITICAL', label: 'CRITICAL' },
  { value: 'CRITICAL_BLOCKER', label: 'CRITICAL BLOCKER' }
];

const FILTER_CATEGORY_OPTIONS = [
  { value: 'ALL', label: 'All Categories' },
  { value: 'POS_HARDWARE', label: 'POS & Thermal Hardware' },
  { value: 'GST_BILLING', label: 'GST & Invoicing' },
  { value: 'INVENTORY_SYNC', label: 'Inventory & Stock Sync' },
  { value: 'STOREFRONT', label: 'Online Storefront' },
  { value: 'GENERAL', label: 'General Queries' }
];

const FILTER_STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Status' },
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'WAITING_CLIENT', label: 'Waiting Client' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'CLOSED', label: 'Closed' }
];

const FILTER_PRIORITY_OPTIONS = [
  { value: 'ALL', label: 'All Priorities' },
  { value: 'CRITICAL_BLOCKER', label: 'Critical Blocker' },
  { value: 'CRITICAL', label: 'Critical' },
  { value: 'HIGH', label: 'High Priority' },
  { value: 'MEDIUM', label: 'Medium Priority' },
  { value: 'LOW', label: 'Low Priority' }
];

export default function SuperAdminTicketsPage() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    critical: 0,
    resolved: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [selectedTicketLoading, setSelectedTicketLoading] = useState(false);

  // Dynamic Dev Team State
  const [teamMembers, setTeamMembers] = useState([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  // Composer
  const [replyMode, setReplyMode] = useState('CLIENT'); // 'CLIENT' or 'INTERNAL'
  const [composerText, setComposerText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const chatEndRef = useRef(null);

  // Delete Confirmation Modal State
  const [ticketToDelete, setTicketToDelete] = useState(null);
  const [deletingTicket, setDeletingTicket] = useState(false);

  // Fetch Team Members
  const fetchTeamMembers = async () => {
    try {
      const res = await api.get('/admin/team');
      const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      setTeamMembers(list);
    } catch (err) {
      console.warn('Failed to load team members:', err);
    }
  };

  const fetchTicketsAndStats = async () => {
    try {
      setLoading(true);
      const [ticketsRes, statsRes] = await Promise.all([
        api.get('/admin/tickets'),
        api.get('/admin/tickets/stats').catch(() => ({ data: {} }))
      ]);

      const ticketList = Array.isArray(ticketsRes?.data) ? ticketsRes.data : (Array.isArray(ticketsRes) ? ticketsRes : []);
      setTickets(ticketList);
      if (ticketList.length > 0 && !selectedTicket) {
        loadTicketDetails(ticketList[0].ticket_id || ticketList[0].id);
      }

      const statsData = statsRes?.data || statsRes;
      if (statsData && typeof statsData === 'object') {
        setStats(statsData);
      }
    } catch (err) {
      console.error('Failed to load superadmin tickets:', err);
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const loadTicketDetails = async (ticketIdentifier) => {
    try {
      setSelectedTicketLoading(true);
      const res = await api.get(`/admin/tickets/${ticketIdentifier}`);
      const details = res?.data || res;
      if (details) {
        setSelectedTicket(details);
      }
    } catch (err) {
      console.error('Failed to load ticket details:', err);
      toast.error('Failed to load ticket conversation');
    } finally {
      setSelectedTicketLoading(false);
    }
  };

  useEffect(() => {
    fetchTicketsAndStats();
    fetchTeamMembers();
  }, []);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedTicket?.messages]);

  // Update Status, Priority or Assignment
  const handleUpdateStatusOrDev = async (updates) => {
    if (!selectedTicket) return;
    const ticketKey = selectedTicket.ticket_id || selectedTicket.id;

    // Sanitize any nested synthetic event or object passed
    const cleanUpdates = {};
    Object.entries(updates).forEach(([k, v]) => {
      if (v === null || v === undefined) {
        cleanUpdates[k] = v;
      } else if (typeof v === 'object' && v.target && v.target.value !== undefined) {
        cleanUpdates[k] = v.target.value;
      } else if (typeof v === 'object' && v.value !== undefined) {
        cleanUpdates[k] = v.value;
      } else {
        cleanUpdates[k] = v;
      }
    });

    try {
      const res = await api.put(`/admin/tickets/${ticketKey}/status`, cleanUpdates);
      const updated = res?.data || res;
      if (updated) {
        setSelectedTicket((prev) => ({
          ...prev,
          ...cleanUpdates,
          ...(updated.ticket || updated)
        }));
        toast.success('Ticket updated successfully');
        setTickets((prev) =>
          prev.map((t) =>
            (t.ticket_id === (updated.ticket_id || ticketKey) || t.id === updated.id)
              ? { ...t, ...cleanUpdates }
              : t
          )
        );
      }
    } catch (err) {
      console.error('Failed to update ticket status/assignee:', err);
      toast.error(err?.response?.data?.message || 'Failed to update ticket');
    }
  };

  // Send Admin Reply / Internal Note
  const handleSendAdminMessage = async (e) => {
    e.preventDefault();
    if (!composerText.trim() || !selectedTicket) return;

    try {
      setSendingMessage(true);
      const isInternal = replyMode === 'INTERNAL';
      const ticketKey = selectedTicket.ticket_id || selectedTicket.id;
      const res = await api.post(`/admin/tickets/${ticketKey}/messages`, {
        message: composerText.trim(),
        is_internal_note: isInternal
      });

      if (res) {
        setComposerText('');
        toast.success(isInternal ? 'Internal dev note added' : 'Reply sent to client');
        loadTicketDetails(ticketKey);
      }
    } catch (err) {
      console.error('Failed to send admin message:', err);
      toast.error('Failed to post message');
    } finally {
      setSendingMessage(false);
    }
  };

  // Trigger Delete Confirmation Modal
  const requestDeleteTicket = (ticketObj) => {
    if (!ticketObj) return;
    setTicketToDelete(ticketObj);
  };

  // Perform Deletion
  const handleConfirmDelete = async () => {
    if (!ticketToDelete) return;
    const ticketIdentifier = ticketToDelete.ticket_id || ticketToDelete.id || ticketToDelete.ticket_number;
    try {
      setDeletingTicket(true);
      await api.delete(`/admin/tickets/${ticketIdentifier}`);
      toast.success(`Ticket #${ticketIdentifier} deleted successfully`);
      if (
        selectedTicket?.ticket_id === ticketIdentifier ||
        selectedTicket?.id === ticketIdentifier ||
        selectedTicket?.ticket_number === ticketIdentifier
      ) {
        setSelectedTicket(null);
      }
      setTicketToDelete(null);
      fetchTicketsAndStats();
    } catch (err) {
      console.error('Failed to delete ticket:', err);
      toast.error(err?.response?.data?.message || 'Failed to delete ticket');
    } finally {
      setDeletingTicket(false);
    }
  };

  const copyTicketNumber = (tktId) => {
    navigator.clipboard.writeText(tktId);
    toast.info(`Copied #${tktId} to clipboard`);
  };

  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // WhatsApp Link Helper
  const getWhatsAppLink = (ticket) => {
    const phone = ticket?.tenant?.phone || ticket?.user_phone || '';
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const tktKey = ticket?.ticket_id || ticket?.ticket_number || '';
    const text = encodeURIComponent(
      `Hi ${ticket?.tenant?.company_name || ticket?.company_name || 'Partner'}, regarding your StockPilot Support Ticket [#${tktKey} - ${ticket?.subject}]: our developer team is here to assist.`
    );
    return `https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}?text=${text}`;
  };

  // Dynamic Developer Options from Live Team Members
  const dynamicDeveloperOptions = [
    { value: 'Unassigned', label: 'Unassigned', description: 'No developer assigned yet' },
    ...teamMembers.map((m) => ({
      value: m.name,
      label: `${m.name} (${m.role})`,
      description: m.specialization || m.role
    }))
  ];

  // Filter tickets
  const filteredTickets = tickets.filter((t) => {
    const tktNum = (t.ticket_id || t.ticket_number || '').toLowerCase();
    const subj = (t.subject || '').toLowerCase();
    const comp = (t.tenant?.company_name || t.company_name || '').toLowerCase();
    const q = (searchQuery || '').toLowerCase();

    const currentStatusFilter = (typeof statusFilter === 'object' && statusFilter !== null && 'target' in statusFilter)
      ? String(statusFilter.target?.value || 'ALL')
      : String(statusFilter?.value || statusFilter || 'ALL');

    const currentCatFilter = (typeof categoryFilter === 'object' && categoryFilter !== null && 'target' in categoryFilter)
      ? String(categoryFilter.target?.value || 'ALL')
      : String(categoryFilter?.value || categoryFilter || 'ALL');

    const currentPrioFilter = (typeof priorityFilter === 'object' && priorityFilter !== null && 'target' in priorityFilter)
      ? String(priorityFilter.target?.value || 'ALL')
      : String(priorityFilter?.value || priorityFilter || 'ALL');

    const matchesSearch = subj.includes(q) || tktNum.includes(q) || comp.includes(q);
    const matchesStatus = currentStatusFilter === 'ALL' || t.status === currentStatusFilter;
    const matchesCategory = currentCatFilter === 'ALL' || t.category === currentCatFilter;
    const matchesPriority = currentPrioFilter === 'ALL' || t.priority === currentPrioFilter;

    return matchesSearch && matchesStatus && matchesCategory && matchesPriority;
  });

  return (
    <div className="admin-tickets-container">
      {/* Header */}
      <div className="admin-tickets-header">
        <div className="admin-tickets-title">
          <h1>
            <LifeBuoy size={26} color="#982A86" />
            Support Helpdesk &amp; Developer Resolution Center
          </h1>
          <p>Global issue dispatching, priority SLA escalation &amp; dynamic developer assignment</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="admin-tickets-kpis">
        <div className="admin-kpi-card">
          <div className="admin-kpi-icon" style={{ background: 'rgba(152, 42, 134, 0.12)' }}>
            <LifeBuoy size={22} color="#982A86" />
          </div>
          <div className="admin-kpi-info">
            <span className="admin-kpi-label">Total Tickets</span>
            <span className="admin-kpi-val">{stats.total || tickets.length}</span>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-icon" style={{ background: 'rgba(37, 99, 235, 0.12)' }}>
            <Clock size={22} color="#2563eb" />
          </div>
          <div className="admin-kpi-info">
            <span className="admin-kpi-label">Open / Unassigned</span>
            <span className="admin-kpi-val">{stats.open || 0}</span>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-icon" style={{ background: 'rgba(234, 88, 12, 0.12)' }}>
            <Zap size={22} color="#ea580c" />
          </div>
          <div className="admin-kpi-info">
            <span className="admin-kpi-label">In Progress</span>
            <span className="admin-kpi-val">{stats.inProgress || stats.in_progress || 0}</span>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-icon" style={{ background: 'rgba(220, 38, 38, 0.12)' }}>
            <Flame size={22} color="#dc2626" />
          </div>
          <div className="admin-kpi-info">
            <span className="admin-kpi-label">Critical Blockers</span>
            <span className="admin-kpi-val">{stats.critical || 0}</span>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-icon" style={{ background: 'rgba(22, 163, 74, 0.12)' }}>
            <CheckCircle2 size={22} color="#16a34a" />
          </div>
          <div className="admin-kpi-info">
            <span className="admin-kpi-label">Resolved</span>
            <span className="admin-kpi-val">{stats.resolved || 0}</span>
          </div>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="admin-tickets-layout">
        {/* Left Side: Ticket Feed */}
        <div className="admin-feed-panel">
          <div className="admin-feed-filters">
            <div className="admin-search-box">
              <Search size={15} />
              <input
                type="text"
                placeholder="Search by ticket #, company or subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="filter-dropdowns-row">
              <div style={{ flex: 1, minWidth: '110px' }}>
                <CustomSelect
                  value={statusFilter}
                  onChange={(val) => setStatusFilter(val)}
                  options={FILTER_STATUS_OPTIONS}
                  size="sm"
                />
              </div>

              <div style={{ flex: 1, minWidth: '130px' }}>
                <CustomSelect
                  value={categoryFilter}
                  onChange={(val) => setCategoryFilter(val)}
                  options={FILTER_CATEGORY_OPTIONS}
                  size="sm"
                />
              </div>

              <div style={{ flex: 1, minWidth: '120px' }}>
                <CustomSelect
                  value={priorityFilter}
                  onChange={(val) => setPriorityFilter(val)}
                  options={FILTER_PRIORITY_OPTIONS}
                  size="sm"
                />
              </div>
            </div>
          </div>

          <div className="admin-ticket-feed">
            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                Loading helpdesk tickets...
              </div>
            ) : filteredTickets.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                No matching tickets found
              </div>
            ) : (
              filteredTickets.map((t) => {
                const tktKey = t.ticket_id || t.ticket_number || `TKT-${t.id}`;
                const isSelected = selectedTicket?.ticket_id === tktKey || selectedTicket?.id === t.id;
                return (
                  <div
                    key={t.id || tktKey}
                    className={`admin-ticket-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => loadTicketDetails(tktKey)}
                  >
                    <div className="admin-ticket-top">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#982A86' }}>
                          #{tktKey}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span className="tenant-company-badge">
                          {t.tenant?.company_name || t.company_name || 'Organization'}
                        </span>
                        <button
                          className="ticket-delete-mini-btn"
                          title="Delete ticket"
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            requestDeleteTicket(t);
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <h4 className="admin-ticket-subject">{t.subject}</h4>

                    <div className="admin-ticket-bottom">
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '12px',
                          background:
                            t.status === 'OPEN'
                              ? '#eff6ff'
                              : t.status === 'IN_PROGRESS'
                              ? '#fef3c7'
                              : t.status === 'RESOLVED'
                              ? '#ecfdf5'
                              : '#f1f5f9',
                          color:
                            t.status === 'OPEN'
                              ? '#2563eb'
                              : t.status === 'IN_PROGRESS'
                              ? '#d97706'
                              : t.status === 'RESOLVED'
                              ? '#059669'
                              : '#64748b'
                        }}
                      >
                        {(t.status || 'OPEN').replace('_', ' ')}
                      </span>

                      <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                        {formatTime(t.updatedAt || t.updated_at || t.createdAt || t.created_at)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Resolution Console */}
        <div className="admin-console-panel">
          {selectedTicketLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <span>Loading ticket console...</span>
            </div>
          ) : selectedTicket ? (
            <>
              {/* Header & Tenant Information Banner */}
              <div className="admin-console-header">
                <div className="admin-console-top-meta">
                  <div className="admin-console-title-wrap">
                    <div className="admin-subject-row">
                      <h2 className="admin-console-subject">{selectedTicket.subject}</h2>
                    </div>
                    <div className="admin-console-submeta">
                      <span className="admin-tkt-id-badge">
                        #{selectedTicket.ticket_id || selectedTicket.ticket_number}
                      </span>
                      <span className="meta-dot">•</span>
                      <span className="admin-tkt-opened-date">
                        Opened on {formatTime(selectedTicket.createdAt || selectedTicket.created_at)}
                      </span>
                    </div>
                  </div>

                  <div className="admin-console-header-actions">
                    <button
                      className="btn-delete-ticket-header"
                      type="button"
                      title="Delete ticket"
                      onClick={() => requestDeleteTicket(selectedTicket)}
                    >
                      <Trash2 size={14} />
                      <span>Delete</span>
                    </button>

                    <div className="company-live-pill">
                      <Building2 size={14} color="#982A86" />
                      <span className="company-live-name">
                        {selectedTicket.tenant?.company_name || selectedTicket.company_name || 'Organization'}
                      </span>
                      {(selectedTicket.tenant?.phone || selectedTicket.user_phone) && (
                        <a
                          href={getWhatsAppLink(selectedTicket)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-whatsapp-chat-mini"
                          title={`WhatsApp: ${selectedTicket.tenant?.phone || selectedTicket.user_phone}`}
                        >
                          <MessageSquare size={12} />
                          <span>WhatsApp</span>
                          <ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Control Action Bar: Status, Assignee & Priority */}
                <div className="admin-controls-strip">
                  <div className="control-pill-group dev-group">
                    <div className="control-label">
                      <UserCheck size={14} color="#0284c7" />
                      <span>Developer:</span>
                    </div>
                    <div className="control-select-wrap">
                      <CustomSelect
                        value={selectedTicket.assigned_to || 'Unassigned'}
                        onChange={(val) => handleUpdateStatusOrDev({ assigned_to: val })}
                        options={dynamicDeveloperOptions}
                        size="sm"
                      />
                    </div>
                  </div>

                  <div className="control-pill-group status-group">
                    <div className="control-label">
                      <Clock size={14} color="#ea580c" />
                      <span>Status:</span>
                    </div>
                    <div className="control-select-wrap">
                      <CustomSelect
                        value={selectedTicket.status}
                        onChange={(val) => handleUpdateStatusOrDev({ status: val })}
                        options={STATUS_OPTIONS}
                        size="sm"
                      />
                    </div>
                  </div>

                  <div className="control-pill-group priority-group">
                    <div className="control-label">
                      <Flame size={14} color="#dc2626" />
                      <span>Priority:</span>
                    </div>
                    <div className="control-select-wrap">
                      <CustomSelect
                        value={selectedTicket.priority}
                        onChange={(val) => handleUpdateStatusOrDev({ priority: val })}
                        options={PRIORITY_OPTIONS}
                        size="sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Chat Log with Internal Notes */}
              <div className="admin-console-body">
                {/* Initial Description / Client Report */}
                <div className="admin-original-report-card">
                  <div className="report-card-header">
                    <div className="report-header-left">
                      <div className="report-icon-box">
                        <FileText size={15} color="#982A86" />
                      </div>
                      <div className="report-header-info">
                        <strong>Original Client Report</strong>
                        <span className="client-name-tag">
                          {selectedTicket.user_name || 'Tenant Admin'}
                        </span>
                      </div>
                    </div>
                    <span className="report-timestamp">
                      {formatTime(selectedTicket.createdAt || selectedTicket.created_at)}
                    </span>
                  </div>
                  <div className="report-card-content">
                    {selectedTicket.description}
                  </div>
                </div>

                {/* Messages & Notes */}
                {(selectedTicket.messages || []).map((msg) => {
                  const isClient = msg.sender_type === 'CLIENT' || msg.sender_role === 'CLIENT';
                  const isInternal = msg.is_internal_note;

                  if (isInternal) {
                    return (
                      <div key={msg.id} className="internal-note-card">
                        <div className="internal-note-header">
                          <div className="internal-note-badge-row">
                            <div className="lock-icon-circle">
                              <Lock size={12} color="#ffffff" />
                            </div>
                            <span className="internal-note-badge">Internal Dev Note</span>
                            <span className="internal-note-author">
                              {msg.sender_name || 'Super Admin'}
                            </span>
                          </div>
                          <span className="internal-note-time">
                            {formatTime(msg.createdAt || msg.created_at)}
                          </span>
                        </div>
                        <div className="internal-note-text">
                          {msg.message}
                        </div>
                      </div>
                    );
                  }

                  const senderName = isClient
                    ? (msg.sender_name || selectedTicket.user_name || 'Tenant Admin')
                    : (msg.sender_name || 'StockPilot Support');

                  return (
                    <div
                      key={msg.id}
                      className={`admin-chat-row ${isClient ? 'from-client' : 'from-admin'}`}
                    >
                      <div className={`chat-avatar ${isClient ? 'client-avatar' : 'admin-avatar'}`}>
                        {getInitials(senderName)}
                      </div>
                      <div className="chat-bubble-container">
                        <div className="chat-bubble-meta">
                          <strong className="chat-sender-name">{senderName}</strong>
                          <span className={`chat-role-badge ${isClient ? 'client-role' : 'admin-role'}`}>
                            {isClient ? 'Client / Tenant' : 'Support / Dev'}
                          </span>
                          <span className="chat-time">{formatTime(msg.createdAt || msg.created_at)}</span>
                        </div>
                        <div className="chat-bubble-content">{msg.message}</div>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              {/* Dual Mode Reply Console */}
              <div className="admin-console-footer">
                <div className="mode-toggle-bar">
                  <button
                    type="button"
                    className={`mode-tab-btn ${replyMode === 'CLIENT' ? 'active client-mode' : ''}`}
                    onClick={() => setReplyMode('CLIENT')}
                  >
                    <Send size={13} />
                    <span>Public Reply to Client</span>
                  </button>
                  <button
                    type="button"
                    className={`mode-tab-btn ${replyMode === 'INTERNAL' ? 'active internal-mode' : ''}`}
                    onClick={() => setReplyMode('INTERNAL')}
                  >
                    <Lock size={13} />
                    <span>Internal Developer Note (Hidden from Tenant)</span>
                  </button>
                </div>

                <form onSubmit={handleSendAdminMessage} className="admin-composer-row">
                  <textarea
                    className={replyMode === 'INTERNAL' ? 'internal-active' : 'client-active'}
                    placeholder={
                      replyMode === 'INTERNAL'
                        ? 'Write an internal developer note, debugging observations or task handoff...'
                        : 'Write official response to client...'
                    }
                    value={composerText}
                    onChange={(e) => setComposerText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendAdminMessage(e);
                      }
                    }}
                  />
                  <button
                    type="submit"
                    className={`btn-admin-send ${replyMode === 'INTERNAL' ? 'internal-mode' : 'client-mode'}`}
                    disabled={sendingMessage || !composerText.trim()}
                  >
                    <Send size={15} />
                    <span>{replyMode === 'INTERNAL' ? 'Save Note' : 'Send'}</span>
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
              Select a ticket to begin resolution
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(ticketToDelete)}
        onClose={() => setTicketToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Support Ticket"
        message={`Are you sure you want to delete ticket #${ticketToDelete?.ticket_id || ticketToDelete?.ticket_number || ticketToDelete?.id}? This action will permanently remove all client conversations and developer internal notes.`}
        confirmText={deletingTicket ? 'Deleting...' : 'Delete Ticket'}
        type="danger"
      />
    </div>
  );
}
