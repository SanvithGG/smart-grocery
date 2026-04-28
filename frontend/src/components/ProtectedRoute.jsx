import { Navigate, Outlet } from 'react-router-dom'
import { getSession, normalizeRole } from '../utils/session'

function ProtectedRoute({ requiredRole, redirectTo = '/login' }) {
  const { token, role } = getSession()
  const requiredRoles = (Array.isArray(requiredRole) ? requiredRole : [requiredRole]).map(normalizeRole)

  if (!token) {
    return <Navigate to={redirectTo} replace />
  }

  if (requiredRole && (!role || !requiredRoles.includes(role))) {
    return <Navigate to={redirectTo} replace />
  }

  return <Outlet />
}

export default ProtectedRoute
