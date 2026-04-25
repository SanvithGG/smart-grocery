import { useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  CircleUserRound,
  Clock,
  Grid2x2,
  Grip,
  Home,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  Package2,
  ShoppingCart,
} from 'lucide-react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import api from '../api/client'
import { clearSession, getSession } from '../utils/session'

const AVAILABILITY_THRESHOLD = 3
const POPUP_DURATION_MS = 7000

function getPopupCountdown(now, startedAt, durationMs) {
  const elapsed = now - startedAt
  const remainingMs = Math.max(durationMs - elapsed, 0)

  return {
    progressPercent: durationMs === 0 ? 0 : (remainingMs / durationMs) * 100,
    expired: remainingMs === 0,
  }
}

function AppShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const { username } = getSession()
  const accountRef = useRef(null)
  const appsRef = useRef(null)
  const [bellOpen, setBellOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [appsOpen, setAppsOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [popupOpen, setPopupOpen] = useState(false)
  const [popupStartedAt, setPopupStartedAt] = useState(0)
  const [now, setNow] = useState(0)

  const buildNotifications = (items, expiryAlerts) => {
    const availableItems = items
      .filter((item) => !item.purchased && item.quantity >= AVAILABILITY_THRESHOLD)
      .sort((first, second) => second.quantity - first.quantity)
    const lowStockItems = items
      .filter((item) => !item.purchased && item.quantity > 0 && item.quantity < AVAILABILITY_THRESHOLD)
      .sort((first, second) => first.quantity - second.quantity)

    const availabilityNotification =
      availableItems.length > 0
        ? [
            {
              id: 'availability',
              type: 'availability',
              title: 'Availability Alert',
              message: `${availableItems.length} items are available with quantity ${AVAILABILITY_THRESHOLD}+`,
              actionLabel: 'Open Inventory',
            },
          ]
        : []

    const lowStockNotifications = lowStockItems.map((item) => ({
      id: `low-stock-${item.id}`,
      itemId: item.id,
      type: 'low-stock',
      title: `${item.name} is running low`,
      message: `${item.category} | Only ${item.quantity} ${item.quantity === 1 ? 'unit' : 'units'} left`,
      actionLabel: 'Open Inventory',
    }))

    const expiryNotifications = expiryAlerts.map((alert) => ({
      id: `expiry-${alert.itemId}`,
      itemId: alert.itemId,
      type: 'expiry',
      title: alert.itemName,
      message: `${alert.category} | ${alert.message}`,
      actionLabel: 'Open Reminder',
    }))

    return [...expiryNotifications, ...lowStockNotifications, ...availabilityNotification]
  }

  const refreshNotifications = async () => {
    try {
      const [itemsResponse, expiryAlertsResponse] = await Promise.all([
        api.get('/api/grocery'),
        api.get('/api/grocery/expiry-alerts'),
      ])

      setNotifications(buildNotifications(itemsResponse.data, expiryAlertsResponse.data))
    } catch {
      setNotifications([])
    }
  }

  const handleLogout = () => {
    clearSession()
    navigate('/')
  }

  const handleOpenApp = ({ to, end, state }) => {
    setAppsOpen(false)
    setBellOpen(false)
    setAccountOpen(false)
    navigate(to, { state, replace: Boolean(end && location.pathname === to) })
  }

  const handleOpenNotification = (notification) => {
    setBellOpen(false)
    setAccountOpen(false)
    setAppsOpen(false)

    if (notification.type === 'expiry') {
      navigate('/dashboard', { state: { openSection: 'kitchen-reminders' } })
      return
    }

    navigate('/inventory')
  }

  const handleToggleAccount = () => {
    setAccountOpen((current) => !current)
    setBellOpen(false)
    setAppsOpen(false)
  }

  const handleDeleteNotification = async (notification) => {
    if (notification.type !== 'expiry' || !notification.itemId) {
      return
    }

    try {
      await api.post(`/api/grocery/${notification.itemId}/acknowledge-expiry-alert`)
      await refreshNotifications()
      window.dispatchEvent(new Event('grocery-data-changed'))
    } catch {
      await refreshNotifications()
    }
  }

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now())
    }, 250)

    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    let cancelled = false

    Promise.all([
      api.get('/api/grocery'),
      api.get('/api/grocery/expiry-alerts'),
    ])
      .then(([itemsResponse, expiryAlertsResponse]) => {
        if (cancelled) {
          return
        }

        const nextNotifications = buildNotifications(
          itemsResponse.data,
          expiryAlertsResponse.data,
        )

        setNotifications(nextNotifications)

        if (nextNotifications.length > 0) {
          setPopupStartedAt(Date.now())
          setPopupOpen(true)
        }
      })
      .catch(() => {
        if (cancelled) {
          return
        }

        setNotifications([])
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    Promise.all([
      api.get('/api/grocery'),
      api.get('/api/grocery/expiry-alerts'),
    ])
      .then(([itemsResponse, expiryAlertsResponse]) => {
        if (cancelled) {
          return
        }

        setNotifications(buildNotifications(itemsResponse.data, expiryAlertsResponse.data))
      })
      .catch(() => {
        if (cancelled) {
          return
        }

        setNotifications([])
      })

    return () => {
      cancelled = true
    }
  }, [location.pathname])

  const popupCountdown = getPopupCountdown(now, popupStartedAt, POPUP_DURATION_MS)

  useEffect(() => {
    if (!popupOpen) {
      return
    }

    const remainingMs = Math.max(POPUP_DURATION_MS - (Date.now() - popupStartedAt), 0)
    const timeoutId = window.setTimeout(() => {
      setPopupOpen(false)
    }, remainingMs)

    return () => window.clearTimeout(timeoutId)
  }, [popupOpen, popupStartedAt])

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!accountRef.current?.contains(event.target)) {
        setAccountOpen(false)
      }

      if (!appsRef.current?.contains(event.target)) {
        setAppsOpen(false)
      }
    }

    window.addEventListener('pointerdown', handlePointerDown)

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [])

  const navClassName = ({ isActive }) =>
    [
      'group flex items-center gap-3 overflow-hidden rounded-full border px-3 py-2.5 text-sm font-medium transition-all duration-300 ease-out',
      isActive
        ? 'border-slate-900 bg-slate-900 text-white shadow-[0_14px_30px_rgba(15,23,42,0.18)]'
        : 'border-transparent bg-transparent text-slate-600 hover:border-white/70 hover:bg-white/70 hover:text-slate-900',
    ].join(' ')

  const navigationItems = [
    { to: '/home', label: 'Home', icon: Home, end: true },
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/inventory', label: 'Inventory', icon: Package2 },
    { to: '/shopping-list', label: 'Buy Queue', icon: ShoppingCart },
  ]

  const accountLabel = username || 'user'
  const accountInitial = accountLabel.charAt(0).toUpperCase() || 'U'
  const appItems = [
    { label: 'Home', icon: Home, to: '/home' },
    { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
    { label: 'Inventory', icon: Package2, to: '/inventory' },
    { label: 'Buy Queue', icon: ShoppingCart, to: '/shopping-list' },
    {
      label: 'Smart Picks',
      icon: Lightbulb,
      to: '/dashboard',
      state: { openSection: 'recommendations' },
    },
    {
      label: 'Action Board',
      icon: AlertTriangle,
      to: '/dashboard',
      state: { openSection: 'low-stock-watchlist' },
    },
    {
      label: 'Reminders',
      icon: Clock,
      to: '/dashboard',
      state: { openSection: 'kitchen-reminders' },
    },
    {
      label: 'Recent List',
      icon: Grid2x2,
      to: '/dashboard',
      state: { openSection: 'recent-list' },
    },
  ]

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#dbeafe,#f8fafc_45%,#e2e8f0)] text-slate-900">
      {popupOpen && notifications.length > 0 && (
        <>
          <button
            type="button"
            aria-label="Close notifications popup"
            onClick={() => setPopupOpen(false)}
            className="fixed inset-0 z-40 bg-slate-950/25"
          />
          <section className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-24 sm:p-6 sm:pt-24">
            <div className="w-full max-w-xl overflow-hidden rounded-4xl border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.95))] shadow-[0_28px_120px_rgba(15,23,42,0.22)] backdrop-blur">
              <div className="border-b border-slate-200 px-6 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.32em] text-sky-700">
                      Notifications
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                      Recent alerts
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                      Quick actions when the app opens.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPopupOpen(false)}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    Close
                  </button>
                </div>
              </div>

              <div className="max-h-[65vh] space-y-3 overflow-y-auto px-6 py-5">
                {notifications.map((notification) => (
                  <article
                    key={`popup-${notification.id}`}
                    className="rounded-3xl border border-slate-100 bg-slate-50 px-4 py-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{notification.title}</p>
                        <p className="mt-1 text-sm text-slate-500">{notification.message}</p>
                      </div>
                      {notification.type === 'expiry' && (
                        <button
                          type="button"
                          onClick={() => handleDeleteNotification(notification)}
                          className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenNotification(notification)}
                      className="mt-4 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                    >
                      {notification.actionLabel}
                    </button>
                  </article>
                ))}
              </div>

              <div className="h-1.5 bg-slate-100">
                <div
                  className="h-full bg-sky-500 transition-[width] duration-200"
                  style={{ width: `${popupCountdown.progressPercent}%` }}
                />
              </div>
            </div>
          </section>
        </>
      )}

      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-8 rounded-4xl border border-white/70 bg-white/80 p-5 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="flex flex-col gap-5 xl:grid xl:grid-cols-[auto_1fr_auto] xl:items-center xl:gap-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-700 shadow-inner">
                <CircleUserRound className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-700">
                  Smart Grocery
                </p>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                  Smart Grocery Workspace
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Signed in as {username || 'user'}
                </p>
              </div>
            </div>

            <div className="flex justify-center xl:justify-self-center">
              <div className="flex flex-wrap items-center gap-2 rounded-4xl border border-slate-200/70 bg-white/95 p-2 shadow-[0_14px_36px_rgba(15,23,42,0.08)]">
                <nav className="flex flex-wrap gap-2">
                  {navigationItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      className={navClassName}
                      aria-label={item.label}
                    >
                      {({ isActive }) => (
                        <>
                          <item.icon
                            className={`h-4 w-4 shrink-0 transition-transform duration-300 ${
                              isActive ? 'scale-100 text-sky-300' : 'scale-95'
                            }`}
                          />
                          <span
                            className={`whitespace-nowrap text-sm font-semibold transition-all duration-300 ${
                              isActive
                                ? 'max-w-32 translate-x-0 opacity-100'
                                : 'max-w-0 -translate-x-2 opacity-0 group-hover:max-w-32 group-hover:translate-x-0 group-hover:opacity-100'
                            }`}
                          >
                            {item.label}
                          </span>
                        </>
                      )}
                    </NavLink>
                  ))}
                </nav>

                <div className="relative">
                  <button
                    type="button"
                    aria-label="Open notifications"
                    onClick={() => setBellOpen((current) => !current)}
                    className={`group relative flex h-11.5 min-w-11.5 items-center justify-center overflow-hidden rounded-full border px-3 py-2.5 text-sm font-medium transition-all duration-300 ease-out ${
                      bellOpen
                        ? 'border-slate-900 bg-slate-900 text-white shadow-[0_14px_30px_rgba(15,23,42,0.18)]'
                        : 'border-transparent bg-transparent text-slate-600 hover:border-white/70 hover:bg-white/70 hover:text-slate-900'
                    }`}
                  >
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className={`h-4 w-4 shrink-0 transition-transform duration-300 ${
                        bellOpen ? 'scale-100 text-sky-300' : 'scale-95'
                      }`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M6.5 9a5.5 5.5 0 1 1 11 0c0 5.5 2 7 2 7h-15s2-1.5 2-7" />
                      <path d="M10 19a2 2 0 0 0 4 0" />
                    </svg>
                    <span
                      className={`ml-2 whitespace-nowrap text-sm font-semibold transition-all duration-300 ${
                        bellOpen
                          ? 'max-w-32 translate-x-0 opacity-100'
                          : 'max-w-0 -translate-x-2 opacity-0 group-hover:max-w-32 group-hover:translate-x-0 group-hover:opacity-100'
                      }`}
                    >
                      Alerts
                    </span>
                    {notifications.length > 0 && (
                      <span className="absolute -right-1 -top-1 rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                        {notifications.length}
                      </span>
                    )}
                  </button>

                  {bellOpen && (
                    <div className="absolute right-0 top-16 z-50 w-88 rounded-[28px] border border-white/70 bg-white/95 p-4 shadow-[0_24px_80px_rgba(15,23,42,0.16)] backdrop-blur">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-700">
                            Notifications
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            Stored alerts after login
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setBellOpen(false)}
                          className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                        >
                          Close
                        </button>
                      </div>

                      <div className="mt-4 space-y-3">
                        {notifications.length === 0 && (
                          <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                            No notifications right now.
                          </p>
                        )}

                        {notifications.map((notification) => (
                          <article
                            key={notification.id}
                            className="rounded-3xl border border-slate-100 bg-slate-50 px-4 py-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-slate-900">
                                  {notification.title}
                                </p>
                                <p className="mt-1 text-sm text-slate-500">
                                  {notification.message}
                                </p>
                              </div>
                              {notification.type === 'expiry' && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteNotification(notification)}
                                  className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleOpenNotification(notification)}
                              className="mt-4 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                            >
                              {notification.actionLabel}
                            </button>
                          </article>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <div className="relative" ref={appsRef}>
                <button
                  type="button"
                  aria-label="Open apps"
                  title="Apps"
                  onClick={() => {
                    setAppsOpen((current) => !current)
                    setBellOpen(false)
                    setAccountOpen(false)
                  }}
                  className={`group relative flex h-14 w-14 items-center justify-center rounded-full border bg-white text-slate-700 transition ${
                    appsOpen
                      ? 'border-sky-300 shadow-[0_14px_30px_rgba(15,23,42,0.12)]'
                      : 'border-slate-200/80 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <Grip className="h-4 w-4" />
                  <span className="pointer-events-none absolute top-[calc(100%+0.55rem)] left-1/2 -translate-x-1/2 -translate-y-1 rounded-[10px] bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-slate-50 opacity-0 transition-all duration-150 group-hover:translate-y-0 group-hover:opacity-100">
                    Apps
                  </span>
                </button>

                {appsOpen && (
                  <div className="absolute right-0 top-16 z-50 w-[24rem] rounded-4xl border border-white/70 bg-white/95 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.2)] backdrop-blur">
                    <div className="rounded-[28px] bg-slate-50 px-5 py-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.32em] text-sky-700">
                        Apps
                      </p>
                      <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                        Smart Grocery launcher
                      </h3>
                      <p className="mt-2 text-sm text-slate-500">
                        Open pages and dashboard tools from one place.
                      </p>

                      <div className="mt-5 grid grid-cols-4 gap-3">
                        {appItems.map((item) => (
                          <button
                            key={`${item.label}-${item.to}-${item.state?.openSection || 'page'}`}
                            type="button"
                            onClick={() => handleOpenApp(item)}
                            className="group flex flex-col items-center gap-2 rounded-3xl border border-transparent bg-white px-3 py-4 text-center transition hover:border-slate-200 hover:bg-slate-100"
                          >
                            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition group-hover:bg-slate-900 group-hover:text-white">
                              <item.icon className="h-4 w-4" />
                            </span>
                            <span className="text-xs font-semibold text-slate-700">
                              {item.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="relative" ref={accountRef}>
                <button
                  type="button"
                  aria-label="Open account"
                  onClick={handleToggleAccount}
                  className={`group relative flex h-14 w-14 items-center justify-center rounded-full border bg-white text-slate-700 transition ${
                    accountOpen
                      ? 'border-sky-300 shadow-[0_14px_30px_rgba(15,23,42,0.12)]'
                      : 'border-slate-200/80 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(180deg,#e2e8f0_0%,#cbd5e1_100%)] p-px">
                    <span className="flex h-full w-full items-center justify-center rounded-full bg-white text-sm font-bold text-slate-900">
                      {accountInitial}
                    </span>
                  </span>
                  <span className="pointer-events-none absolute top-[calc(100%+0.55rem)] left-1/2 -translate-x-1/2 -translate-y-1 rounded-[10px] bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-slate-50 opacity-0 transition-all duration-150 group-hover:translate-y-0 group-hover:opacity-100">
                    Account
                  </span>
                </button>

                {accountOpen && (
                  <div className="absolute right-0 top-16 z-50 w-88 rounded-4xl border border-white/70 bg-white/95 p-4 shadow-[0_24px_80px_rgba(15,23,42,0.2)] backdrop-blur">
                    <div className="rounded-[28px] bg-slate-50 px-5 py-5 text-center">
                      <p className="text-sm font-medium text-slate-500">{accountLabel}</p>
                      <div className="mt-4 flex justify-center">
                        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[linear-gradient(180deg,#e2e8f0_0%,#cbd5e1_100%)] p-px">
                          <span className="flex h-full w-full items-center justify-center rounded-full bg-white text-2xl font-bold text-slate-900">
                            {accountInitial}
                          </span>
                        </span>
                      </div>
                      <h3 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
                        Hi, {accountLabel}!
                      </h3>
                      <p className="mt-2 text-sm text-slate-500">Smart Grocery user workspace</p>
                    </div>

                    <div className="mt-4 rounded-[28px] bg-slate-50 p-2">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center justify-center gap-2 rounded-[22px] border border-rose-200 bg-rose-50 px-4 py-4 text-base font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100"
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AppShell
