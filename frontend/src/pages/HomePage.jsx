import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api, { getApiErrorMessage } from '../api/client'

const AVAILABILITY_THRESHOLD = 3

const getCatalogCardClasses = (item) => {
  if (item.source === 'GEMINI') {
    return {
      shell:
        'border-fuchsia-200 bg-[linear-gradient(145deg,_rgba(217,70,239,0.14),_rgba(255,255,255,0.96)_58%,_rgba(59,130,246,0.12))]',
      chip: 'bg-white/90 text-fuchsia-700',
      badge: 'bg-fuchsia-950 text-white',
      button:
        'border-fuchsia-200 bg-white/90 text-fuchsia-800 hover:border-fuchsia-300 hover:bg-fuchsia-50',
    }
  }

  return {
    shell: 'border-slate-100 bg-slate-50',
    chip: 'bg-white text-slate-500',
    badge: 'bg-slate-900 text-white',
    button: 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-100',
  }
}

function HomePage() {
  const [myItems, setMyItems] = useState([])
  const [catalogItems, setCatalogItems] = useState([])
  const [catalogCategories, setCatalogCategories] = useState([])
  const [catalogFilters, setCatalogFilters] = useState({ category: '', search: '' })
  const [error, setError] = useState('')
  const [addingItemKey, setAddingItemKey] = useState('')

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

  const handleAddFromCatalog = async (item) => {
    const itemKey = `${item.category}-${item.name}`
    setAddingItemKey(itemKey)
    setError('')

    try {
      await api.post('/api/grocery', {
        name: item.name,
        category: item.category,
        quantity: 1,
        purchased: false,
      })
      await loadHomeData()
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, `Could not add ${item.name} to your list.`))
    } finally {
      setAddingItemKey('')
    }
  }

  const availableItems = myItems
    .filter((item) => !item.purchased && item.quantity >= AVAILABILITY_THRESHOLD)
    .sort((first, second) => second.quantity - first.quantity)

  const pendingItems = myItems.filter((item) => !item.purchased)
  const purchasedItems = myItems.filter((item) => item.purchased)

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <article className="overflow-hidden rounded-[32px] border border-sky-100 bg-[linear-gradient(135deg,_rgba(14,165,233,0.18),_rgba(255,255,255,0.92)_55%,_rgba(16,185,129,0.12))] p-6 shadow-[0_20px_80px_rgba(15,23,42,0.08)]">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-sky-700">
            Grocery Home
          </p>
          <h2 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight text-slate-950">
            Keep shopping simple, then jump into the dashboard when you need the numbers.
          </h2>
          <p className="mt-4 max-w-xl text-sm text-slate-600 sm:text-base">
            Browse your grocery catalog, add items fast, and move to the dashboard for stock,
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
              to="/inventory"
              className="rounded-full border border-white/70 bg-white/70 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white"
            >
              Manage Inventory
            </Link>
          </div>
        </article>

        <article className="rounded-[32px] border border-white/60 bg-white/80 p-6 shadow-[0_15px_50px_rgba(15,23,42,0.08)]">
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

      <section className="rounded-[32px] border border-white/60 bg-white/80 p-6 shadow-[0_15px_50px_rgba(15,23,42,0.08)]">
        <div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-700">
              Browse
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              Shop your catalog from home
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Search for grocery names or categories here. If Gemini returns extra matches, they
              will appear together with your regular catalog items.
            </p>
            <p className="mt-2 text-xs font-medium uppercase tracking-[0.22em] text-fuchsia-700">
              Gemini matches show with a highlighted card background.
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
            const isAdding = addingItemKey === itemKey
            const cardClasses = getCatalogCardClasses(item)

            return (
              <article
                key={itemKey}
                className={`rounded-3xl border px-5 py-4 shadow-[0_18px_45px_rgba(15,23,42,0.06)] ${cardClasses.shell}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${cardClasses.chip}`}
                  >
                    {item.category}
                  </span>
                  {item.source === 'GEMINI' && (
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${cardClasses.badge}`}
                    >
                      Gemini Pick
                    </span>
                  )}
                </div>
                <h3 className="mt-3 text-lg font-semibold text-slate-900">{item.name}</h3>
                <p className="mt-2 text-sm text-slate-500">
                  {item.source === 'GEMINI'
                    ? 'Suggested from your API search result.'
                    : 'Quick add this item to your grocery list.'}
                </p>
                <button
                  type="button"
                  onClick={() => handleAddFromCatalog(item)}
                  disabled={isAdding}
                  className={`mt-4 w-full rounded-2xl border px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${cardClasses.button}`}
                >
                  {isAdding ? 'Adding...' : 'Add to List'}
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
