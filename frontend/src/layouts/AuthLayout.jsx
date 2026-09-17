import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import BrandLogo from '../components/BrandLogo';

export default function AuthLayout() {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  if (isAuthenticated && user) {
    if (user.isSuperAdmin) return <Navigate to="/admin" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at 50% 20%, rgba(152, 42, 134, 0.10), transparent 70%), var(--bg-app)',
        padding: 'max(env(safe-area-inset-top, 0px), 1.5rem) 1.25rem max(env(safe-area-inset-bottom, 0px), 1.5rem) 1.25rem'
      }}
    >
      <div style={{ width: '100%', maxWidth: '460px' }}>
        {/* Brand Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.75rem', textAlign: 'center' }}>
          <BrandLogo size="lg" showSubtitle={false} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.5rem', fontWeight: 600 }}>
            Multi-Tenant Inventory & Business Operations SaaS
          </p>
        </div>

        <Outlet />
      </div>
    </div>
  );
}
