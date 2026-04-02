import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import api, { getApiErrorMessage } from '../api/client'

const summaryCards = [
  { key: 'totalItems', label: 'Total Items', accent: 'from-sky-500 to-cyan-400' },
  { key: 'pendingItems', label: 'Pending', accent: 'from-amber-500 to-orange-400' },
  { key: 'purchasedItems', label: 'Purchased', accent: 'from-emerald-500 to-lime-400' },
  { key: 'lowStockItems', label: 'Low Stock', accent: 'from-rose-500 to-pink-400' },
]

function DashboardPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [summary, setSummary] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [lowStockItems, setLowStockItems] = useState([])
  const [expiryAlerts, setExpiryAlerts] = useState([])
  const [myItems, setMyItems] = useState([])
  const [error, setError] = useState('')
  const [panelOpen, setPanelOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('')
  const [acknowledgingItemId, setAcknowledgingItemId] = useState('')

  const dashboardSections = [
    { key: 'recommendations', label: 'Smart Picks', sublabel: 'Recommendation queue' },
    { key: 'low-stock-watchlist', label: 'Action Board', sublabel: 'Low-stock watchlist' },
    { key: 'kitchen-reminders', label: 'Kitchen Reminder', sublabel: 'Expiry reminders' },
    { key: 'pending-focus', label: 'Pending Focus', sublabel: 'Items that still need action' },
    { key: 'recent-list', label: 'Recent List', sublabel: 'Latest grocery activity' },
  ]

  const formatExpiryDate = (value) => {
    if (!value) {
      return ''
    }

    return new Date(`${value}T00:00:00`).toLocaleDateString()
  }

  useEffect(() => {
    let cancelled = false

    Promise.all([
      api.get('/api/grocery/summary'),
      api.get('/api/grocery/recommendations'),
      api.get('/api/grocery/low-stock'),
      api.get('/api/grocery/expiry-alerts'),
      api.get('/api/grocery'),
    ])
      .then(([summaryResponse, recommendationsResponse, lowStockResponse, expiryAlertsResponse, myItemsResponse]) => {
        if (cancelled) {
          return
        }

        setSummary(summaryResponse.data)
        setRecommendations(recommendationsResponse.data)
        setLowStockItems(lowStockResponse.data)
        setExpiryAlerts(expiryAlertsResponse.data)
        setMyItems(myItemsResponse.data)
        setError('')
      })
      .catch((requestError) => {
        if (cancelled) {
          return
        }

        setError(
          getApiErrorMessage(requestError, 'Unable to load dashboard data. Start the backend and login again.'),
        )
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const sectionToOpen = location.state?.openSection

    if (!sectionToOpen) {
      return
    }

    setActiveSection(sectionToOpen)
    navigate(location.pathname, { replace: true, state: {} })
  }, [location.pathname, location.state, navigate])

  useEffect(() => {
    const handleDataChanged = () => {
      refreshDashboard()
    }

    window.addEventListener('grocery-data-changed', handleDataChanged)

    return () => {
      window.removeEventListener('grocery-data-changed', handleDataChanged)
    }
  }, [])
 
  const recentItems = [...myItems]
    .sort((first, second) => {
      if (first.lastPurchasedAt && second.lastPurchasedAt) {
        return new Date(second.lastPurchasedAt) - new Date(first.lastPurchasedAt)
      }

      if (second.lastPurchasedAt) {
        return 1
      }

      if (first.lastPurchasedAt) {
        return -1
      }

      return second.id - first.id
    })
    .slice(0, 5)
  const pendingItems = myItems.filter((item) => !item.purchased).slice(0, 5)

  const refreshDashboard = async () => {
    const [summaryResponse, recommendationsResponse, lowStockResponse, expiryAlertsResponse, myItemsResponse] = await Promise.all([
      api.get('/api/grocery/summary'),
      api.get('/api/grocery/recommendations'),
      api.get('/api/grocery/low-stock'),
      api.get('/api/grocery/expiry-alerts'),
      api.get('/api/grocery'),
    ])

    setSummary(summaryResponse.data)
    setRecommendations(recommendationsResponse.data)
    setLowStockItems(lowStockResponse.data)
    setExpiryAlerts(expiryAlertsResponse.data)
    setMyItems(myItemsResponse.data)
    setError('')
  }

  const handleAcknowledgeAlert = async (itemId) => {
    setAcknowledgingItemId(itemId)
    setError('')

    try {
      await api.post(`/api/grocery/${itemId}/acknowledge-expiry-alert`)
      await refreshDashboard()
      window.dispatchEvent(new Event('grocery-data-changed'))
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Could not delete this kitchen reminder.'))
    } finally {
      setAcknowledgingItemId('')
    }
  }

  const renderActiveSection = () => {
    if (activeSection === 'recommendations') {
      return (
        <section className="grid gap-6">
          <article className="rounded-[32px] border border-white/60 bg-white/80 p-6 shadow-[0_15px_50px_rgba(15,23,42,0.08)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600">
                {recommendations.length} suggestions
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {recommendations.length === 0 && (
                <p className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                  No recommendations yet. Add and update groceries to generate insights.
                </p>
              )}

              {recommendations.map((item) => (
                <div
                  key={`${item.itemName}-${item.category}`}
                  className="rounded-3xl border border-slate-100 bg-slate-50 px-5 py-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-slate-900">{item.itemName}</p>
                      <p className="text-sm text-slate-500">{item.category}</p>
                    </div>
                    <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold tracking-[0.2em] text-white">
                      {item.priority}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">{item.reason}</p>
                </div>
              ))}
            </div>
          </article>
        </section>
      )
    }

    if (activeSection === 'low-stock-watchlist') {
      return (
        <section className="grid gap-6">
          <article className="rounded-[32px] border border-white/60 bg-slate-950 p-6 text-white shadow-[0_15px_50px_rgba(15,23,42,0.18)]">
            <div className="mt-6 space-y-4">
              {lowStockItems.length === 0 && (
                <p className="rounded-3xl border border-white/10 bg-white/5 px-4 py-6 text-sm text-slate-300">
                  No urgent restock items right now.
                </p>
              )}

              {lowStockItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold">{item.name}</p>
                      <p className="text-sm text-slate-300">{item.category}</p>
                    </div>
                    <div className="rounded-full border border-amber-300/40 bg-amber-300/10 px-3 py-1 text-sm font-semibold text-amber-200">
                      Qty {item.quantity}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>
      )
    }

    if (activeSection === 'pending-focus') {
      return (
        <section className="grid gap-6">
          <article className="rounded-[32px] border border-white/60 bg-white/80 p-6 shadow-[0_15px_50px_rgba(15,23,42,0.08)]">
            <div className="mt-6 space-y-4">
              {pendingItems.length === 0 && (
                <p className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                  No pending items. Your list is fully handled.
                </p>
              )}

              {pendingItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-3xl border border-slate-100 bg-slate-50 px-5 py-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold text-slate-900">{item.name}</p>
                      <p className="text-sm text-slate-500">{item.category}</p>
                    </div>
                    <div className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-700">
                      Qty {item.quantity}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>
      )
    }

    if (activeSection === 'kitchen-reminders') {
      return (
        <section className="grid gap-6">
          <article className="rounded-[32px] border border-white/60 bg-white/80 p-6 shadow-[0_15px_50px_rgba(15,23,42,0.08)]">
            <div className="flex items-center justify-between gap-3">
              <div className="rounded-full bg-amber-100 px-4 py-2 text-sm font-medium text-amber-800">
                {expiryAlerts.length} active alerts
              </div>
            </div>

            <div className="mt-6 grid gap-4">
              {expiryAlerts.length === 0 && (
                <p className="rounded-3xl border border-dashed border-amber-200 bg-amber-50 px-4 py-6 text-sm text-amber-800">
                  No expiry reminders right now.
                </p>
              )}

              {expiryAlerts.map((alert) => (
                <article
                  key={alert.itemId}
                  className="rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-slate-900">{alert.itemName}</p>
                      <p className="text-sm text-slate-500">
                        {alert.category} | Expires {formatExpiryDate(alert.expiryDate)}
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold tracking-[0.2em] text-amber-800">
                      {alert.severity}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-slate-700">{alert.message}</p>
                  <button
                    type="button"
                    onClick={() => handleAcknowledgeAlert(alert.itemId)}
                    disabled={acknowledgingItemId === alert.itemId}
                    className="mt-4 rounded-full border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-900 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {acknowledgingItemId === alert.itemId ? 'Deleting...' : 'Delete Reminder'}
                  </button>
                </article>
              ))}
            </div>
          </article>
        </section>
      )
    }

    return (
      <section className="grid gap-6">
        <article className="rounded-[32px] border border-white/60 bg-white/80 p-6 shadow-[0_15px_50px_rgba(15,23,42,0.08)]">
          <div className="mt-6 space-y-4">
            {recentItems.length === 0 && (
              <p className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                No grocery activity yet.
              </p>
            )}

            {recentItems.map((item) => (
              <div
                key={item.id}
                className="rounded-3xl border border-slate-100 bg-slate-50 px-5 py-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-slate-900">{item.name}</p>
                    <p className="text-sm text-slate-500">{item.category}</p>
                  </div>
                  <div className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-700">
                    {item.purchased ? 'Purchased' : 'Pending'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    )
  }

  return (
    <div className="space-y-6">
      {(panelOpen || activeSection) && (
        <button
          type="button"
          aria-label="Close dashboard overlays"
          onClick={() => {
            setPanelOpen(false)
            setActiveSection('')
          }}
          className="fixed inset-0 z-30 bg-slate-950/25"
        />
      )}

      <section id="overview" className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="overflow-hidden rounded-[32px] border border-sky-100 bg-[linear-gradient(135deg,_rgba(15,23,42,0.96),_rgba(30,41,59,0.92)_55%,_rgba(14,165,233,0.72))] p-6 text-white shadow-[0_20px_80px_rgba(15,23,42,0.18)]">
          <div className="flex items-start justify-between gap-4">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-sky-200">
              Dashboard
            </p>
            <button
              type="button"
              aria-label="Open dashboard sections"
              onClick={() => setPanelOpen(true)}
              className="relative z-40 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              ...
            </button>
          </div>
          <h2 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight">
            See the grocery list, stock pressure, and next actions in one place.
          </h2>
          <p className="mt-4 max-w-xl text-sm text-slate-200 sm:text-base">
            This view is now focused on operational data. Browse and quick-add items from the
            Home page, then use this screen for decisions, including reminders for kitchen items
            that are close to expiring or expire today.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/inventory"
              className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
            >
              Open Inventory
            </Link>
            <Link
              to="/"
              className="rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              Back to Home
            </Link>
          </div>
        </article>

        <article className="rounded-[32px] border border-white/60 bg-white/80 p-6 shadow-[0_15px_50px_rgba(15,23,42,0.08)]">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
            Snapshot
          </p>
          <div className="mt-5 space-y-4">
            <div className="rounded-3xl bg-amber-50 px-5 py-4">
              <p className="text-xs uppercase tracking-[0.25em] text-amber-700">Pending Items</p>
              <p className="mt-2 text-3xl font-semibold text-amber-950">
                {summary ? summary.pendingItems : '--'}
              </p>
            </div>
            <div className="rounded-3xl bg-rose-50 px-5 py-4">
              <p className="text-xs uppercase tracking-[0.25em] text-rose-700">Low Stock</p>
              <p className="mt-2 text-3xl font-semibold text-rose-950">
                {summary ? summary.lowStockItems : '--'}
              </p>
            </div>
            <div className="rounded-3xl bg-emerald-50 px-5 py-4">
              <p className="text-xs uppercase tracking-[0.25em] text-emerald-700">Purchased</p>
              <p className="mt-2 text-3xl font-semibold text-emerald-950">
                {summary ? summary.purchasedItems : '--'}
              </p>
            </div>
          </div>
        </article>
      </section>

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[300px] flex-col border-r border-white/70 bg-[linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(241,245,249,0.94))] p-5 shadow-[0_24px_80px_rgba(15,23,42,0.18)] backdrop-blur transition-transform duration-300 ${
          panelOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-700">
              Dashboard Menu
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              Open a section
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Pick a dashboard block to open it in the main view.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close dashboard sections"
            onClick={() => setPanelOpen(false)}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            X
          </button>
        </div>

        <div className="mt-8 space-y-3">
          {dashboardSections.map((section) => (
            <button
              key={section.key}
              type="button"
              onClick={() => {
                setActiveSection(section.key)
                setPanelOpen(false)
              }}
              className={`block w-full rounded-[24px] border px-4 py-4 text-left transition ${
                activeSection === section.key
                  ? 'border-slate-900 bg-slate-950 text-white shadow-[0_16px_32px_rgba(15,23,42,0.16)]'
                  : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <p className="text-sm font-semibold">{section.label}</p>
              <p className={`mt-1 text-xs ${activeSection === section.key ? 'text-slate-300' : 'text-slate-500'}`}>
                {section.sublabel}
              </p>
            </button>
          ))}
        </div>
      </aside>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <article
            key={card.key}
            className="overflow-hidden rounded-[28px] border border-white/60 bg-white/80 p-5 shadow-[0_15px_50px_rgba(15,23,42,0.08)]"
          >
            <div className={`h-2 w-24 rounded-full bg-gradient-to-r ${card.accent}`} />
            <p className="mt-5 text-sm font-medium text-slate-500">{card.label}</p>
            <p className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
              {summary ? summary[card.key] : '--'}
            </p>
          </article>
        ))}
      </section>

      {error && (
        <div className="rounded-[28px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {activeSection && (
        <section className="fixed inset-0 z-40 flex items-center justify-center p-4 sm:p-6">
          <div
            className={`relative z-50 w-full max-w-4xl rounded-[36px] p-6 shadow-[0_28px_120px_rgba(15,23,42,0.22)] backdrop-blur sm:p-8 ${
              activeSection === 'low-stock-watchlist'
                ? 'border border-slate-800 bg-[linear-gradient(180deg,_rgba(2,6,23,0.98),_rgba(15,23,42,0.96))] text-white'
                : 'border border-white/70 bg-[linear-gradient(180deg,_rgba(255,255,255,0.97),_rgba(248,250,252,0.95))]'
            }`}
          >
            <div
              className={`flex flex-wrap items-center justify-between gap-3 pb-4 ${
                activeSection === 'low-stock-watchlist' ? 'border-b border-white/10' : 'border-b border-slate-200'
              }`}
            >
              <div>
                <p
                  className={`text-xs font-semibold uppercase tracking-[0.32em] ${
                    activeSection === 'low-stock-watchlist' ? 'text-emerald-300' : 'text-sky-700'
                  }`}
                >
                  {dashboardSections.find((section) => section.key === activeSection)?.label}
                </p>
                <h2
                  className={`mt-2 text-2xl font-semibold tracking-tight ${
                    activeSection === 'low-stock-watchlist' ? 'text-white' : 'text-slate-950'
                  }`}
                >
                  {dashboardSections.find((section) => section.key === activeSection)?.sublabel}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveSection('')}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeSection === 'low-stock-watchlist'
                    ? 'border border-white/10 bg-white/5 text-white hover:bg-white/10'
                    : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                Cancel
              </button>
            </div>

            <div className="mt-6 max-h-[70vh] overflow-y-auto pr-1">{renderActiveSection()}</div>
          </div>
        </section>
      )}
    </div>
  )
}

export default DashboardPage
