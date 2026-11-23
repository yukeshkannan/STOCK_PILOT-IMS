import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Layouts
import AuthLayout from './layouts/AuthLayout';
import TenantLayout from './layouts/TenantLayout';
import SuperAdminLayout from './layouts/SuperAdminLayout';
import DeveloperLayout from './layouts/DeveloperLayout';
import MobileAppBanner from './components/MobileAppBanner';
import Preloader from './components/Preloader';

// Code-split pages for instant initial load
const LoginPage = lazy(() => import('./modules/auth/LoginPage'));
const RegisterPage = lazy(() => import('./modules/auth/RegisterPage'));
const CompleteProfilePage = lazy(() => import('./modules/auth/CompleteProfilePage'));
const SuperAdminLoginPage = lazy(() => import('./modules/auth/SuperAdminLoginPage'));
const DeveloperLoginPage = lazy(() => import('./modules/auth/DeveloperLoginPage'));
const DashboardPage = lazy(() => import('./modules/dashboard/DashboardPage'));
const ProductsPage = lazy(() => import('./modules/products/ProductsPage'));
const InventoryPage = lazy(() => import('./modules/inventory/InventoryPage'));
const WarehousesPage = lazy(() => import('./modules/warehouses/WarehousesPage'));
const PurchasesPage = lazy(() => import('./modules/purchases/PurchasesPage'));
const SalesPage = lazy(() => import('./modules/sales/SalesPage'));
const NewSalePage = lazy(() => import('./modules/sales/NewSalePage'));
const FinancePage = lazy(() => import('./modules/finance/FinancePage'));
const ReportsPage = lazy(() => import('./modules/reports/ReportsPage'));
const NotificationsPage = lazy(() => import('./modules/notifications/NotificationsPage'));
const UsersPage = lazy(() => import('./modules/users/UsersPage'));
const SettingsPage = lazy(() => import('./modules/settings/SettingsPage'));
const SubscriptionPage = lazy(() => import('./modules/subscription/SubscriptionPage'));
const PublicInvoicePage = lazy(() => import('./modules/sales/PublicInvoicePage'));
const PublicStorePage = lazy(() => import('./modules/store/PublicStorePage'));
const StorefrontBuilderPage = lazy(() => import('./modules/store/StorefrontBuilderPage'));
const SuperAdminDashboard = lazy(() => import('./modules/superadmin/SuperAdminDashboard'));
const SuperAdminTenants = lazy(() => import('./modules/superadmin/SuperAdminTenants'));
const TenantDetailsPage = lazy(() => import('./modules/superadmin/TenantDetailsPage'));
const SuperAdminAuditLogs = lazy(() => import('./modules/superadmin/SuperAdminAuditLogs'));
const SuperAdminTicketsPage = lazy(() => import('./modules/superadmin/SuperAdminTicketsPage'));
const SuperAdminTeamPage = lazy(() => import('./modules/superadmin/SuperAdminTeamPage'));
const DeveloperWorkspacePage = lazy(() => import('./modules/developer/DeveloperWorkspacePage'));
const TenantSupportPage = lazy(() => import('./modules/support/TenantSupportPage'));
const LandingPage = lazy(() => import('./modules/landing/LandingPage'));

export default function App() {
  const { mode } = useSelector((state) => state.theme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  return (
    <BrowserRouter>
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
      <Suspense fallback={<Preloader isFullScreen={false} message="Loading module..." />}>
        <Routes>
          {/* Public Tenant Mini E-Commerce Storefront */}
          <Route path="/store/:companyCode" element={<PublicStorePage />} />
          <Route path="/store/:companyCode/track" element={<PublicStorePage />} />
          <Route path="/store/:companyCode/track/:invoiceNumber" element={<PublicStorePage />} />

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
            <Route path="/admin/notifications" element={<Navigate to="/admin" replace />} />
            <Route path="/admin/tickets" element={<SuperAdminTicketsPage />} />
            <Route path="/admin/team" element={<SuperAdminTeamPage />} />
          </Route>

          {/* Root SaaS Landing Page */}
          <Route path="/" element={<LandingPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
