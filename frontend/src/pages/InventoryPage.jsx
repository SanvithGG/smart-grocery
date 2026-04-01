import { useEffect, useState } from 'react'
import api from '../api/client'

const initialForm = {
  name: '',
  category: '',
  quantity: 1,
  purchased: false,
}

function InventoryPage() {
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [catalogItems, setCatalogItems] = useState([])
  const [form, setForm] = useState(initialForm)
  const [filters, setFilters] = useState({ category: '', search: '', purchased: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const loadItems = async (currentFilters = filters) => {
    setLoading(true)
    setError('')

    try {
      const params = {}

      if (currentFilters.category) {
        params.category = currentFilters.category
      }

      if (currentFilters.search) {
        params.search = currentFilters.search
      }

      if (currentFilters.purchased !== '') {
        params.purchased = currentFilters.purchased
      }

      const { data } = await api.get('/api/grocery', { params })
      setItems(data)
    } catch (requestError) {
      setError('Unable to load grocery items. Make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  const loadCategoryOptions = async () => {
    try {
      const { data } = await api.get('/api/grocery/categories')
      setCategories(data)
    } catch (requestError) {
      setCategories([])
    }
  }

  const loadCatalogItems = async (category = '', search = '') => {
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
      setCatalogItems([])
    }
  }

  useEffect(() => {
    loadItems()
    loadCategoryOptions()
    loadCatalogItems()
  }, [])

  const handleFormChange = (event) => {
    const { name, value, type, checked } = event.target
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleFilterChange = (event) => {
    const { name, value } = event.target
    const nextFilters = { ...filters, [name]: value }
    setFilters(nextFilters)
    loadItems(nextFilters)
  }

  const handleAddItem = async (event) => {
    event.preventDefault()
    setError('')

    try {
      await api.post('/api/grocery', {
        ...form,
        quantity: Number(form.quantity),
      })

      setForm(initialForm)
      loadItems()
      loadCategoryOptions()
    } catch (requestError) {
      setError('Could not add item. Check the values and try again.')
    }
  }

  const handleCategorySelect = (event) => {
    const nextCategory = event.target.value
    setForm((current) => ({ ...current, category: nextCategory }))
    loadCatalogItems(nextCategory, form.name)
  }

  const handleNameInput = (event) => {
    const nextName = event.target.value
    setForm((current) => ({ ...current, name: nextName }))
    loadCatalogItems(form.category, nextName)
  }

  const handleCatalogPick = (catalogItem) => {
    setForm((current) => ({
      ...current,
      name: catalogItem.name,
      category: catalogItem.category,
    }))
  }

  const handleTogglePurchased = async (item) => {
    setError('')

    try {
      await api.put(`/api/grocery/${item.id}`, {
        ...item,
        purchased: !item.purchased,
      })

      loadItems()
    } catch (requestError) {
      setError('Could not update item status.')
    }
  }

  const handleDelete = async (id) => {
    setError('')

    try {
      await api.delete(`/api/grocery/${id}`)
      loadItems()
    } catch (requestError) {
      setError('Could not delete item.')
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <section className="rounded-[32px] border border-white/60 bg-white/80 p-6 shadow-[0_15px_50px_rgba(15,23,42,0.08)]">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-700">
          Add Item
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
          Build your inventory
        </h2>

        <form className="mt-6 space-y-4" onSubmit={handleAddItem}>
          <input
            name="name"
            value={form.name}
            onChange={handleNameInput}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-500"
            placeholder="Item name"
            required
          />

          <select
            name="category"
            value={form.category}
            onChange={handleCategorySelect}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-500"
            required
          >
            <option value="">Select category</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <input
            name="quantity"
            type="number"
            min="1"
            value={form.quantity}
            onChange={handleFormChange}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-500"
            placeholder="Quantity"
            required
          />

          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
            <input
              name="purchased"
              type="checkbox"
              checked={form.purchased}
              onChange={handleFormChange}
              className="h-4 w-4 rounded border-slate-300"
            />
            Mark as already purchased
          </label>

          <button
            type="submit"
            className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Save Item
          </button>
        </form>

        <div className="mt-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
              Daily Suggestions
            </p>
            <p className="text-xs text-slate-400">Click to autofill name and category</p>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {catalogItems.slice(0, 8).map((catalogItem) => (
              <button
                key={`${catalogItem.category}-${catalogItem.name}`}
                type="button"
                onClick={() => handleCatalogPick(catalogItem)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:border-sky-300 hover:bg-sky-50"
              >
                <p className="text-sm font-semibold text-slate-900">{catalogItem.name}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">
                  {catalogItem.category}
                </p>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[32px] border border-white/60 bg-white/80 p-6 shadow-[0_15px_50px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700">
              Inventory
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              Search and filter groceries
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <input
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-500"
              placeholder="Search"
            />
            <select
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-500"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <select
              name="purchased"
              value={filters.purchased}
              onChange={handleFilterChange}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-500"
            >
              <option value="">All Status</option>
              <option value="true">Purchased</option>
              <option value="false">Pending</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="mt-6 space-y-4">
          {loading && (
            <p className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
              Loading grocery items...
            </p>
          )}

          {!loading && items.length === 0 && (
            <p className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
              No grocery items found for the current filters.
            </p>
          )}

          {!loading &&
            items.map((item) => (
              <article
                key={item.id}
                className="rounded-3xl border border-slate-100 bg-slate-50 px-5 py-4"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-semibold text-slate-900">{item.name}</h3>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        {item.category}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-500">
                      Quantity: {item.quantity} | Status: {item.purchased ? 'Purchased' : 'Pending'}
                    </p>
                    {item.lastPurchasedAt && (
                      <p className="mt-1 text-xs text-slate-400">
                        Last purchased: {new Date(item.lastPurchasedAt).toLocaleString()}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => handleTogglePurchased(item)}
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                    >
                      {item.purchased ? 'Mark Pending' : 'Mark Purchased'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition hover:border-rose-300 hover:bg-rose-100"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
        </div>
      </section>
    </div>
  )
}

export default InventoryPage
