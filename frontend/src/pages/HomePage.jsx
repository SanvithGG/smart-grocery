import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api, { getApiErrorMessage } from '../api/client'
import { getNaturalExpiryDate } from '../utils/expiry'

const AVAILABILITY_THRESHOLD = 3
const initialQuickAddDraft = {
  quantity: 1,
  purchased: true,
  expiryDate: '',
}

const catalogCardClasses = {
  shell: 'border-sky-100',
  chip: 'bg-white/95 text-sky-700',
  button:
    'border-sky-200 bg-white text-sky-800 hover:border-sky-300 hover:bg-sky-50',
}

const quickBuyModalStyle = {
  background:
    'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.95))',
}

const homeHeroStyle = {
  background:
    'linear-gradient(135deg, rgba(14,165,233,0.18), rgba(255,255,255,0.92) 55%, rgba(16,185,129,0.12))',
}

const catalogCardStyle = {
  background:
    'linear-gradient(145deg, rgba(14,165,233,0.12), rgba(255,255,255,0.96) 58%, rgba(16,185,129,0.08))',
}

const stockToneByAvailability = {
  IN_STOCK: {
    label: 'In Stock',
    badge: 'bg-emerald-50 text-emerald-700',
    quantity: 'text-emerald-700',
  },
  LOW_STOCK: {
    label: 'Low Stock',
    badge: 'bg-amber-50 text-amber-700',
    quantity: 'text-amber-700',
  },
  OUT_OF_STOCK: {
    label: 'Out of Stock',
    badge: 'bg-rose-50 text-rose-700',
    quantity: 'text-rose-700',
  },
}

const defaultItemPrices = {
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
  soap: 38,
  detergent: 110,
  paneer: 85,
  yogurt: 42,
  spinach: 25,
}

const defaultCategoryPrices = {
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

const defaultCatalogQuantities = {
  'milk|dairy': 8,
  'bread|bakery': 0,
  'eggs|dairy': 12,
  'rice|grains': 15,
  'wheat flour|grains': 7,
  'apples|fruits': 10,
  'bananas|fruits': 9,
  'tomatoes|vegetables': 11,
  'onions|vegetables': 6,
  'potatoes|vegetables': 14,
  'cooking oil|essentials': 5,
  'salt|essentials': 18,
  'sugar|essentials': 13,
  'tea|beverages': 0,
  'coffee|beverages': 4,
  'biscuits|snacks': 16,
  'soap|household': 9,
  'detergent|household': 6,
}

const normalizeKey = (value) => (value || '').trim().toLowerCase()

const catalogKey = (name, category) => `${normalizeKey(name)}|${normalizeKey(category)}`

const formatPrice = (price, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(price ?? 0)

const resolveFallbackPrice = (item) =>
  defaultItemPrices[normalizeKey(item.name)] ?? defaultCategoryPrices[normalizeKey(item.category)] ?? 99

const resolveFallbackQuantity = (item) => defaultCatalogQuantities[catalogKey(item.name, item.category)] ?? 0

const resolveAvailability = (quantity) => {
  if (quantity <= 0) {
    return 'OUT_OF_STOCK'
  }

  if (quantity <= AVAILABILITY_THRESHOLD - 1) {
    return 'LOW_STOCK'
  }

  return 'IN_STOCK'
}

function HomePage() {
  const [myItems, setMyItems] = useState([])
  const [catalogItems, setCatalogItems] = useState([])
  const [catalogCategories, setCatalogCategories] = useState([])
  const [catalogFilters, setCatalogFilters] = useState({ category: '', search: '' })
  const [error, setError] = useState('')
  const [quickAddTarget, setQuickAddTarget] = useState(null)
  const [quickAddDraft, setQuickAddDraft] = useState(initialQuickAddDraft)
  const [quickAddSubmitting, setQuickAddSubmitting] = useState(false)
  const naturalQuickExpiryDate =
    quickAddDraft.purchased && quickAddTarget
      ? getNaturalExpiryDate(quickAddTarget.name, quickAddTarget.category)
      : null
  const displayedQuickExpiryDate = quickAddDraft.expiryDate || naturalQuickExpiryDate || ''
  const formatNaturalExpiry = (value) => {
    if (!value) {
      return 'Mark as purchased to preview expiry'
    }

    return new Date(`${value}T00:00:00`).toLocaleDateString()
  }

  const loadHomeData = async () => {
    setError('')

    try {
      const [itemsResponse, categoriesResponse, catalogResponse] = await Promise.all([
        api.get('/api/grocery'),
        api.get('/api/grocery/categories'),
        api.get('/api/grocery/catalog'),
      ])

      setMyItems(itemsResponse.data)
      setCatalogCategories(categoriesResponse.data)
      setCatalogItems(catalogResponse.data)
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to load home data right now.'))
    }
  }

  const loadCatalog = async (category = '', search = '') => {
    try {
      const params = {}

      if (category) {
        params.category = category
      }

      if (search) {
        params.search = search
      }

      const { data } = await api.get('/api/grocery/catalog', { params })
      setCatalogItems(data)
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to load catalog items right now.'))
      setCatalogItems([])
    }
  }

  useEffect(() => {
    loadHomeData()
  }, [])

  const handleCatalogFilterChange = (event) => {
    const { name, value } = event.target
    const nextFilters = { ...catalogFilters, [name]: value }
    setCatalogFilters(nextFilters)
    loadCatalog(nextFilters.category, nextFilters.search)
  }

  const handleOpenQuickAdd = (item) => {
    setQuickAddTarget(item)
    setQuickAddDraft(initialQuickAddDraft)
    setError('')
  }

  const handleCloseQuickAdd = () => {
    setQuickAddTarget(null)
    setQuickAddDraft(initialQuickAddDraft)
    setQuickAddSubmitting(false)
  }

  const handleQuickAddChange = (event) => {
    const { name, value, type, checked } = event.target
    setQuickAddDraft((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleQuickAddSubmit = async (event) => {
    event.preventDefault()

    if (!quickAddTarget) {
      return
    }

    setQuickAddSubmitting(true)
    setError('')

    try {
      await api.post('/api/grocery', {
        name: quickAddTarget.name,
        category: quickAddTarget.category,
        quantity: Number(quickAddDraft.quantity),
        purchased: quickAddDraft.purchased,
        expiryDate: quickAddDraft.purchased ? displayedQuickExpiryDate || null : null,
      })
      await loadHomeData()
      window.dispatchEvent(new Event('grocery-data-changed'))
      handleCloseQuickAdd()
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          `Could not complete the purchase for ${quickAddTarget.name}.`,
        ),
      )
    } finally {
      setQuickAddSubmitting(false)
    }
  }

  const availableItems = myItems
    .filter((item) => !item.purchased && item.quantity >= AVAILABILITY_THRESHOLD)
    .sort((first, second) => second.quantity - first.quantity)

  const pendingItems = myItems.filter((item) => !item.purchased)
  const purchasedItems = myItems.filter((item) => item.purchased)

  return (
    <div className="space-y-6">
      {quickAddTarget && (
        <>
          <button
            type="button"
            aria-label="Close quick add modal"
            onClick={handleCloseQuickAdd}
            className="fixed inset-0 z-40 bg-slate-950/25"
          />
          <section className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div
              className="w-full max-w-lg rounded-4xl border border-white/70 p-6 shadow-[0_28px_120px_rgba(15,23,42,0.22)] backdrop-blur"
              style={quickBuyModalStyle}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.32em] text-emerald-700">
                    Quick Buy
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                    {quickAddTarget.name}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">{quickAddTarget.category}</p>
                  <p className="mt-3 text-sm text-slate-500">
                    Available now: {quickAddTarget.availableQuantity ?? 0} units
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCloseQuickAdd}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Close
                </button>
              </div>

              <form className="mt-6 space-y-4" onSubmit={handleQuickAddSubmit}>
                <div>
                  <label className="text-sm font-medium text-slate-700">Quantity</label>
                  <input
                    name="quantity"
                    type="number"
                    min="1"
                    value={quickAddDraft.quantity}
                    onChange={handleQuickAddChange}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                    required
                  />
                  <p className="mt-2 text-xs text-slate-500">
                    Stock will decrease by this quantity after purchase.
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">Expected Expiry</label>
                  <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    {formatNaturalExpiry(displayedQuickExpiryDate)}
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    This purchase is saved as bought immediately, and expiry is calculated automatically.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={quickAddSubmitting}
                  className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {quickAddSubmitting ? 'Processing Purchase...' : 'Buy This Item'}
                </button>
              </form>
            </div>
          </section>
        </>
      )}

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <article
          className="overflow-hidden rounded-4xl border border-sky-100 p-6 shadow-[0_20px_80px_rgba(15,23,42,0.08)]"
          style={homeHeroStyle}
        >
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-sky-700">
            Grocery Home
          </p>
          <h2 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight text-slate-950">
            Plan what to buy fast, then use the dashboard when you need the numbers.
          </h2>
          <p className="mt-4 max-w-xl text-sm text-slate-600 sm:text-base">
            Browse your grocery catalog, buy items fast, and move to the dashboard for stock,
            pending items, smart recommendations, kitchen reminders, and stored notifications.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/dashboard"
              className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Open Dashboard
            </Link>
            <Link
              to="/shopping-list"
              className="rounded-full border border-sky-200 bg-sky-50 px-5 py-3 text-sm font-semibold text-sky-800 transition hover:border-sky-300 hover:bg-sky-100"
            >
              Buy Queue
            </Link>
            <Link
              to="/inventory"
              className="rounded-full border border-white/70 bg-white/70 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white"
            >
              Manage Inventory
            </Link>
          </div>
        </article>

        <article className="rounded-4xl border border-white/60 bg-white/80 p-6 shadow-[0_15px_50px_rgba(15,23,42,0.08)]">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700">
            Today
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
            <div className="rounded-3xl bg-slate-950 px-5 py-4 text-white">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-300">Pending</p>
              <p className="mt-2 text-3xl font-semibold">{pendingItems.length}</p>
            </div>
            <div className="rounded-3xl bg-emerald-50 px-5 py-4">
              <p className="text-xs uppercase tracking-[0.25em] text-emerald-700">Purchased</p>
              <p className="mt-2 text-3xl font-semibold text-emerald-950">{purchasedItems.length}</p>
            </div>
            <div className="rounded-3xl bg-sky-50 px-5 py-4">
              <p className="text-xs uppercase tracking-[0.25em] text-sky-700">Available 3+</p>
              <p className="mt-2 text-3xl font-semibold text-sky-950">{availableItems.length}</p>
            </div>
          </div>
        </article>
      </section>

      {error && (
        <div className="rounded-[28px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      <section className="rounded-4xl border border-white/60 bg-white/80 p-6 shadow-[0_15px_50px_rgba(15,23,42,0.08)]">
        <div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-700">
              Shop
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              Pick what you want to buy
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Search grocery names or categories here and add them straight into your buying flow.
            </p>
          </div>

          <div className="mt-5 grid gap-3 rounded-[28px] border border-slate-200 bg-slate-50/90 p-4 sm:grid-cols-[1.35fr_0.85fr]">
            <input
              name="search"
              value={catalogFilters.search}
              onChange={handleCatalogFilterChange}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-500"
              placeholder="Search catalog, like paneer, pasta, cereal, spinach..."
            />
            <select
              name="category"
              value={catalogFilters.category}
              onChange={handleCatalogFilterChange}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-500"
            >
              <option value="">All Categories</option>
              {catalogCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {catalogItems.length === 0 && (
            <p className="sm:col-span-2 xl:col-span-4 rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
              No catalog items found for this filter.
            </p>
          )}

          {catalogItems.map((item) => {
            const itemKey = `${item.category}-${item.name}`
            const quantity =
              Number.isFinite(Number(item.availableQuantity)) && item.availableQuantity !== null
                ? Number(item.availableQuantity)
                : resolveFallbackQuantity(item)
            const availability = item.availability || resolveAvailability(quantity)
            const stockTone =
              stockToneByAvailability[availability] || stockToneByAvailability.OUT_OF_STOCK
            const displayPrice =
              Number.isFinite(Number(item.price)) && item.price !== null
                ? Number(item.price)
                : resolveFallbackPrice(item)

            return (
              <article
                key={itemKey}
                className={`rounded-3xl border px-5 py-4 shadow-[0_18px_45px_rgba(15,23,42,0.06)] ${catalogCardClasses.shell}`}
                style={catalogCardStyle}
              >
                <div className="flex items-center justify-between gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${catalogCardClasses.chip}`}
                  >
                    {item.category}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${stockTone.badge}`}
                  >
                    {stockTone.label}
                  </span>
                </div>
                <h3 className="mt-3 text-lg font-semibold text-slate-900">{item.name}</h3>
                <div className="mt-3 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-2xl font-semibold tracking-tight text-slate-950">
                      {formatPrice(displayPrice, item.currency || 'INR')}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
                      Estimated price
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${stockTone.quantity}`}>
                      {quantity > 0 ? `${quantity} available` : '0 available'}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">In your inventory</p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-slate-500">
                  {quantity > 0
                    ? `${quantity} store units are currently available for purchase.`
                    : 'This product is currently unavailable. It will be restocked soon.'}
                </p>
                <button
                  type="button"
                  onClick={() => handleOpenQuickAdd(item)}
                  disabled={availability === 'OUT_OF_STOCK'}
                  className={`mt-4 w-full rounded-2xl border px-4 py-2 text-sm font-semibold transition ${catalogCardClasses.button} ${
                    availability === 'OUT_OF_STOCK' ? 'cursor-not-allowed opacity-50' : ''
                  }`}
                >
                  {availability === 'OUT_OF_STOCK' ? 'Unavailable' : 'Buy Option'}
                </button>
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}

export default HomePage
