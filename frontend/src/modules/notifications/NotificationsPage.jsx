import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'react-toastify';
import CustomSelect from '../../components/CustomSelect';
import {
  Bell,
  CheckCheck,
  Trash2,
  AlertTriangle,
  ShoppingBag,
  ShoppingCart,
  ArrowRightLeft,
  RefreshCw,
  Send,
  Building,
  Radio,
  X,
  ShieldAlert,
  Info,
  Sparkles,
  ExternalLink,
  ArrowRight,
  Check,
  Zap,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  PackageCheck
} from 'lucide-react';

export default function NotificationsPage() {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const isSuper = Boolean(user?.isSuperAdmin);

  const [notifications, setNotifications] = useState([]);
  const [counts, setCounts] = useState({ all: 0, unread: 0, requests: 0, stock: 0, transactions: 0, system: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL', 'REQUESTS', 'STOCK', 'TRANSACTIONS', 'SYSTEM'
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Broadcast Modal State for Super Admin
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [broadcastLoading, setBroadcastLoading] = useState(false);
  const [tenantsList, setTenantsList] = useState([]);
  const [broadcastForm, setBroadcastForm] = useState({
    targetType: 'ALL', // 'ALL' or 'SPECIFIC'
    selectedTenantId: '',
    category: 'SYSTEM',
    type: 'SYSTEM',
    title: '',
    message: '',
    link: ''
  });

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications', {
        params: {
          category: activeTab !== 'ALL' ? activeTab : undefined,
          unreadOnly: unreadOnly ? 'true' : undefined,
          search: searchQuery.trim() || undefined,
          limit: 100
        }
      });
      if (res?.data) {
        setNotifications(res.data.notifications || []);
        if (res.data.counts) {
          setCounts(res.data.counts);
        }
      }
    } catch (err) {
      console.error('Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTenantsForBroadcast = async () => {
    if (!isSuper) return;
    try {
      const res = await api.get('/admin/tenants');
      setTenantsList(res?.data || []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchNotifications();
    if (isSuper) {
      fetchTenantsForBroadcast();
    }
  }, [activeTab, unreadOnly, isSuper]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchNotifications();
  };

  const handleMarkAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setCounts((prev) => ({ ...prev, unread: Math.max(0, (prev.unread || 1) - 1) }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setCounts((prev) => ({ ...prev, unread: 0 }));
      toast.success('All notifications marked as read');
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearRead = async () => {
    try {
      await api.delete('/notifications/clear-read');
      toast.success('Read notifications cleared');
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast.success('Notification dismissed');
    } catch (err) {
      console.error(err);
    }
  };

  const handleExecuteAction = async (n, action) => {
    try {
      setActionLoadingId(n.id);
      await api.post(`/notifications/${n.id}/action`, { action });
      const newStatus = action === 'APPROVE' ? 'APPROVED' : (action === 'REJECT' ? 'REJECTED' : 'PROCESSED');
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === n.id ? { ...item, action_status: newStatus, is_read: true } : item
        )
      );
      toast.success(`Request ${action.toLowerCase()}d successfully!`);
      fetchNotifications();
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to execute ${action.toLowerCase()}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastForm.title.trim() || !broadcastForm.message.trim()) {
      toast.warning('Please provide both Title and Message for the broadcast');
      return;
    }

    if (broadcastForm.targetType === 'SPECIFIC' && !broadcastForm.selectedTenantId) {
      toast.warning('Please select a target tenant company');
      return;
    }

    try {
      setBroadcastLoading(true);
      const payload = {
        tenantId: broadcastForm.targetType === 'ALL' ? 'ALL' : Number(broadcastForm.selectedTenantId),
        tenantIds: broadcastForm.targetType === 'ALL' ? tenantsList.map((t) => t.id) : [Number(broadcastForm.selectedTenantId)],
        type: broadcastForm.type,
        category: broadcastForm.category,
        title: broadcastForm.title.trim(),
        message: broadcastForm.message.trim(),
        link: broadcastForm.link.trim() || null
      };

      await api.post('/notifications/broadcast', payload);
      toast.success(
        broadcastForm.targetType === 'ALL'
          ? `Broadcast sent to all active tenant companies!`
          : `Notification sent to selected company workspace!`
      );
      setIsBroadcastOpen(false);
      setBroadcastForm({
        targetType: 'ALL',
        selectedTenantId: '',
        category: 'SYSTEM',
        type: 'SYSTEM',
        title: '',
        message: '',
        link: ''
      });
      fetchNotifications();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to dispatch broadcast');
    } finally {
      setBroadcastLoading(false);
    }
  };

  const getIcon = (type, category, title = '') => {
    if (title.startsWith('[Broadcast]')) {
      return <Send size={20} color="#982A86" />;
    }
    switch (type) {
      case 'LOW_STOCK':
      case 'OUT_OF_STOCK':
        return <AlertTriangle size={20} color="#f59e0b" />;
      case 'SALE':
        return <ShoppingBag size={20} color="#10b981" />;
      case 'PURCHASE':
        return <ShoppingCart size={20} color="#3b82f6" />;
      case 'TRANSFER':
        return <ArrowRightLeft size={20} color="#8b5cf6" />;
      case 'RETURN':
        return <RefreshCw size={20} color="#06b6d4" />;
      case 'SECURITY':
        return <ShieldAlert size={20} color="#ef4444" />;
      default:
        return category === 'REQUESTS' ? <Zap size={20} color="#982A86" /> : <Bell size={20} color="#832072" />;
    }
  };

  const unreadCount = counts.unread !== undefined ? counts.unread : notifications.filter((n) => !n.is_read).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '3rem' }}>
      {/* Top Header */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(152, 42, 134, 0.15) 0%, rgba(118, 24, 103, 0.2) 100%)',
                padding: '0.6rem',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <Bell size={26} color="#982A86" />
            </div>
            <div>
              <h1 className="page-title" style={{ margin: 0, fontSize: '1.45rem' }}>
                {isSuper ? 'Notification & Broadcast Center' : 'Notification Center'}
              </h1>
              <p className="page-subtitle" style={{ margin: '4px 0 0 0' }}>
                {isSuper
                  ? 'Manage platform announcements, security alerts, and system broadcasts to tenant businesses'
                  : 'Manage request approvals, real-time stock alerts, order updates, and system broadcasts'}
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {isSuper && (
            <button
              onClick={() => setIsBroadcastOpen(true)}
              className="btn btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'linear-gradient(135deg, #982A86 0%, #761867 100%)',
                boxShadow: '0 4px 12px rgba(152, 42, 134, 0.25)'
              }}
            >
              <Send size={16} /> Broadcast Announcement
            </button>
          )}

          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead} className="btn btn-secondary">
              <CheckCheck size={16} /> Mark All Read
            </button>
          )}

          <button onClick={handleClearRead} className="btn btn-secondary" title="Remove all read notifications">
            <Trash2 size={16} /> Clear Read
          </button>

          <button onClick={fetchNotifications} className="btn btn-secondary">
            <RefreshCw size={16} className={loading ? 'spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Tabs & Search Controls Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          borderBottom: '1px solid #e2e8f0',
          paddingBottom: '0.75rem'
        }}
      >
        {/* Category Tabs */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: 'All', count: counts.all || notifications.length },
            { id: 'REQUESTS', label: 'Requests & Approvals', count: counts.requests || 0 },
            { id: 'STOCK', label: 'Stock Alerts', count: counts.stock || 0 },
            { id: 'TRANSACTIONS', label: 'Orders & Finance', count: counts.transactions || 0 },
            { id: 'SYSTEM', label: 'System Announcements', count: counts.system || 0 }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '0.5rem 0.9rem',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === tab.id ? '#982A86' : '#f8fafc',
                color: activeTab === tab.id ? '#ffffff' : '#64748b',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span
                  style={{
                    background: activeTab === tab.id ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                    color: activeTab === tab.id ? '#ffffff' : '#475569',
                    padding: '1px 6px',
                    borderRadius: '999px',
                    fontSize: '0.7rem'
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Right Search & Unread Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Unread Only Toggle */}
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              fontSize: '0.8rem',
              fontWeight: 700,
              color: '#475569',
              cursor: 'pointer',
              userSelect: 'none'
            }}
          >
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) => setUnreadOnly(e.target.checked)}
              style={{ cursor: 'pointer', accentColor: '#982A86' }}
            />
            Unread only ({unreadCount})
          </label>

          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: '0.45rem 0.85rem 0.45rem 2rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.82rem',
                width: '210px',
                outline: 'none'
              }}
            />
            <Search
              size={14}
              style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
            />
          </form>
        </div>
      </div>

      {/* Notifications List Container */}
      <div className="card" style={{ padding: '1.25rem', borderRadius: '14px', minHeight: '340px' }}>
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
            <RefreshCw size={24} className="spin" style={{ color: '#982A86', margin: '0 auto 0.75rem' }} />
            <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>Syncing notifications...</div>
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#94a3b8' }}>
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: '#fdf2fb',
                border: '1px solid #f3c7ec',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
                color: '#982A86'
              }}
            >
              <CheckCircle2 size={30} />
            </div>
            <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#0f172a' }}>All Caught Up!</div>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.35rem', maxWidth: '420px', margin: '0.35rem auto 0' }}>
              {activeTab !== 'ALL'
                ? `No notifications found in the "${activeTab}" category.`
                : 'No pending alerts, transfer requests, or orders needing your attention right now.'}
            </p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1rem',
                padding: '1rem 1.25rem',
                borderRadius: '12px',
                marginBottom: '0.75rem',
                background: n.is_read ? '#ffffff' : '#fdf8fd',
                border: `1px solid ${n.is_read ? '#e2e8f0' : '#f3c7ec'}`,
                transition: 'all 0.15s ease',
                boxShadow: n.is_read ? 'none' : '0 2px 8px rgba(152, 42, 134, 0.05)'
              }}
            >
              {/* Category Icon Badge */}
              <div
                style={{
                  padding: '0.65rem',
                  background: n.is_read ? '#f8fafc' : '#fdf2fb',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                {getIcon(n.type, n.category, n.title)}
              </div>

              {/* Main Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.94rem', color: '#0f172a' }}>
                      {n.title}
                    </span>
                    {!n.is_read && (
                      <span style={{ background: '#982A86', color: '#ffffff', fontSize: '0.65rem', fontWeight: 800, padding: '0.1rem 0.45rem', borderRadius: '4px' }}>
                        NEW
                      </span>
                    )}
                    {n.category && (
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '0.1rem 0.45rem',
                          borderRadius: '4px',
                          background: '#f1f5f9',
                          color: '#475569'
                        }}
                      >
                        {n.category}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>
                    {new Date(n.created_at || n.createdAt).toLocaleString()}
                  </span>
                </div>

                <p style={{ fontSize: '0.85rem', color: '#475569', marginTop: '0.35rem', lineHeight: 1.5 }}>
                  {n.message}
                </p>

                {/* In-Card Interactive Action Bar */}
                {['TRANSFER_APPROVE', 'PURCHASE_APPROVE', 'RETURN_APPROVE'].includes(n.action_type) ? (
                  <div
                    style={{
                      marginTop: '0.75rem',
                      paddingTop: '0.65rem',
                      borderTop: '1px dashed #e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.6rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {n.action_status === 'APPROVED' ? (
                        <span
                          style={{
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            color: '#10b981',
                            background: 'rgba(16, 185, 129, 0.1)',
                            padding: '0.25rem 0.6rem',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Check size={14} /> Approved
                        </span>
                      ) : n.action_status === 'REJECTED' ? (
                        <span
                          style={{
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            color: '#ef4444',
                            background: 'rgba(239, 68, 68, 0.1)',
                            padding: '0.25rem 0.6rem',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <X size={14} /> Rejected
                        </span>
                      ) : n.action_status === 'PROCESSED' ? (
                        <span
                          style={{
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            color: '#3b82f6',
                            background: 'rgba(59, 130, 246, 0.1)',
                            padding: '0.25rem 0.6rem',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <PackageCheck size={14} /> Handled
                        </span>
                      ) : (
                        <>
                          <button
                            onClick={() => handleExecuteAction(n, 'APPROVE')}
                            disabled={actionLoadingId === n.id}
                            style={{
                              padding: '0.35rem 0.8rem',
                              borderRadius: '6px',
                              border: 'none',
                              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              color: '#ffffff',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)'
                            }}
                          >
                            {actionLoadingId === n.id ? <RefreshCw size={13} className="spin" /> : <Check size={14} />}
                            Approve
                          </button>

                          <button
                            onClick={() => handleExecuteAction(n, 'REJECT')}
                            disabled={actionLoadingId === n.id}
                            style={{
                              padding: '0.35rem 0.8rem',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              background: '#ffffff',
                              color: '#64748b',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <X size={14} /> Reject
                          </button>
                        </>
                      )}
                    </div>

                    {/* Navigation Link */}
                    {(n.link || n.type === 'TRANSFER' || n.type === 'PURCHASE') && (
                      <button
                        onClick={() => {
                          handleMarkAsRead(n.id);
                          if (n.link) navigate(n.link);
                          else if (n.type === 'TRANSFER') navigate('/warehouses?tab=transfers');
                          else if (n.type === 'PURCHASE') navigate('/purchases');
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: 'none',
                          border: 'none',
                          color: 'var(--primary)',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          padding: 0
                        }}
                      >
                        View Full Details <ArrowRight size={13} />
                      </button>
                    )}
                  </div>
                ) : (n.category === 'STOCK' || n.type === 'LOW_STOCK' || n.type === 'OUT_OF_STOCK') ? (
                  <div
                    style={{
                      marginTop: '0.75rem',
                      paddingTop: '0.65rem',
                      borderTop: '1px dashed #e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.6rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button
                        onClick={() => {
                          handleMarkAsRead(n.id);
                          navigate(n.action_id ? `/purchases?action=new&productId=${n.action_id}` : '/purchases?action=new');
                        }}
                        className="btn btn-primary btn-sm"
                        style={{
                          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                          border: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '0.78rem'
                        }}
                      >
                        <ShoppingCart size={13} /> Reorder Stock (Create PO)
                      </button>

                      <button
                        onClick={() => {
                          handleMarkAsRead(n.id);
                          navigate('/inventory');
                        }}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.78rem' }}
                      >
                        Adjust Stock
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        handleMarkAsRead(n.id);
                        navigate('/inventory');
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: 'none',
                        border: 'none',
                        color: 'var(--primary)',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      View Live Stock <ArrowRight size={13} />
                    </button>
                  </div>
                ) : (n.link || n.type === 'PURCHASE' || n.type === 'TRANSFER' || n.type === 'SALE') ? (
                  <div
                    style={{
                      marginTop: '0.75rem',
                      paddingTop: '0.65rem',
                      borderTop: '1px dashed #e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end'
                    }}
                  >
                    <button
                      onClick={() => {
                        handleMarkAsRead(n.id);
                        if (n.link) navigate(n.link);
                        else if (n.type === 'PURCHASE') navigate('/purchases');
                        else if (n.type === 'TRANSFER') navigate('/warehouses?tab=transfers');
                        else if (n.type === 'SALE') navigate('/sales');
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: 'none',
                        border: 'none',
                        color: 'var(--primary)',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      View Details <ArrowRight size={13} />
                    </button>
                  </div>
                ) : null}
              </div>

              {/* Action Buttons: Mark Read & Dismiss */}
              <div style={{ display: 'flex', gap: '0.4rem', alignSelf: 'center', flexShrink: 0 }}>
                {!n.is_read && (
                  <button
                    onClick={() => handleMarkAsRead(n.id)}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '0.4rem 0.65rem' }}
                    title="Mark as read"
                  >
                    <CheckCheck size={14} />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(n.id)}
                  className="btn btn-danger btn-sm"
                  style={{ padding: '0.4rem 0.65rem' }}
                  title="Dismiss notification"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Super Admin Broadcast Modal */}
      {isBroadcastOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1rem'
          }}
          onClick={() => !broadcastLoading && setIsBroadcastOpen(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '580px',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              overflow: 'hidden',
              animation: 'fadeIn 0.2s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#f8fafc'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ background: '#fdf2fb', padding: '0.5rem', borderRadius: '10px' }}>
                  <Send size={20} color="#982A86" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                    Broadcast Notification to Tenants
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                    Dispatch system announcements, maintenance alerts, or updates to business workspaces
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBroadcastOpen(false)}
                disabled={broadcastLoading}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSendBroadcast} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              {/* Target Scope Selection */}
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.45rem' }}>
                  Target Audience
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setBroadcastForm((prev) => ({ ...prev, targetType: 'ALL' }))}
                    style={{
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: broadcastForm.targetType === 'ALL' ? '2px solid #982A86' : '1px solid #cbd5e1',
                      background: broadcastForm.targetType === 'ALL' ? '#fdf2fb' : '#ffffff',
                      color: broadcastForm.targetType === 'ALL' ? '#982A86' : '#475569',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <Radio size={16} /> All Tenants ({tenantsList.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setBroadcastForm((prev) => ({ ...prev, targetType: 'SPECIFIC' }))}
                    style={{
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: broadcastForm.targetType === 'SPECIFIC' ? '2px solid #982A86' : '1px solid #cbd5e1',
                      background: broadcastForm.targetType === 'SPECIFIC' ? '#fdf2fb' : '#ffffff',
                      color: broadcastForm.targetType === 'SPECIFIC' ? '#982A86' : '#475569',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <Building size={16} /> Specific Company
                  </button>
                </div>
              </div>

              {/* Company Picker when SPECIFIC is chosen */}
              {broadcastForm.targetType === 'SPECIFIC' && (
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                    Select Tenant Company *
                  </label>
                  <CustomSelect
                    value={broadcastForm.selectedTenantId}
                    onChange={(e) => setBroadcastForm((prev) => ({ ...prev, selectedTenantId: e.target.value }))}
                    placeholder="Choose Tenant Organization"
                    options={[
                      { value: '', label: 'Choose Tenant Organization' },
                      ...tenantsList.map((t) => ({
                        value: t.id,
                        label: t.company_name
                      }))
                    ]}
                  />
                </div>
              )}

              {/* Notification Category */}
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                  Notification Category
                </label>
                <CustomSelect
                  value={broadcastForm.category}
                  onChange={(e) => setBroadcastForm((prev) => ({ ...prev, category: e.target.value, type: e.target.value }))}
                  options={[
                    { value: 'SYSTEM', label: 'System Announcement / General' },
                    { value: 'SECURITY', label: 'Security Alert / Compliance Notice' },
                    { value: 'TRANSACTIONS', label: 'Plan / Feature / Billing Update' },
                    { value: 'STOCK', label: 'Supply Chain & Logistics Advisory' }
                  ]}
                />
              </div>

              {/* Title */}
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                  Announcement Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Scheduled System Maintenance (Sunday 02:00 AM IST)"
                  value={broadcastForm.title}
                  onChange={(e) => setBroadcastForm((prev) => ({ ...prev, title: e.target.value }))}
                  required
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              {/* Message */}
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                  Broadcast Message *
                </label>
                <textarea
                  rows={3}
                  placeholder="Enter the detailed message for all users in the target workspace(s)..."
                  value={broadcastForm.message}
                  onChange={(e) => setBroadcastForm((prev) => ({ ...prev, message: e.target.value }))}
                  required
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.85rem',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Footer Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsBroadcastOpen(false)}
                  disabled={broadcastLoading}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={broadcastLoading}
                  className="btn btn-primary"
                  style={{
                    background: 'linear-gradient(135deg, #982A86 0%, #761867 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {broadcastLoading ? (
                    <>
                      <RefreshCw size={16} className="spin" /> Sending Broadcast...
                    </>
                  ) : (
                    <>
                      <Send size={16} /> Dispatch Notification
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

