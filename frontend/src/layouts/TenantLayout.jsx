import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

export default function TenantLayout() {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

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
    <div className="app-container">
      <Sidebar isOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />
      <div className="main-content">
        <Navbar onMenuToggle={() => setMobileSidebarOpen(!mobileSidebarOpen)} />
        <main className="page-body">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
