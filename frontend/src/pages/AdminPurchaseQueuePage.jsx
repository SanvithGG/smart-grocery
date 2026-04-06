import { useEffect, useState } from 'react'
import api, { getApiErrorMessage } from '../api/client'

function AdminPurchaseQueuePage() {
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const [processingId, setProcessingId] = useState('')

  const loadQueue = async () => {
    try {
      const { data } = await api.get('/api/admin/purchase-queue')
      setItems(data)
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
      await api.post(`/api/admin/purchase-queue/${itemId}/fulfill`)
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
      <section className="rounded-4xl border border-white/70 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
        <p className="text-sm font-semibold uppercase tracking-[0.32em] text-sky-700">Manage Purchase Queue</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Pending purchases across users</h2>
        <p className="mt-3 max-w-3xl text-sm text-slate-500">
          Approve queued user purchases here. When admin completes a purchase, catalog stock is reduced
          and the item moves out of the pending queue.
        </p>
      </section>

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

              <button
                type="button"
                onClick={() => handleFulfill(item.id)}
                disabled={processingId === item.id}
                className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {processingId === item.id ? 'Processing...' : 'Complete Purchase'}
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

export default AdminPurchaseQueuePage
