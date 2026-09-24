import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import {
  LifeBuoy,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Send,
  MessageSquare,
  Zap,
  Printer,
  FileSpreadsheet,
  Layers,
  Store,
  HelpCircle,
  X,
  UserCheck,
  Copy,
  Trash2
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../services/api';
import CustomSelect from '../../components/CustomSelect';
import ConfirmModal from '../../components/ConfirmModal';
import './TenantSupportPage.css';

// Simple, Clean Module Category Options
const CATEGORY_OPTIONS = [
  { value: 'POS_HARDWARE', label: 'POS & Thermal Hardware', icon: <Printer size={16} color="#0284c7" /> },
  { value: 'GST_BILLING', label: 'GST & Invoicing', icon: <FileSpreadsheet size={16} color="#16a34a" /> },
  { value: 'INVENTORY_SYNC', label: 'Inventory & Stock Sync', icon: <Layers size={16} color="#ca8a04" /> },
  { value: 'STOREFRONT', label: 'Online Storefront Builder', icon: <Store size={16} color="#9333ea" /> },
  { value: 'GENERAL', label: 'General Support & Queries', icon: <HelpCircle size={16} color="#64748b" /> }
];

// Simple, Clean Priority Options
const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL_BLOCKER', label: 'Critical' }
];

// Left Panel Filter Options
const FILTER_STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Status' },
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'WAITING_CLIENT', label: 'Waiting Client' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'CLOSED', label: 'Closed' }
];

const FILTER_CATEGORY_OPTIONS = [
  { value: 'ALL', label: 'All Categories' },
  { value: 'POS_HARDWARE', label: 'POS & Thermal Hardware' },
  { value: 'GST_BILLING', label: 'GST & Invoicing' },
  { value: 'INVENTORY_SYNC', label: 'Inventory Sync' },
  { value: 'STOREFRONT', label: 'Storefront' },
  { value: 'GENERAL', label: 'General' }
];

export default function TenantSupportPage() {
  const { user } = useSelector((state) => state.auth);

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [selectedTicketLoading, setSelectedTicketLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // New Ticket Modal State
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    category: 'GENERAL',
    priority: 'MEDIUM',
    description: ''
  });

  // Reply Composer State
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const chatBottomRef = useRef(null);

  // Delete Confirmation Modal State
  const [ticketToDelete, setTicketToDelete] = useState(null);
  const [deletingTicket, setDeletingTicket] = useState(false);

  // Fetch Tickets
  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await api.get('/tenants/tickets');
      const ticketList = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      setTickets(ticketList);
      if (ticketList.length > 0 && !selectedTicket) {
        loadTicketDetails(ticketList[0].ticket_id || ticketList[0].id);
      }
    } catch (err) {
      console.error('Failed to load tickets', err);
      toast.error('Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Single Ticket Details
  const loadTicketDetails = async (ticketIdentifier) => {
    try {
      setSelectedTicketLoading(true);
      const res = await api.get(`/tenants/tickets/${ticketIdentifier}`);
      const details = res?.data || res;
      if (details) {
        setSelectedTicket(details);
      }
    } catch (err) {
      console.error('Failed to load ticket details', err);
      toast.error('Failed to load conversation');
    } finally {
      setSelectedTicketLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedTicket?.messages]);

  // Create Ticket Submit
  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!formData.subject.trim() || !formData.description.trim()) {
      toast.warning('Please enter a subject and description');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        subject: formData.subject.trim(),
        category: formData.category,
        priority: formData.priority,
        description: formData.description.trim()
      };

      const res = await api.post('/tenants/tickets', payload);
      const created = res?.data || res;

      toast.success('Support ticket submitted successfully!');
      setShowModal(false);
      setFormData({
        subject: '',
        category: 'GENERAL',
        priority: 'MEDIUM',
        description: ''
      });

      // Refresh list and select the newly created ticket
      await fetchTickets();
      if (created && (created.ticket_id || created.id)) {
        const tktId = created.ticket_id || created.id;
        loadTicketDetails(created.ticket_id || created.id || tktId);
      }
    } catch (err) {
      console.error('Error creating ticket:', err);
      toast.error(err?.response?.data?.message || err?.message || 'Failed to raise ticket');
    } finally {
      setSubmitting(false);
    }
  };

  // Send Reply
  const handleSendReply = async (e) => {
    e?.preventDefault?.();
    if (!replyText.trim() || !selectedTicket) return;

    try {
      setSendingReply(true);
      const ticketKey = selectedTicket.ticket_id || selectedTicket.id || selectedTicket.ticket?.ticket_id;
      if (!ticketKey) {
        toast.error('Ticket ID missing');
        return;
      }

      const currentUserName = user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email || selectedTicket?.user_name || 'Tenant Admin';

      const res = await api.post(`/tenants/tickets/${ticketKey}/messages`, {
        message: replyText.trim(),
        sender_name: currentUserName
      });

      if (res) {
        setReplyText('');
        toast.success('Message sent to developer');
        loadTicketDetails(ticketKey);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      toast.error('Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  // Trigger Delete Confirmation Modal
  const requestDeleteTicket = (ticketObj) => {
    if (!ticketObj) return;
    setTicketToDelete(ticketObj);
  };

  // Execute Deletion
  const handleConfirmDelete = async () => {
    if (!ticketToDelete) return;
    const ticketIdentifier = ticketToDelete.ticket_id || ticketToDelete.id || ticketToDelete.ticket_number;
    try {
      setDeletingTicket(true);
      await api.delete(`/tenants/tickets/${ticketIdentifier}`);
      toast.success(`Ticket #${ticketIdentifier} deleted successfully`);
      if (
        selectedTicket?.ticket_id === ticketIdentifier ||
        selectedTicket?.id === ticketIdentifier ||
        selectedTicket?.ticket_number === ticketIdentifier
      ) {
        setSelectedTicket(null);
      }
      setTicketToDelete(null);
      fetchTickets();
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

  // Format Date
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

  // KPI Calculations
  const totalCount = tickets.length;
  const openCount = tickets.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS' || t.status === 'WAITING_CLIENT').length;
  const resolvedCount = tickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length;

  // Filtered Tickets
  const filteredTickets = tickets.filter((ticket) => {
    const tktNum = (ticket.ticket_id || ticket.ticket_number || '').toLowerCase();
    const subj = (ticket.subject || '').toLowerCase();
    const q = searchQuery.toLowerCase();
    const matchesSearch = subj.includes(q) || tktNum.includes(q);
    const matchesStatus = statusFilter === 'ALL' || ticket.status === statusFilter;
    const matchesCategory = categoryFilter === 'ALL' || ticket.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <div className="support-page-container">
      {/* Header Banner */}
      <div className="support-header">
        <div className="support-title-group">
          <div className="support-header-icon">
            <LifeBuoy size={26} />
          </div>
          <div>
            <h1>Developer Support &amp; Helpdesk</h1>
            <p>Direct ticket resolution with core engineering, live logs &amp; SLA tracking</p>
          </div>
        </div>
        <div className="support-header-actions">
          <button
            className="btn-raise-ticket"
            onClick={() => setShowModal(true)}
            id="btn-raise-ticket-modal"
          >
            <Plus size={18} />
            Raise New Ticket
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="support-kpis">
        <div className="support-kpi-card">
          <div className="support-kpi-icon" style={{ background: 'rgba(152, 42, 134, 0.12)' }}>
            <LifeBuoy size={22} color="#982A86" />
          </div>
          <div className="support-kpi-info">
            <span className="support-kpi-label">Total Tickets</span>
            <span className="support-kpi-val">{totalCount}</span>
          </div>
        </div>

        <div className="support-kpi-card">
          <div className="support-kpi-icon" style={{ background: 'rgba(234, 88, 12, 0.12)' }}>
            <Clock size={22} color="#ea580c" />
          </div>
          <div className="support-kpi-info">
            <span className="support-kpi-label">Active / In Progress</span>
            <span className="support-kpi-val">{openCount}</span>
          </div>
        </div>

        <div className="support-kpi-card">
          <div className="support-kpi-icon" style={{ background: 'rgba(22, 163, 74, 0.12)' }}>
            <CheckCircle2 size={22} color="#16a34a" />
          </div>
          <div className="support-kpi-info">
            <span className="support-kpi-label">Resolved Issues</span>
            <span className="support-kpi-val">{resolvedCount}</span>
          </div>
        </div>

        <div className="support-kpi-card">
          <div className="support-kpi-icon" style={{ background: 'rgba(2, 132, 199, 0.12)' }}>
            <Zap size={22} color="#0284c7" />
          </div>
          <div className="support-kpi-info">
            <span className="support-kpi-label">Avg Dev Response</span>
            <span className="support-kpi-val">&lt; 15 Mins</span>
          </div>
        </div>
      </div>

      {/* Main Grid: List + Details */}
      <div className="support-main-layout">
        {/* Left Side: Ticket List */}
        <div className="tickets-list-card">
          <div className="tickets-filter-bar">
            <div className="search-input-wrapper">
              <Search size={15} />
              <input
                type="text"
                placeholder="Search ticket # or subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Dropdown Filters */}
            <div className="tickets-dropdown-filters-row">
              <div style={{ flex: 1 }}>
                <CustomSelect
                  value={statusFilter}
                  onChange={(val) => setStatusFilter(val)}
                  options={FILTER_STATUS_OPTIONS}
                  size="sm"
                />
              </div>

              <div style={{ flex: 1 }}>
                <CustomSelect
                  value={categoryFilter}
                  onChange={(val) => setCategoryFilter(val)}
                  options={FILTER_CATEGORY_OPTIONS}
                  size="sm"
                />
              </div>
            </div>
          </div>

          <div className="tickets-scroll-area">
            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                Loading tickets...
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="empty-state-card">
                <MessageSquare size={36} color="#cbd5e1" style={{ marginBottom: '0.75rem' }} />
                <p style={{ margin: 0, fontWeight: 700, color: '#475569' }}>No tickets found</p>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                  Click &quot;Raise New Ticket&quot; to connect with our developers.
                </span>
              </div>
            ) : (
              filteredTickets.map((t) => {
                const tktKey = t.ticket_id || t.ticket_number || `TKT-${t.id}`;
                const isSelected = (selectedTicket?.ticket_id === tktKey) || (selectedTicket?.id === t.id);
                return (
                  <div
                    key={t.id || tktKey}
                    className={`ticket-item-row ${isSelected ? 'selected' : ''}`}
                    onClick={() => loadTicketDetails(tktKey)}
                  >
                    <div className="ticket-item-top">
                      <span className="ticket-num-badge">#{tktKey}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="ticket-time-text">{formatTime(t.createdAt || t.created_at)}</span>
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

                    <h4 className="ticket-item-subject">{t.subject}</h4>
                    {t.description && (
                      <p className="ticket-item-desc-snippet">{t.description}</p>
                    )}

                    <div className="ticket-item-footer">
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
                        {t.priority === 'CRITICAL_BLOCKER' ? 'Critical' : (t.priority || 'Medium')}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Conversation / Ticket Details */}
        <div className="ticket-detail-view">
          {selectedTicketLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
              <span>Loading conversation thread...</span>
            </div>
          ) : selectedTicket ? (
            <>
              {/* Header */}
              <div className="ticket-detail-header">
                <div className="ticket-main-meta" style={{ flex: 1, minWidth: 0 }}>
                  <h2>{selectedTicket.subject}</h2>

                  <div className="meta-tags-row">
                    <span className="ticket-num-badge">
                      #{selectedTicket.ticket_id || selectedTicket.ticket_number}
                    </span>

                    <span
                      className={`status-badge ${
                        selectedTicket.status === 'OPEN'
                          ? 'status-open'
                          : selectedTicket.status === 'IN_PROGRESS'
                          ? 'status-progress'
                          : selectedTicket.status === 'WAITING_CLIENT'
                          ? 'status-waiting'
                          : selectedTicket.status === 'RESOLVED'
                          ? 'status-resolved'
                          : 'status-closed'
                      }`}
                    >
                      {(selectedTicket.status || 'OPEN').replace('_', ' ')}
                    </span>

                    <span
                      className={`priority-pill ${
                        selectedTicket.priority === 'CRITICAL_BLOCKER' || selectedTicket.priority === 'CRITICAL'
                          ? 'priority-critical'
                          : selectedTicket.priority === 'HIGH'
                          ? 'priority-high'
                          : selectedTicket.priority === 'MEDIUM'
                          ? 'priority-medium'
                          : 'priority-low'
                      }`}
                    >
                      Priority: {selectedTicket.priority === 'CRITICAL_BLOCKER' ? 'Critical' : (selectedTicket.priority || 'Medium')}
                    </span>

                    {selectedTicket.assigned_to && selectedTicket.assigned_to !== 'Unassigned' && (
                      <span className="dev-assigned-chip">
                        <UserCheck size={13} />
                        Assigned Dev: {selectedTicket.assigned_to}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  className="btn-delete-ticket-header"
                  type="button"
                  title="Delete ticket"
                  onClick={() => requestDeleteTicket(selectedTicket)}
                >
                  <Trash2 size={14} />
                  <span>Delete</span>
                </button>
              </div>

              {/* Chat Thread */}
              <div className="ticket-conversation-body">
                {/* Initial Description Card */}
                <div className="initial-issue-box">
                  <div className="initial-issue-header">
                    <span>Original Issue Description</span>
                    <span>{formatTime(selectedTicket.createdAt || selectedTicket.created_at)}</span>
                  </div>
                  <div style={{ whiteSpace: 'pre-wrap', color: '#1e293b', lineHeight: 1.5 }}>
                    {selectedTicket.description}
                  </div>
                </div>

                {/* Messages */}
                {(selectedTicket.messages || []).map((msg) => {
                  const isClient = msg.sender_type === 'CLIENT' || msg.sender_role === 'CLIENT';
                  const isSystem = msg.sender_type === 'SYSTEM';
                  const senderName = isClient
                    ? (msg.sender_name && msg.sender_name !== 'Client' ? msg.sender_name : (user?.name || selectedTicket.user_name || 'Tenant Admin'))
                    : (msg.sender_name || 'StockPilot Support');

                  return (
                    <div
                      key={msg.id}
                      className={`chat-message-bubble ${isClient ? 'client' : (isSystem ? 'system' : 'admin')}`}
                    >
                      <div className="msg-header">
                        <span className="msg-sender-name">
                          {senderName}
                          {!isClient && !isSystem && <span className="dev-verified-tag">Core Dev</span>}
                          {isClient && <span className="dev-verified-tag" style={{ background: 'rgba(255, 255, 255, 0.22)', color: '#ffffff' }}>You</span>}
                          {isSystem && <span className="dev-verified-tag" style={{ background: '#fef3c7', color: '#b45309' }}>System</span>}
                        </span>
                        <span>{formatTime(msg.createdAt || msg.created_at)}</span>
                      </div>
                      <div className="msg-text">{msg.message}</div>
                    </div>
                  );
                })}
                <div ref={chatBottomRef} />
              </div>

              {/* Reply Composer with Quick Replies */}
              <form className="ticket-composer-area" onSubmit={handleSendReply}>
                <div className="quick-replies-row">
                  {[
                    'Any updates on this ticket?',
                    'Issue is resolved, thanks!',
                    'Need assistance with reproduction steps.'
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      className="quick-reply-chip"
                      onClick={() => setReplyText(chip)}
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                <div className="composer-input-row">
                  <textarea
                    placeholder="Type your message or follow-up question..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendReply(e);
                      }
                    }}
                  />
                  <button
                    type="submit"
                    className="btn-send-msg"
                    disabled={sendingReply || !replyText.trim()}
                  >
                    <Send size={16} />
                    <span>Send</span>
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="empty-state-card">
              <MessageSquare size={48} color="#cbd5e1" style={{ marginBottom: '1rem' }} />
              <h3 style={{ margin: '0 0 0.4rem 0', color: '#334155' }}>Select a support ticket</h3>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>
                Choose an issue from the list on the left to view logs or communicate with our engineers.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Raise Ticket Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-left">
                <div className="modal-header-badge-icon">
                  <LifeBuoy size={20} />
                </div>
                <div>
                  <h3>Raise Support Ticket</h3>
                  <p>Direct ticket dispatching to core StockPilot developers</p>
                </div>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setShowModal(false)}
                type="button"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTicket}>
              <div className="modal-body">
                <div className="form-field-group">
                  <label>Subject / Brief Summary *</label>
                  <input
                    type="text"
                    name="subject"
                    placeholder="e.g. Thermal Printer POS invoice cut issue"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-field-group">
                    <label>Module / Category *</label>
                    <CustomSelect
                      value={formData.category}
                      onChange={(val) => setFormData({ ...formData, category: val })}
                      options={CATEGORY_OPTIONS}
                      size="md"
                    />
                  </div>

                  <div className="form-field-group">
                    <label>Priority SLA *</label>
                    <CustomSelect
                      value={formData.priority}
                      onChange={(val) => setFormData({ ...formData, priority: val })}
                      options={PRIORITY_OPTIONS}
                      size="md"
                    />
                  </div>
                </div>

                <div className="form-field-group">
                  <label>Detailed Problem Description *</label>
                  <textarea
                    name="description"
                    rows={4}
                    placeholder="Provide details, step-by-step reproduction, or error message..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-modal-submit"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sleek Enterprise Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(ticketToDelete)}
        onClose={() => !deletingTicket && setTicketToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Support Ticket?"
        message="Are you sure you want to delete this ticket and all of its messages? This action cannot be undone."
        itemName={ticketToDelete ? `#${ticketToDelete.ticket_id || ticketToDelete.id || ticketToDelete.ticket_number} — ${ticketToDelete.subject}` : ''}
        confirmText="Delete Ticket"
        cancelText="Cancel"
        variant="danger"
        loading={deletingTicket}
      />
    </div>
  );
}
