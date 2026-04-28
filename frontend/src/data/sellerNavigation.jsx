import { BarChart3, Boxes, LayoutDashboard, ShoppingCart } from 'lucide-react'

export const sellerNavigationItems = [
  { to: '/seller', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/seller/products', label: 'Products', icon: Boxes },
  { to: '/seller/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/seller/analytics', label: 'Analytics', icon: BarChart3 },
]
