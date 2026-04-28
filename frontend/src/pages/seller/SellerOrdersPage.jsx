import { useEffect, useState } from 'react'
import { getApiErrorMessage } from '../../api/client'
import Button from '../../components/ui/Button'
import StatCard from '../../components/ui/StatCard'
import { sellerNavigationItems } from '../../data/sellerNavigation'
import RoleDashboardLayout from '../../layouts/RoleDashboardLayout'
import { getSellerOrders, updateSellerOrderStatus } from '../../services/sellerService'
import { CheckCircle2, Clock3, PackageCheck, ShoppingCart } from 'lucide-react'

const statuses = ['PENDING', 'ACCEPTED', 'DELIVERED']

const formatPrice = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)

function SellerOrdersPage() {
  const [orders, setOrders] = useState([])
  const [error, setError] = useState('')
  const [savingId, setSavingId] = useState(null)

  const loadOrders = async () => {
    try {
      setOrders(await getSellerOrders())
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to load seller orders.'))
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

  const handleStatusChange = async (order, status) => {
    setSavingId(order.id)
    setError('')

    try {
      await updateSellerOrderStatus(order.id, status)
      await loadOrders()
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to update order status.'))
    } finally {
      setSavingId(null)
    }
  }

  const stats = [
    { label: 'Orders', value: orders.length, icon: ShoppingCart, accent: 'sky' },
    { label: 'Pending', value: orders.filter((order) => order.status === 'PENDING').length, icon: Clock3, accent: 'amber' },
    { label: 'Accepted', value: orders.filter((order) => order.status === 'ACCEPTED').length, icon: PackageCheck, accent: 'violet' },
    { label: 'Delivered', value: orders.filter((order) => order.status === 'DELIVERED').length, icon: CheckCircle2, accent: 'emerald' },
  ]

  return (
    <RoleDashboardLayout
      tone="light"
      collapsibleSidebar
      sidebarTitle="Seller Center"
      sidebarSubtitle="E-commerce"
      navItems={sellerNavigationItems}
      eyebrow="Seller Orders"
      title="Manage order status"
      description="Move orders through pending, accepted, and delivered states."
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

      <div className="grid gap-4">
        {orders.length === 0 && (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-5 py-8 text-sm text-slate-500 shadow-[0_18px_50px_rgba(15,23,42,0.07)]">
            No seller orders yet.
          </div>
        )}

        {orders.map((order) => (
          <article key={order.id} className="rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.07)] transition duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_24px_65px_rgba(15,23,42,0.11)]">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-lg font-semibold text-slate-950">{order.productName}</h3>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 transition duration-200">
                    {order.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  Customer: {order.customerName} | Category: {order.category} | Quantity: {order.quantity}
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-700">
                  Total: {formatPrice(order.totalPrice)}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {statuses.map((status) => (
                  <Button
                    key={`${order.id}-${status}`}
                    type="button"
                    onClick={() => handleStatusChange(order, status)}
                    disabled={savingId === order.id || order.status === status}
                    variant={status === 'DELIVERED' ? 'success' : status === 'ACCEPTED' ? 'sky' : 'secondary'}
                  >
                    {savingId === order.id ? 'Saving...' : status}
                  </Button>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    </RoleDashboardLayout>
  )
}

export default SellerOrdersPage
