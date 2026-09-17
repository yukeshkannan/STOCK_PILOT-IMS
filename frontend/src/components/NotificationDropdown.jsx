import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import {
  Bell,
  CheckCheck,
  ExternalLink,
  AlertTriangle,
  ShoppingBag,
  ShoppingCart,
  ArrowRightLeft,
  Clock,
  ShieldAlert,
  ArrowRight,
  Check,
  X,
  RefreshCw,
  Zap,
  Volume2,
  VolumeX
} from 'lucide-react';
import api from '../services/api';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

// Subtle Web Audio Chime for incoming notifications
function playNotificationChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1); // A5
    
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // AudioContext autoplay restricted
  }
}

export default function NotificationDropdown() {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL', 'REQUESTS', 'STOCK', 'TRANSACTIONS'
  const [notifications, setNotifications] = useState([]);
  const [counts, setCounts] = useState({ all: 0, unread: 0, requests: 0, stock: 0, transactions: 0 });
  const [unreadCount, setUnreadCount] = useState(0);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const prevUnreadRef = useRef(0);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications', {
        params: { limit: 20 }
      });
      if (res?.data) {
        const notifList = res.data.notifications || [];
        const newUnread = res.data.unreadCount || 0;
        
        // Play chime if new unread notification arrived while sound enabled
        if (soundEnabled && newUnread > prevUnreadRef.current && prevUnreadRef.current !== 0) {
          playNotificationChime();
        }
        prevUnreadRef.current = newUnread;

        setNotifications(notifList);
        setUnreadCount(newUnread);
        if (res.data.counts) {
          setCounts(res.data.counts);
        }
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 12000);
    return () => clearInterval(interval);
  }, [soundEnabled]);

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // ignore
    }
  };

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success('All marked as read');
    } catch {
      // ignore
    }
  };

  const handleExecuteAction = async (e, n, action) => {
    e.stopPropagation();
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
      toast.error(err.response?.data?.message || `Failed to ${action.toLowerCase()} request`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleNotificationClick = (n) => {
    if (!n.is_read) {
      markAsRead(n.id);
    }
    setIsOpen(false);
    if (n.link) {
      navigate(n.link);
    } else if (n.category === 'REQUESTS' || n.type === 'TRANSFER') {
      navigate('/warehouses?tab=transfers');
    } else if (n.type === 'PURCHASE' || n.title?.includes('PO')) {
      navigate('/purchases');
    } else if (n.type === 'LOW_STOCK' || n.type === 'OUT_OF_STOCK') {
      navigate('/inventory');
    } else if (n.type === 'SALE' || n.type === 'RETURN') {
      navigate('/sales');
    }
  };

  const getIcon = (type, category) => {
    switch (type) {
      case 'LOW_STOCK':
      case 'OUT_OF_STOCK':
        return <AlertTriangle size={16} color="#f59e0b" />;
      case 'SALE':
        return <ShoppingBag size={16} color="#10b981" />;
      case 'PURCHASE':
        return <ShoppingCart size={16} color="#3b82f6" />;
      case 'TRANSFER':
        return <ArrowRightLeft size={16} color="#8b5cf6" />;
      case 'RETURN':
        return <RefreshCw size={16} color="#06b6d4" />;
      case 'SECURITY':
        return <ShieldAlert size={16} color="#ef4444" />;
      default:
        return category === 'REQUESTS' ? <Zap size={16} color="#982A86" /> : <Bell size={16} color="#64748b" />;
    }
  };

  // Filter notifications by tab
  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'REQUESTS') return n.category === 'REQUESTS';
    if (activeTab === 'STOCK') return n.category === 'STOCK';
    if (activeTab === 'TRANSACTIONS') return n.category === 'TRANSACTIONS';
    return true;
  });

  return (
    <div className="notification-btn-container" style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`notification-nav-btn ${isOpen ? 'active' : ''}`}
        aria-label="Notifications"
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          border: '1px solid #e2e8f0',
          background: isOpen ? '#f1f5f9' : '#ffffff',
          color: '#475569',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          position: 'relative',
          padding: 0,
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
          transition: 'all 0.15s ease'
        }}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              background: '#ef4444',
              color: '#ffffff',
              fontSize: '0.65rem',
              fontWeight: 800,
              minWidth: '18px',
              height: '18px',
              borderRadius: '9999px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)',
              animation: 'pulse 2s infinite'
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Smooth Hover Tooltip (hidden when dropdown is open) */}
      <div className={`notification-tooltip ${isOpen ? 'hidden' : ''}`}>
        Notifications
      </div>

      {isOpen && (
        <>
          <div
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 90 }}
            onClick={() => setIsOpen(false)}
          />
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: 'calc(100% + 8px)',
              width: '390px',
              maxWidth: '92vw',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              boxShadow: '0 20px 40px -6px rgba(15, 23, 42, 0.16), 0 4px 12px -2px rgba(15, 23, 42, 0.06)',
              zIndex: 95,
              maxHeight: '520px',
              display: 'flex',
              flexDirection: 'column',
              animation: 'fadeIn 0.15s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '0.85rem 1rem',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#fafbfc',
                borderTopLeftRadius: '14px',
                borderTopRightRadius: '14px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0f172a' }}>
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <span
                    style={{
                      background: 'rgba(152, 42, 134, 0.12)',
                      color: '#982A86',
                      fontWeight: 800,
                      padding: '0.15rem 0.45rem',
                      borderRadius: '999px',
                      fontSize: '0.68rem'
                    }}
                  >
                    {unreadCount} new
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                {/* Sound Toggle */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSoundEnabled(!soundEnabled);
                  }}
                  title={soundEnabled ? 'Mute alert chime' : 'Enable alert chime'}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: soundEnabled ? '#982A86' : '#94a3b8',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
                </button>

                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <CheckCheck size={14} /> Mark read
                  </button>
                )}
              </div>
            </div>

            {/* Quick Category Filter Tabs */}
            <div
              style={{
                display: 'flex',
                padding: '0.4rem 0.65rem',
                gap: '0.35rem',
                borderBottom: '1px solid #f1f5f9',
                background: '#ffffff',
                overflowX: 'auto'
              }}
            >
              {[
                { id: 'ALL', label: 'All', count: notifications.length },
                { id: 'REQUESTS', label: 'Requests', count: counts.requests || 0 },
                { id: 'STOCK', label: 'Stock Alerts', count: counts.stock || 0 },
                { id: 'TRANSACTIONS', label: 'Orders & Finance', count: counts.transactions || 0 }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '0.28rem 0.6rem',
                    borderRadius: '6px',
                    border: 'none',
                    background: activeTab === tab.id ? '#982A86' : '#f8fafc',
                    color: activeTab === tab.id ? '#ffffff' : '#64748b',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span
                      style={{
                        background: activeTab === tab.id ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                        color: activeTab === tab.id ? '#ffffff' : '#475569',
                        padding: '0 4px',
                        borderRadius: '4px',
                        fontSize: '0.62rem'
                      }}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Notification Items List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
              {filteredNotifications.length === 0 ? (
                <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <Bell size={28} style={{ opacity: 0.35, margin: '0 auto 0.5rem' }} />
                  <div>No notifications in this category</div>
                </div>
              ) : (
                filteredNotifications.slice(0, 15).map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    style={{
                      padding: '0.75rem 0.85rem',
                      borderRadius: '10px',
                      marginBottom: '0.4rem',
                      background: n.is_read ? 'transparent' : '#fdf8fd',
                      border: n.is_read ? '1px solid #f1f5f9' : '1px solid #f3c7ec',
                      cursor: 'pointer',
                      display: 'flex',
                      gap: '0.75rem',
                      transition: 'all 0.15s ease',
                      position: 'relative'
                    }}
                  >
                    <div
                      style={{
                        marginTop: '2px',
                        padding: '0.35rem',
                        background: n.is_read ? '#f8fafc' : '#fdf2fb',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: 'fit-content'
                      }}
                    >
                      {getIcon(n.type, n.category)}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '0.825rem',
                          fontWeight: 700,
                          color: '#0f172a',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {n.title}
                        </span>
                        {!n.is_read && (
                          <span
                            style={{
                              fontSize: '0.62rem',
                              color: '#982A86',
                              fontWeight: 800,
                              background: '#fdf2fb',
                              padding: '1px 5px',
                              borderRadius: '4px',
                              flexShrink: 0
                            }}
                          >
                            NEW
                          </span>
                        )}
                      </div>

                      <div
                        style={{
                          fontSize: '0.76rem',
                          color: '#475569',
                          marginTop: '3px',
                          lineHeight: 1.35
                        }}
                      >
                        {n.message}
                      </div>

                      {/* Interactive In-Card Actions */}
                      {['TRANSFER_APPROVE', 'PURCHASE_APPROVE', 'RETURN_APPROVE'].includes(n.action_type) ? (
                        <div
                          style={{
                            marginTop: '0.55rem',
                            paddingTop: '0.45rem',
                            borderTop: '1px dashed #e2e8f0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '0.4rem'
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {n.action_status === 'APPROVED' ? (
                            <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <Check size={13} /> Approved
                            </span>
                          ) : n.action_status === 'REJECTED' ? (
                            <span style={{ fontSize: '0.72rem', color: '#ef4444', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <X size={13} /> Rejected
                            </span>
                          ) : n.action_status === 'PROCESSED' ? (
                            <span style={{ fontSize: '0.72rem', color: '#3b82f6', fontWeight: 700 }}>
                              Action Handled
                            </span>
                          ) : (
                            <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                              <button
                                onClick={(e) => handleExecuteAction(e, n, 'APPROVE')}
                                disabled={actionLoadingId === n.id}
                                style={{
                                  padding: '0.22rem 0.55rem',
                                  borderRadius: '5px',
                                  border: 'none',
                                  background: '#10b981',
                                  color: '#ffffff',
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '3px'
                                }}
                              >
                                {actionLoadingId === n.id ? (
                                  <RefreshCw size={11} className="spin" />
                                ) : (
                                  <Check size={12} />
                                )}
                                Approve
                              </button>

                              <button
                                onClick={(e) => handleExecuteAction(e, n, 'REJECT')}
                                disabled={actionLoadingId === n.id}
                                style={{
                                  padding: '0.22rem 0.55rem',
                                  borderRadius: '5px',
                                  border: '1px solid #cbd5e1',
                                  background: '#ffffff',
                                  color: '#64748b',
                                  fontSize: '0.7rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '3px'
                                }}
                              >
                                <X size={12} /> Reject
                              </button>
                            </div>
                          )}

                          <span
                            onClick={() => handleNotificationClick(n)}
                            style={{
                              color: 'var(--primary)',
                              fontWeight: 700,
                              fontSize: '0.7rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '2px'
                            }}
                          >
                            Details <ArrowRight size={11} />
                          </span>
                        </div>
                      ) : (n.category === 'STOCK' || n.type === 'LOW_STOCK' || n.type === 'OUT_OF_STOCK') ? (
                        <div
                          style={{
                            marginTop: '0.55rem',
                            paddingTop: '0.45rem',
                            borderTop: '1px dashed #e2e8f0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '0.4rem'
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => {
                              markAsRead(n.id);
                              setIsOpen(false);
                              navigate(n.action_id ? `/purchases?action=new&productId=${n.action_id}` : '/purchases?action=new');
                            }}
                            style={{
                              padding: '0.22rem 0.6rem',
                              borderRadius: '5px',
                              border: 'none',
                              background: '#f59e0b',
                              color: '#ffffff',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}
                          >
                            <ShoppingCart size={11} /> Reorder Stock
                          </button>

                          <span
                            onClick={() => handleNotificationClick(n)}
                            style={{
                              color: 'var(--primary)',
                              fontWeight: 700,
                              fontSize: '0.7rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '2px'
                            }}
                          >
                            View Stock <ArrowRight size={11} />
                          </span>
                        </div>
                      ) : null}

                      {/* Timestamp and Quick View Link */}
                      {!n.action_type && (
                        <div
                          style={{
                            fontSize: '0.675rem',
                            color: '#94a3b8',
                            marginTop: '5px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <span>
                            {new Date(n.created_at || n.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          <span style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.7rem' }}>
                            View details →
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Dropdown Footer */}
            <div
              style={{
                padding: '0.7rem 1rem',
                borderTop: '1px solid #f1f5f9',
                textAlign: 'center',
                background: '#fafbfc',
                borderBottomLeftRadius: '14px',
                borderBottomRightRadius: '14px'
              }}
            >
              <Link
                to={user?.isSuperAdmin ? '/admin/notifications' : '/notifications'}
                onClick={() => setIsOpen(false)}
                style={{
                  fontSize: '0.82rem',
                  color: 'var(--primary)',
                  fontWeight: 700,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                Open Notification Center <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

