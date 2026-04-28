import { useEffect, useState } from 'react'
import { BarChart3, LineChart, Store, Users } from 'lucide-react'
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
  getAdminUsers,
} from '../../services/adminService'
import { buildSuperAdminInsights } from '../../utils/smartSuggestions'

function SuperAdminAnalyticsPage() {
  const [dashboard, setDashboard] = useState(null)
  const [report, setReport] = useState(null)
  const [users, setUsers] = useState([])
  const [sellerProducts, setSellerProducts] = useState([])
  const [sellerOrders, setSellerOrders] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      getAdminDashboard(),
      getAdminReports(),
      getAdminUsers(),
      getAdminSellerProducts(),
      getAdminSellerOrders(),
    ])
      .then(([dashboardData, reportData, usersData, sellerProductsData, sellerOrdersData]) => {
        setDashboard(dashboardData)
        setReport(reportData)
        setUsers(usersData)
        setSellerProducts(sellerProductsData)
        setSellerOrders(sellerOrdersData)
      })
      .catch((requestError) => {
        setError(getApiErrorMessage(requestError, 'Unable to load superadmin analytics.'))
      })
  }, [])

  const sellerCount = users.filter((user) => user.role === 'SELLER').length
  const userCount = users.filter((user) => user.role === 'USER').length
  const superAdminCount = users.filter((user) => user.role === 'SUPER_ADMIN').length
  const roleMixData = [
    { label: 'Users', value: userCount },
    { label: 'Sellers', value: sellerCount },
    { label: 'Admins', value: superAdminCount },
  ]
  const categoryData = (report?.categoryBreakdown || []).map((category) => ({
    label: category.name,
    value: category.totalProducts,
  }))
  const systemActivityData = [
    { label: 'Accounts', value: users.length },
    { label: 'Sellers', value: sellerCount },
    { label: 'User Items', value: report?.totalProducts ?? 0 },
    { label: 'Seller Items', value: sellerProducts.length },
    { label: 'Orders', value: sellerOrders.length },
    { label: 'Delivered', value: sellerOrders.filter((order) => order.status === 'DELIVERED').length },
  ]
  const stats = report && dashboard
    ? [
        { label: 'Total Users', value: report.totalUsers, icon: Users, tone: 'text-sky-700 bg-sky-50' },
        { label: 'Sellers', value: sellerCount, icon: Store, tone: 'text-emerald-700 bg-emerald-50' },
        { label: 'Products', value: report.totalProducts, icon: BarChart3, tone: 'text-violet-700 bg-violet-50' },
        { label: 'Low Stock', value: dashboard.lowStockProducts, icon: LineChart, tone: 'text-amber-700 bg-amber-50' },
      ]
    : []
  const superAdminInsights = buildSuperAdminInsights({
    summary: dashboard,
    report,
    users,
    sellerProducts,
    sellerOrders,
  })

  return (
    <div className="space-y-6">
      <Card
        eyebrow="Super Admin Analytics"
        title="Global intelligence"
        description="Role mix, product movement, category distribution, and operational health."
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
            <article key={stat.label} className="rounded-3xl border border-white/70 bg-white/85 p-5">
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
                Operational signals from live analytics
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

      <section className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Role Mix" subtitle="Account distribution">
          <DashboardBarChart data={roleMixData} tone="cyber" color="#34d399" />
        </ChartCard>

        <ChartCard title="System Activity" subtitle="Live platform totals">
          <DashboardLineChart data={systemActivityData} tone="cyber" color="#22d3ee" />
        </ChartCard>
      </section>

      <ChartCard title="Category Distribution" subtitle="Global product categories">
        <DashboardBarChart data={categoryData} tone="cyber" color="#a78bfa" />
      </ChartCard>
    </div>
  )
}

export default SuperAdminAnalyticsPage
