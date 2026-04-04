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
import ShoppingListPage from './pages/ShoppingListPage'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />

      <Route element={<ProtectedRoute requiredRole="USER" redirectTo="/login" />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/shopping-list" element={<ShoppingListPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute requiredRole="ADMIN" redirectTo="/login" />}>
        <Route element={<AdminShell />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/products" element={<AdminProductsPage />} />
          <Route path="/admin/categories" element={<AdminCategoriesPage />} />
          <Route path="/admin/purchase-queue" element={<AdminPurchaseQueuePage />} />
          <Route path="/admin/reports" element={<AdminReportsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
