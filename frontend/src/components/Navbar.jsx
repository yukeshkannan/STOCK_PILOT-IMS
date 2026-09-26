import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateProfile } from '../app/authSlice';
import api from '../services/api';
import NotificationDropdown from './NotificationDropdown';
import { Menu } from 'lucide-react';

export default function Navbar({ onMenuToggle }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const syncLivePlan = () => {
    if (user && !user.isSuperAdmin && user.tenantId) {
      api.get('/tenants/settings')
        .then((res) => {
          const livePlan = (res?.data?.plan || '').toString().trim().toUpperCase();
          const currentPlan = (user.plan || '').toString().trim().toUpperCase();
          if (livePlan && livePlan !== currentPlan) {
            dispatch(updateProfile({ plan: livePlan }));
          }
        })
        .catch(() => {});
    }
  };

  useEffect(() => {
    syncLivePlan();
    window.addEventListener('stockpilot_plan_changed', syncLivePlan);
    return () => {
      window.removeEventListener('stockpilot_plan_changed', syncLivePlan);
    };
  }, [user?.tenantId, user?.plan]);

  const getPlanBadgeConfig = () => {
    const rawPlan = (user?.plan || 'TRIAL').toString().trim().toUpperCase();
    if (rawPlan === 'TRIAL' || rawPlan === 'FREE_TRIAL') {
      return {
        label: '14-DAY FREE TRIAL',
        color: '#059669',
        bg: '#ecfdf5',
        border: '1px solid #a7f3d0'
      };
    }
    if (rawPlan === 'STARTER') {
      return {
        label: 'STARTER PLAN',
        color: '#2563eb',
        bg: '#eff6ff',
        border: '1px solid #bfdbfe'
      };
    }
    if (rawPlan === 'PRO' || rawPlan === 'PRO GROWTH' || rawPlan === 'GROWTH') {
      return {
        label: 'PRO GROWTH PLAN',
        color: '#982A86',
        bg: '#fdf4fc',
        border: '1px solid #f3c7ec'
      };
    }
    if (rawPlan === 'ENTERPRISE') {
      return {
        label: 'ENTERPRISE PLAN',
        color: '#d97706',
        bg: '#fffbeb',
        border: '1px solid #fde68a'
      };
    }
    return {
      label: `${rawPlan} PLAN`,
      color: '#982A86',
      bg: '#fdf4fc',
      border: '1px solid #f3c7ec'
    };
  };

  const planBadge = getPlanBadgeConfig();

  return (
    <header className="app-navbar-header">
      {/* Left: Mobile Menu Toggle & Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button
          onClick={onMenuToggle}
          className="mobile-sidebar-toggle-btn"
          aria-label="Toggle navigation menu"
        >
          <Menu size={22} />
        </button>

        <span className="navbar-workspace-title">
          {user?.isSuperAdmin ? 'Super Admin' : (user?.companyName || 'StockPilot Workspace')}
        </span>

        {!user?.isSuperAdmin && (
          <span className="navbar-plan-badge" style={{ color: planBadge.color, background: planBadge.bg, border: planBadge.border }}>
            {planBadge.label}
          </span>
        )}
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        {/* Notifications Dropdown (Tenant Workspace Users Only) */}
        {!user?.isSuperAdmin && <NotificationDropdown />}

        {/* User Identity Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div className="navbar-user-identity" style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
            <span className="navbar-user-name" style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.isSuperAdmin
                ? 'Super Admin'
                : user?.firstName
                ? `${user.firstName} ${user.lastName || ''}`.trim()
                : (user?.email || 'User')}
            </span>
            <span className="navbar-user-role" style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.isSuperAdmin
                ? 'System Administrator'
                : user?.roleName === 'ADMIN'
                ? (user?.warehouseName ? `Admin (${user.warehouseName})` : 'Admin')
                : user?.roleName === 'STAFF'
                ? 'Staff / POS'
                : (user?.roleName || 'User')}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}


