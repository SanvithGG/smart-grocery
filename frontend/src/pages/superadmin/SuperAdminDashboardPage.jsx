import { useEffect, useState } from 'react'
import { AlertTriangle, Boxes, Cpu, ShieldCheck, Users } from 'lucide-react'
import { getApiErrorMessage } from '../../api/client'
import DashboardBarChart from '../../components/charts/DashboardBarChart'
import ChartCard from '../../components/charts/ChartCard'
import DashboardLineChart from '../../components/charts/DashboardLineChart'
import Card from '../../components/ui/Card'
import SmartInsightCard from '../../components/ui/SmartInsightCard'
import {
  getAdminDashboard,
  getAdminReports,
  getAdminSellerOrders,
  getAdminSellerProducts,
} from '../../services/adminService'
import { buildSuperAdminInsights } from '../../utils/smartSuggestions'

function SuperAdminDashboardPage() {
  const [summary, setSummary] = useState(null)
  const [report, setReport] = useState(null)
  const [sellerProducts, setSellerProducts] = useState([])
  const [sellerOrders, setSellerOrders] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([getAdminDashboard(), getAdminReports(), getAdminSellerProducts(), getAdminSellerOrders()])
      .then(([dashboardData, reportData, sellerProductsData, sellerOrdersData]) => {
        setSummary(dashboardData)
        setReport(reportData)
        setSellerProducts(sellerProductsData)
        setSellerOrders(sellerOrdersData)
      })
      .catch((requestError) => {
        setError(getApiErrorMessage(requestError, 'Unable to load super admin dashboard.'))
      })
  }, [])

  const systemActivityData = [
    { label: 'Users', value: summary?.totalUsers ?? 0 },
    { label: 'User Items', value: summary?.totalProducts ?? 0 },
    { label: 'Seller Items', value: sellerProducts.length },
    { label: 'Seller Orders', value: sellerOrders.length },
    { label: 'Pending', value: sellerOrders.filter((order) => order.status === 'PENDING').length },
    { label: 'Delivered', value: sellerOrders.filter((order) => order.status === 'DELIVERED').length },
  ]
  const productDistributionData = [
    ...(report?.categoryBreakdown || []).map((category) => ({
      label: category.name,
      value: category.totalProducts,
    })),
    ...Object.entries(
      sellerProducts.reduce((counts, product) => ({
        ...counts,
        [product.category]: (counts[product.category] || 0) + 1,
      }), {}),
    ).map(([label, value]) => ({ label, value })),
  ].slice(0, 8)

  const stats = [
    { label: 'Total Users', value: summary?.totalUsers ?? 0, icon: Users, tone: 'text-sky-700 bg-sky-50' },
    { label: 'Total Products', value: summary?.totalProducts ?? 0, icon: Boxes, tone: 'text-emerald-700 bg-emerald-50' },
    { label: 'System Load', value: '68%', icon: Cpu, tone: 'text-violet-700 bg-violet-50' },
    { label: 'Low Stock Alerts', value: summary?.lowStockProducts ?? 0, icon: AlertTriangle, tone: 'text-amber-700 bg-amber-50' },
  ]
  const superAdminInsights = buildSuperAdminInsights({
    summary,
    report,
    sellerProducts,
    sellerOrders,
  })

  return (
    <div className="space-y-6">
      <Card
        eyebrow="Super Admin Dashboard"
        title="Platform command center"
        description="Track users, products, system activity, stock pressure, and platform-wide operational signals."
      />

      {error && (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const StatIcon = stat.icon

          return (
            <article
              key={stat.label}
              className="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-[0_16px_45px_rgba(15,23,42,0.06)]"
            >
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${stat.tone}`}>
                <StatIcon className="h-5 w-5" />
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">{stat.label}</p>
              <p className="mt-3 text-4xl font-semibold text-slate-950">{stat.value}</p>
            </article>
          )
        })}
      </section>

      {superAdminInsights.length > 0 && (
        <section className="rounded-4xl border border-white/70 bg-white/85 p-6 shadow-[0_15px_50px_rgba(15,23,42,0.08)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-700">
                Platform Smart Insights
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                Global signals from users, sellers, and stock
              </h2>
            </div>
            <span className="rounded-full bg-cyan-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">
              {superAdminInsights.length} signals
            </span>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {superAdminInsights.map((insight) => (
              <SmartInsightCard key={insight.id} {...insight} />
            ))}
          </div>
        </section>
      )}

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <ChartCard title="System Activity" subtitle="Weekly activity stream">
          <DashboardLineChart data={systemActivityData} tone="cyber" color="#22d3ee" />
        </ChartCard>

        <ChartCard title="Product Distribution" subtitle="Category spread">
          <DashboardBarChart data={productDistributionData} tone="cyber" color="#a78bfa" />
        </ChartCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        {[
          { label: 'Security Pulse', value: 'Stable', icon: ShieldCheck, tone: 'text-emerald-700 bg-emerald-50' },
          { label: 'Purchase Queue', value: summary?.pendingProducts ?? 0, icon: Boxes, tone: 'text-sky-700 bg-sky-50' },
          { label: 'Purchased Items', value: summary?.purchasedProducts ?? 0, icon: AlertTriangle, tone: 'text-amber-700 bg-amber-50' },
        ].map((item) => {
          const PulseIcon = item.icon

          return (
            <article key={item.label} className="rounded-3xl border border-white/70 bg-white/85 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">{item.label}</p>
                  <p className="mt-3 text-3xl font-semibold text-slate-950">{item.value}</p>
                </div>
                <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${item.tone}`}>
                  <PulseIcon className="h-5 w-5" />
                </span>
              </div>
            </article>
          )
        })}
      </section>
    </div>
  )
}

export default SuperAdminDashboardPage
