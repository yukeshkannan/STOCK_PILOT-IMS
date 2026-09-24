import React from 'react';
import { Outlet, useNavigate, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../app/authSlice';
import logoImg from '../assets/logo.png';
import { LogOut, Code, ShieldCheck } from 'lucide-react';
import './DeveloperLayout.css';

export default function DeveloperLayout() {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // If not authenticated, or not a developer/superadmin, redirect to developer login
  if (!isAuthenticated) {
    return <Navigate to="/dev/login" replace />;
  }

  const isDev = user?.isDeveloper || user?.roleName === 'DEVELOPER' || user?.isSuperAdmin;
  if (!isDev) {
    return <Navigate to="/dev/login" replace />;
  }

  const handleLogout = () => {
    dispatch(logout());
    navigate('/dev/login');
  };

  const devDisplayName = user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email || 'Engineer';
  const devRole = user?.developerRole || (user?.isSuperAdmin ? 'Platform SuperAdmin' : 'Core Developer');
  const devInitials = (user?.firstName ? user.firstName[0] : (user?.name ? user.name[0] : 'D')).toUpperCase();

  return (
    <div className="dev-layout">
      <header className="dev-topbar">
        <div className="dev-brand-container">
          <div className="dev-logo-mark">
            <img src={logoImg} alt="StockPilot" className="dev-brand-logo-img" />
          </div>
          <div className="dev-brand-info">
            <span className="dev-brand-text">StockPilot</span>
            <span className="dev-portal-tag">Developer Portal</span>
          </div>
        </div>

        <div className="dev-topbar-right">
          <div className="dev-user-card">
            <div className="dev-avatar">{devInitials}</div>
            <div className="dev-meta">
              <span className="dev-name">{devDisplayName}</span>
              <span className="dev-role-label">{devRole}</span>
            </div>
          </div>

          <button className="dev-logout-btn" onClick={handleLogout} title="Sign out of developer workspace">
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      <main className="dev-body">
        <Outlet />
      </main>
    </div>
  );
}
