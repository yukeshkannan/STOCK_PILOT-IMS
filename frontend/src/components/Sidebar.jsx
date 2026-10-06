import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../app/authSlice';
import api from '../services/api';
import logoImg from '../assets/logo.png';
import {
  LayoutDashboard,
  Package,
  Layers,
  Warehouse,
  Truck,
  ShoppingBag,
  CreditCard,
  BarChart3,
  Users,
  Settings,
  Building,
  Bell,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  LogOut,
  ShieldCheck,
  Sparkles,
  Store,
  LifeBuoy,
  Download,
  PanelLeftClose,
  PanelLeftOpen,
  X
} from 'lucide-react';

export default function Sidebar({ isOpen = false, onClose }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const isSuper = user?.isSuperAdmin;
  const location = useLocation();

  const isStoreBuilderRoute = location.pathname.startsWith('/store-builder');

  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      if (window.location.pathname.startsWith('/store-builder')) return true;
      const saved = localStorage.getItem('stockpilot_sidebar_collapsed');
      return saved !== null ? JSON.parse(saved) : false;
    }
    return false;
  });

  // Auto-collapse when navigating to Storefront Builder
  useEffect(() => {
    if (isStoreBuilderRoute) {
      setIsCollapsed(true);
    }
  }, [isStoreBuilderRoute]);

  // Sync collapsed class to document.body for global CSS width adjustments
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (isCollapsed) {
        document.body.classList.add('sidebar-is-collapsed');
      } else {
        document.body.classList.remove('sidebar-is-collapsed');
      }
    }
    try {
      localStorage.setItem('stockpilot_sidebar_collapsed', JSON.stringify(isCollapsed));
    } catch {
      // ignore
    }
  }, [isCollapsed]);

  const handleLogout = () => {
    if (onClose) onClose();
    dispatch(logout());
    navigate('/login');
  };

  const handleNavClick = () => {
    if (onClose) {
      onClose();
    }
  };

  const [isTenantsOpen, setIsTenantsOpen] = useState(true);
  const [tenants, setTenants] = useState([]);
  const [superAdminTicketCount, setSuperAdminTicketCount] = useState(0);
  const [badgeCounts, setBadgeCounts] = useState({
    purchases: 0,
    notifications: 0,
    transfers: 0
  });

  const loadSidebarTenants = () => {
    if (isSuper) {
      api.get('/admin/tenants')
        .then((res) => {
          if (res?.data && Array.isArray(res.data)) {
            setTenants(res.data);
          } else {
            setTenants([]);
          }
        })
        .catch(() => {
          setTenants([]);
        });
    }
  };

  const syncSuperAdminTicketCount = async () => {
    if (!isSuper) return;
    try {
      const res = await api.get('/admin/tickets/stats');
      const statsData = res?.data || res;
      if (statsData && typeof statsData === 'object') {
        const count = Number(statsData.open) || 0;
        setSuperAdminTicketCount(count);
      }
    } catch {
      // ignore
    }
  };

  const syncBadgeCounts = async () => {
    if (!user || isSuper) return;
    try {
      const perms = Array.isArray(user?.permissions) ? user.permissions : [];
      const currentRole = (user?.roleName || user?.role || 'ADMIN').toUpperCase();
      const isPrivileged = currentRole === 'ADMIN' || currentRole === 'MANAGER' || isSuper;
      const canViewPurchases = isPrivileged || perms.includes('purchases:view') || perms.includes('purchases:manage');
      const canViewTransfers = isPrivileged || perms.includes('inventory:transfer') || perms.includes('warehouses:view');

      const [notifRes, poRes, retRes, trfRes] = await Promise.all([
        api.get('/notifications').catch(() => ({ data: {} })),
        canViewPurchases ? api.get('/purchases').catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
        canViewPurchases ? api.get('/purchase-returns').catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
        canViewTransfers ? api.get('/transfers').catch(() => ({ data: [] })) : Promise.resolve({ data: [] })
      ]);

      const unreadNotifs = notifRes?.data?.unreadCount || 0;
      const pendingPOs = (poRes?.data || []).filter((p) => p.status === 'PENDING_APPROVAL' || p.status === 'DRAFT').length;
      const pendingReturns = (retRes?.data || []).filter((r) => !r.status || r.status === 'PENDING_APPROVAL').length;
      const pendingTransfers = (trfRes?.data || []).filter((t) => t.status === 'PENDING' || t.status === 'IN_TRANSIT').length;

      setBadgeCounts({
        notifications: unreadNotifs,
        purchases: pendingPOs + pendingReturns,
        transfers: pendingTransfers
      });
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadSidebarTenants();
    syncBadgeCounts();
    const interval = setInterval(syncBadgeCounts, 20000);
    window.addEventListener('stockpilot_tenants_changed', loadSidebarTenants);

    let ticketInterval = null;
    let bc = null;
    const handleTicketSync = () => syncSuperAdminTicketCount();
    const handleStorage = (e) => {
      if (e.key === 'stockpilot_helpdesk_ping') {
        syncSuperAdminTicketCount();
      }
    };

    if (isSuper) {
      syncSuperAdminTicketCount();
      ticketInterval = setInterval(syncSuperAdminTicketCount, 5000);
      window.addEventListener('stockpilot_ticket_created', handleTicketSync);
      window.addEventListener('stockpilot_ticket_updated', handleTicketSync);
      window.addEventListener('stockpilot_tickets_changed', handleTicketSync);
      window.addEventListener('storage', handleStorage);

      try {
        if (typeof BroadcastChannel !== 'undefined') {
          bc = new BroadcastChannel('stockpilot_helpdesk_channel');
          bc.onmessage = () => {
            syncSuperAdminTicketCount();
          };
        }
      } catch {
        // ignore
      }
    }

    return () => {
      clearInterval(interval);
      if (ticketInterval) clearInterval(ticketInterval);
      window.removeEventListener('stockpilot_tenants_changed', loadSidebarTenants);
      window.removeEventListener('stockpilot_ticket_created', handleTicketSync);
      window.removeEventListener('stockpilot_ticket_updated', handleTicketSync);
      window.removeEventListener('stockpilot_tickets_changed', handleTicketSync);
      window.removeEventListener('storage', handleStorage);
      if (bc) {
        try {
          bc.close();
        } catch {
          // ignore
        }
      }
    };
  }, [isSuper, location.pathname]);

  // Auto-close mobile drawer whenever route changes
  useEffect(() => {
    if (isOpen && onClose) {
      onClose();
    }
  }, [location.pathname]);

  const userRole = (user?.roleName || user?.role || 'ADMIN').toUpperCase();
  const assignedWhId = user?.warehouseId || user?.warehouse_id ? String(user.warehouseId || user.warehouse_id) : null;
  const isGlobalAdmin = Boolean(isSuper) || (userRole === 'ADMIN' && !assignedWhId);
  const isBranchScoped = Boolean(assignedWhId) && !isGlobalAdmin;
  const isBranchAdmin = userRole === 'ADMIN' && isBranchScoped;

  const allNavItems = [
    {
      group: 'Inventory & Catalog',
      items: [
        {
          label: 'Products & Catalog',
          to: '/products',
          icon: Package,
          desc: 'Manage SKUs, variants, prices & barcodes'
        },
        {
          label: 'Live Stock & History',
          to: '/inventory',
          icon: Layers,
          desc: 'Monitor real-time stock levels & batch logs'
        },
        {
          label: 'Warehouses & Transfers',
          to: '/warehouses',
          icon: Warehouse,
          desc: 'Multi-location storage & internal dispatches'
        }
      ]
    },
    {
      group: 'E-Commerce & Sales',
      items: [
        {
          label: 'Online Store Builder',
          to: '/store-builder',
          icon: Store,
          desc: 'Visual drag & drop storefront designer'
        },
        {
          label: 'Sales & POS Invoicing',
          to: '/sales',
          icon: ShoppingBag,
          desc: 'Counter sales, GST tax invoices & POS checkout'
        },
        {
          label: 'Purchases & Suppliers',
          to: '/purchases',
          icon: Truck,
          desc: 'Vendor purchase orders & incoming shipments'
        }
      ]
    },
    {
      group: 'Finance & BI',
      items: [
        {
          label: 'Payments & Expenses',
          to: '/finance',
          icon: CreditCard,
          desc: 'Cashflow ledger, expenses & revenue accounts'
        },
        {
          label: 'Reports & Analytics',
          to: '/reports',
          icon: BarChart3,
          desc: 'Sales intelligence, profit graphs & exports'
        }
      ]
    },
    {
      group: 'Management',
      items: [
        {
          label: 'Users & RBAC',
          to: '/users',
          icon: Users,
          desc: 'Team members & role-based permissions'
        },
        {
          label: 'Notifications',
          to: '/notifications',
          icon: Bell,
          desc: 'Live stock warnings & business alerts'
        },
        {
          label: 'Subscription & Plans',
          to: '/subscription',
          icon: Sparkles,
          desc: 'Cloud subscription plan & quota usage'
        },
        {
          label: 'Company Settings',
          to: '/settings',
          icon: Settings,
          desc: 'Organization details, GST settings & rules'
        },
        {
          label: 'Help & Support',
          to: '/support',
          icon: LifeBuoy,
          desc: 'Contact platform support & developer helpdesk'
        }
      ]
    }
  ];

  const getFilteredNavItems = () => {
    if (userRole === 'STAFF') {
      return [
        {
          group: 'Operations',
          items: [
            {
              label: 'Sales & POS Invoicing',
              to: '/sales',
              icon: ShoppingBag,
              desc: 'Counter sales, GST tax invoices & POS checkout'
            }
          ]
        },
        {
          group: 'Catalog & Stock',
          items: [
            {
              label: 'Products & Catalog',
              to: '/products',
              icon: Package,
              desc: 'Manage SKUs, variants, prices & barcodes'
            },
            {
              label: 'Live Stock & History',
              to: '/inventory',
              icon: Layers,
              desc: 'Monitor real-time stock levels & batch logs'
            }
          ]
        },
        {
          group: 'Account',
          items: [
            {
              label: 'Notifications',
              to: '/notifications',
              icon: Bell,
              desc: 'Live stock warnings & business alerts'
            }
          ]
        }
      ];
    }

    if (isBranchAdmin) {
      return [
        {
          group: 'Inventory & Hub Logistics',
          items: [
            {
              label: 'Live Stock & History',
              to: '/inventory',
              icon: Layers,
              desc: 'Monitor real-time stock levels & batch logs'
            },
            {
              label: 'Warehouses & Transfers',
              to: '/warehouses',
              icon: Warehouse,
              desc: 'Multi-location storage & internal dispatches'
            },
            {
              label: 'Products & Catalog',
              to: '/products',
              icon: Package,
              desc: 'Manage SKUs, variants, prices & barcodes'
            }
          ]
        },
        {
          group: 'Operations & Invoicing',
          items: [
            {
              label: 'Purchases & Suppliers',
              to: '/purchases',
              icon: Truck,
              desc: 'Vendor purchase orders & incoming shipments'
            },
            {
              label: 'Sales & POS Invoicing',
              to: '/sales',
              icon: ShoppingBag,
              desc: 'Counter sales, GST tax invoices & POS checkout'
            }
          ]
        },
        {
          group: 'Performance & Alerts',
          items: [
            {
              label: 'Reports & Analytics',
              to: '/reports',
              icon: BarChart3,
              desc: 'Sales intelligence, profit graphs & exports'
            },
            {
              label: 'Notifications',
              to: '/notifications',
              icon: Bell,
              desc: 'Live stock warnings & business alerts'
            }
          ]
        }
      ];
    }

    return allNavItems;
  };

  const isTenantActive = location.pathname.startsWith('/admin/tenants');

  return (
    <>
      {isOpen && (
        <div
          className="sidebar-mobile-backdrop"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`sidebar ${isCollapsed ? 'is-collapsed' : ''} ${isOpen ? 'mobile-open' : ''}`}
        style={{
          width: isCollapsed ? '72px' : '260px',
          background: 'linear-gradient(180deg, #982A86 0%, #761867 100%)',
          borderRight: '1px solid rgba(152, 42, 134, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          boxShadow: '2px 0 12px rgba(152, 42, 134, 0.12)',
          transition: 'width 0.22s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {/* Brand Logo & Company Header */}
        <div
          style={{
            height: '75px',
            minHeight: '75px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'space-between',
            padding: isCollapsed ? '0 0.5rem' : '0 1.15rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
            background: 'rgba(0, 0, 0, 0.08)',
            flexShrink: 0,
            position: 'relative'
          }}
        >
          {isCollapsed ? (
            <div
              className="sidebar-collapsed-brand-box"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                position: 'relative'
              }}
              onClick={() => setIsCollapsed(false)}
              title="Click to expand sidebar"
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '3px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.35)'
                }}
              >
                <img
                  src={logoImg}
                  alt="StockPilot"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </div>

              {/* Flyout Tooltip on Logo */}
              <div className="sidebar-tooltip-flyout">
                <div className="sidebar-tooltip-header">
                  <span className="sidebar-tooltip-title">
                    {isSuper ? 'StockPilot Admin' : (user?.companyName || 'StockPilot')}
                  </span>
                </div>
                <div className="sidebar-tooltip-desc">
                  {isSuper ? 'Platform Super Admin Access' : `${userRole} Access • Click to expand navigation`}
                </div>
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: 1, minWidth: 0 }}>
                {/* StockPilot Logo */}
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '3px',
                    flexShrink: 0,
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.35)'
                  }}
                >
                  <img
                    src={logoImg}
                    alt="StockPilot"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                </div>

                {/* Company Name */}
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
                  <span
                    style={{
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '1.05rem',
                      letterSpacing: '0.01em',
                      lineHeight: 1.2,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      textTransform: 'uppercase'
                    }}
                    title={isSuper ? 'StockPilot Admin' : (user?.companyName || 'StockPilot')}
                  >
                    {isSuper ? 'StockPilot' : (user?.companyName || 'My Company')}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '2px', overflow: 'hidden' }}>
                    <span
                      style={{
                        fontSize: '0.66rem',
                        fontWeight: 700,
                        color: 'rgba(255, 255, 255, 0.78)',
                        letterSpacing: '0.03em',
                        textTransform: 'uppercase',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {isSuper
                        ? 'Platform Admin'
                        : Boolean(user?.warehouseName || user?.warehouse_name)
                          ? `${user?.warehouseName || user?.warehouse_name}`
                          : `${userRole} Access`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Collapse Icon Button on Desktop */}
              <button
                type="button"
                onClick={() => setIsCollapsed(true)}
                className="sidebar-collapse-toggle-btn"
                title="Collapse sidebar to icon rail"
              >
                <ChevronLeft size={17} />
              </button>

              {/* Mobile Drawer Close Button */}
              <button
                onClick={onClose}
                className="sidebar-mobile-close-btn"
                title="Close navigation"
              >
                <X size={20} />
              </button>
            </>
          )}
        </div>

        {/* Nav List */}
        <div className="sidebar-nav-scroll">
          {isSuper ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', width: '100%' }}>
              {!isCollapsed && (
                <div className="sidebar-group-label">
                  Platform Administration
                </div>
              )}

              {/* Link 1: Platform Dashboard */}
              <NavLink
                to="/admin"
                end
                onClick={handleNavClick}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                <LayoutDashboard size={isCollapsed ? 20 : 18} />
                {!isCollapsed && <span>Platform Dashboard</span>}
                <div className="sidebar-tooltip-flyout">
                  <div className="sidebar-tooltip-header">
                    <span className="sidebar-tooltip-title">Platform Dashboard</span>
                  </div>
                  <div className="sidebar-tooltip-desc">Global platform overview, tenant KPIs & health</div>
                </div>
              </NavLink>

              {/* Link 2: Tenant Companies Dropdown Menu */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                <div
                  onClick={() => {
                    if (isCollapsed) {
                      navigate('/admin/tenants');
                    } else {
                      setIsTenantsOpen(!isTenantsOpen);
                    }
                  }}
                  className={`sidebar-link ${isTenantActive ? 'active' : ''}`}
                  style={{
                    justifyContent: isCollapsed ? 'center' : 'space-between',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Building size={isCollapsed ? 20 : 18} />
                    {!isCollapsed && <span>Tenant Companies</span>}
                  </div>
                  {!isCollapsed && (
                    isTenantsOpen ? (
                      <ChevronDown size={15} color={isTenantActive ? '#982A86' : 'rgba(255, 255, 255, 0.75)'} />
                    ) : (
                      <ChevronRight size={15} color={isTenantActive ? '#982A86' : 'rgba(255, 255, 255, 0.75)'} />
                    )
                  )}
                  <div className="sidebar-tooltip-flyout">
                    <div className="sidebar-tooltip-header">
                      <span className="sidebar-tooltip-title">Tenant Companies</span>
                    </div>
                    <div className="sidebar-tooltip-desc">Manage onboarded organizations, databases & plans</div>
                  </div>
                </div>

                {/* Submenu List when not collapsed */}
                {!isCollapsed && isTenantsOpen && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.2rem',
                      paddingLeft: '0.75rem',
                      marginTop: '0.25rem',
                      borderLeft: '2px solid rgba(255, 255, 255, 0.25)',
                      marginLeft: '1.2rem'
                    }}
                  >
                    <NavLink
                      to="/admin/tenants"
                      end
                      onClick={handleNavClick}
                      className={({ isActive }) => `sidebar-submenu-link ${isActive ? 'active' : ''}`}
                    >
                      All Organizations
                    </NavLink>

                    {tenants.map((comp) => (
                      <NavLink
                        key={comp.id}
                        to={`/admin/tenants/${comp.id}`}
                        onClick={handleNavClick}
                        className={({ isActive }) => `sidebar-submenu-link ${isActive ? 'active' : ''}`}
                      >
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px' }}>
                          {comp.company_name}
                        </span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>

              {/* Link 3: Audit Logs & Security */}
              <NavLink
                to="/admin/audit"
                onClick={handleNavClick}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                <ShieldCheck size={isCollapsed ? 20 : 18} />
                {!isCollapsed && <span>Audit Logs &amp; Trail</span>}
                <div className="sidebar-tooltip-flyout">
                  <div className="sidebar-tooltip-header">
                    <span className="sidebar-tooltip-title">Audit Logs &amp; Trail</span>
                  </div>
                  <div className="sidebar-tooltip-desc">Security compliance logs & operational history</div>
                </div>
              </NavLink>

              {/* Link 4: Support Helpdesk */}
              <NavLink
                to="/admin/tickets"
                onClick={handleNavClick}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                <LifeBuoy size={isCollapsed ? 20 : 18} />
                {!isCollapsed && (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', minWidth: 0 }}>
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Support Helpdesk</span>
                    {superAdminTicketCount > 0 && (
                      <span
                        className="sidebar-whatsapp-badge"
                        title={`${superAdminTicketCount} open support tickets`}
                      >
                        {superAdminTicketCount > 99 ? '99+' : superAdminTicketCount}
                      </span>
                    )}
                  </span>
                )}
                <div className="sidebar-tooltip-flyout">
                  <div className="sidebar-tooltip-header">
                    <span className="sidebar-tooltip-title">Support Helpdesk</span>
                    {superAdminTicketCount > 0 && (
                      <span className="sidebar-nav-badge danger">{superAdminTicketCount}</span>
                    )}
                  </div>
                  <div className="sidebar-tooltip-desc">Resolve tenant tickets & send internal developer notes</div>
                </div>
              </NavLink>

              {/* Link 5: Dev & Support Team */}
              <NavLink
                to="/admin/team"
                onClick={handleNavClick}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                <Users size={isCollapsed ? 20 : 18} />
                {!isCollapsed && <span>Dev &amp; Support Team</span>}
                <div className="sidebar-tooltip-flyout">
                  <div className="sidebar-tooltip-header">
                    <span className="sidebar-tooltip-title">Dev &amp; Support Team</span>
                  </div>
                  <div className="sidebar-tooltip-desc">Manage support engineers & dev assignment pool</div>
                </div>
              </NavLink>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: isCollapsed ? '0.65rem' : '1.15rem', width: '100%' }}>
              {/* Direct Dashboard Link */}
              <NavLink
                to="/dashboard"
                onClick={handleNavClick}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                <LayoutDashboard size={isCollapsed ? 20 : 18} />
                {!isCollapsed && <span>Dashboard</span>}
                <div className="sidebar-tooltip-flyout">
                  <div className="sidebar-tooltip-header">
                    <span className="sidebar-tooltip-title">Dashboard</span>
                  </div>
                  <div className="sidebar-tooltip-desc">Central KPIs, sales summaries & real-time inventory health</div>
                </div>
              </NavLink>

              {/* Grouped links */}
              {getFilteredNavItems().map((grp, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {!isCollapsed && (
                    <span className="sidebar-group-label">
                      {grp.group}
                    </span>
                  )}
                  {grp.items.map((item) => {
                    let badge = null;
                    if (item.to === '/notifications' && badgeCounts.notifications > 0) {
                      badge = { count: badgeCounts.notifications > 99 ? '99+' : badgeCounts.notifications, variant: 'danger' };
                    } else if (item.to === '/purchases' && badgeCounts.purchases > 0) {
                      badge = { count: badgeCounts.purchases > 99 ? '99+' : badgeCounts.purchases, variant: 'warning' };
                    } else if (item.to === '/warehouses' && badgeCounts.transfers > 0) {
                      badge = { count: badgeCounts.transfers > 99 ? '99+' : badgeCounts.transfers, variant: 'info' };
                    }

                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={handleNavClick}
                        className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                      >
                        <item.icon size={isCollapsed ? 20 : 17} />
                        {!isCollapsed && (
                          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', minWidth: 0 }}>
                            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>
                            {badge && (
                              <span className={`sidebar-nav-badge ${badge.variant}`}>
                                {badge.count}
                              </span>
                            )}
                          </span>
                        )}

                        {/* Rich Hover Tooltip with Option Title & Admin Description */}
                        <div className="sidebar-tooltip-flyout">
                          <div className="sidebar-tooltip-header">
                            <span className="sidebar-tooltip-title">{item.label}</span>
                            {badge && (
                              <span className={`sidebar-nav-badge ${badge.variant}`}>
                                {badge.count}
                              </span>
                            )}
                          </div>
                          <div className="sidebar-tooltip-desc">{item.desc}</div>
                        </div>
                      </NavLink>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar Bottom Footer: Install App & High-Visibility Sign Out Button */}
        <div
          className="sidebar-bottom-footer"
          style={{
            padding: isCollapsed ? '0.75rem 0.45rem max(env(safe-area-inset-bottom, 0px), 0.75rem) 0.45rem' : '0.85rem 1rem max(env(safe-area-inset-bottom, 0px), 0.85rem) 1rem',
            background: 'rgba(0, 0, 0, 0.22)',
            borderTop: '1px solid rgba(255, 255, 255, 0.16)',
            flexShrink: 0,
            marginTop: 'auto',
            position: 'sticky',
            bottom: 0,
            zIndex: 20,
            display: 'flex',
            flexDirection: 'column',
            alignItems: isCollapsed ? 'center' : 'stretch',
            gap: '0.45rem'
          }}
        >
          {/* Expand Rail Button if Collapsed */}
          {isCollapsed && (
            <button
              onClick={() => setIsCollapsed(false)}
              className="sidebar-rail-expand-btn"
              title="Expand Navigation (Full View)"
              type="button"
            >
              <ChevronRight size={18} />
              <div className="sidebar-tooltip-flyout">
                <div className="sidebar-tooltip-header">
                  <span className="sidebar-tooltip-title">Expand Sidebar</span>
                </div>
                <div className="sidebar-tooltip-desc">Show full labels and navigation groups</div>
              </div>
            </button>
          )}

          <button
            onClick={() => {
              if (onClose) onClose();
              window.dispatchEvent(new CustomEvent('open_pwa_install'));
            }}
            className="sidebar-install-pwa-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: isCollapsed ? '0' : '0.55rem',
              width: '100%',
              padding: isCollapsed ? '0.6rem' : '0.55rem 0.85rem',
              background: 'rgba(255, 255, 255, 0.18)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: '#ffffff',
              fontSize: '0.85rem',
              fontWeight: 700,
              borderRadius: '10px',
              cursor: 'pointer',
              letterSpacing: '0.01em',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative'
            }}
            aria-label="Install StockPilot App"
            type="button"
          >
            <Download size={17} />
            {!isCollapsed && <span>Install App</span>}
            <div className="sidebar-tooltip-flyout">
              <div className="sidebar-tooltip-header">
                <span className="sidebar-tooltip-title">Install App</span>
              </div>
              <div className="sidebar-tooltip-desc">Install high-speed desktop &amp; mobile PWA app</div>
            </div>
          </button>

          <button
            onClick={handleLogout}
            className="sidebar-logout-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: isCollapsed ? '0' : '0.55rem',
              width: '100%',
              padding: isCollapsed ? '0.6rem' : '0.55rem 0.85rem',
              position: 'relative'
            }}
            aria-label="Logout"
            type="button"
          >
            <LogOut size={18} />
            {!isCollapsed && <span style={{ fontWeight: 600, fontSize: '0.92rem' }}>Sign Out</span>}
            <div className="sidebar-tooltip-flyout">
              <div className="sidebar-tooltip-header">
                <span className="sidebar-tooltip-title">Sign Out</span>
              </div>
              <div className="sidebar-tooltip-desc">Terminate your organization session securely</div>
            </div>
          </button>
        </div>
      </aside>
    </>
  );
}
