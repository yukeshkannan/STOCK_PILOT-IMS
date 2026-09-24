import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import {
  Terminal,
  Code2,
  Cpu,
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
  Search,
  Check,
  AlertCircle,
  HelpCircle,
  Layers,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  UserPlus
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../services/api';
import CustomSelect from '../../components/CustomSelect';
import './DeveloperWorkspacePage.css';

export default function DeveloperWorkspacePage() {
  const { user } = useSelector((state) => state.auth);
  const [tickets, setTickets] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedEngineer, setSelectedEngineer] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTicketLoading, setSelectedTicketLoading] = useState(false);

  // Queue View Tab: 'MY_QUEUE' | 'UNASSIGNED' | 'RESOLVED_BY_ME' | 'ALL'
  const [activeQueueTab, setActiveQueueTab] = useState('MY_QUEUE');
  const [searchQuery, setSearchQuery] = useState('');

  // Composer
  const [replyMode, setReplyMode] = useState('INTERNAL'); // Default to internal for dev speed
  const [composerText, setComposerText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const chatBottomRef = useRef(null);

  // Fetch Team & Tickets
  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [teamRes, ticketsRes] = await Promise.all([
        api.get('/admin/team').catch(() => ({ data: [] })),
        api.get('/admin/tickets').catch(() => ({ data: [] }))
      ]);

      const teamList = Array.isArray(teamRes?.data) ? teamRes.data : (Array.isArray(teamRes) ? teamRes : []);
      const ticketList = Array.isArray(ticketsRes?.data) ? ticketsRes.data : (Array.isArray(ticketsRes) ? ticketsRes : []);

      setTeamMembers(teamList);
      setTickets(ticketList);

      // Determine active developer identity
      const currentUserName = user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
      const matchedMember = teamList.find((m) => m.name.toLowerCase() === currentUserName.toLowerCase() || m.email.toLowerCase() === (user?.email || '').toLowerCase());
      
      const activeDev = matchedMember ? matchedMember.name : (currentUserName || (teamList.length > 0 ? teamList[0].name : ''));
      setSelectedEngineer(activeDev);

      // Only auto-load if developer actually has tickets assigned in their queue
      const devTickets = ticketList.filter(
        (t) => activeDev && (t.assigned_to || '').toLowerCase() === activeDev.toLowerCase() && t.status !== 'RESOLVED' && t.status !== 'CLOSED'
      );

      if (devTickets.length > 0) {
        loadTicketDetails(devTickets[0].ticket_id || devTickets[0].id);
      } else {
        setSelectedTicket(null);
      }
    } catch (err) {
      console.error('Failed to load developer workspace data:', err);
      toast.error('Failed to load workspace queue');
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
      toast.error('Failed to load conversation thread');
    } finally {
      setSelectedTicketLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedTicket?.messages]);


  // Send Dev Message / Internal Log
  const handleSendDevMessage = async (e) => {
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
        toast.success(isInternal ? 'Internal dev note logged' : 'Reply sent to client');
        loadTicketDetails(ticketKey);
      }
    } catch (err) {
      console.error('Failed to post message:', err);
      toast.error('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const copyTicketId = (tktId) => {
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

  // Filter queues dynamically
  const myAssignedTickets = tickets.filter(
    (t) => selectedEngineer && (t.assigned_to || '').toLowerCase() === selectedEngineer.toLowerCase() && t.status !== 'RESOLVED' && t.status !== 'CLOSED'
  );
  const myInProgressTickets = myAssignedTickets.filter((t) => t.status === 'IN_PROGRESS');
  const myWaitingClientTickets = myAssignedTickets.filter((t) => t.status === 'WAITING_CLIENT');
  const unassignedTickets = tickets.filter(
    (t) => !t.assigned_to || t.assigned_to === 'Unassigned' || t.assigned_to === ''
  );
  const myResolvedTickets = tickets.filter(
    (t) => (t.assigned_to || '').toLowerCase() === selectedEngineer.toLowerCase() && (t.status === 'RESOLVED' || t.status === 'CLOSED')
  );

  const displayedQueueTickets = (() => {
    let list = tickets;
    if (activeQueueTab === 'MY_QUEUE') list = myAssignedTickets;
    else if (activeQueueTab === 'IN_PROGRESS') list = myInProgressTickets;
    else if (activeQueueTab === 'WAITING_CLIENT') list = myWaitingClientTickets;
    else if (activeQueueTab === 'UNASSIGNED') list = unassignedTickets;
    else if (activeQueueTab === 'RESOLVED_BY_ME') list = myResolvedTickets;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (t) =>
          (t.ticket_id || '').toLowerCase().includes(q) ||
          (t.subject || '').toLowerCase().includes(q) ||
          (t.company_name || '').toLowerCase().includes(q)
      );
    }
    return list;
  })();

  const engineerOptions = [
    ...teamMembers.map((m) => ({
      value: m.name,
      label: `${m.name} (${m.role})`,
      description: m.specialization || m.role
    }))
  ];

  // Check if selected ticket is assigned to the current active developer or caller is SuperAdmin
  const currentDevName = user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email || '';
  const activeDevIdentifier = selectedEngineer || currentDevName;
  const isAssignedToActiveDev = Boolean(
    user?.isSuperAdmin ||
    (selectedTicket?.assigned_to &&
      activeDevIdentifier &&
      (selectedTicket.assigned_to.toLowerCase() === activeDevIdentifier.toLowerCase() ||
       selectedTicket.assigned_to.toLowerCase() === (user?.email || '').toLowerCase() ||
       activeDevIdentifier.toLowerCase().includes(selectedTicket.assigned_to.toLowerCase()) ||
       selectedTicket.assigned_to.toLowerCase().includes(activeDevIdentifier.toLowerCase())))
  );
  const isTicketUnassigned = !selectedTicket?.assigned_to || selectedTicket.assigned_to === 'Unassigned' || selectedTicket.assigned_to === '';

  const handleSwitchTab = (tab) => {
    setActiveQueueTab(tab);
    let targetList = [];
    if (tab === 'MY_QUEUE') targetList = myAssignedTickets;
    else if (tab === 'IN_PROGRESS') targetList = myInProgressTickets;
    else if (tab === 'WAITING_CLIENT') targetList = myWaitingClientTickets;
    else if (tab === 'UNASSIGNED') targetList = unassignedTickets;
    else if (tab === 'RESOLVED_BY_ME') targetList = myResolvedTickets;
    else if (tab === 'ALL') targetList = tickets;

    const isInTab = selectedTicket && targetList.some((t) => t.ticket_id === selectedTicket.ticket_id || t.id === selectedTicket.id);
    if (!isInTab) {
      if (targetList.length > 0) {
        loadTicketDetails(targetList[0].ticket_id || targetList[0].id);
      } else {
        setSelectedTicket(null);
      }
    }
  };

  return (
    <div className="dev-workspace-container">
      {/* Top Header */}
      <div className="dev-workspace-header">
        <div className="dev-workspace-title">
          <h1>
            <Terminal size={26} color="#982A86" />
            Developer Resolution Workspace
          </h1>
          <p>
            Dedicated engineering queue, rapid SLA triage, internal stacktrace logging &amp; client communication
          </p>
        </div>
      </div>

      {/* KPI Cards Strip - Click to switch/filter queue */}
      <div className="dev-kpis-grid">
        <div
          className={`dev-kpi-card ${activeQueueTab === 'MY_QUEUE' ? 'active' : ''}`}
          onClick={() => handleSwitchTab('MY_QUEUE')}
          title="Click to view all my assigned open tickets"
          role="button"
          tabIndex={0}
        >
          <div className="dev-kpi-icon" style={{ background: 'rgba(152, 42, 134, 0.12)' }}>
            <Zap size={22} color="#982A86" />
          </div>
          <div className="dev-kpi-info">
            <span className="dev-kpi-label">My Assigned Queue</span>
            <span className="dev-kpi-val">{myAssignedTickets.length}</span>
          </div>
        </div>

        <div
          className={`dev-kpi-card ${activeQueueTab === 'IN_PROGRESS' ? 'active' : ''}`}
          onClick={() => handleSwitchTab('IN_PROGRESS')}
          title="Click to view tickets in debugging / active progress"
          role="button"
          tabIndex={0}
        >
          <div className="dev-kpi-icon" style={{ background: 'rgba(234, 88, 12, 0.12)' }}>
            <Clock size={22} color="#ea580c" />
          </div>
          <div className="dev-kpi-info">
            <span className="dev-kpi-label">In Debugging / Action</span>
            <span className="dev-kpi-val">{myInProgressTickets.length}</span>
          </div>
        </div>

        <div
          className={`dev-kpi-card ${activeQueueTab === 'WAITING_CLIENT' ? 'active' : ''}`}
          onClick={() => handleSwitchTab('WAITING_CLIENT')}
          title="Click to view tickets waiting on client info"
          role="button"
          tabIndex={0}
        >
          <div className="dev-kpi-icon" style={{ background: 'rgba(37, 99, 235, 0.12)' }}>
            <MessageSquare size={22} color="#2563eb" />
          </div>
          <div className="dev-kpi-info">
            <span className="dev-kpi-label">Waiting Client Info</span>
            <span className="dev-kpi-val">{myWaitingClientTickets.length}</span>
          </div>
        </div>

        <div
          className={`dev-kpi-card ${activeQueueTab === 'RESOLVED_BY_ME' ? 'active' : ''}`}
          onClick={() => handleSwitchTab('RESOLVED_BY_ME')}
          title="Click to view tickets resolved by me"
          role="button"
          tabIndex={0}
        >
          <div className="dev-kpi-icon" style={{ background: 'rgba(22, 163, 74, 0.12)' }}>
            <CheckCircle2 size={22} color="#16a34a" />
          </div>
          <div className="dev-kpi-info">
            <span className="dev-kpi-label">Resolved by Me</span>
            <span className="dev-kpi-val">{myResolvedTickets.length}</span>
          </div>
        </div>

        <div
          className={`dev-kpi-card ${activeQueueTab === 'UNASSIGNED' ? 'active' : ''}`}
          onClick={() => handleSwitchTab('UNASSIGNED')}
          title="Click to view unassigned tickets pool"
          role="button"
          tabIndex={0}
        >
          <div className="dev-kpi-icon" style={{ background: 'rgba(100, 116, 139, 0.12)' }}>
            <UserPlus size={22} color="#64748b" />
          </div>
          <div className="dev-kpi-info">
            <span className="dev-kpi-label">Unassigned Pool</span>
            <span className="dev-kpi-val">{unassignedTickets.length}</span>
          </div>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="dev-workspace-layout">
        {/* Left Side: Developer Triage Queue */}
        <div className="dev-queue-panel">
          {/* Queue Filter Tabs */}
          <div className="dev-queue-tabs">
            <button
              type="button"
              className={`dev-queue-tab ${activeQueueTab === 'MY_QUEUE' ? 'active' : ''}`}
              onClick={() => handleSwitchTab('MY_QUEUE')}
            >
              <span>My Queue</span>
              <span className="dev-queue-tab-count">{myAssignedTickets.length}</span>
            </button>

            <button
              type="button"
              className={`dev-queue-tab ${activeQueueTab === 'IN_PROGRESS' ? 'active' : ''}`}
              onClick={() => handleSwitchTab('IN_PROGRESS')}
            >
              <span>Debugging</span>
              <span className="dev-queue-tab-count">{myInProgressTickets.length}</span>
            </button>

            <button
              type="button"
              className={`dev-queue-tab ${activeQueueTab === 'WAITING_CLIENT' ? 'active' : ''}`}
              onClick={() => handleSwitchTab('WAITING_CLIENT')}
            >
              <span>Waiting Info</span>
              <span className="dev-queue-tab-count">{myWaitingClientTickets.length}</span>
            </button>

            <button
              type="button"
              className={`dev-queue-tab ${activeQueueTab === 'UNASSIGNED' ? 'active' : ''}`}
              onClick={() => handleSwitchTab('UNASSIGNED')}
            >
              <span>Unassigned</span>
              <span className="dev-queue-tab-count">{unassignedTickets.length}</span>
            </button>

            <button
              type="button"
              className={`dev-queue-tab ${activeQueueTab === 'RESOLVED_BY_ME' ? 'active' : ''}`}
              onClick={() => handleSwitchTab('RESOLVED_BY_ME')}
            >
              <span>Resolved</span>
              <span className="dev-queue-tab-count">{myResolvedTickets.length}</span>
            </button>

            <button
              type="button"
              className={`dev-queue-tab ${activeQueueTab === 'ALL' ? 'active' : ''}`}
              onClick={() => handleSwitchTab('ALL')}
            >
              <span>All ({tickets.length})</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="dev-queue-filters">
            <div className="dev-queue-search-wrap">
              <Search size={15} />
              <input
                type="text"
                placeholder="Search ticket #, subject or client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Tickets Scroll List */}
          <div className="dev-queue-list">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                Loading engineering queue...
              </div>
            ) : displayedQueueTickets.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                <CheckCircle2 size={36} color="#cbd5e1" style={{ marginBottom: '0.5rem' }} />
                <p style={{ margin: 0, fontWeight: 700, color: '#475569' }}>Queue is clean</p>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>No pending tickets in this view.</span>
              </div>
            ) : (
              displayedQueueTickets.map((t) => {
                const tktKey = t.ticket_id || t.ticket_number || `TKT-${t.id}`;
                const isSelected = selectedTicket?.ticket_id === tktKey || selectedTicket?.id === t.id;
                return (
                  <div
                    key={t.id || t.ticket_id}
                    className={`dev-queue-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => loadTicketDetails(tktKey)}
                  >
                    <div className="dev-card-top-row">
                      <span className="dev-card-tkt-id">#{tktKey}</span>
                      <span className="dev-card-company-tag">
                        {t.company_name || t.tenant?.company_name || 'Organization'}
                      </span>
                    </div>

                    <h4 className="dev-card-subject">{t.subject}</h4>

                    <div className="dev-card-bottom-row">
                      <span
                        className={`status-badge ${
                          t.status === 'OPEN'
                            ? 'status-open'
                            : t.status === 'IN_PROGRESS'
                            ? 'status-progress'
                            : t.status === 'WAITING_CLIENT'
                            ? 'status-waiting'
                            : t.status === 'RESOLVED'
                            ? 'status-resolved'
                            : 'status-closed'
                        }`}
                      >
                        {(t.status || 'OPEN').replace('_', ' ')}
                      </span>

                      <span
                        className={`priority-pill ${
                          t.priority === 'CRITICAL_BLOCKER' || t.priority === 'CRITICAL'
                            ? 'priority-critical'
                            : t.priority === 'HIGH'
                            ? 'priority-high'
                            : t.priority === 'MEDIUM'
                            ? 'priority-medium'
                            : 'priority-low'
                        }`}
                      >
                        {t.priority || 'MEDIUM'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Developer Resolution Console */}
        <div className="dev-console-panel">
          {selectedTicketLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
              <span>Loading engineering ticket details...</span>
            </div>
          ) : selectedTicket ? (
            <>
              {/* Context Header */}
              <div className="dev-console-header">
                <div className="dev-console-top-meta">
                  <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.35rem 0' }}>
                      {selectedTicket.subject}
                    </h2>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Ticket #{selectedTicket.ticket_id || selectedTicket.ticket_number} • Reported on {formatTime(selectedTicket.createdAt || selectedTicket.created_at)}
                    </span>
                  </div>
                </div>

                {/* Diagnostics Tags */}
                <div className="dev-diagnostic-pills">
                  <span className="dev-diag-pill">
                    <Building2 size={13} color="#982A86" />
                    <strong>{selectedTicket.tenant?.company_name || selectedTicket.company_name || 'Organization'}</strong>
                    <span style={{ color: '#94a3b8' }}>({selectedTicket.company_code || 'CODE'})</span>
                  </span>

                  <span
                    className="dev-diag-pill"
                    style={{
                      background:
                        selectedTicket.priority === 'CRITICAL_BLOCKER' || selectedTicket.priority === 'CRITICAL'
                          ? '#fef2f2'
                          : selectedTicket.priority === 'HIGH'
                          ? '#fff7ed'
                          : '#f8fafc',
                      color:
                        selectedTicket.priority === 'CRITICAL_BLOCKER' || selectedTicket.priority === 'CRITICAL'
                          ? '#dc2626'
                          : selectedTicket.priority === 'HIGH'
                          ? '#ea580c'
                          : '#475569'
                    }}
                  >
                    <Flame size={13} />
                    Priority: {selectedTicket.priority || 'MEDIUM'}
                  </span>

                  <span
                    className="dev-diag-pill"
                    style={{
                      background:
                        selectedTicket.status === 'OPEN'
                          ? '#eff6ff'
                          : selectedTicket.status === 'IN_PROGRESS'
                          ? '#fef3c7'
                          : selectedTicket.status === 'WAITING_CLIENT'
                          ? '#f5f3ff'
                          : selectedTicket.status === 'RESOLVED'
                          ? '#ecfdf5'
                          : '#f1f5f9',
                      color:
                        selectedTicket.status === 'OPEN'
                          ? '#2563eb'
                          : selectedTicket.status === 'IN_PROGRESS'
                          ? '#d97706'
                          : selectedTicket.status === 'WAITING_CLIENT'
                          ? '#7c3aed'
                          : selectedTicket.status === 'RESOLVED'
                          ? '#059669'
                          : '#64748b'
                    }}
                  >
                    <Clock size={13} />
                    Status: <strong>{(selectedTicket.status || 'OPEN').replace('_', ' ')}</strong>
                  </span>

                  <span className="dev-diag-pill">
                    <UserCheck size={13} color="#2563eb" />
                    Assigned: <strong>{selectedTicket.assigned_to || 'Unassigned'}</strong>
                  </span>

                  {(selectedTicket.tenant?.phone || selectedTicket.user_phone) && (
                    <a
                      href={getWhatsAppLink(selectedTicket)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="dev-diag-pill"
                      style={{ color: '#16a34a', textDecoration: 'none' }}
                      title="Open WhatsApp chat with store manager"
                    >
                      <Phone size={13} />
                      <span>{selectedTicket.tenant?.phone || selectedTicket.user_phone}</span>
                      <ExternalLink size={10} />
                    </a>
                  )}
                </div>

                {/* Lock banner if not assigned to active developer */}
                {!isAssignedToActiveDev && (
                  isTicketUnassigned ? (
                    <div className="dev-lock-banner unassigned">
                      <Lock size={15} color="#d97706" />
                      <div className="dev-lock-text">
                        <strong>Pending Super Admin Assignment</strong>
                        <span>This ticket is currently unassigned. Super Admin must assign this ticket to you before you can post replies.</span>
                      </div>
                    </div>
                  ) : (
                    <div className="dev-lock-banner assigned-other">
                      <ShieldAlert size={15} color="#dc2626" />
                      <div className="dev-lock-text">
                        <strong>Assigned to {selectedTicket.assigned_to}</strong>
                        <span>Read-only inspection mode. Only <strong>{selectedTicket.assigned_to}</strong> or Super Admin can modify ticket status or post developer replies.</span>
                      </div>
                    </div>
                  )
                )}
              </div>

              {/* Chat Log with Dual Stream (Internal Notes & Public Client Replies) */}
              <div className="dev-console-body">
                {/* Original Client Report */}
                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderLeft: '4px solid #982A86',
                    padding: '1.15rem',
                    borderRadius: '12px',
                    fontSize: '0.88rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.75rem', color: '#64748b' }}>
                    <strong>Original Client Report ({selectedTicket.user_name || 'Tenant Admin'})</strong>
                    <span>{formatTime(selectedTicket.createdAt || selectedTicket.created_at)}</span>
                  </div>
                  <div style={{ whiteSpace: 'pre-wrap', color: '#1e293b' }}>
                    {selectedTicket.description}
                  </div>
                </div>

                {/* Conversation & Internal Notes */}
                {(selectedTicket.messages || []).map((msg) => {
                  const isClient = msg.sender_type === 'CLIENT' || msg.sender_role === 'CLIENT';
                  const isInternal = msg.is_internal_note;

                  if (isInternal) {
                    return (
                      <div
                        key={msg.id}
                        style={{
                          background: '#fffbeb',
                          border: '1px solid #fde68a',
                          borderLeft: '4px solid #f59e0b',
                          borderRadius: '12px',
                          padding: '1rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.35rem'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Lock size={13} color="#f59e0b" />
                            <span style={{ fontSize: '0.7rem', fontWeight: 800, background: '#fef3c7', color: '#b45309', padding: '0.15rem 0.45rem', borderRadius: '6px' }}>
                              Internal Engineering Log
                            </span>
                            <strong style={{ fontSize: '0.82rem', color: '#78350f' }}>{msg.sender_name || 'Developer'}</strong>
                          </div>
                          <span style={{ fontSize: '0.72rem', color: '#b45309' }}>
                            {formatTime(msg.createdAt || msg.created_at)}
                          </span>
                        </div>
                        <div style={{ color: '#78350f', fontSize: '0.86rem', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                          {msg.message}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg.id}
                      style={{
                        background: isClient ? '#f8fafc' : 'rgba(152, 42, 134, 0.05)',
                        border: isClient ? '1px solid #e2e8f0' : '1px solid rgba(152, 42, 134, 0.2)',
                        borderRadius: '12px',
                        padding: '1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.35rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '0.85rem', color: isClient ? '#0f172a' : '#982A86' }}>
                          {isClient ? (msg.sender_name || selectedTicket.user_name || 'Client') : (msg.sender_name || 'StockPilot Developer')}
                          {isClient && <span style={{ fontSize: '0.72rem', color: '#64748b', marginLeft: '0.4rem', fontWeight: 600 }}>[Tenant]</span>}
                        </strong>
                        <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                          {formatTime(msg.createdAt || msg.created_at)}
                        </span>
                      </div>
                      <div style={{ color: '#1e293b', fontSize: '0.88rem', whiteSpace: 'pre-wrap' }}>
                        {msg.message}
                      </div>
                    </div>
                  );
                })}
                <div ref={chatBottomRef} />
              </div>

              {/* Developer Composer */}
              {isAssignedToActiveDev ? (
                <div className="dev-console-footer">
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      style={{
                        background: replyMode === 'INTERNAL' ? '#f59e0b' : '#f8fafc',
                        color: replyMode === 'INTERNAL' ? '#ffffff' : '#64748b',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        padding: '0.4rem 0.85rem',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}
                      onClick={() => setReplyMode('INTERNAL')}
                    >
                      <Lock size={12} />
                      <span>Internal Dev Note (Private)</span>
                    </button>

                    <button
                      type="button"
                      style={{
                        background: replyMode === 'CLIENT' ? '#982A86' : '#f8fafc',
                        color: replyMode === 'CLIENT' ? '#ffffff' : '#64748b',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        padding: '0.4rem 0.85rem',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}
                      onClick={() => setReplyMode('CLIENT')}
                    >
                      <Send size={12} />
                      <span>Public Reply to Client</span>
                    </button>
                  </div>

                  <form onSubmit={handleSendDevMessage} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
                    <textarea
                      placeholder={
                        replyMode === 'INTERNAL'
                          ? 'Log internal developer notes, reproduction steps, SQL query or root cause analysis...'
                          : 'Reply directly to the client...'
                      }
                      value={composerText}
                      onChange={(e) => setComposerText(e.target.value)}
                      style={{
                        flex: 1,
                        border: replyMode === 'INTERNAL' ? '1px solid #f59e0b' : '1px solid #cbd5e1',
                        background: replyMode === 'INTERNAL' ? '#fffdf5' : '#ffffff',
                        borderRadius: '10px',
                        padding: '0.75rem',
                        fontSize: '0.88rem',
                        minHeight: '48px',
                        maxHeight: '120px',
                        outline: 'none'
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendDevMessage(e);
                        }
                      }}
                    />
                    <button
                      type="submit"
                      style={{
                        background: replyMode === 'INTERNAL' ? '#f59e0b' : '#982A86',
                        color: '#ffffff',
                        border: 'none',
                        height: '48px',
                        padding: '0 1.35rem',
                        borderRadius: '10px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem'
                      }}
                      disabled={sendingMessage || !composerText.trim()}
                    >
                      <Send size={15} />
                      <span>{replyMode === 'INTERNAL' ? 'Log Note' : 'Send'}</span>
                    </button>
                  </form>
                </div>
              ) : (
                <div className="dev-console-footer locked">
                  <div className="dev-locked-composer-msg">
                    <Lock size={15} color="#64748b" />
                    <span>
                      {isTicketUnassigned
                        ? 'Messaging & status actions locked: Waiting for Super Admin assignment.'
                        : `Messaging & status actions locked: Assigned to ${selectedTicket.assigned_to}. Only assigned engineer or SuperAdmin can post.`}
                    </span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
              Select an issue from your queue to begin debugging
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
