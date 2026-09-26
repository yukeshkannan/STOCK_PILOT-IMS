import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { updateProfile } from '../app/authSlice';
import api from '../services/api';
import NotificationDropdown from './NotificationDropdown';
import { Menu, Clock } from 'lucide-react';

export default function Navbar({ onMenuToggle }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const syncLivePlan = () => {
    if (user && !user.isSuperAdmin && user.tenantId) {
      api.get('/tenants/settings')
        .then((res) => {
          const livePlan = (res?.data?.plan || '').toString().trim().toUpperCase();
          const currentPlan = (user.plan || '').toString().trim().toUpperCase();
          const liveCreatedAt = res?.data?.createdAt;
          const updates = {};
          if (livePlan && livePlan !== currentPlan) {
            updates.plan = livePlan;
          }
          if (liveCreatedAt && user.tenantCreatedAt !== liveCreatedAt) {
            updates.tenantCreatedAt = liveCreatedAt;
          }
          if (Object.keys(updates).length > 0) {
            dispatch(updateProfile(updates));
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

  // Calculate 14-Day Free Trial remaining Days + Hours
  const getTrialRemaining = () => {
    const rawDate = user?.tenantCreatedAt || user?.createdAt;
    let startDate;
    if (rawDate) {
      startDate = new Date(rawDate);
    } else {
      const storageKey = `stockpilot_trial_start_${user?.tenantId || user?.id || 'org'}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        startDate = new Date(saved);
      } else {
        startDate = new Date();
        localStorage.setItem(storageKey, startDate.toISOString());
      }
    }

    if (isNaN(startDate.getTime())) {
      startDate = new Date();
    }

    const TRIAL_MS = 14 * 24 * 60 * 60 * 1000;
    const endDate = new Date(startDate.getTime() + TRIAL_MS);
    const now = new Date();
    const remainingMs = endDate.getTime() - now.getTime();

    if (remainingMs <= 0) {
      return { days: 0, hours: 0, isExpired: true, text: 'Trial Expired' };
    }

    const totalHours = Math.floor(remainingMs / (1000 * 60 * 60));
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;

    return {
      days,
      hours,
      isExpired: false,
      text: `${days}d ${hours}h Trial`
    };
  };

  const [trialTime, setTrialTime] = useState(() => getTrialRemaining());

  useEffect(() => {
    setTrialTime(getTrialRemaining());
    const interval = setInterval(() => {
      setTrialTime(getTrialRemaining());
    }, 60000);
    return () => clearInterval(interval);
  }, [user?.tenantCreatedAt, user?.createdAt, user?.tenantId]);

  const rawPlan = (user?.plan || 'TRIAL').toString().trim().toUpperCase();
  const isTrial = rawPlan === 'TRIAL' || rawPlan === 'FREE_TRIAL';

  const getPlanBadgeConfig = () => {
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
          isTrial ? (
            <Link
              to="/subscription"
              className="navbar-trial-pill"
              title={`${trialTime.days} days and ${trialTime.hours} hours remaining in your 14-day free trial. Click to view subscription plans.`}
            >
              <Clock size={12} strokeWidth={2.5} className="trial-pill-icon" />
              <span className="trial-pill-text">{trialTime.text}</span>
            </Link>
          ) : (
            <span className="navbar-plan-badge" style={{ color: planBadge.color, background: planBadge.bg, border: planBadge.border }}>
              {planBadge.label}
            </span>
          )
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


