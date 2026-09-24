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
  ShoppingCart,
  ShoppingBag,
  CreditCard,
  BarChart3,
  Users,
  Settings,
  Building,
  Bell,
  ChevronDown,
  ChevronRight,
  LogOut,
  ShieldCheck,
  Sparkles,
  Store,
  LifeBuoy,
  Terminal,
  Download,
  X
} from 'lucide-react';

export default function Sidebar({ isOpen = false, onClose }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const isSuper = user?.isSuperAdmin;
  const location = useLocation();

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
    return () => {
      clearInterval(interval);
      window.removeEventListener('stockpilot_tenants_changed', loadSidebarTenants);
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
        { label: 'Products & Catalog', to: '/products', icon: Package },
        { label: 'Live Stock & History', to: '/inventory', icon: Layers },
        { label: 'Warehouses & Transfers', to: '/warehouses', icon: Warehouse }
      ]
    },
    {
      group: 'E-Commerce & Sales',
      items: [
        { label: 'Online Store Builder', to: '/store-builder', icon: Store },
        { label: 'Sales & POS Invoicing', to: '/sales', icon: ShoppingBag },
        { label: 'Purchases & Suppliers', to: '/purchases', icon: ShoppingCart }
      ]
    },
    {
      group: 'Finance & BI',
      items: [
        { label: 'Payments & Expenses', to: '/finance', icon: CreditCard },
        { label: 'Reports & Analytics', to: '/reports', icon: BarChart3 }
      ]
    },
    {
      group: 'Management',
      items: [
        { label: 'Users & RBAC', to: '/users', icon: Users },
        { label: 'Notifications', to: '/notifications', icon: Bell },
        { label: 'Subscription & Plans', to: '/subscription', icon: Sparkles },
        { label: 'Company Settings', to: '/settings', icon: Settings },
        { label: 'Help & Support', to: '/support', icon: LifeBuoy }
      ]
    }
  ];

  const getFilteredNavItems = () => {
    if (userRole === 'STAFF') {
      return [
        {
          group: 'Operations',
          items: [
            { label: 'Sales & POS Invoicing', to: '/sales', icon: ShoppingBag }
          ]
        },
        {
          group: 'Catalog & Stock',
          items: [
            { label: 'Products & Catalog', to: '/products', icon: Package },
            { label: 'Live Stock & History', to: '/inventory', icon: Layers }
          ]
        },
        {
          group: 'Account',
          items: [
            { label: 'Notifications', to: '/notifications', icon: Bell }
          ]
        }
      ];
    }

    if (isBranchAdmin) {
      return [
        {
          group: 'Inventory & Hub Logistics',
          items: [
            { label: 'Live Stock & History', to: '/inventory', icon: Layers },
            { label: 'Warehouses & Transfers', to: '/warehouses', icon: Warehouse },
            { label: 'Products & Catalog', to: '/products', icon: Package }
          ]
        },
        {
          group: 'Operations & Invoicing',
          items: [
            { label: 'Purchases & Suppliers', to: '/purchases', icon: ShoppingCart },
            { label: 'Sales & POS Invoicing', to: '/sales', icon: ShoppingBag }
          ]
        },
        {
          group: 'Performance & Alerts',
          items: [
            { label: 'Reports & Analytics', to: '/reports', icon: BarChart3 },
            { label: 'Notifications', to: '/notifications', icon: Bell }
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
        className={`sidebar ${isOpen ? 'mobile-open' : ''}`}
        style={{
          width: '260px',
          background: 'linear-gradient(180deg, #982A86 0%, #761867 100%)',
          borderRight: '1px solid rgba(152, 42, 134, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          boxShadow: '2px 0 12px rgba(152, 42, 134, 0.12)'
        }}
      >
        {/* Brand Logo & Company Header */}
        <div
          style={{
            height: '75px',
            minHeight: '75px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 1.15rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
            background: 'rgba(0, 0, 0, 0.08)',
            flexShrink: 0
          }}
        >
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

          {/* Mobile Drawer Close Button */}
          <button
            onClick={onClose}
            className="sidebar-mobile-close-btn"
            title="Close navigation"
          >
            <X size={20} />
          </button>
        </div>

      {/* Nav List */}
      <div className="sidebar-nav-scroll">
        {isSuper ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <div
              style={{
                padding: '0.35rem 0.75rem',
                fontSize: '0.68rem',
                fontWeight: 700,
                color: 'rgba(255, 255, 255, 0.65)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em'
              }}
            >
              Platform Administration
            </div>

            {/* Link 1: Platform Dashboard */}
            <NavLink
              to="/admin"
              end
              onClick={handleNavClick}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <LayoutDashboard size={18} />
              <span>Platform Dashboard</span>
            </NavLink>

            {/* Link 2: Tenant Companies Dropdown Menu */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
              <div
                onClick={() => setIsTenantsOpen(!isTenantsOpen)}
                className={`sidebar-link ${isTenantActive ? 'active' : ''}`}
                style={{
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Building size={18} />
                  <span>Tenant Companies</span>
                </div>
                {isTenantsOpen ? (
                  <ChevronDown size={15} color={isTenantActive ? '#982A86' : 'rgba(255, 255, 255, 0.75)'} />
                ) : (
                  <ChevronRight size={15} color={isTenantActive ? '#982A86' : 'rgba(255, 255, 255, 0.75)'} />
                )}
              </div>

              {/* Submenu List */}
              {isTenantsOpen && (
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
                  {/* Directory Link */}
                  <NavLink
                    to="/admin/tenants"
                    end
                    onClick={handleNavClick}
                    className={({ isActive }) => `sidebar-submenu-link ${isActive ? 'active' : ''}`}
                  >
                    All Organizations
                  </NavLink>

                  {/* Individual Company Links */}
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
              <ShieldCheck size={18} />
              <span>Audit Logs & Trail</span>
            </NavLink>

            {/* Link 4: Notifications */}
            <NavLink
              to="/admin/notifications"
              onClick={handleNavClick}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Bell size={18} />
              <span>Notifications</span>
            </NavLink>

            {/* Link 5: Support Helpdesk */}
            <NavLink
              to="/admin/tickets"
              onClick={handleNavClick}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <LifeBuoy size={18} />
              <span>Support Helpdesk</span>
            </NavLink>

            {/* Link 6: Dev & Support Team */}
            <NavLink
              to="/admin/team"
              onClick={handleNavClick}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Users size={18} />
              <span>Dev &amp; Support Team</span>
            </NavLink>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            {/* Direct Dashboard Link */}
            <NavLink
              to="/dashboard"
              onClick={handleNavClick}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </NavLink>

            {/* Grouped links */}
            {getFilteredNavItems().map((grp, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span
                  style={{
                    padding: '0.25rem 0.75rem',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    color: 'rgba(255, 255, 255, 0.65)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em'
                  }}
                >
                  {grp.group}
                </span>
                {grp.items.map((item) => {
                  let badge = null;
                  if (item.to === '/notifications' && badgeCounts.notifications > 0) {
                    badge = { count: badgeCounts.notifications, bg: '#ef4444' };
                  } else if (item.to === '/purchases' && badgeCounts.purchases > 0) {
                    badge = { count: badgeCounts.purchases, bg: '#f59e0b' };
                  } else if (item.to === '/warehouses' && badgeCounts.transfers > 0) {
                    badge = { count: badgeCounts.transfers, bg: '#06b6d4' };
                  }

                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={handleNavClick}
                      className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                    >
                      <item.icon size={17} />
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', minWidth: 0 }}>
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>
                        {badge && (
                          <span
                            style={{
                              background: badge.bg,
                              color: '#ffffff',
                              fontSize: '0.65rem',
                              fontWeight: 800,
                              minWidth: '18px',
                              height: '18px',
                              borderRadius: '9999px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '0 5px',
                              marginLeft: 'auto',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                            }}
                          >
                            {badge.count}
                          </span>
                        )}
                      </span>
                    </NavLink>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sidebar Bottom Footer: Install App & Seamless High-Visibility Sign Out Button */}
      <div
        className="sidebar-bottom-footer"
        style={{
          padding: '0.85rem 1rem max(env(safe-area-inset-bottom, 0px), 0.85rem) 1rem',
          background: 'rgba(0, 0, 0, 0.22)',
          borderTop: '1px solid rgba(255, 255, 255, 0.16)',
          flexShrink: 0,
          marginTop: 'auto',
          position: 'sticky',
          bottom: 0,
          zIndex: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}
      >
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
            gap: '0.55rem',
            width: '100%',
            padding: '0.55rem 0.85rem',
            background: 'rgba(255, 255, 255, 0.18)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            color: '#ffffff',
            fontSize: '0.85rem',
            fontWeight: 700,
            borderRadius: '10px',
            cursor: 'pointer',
            letterSpacing: '0.01em',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
          aria-label="Install StockPilot App"
          type="button"
        >
          <Download size={16} />
          <span>Install App</span>
        </button>

        <button
          onClick={handleLogout}
          className="sidebar-logout-btn"
          aria-label="Logout"
          type="button"
        >
          <LogOut size={18} />
          <span style={{ fontWeight: 600, fontSize: '0.92rem' }}>Sign Out</span>
        </button>
      </div>
    </aside>
    </>
  );
}
