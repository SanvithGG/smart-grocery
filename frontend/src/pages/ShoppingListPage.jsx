import { useEffect, useState } from 'react'
import api, { getApiErrorMessage, getShoppingList } from '../api/client'

const DISMISSED_ITEMS_STORAGE_KEY = 'smart-grocery-shopping-list-dismissed'
const LOW_STOCK_THRESHOLD = 2

const formatDateLabel = (value) => {
  if (!value) {
    return 'Not set'
  }

  return new Date(`${value}T00:00:00`).toLocaleDateString()
}

const getPriorityBadgeClasses = (priority) => {
  if (priority === 'HIGH') {
    return 'bg-rose-100 text-rose-800 border border-rose-200'
  }

  if (priority === 'MEDIUM') {
    return 'bg-amber-100 text-amber-800 border border-amber-200'
  }

  return 'bg-emerald-100 text-emerald-800 border border-emerald-200'
}

const shoppingHeroStyle = {
  background:
    'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(255,255,255,0.92) 55%, rgba(14,165,233,0.14))',
}

function ShoppingListPage() {
  const [items, setItems] = useState([])
  const [dismissedItemIds, setDismissedItemIds] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [updatingItemId, setUpdatingItemId] = useState('')

  const loadShoppingItems = async () => {
    setLoading(true)
    setError('')

    try {
      const data = await getShoppingList()
      setItems(data)
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to load the smart shopping list.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    try {
      const stored = localStorage.getItem(DISMISSED_ITEMS_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          setDismissedItemIds(parsed.filter((id) => typeof id === 'number'))
        }
      }
    } catch {
      setDismissedItemIds([])
    }
  }, [])

  useEffect(() => {
    loadShoppingItems()
  }, [])

  useEffect(() => {
    const handleDataChanged = () => {
      loadShoppingItems()
    }

    window.addEventListener('grocery-data-changed', handleDataChanged)
    return () => window.removeEventListener('grocery-data-changed', handleDataChanged)
  }, [])

  const handleDismissItem = (itemId) => {
    setDismissedItemIds((current) => {
      const next = Array.from(new Set([...current, itemId]))
      localStorage.setItem(DISMISSED_ITEMS_STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  const handleRestoreDismissed = () => {
    localStorage.removeItem(DISMISSED_ITEMS_STORAGE_KEY)
    setDismissedItemIds([])
  }

  const handleMarkPurchased = async (item) => {
    const shouldIncreaseQuantity = Number(item.quantity) <= LOW_STOCK_THRESHOLD
    const nextQuantity = shouldIncreaseQuantity ? LOW_STOCK_THRESHOLD + 1 : Number(item.quantity) || 1

    setError('')
    setUpdatingItemId(item.itemId)

    try {
      await api.put(`/api/grocery/${item.itemId}`, {
        name: item.name,
        category: item.category,
        quantity: nextQuantity,
        purchased: true,
        expiryDate: item.expiryDate || null,
      })

      await loadShoppingItems()
      window.dispatchEvent(new Event('grocery-data-changed'))
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Could not mark this item as purchased.'))
    } finally {
      setUpdatingItemId('')
    }
  }

  const visibleItems = items.filter((item) => !dismissedItemIds.includes(item.itemId))

  return (
    <div className="space-y-6">
      <section
        className="rounded-4xl border border-emerald-100 p-6 shadow-[0_20px_80px_rgba(15,23,42,0.08)]"
        style={shoppingHeroStyle}
      >
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-sky-700">
          Buy Queue
        </p>
        <h2 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950">
          Auto-built from low stock and near-expiry items.
        </h2>
        <p className="mt-4 max-w-2xl text-sm text-slate-600 sm:text-base">
          Items show here when quantity is low or expiry is within the next 2 days. Mark them as
          bought to update inventory immediately, or dismiss items from this view.
        </p>
      </section>

      {error && (
        <div className="rounded-[28px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      <section className="rounded-4xl border border-white/60 bg-white/80 p-6 shadow-[0_15px_50px_rgba(15,23,42,0.08)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
              Buy Suggestions
              </p>
            <p className="mt-2 text-sm text-slate-500">
              {visibleItems.length} active suggestions
            </p>
          </div>

          {dismissedItemIds.length > 0 && (
            <button
              type="button"
              onClick={handleRestoreDismissed}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Restore dismissed ({dismissedItemIds.length})
            </button>
          )}
        </div>

        <div className="mt-6 space-y-4">
          {loading && (
            <p className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
              Loading smart shopping suggestions...
            </p>
          )}

          {!loading && visibleItems.length === 0 && (
            <p className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
              You're all set. No items need restocking.
            </p>
          )}

          {!loading &&
            visibleItems.map((item) => {
              const isExpiring = item.reasons?.includes('EXPIRING')
              const isLowStock = item.reasons?.includes('LOW_STOCK')

              return (
                <article
                  key={item.itemId}
                  className={`rounded-3xl border px-5 py-4 ${
                    isExpiring
                      ? 'border-sky-200 bg-sky-50'
                      : 'border-slate-100 bg-slate-50'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-slate-900">{item.name}</p>
                      <p className="text-sm text-slate-500">
                        {item.category} | Qty {item.quantity}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold tracking-[0.2em] ${getPriorityBadgeClasses(item.priority)}`}>
                        {item.priority}
                      </span>
                      {isLowStock && (
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold tracking-[0.2em] text-slate-700">
                          LOW STOCK
                        </span>
                      )}
                      {isExpiring && (
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold tracking-[0.2em] text-sky-800">
                          EXPIRING
                        </span>
                      )}
                    </div>
                  </div>

                  {isExpiring && (
                    <p className="mt-2 text-sm text-slate-700">
                      Current expiry: {formatDateLabel(item.expiryDate)}
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleMarkPurchased(item)}
                      disabled={updatingItemId === item.itemId}
                      className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {updatingItemId === item.itemId ? 'Updating...' : 'Bought'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDismissItem(item.itemId)}
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                    >
                      Dismiss
                    </button>
                  </div>
                </article>
              )
            })}
        </div>
      </section>
    </div>
  )
}

export default ShoppingListPage
