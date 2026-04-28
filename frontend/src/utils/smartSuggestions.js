const DAY_IN_MS = 24 * 60 * 60 * 1000

export const categoryRules = [
  { category: 'Dairy', keywords: ['milk', 'cheese', 'paneer', 'curd', 'yogurt', 'butter', 'ghee', 'cream'] },
  { category: 'Bakery', keywords: ['bread', 'bun', 'cake', 'toast', 'pastry', 'croissant', 'muffin'] },
  { category: 'Fruits', keywords: ['apple', 'banana', 'orange', 'mango', 'grape', 'guava', 'pineapple', 'melon'] },
  { category: 'Vegetables', keywords: ['tomato', 'onion', 'potato', 'carrot', 'spinach', 'cabbage', 'beans', 'chilli'] },
  { category: 'Grains', keywords: ['rice', 'wheat', 'flour', 'atta', 'dal', 'lentil', 'oats', 'rava'] },
  { category: 'Essentials', keywords: ['oil', 'salt', 'sugar', 'spice', 'masala', 'pepper', 'turmeric'] },
  { category: 'Beverages', keywords: ['tea', 'coffee', 'juice', 'drink', 'soda', 'water'] },
  { category: 'Snacks', keywords: ['chips', 'biscuit', 'cookie', 'namkeen', 'chocolate', 'popcorn'] },
  { category: 'Household', keywords: ['soap', 'detergent', 'cleaner', 'shampoo', 'toothpaste', 'tissue'] },
]

const fallbackCategories = categoryRules.map((rule) => rule.category)

const itemPriceSuggestions = {
  milk: 32,
  bread: 28,
  eggs: 72,
  rice: 95,
  'wheat flour': 54,
  apples: 140,
  bananas: 48,
  tomatoes: 36,
  onions: 40,
  potatoes: 34,
  'cooking oil': 165,
  salt: 24,
  sugar: 46,
  tea: 120,
  coffee: 185,
  biscuits: 30,
  paneer: 85,
  yogurt: 42,
  spinach: 25,
  soap: 38,
  detergent: 110,
}

const categoryPriceSuggestions = {
  dairy: 60,
  bakery: 35,
  fruits: 90,
  vegetables: 40,
  grains: 80,
  essentials: 75,
  beverages: 110,
  snacks: 45,
  household: 95,
}

export const normalizeSmartKey = (value) => (value || '').trim().toLowerCase()

const daysUntil = (dateValue) => {
  if (!dateValue) {
    return null
  }

  const targetDate = new Date(`${dateValue}T00:00:00`)

  if (Number.isNaN(targetDate.getTime())) {
    return null
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return Math.ceil((targetDate - today) / DAY_IN_MS)
}

export const getCategorySuggestions = (productName) => {
  const normalizedName = normalizeSmartKey(productName)

  if (!normalizedName) {
    return fallbackCategories
  }

  const matchedCategories = categoryRules
    .map((rule) => ({
      category: rule.category,
      score: rule.keywords.reduce((total, keyword) => {
        if (normalizedName === keyword) {
          return total + 4
        }

        if (normalizedName.includes(keyword) || keyword.includes(normalizedName)) {
          return total + 2
        }

        return total
      }, 0),
    }))
    .filter((item) => item.score > 0)
    .sort((first, second) => second.score - first.score)
    .map((item) => item.category)

  return [...matchedCategories, ...fallbackCategories.filter((category) => !matchedCategories.includes(category))]
}

export const getPriceSuggestion = (name, category) => {
  const normalizedName = normalizeSmartKey(name)
  const normalizedCategory = normalizeSmartKey(category)

  if (!normalizedName && !normalizedCategory) {
    return ''
  }

  return String(
    itemPriceSuggestions[normalizedName] ??
      categoryPriceSuggestions[normalizedCategory] ??
      99,
  )
}

export const findSellerMatchesForItem = (item, sellerProducts = []) => {
  const itemName = normalizeSmartKey(item.name || item.itemName)
  const itemCategory = normalizeSmartKey(item.category)

  return sellerProducts
    .filter((product) => product.active !== false && Number(product.stock) > 0)
    .filter((product) => {
      const productName = normalizeSmartKey(product.name)
      const productCategory = normalizeSmartKey(product.category)

      return (
        productName === itemName ||
        productName.includes(itemName) ||
        itemName.includes(productName) ||
        (itemCategory && productCategory === itemCategory)
      )
    })
    .sort((first, second) => Number(second.stock) - Number(first.stock))
}

export const buildHomeSmartBuySuggestions = (items = [], sellerProducts = []) => {
  const pendingLowStock = items
    .filter((item) => !item.purchased && Number(item.quantity) <= 2)
    .map((item) => {
      const match = findSellerMatchesForItem(item, sellerProducts)[0]

      return {
        id: `low-${item.id}`,
        tone: match ? 'emerald' : 'amber',
        title: match ? `Order ${item.name} from a seller` : `Restock ${item.name}`,
        message: match
          ? `${match.name} is available now with ${match.stock} seller unit(s).`
          : `${item.name} is running low in your pending list.`,
        meta: match ? `Rs ${Math.round(Number(match.price) || 0)}` : `Qty ${item.quantity}`,
        actionLabel: match ? 'Open seller market' : 'Open buy queue',
        actionTarget: match ? 'seller-market' : 'shopping-list',
      }
    })

  const nearExpiry = items
    .filter((item) => item.purchased)
    .map((item) => ({ item, days: daysUntil(item.expiryDate) }))
    .filter(({ days }) => days !== null && days <= 3)
    .map(({ item, days }) => ({
      id: `expiry-${item.id}`,
      tone: 'rose',
      title: `${item.name} expires soon`,
      message: days <= 0 ? 'Use this today or replace it soon.' : `Use within ${days} day(s), then plan a replacement.`,
      meta: item.category,
      actionLabel: 'Check reminders',
      actionTarget: 'dashboard-reminders',
    }))

  return [...pendingLowStock, ...nearExpiry].slice(0, 4)
}

export const buildDashboardSmartInsights = ({
  recommendations = [],
  lowStockItems = [],
  expiryAlerts = [],
  sellerProducts = [],
  myItems = [],
}) => {
  const topRecommendation = recommendations[0]
  const lowStockWithSeller = lowStockItems.find((item) => findSellerMatchesForItem(item, sellerProducts).length > 0)
  const frequentItem = [...myItems]
    .filter((item) => item.lastPurchasedAt)
    .sort((first, second) => new Date(second.lastPurchasedAt) - new Date(first.lastPurchasedAt))[0]

  return [
    topRecommendation && {
      id: 'recommendation',
      tone: 'sky',
      title: `Smart pick: ${topRecommendation.itemName}`,
      message: topRecommendation.reason || 'This item is a useful next action based on your grocery list.',
      meta: topRecommendation.priority,
    },
    lowStockWithSeller && {
      id: 'seller-match',
      tone: 'emerald',
      title: 'Seller match available',
      message: `${lowStockWithSeller.name} is low, and matching seller stock is available now.`,
      meta: lowStockWithSeller.category,
    },
    expiryAlerts[0] && {
      id: 'expiry',
      tone: 'amber',
      title: `${expiryAlerts[0].itemName} needs attention`,
      message: expiryAlerts[0].message || 'An item is near expiry and should be handled soon.',
      meta: expiryAlerts[0].severity,
    },
    frequentItem && {
      id: 'frequent',
      tone: 'violet',
      title: `Frequently bought: ${frequentItem.name}`,
      message: 'You usually keep this item stocked, so it is worth checking before the next shop.',
      meta: frequentItem.category,
    },
  ].filter(Boolean)
}

export const buildSellerBusinessInsights = ({ products = [], orders = [], revenue = 0 }) => {
  const lowStockProduct = products
    .filter((product) => product.active !== false && Number(product.stock) <= 3)
    .sort((first, second) => Number(first.stock) - Number(second.stock))[0]
  const pendingOrders = orders.filter((order) => order.status === 'PENDING')
  const deliveredOrders = orders.filter((order) => order.status === 'DELIVERED')
  const productMovement = orders.reduce((counts, order) => ({
    ...counts,
    [order.productName]: (counts[order.productName] || 0) + Number(order.quantity || 0),
  }), {})
  const topProduct = Object.entries(productMovement)
    .sort((first, second) => second[1] - first[1])[0]

  return [
    pendingOrders.length > 0 && {
      id: 'pending-orders',
      tone: 'amber',
      title: `${pendingOrders.length} pending order(s)`,
      message: 'Accept or deliver these orders to keep customers updated.',
      meta: 'Needs action',
    },
    lowStockProduct && {
      id: 'low-stock',
      tone: 'rose',
      title: `Restock ${lowStockProduct.name}`,
      message: `${lowStockProduct.name} has only ${lowStockProduct.stock} unit(s) left.`,
      meta: lowStockProduct.category,
    },
    topProduct && {
      id: 'top-product',
      tone: 'sky',
      title: `Most ordered: ${topProduct[0]}`,
      message: `${topProduct[1]} unit(s) ordered across recent seller activity.`,
      meta: 'Top product',
    },
    {
      id: 'revenue',
      tone: deliveredOrders.length > 0 ? 'emerald' : 'violet',
      title: deliveredOrders.length > 0 ? 'Revenue is active' : 'Revenue starts after delivery',
      message: deliveredOrders.length > 0
        ? `Delivered orders have generated Rs ${Math.round(revenue).toLocaleString('en-IN')}.`
        : 'Mark accepted orders as delivered to move value into revenue.',
      meta: `${deliveredOrders.length} delivered`,
    },
  ].filter(Boolean)
}

export const buildSuperAdminInsights = ({ summary, report, users = [], sellerProducts = [], sellerOrders = [] }) => {
  const pendingSellerOrders = sellerOrders.filter((order) => order.status === 'PENDING')
  const deliveredSellerOrders = sellerOrders.filter((order) => order.status === 'DELIVERED')
  const categories = [
    ...(report?.categoryBreakdown || []).map((category) => category.name),
    ...sellerProducts.map((product) => product.category),
  ].filter(Boolean)
  const categoryCounts = categories.reduce((counts, category) => ({
    ...counts,
    [category]: (counts[category] || 0) + 1,
  }), {})
  const thinCategory = Object.entries(categoryCounts).sort((first, second) => first[1] - second[1])[0]
  const orderMovement = sellerOrders.reduce((counts, order) => ({
    ...counts,
    [order.productName]: (counts[order.productName] || 0) + Number(order.quantity || 0),
  }), {})
  const fastMoving = Object.entries(orderMovement).sort((first, second) => second[1] - first[1])[0]

  return [
    pendingSellerOrders.length > 0 && {
      id: 'pending-seller-orders',
      tone: 'amber',
      title: `${pendingSellerOrders.length} seller order(s) pending`,
      message: 'Sellers have customer requests waiting for action.',
      meta: 'Seller ops',
    },
    summary?.lowStockProducts > 0 && {
      id: 'low-stock',
      tone: 'rose',
      title: `${summary.lowStockProducts} low-stock alert(s)`,
      message: 'Platform inventory has products below the stock threshold.',
      meta: 'Inventory',
    },
    thinCategory && {
      id: 'category-coverage',
      tone: 'sky',
      title: `${thinCategory[0]} has low coverage`,
      message: `Only ${thinCategory[1]} product record(s) are available in this category.`,
      meta: 'Category spread',
    },
    fastMoving && {
      id: 'fast-moving',
      tone: 'emerald',
      title: `Fast-moving: ${fastMoving[0]}`,
      message: `${fastMoving[1]} unit(s) ordered through seller marketplace activity.`,
      meta: `${deliveredSellerOrders.length} delivered`,
    },
    users.length > 0 && {
      id: 'role-health',
      tone: 'violet',
      title: `${users.length} global account(s)`,
      message: 'Role control is active across users, sellers, and super admins.',
      meta: 'Accounts',
    },
  ].filter(Boolean)
}
