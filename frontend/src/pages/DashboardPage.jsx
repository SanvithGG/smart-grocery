import { useEffect, useState } from 'react'
import api from '../api/client'

const summaryCards = [
  { key: 'totalItems', label: 'Total Items', accent: 'from-sky-500 to-cyan-400' },
  { key: 'pendingItems', label: 'Pending', accent: 'from-amber-500 to-orange-400' },
  { key: 'purchasedItems', label: 'Purchased', accent: 'from-emerald-500 to-lime-400' },
  { key: 'lowStockItems', label: 'Low Stock', accent: 'from-rose-500 to-pink-400' },
]

function DashboardPage() {
  const [summary, setSummary] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [lowStockItems, setLowStockItems] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [summaryResponse, recommendationsResponse, lowStockResponse] = await Promise.all([
          api.get('/api/grocery/summary'),
          api.get('/api/grocery/recommendations'),
          api.get('/api/grocery/low-stock'),
        ])

        setSummary(summaryResponse.data)
        setRecommendations(recommendationsResponse.data)
        setLowStockItems(lowStockResponse.data)
      } catch (requestError) {
        setError('Unable to load dashboard data. Start the backend and login again.')
      }
    }

    loadDashboard()
  }, [])

  return (
    <div className="space-y-6">
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

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-[32px] border border-white/60 bg-white/80 p-6 shadow-[0_15px_50px_rgba(15,23,42,0.08)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-700">
                Smart Picks
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                Recommendation queue
              </h2>
            </div>
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

        <article className="rounded-[32px] border border-white/60 bg-slate-950 p-6 text-white shadow-[0_15px_50px_rgba(15,23,42,0.18)]">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">
            Action Board
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Low-stock watchlist</h2>

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
    </div>
  )
}

export default DashboardPage
