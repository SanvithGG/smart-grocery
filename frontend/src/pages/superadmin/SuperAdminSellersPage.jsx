import { useEffect, useMemo, useState } from 'react'
import { BarChart3, Boxes, Clock3, PackageCheck, Store, Wallet } from 'lucide-react'
import { getApiErrorMessage } from '../../api/client'
import Card from '../../components/ui/Card'
import SmartInsightCard from '../../components/ui/SmartInsightCard'
import StatCard from '../../components/ui/StatCard'
import {
  getAdminSellerOrders,
  getAdminSellerProducts,
  getAdminUsers,
} from '../../services/adminService'

function SuperAdminSellersPage() {
  const [users, setUsers] = useState([])
  const [sellerProducts, setSellerProducts] = useState([])
  const [sellerOrders, setSellerOrders] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([getAdminUsers(), getAdminSellerProducts(), getAdminSellerOrders()])
      .then(([usersData, sellerProductsData, sellerOrdersData]) => {
        setUsers(usersData)
        setSellerProducts(sellerProductsData)
        setSellerOrders(sellerOrdersData)
      })
      .catch((requestError) => {
        setError(getApiErrorMessage(requestError, 'Unable to load seller management.'))
      })
  }, [])

  const sellerRows = useMemo(
    () =>
      users
        .filter((user) => user.role === 'SELLER')
        .map((seller) => {
          const products = sellerProducts.filter((product) => product.sellerName === seller.username)
          const orders = sellerOrders.filter((order) => order.sellerName === seller.username)
          const deliveredOrders = orders.filter((order) => order.status === 'DELIVERED')
          const revenue = deliveredOrders.reduce(
            (total, order) => total + (Number(order.totalPrice) || 0),
            0,
          )

          return {
            ...seller,
            productCount: products.length,
            activeProductCount: products.filter((product) => product.active).length,
            lowStockCount: products.filter((product) => product.active && Number(product.stock) <= 3).length,
            orderCount: orders.length,
            pendingOrderCount: orders.filter((order) => order.status === 'PENDING').length,
            deliveredOrderCount: deliveredOrders.length,
            revenue,
          }
        }),
    [sellerOrders, sellerProducts, users],
  )

  const totalRevenue = sellerRows.reduce((total, seller) => total + seller.revenue, 0)
  const pendingOrders = sellerOrders.filter((order) => order.status === 'PENDING')
  const topSeller = [...sellerRows].sort((first, second) => second.revenue - first.revenue)[0]
  const mostLoadedSeller = [...sellerRows].sort(
    (first, second) => second.pendingOrderCount - first.pendingOrderCount,
  )[0]
  const insightCards = [
    pendingOrders.length > 0 && {
      id: 'pending-orders',
      tone: 'amber',
      title: `${pendingOrders.length} pending seller order(s)`,
      message: 'These orders are waiting for seller action.',
      meta: 'Needs action',
    },
    topSeller?.revenue > 0 && {
      id: 'top-seller',
      tone: 'emerald',
      title: `${topSeller.username} leads revenue`,
      message: `Delivered seller orders have generated Rs ${Math.round(topSeller.revenue).toLocaleString('en-IN')}.`,
      meta: 'Top seller',
    },
    mostLoadedSeller?.pendingOrderCount > 0 && {
      id: 'seller-pressure',
      tone: 'rose',
      title: `${mostLoadedSeller.username} has order pressure`,
      message: `${mostLoadedSeller.pendingOrderCount} pending order(s) need attention.`,
      meta: 'Order queue',
    },
    sellerProducts.some((product) => product.active && Number(product.stock) <= 3) && {
      id: 'low-stock',
      tone: 'sky',
      title: 'Seller stock needs review',
      message: 'Some active seller products are close to the low-stock threshold.',
      meta: 'Inventory',
    },
  ].filter(Boolean)

  const stats = [
    { label: 'Sellers', value: sellerRows.length, icon: Store, accent: 'sky', helper: 'Active seller accounts' },
    { label: 'Products', value: sellerProducts.length, icon: Boxes, accent: 'violet', helper: 'Global seller listings' },
    { label: 'Pending Orders', value: pendingOrders.length, icon: Clock3, accent: 'amber', helper: 'Needs seller action' },
    {
      label: 'Revenue',
      value: `Rs ${Math.round(totalRevenue).toLocaleString('en-IN')}`,
      icon: Wallet,
      accent: 'emerald',
      helper: 'Delivered seller orders',
    },
  ]

  return (
    <div className="space-y-6">
      <Card
        eyebrow="Super Admin Sellers"
        title="Seller management center"
        description="Monitor seller accounts, product coverage, pending orders, low stock, and delivered revenue globally."
      />

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

      {insightCards.length > 0 && (
        <section className="rounded-4xl border border-white/70 bg-white/85 p-6 shadow-[0_15px_50px_rgba(15,23,42,0.08)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700">
                Seller Smart Insights
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                Seller signals that need attention
              </h2>
            </div>
            <span className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
              {insightCards.length} signals
            </span>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {insightCards.map((insight) => (
              <SmartInsightCard key={insight.id} {...insight} />
            ))}
          </div>
        </section>
      )}

      <section className="rounded-4xl border border-white/70 bg-white/85 p-5 shadow-[0_15px_50px_rgba(15,23,42,0.08)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-700">
              Seller Directory
            </p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              Seller business overview
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Product counts, order pressure, low-stock pressure, and seller revenue.
            </p>
          </div>
          <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
            {sellerRows.length} sellers
          </span>
        </div>

        <div className="mt-5 grid gap-3">
          {sellerRows.length === 0 && (
            <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
              No seller accounts yet. Promote a user to seller from the Users page.
            </p>
          )}

          {sellerRows.map((seller) => (
            <article
              key={seller.id}
              className="rounded-3xl bg-slate-50 px-4 py-4 transition duration-200 ease-out hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_18px_45px_rgba(15,23,42,0.08)]"
            >
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-lg font-semibold text-slate-950">{seller.username}</p>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                      Seller
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{seller.email}</p>
                </div>

                <div className="grid gap-2 text-sm sm:grid-cols-2 xl:grid-cols-6">
                  <span className="rounded-2xl bg-white px-4 py-3 text-slate-600">
                    Products: <strong className="text-slate-950">{seller.productCount}</strong>
                  </span>
                  <span className="rounded-2xl bg-white px-4 py-3 text-slate-600">
                    Active: <strong className="text-slate-950">{seller.activeProductCount}</strong>
                  </span>
                  <span className="rounded-2xl bg-white px-4 py-3 text-slate-600">
                    Low: <strong className="text-slate-950">{seller.lowStockCount}</strong>
                  </span>
                  <span className="rounded-2xl bg-white px-4 py-3 text-slate-600">
                    Orders: <strong className="text-slate-950">{seller.orderCount}</strong>
                  </span>
                  <span className="rounded-2xl bg-white px-4 py-3 text-slate-600">
                    Pending: <strong className="text-slate-950">{seller.pendingOrderCount}</strong>
                  </span>
                  <span className="rounded-2xl bg-white px-4 py-3 text-slate-600">
                    Revenue:{' '}
                    <strong className="text-slate-950">
                      Rs {Math.round(seller.revenue).toLocaleString('en-IN')}
                    </strong>
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <article className="rounded-4xl border border-white/70 bg-white/85 p-5 shadow-[0_15px_50px_rgba(15,23,42,0.08)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">
                Recent Seller Orders
              </p>
              <h3 className="mt-2 text-xl font-semibold text-slate-950">Marketplace request stream</h3>
            </div>
            <BarChart3 className="h-5 w-5 text-sky-700" />
          </div>

          <div className="mt-5 space-y-3">
            {sellerOrders.slice(0, 6).map((order) => (
              <div key={order.id} className="rounded-2xl bg-slate-50 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{order.productName}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {order.sellerName} | {order.customerName} | Qty {order.quantity}
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
            {sellerOrders.length === 0 && (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                No seller orders yet.
              </p>
            )}
          </div>
        </article>

        <article className="rounded-4xl border border-white/70 bg-white/85 p-5 shadow-[0_15px_50px_rgba(15,23,42,0.08)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-700">
                Low Stock Seller Products
              </p>
              <h3 className="mt-2 text-xl font-semibold text-slate-950">Seller inventory pressure</h3>
            </div>
            <PackageCheck className="h-5 w-5 text-amber-700" />
          </div>

          <div className="mt-5 space-y-3">
            {sellerProducts
              .filter((product) => product.active && Number(product.stock) <= 3)
              .slice(0, 6)
              .map((product) => (
                <div key={product.id} className="rounded-2xl bg-slate-50 px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{product.name}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {product.sellerName} | {product.category}
                      </p>
                    </div>
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                      {product.stock} left
                    </span>
                  </div>
                </div>
              ))}
            {!sellerProducts.some((product) => product.active && Number(product.stock) <= 3) && (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                No low-stock seller products.
              </p>
            )}
          </div>
        </article>
      </section>
    </div>
  )
}

export default SuperAdminSellersPage
