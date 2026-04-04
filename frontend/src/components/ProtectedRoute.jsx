import { Navigate, Outlet } from 'react-router-dom'
import { getSession } from '../utils/session'

function ProtectedRoute({ requiredRole, redirectTo = '/login' }) {
  const { token, role } = getSession()

  if (!token) {
    return <Navigate to={redirectTo} replace />
  }

  if (requiredRole && (!role || role !== requiredRole)) {
    return <Navigate to={redirectTo} replace />
  }

  return <Outlet />
}

export default ProtectedRoute
