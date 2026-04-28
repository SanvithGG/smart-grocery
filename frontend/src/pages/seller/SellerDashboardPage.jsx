import { useEffect, useState } from 'react'
import { Boxes, PackageCheck, ShoppingCart, TrendingUp, Wallet } from 'lucide-react'
import { getApiErrorMessage } from '../../api/client'
import DashboardBarChart from '../../components/charts/DashboardBarChart'
import ChartCard from '../../components/charts/ChartCard'
import DashboardLineChart from '../../components/charts/DashboardLineChart'
import SmartInsightCard from '../../components/ui/SmartInsightCard'
import StatCard from '../../components/ui/StatCard'
import { sellerNavigationItems } from '../../data/sellerNavigation'
import RoleDashboardLayout from '../../layouts/RoleDashboardLayout'
import { getSellerDashboard, getSellerOrders, getSellerProducts } from '../../services/sellerService'
import { buildSellerBusinessInsights } from '../../utils/smartSuggestions'

function SellerDashboardPage() {
  const [summary, setSummary] = useState(null)
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([getSellerDashboard(), getSellerProducts(), getSellerOrders()])
      .then(([summaryData, productsData, ordersData]) => {
        setSummary(summaryData)
        setProducts(productsData)
        setOrders(ordersData)
      })
      .catch((requestError) => {
        setError(getApiErrorMessage(requestError, 'Unable to load seller dashboard.'))
      })
  }, [])

  const deliveredOrders = orders.filter((order) => order.status === 'DELIVERED')
  const revenue = summary?.revenue ?? deliveredOrders.reduce((total, order) => {
    const orderTotal = Number(order.totalPrice)

    if (Number.isFinite(orderTotal) && orderTotal > 0) {
      return total + orderTotal
    }

    const product = products.find((item) => item.name === order.productName)
    return total + (product?.price || Number(order.unitPrice) || 0) * order.quantity
  }, 0)
  const inventoryCount = products.reduce((total, product) => total + product.stock, 0)
  const sellerSalesTrendData = orders.reduce((series, order) => {
    const label = order.orderedAt
      ? new Date(order.orderedAt).toLocaleDateString('en-US', { month: 'short' })
      : 'Orders'
    const existingPoint = series.find((point) => point.label === label)
    const value = order.status === 'DELIVERED' ? Number(order.totalPrice) || 0 : 0

    if (existingPoint) {
      existingPoint.value += value
      return series
    }

    return [...series, { label, value }]
  }, [])
  const sellerTopProductsData = products
    .map((product) => ({
      label: product.name,
      value: orders
        .filter((order) => order.productName === product.name)
        .reduce((total, order) => total + order.quantity, 0),
    }))
    .sort((first, second) => second.value - first.value)
    .slice(0, 6)
  const stats = [
    {
      label: 'Revenue',
      value: `Rs ${Math.round(revenue).toLocaleString('en-IN')}`,
      icon: Wallet,
      accent: 'emerald',
      helper: 'Delivered order value',
    },
    {
      label: 'Orders',
      value: orders.length,
      icon: ShoppingCart,
      accent: 'sky',
      helper: `${summary?.pendingOrders ?? 0} pending`,
    },
    {
      label: 'Inventory Count',
      value: inventoryCount,
      icon: Boxes,
      accent: 'violet',
      helper: `${summary?.activeProducts ?? 0} active products`,
    },
    {
      label: 'Low Stock',
      value: summary?.lowStockProducts ?? 0,
      icon: PackageCheck,
      accent: 'amber',
      helper: 'Stock threshold 3',
    },
  ]
  const recentOrders = orders.slice(0, 5)
  const sellerInsights = buildSellerBusinessInsights({ products, orders, revenue })

  return (
    <RoleDashboardLayout
      tone="light"
      collapsibleSidebar
      sidebarTitle="Seller Center"
      sidebarSubtitle="E-commerce"
      navItems={sellerNavigationItems}
      eyebrow="Seller Dashboard"
      title="Store performance"
      description="Revenue, orders, stock, product movement, and seller activity."
    >
      {error && (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </section>

      {sellerInsights.length > 0 && (
        <section className="rounded-4xl border border-white/70 bg-white/85 p-6 shadow-[0_15px_50px_rgba(15,23,42,0.08)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700">
                Smart Business Insights
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                Seller actions to check now
              </h2>
            </div>
            <span className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
              {sellerInsights.length} signals
            </span>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {sellerInsights.map((insight) => (
              <SmartInsightCard key={insight.id} {...insight} />
            ))}
          </div>
        </section>
      )}

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <ChartCard title="Sales Trend" subtitle="Monthly revenue signal">
          <DashboardLineChart data={sellerSalesTrendData.length > 0 ? sellerSalesTrendData : [{ label: 'No sales', value: 0 }]} color="#10b981" />
        </ChartCard>

        <ChartCard title="Top Products" subtitle="Best product movement">
          <DashboardBarChart data={sellerTopProductsData.length > 0 ? sellerTopProductsData : [{ label: 'No orders', value: 0 }]} color="#0284c7" />
        </ChartCard>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-4xl border border-slate-100 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.07)]">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">
            Inventory Focus
          </p>
          <div className="mt-5 space-y-3">
            {products
              .filter((product) => product.stock <= 3)
              .slice(0, 5)
              .map((product) => (
                <div key={product.id} className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{product.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{product.category}</p>
                  </div>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                    {product.stock} left
                  </span>
                </div>
              ))}
            {products.filter((product) => product.stock <= 3).length === 0 && (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                No low-stock products.
              </p>
            )}
          </div>
        </article>

        <article className="rounded-4xl border border-slate-100 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.07)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">
                Recent Orders
              </p>
              <h3 className="mt-2 text-xl font-semibold text-slate-950">Order activity</h3>
            </div>
            <TrendingUp className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="mt-5 space-y-3">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-950">{order.productName}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {order.customerName} | Qty {order.quantity}
                  </p>
                </div>
                <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                  {order.status}
                </span>
              </div>
            ))}
            {recentOrders.length === 0 && (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                No orders yet.
              </p>
            )}
          </div>
        </article>
      </section>
    </RoleDashboardLayout>
  )
}

export default SellerDashboardPage
