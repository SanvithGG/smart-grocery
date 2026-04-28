import { useEffect, useMemo, useState } from 'react'
import { Activity, AlertCircle, Layers3, TrendingUp } from 'lucide-react'
import { getApiErrorMessage } from '../../api/client'
import DashboardBarChart from '../../components/charts/DashboardBarChart'
import ChartCard from '../../components/charts/ChartCard'
import DashboardLineChart from '../../components/charts/DashboardLineChart'
import StatCard from '../../components/ui/StatCard'
import { sellerNavigationItems } from '../../data/sellerNavigation'
import RoleDashboardLayout from '../../layouts/RoleDashboardLayout'
import { getSellerOrders, getSellerProducts } from '../../services/sellerService'

function percent(value, total) {
  return total ? Math.round((value / total) * 100) : 0
}

function SellerAnalyticsPage() {
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([getSellerProducts(), getSellerOrders()])
      .then(([productsData, ordersData]) => {
        setProducts(productsData)
        setOrders(ordersData)
      })
      .catch((requestError) => {
        setError(getApiErrorMessage(requestError, 'Unable to load seller analytics.'))
      })
  }, [])

  const analytics = useMemo(() => {
    const lowStock = products.filter((product) => product.active && product.stock <= 3)
    const delivered = orders.filter((order) => order.status === 'DELIVERED')
    const pending = orders.filter((order) => order.status === 'PENDING')
    const totalStock = products.reduce((total, product) => total + product.stock, 0)
    const salesTrendMap = new Map()

    const categoryMap = new Map()
    for (const product of products) {
      const current = categoryMap.get(product.category) || {
        label: product.category,
        value: 0,
      }
      current.value += product.stock
      categoryMap.set(product.category, current)
    }

    for (const order of delivered) {
      const label = order.orderedAt
        ? new Date(order.orderedAt).toLocaleDateString('en-US', { month: 'short' })
        : 'Delivered'
      salesTrendMap.set(label, (salesTrendMap.get(label) || 0) + (Number(order.totalPrice) || 0))
    }

    return {
      lowStock,
      delivered,
      pending,
      totalStock,
      deliveryRate: percent(delivered.length, orders.length),
      categoryBreakdown: Array.from(categoryMap.values())
        .sort((first, second) => second.value - first.value || first.label.localeCompare(second.label)),
      salesTrend: Array.from(salesTrendMap.entries()).map(([label, value]) => ({ label, value })),
    }
  }, [orders, products])

  const cards = [
    { label: 'Delivery Rate', value: `${analytics.deliveryRate}%`, icon: TrendingUp, accent: 'emerald' },
    { label: 'Pending Orders', value: analytics.pending.length, icon: Activity, accent: 'sky' },
    { label: 'Low Stock', value: analytics.lowStock.length, icon: AlertCircle, accent: 'amber' },
    { label: 'Categories', value: analytics.categoryBreakdown.length, icon: Layers3, accent: 'violet' },
  ]

  return (
    <RoleDashboardLayout
      tone="light"
      collapsibleSidebar
      sidebarTitle="Seller Center"
      sidebarSubtitle="E-commerce"
      navItems={sellerNavigationItems}
      eyebrow="Seller Analytics"
      title="Product and order insights"
      description="Analyze only the products and orders owned by your seller account."
    >
      {error && (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <ChartCard title="Sales Trend" subtitle="Delivered order revenue">
          <DashboardLineChart data={analytics.salesTrend.length > 0 ? analytics.salesTrend : [{ label: 'No sales', value: 0 }]} color="#10b981" />
        </ChartCard>

        <ChartCard title="Category Stock" subtitle="Stock quantity by category">
          <DashboardBarChart data={analytics.categoryBreakdown} color="#0284c7" />
        </ChartCard>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_0.8fr]">
        <article className="rounded-4xl border border-slate-100 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.07)]">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">
            Category Summary
          </p>
          <div className="mt-5 grid gap-3">
            {analytics.categoryBreakdown.length === 0 && (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                Add products to see category analytics.
              </p>
            )}
            {analytics.categoryBreakdown.map((category) => (
              <div key={category.label} className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3">
                <span className="text-sm font-semibold text-slate-950">{category.label}</span>
                <span className="text-sm font-semibold text-slate-600">{category.value} stock</span>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-4xl border border-slate-100 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.07)]">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">
            Suggested Action
          </p>
          <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
            Keep low-stock products updated before accepting more orders.
          </h3>
          <p className="mt-3 text-sm leading-7 text-slate-500">
            Current stock across your seller account is {analytics.totalStock} units.
          </p>
        </article>
      </section>
    </RoleDashboardLayout>
  )
}

export default SellerAnalyticsPage
