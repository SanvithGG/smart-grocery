import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { getApiErrorMessage } from '../api/client'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import { SkeletonCard } from '../components/ui/Skeleton'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { useToast } from '../components/ui/toast'
import { 
  getShoppingList, 
  updateGrocery, 
  getGroceries, 
  deleteGrocery, 
} from '../services/groceryService'

const DISMISSED_ITEMS_STORAGE_KEY = 'smart-grocery-shopping-list-dismissed'
const LOW_STOCK_THRESHOLD = 2





const formatDateLabel = (value) => {
  if (!value) return 'Not set'
  return new Date(`${value}T00:00:00`).toLocaleDateString()
}

const getPriorityBadgeClasses = (priority) => {
  if (priority === 'HIGH') return 'bg-rose-100 text-rose-800 border border-rose-200'
  if (priority === 'MEDIUM') return 'bg-amber-100 text-amber-800 border border-amber-200'
  return 'bg-emerald-100 text-emerald-800 border border-emerald-200'
}

const shoppingHeroStyle = {
  background: '#ffffff',
}

function ShoppingListPage() {
  const toast = useToast()
  const [items, setItems] = useState([])
  const [manualItems, setManualItems] = useState([])
  const [dismissedItemIds, setDismissedItemIds] = useState([])
  


  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [updatingItemId, setUpdatingItemId] = useState('')
  const [confirmDeleteItem, setConfirmDeleteItem] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const loadData = async () => {
    setLoading(true)
    setError('')

    try {
      const [suggestionsData, manualData] = await Promise.all([
        getShoppingList(),
        getGroceries({ purchased: false }),
      ])
      
      setItems(suggestionsData)
      setManualItems(manualData)
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to load buy queue data.'))
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
    loadData()
  }, [])

  useEffect(() => {
    const handleDataChanged = () => loadData()
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



  const handleMarkPurchased = async (item, isSuggestion = false) => {
    const nextQuantity = isSuggestion 
      ? (Number(item.quantity) <= LOW_STOCK_THRESHOLD ? LOW_STOCK_THRESHOLD + 1 : Number(item.quantity) || 1)
      : Number(item.quantity) || 1

    const itemId = isSuggestion ? item.itemId : item.id

    setError('')
    setUpdatingItemId(itemId)

    try {
      await updateGrocery(itemId, {
        name: item.name,
        category: item.category,
        quantity: nextQuantity,
        purchased: true,
        expiryDate: item.expiryDate || null,
      })

      await loadData()
      window.dispatchEvent(new Event('grocery-data-changed'))
      toast.success(`${item.name} marked as bought.`)
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Could not mark this item as purchased.'))
      toast.error('Could not update this shopping item.')
    } finally {
      setUpdatingItemId('')
    }
  }

  const handleDelete = async () => {
    if (!confirmDeleteItem) return
    setError('')
    setDeleteBusy(true)

    try {
      await deleteGrocery(confirmDeleteItem.id)
      loadData()
      setConfirmDeleteItem(null)
      toast.success(`${confirmDeleteItem.name} removed from queue.`)
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Could not delete item.'))
    } finally {
      setDeleteBusy(false)
    }
  }

  const visibleSuggestions = items.filter((item) => !dismissedItemIds.includes(item.itemId))

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <ConfirmDialog
        open={Boolean(confirmDeleteItem)}
        title="Remove item from queue?"
        description={confirmDeleteItem ? `${confirmDeleteItem.name} will be removed from your buy queue.` : ''}
        confirmLabel="Remove Item"
        busy={deleteBusy}
        onConfirm={handleDelete}
        onClose={() => !deleteBusy && setConfirmDeleteItem(null)}
      />

      <div className="space-y-6">
        <Card className="border-emerald-100 p-6 shadow-[0_20px_80px_rgba(15,23,42,0.08)]" style={shoppingHeroStyle}>
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-sky-700">Buy Queue</p>
          <h2 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950">Buy queue</h2>
          <p className="mt-4 max-w-2xl text-sm text-slate-600 sm:text-base">
            Items you manually want to buy, or smart suggestions based on low stock and expiry. Mark them as bought to move them to inventory.
          </p>
        </Card>

        {error && (
          <div className="rounded-[28px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            {error}
          </div>
        )}

        <Card className="border-white/60 bg-white/80 p-6 shadow-[0_15px_50px_rgba(15,23,42,0.08)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Smart Suggestions</p>
              <p className="mt-2 text-sm text-slate-500">{visibleSuggestions.length} active suggestions</p>
            </div>
            {dismissedItemIds.length > 0 && (
              <Button type="button" onClick={handleRestoreDismissed} variant="secondary">
                Restore dismissed ({dismissedItemIds.length})
              </Button>
            )}
          </div>

          <div className="mt-6 space-y-4">
            {loading && Array.from({ length: 2 }).map((_, index) => <SkeletonCard key={index} lines={3} />)}
            {!loading && visibleSuggestions.length === 0 && (
              <p className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                No smart suggestions at this time.
              </p>
            )}

            {!loading && visibleSuggestions.map((item) => {
              const isExpiring = item.reasons?.includes('EXPIRING')
              const isLowStock = item.reasons?.includes('LOW_STOCK')

              return (
                <article key={item.itemId} className={`rounded-3xl border px-5 py-4 ${isExpiring ? 'border-sky-200 bg-sky-50' : 'border-slate-100 bg-slate-50'}`}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-slate-900">{item.name}</p>
                      <p className="text-sm text-slate-500">{item.category} | Qty {item.quantity}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold tracking-[0.2em] ${getPriorityBadgeClasses(item.priority)}`}>
                        {item.priority}
                      </span>
                      {isLowStock && <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold tracking-[0.2em] text-slate-700">LOW STOCK</span>}
                      {isExpiring && <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold tracking-[0.2em] text-sky-800">EXPIRING</span>}
                    </div>
                  </div>

                  {isExpiring && <p className="mt-2 text-sm text-slate-700">Current expiry: {formatDateLabel(item.expiryDate)}</p>}

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <Button type="button" onClick={() => handleMarkPurchased(item, true)} disabled={updatingItemId === item.itemId} variant="success">
                      {updatingItemId === item.itemId ? 'Updating...' : 'Bought'}
                    </Button>
                    <Button type="button" onClick={() => handleDismissItem(item.itemId)} variant="secondary">
                      Dismiss
                    </Button>
                  </div>
                </article>
              )
            })}
          </div>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="border-white/60 bg-white/80 p-6 shadow-[0_15px_50px_rgba(15,23,42,0.08)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Manual Queue</p>
              <p className="mt-2 text-sm text-slate-500">{manualItems.length} items to buy</p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {loading && Array.from({ length: 2 }).map((_, index) => <SkeletonCard key={index} lines={2} />)}
            {!loading && manualItems.length === 0 && (
              <p className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                No items added manually.
              </p>
            )}

            {!loading && manualItems.map((item) => (
              <article key={item.id} className="rounded-3xl border border-slate-100 bg-slate-50 px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-slate-900">{item.name}</p>
                    <p className="text-sm text-slate-500">{item.category} | Qty {item.quantity}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" onClick={() => handleMarkPurchased(item, false)} disabled={updatingItemId === item.id} variant="success">
                      {updatingItemId === item.id ? '...' : 'Bought'}
                    </Button>
                    <Button type="button" onClick={() => setConfirmDeleteItem(item)} variant="danger">
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </Card>


      </div>
    </div>
  )
}

export default ShoppingListPage
