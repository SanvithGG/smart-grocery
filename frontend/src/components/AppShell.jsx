import { useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  Bell,
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
import Button from './ui/Button'
import { useToast } from './ui/toast'
import { acknowledgeExpiryAlert, getExpiryAlerts, getGroceries } from '../services/groceryService'
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
  const toast = useToast()
  const location = useLocation()
  const navigate = useNavigate()
  const { username } = getSession()
  const appsRef = useRef(null)
  const accountRef = useRef(null)
  const bellRef = useRef(null)
  const [bellOpen, setBellOpen] = useState(false)
  const [appsOpen, setAppsOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
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
        getGroceries(),
        getExpiryAlerts(),
      ])

      setNotifications(buildNotifications(itemsResponse, expiryAlertsResponse))
    } catch {
      setNotifications([])
    }
  }

  const handleLogout = () => {
    clearSession()
    navigate('/')
  }

  const handleOpenShortcut = ({ to, end, state }) => {
    setBellOpen(false)
    setAppsOpen(false)
    setAccountOpen(false)
    navigate(to, { state, replace: Boolean(end && location.pathname === to) })
  }

  const handleOpenNotification = (notification) => {
    setBellOpen(false)
    setAppsOpen(false)
    setAccountOpen(false)

    if (notification.type === 'expiry') {
      navigate('/dashboard', { state: { openSection: 'kitchen-reminders' } })
      return
    }

    navigate('/inventory')
  }

  const handleDeleteNotification = async (notification) => {
    if (notification.type !== 'expiry' || !notification.itemId) {
      return
    }

    try {
      await acknowledgeExpiryAlert(notification.itemId)
      await refreshNotifications()
      window.dispatchEvent(new Event('grocery-data-changed'))
      toast.success('Notification removed.')
    } catch {
      await refreshNotifications()
      toast.error('Could not remove this notification.')
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
      getGroceries(),
      getExpiryAlerts(),
    ])
      .then(([itemsResponse, expiryAlertsResponse]) => {
        if (cancelled) {
          return
        }

        const nextNotifications = buildNotifications(
          itemsResponse,
          expiryAlertsResponse,
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
      getGroceries(),
      getExpiryAlerts(),
    ])
      .then(([itemsResponse, expiryAlertsResponse]) => {
        if (cancelled) {
          return
        }

        setNotifications(buildNotifications(itemsResponse, expiryAlertsResponse))
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
      if (!bellRef.current?.contains(event.target)) {
        setBellOpen(false)
      }

      if (!appsRef.current?.contains(event.target)) {
        setAppsOpen(false)
      }

      if (!accountRef.current?.contains(event.target)) {
        setAccountOpen(false)
      }
    }

    window.addEventListener('pointerdown', handlePointerDown)

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [])

  const navigationItems = [
    { to: '/home', label: 'Home', icon: Home, end: true },
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/inventory', label: 'Inventory', icon: Package2 },
    { to: '/shopping-list', label: 'Buy Queue', icon: ShoppingCart },
  ]

  const navClassName = ({ isActive }) =>
    [
      'group flex items-center gap-3 overflow-hidden rounded-full border px-3 py-2.5 text-sm font-medium transition-all duration-300 ease-out',
      isActive
        ? 'border-slate-950 bg-slate-950 text-white shadow-[0_14px_30px_rgba(15,23,42,0.18)]'
        : 'border-transparent bg-transparent text-slate-600 hover:border-white/80 hover:bg-white/80 hover:text-slate-900',
    ].join(' ')

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

  const renderNavigationPill = () => (
    <nav className="flex flex-wrap items-center gap-2 rounded-[28px] border border-white/80 bg-white/80 p-2 shadow-sm">
      {navigationItems.map((item) => (
        <NavLink
          key={`top-${item.to}`}
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
  )

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
                  <Button variant="secondary" onClick={() => setPopupOpen(false)}>
                    Close
                  </Button>
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
                        <Button
                          type="button"
                          onClick={() => handleDeleteNotification(notification)}
                          variant="danger"
                          size="sm"
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                    <Button
                      type="button"
                      onClick={() => handleOpenNotification(notification)}
                      variant="secondary"
                      size="sm"
                      className="mt-4"
                    >
                      {notification.actionLabel}
                    </Button>
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
          <div className="min-w-0 space-y-6">
            <header className="sticky top-6 z-40 rounded-4xl border border-slate-100 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.07)]">
              <div className="relative grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:items-center">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-700">
                    User Dashboard
                  </p>
                  <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                    Smart Grocery Workspace
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm text-slate-500">
                    Inventory, shopping queue, reminders, and smart grocery activity.
                  </p>
                </div>

                <div className="flex justify-start xl:absolute xl:left-[59%] xl:top-1/2 xl:-translate-x-1/2 xl:-translate-y-1/2 xl:justify-center">
                  {renderNavigationPill()}
                </div>

                <div className="flex flex-wrap items-center gap-3 xl:justify-end">
                  <div className="relative" ref={bellRef}>
                    <button
                      type="button"
                      aria-label="Open notifications"
                      onClick={() => {
                        setBellOpen((current) => !current)
                        setAppsOpen(false)
                        setAccountOpen(false)
                      }}
                      className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 text-slate-700 transition hover:bg-slate-100"
                    >
                      <Bell className="h-5 w-5" />
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
                            <p className="mt-1 text-sm text-slate-500">Stored alerts after login</p>
                          </div>
                          <Button
                            type="button"
                            onClick={() => setBellOpen(false)}
                            variant="secondary"
                            size="sm"
                          >
                            Close
                          </Button>
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
                                  <Button
                                    type="button"
                                    onClick={() => handleDeleteNotification(notification)}
                                    variant="danger"
                                    size="sm"
                                  >
                                    Delete
                                  </Button>
                                )}
                              </div>
                              <Button
                                type="button"
                                onClick={() => handleOpenNotification(notification)}
                                variant="secondary"
                                size="sm"
                                className="mt-4"
                              >
                                {notification.actionLabel}
                              </Button>
                            </article>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

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
                      className={`group relative flex h-12 w-12 items-center justify-center rounded-2xl border text-slate-700 transition ${
                        appsOpen
                          ? 'border-sky-200 bg-sky-50'
                          : 'border-slate-100 bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      <Grip className="h-5 w-5" />
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
                                onClick={() => handleOpenShortcut(item)}
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
                      onClick={() => {
                        setAccountOpen((current) => !current)
                        setBellOpen(false)
                        setAppsOpen(false)
                      }}
                      className={`group relative flex h-12 w-12 items-center justify-center rounded-full border text-slate-900 transition ${
                        accountOpen
                          ? 'border-sky-300 bg-white shadow-[0_14px_30px_rgba(15,23,42,0.12)]'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm font-bold text-slate-950">
                        {accountInitial}
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
                            <span className="flex h-18 w-18 items-center justify-center rounded-full border border-slate-300 bg-white text-2xl font-bold text-slate-900">
                              {accountInitial}
                            </span>
                          </div>
                          <h3 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
                            Hi, {accountLabel}!
                          </h3>
                          <p className="mt-2 text-sm text-slate-500">Smart Grocery user workspace</p>
                        </div>

                        <div className="mt-4 rounded-[28px] bg-slate-50 p-2">
                          <Button
                            type="button"
                            onClick={handleLogout}
                            variant="danger"
                            size="lg"
                            fullWidth
                            className="rounded-[22px] text-base"
                          >
                            <LogOut className="h-4 w-4" />
                            Logout
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            </header>

            <main className="min-w-0">
              <Outlet />
            </main>
          </div>
      </div>
    </div>
  )
}

export default AppShell
