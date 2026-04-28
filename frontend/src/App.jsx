import { Navigate, Route, Routes } from 'react-router-dom'
import AdminShell from './components/AdminShell'
import AppShell from './components/AppShell'
import ProtectedRoute from './components/ProtectedRoute'
import AdminCategoriesPage from './pages/AdminCategoriesPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import AdminProductsPage from './pages/AdminProductsPage'
import AdminPurchaseQueuePage from './pages/AdminPurchaseQueuePage'
import AdminReportsPage from './pages/AdminReportsPage'
import AdminUsersPage from './pages/AdminUsersPage'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import HomePage from './pages/HomePage'
import InventoryPage from './pages/InventoryPage'
import LandingPage from './pages/LandingPage'
import SellerAnalyticsPage from './pages/seller/SellerAnalyticsPage'
import SellerDashboardPage from './pages/seller/SellerDashboardPage'
import SellerOrdersPage from './pages/seller/SellerOrdersPage'
import SellerProductsPage from './pages/seller/SellerProductsPage'
import ShoppingListPage from './pages/ShoppingListPage'
import SuperAdminAnalyticsPage from './pages/superadmin/SuperAdminAnalyticsPage'
import SuperAdminDashboardPage from './pages/superadmin/SuperAdminDashboardPage'
import SuperAdminSellersPage from './pages/superadmin/SuperAdminSellersPage'
import SuperAdminUsersPage from './pages/superadmin/SuperAdminUsersPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route path="/forgot-password" element={<AuthPage mode="forgot-password" />} />

      <Route element={<ProtectedRoute requiredRole="USER" redirectTo="/login" />}>
        <Route element={<AppShell />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/shopping-list" element={<ShoppingListPage />} />
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
  )
}

export default App
