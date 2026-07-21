import { useEffect, useState } from 'react'
import { Search, Tag, Filter, Trash2, CheckCircle, Package } from 'lucide-react'
import { getApiErrorMessage } from '../api/client'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import Input from '../components/ui/Input'
import {
  deleteGrocery,
  getCategories,
  getGroceries,
  updateGrocery,
} from '../services/groceryService'
import { useSmartRules } from '../context/SmartRulesContext'
import ActionBoard from '../components/ActionBoard'
import { getNaturalExpiryDate, formatExpiryDate } from '../utils/expiry'



function InventoryPage() {
  const { rules } = useSmartRules()
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])

  const [filters, setFilters] = useState({ category: '', search: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirmDeleteItem, setConfirmDeleteItem] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const getExpectedExpiryDate = (item) =>
    item.expiryDate || getNaturalExpiryDate(item.name, item.category, rules) || ''

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

      params.purchased = true

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



  useEffect(() => {
    const initializePage = async () => {
      setLoading(true)
      setError('')

      try {
        const [itemsData, categoriesData] = await Promise.all([
          getGroceries(),
          getCategories(),
        ])

        setItems(itemsData)
        setCategories(categoriesData)
      } catch (requestError) {
        setError(getApiErrorMessage(requestError, 'Unable to load grocery items. Make sure the backend is running.'))
        setCategories([])
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

        params.purchased = true

        const [itemsData, categoriesData] = await Promise.all([
          getGroceries(params),
          getCategories(),
        ])

        setItems(itemsData)
        setCategories(categoriesData)
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

  const handleFilterChange = (event) => {
    const { name, value } = event.target
    const nextFilters = { ...filters, [name]: value }
    setFilters(nextFilters)
    loadItems(nextFilters)
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

      <div>
        <ActionBoard />
      </div>

      <Card className="border-white/60 bg-white/80 p-6 shadow-[0_15px_50px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700">
              <Package size={14} /> Inventory
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              Your groceries
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
                      Quantity: {item.quantity}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Expiry date:{' '}
                      {formatExpiryDate(getExpectedExpiryDate(item), 'Select item details to preview expiry')}
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
