import React, { Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { SmartRulesProvider } from './context/SmartRulesContext'
import AdminShell from './components/AdminShell'
import AppShell from './components/AppShell'
import ProtectedRoute from './components/ProtectedRoute'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import HomePage from './pages/HomePage'
import InventoryPage from './pages/InventoryPage'
import ShoppingListPage from './pages/ShoppingListPage'
import SettingsPage from './pages/SettingsPage'

// Lazy loaded Admin modules
const AdminCategoriesPage = React.lazy(() => import('./pages/AdminCategoriesPage'))
const AdminDashboardPage = React.lazy(() => import('./pages/AdminDashboardPage'))
const AdminProductsPage = React.lazy(() => import('./pages/AdminProductsPage'))
const AdminPurchaseQueuePage = React.lazy(() => import('./pages/AdminPurchaseQueuePage'))
const AdminReportsPage = React.lazy(() => import('./pages/AdminReportsPage'))
const AdminUsersPage = React.lazy(() => import('./pages/AdminUsersPage'))

// Lazy loaded Seller modules
const SellerAnalyticsPage = React.lazy(() => import('./pages/seller/SellerAnalyticsPage'))
const SellerDashboardPage = React.lazy(() => import('./pages/seller/SellerDashboardPage'))
const SellerOrdersPage = React.lazy(() => import('./pages/seller/SellerOrdersPage'))
const SellerProductsPage = React.lazy(() => import('./pages/seller/SellerProductsPage'))

// Lazy loaded Super Admin modules
const SuperAdminAnalyticsPage = React.lazy(() => import('./pages/superadmin/SuperAdminAnalyticsPage'))
const SuperAdminDashboardPage = React.lazy(() => import('./pages/superadmin/SuperAdminDashboardPage'))
const SuperAdminSellersPage = React.lazy(() => import('./pages/superadmin/SuperAdminSellersPage'))
const SuperAdminUsersPage = React.lazy(() => import('./pages/superadmin/SuperAdminUsersPage'))

function App() {
  return (
    <SmartRulesProvider>
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm font-medium text-slate-500">
            <span className="animate-pulse">{'Loading smart grocery page...'}</span>
          </div>
        }
      >
        <Routes>
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/register" element={<AuthPage mode="register" />} />
          <Route path="/forgot-password" element={<AuthPage mode="forgot-password" />} />

          <Route element={<AppShell />}>
            <Route path="/" element={<HomePage />} />
          </Route>

          <Route element={<ProtectedRoute requiredRole="USER" redirectTo="/login" />}>
            <Route element={<AppShell />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/shopping-list" element={<ShoppingListPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute requiredRole="SUPER_ADMIN" redirectTo="/login" />}>
            <Route path="/superadmin" element={<Navigate to="/super-admin" replace />} />

            <Route element={<AdminShell workspace="superadmin" />}>
              <Route path="/super-admin" element={<SuperAdminDashboardPage />} />
              <Route path="/superadmin/users" element={<SuperAdminUsersPage />} />
              <Route path="/superadmin/sellers" element={<SuperAdminSellersPage />} />
              <Route path="/superadmin/analytics" element={<SuperAdminAnalyticsPage />} />
            </Route>

            <Route element={<AdminShell />}>
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/products" element={<AdminProductsPage />} />
              <Route path="/admin/categories" element={<AdminCategoriesPage />} />
              <Route path="/admin/purchase-queue" element={<AdminPurchaseQueuePage />} />
              <Route path="/admin/reports" element={<AdminReportsPage />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute requiredRole={['SELLER', 'SUPER_ADMIN']} redirectTo="/login" />}>
            <Route path="/seller" element={<SellerDashboardPage />} />
            <Route path="/seller/dashboard" element={<Navigate to="/seller" replace />} />
            <Route path="/seller/products" element={<SellerProductsPage />} />
            <Route path="/seller/orders" element={<SellerOrdersPage />} />
            <Route path="/seller/purchase-queue" element={<Navigate to="/seller/orders" replace />} />
            <Route path="/seller/analytics" element={<SellerAnalyticsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </SmartRulesProvider>
  )
}

export default App
