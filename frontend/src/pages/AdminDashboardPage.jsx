import { useEffect, useState } from 'react'
import api, { getApiErrorMessage } from '../api/client'

function AdminDashboardPage() {
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/api/admin/dashboard')
      .then(({ data }) => setSummary(data))
      .catch((requestError) => {
        setError(getApiErrorMessage(requestError, 'Unable to load admin dashboard.'))
      })
  }, [])

  const cards = summary
    ? [
        ['Users', summary.totalUsers],
        ['Products', summary.totalProducts],
        ['Purchased', summary.purchasedProducts],
        ['Pending', summary.pendingProducts],
        ['Categories', summary.totalCategories],
        ['Low Stock', summary.lowStockProducts],
      ]
    : []

  return (
    <div className="space-y-6">
      <section className="rounded-4xl border border-white/70 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
        <p className="text-sm font-semibold uppercase tracking-[0.32em] text-sky-700">Admin Dashboard</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          Platform overview
        </h2>
        <p className="mt-3 max-w-2xl text-sm text-slate-600">
          Track platform-wide users, products, categories, pending purchase flow, and stock pressure.
        </p>
      </section>

      {error && (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map(([label, value]) => (
          <article
            key={label}
            className="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-[0_16px_45px_rgba(15,23,42,0.06)]"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">{label}</p>
            <p className="mt-4 text-4xl font-semibold text-slate-950">{value}</p>
          </article>
        ))}
      </section>
    </div>
  )
}

export default AdminDashboardPage
