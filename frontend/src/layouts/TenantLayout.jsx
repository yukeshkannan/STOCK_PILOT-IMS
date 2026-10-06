import React, { useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import CopilotDrawer from '../components/copilot/CopilotDrawer';

export default function TenantLayout() {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();
  const isStoreBuilder = location.pathname.startsWith('/store-builder');

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.isSuperAdmin) {
    return <Navigate to="/admin" replace />;
  }

  // Guard: If user has not completed organization setup yet, block workspace/dashboard access
  if (!user.tenantId || user.isProfileCompleted === false) {
    return <Navigate to="/complete-profile" replace />;
  }

  return (
    <div className={`app-container ${isStoreBuilder ? 'is-store-builder-route' : ''}`}>
      <Sidebar isOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />
      <div className="main-content">
        <Navbar onMenuToggle={() => setMobileSidebarOpen(!mobileSidebarOpen)} />
        <main className="page-body">
          <Outlet />
        </main>
      </div>
      <CopilotDrawer />
    </div>
  );
}
