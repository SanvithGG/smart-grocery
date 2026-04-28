import { useEffect, useState } from 'react'
import { getApiErrorMessage } from '../api/client'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import { fulfillAdminPurchase, getAdminPurchaseQueue } from '../services/adminService'

function AdminPurchaseQueuePage() {
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const [processingId, setProcessingId] = useState('')

  const loadQueue = async () => {
    try {
      setItems(await getAdminPurchaseQueue())
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to load purchase queue.'))
    }
  }

  useEffect(() => {
    loadQueue()
  }, [])

  useEffect(() => {
    const handleDataChanged = () => {
      loadQueue()
    }

    window.addEventListener('grocery-data-changed', handleDataChanged)
    return () => window.removeEventListener('grocery-data-changed', handleDataChanged)
  }, [])

  const handleFulfill = async (itemId) => {
    setError('')
    setProcessingId(itemId)

    try {
      await fulfillAdminPurchase(itemId)
      await loadQueue()
      window.dispatchEvent(new Event('grocery-data-changed'))
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to complete this purchase.'))
    } finally {
      setProcessingId('')
    }
  }

  return (
    <div className="space-y-6">
      <Card
        eyebrow="Manage Purchase Queue"
        title="Pending purchases across users"
        description="Approve queued user purchases here. When admin completes a purchase, catalog stock is reduced and the item moves out of the pending queue."
      />

      {error && <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      <div className="grid gap-4">
        {items.length === 0 && (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white/85 px-5 py-8 text-sm text-slate-500">
            No pending purchase requests right now.
          </div>
        )}

        {items.map((item) => (
          <article key={item.id} className="rounded-3xl border border-white/70 bg-white/85 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-950">{item.name}</h3>
                <p className="mt-2 text-sm text-slate-500">
                  User: {item.username} | Category: {item.category} | Quantity: {item.quantity}
                </p>
              </div>

              <Button
                type="button"
                onClick={() => handleFulfill(item.id)}
                disabled={processingId === item.id}
                variant="success"
              >
                {processingId === item.id ? 'Processing...' : 'Complete Purchase'}
              </Button>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

export default AdminPurchaseQueuePage
