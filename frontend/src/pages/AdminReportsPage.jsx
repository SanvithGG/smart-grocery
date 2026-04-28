import { useEffect, useState } from 'react'
import { getApiErrorMessage } from '../api/client'
import Card from '../components/ui/Card'
import { getAdminReports } from '../services/adminService'

function AdminReportsPage() {
  const [report, setReport] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getAdminReports()
      .then((data) => setReport(data))
      .catch((requestError) => {
        setError(getApiErrorMessage(requestError, 'Unable to load reports.'))
      })
  }, [])

  const summaryCards = report
    ? [
        ['Users', report.totalUsers],
        ['Products', report.totalProducts],
        ['Purchased', report.purchasedProducts],
        ['Pending', report.pendingProducts],
        ['Expiring Soon', report.expiringSoonProducts],
      ]
    : []

  return (
    <div className="space-y-6">
      <Card eyebrow="Reports / Analytics" title="Operational reporting" />

      {error && <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {summaryCards.map(([label, value]) => (
          <article key={label} className="rounded-3xl border border-white/70 bg-white/85 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">{label}</p>
            <p className="mt-4 text-3xl font-semibold text-slate-950">{value}</p>
          </article>
        ))}
      </section>

      {report && (
        <section className="grid gap-6 xl:grid-cols-2">
          <article className="rounded-4xl border border-white/70 bg-white/85 p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">Top Categories</p>
            <div className="mt-4 space-y-3">
              {report.topCategories.map((category) => (
                <div key={category.name} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  {category.name}: {category.totalProducts} items
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-4xl border border-white/70 bg-white/85 p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">Category Breakdown</p>
            <div className="mt-4 space-y-3">
              {report.categoryBreakdown.map((category) => (
                <div key={category.name} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  {category.name}: {category.totalProducts} total | {category.purchasedProducts} purchased | {category.pendingProducts} pending
                </div>
              ))}
            </div>
          </article>
        </section>
      )}
    </div>
  )
}

export default AdminReportsPage
