import { useEffect, useState } from 'react'
import { getApiErrorMessage } from '../api/client'
import Card from '../components/ui/Card'
import { getAdminDashboard } from '../services/adminService'

function AdminDashboardPage() {
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getAdminDashboard()
      .then((data) => setSummary(data))
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
      <Card
        eyebrow="Admin Dashboard"
        title="Platform overview"
        description="Track platform-wide users, products, categories, pending purchase flow, and stock pressure."
      />

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
