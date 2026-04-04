import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { clearSession, getSession } from '../utils/session'

function AdminShell() {
  const navigate = useNavigate()
  const { username } = getSession()

  const navClassName = ({ isActive }) =>
    [
      'rounded-full px-4 py-2 text-sm font-medium transition',
      isActive ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-white/80',
    ].join(' ')

  const handleLogout = () => {
    clearSession()
    navigate('/admin/login')
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#dbeafe,#f8fafc_42%,#cbd5e1)] text-slate-900">
      <header className="border-b border-white/70 bg-white/75 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-sky-700">
              Admin Workspace
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
              Smart Grocery control center
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Signed in as {username || 'admin'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 rounded-full border border-white/80 bg-white/80 p-2 shadow-sm">
            <NavLink to="/admin" end className={navClassName}>
              Dashboard
            </NavLink>
            <NavLink to="/admin/users" className={navClassName}>
              Users
            </NavLink>
            <NavLink to="/admin/products" className={navClassName}>
              Products
            </NavLink>
            <NavLink to="/admin/categories" className={navClassName}>
              Categories
            </NavLink>
            <NavLink to="/admin/purchase-queue" className={navClassName}>
              Purchase Queue
            </NavLink>
            <NavLink to="/admin/reports" className={navClassName}>
              Reports
            </NavLink>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  )
}

export default AdminShell
