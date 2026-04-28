import { NavLink, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import { getSellerOrders, getSellerProducts } from '../services/sellerService'

function RoleDashboardLayout({
  tone = 'light',
  navPlacement = 'side',
  collapsibleSidebar = false,
  sidebarTitle,
  sidebarSubtitle,
  navItems,
  eyebrow,
  title,
  description,
  children,
}) {
  const isCyber = tone === 'cyber'
  const useTopNav = navPlacement === 'top'
  const navigate = useNavigate()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sellerNotifications, setSellerNotifications] = useState([])
  const isSellerWorkspace = navItems.some((item) => item.to === '/seller/orders')

  useEffect(() => {
    if (!isSellerWorkspace) {
      return undefined
    }

    let cancelled = false

    const loadSellerNotifications = async () => {
      try {
        const [orders, products] = await Promise.all([getSellerOrders(), getSellerProducts()])

        if (cancelled) {
          return
        }

        setSellerNotifications(
          [
            ...orders
            .filter((order) => order.status === 'PENDING')
            .slice(0, 6)
            .map((order) => ({
              id: `order-${order.id}`,
              title: `New order: ${order.productName}`,
              message: `${order.customerName} requested ${order.quantity} unit(s).`,
              meta: order.totalPrice ? `Rs ${Math.round(order.totalPrice).toLocaleString('en-IN')}` : order.status,
            })),
            ...products
              .filter((product) => product.active !== false && Number(product.stock) <= 3)
              .slice(0, 4)
              .map((product) => ({
                id: `stock-${product.id}`,
                title: `Low stock: ${product.name}`,
                message: `${product.name} has only ${product.stock} unit(s) left.`,
                meta: product.category,
              })),
          ].slice(0, 8),
        )
      } catch {
        if (!cancelled) {
          setSellerNotifications([])
        }
      }
    }

    loadSellerNotifications()
    const intervalId = window.setInterval(loadSellerNotifications, 30000)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
    }
  }, [isSellerWorkspace])

  const renderTopNavigation = () => (
    <nav
      className={
        isCyber
          ? 'flex flex-wrap items-center gap-2 rounded-4xl border border-cyan-300/20 bg-white/[0.06] p-2 shadow-[0_0_45px_rgba(34,211,238,0.12)] backdrop-blur'
          : 'flex flex-wrap items-center gap-2 rounded-4xl border border-slate-100 bg-white p-2 shadow-[0_18px_50px_rgba(15,23,42,0.07)]'
      }
    >
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            [
              'flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition',
              isCyber
                ? isActive
                  ? 'bg-cyan-400/15 text-cyan-200 shadow-[0_0_22px_rgba(34,211,238,0.18)]'
                  : 'text-slate-400 hover:bg-white/[0.07] hover:text-white'
                : isActive
                  ? 'bg-slate-950 text-white shadow-[0_14px_28px_rgba(15,23,42,0.16)]'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950',
            ].join(' ')
          }
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  )

  return (
    <div
      className={
        isCyber
          ? 'rounded-4xl bg-slate-950 p-4 text-slate-100 shadow-[0_0_80px_rgba(34,211,238,0.16)] sm:p-5'
        : 'rounded-4xl bg-slate-50 p-4 text-slate-900 sm:p-5'
      }
    >
      <div
        className={
          useTopNav
            ? 'space-y-5'
            : `grid gap-5 transition-[grid-template-columns] duration-200 ${
                sidebarCollapsed ? 'lg:grid-cols-[5.5rem_1fr]' : 'lg:grid-cols-[17rem_1fr]'
              }`
        }
      >
        {!useTopNav && (
          <div className="min-w-0">
            <div
              className={`lg:fixed lg:bottom-5 lg:top-5 ${
                sidebarCollapsed ? 'lg:w-[5.5rem]' : 'lg:w-[17rem]'
              }`}
            >
              <Sidebar
                title={sidebarTitle}
                subtitle={sidebarSubtitle}
                items={navItems}
                tone={tone}
                collapsed={collapsibleSidebar && sidebarCollapsed}
                onToggle={
                  collapsibleSidebar ? () => setSidebarCollapsed((current) => !current) : undefined
                }
                className="h-full"
              />
            </div>
          </div>
        )}
        <div className="min-w-0 space-y-5">
          <div className="sticky top-5 z-40">
            <Header
              eyebrow={eyebrow}
              title={title}
              description={description}
              tone={tone}
              notifications={isSellerWorkspace ? sellerNotifications : []}
              notificationTitle={isSellerWorkspace ? 'Seller Alerts' : undefined}
              notificationSubtitle={isSellerWorkspace ? 'Pending customer orders' : undefined}
              notificationEmpty={isSellerWorkspace ? 'No pending seller orders.' : undefined}
              notificationStorageKey={isSellerWorkspace ? 'seller-read-notification-ids' : undefined}
              onNotificationClick={
                isSellerWorkspace
                  ? () => navigate('/seller/orders')
                  : undefined
              }
            />
          </div>
          {useTopNav && renderTopNavigation()}
          {children}
        </div>
      </div>
    </div>
  )
}

export default RoleDashboardLayout
