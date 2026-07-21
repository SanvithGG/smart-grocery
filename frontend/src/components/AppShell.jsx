import { useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  Bell,
  Clock,
  Grid2x2,
  Grip,
  Home,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  Package2,
  ShoppingCart,
  Search,
  Settings,
  Apple,
  Droplet,
  Cake,
  Coffee,
  Cookie,
  LayoutGrid
} from 'lucide-react'
import { NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
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
  }
}

function buildNotifications(items, expiryAlerts) {
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

function AppShell() {
  const toast = useToast()
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
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

  const updateFilter = (key, value) => {
    const params = new URLSearchParams(searchParams)
    if (value) params.set(key, value)
    else params.delete(key)
    
    if (location.pathname !== '/home') {
      navigate('/home?' + params.toString())
      setTimeout(() => {
        document.getElementById('shop-catalog')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 300)
    } else {
      setSearchParams(params, { replace: true })
      document.getElementById('shop-catalog')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
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

  const closeMenus = () => {
    setBellOpen(false)
    setAppsOpen(false)
    setAccountOpen(false)
  }

  const handleLogout = () => {
    clearSession()
    navigate('/')
  }

  const handleOpenShortcut = ({ to, end, state }) => {
    closeMenus()
    navigate(to, { state, replace: Boolean(end && location.pathname === to) })
  }

  const handleOpenNotification = (notification) => {
    closeMenus()

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

        const nextNotifications = buildNotifications(itemsResponse, expiryAlertsResponse)
        setNotifications(nextNotifications)

        if (nextNotifications.length > 0) {
          setPopupStartedAt(Date.now())
          setPopupOpen(true)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setNotifications([])
        }
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
        if (!cancelled) {
          setNotifications(buildNotifications(itemsResponse, expiryAlertsResponse))
        }
      })
      .catch(() => {
        if (!cancelled) {
          setNotifications([])
        }
      })

    return () => {
      cancelled = true
    }
  }, [location.pathname])

  useEffect(() => {
    if (!popupOpen) {
      return undefined
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

  const popupCountdown = getPopupCountdown(now, popupStartedAt, POPUP_DURATION_MS)
  const accountLabel = username || 'user'
  const accountInitial = accountLabel.charAt(0).toUpperCase() || 'U'
  const navigationItems = [
    { to: '/home', label: 'Home', icon: Home, end: true },
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/inventory', label: 'Inventory', icon: Package2 },
    { to: '/shopping-list', label: 'Buy Queue', icon: ShoppingCart },
  ]
  const appItems = [
    ...navigationItems,
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
    { label: 'Settings', icon: Settings, to: '/settings' },
  ]

  const navClassName = ({ isActive }) =>
    [
      'flex items-center gap-2 whitespace-nowrap rounded-lg border px-3 py-2 text-sm font-medium transition',
      isActive
        ? 'border-slate-950 bg-slate-950 text-white'
        : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-950',
    ].join(' ')

  return (
    <div className='simple-ui min-h-screen bg-slate-50 text-slate-900'>
      {popupOpen && notifications.length > 0 && (
        <>
          <button
            type='button'
            aria-label='Close notifications popup'
            onClick={() => setPopupOpen(false)}
            className='fixed inset-0 z-40 bg-slate-950/25'
          />
          <section className='fixed inset-0 z-50 flex items-start justify-center p-4 pt-20 sm:p-6 sm:pt-24'>
            <div className='w-full max-w-xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg'>
              <div className='border-b border-slate-200 px-5 py-4'>
                <div className='flex items-start justify-between gap-4'>
                  <div>
                    <p className='text-xs font-semibold uppercase text-sky-700'>Notifications</p>
                    <h2 className='mt-1 text-xl font-semibold text-slate-950'>Recent alerts</h2>
                  </div>
                  <Button variant='secondary' onClick={() => setPopupOpen(false)}>
                    Close
                  </Button>
                </div>
              </div>

              <div className='max-h-[65vh] space-y-3 overflow-y-auto px-5 py-4'>
                {notifications.map((notification) => (
                  <article
                    key={`popup-${notification.id}`}
                    className='rounded-lg border border-slate-200 bg-slate-50 px-4 py-4'
                  >
                    <div className='flex items-start justify-between gap-3'>
                      <div>
                        <p className='text-sm font-semibold text-slate-900'>{notification.title}</p>
                        <p className='mt-1 text-sm text-slate-500'>{notification.message}</p>
                      </div>
                      {notification.type === 'expiry' && (
                        <Button
                          type='button'
                          onClick={() => handleDeleteNotification(notification)}
                          variant='danger'
                          size='sm'
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                    <Button
                      type='button'
                      onClick={() => handleOpenNotification(notification)}
                      variant='secondary'
                      size='sm'
                      className='mt-4 rounded-lg'
                    >
                      {notification.actionLabel}
                    </Button>
                  </article>
                ))}
              </div>

              <div className='h-1.5 bg-slate-100'>
                <div
                  className='h-full bg-sky-500 transition-[width] duration-200'
                  style={{ width: `${popupCountdown.progressPercent}%` }}
                />
              </div>
            </div>
          </section>
        </>
      )}

      <header className='sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur'>
        <div className='mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8'>
          <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
              <div className='min-w-0'>
                <p className='truncate text-lg font-semibold text-slate-950'>Smart Grocery</p>
                <p className='truncate text-xs text-slate-500'>{accountLabel}</p>
              </div>

              <div className='flex-1 max-w-2xl px-4 lg:px-8'>
                <div className='relative w-full'>
                  <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400' />
                  <input
                    type='text'
                    value={searchParams.get('search') || ''}
                    onChange={(e) => updateFilter('search', e.target.value)}
                    placeholder='Search for Products, Brands and More'
                    className='w-full rounded-md bg-slate-100 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:bg-white focus:ring-1 focus:ring-sky-500 border border-transparent focus:border-sky-500'
                  />
                </div>
              </div>

              <div className='flex items-center gap-4 shrink-0'>
                <nav className='hidden lg:flex items-center gap-2'>
                  {navigationItems.map((item) => (
                    <NavLink
                      key={`top-${item.to}`}
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) => 
                        `flex items-center gap-1.5 px-3 py-2 rounded-md transition ${isActive ? 'text-sky-600 bg-sky-50 font-medium' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`
                      }
                      aria-label={item.label}
                    >
                      {({ isActive }) => (
                        <>
                          <item.icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-sky-600' : 'text-slate-500'}`} />
                          <span className='text-sm font-medium'>{item.label}</span>
                        </>
                      )}
                    </NavLink>
                  ))}
                </nav>

              <div className='flex items-center gap-2 md:justify-end shrink-0 lg:border-l lg:border-slate-200 lg:pl-4'>
                <div className='relative' ref={bellRef}>
                  <button
                    type='button'
                    aria-label='Open notifications'
                    onClick={() => {
                      setBellOpen((current) => !current)
                      setAppsOpen(false)
                      setAccountOpen(false)
                    }}
                    className='relative flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50'
                  >
                    <Bell className='h-5 w-5' />
                    {notifications.length > 0 && (
                      <span className='absolute -right-1 -top-1 rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-semibold text-white'>
                        {notifications.length}
                      </span>
                    )}
                  </button>

                  {bellOpen && (
                    <div className='absolute right-0 top-12 z-50 w-[min(22rem,calc(100vw-2rem))] rounded-lg border border-slate-200 bg-white p-4 shadow-lg'>
                      <div className='flex items-center justify-between gap-3'>
                        <div>
                          <p className='text-xs font-semibold uppercase text-sky-700'>Notifications</p>
                          <p className='mt-1 text-sm text-slate-500'>Stored alerts after login</p>
                        </div>
                        <Button type='button' onClick={() => setBellOpen(false)} variant='secondary' size='sm'>
                          Close
                        </Button>
                      </div>

                      <div className='mt-4 space-y-3'>
                        {notifications.length === 0 && (
                          <p className='rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500'>
                            No notifications right now.
                          </p>
                        )}

                        {notifications.map((notification) => (
                          <article
                            key={notification.id}
                            className='rounded-lg border border-slate-200 bg-slate-50 px-4 py-4'
                          >
                            <div className='flex items-start justify-between gap-3'>
                              <div>
                                <p className='text-sm font-semibold text-slate-900'>{notification.title}</p>
                                <p className='mt-1 text-sm text-slate-500'>{notification.message}</p>
                              </div>
                              {notification.type === 'expiry' && (
                                <Button
                                  type='button'
                                  onClick={() => handleDeleteNotification(notification)}
                                  variant='danger'
                                  size='sm'
                                >
                                  Delete
                                </Button>
                              )}
                            </div>
                            <Button
                              type='button'
                              onClick={() => handleOpenNotification(notification)}
                              variant='secondary'
                              size='sm'
                              className='mt-4 rounded-lg'
                            >
                              {notification.actionLabel}
                            </Button>
                          </article>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className='relative' ref={appsRef}>
                  <button
                    type='button'
                    aria-label='Open shortcuts'
                    title='Shortcuts'
                    onClick={() => {
                      setAppsOpen((current) => !current)
                      setBellOpen(false)
                      setAccountOpen(false)
                    }}
                    className={`flex h-10 w-10 items-center justify-center rounded-lg border text-slate-700 transition ${
                      appsOpen
                        ? 'border-sky-200 bg-sky-50'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <Grip className='h-5 w-5' />
                  </button>

                  {appsOpen && (
                    <div className='absolute right-0 top-12 z-50 w-[min(24rem,calc(100vw-2rem))] rounded-lg border border-slate-200 bg-white p-4 shadow-lg'>
                      <div className='rounded-lg bg-slate-50 p-4'>
                        <p className='text-xs font-semibold uppercase text-sky-700'>Shortcuts</p>
                        <h3 className='mt-1 text-lg font-semibold text-slate-950'>Open a page</h3>

                        <div className='mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4'>
                          {appItems.map((item) => (
                            <button
                              key={`${item.label}-${item.to}-${item.state?.openSection || 'page'}`}
                              type='button'
                              onClick={() => handleOpenShortcut(item)}
                              className='group flex flex-col items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-3 text-center transition hover:bg-slate-100'
                            >
                              <span className='flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700 transition group-hover:bg-slate-900 group-hover:text-white'>
                                <item.icon className='h-4 w-4' />
                              </span>
                              <span className='text-xs font-semibold text-slate-700'>{item.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className='relative' ref={accountRef}>
                  <button
                    type='button'
                    aria-label='Open account'
                    onClick={() => {
                      setAccountOpen((current) => !current)
                      setBellOpen(false)
                      setAppsOpen(false)
                    }}
                    className={`flex h-10 w-10 items-center justify-center rounded-lg border text-slate-900 transition ${
                      accountOpen
                        ? 'border-sky-300 bg-sky-50'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <span className='flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-950'>
                      {accountInitial}
                    </span>
                  </button>

                  {accountOpen && (
                    <div className='absolute right-0 top-12 z-50 w-[min(20rem,calc(100vw-2rem))] rounded-lg border border-slate-200 bg-white p-4 shadow-lg'>
                      <div className='rounded-lg bg-slate-50 px-5 py-5 text-center'>
                        <div className='flex justify-center'>
                          <span className='flex h-14 w-14 items-center justify-center rounded-lg border border-slate-300 bg-white text-xl font-bold text-slate-900'>
                            {accountInitial}
                          </span>
                        </div>
                        <h3 className='mt-3 text-xl font-semibold text-slate-950'>Hi, {accountLabel}!</h3>
                      </div>

                      <div className='mt-4 space-y-2 rounded-lg bg-slate-50 p-2'>
                        <Button
                          type='button'
                          onClick={() => handleOpenShortcut({ to: '/settings' })}
                          variant='secondary'
                          size='lg'
                          fullWidth
                          className='rounded-lg text-base'
                        >
                          <Settings className='h-4 w-4' />
                          Settings
                        </Button>
                        <Button
                          type='button'
                          onClick={handleLogout}
                          variant='danger'
                          size='lg'
                          fullWidth
                          className='rounded-lg text-base'
                        >
                          <LogOut className='h-4 w-4' />
                          Logout
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className='border-t border-slate-100 bg-white'>
          <div className='mx-auto flex w-full max-w-7xl items-center justify-center gap-2 md:gap-6 overflow-x-auto px-4 py-2 sm:px-6 lg:px-8 hide-scrollbar'>
            <button 
              type='button' 
              onClick={() => updateFilter('category', '')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full whitespace-nowrap transition ${!searchParams.get('category') ? 'bg-sky-50 text-sky-700' : 'text-slate-600 hover:bg-slate-50 hover:text-sky-600'}`}
            >
              <LayoutGrid className={`h-4 w-4 ${!searchParams.get('category') ? 'text-sky-600' : 'text-slate-500'}`} />
              <span className={`text-sm ${!searchParams.get('category') ? 'font-bold' : 'font-medium'}`}>All Categories</span>
            </button>
            
            {[
              { id: 'PRODUCE', label: 'Produce', Icon: Apple },
              { id: 'DAIRY', label: 'Dairy', Icon: Droplet },
              { id: 'BAKERY', label: 'Bakery', Icon: Cake },
              { id: 'BEVERAGES', label: 'Beverages', Icon: Coffee },
              { id: 'SNACKS', label: 'Snacks', Icon: Cookie },
              { id: 'HOUSEHOLD', label: 'Household', Icon: Home },
              { id: 'ESSENTIALS', label: 'Essentials', Icon: Package2 }
            ].map(({ id, label, Icon }) => (
              <button 
                key={id}
                type='button' 
                onClick={() => updateFilter('category', id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full whitespace-nowrap transition ${searchParams.get('category') === id ? 'bg-sky-50 text-sky-700' : 'text-slate-600 hover:bg-slate-50 hover:text-sky-600'}`}
              >
                <Icon className={`h-4 w-4 ${searchParams.get('category') === id ? 'text-sky-600' : 'text-slate-500'}`} />
                <span className={`text-sm ${searchParams.get('category') === id ? 'font-bold' : 'font-medium'}`}>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className='mx-auto min-h-screen max-w-7xl px-4 sm:px-6 lg:px-8'>
        <main className='min-w-0 py-5'>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AppShell