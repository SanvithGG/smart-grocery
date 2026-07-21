import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { getApiErrorMessage } from '../api/client'
import {
  getPublicCatalog,
  getPublicCategories,
  getPublicSellerProducts,
} from '../services/groceryService'
import { formatPrice } from '../utils/format'
import { getSession } from '../utils/session'
import { Search, ShoppingBasket, ArrowRight, PlayCircle, LogIn } from 'lucide-react'

const AVAILABILITY_THRESHOLD = 3

const catalogCardClasses = {
  shell: 'border-sky-100',
  chip: 'bg-white/95 text-sky-700',
  button:
    'border-sky-200 bg-white text-sky-800 hover:border-sky-300 hover:bg-sky-50',
}

const catalogCardStyle = {
  background: '#ffffff',
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

const resolveAvailability = (quantity) => {
  if (quantity <= 0) {
    return 'OUT_OF_STOCK'
  }

  if (quantity <= AVAILABILITY_THRESHOLD - 1) {
    return 'LOW_STOCK'
  }

  return 'IN_STOCK'
}

function ShopPage() {
  const navigate = useNavigate()
  const [catalogItems, setCatalogItems] = useState([])
  const [catalogCategories, setCatalogCategories] = useState([])
  const [sellerProducts, setSellerProducts] = useState([])
  const [error, setError] = useState('')
  
  const [searchParams, setSearchParams] = useSearchParams()
  const search = searchParams.get('search') || ''
  const categories = searchParams.getAll('category')
  const category = categories.join(',')

  const loadShopData = async () => {
    setError('')
    try {
      const [categoriesData, catalogData, sellerProductsData] = await Promise.all([
        getPublicCategories(),
        getPublicCatalog({ category, search }),
        getPublicSellerProducts(),
      ])

      setCatalogCategories(categoriesData)
      setCatalogItems(catalogData)
      setSellerProducts(sellerProductsData)
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to load shop data right now.'))
    }
  }

  useEffect(() => {
    loadShopData()
  }, [searchParams])

  const handleSearchChange = (e) => {
    const value = e.target.value
    if (value) {
      searchParams.set('search', value)
    } else {
      searchParams.delete('search')
    }
    setSearchParams(searchParams)
  }

  const handleCategoryChange = (e) => {
    const value = e.target.value
    if (value) {
      searchParams.set('category', value)
    } else {
      searchParams.delete('category')
    }
    setSearchParams(searchParams)
  }

  const handleBuyAction = () => {
    const { token } = getSession()
    if (!token) {
      navigate('/login')
    } else {
      // If already logged in, they should probably be using the Dashboard/Home page for full features, 
      // but we redirect them to home so they can buy there.
      navigate('/home')
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 pb-20">
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-slate-200 bg-white/80 px-6 py-4 backdrop-blur shadow-sm">
        <div className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
            <ShoppingBasket className="h-5 w-5" />
          </span>
          <span className="text-xl font-bold tracking-tight">Smart Grocery</span>
        </div>

        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-sky-700"
          >
            <LogIn className="h-4 w-4" /> Log In
          </Link>
          <Link
            to="/register"
            className="rounded-full bg-orange-500 px-5 py-2.5 text-sm font-bold text-white shadow-[0_4px_14px_rgba(249,115,22,0.3)] transition hover:-translate-y-0.5 hover:bg-orange-600"
          >
            Sign Up
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 pt-10">
        <section className="mb-12 text-center">
          <p className="mb-3 inline-flex rounded-full bg-sky-100 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.22em] text-sky-800">
            Welcome to Smart Grocery
          </p>
          <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
            Browse. Order. Track.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            Explore our catalog of fresh groceries and seller marketplace. Sign in to place orders, track inventory, and get smart expiry alerts.
          </p>
        </section>

        {error && (
          <div className="mb-6 rounded-[28px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search groceries..."
              value={search}
              onChange={handleSearchChange}
              className="w-full rounded-2xl border-none bg-slate-50 py-3 pl-11 pr-4 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
          <div className="flex-shrink-0">
            <select
              value={categories.length === 1 ? categories[0] : ''}
              onChange={handleCategoryChange}
              className="w-full sm:w-48 rounded-2xl border-none bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="">{categories.length > 1 ? 'Multiple Selected' : 'All Categories'}</option>
              {catalogCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        <section id="shop-catalog" className="mb-12 rounded-4xl border border-white/60 bg-white p-8 shadow-[0_15px_50px_rgba(15,23,42,0.05)]">
          <div className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-700">Catalog</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Store Items</h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {catalogItems.length === 0 && (
              <p className="sm:col-span-2 lg:col-span-3 xl:col-span-4 rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                No catalog items found matching your filters.
              </p>
            )}

            {catalogItems.map((item) => {
              const itemKey = `${item.category}-${item.name}`
              const quantity = Number(item.availableQuantity) || 0
              const availability = item.availability || resolveAvailability(quantity)
              const stockTone = stockToneByAvailability[availability] || stockToneByAvailability.OUT_OF_STOCK
              const displayPrice = Number.isFinite(Number(item.price)) && item.price !== null ? Number(item.price) : 99

              return (
                <article
                  key={itemKey}
                  className={`flex flex-col rounded-3xl border px-5 py-5 shadow-sm transition hover:shadow-md ${catalogCardClasses.shell}`}
                  style={catalogCardStyle}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${catalogCardClasses.chip}`}>
                      {item.category}
                    </span>
                    <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${stockTone.badge}`}>
                      {stockTone.label}
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-slate-900">{item.name}</h3>
                  <div className="mt-3 flex items-end justify-between gap-3 flex-1">
                    <div>
                      <p className="text-2xl font-black tracking-tight text-slate-950">
                        {formatPrice(displayPrice, item.currency || 'INR')}
                      </p>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                        Estimated price
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleBuyAction}
                    className="mt-5 w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
                  >
                    Login to Buy
                  </button>
                </article>
              )
            })}
          </div>
        </section>

        <section id="seller-market" className="rounded-4xl border border-emerald-100 bg-emerald-50/30 p-8 shadow-[0_15px_50px_rgba(15,23,42,0.05)]">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700">Marketplace</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Seller Products</h2>
            </div>
            <span className="rounded-full border border-emerald-200 bg-emerald-100 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">
              {sellerProducts.length} live
            </span>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {sellerProducts.length === 0 && (
              <p className="sm:col-span-2 lg:col-span-3 rounded-3xl border border-dashed border-emerald-200 bg-emerald-50/50 px-4 py-8 text-center text-sm text-emerald-600">
                No seller products are available at the moment.
              </p>
            )}

            {sellerProducts.map((product) => {
              const quantity = Number(product.stock) || 0
              const availability = resolveAvailability(quantity)
              const stockTone = stockToneByAvailability[availability] || stockToneByAvailability.OUT_OF_STOCK

              return (
                <article
                  key={product.id}
                  className="flex flex-col rounded-3xl border border-emerald-100 bg-white px-5 py-5 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                      {product.category}
                    </span>
                    <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${stockTone.badge}`}>
                      {stockTone.label}
                    </span>
                  </div>

                  <h3 className="mt-4 text-lg font-bold text-slate-900">{product.name}</h3>

                  <div className="mt-3 flex items-end justify-between gap-3 flex-1">
                    <div>
                      <p className="text-2xl font-black tracking-tight text-slate-950">
                        {formatPrice(product.price)}
                      </p>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                        Seller price
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleBuyAction}
                    className="mt-5 w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
                  >
                    Login to Order
                  </button>
                </article>
              )
            })}
          </div>
        </section>
      </div>
    </main>
  )
}

export default ShopPage
