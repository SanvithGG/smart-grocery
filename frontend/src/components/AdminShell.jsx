import { ChevronDown, CircleUserRound, LogOut } from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { clearSession, getSession } from '../utils/session'

function AdminShell() {
  const navigate = useNavigate()
  const { username } = getSession()
  const [profileOpen, setProfileOpen] = useState(false)

  const navClassName = ({ isActive }) =>
    [
      'rounded-full px-4 py-2 text-sm font-medium transition',
      isActive ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-white/80',
    ].join(' ')

  const handleLogout = () => {
    clearSession()
    navigate('/admin/login')
  }

  const handleToggleProfile = () => {
    setProfileOpen((current) => !current)
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#dbeafe,#f8fafc_42%,#cbd5e1)] text-slate-900">
      <header className="border-b border-white/70 bg-white/75 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-700 shadow-inner">
              <CircleUserRound className="h-6 w-6" />
            </div>
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

          <div className="relative">
            <button
              type="button"
              aria-label="Open profile menu"
              onClick={handleToggleProfile}
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              <CircleUserRound className="h-5 w-5" />
              <ChevronDown className={`h-4 w-4 transition ${profileOpen ? 'rotate-180' : ''}`} />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-14 z-50 w-64 rounded-[28px] border border-white/70 bg-white/95 p-4 shadow-[0_24px_80px_rgba(15,23,42,0.16)] backdrop-blur">
                <div className="rounded-3xl border border-slate-100 bg-slate-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-700">
                    Profile
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-sky-700 shadow-sm">
                      <CircleUserRound className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{username || 'admin'}</p>
                      <p className="text-xs text-slate-500">Smart Grocery admin</p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  )
}

export default AdminShell
