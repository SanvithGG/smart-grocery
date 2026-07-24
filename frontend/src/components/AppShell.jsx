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
  LayoutGrid,
  Menu,
  X
} from 'lucide-react'
import { NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import Button from './ui/Button'
import { useToast } from './ui/toast'
import { acknowledgeExpiryAlert, getExpiryAlerts, getGroceries } from '../services/groceryService'
import { clearSession, getSession } from '../utils/session'
import RecipeModal from './RecipeModal'

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
  const { username, token } = getSession()
  const isLoggedIn = !!token
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
  const [recipeModalOpen, setRecipeModalOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showBanner, setShowBanner] = useState(true)

  const updateFilter = (key, value) => {
    const params = new URLSearchParams(searchParams)
    if (value) params.set(key, value)
    else params.delete(key)
    
    if (location.pathname !== '/') {
      navigate('/?' + params.toString())
      setTimeout(() => {
        document.getElementById('shop-catalog')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 300)
    } else {
      setSearchParams(params, { replace: true })
      document.getElementById('shop-catalog')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const toggleCategory = (id) => {
    const params = new URLSearchParams(searchParams)
    if (!id) {
       params.delete('category')
    } else {
       const currentCategories = params.getAll('category')
       if (currentCategories.includes(id)) {
          params.delete('category')
          currentCategories.filter(c => c !== id).forEach(c => params.append('category', c))
       } else {
          params.append('category', id)
       }
    }

    if (location.pathname !== '/') {
      navigate('/?' + params.toString())
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
    if (!isLoggedIn) return
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
        // Notifications are accessible via the bell icon — no auto-popup
      })
      .catch(() => {
        if (!cancelled) {
          setNotifications([])
        }
      })

    return () => {
      cancelled = true
    }
  }, [isLoggedIn])

  useEffect(() => {
    if (!isLoggedIn) return
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
  }, [location.pathname, isLoggedIn])

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
  
  const activeCategories = searchParams.getAll('category')
  const activeFilterCount = activeCategories.length + (searchParams.get('search') ? 1 : 0)

  const navigationItems = [
    { to: '/', label: 'Home', icon: Home, end: true },
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, hasNewContent: true },
    { to: '/inventory', label: 'Inventory', icon: Package2, hasNewContent: false },
    { to: '/shopping-list', label: 'Buy Queue', icon: ShoppingCart, hasNewContent: false },
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

      {showBanner && (
        <div className='flex items-center justify-between px-4 py-2 text-sm bg-[#f3f3f3] border-b border-[#e5e5e5]'>
          <span className='font-medium text-slate-700 opacity-90 mx-auto md:mx-0'>
            Smart Grocery Pass <span className='mx-2 text-lg'>☺</span> Get free delivery for just $12/month
          </span>
          <button onClick={() => setShowBanner(false)} className='hidden md:flex items-center justify-center min-w-11 min-h-11 text-slate-500 hover:text-slate-800 transition rounded-lg hover:bg-slate-200/50 -mr-2'>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <header className='sticky top-0 z-40 w-full bg-white border-b border-[#e5e5e5] shadow-sm'>
        <div className='mx-auto max-w-7xl flex flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between sm:px-6 lg:px-8'>
          
          <div className="flex items-center justify-between">
            <div className='flex items-center min-w-0 pr-4'>
              <p className='truncate text-3xl font-extrabold tracking-tighter text-slate-950'>S.</p>
              <nav className='hidden lg:flex items-center gap-6 ml-8'>
                {navigationItems.map((item, i) => (
                  <NavLink
                    key={`top-${item.to}`}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) => 
                      `flex items-center px-3 py-1.5 rounded-lg transition-all active:scale-95 text-[14px] font-semibold ${isActive ? 'text-slate-900 bg-slate-200/60' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span>{item.label}</span>
                        {item.hasNewContent && <span className='text-[10px] bg-slate-900 text-white px-1.5 py-0.5 rounded ml-1.5 font-bold uppercase tracking-wide leading-none'>New</span>}
                      </>
                    )}
                  </NavLink>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-1 md:hidden">
              <button
                onClick={() => {
                  setBellOpen((current) => !current)
                  setAppsOpen(false)
                  setAccountOpen(false)
                  setMenuOpen(false)
                }}
                className='flex items-center justify-center min-w-11 min-h-11 rounded-lg border border-transparent text-slate-700 transition hover:bg-slate-50 relative'
              >
                <Bell className='h-5 w-5' />
                {notifications.length > 0 && (
                  <span className='absolute right-2 top-2 rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-semibold text-white'>
                    {notifications.length}
                  </span>
                )}
              </button>

              <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center justify-center min-w-11 min-h-11 rounded-lg text-slate-700 hover:bg-slate-50 transition border border-slate-200 bg-white">
                 {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="w-full md:w-auto md:flex-1 md:max-w-md lg:max-w-xl">
             <div className='relative w-full'>
                <Search className='absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500' />
                <input
                  type='text'
                  value={searchParams.get('search') || ''}
                  onChange={(e) => updateFilter('search', e.target.value)}
                  placeholder='Search by Groceries'
                  className='w-full rounded-lg bg-[#efefef] py-2.5 pl-11 pr-4 text-sm font-medium outline-none transition focus:bg-[#e8e8e8] border border-transparent placeholder:text-slate-500 hover:bg-[#e8e8e8]'
                />
              </div>
          </div>

          <div className="hidden md:flex items-center gap-3 shrink-0">
              <div className='flex items-center gap-4 mr-2 text-[14px] font-semibold text-slate-700'>
                <button className='bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition whitespace-nowrap'>Be Pro</button>
              </div>

              <div className='relative' ref={bellRef}>
                <button
                  type='button'
                  aria-label='Open notifications'
                  onClick={() => {
                    setBellOpen((current) => !current)
                    setAppsOpen(false)
                    setAccountOpen(false)
                  }}
                  className='flex items-center justify-center min-w-11 min-h-11 rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 relative'
                >
                  <Bell className='h-5 w-5' />
                  {notifications.length > 0 && (
                    <span className='absolute right-1.5 top-1.5 rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-semibold text-white'>
                      {notifications.length}
                    </span>
                  )}
                </button>

                  {bellOpen && (
                    <div className='absolute right-0 top-14 z-50 w-[min(22rem,calc(100vw-2rem))] rounded-lg border border-slate-200 bg-white p-4 shadow-lg'>
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
                  onClick={() => {
                    setAppsOpen((current) => !current)
                    setBellOpen(false)
                    setAccountOpen(false)
                  }}
                  className={`flex items-center justify-center min-w-11 min-h-11 rounded-lg border text-slate-700 transition ${
                    appsOpen
                      ? 'border-sky-200 bg-sky-50'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <Grip className='h-5 w-5' />
                </button>

                  {appsOpen && (
                    <div className='absolute right-0 top-14 z-50 w-[min(24rem,calc(100vw-2rem))] rounded-lg border border-slate-200 bg-white p-4 shadow-lg'>
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

              {!isLoggedIn ? (
                <NavLink
                  to="/login"
                  className="flex items-center justify-center h-11 px-5 ml-2 rounded-lg font-semibold text-sm text-slate-900 border border-slate-200 bg-white hover:bg-slate-50 transition shadow-sm whitespace-nowrap"
                >
                  Log in
                </NavLink>
              ) : (
                <div className='relative flex flex-col items-center border-l border-slate-200 pl-4 ml-1' ref={accountRef}>
                   <button
                    onClick={() => {
                      setAccountOpen((current) => !current)
                      setBellOpen(false)
                      setAppsOpen(false)
                    }}
                    className={`flex items-center justify-center min-w-11 min-h-11 rounded-full border text-slate-900 transition ${
                      accountOpen ? 'border-sky-300 bg-sky-50' : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                   >
                    <span className='flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-950'>
                      {accountInitial}
                    </span>
                   </button>
                   <span className='mt-1 text-[11px] font-medium text-slate-500 leading-none'>
                     {accountLabel}
                   </span>

                  {accountOpen && (
                    <div className='absolute right-0 top-16 z-50 w-[min(20rem,calc(100vw-2rem))] rounded-lg border border-slate-200 bg-white p-4 shadow-lg'>
                      <div className='rounded-lg bg-slate-50 px-5 py-5 text-center'>
                        <div className='flex justify-center'>
                          <span className='flex h-14 w-14 items-center justify-center rounded-full border border-slate-300 bg-white text-xl font-bold text-slate-900'>
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
              )}
          </div>
        </div>

        <div className='hidden md:flex mx-auto w-full max-w-7xl items-center justify-between px-4 pb-3 sm:px-6 lg:px-8 gap-4'>
          <div className='flex items-center gap-2 overflow-x-auto hide-scrollbar flex-1'>
            <button 
              type='button' 
              onClick={() => toggleCategory('')}
              className={`flex items-center px-4 py-2 rounded-xl whitespace-nowrap transition border text-[13px] ${activeCategories.length === 0 ? 'bg-slate-900 border-slate-900 text-white font-semibold shadow-sm' : 'bg-transparent border-slate-200 text-slate-600 hover:bg-white hover:border-slate-300 hover:shadow-sm font-medium'}`}
            >
              All Categories <span className='ml-1 text-[10px] opacity-50'>▼</span>
            </button>
            
            {[
              { id: 'PRODUCE', label: 'Produce' },
              { id: 'DAIRY', label: 'Dairy' },
              { id: 'BAKERY', label: 'Bakery' },
              { id: 'BEVERAGES', label: 'Beverages' },
              { id: 'SNACKS', label: 'Snacks' },
              { id: 'HOUSEHOLD', label: 'Household' },
              { id: 'ESSENTIALS', label: 'Essentials' }
            ].map(({ id, label }) => (
              <button 
                key={id}
                type='button' 
                onClick={() => toggleCategory(id)}
                className={`flex items-center px-4 py-2 rounded-xl whitespace-nowrap transition border text-[13px] ${activeCategories.includes(id) ? 'bg-slate-900 border-slate-900 text-white font-semibold shadow-sm' : 'bg-transparent border-slate-200 text-slate-600 hover:bg-white hover:border-slate-300 hover:shadow-sm font-medium'}`}
              >
                {label} <span className='ml-1 text-[10px] opacity-50'>▼</span>
              </button>
            ))}
          </div>
          
          <div className='flex items-center shrink-0 pl-4 gap-3'>
            <button 
              onClick={() => setRecipeModalOpen(true)} 
              className='border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-950 px-4 py-2 rounded-xl transition whitespace-nowrap flex items-center gap-1.5 font-bold text-xs shadow-sm'
            >
              ✨ Smart Price Compare
            </button>

            {activeFilterCount > 0 && (
              <div className='flex items-center gap-3 mr-2'>
                <span className='flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-white text-[11px] font-bold'>
                  {activeFilterCount}
                </span>
                <button 
                  onClick={() => {
                    const params = new URLSearchParams(searchParams)
                    params.delete('category')
                    params.delete('search')
                    setSearchParams(params, { replace: true })
                    if (location.pathname !== '/') navigate('/?' + params.toString())
                  }}
                  className='flex items-center gap-1.5 text-[13px] font-medium text-slate-600 hover:text-slate-900 border border-slate-200 bg-white px-3 py-1.5 rounded-lg shadow-sm'
                >
                  Reset filters ⟳
                </button>
              </div>
            )}
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden flex flex-col gap-4 px-4 py-5 border-t border-[#e5e5e5] bg-white absolute w-full left-0 shadow-xl z-50">
             <div className="flex flex-wrap gap-2">
                <button 
                  type='button' 
                  onClick={() => { toggleCategory(''); setMenuOpen(false); }}
                  className={`flex items-center px-4 py-2.5 rounded-xl whitespace-nowrap transition border text-[13px] ${activeCategories.length === 0 ? 'bg-slate-900 border-slate-900 text-white font-semibold shadow-sm' : 'bg-transparent border-slate-200 text-slate-600 font-medium'}`}
                >
                  All Categories
                </button>
                {[
                  { id: 'PRODUCE', label: 'Produce' },
                  { id: 'DAIRY', label: 'Dairy' },
                  { id: 'BAKERY', label: 'Bakery' },
                  { id: 'BEVERAGES', label: 'Beverages' },
                  { id: 'SNACKS', label: 'Snacks' },
                  { id: 'HOUSEHOLD', label: 'Household' },
                  { id: 'ESSENTIALS', label: 'Essentials' }
                ].map(({ id, label }) => (
                  <button 
                    key={id}
                    type='button' 
                    onClick={() => { toggleCategory(id); setMenuOpen(false); }}
                    className={`flex items-center px-4 py-2.5 rounded-xl whitespace-nowrap transition border text-[13px] ${activeCategories.includes(id) ? 'bg-slate-900 border-slate-900 text-white font-semibold shadow-sm' : 'bg-transparent border-slate-200 text-slate-600 font-medium'}`}
                  >
                    {label}
                  </button>
                ))}
             </div>
             
             <div className="h-px bg-slate-200 my-1" />

             <button className='w-full bg-slate-900 text-white px-4 py-3.5 rounded-lg font-semibold text-[15px]'>Be Pro</button>
              <button onClick={() => { setRecipeModalOpen(true); setMenuOpen(false); }} className='w-full border border-slate-300 bg-white text-slate-900 px-4 py-3.5 rounded-lg font-semibold text-[15px] flex items-center justify-center gap-1.5'>✨ Smart Price Compare</button>
             
             {!isLoggedIn ? (
                <NavLink to="/login" onClick={() => setMenuOpen(false)} className="flex items-center justify-center w-full bg-sky-50 text-sky-700 px-4 py-3.5 rounded-lg font-semibold text-[15px]">Log in / Sign up</NavLink>
             ) : (
                <button onClick={() => { handleLogout(); setMenuOpen(false); }} className="flex items-center justify-center w-full bg-rose-50 text-rose-600 px-4 py-3.5 rounded-lg font-semibold text-[15px]">Log Out</button>
             )}
          </div>
        )}
      </header>

      <div className='mx-auto min-h-screen max-w-7xl px-4 sm:px-6 lg:px-8'>
        <main className='min-w-0 py-5'>
          <Outlet />
        </main>
      </div>

      <RecipeModal isOpen={recipeModalOpen} onClose={() => setRecipeModalOpen(false)} />
    </div>
  )
}

export default AppShell