import { useEffect, useRef, useState } from 'react'
import { Bell, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { clearSession, getSession } from '../utils/session'

function Header({
  eyebrow,
  title,
  description,
  tone = 'light',
  notifications = [],
  notificationTitle = 'Notifications',
  notificationSubtitle = 'Recent alerts',
  notificationEmpty = 'No notifications right now.',
  onNotificationClick,
  notificationStorageKey,
}) {
  const { username } = getSession()
  const navigate = useNavigate()
  const notificationRef = useRef(null)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [readNotificationIds, setReadNotificationIds] = useState(() => {
    if (!notificationStorageKey) {
      return []
    }

    try {
      return JSON.parse(window.localStorage.getItem(notificationStorageKey) || '[]')
    } catch {
      return []
    }
  })
  const isCyber = tone === 'cyber'
  const accountInitial = (username || 'user').charAt(0).toUpperCase()
  const handleLogout = () => {
    clearSession()
    navigate('/')
  }
  const unreadNotifications = notifications.filter(
    (notification) => !readNotificationIds.includes(String(notification.id)),
  )
  const markNotificationRead = (notificationId) => {
    if (!notificationStorageKey) {
      return
    }

    const nextIds = [...new Set([...readNotificationIds, String(notificationId)])]
    setReadNotificationIds(nextIds)
    window.localStorage.setItem(notificationStorageKey, JSON.stringify(nextIds))
  }

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!notificationRef.current?.contains(event.target)) {
        setNotificationsOpen(false)
      }
    }

    window.addEventListener('pointerdown', handlePointerDown)

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [])

  return (
    <header
      className={
        isCyber
          ? 'rounded-4xl border border-violet-300/20 bg-white/[0.06] p-5 shadow-[0_0_45px_rgba(168,85,247,0.12)] backdrop-blur transition duration-200 ease-out'
          : 'rounded-4xl border border-slate-100 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.07)] transition duration-200 ease-out'
      }
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className={isCyber ? 'text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300' : 'text-xs font-semibold uppercase tracking-[0.3em] text-sky-700'}>
            {eyebrow}
          </p>
          <h1 className={isCyber ? 'mt-2 text-3xl font-semibold tracking-tight text-white' : 'mt-2 text-3xl font-semibold tracking-tight text-slate-950'}>
            {title}
          </h1>
          {description && (
            <p className={isCyber ? 'mt-2 max-w-2xl text-sm text-slate-400' : 'mt-2 max-w-2xl text-sm text-slate-500'}>
              {description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative" ref={notificationRef}>
            <button
              type="button"
              aria-label="Notifications"
              onClick={() => setNotificationsOpen((current) => !current)}
              className={
                isCyber
                  ? 'relative flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-200 transition duration-200 hover:-translate-y-0.5 hover:bg-cyan-400/15'
                  : 'relative flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 text-slate-700 transition duration-200 hover:-translate-y-0.5 hover:bg-slate-100'
              }
            >
              <Bell className="h-5 w-5" />
              {unreadNotifications.length > 0 && (
                <span className="absolute -right-1 -top-1 animate-pulse rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  {unreadNotifications.length}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 top-16 z-50 w-88 animate-[popIn_0.2s_ease-out] rounded-4xl border border-white/70 bg-white/95 p-4 text-slate-900 shadow-[0_24px_80px_rgba(15,23,42,0.18)] backdrop-blur">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-700">
                      {notificationTitle}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">{notificationSubtitle}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotificationsOpen(false)}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    Close
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  {notifications.length === 0 && (
                    <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                      {notificationEmpty}
                    </p>
                  )}

                  {notifications.map((notification) => (
                    <button
                      key={notification.id}
                      type="button"
                      onClick={() => {
                        markNotificationRead(notification.id)
                        setNotificationsOpen(false)
                        onNotificationClick?.(notification)
                      }}
                      className="w-full animate-[fadeSlideIn_0.22s_ease-out] rounded-3xl border border-slate-100 bg-slate-50 px-4 py-4 text-left transition duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_14px_36px_rgba(15,23,42,0.08)]"
                    >
                      <p className="text-sm font-semibold text-slate-950">{notification.title}</p>
                      <p className="mt-1 text-sm text-slate-500">{notification.message}</p>
                      {notification.meta && (
                        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                          {notification.meta}
                        </p>
                      )}
                      {!readNotificationIds.includes(String(notification.id)) && (
                        <span className="mt-3 inline-flex rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
                          New
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div
            className={
              isCyber
                ? 'flex h-12 w-12 items-center justify-center rounded-full border border-violet-300/20 bg-violet-400/10 text-white'
                : 'flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900'
            }
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm font-bold text-slate-950">
              {accountInitial}
            </span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className={
              isCyber
                ? 'flex h-12 items-center justify-center gap-2 rounded-2xl border border-rose-400/25 bg-rose-500/10 px-4 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/20'
                : 'flex h-12 items-center justify-center gap-2 rounded-2xl border border-rose-100 bg-rose-50 px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-100'
            }
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header
