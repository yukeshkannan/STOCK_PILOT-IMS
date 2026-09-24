import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Layouts
import AuthLayout from './layouts/AuthLayout';
import TenantLayout from './layouts/TenantLayout';
import SuperAdminLayout from './layouts/SuperAdminLayout';

// Pages
import LoginPage from './modules/auth/LoginPage';
import RegisterPage from './modules/auth/RegisterPage';
import CompleteProfilePage from './modules/auth/CompleteProfilePage';
import SuperAdminLoginPage from './modules/auth/SuperAdminLoginPage';
import DashboardPage from './modules/dashboard/DashboardPage';
import ProductsPage from './modules/products/ProductsPage';
import InventoryPage from './modules/inventory/InventoryPage';
import WarehousesPage from './modules/warehouses/WarehousesPage';
import PurchasesPage from './modules/purchases/PurchasesPage';
import SalesPage from './modules/sales/SalesPage';
import NewSalePage from './modules/sales/NewSalePage';
import FinancePage from './modules/finance/FinancePage';
import ReportsPage from './modules/reports/ReportsPage';
import NotificationsPage from './modules/notifications/NotificationsPage';
import UsersPage from './modules/users/UsersPage';
import SettingsPage from './modules/settings/SettingsPage';
import SubscriptionPage from './modules/subscription/SubscriptionPage';
import PublicInvoicePage from './modules/sales/PublicInvoicePage';
import PublicStorePage from './modules/store/PublicStorePage';
import StorefrontBuilderPage from './modules/store/StorefrontBuilderPage';
import SuperAdminDashboard from './modules/superadmin/SuperAdminDashboard';
import SuperAdminTenants from './modules/superadmin/SuperAdminTenants';
import TenantDetailsPage from './modules/superadmin/TenantDetailsPage';
import SuperAdminAuditLogs from './modules/superadmin/SuperAdminAuditLogs';
import SuperAdminTicketsPage from './modules/superadmin/SuperAdminTicketsPage';
import SuperAdminTeamPage from './modules/superadmin/SuperAdminTeamPage';
import DeveloperWorkspacePage from './modules/developer/DeveloperWorkspacePage';
import TenantSupportPage from './modules/support/TenantSupportPage';
import LandingPage from './modules/landing/LandingPage';
import MobileAppBanner from './components/MobileAppBanner';
import Preloader from './components/Preloader';

import DeveloperLoginPage from './modules/auth/DeveloperLoginPage';
import DeveloperLayout from './components/DeveloperLayout';

export default function App() {
  const { mode } = useSelector((state) => state.theme);
  const [initialLoading, setInitialLoading] = React.useState(true);
  const [isFadingOut, setIsFadingOut] = React.useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  // Snappy 1.1s optical telemetry showcase + 0.25s fadeout
  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 1100);

    const closeTimer = setTimeout(() => {
      setInitialLoading(false);
    }, 1350);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(closeTimer);
    };
  }, []);

  return (
    <BrowserRouter>
      {initialLoading && (
        <Preloader
          isFullScreen={true}
          message="Initializing Workspace"
          fadeOut={isFadingOut}
        />
      )}
      <MobileAppBanner />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
      <Routes>
        {/* Public Tenant Mini E-Commerce Storefront */}
        <Route path="/store/:companyCode" element={<PublicStorePage />} />

        {/* Public Customer E-Bill & PDF Viewer (Zudio-style) */}
        <Route path="/e-bill/:invoiceNumber" element={<PublicInvoicePage />} />

        {/* Auth Public Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/admin/login" element={<SuperAdminLoginPage />} />
        </Route>
        <Route path="/complete-profile" element={<CompleteProfilePage />} />

        {/* Dedicated Independent Developer Login */}
        <Route path="/dev/login" element={<DeveloperLoginPage />} />

        {/* Developer Dedicated Protected Workspace */}
        <Route element={<DeveloperLayout />}>
          <Route path="/dev/workspace" element={<DeveloperWorkspacePage />} />
          <Route path="/dev" element={<Navigate to="/dev/workspace" replace />} />
        </Route>

        {/* Tenant Protected Routes */}
        <Route element={<TenantLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/warehouses" element={<WarehousesPage />} />
          <Route path="/purchases" element={<PurchasesPage />} />
          <Route path="/purchases/new" element={<Navigate to="/purchases?action=new" replace />} />
          <Route path="/sales" element={<SalesPage />} />
          <Route path="/sales/new" element={<NewSalePage />} />
          <Route path="/store-builder" element={<StorefrontBuilderPage />} />
          <Route path="/finance" element={<FinancePage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/subscription" element={<SubscriptionPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/support" element={<TenantSupportPage />} />
        </Route>

        {/* Platform Super Admin Routes */}
        <Route element={<SuperAdminLayout />}>
          <Route path="/admin" element={<SuperAdminDashboard />} />
          <Route path="/admin/tenants" element={<SuperAdminTenants />} />
          <Route path="/admin/tenants/:id" element={<TenantDetailsPage />} />
          <Route path="/admin/audit" element={<SuperAdminAuditLogs />} />
          <Route path="/admin/audit-logs" element={<SuperAdminAuditLogs />} />
          <Route path="/admin/notifications" element={<NotificationsPage />} />
          <Route path="/admin/tickets" element={<SuperAdminTicketsPage />} />
          <Route path="/admin/team" element={<SuperAdminTeamPage />} />
        </Route>

        {/* Root SaaS Landing Page */}
        <Route path="/" element={<LandingPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
