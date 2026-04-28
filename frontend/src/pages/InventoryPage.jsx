import { useEffect, useState } from 'react'
import { Search, Tag, Filter, Plus, Trash2, CheckCircle, Circle, Package } from 'lucide-react'
import { getApiErrorMessage } from '../api/client'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import Input from '../components/ui/Input'
import {
  createGrocery,
  deleteGrocery,
  getCatalog,
  getCategories,
  getGroceries,
  updateGrocery,
} from '../services/groceryService'
import { getNaturalExpiryDate } from '../utils/expiry'

const initialForm = {
  name: '',
  category: '',
  quantity: 1,
  purchased: false,
  expiryDate: '',
}

const suggestionClasses =
  'border-sky-100 hover:border-sky-300 hover:bg-sky-50/80'

const suggestionCardStyle = {
  background:
    'linear-gradient(145deg, rgba(14,165,233,0.12), rgba(255,255,255,0.94) 58%, rgba(16,185,129,0.08))',
}

function InventoryPage() {
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [catalogItems, setCatalogItems] = useState([])
  const [form, setForm] = useState(initialForm)
  const [filters, setFilters] = useState({ category: '', search: '', purchased: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirmDeleteItem, setConfirmDeleteItem] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const naturalExpiryDate = form.purchased ? getNaturalExpiryDate(form.name, form.category) : null
  const displayedExpiryDate = form.expiryDate || naturalExpiryDate || ''
  const getExpectedExpiryDate = (item) =>
    item.expiryDate || getNaturalExpiryDate(item.name, item.category) || ''

  const formatExpiryDate = (value) => {
    if (!value) {
      return 'Select item details to preview expiry'
    }

    return new Date(`${value}T00:00:00`).toLocaleDateString()
  }

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

      setItems(await getGroceries(params))
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to load grocery items. Make sure the backend is running.'))
    } finally {
      setLoading(false)
    }
  }

  const loadCategoryOptions = async () => {
    try {
      setCategories(await getCategories())
    } catch {
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

      setCatalogItems(await getCatalog(params))
    } catch {
      setCatalogItems([])
    }
  }

  useEffect(() => {
    const initializePage = async () => {
      setLoading(true)
      setError('')

      try {
        const [itemsData, categoriesData, catalogData] = await Promise.all([
          getGroceries(),
          getCategories(),
          getCatalog(),
        ])

        setItems(itemsData)
        setCategories(categoriesData)
        setCatalogItems(catalogData)
      } catch (requestError) {
        setError(getApiErrorMessage(requestError, 'Unable to load grocery items. Make sure the backend is running.'))
        setCategories([])
        setCatalogItems([])
      } finally {
        setLoading(false)
      }
    }

    initializePage()
  }, [])

  useEffect(() => {
    const handleDataChanged = async () => {
      setLoading(true)
      setError('')

      try {
        const params = {}

        if (filters.category) {
          params.category = filters.category
        }

        if (filters.search) {
          params.search = filters.search
        }

        if (filters.purchased !== '') {
          params.purchased = filters.purchased
        }

        const [itemsData, categoriesData, catalogData] = await Promise.all([
          getGroceries(params),
          getCategories(),
          getCatalog(),
        ])

        setItems(itemsData)
        setCategories(categoriesData)
        setCatalogItems(catalogData)
      } catch (requestError) {
        setError(getApiErrorMessage(requestError, 'Unable to load grocery items. Make sure the backend is running.'))
      } finally {
        setLoading(false)
      }
    }

    window.addEventListener('grocery-data-changed', handleDataChanged)

    return () => {
      window.removeEventListener('grocery-data-changed', handleDataChanged)
    }
  }, [filters])

  const handleFormChange = (event) => {
    const { name, value, type, checked } = event.target
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleFormPurchasedToggle = () => {
    setForm((current) => ({
      ...current,
      purchased: !current.purchased,
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
      await createGrocery({
        ...form,
        quantity: Number(form.quantity),
        expiryDate: displayedExpiryDate || null,
      })

      setForm(initialForm)
      loadItems()
      loadCategoryOptions()
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Could not save this buying item. Check the values and try again.'))
    }
  }

  const handleCategorySelect = (event) => {
    const nextCategory = event.target.value
    setForm((current) => ({
      ...current,
      category: nextCategory,
      purchased: false,
      expiryDate: '',
    }))
    loadCatalogItems(nextCategory, form.name)
  }

  const handleNameInput = (event) => {
    const nextName = event.target.value
    setForm((current) => ({
      ...current,
      name: nextName,
      purchased: false,
      expiryDate: '',
    }))
    loadCatalogItems(form.category, nextName)
  }

  const handleCatalogPick = (catalogItem) => {
    setForm((current) => ({
      ...initialForm,
      quantity: current.quantity,
      name: catalogItem.name,
      category: catalogItem.category,
    }))
  }

  const handleTogglePurchased = async (item) => {
    setError('')
    const nextPurchased = !item.purchased
    const nextExpiryDate = nextPurchased ? item.expiryDate || null : null

    try {
      await updateGrocery(item.id, {
        ...item,
        purchased: nextPurchased,
        expiryDate: nextExpiryDate,
      })

      loadItems()
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Could not update item status.'))
    }
  }

  const requestDelete = (item) => {
    setConfirmDeleteItem(item)
  }

  const handleDelete = async () => {
    if (!confirmDeleteItem) {
      return
    }

    setError('')
    setDeleteBusy(true)

    try {
      await deleteGrocery(confirmDeleteItem.id)
      loadItems()
      setConfirmDeleteItem(null)
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Could not delete item.'))
    } finally {
      setDeleteBusy(false)
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <ConfirmDialog
        open={Boolean(confirmDeleteItem)}
        title="Delete grocery item?"
        description={
          confirmDeleteItem
            ? `${confirmDeleteItem.name} will be removed from your inventory.`
            : 'This action will remove the selected grocery item.'
        }
        confirmLabel="Delete Item"
        busy={deleteBusy}
        onConfirm={handleDelete}
        onClose={() => !deleteBusy && setConfirmDeleteItem(null)}
      />

      <Card className="border-white/60 bg-white/80 p-6 shadow-[0_15px_50px_rgba(15,23,42,0.08)]">
        <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.3em] text-sky-700">
          <Plus size={14} /> Buy Item
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
          Build your purchase flow
        </h2>
        <p className="mt-3 max-w-lg text-sm text-slate-600">
          Keep your kitchen inventory current so the app can surface reminders for items that are close
          to expiring or expire today.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleAddItem}>
          <Input
            name="name"
            value={form.name}
            onChange={handleNameInput}
            placeholder="Item name"
            required
          />

          <Input
            as="select"
            name="category"
            value={form.category}
            onChange={handleCategorySelect}
            required
          >
            <option value="">Select category</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </Input>
          <Input
            name="quantity"
            type="number"
            min="1"
            value={form.quantity}
            onChange={handleFormChange}
            placeholder="Quantity"
            required
          />

          <Button
            type="button"
            onClick={handleFormPurchasedToggle}
            className={`w-full rounded-2xl font-medium ${
              form.purchased
                ? 'border-sky-300 bg-sky-50 text-sky-800 hover:border-sky-300 hover:bg-sky-50'
                : ''
            }`}
          >
            {form.purchased ? 'Purchased' : 'Set As Purchased'}
          </Button>

          <Input
            readOnly
            value={formatExpiryDate(displayedExpiryDate)}
            inputClassName="bg-slate-50 text-slate-700"
          />
          <p className="text-xs text-slate-500">
            {naturalExpiryDate
              ? `Natural expiry date: ${formatExpiryDate(naturalExpiryDate)}.`
              : 'Expiry is calculated automatically from the item name or category once you mark it purchased.'}
          </p>

          <Button type="submit" variant="primary" size="lg" fullWidth className="rounded-2xl">
            <Plus size={16} /> Save Buy Item
          </Button>
        </form>

        <div className="mt-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
              Daily Picks
            </p>
            <p className="text-xs text-slate-400">Click to autofill item and category</p>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {catalogItems.slice(0, 8).map((catalogItem) => (
              <Button
                key={`${catalogItem.category}-${catalogItem.name}`}
                type="button"
                onClick={() => handleCatalogPick(catalogItem)}
                className={`rounded-2xl px-4 py-3 text-left transition ${suggestionClasses}`}
                style={suggestionCardStyle}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">{catalogItem.name}</p>
                </div>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">
                  {catalogItem.category}
                </p>
              </Button>
            ))}
          </div>
        </div>
      </Card>

      <Card className="border-white/60 bg-white/80 p-6 shadow-[0_15px_50px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700">
              <Package size={14} /> Inventory
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              Search and filter groceries
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Search"
                inputClassName="py-3 pl-9 pr-4"
              />
            </div>
            <div className="relative">
              <Tag size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                as="select"
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
                inputClassName="py-3 pl-9 pr-4"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </Input>
            </div>
            <div className="relative">
              <Filter size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                as="select"
                name="purchased"
                value={filters.purchased}
                onChange={handleFilterChange}
                inputClassName="py-3 pl-9 pr-4"
              >
                <option value="">All Status</option>
                <option value="true">Purchased</option>
                <option value="false">Pending</option>
              </Input>
            </div>
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
                    <p className="mt-1 text-xs text-slate-400">
                      {item.purchased ? 'Expiry date' : 'Expected expiry'}:{' '}
                      {formatExpiryDate(getExpectedExpiryDate(item))}
                    </p>
                    {item.lastPurchasedAt && (
                      <p className="mt-1 text-xs text-slate-400">
                        Last purchased: {new Date(item.lastPurchasedAt).toLocaleString()}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button
                      type="button"
                      onClick={() => handleTogglePurchased(item)}
                      variant="secondary"
                      className="font-medium"
                    >
                      {item.purchased ? <CheckCircle size={14} className="text-emerald-500" /> : <Circle size={14} className="text-slate-400" />}
                      {item.purchased ? 'Move to Pending' : 'Mark as Bought'}
                    </Button>
                    <Button
                      type="button"
                      onClick={() => requestDelete(item)}
                      variant="danger"
                      className="font-medium"
                    >
                      <Trash2 size={14} /> Delete
                    </Button>
                  </div>
                </div>
              </article>
            ))}
        </div>
      </Card>
    </div>
  )
}

export default InventoryPage
