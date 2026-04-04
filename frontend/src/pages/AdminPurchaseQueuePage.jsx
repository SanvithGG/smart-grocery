import { useEffect, useState } from 'react'
import api, { getApiErrorMessage } from '../api/client'

function AdminPurchaseQueuePage() {
  const [items, setItems] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/api/admin/purchase-queue')
      .then(({ data }) => setItems(data))
      .catch((requestError) => {
        setError(getApiErrorMessage(requestError, 'Unable to load purchase queue.'))
      })
  }, [])

  return (
    <div className="space-y-6">
      <section className="rounded-4xl border border-white/70 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
        <p className="text-sm font-semibold uppercase tracking-[0.32em] text-sky-700">Manage Purchase Queue</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Pending purchases across users</h2>
      </section>

      {error && <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      <div className="grid gap-4">
        {items.map((item) => (
          <article key={item.id} className="rounded-3xl border border-white/70 bg-white/85 p-5">
            <h3 className="text-lg font-semibold text-slate-950">{item.name}</h3>
            <p className="mt-2 text-sm text-slate-500">
              User: {item.username} | Category: {item.category} | Quantity: {item.quantity}
            </p>
          </article>
        ))}
      </div>
    </div>
  )
}

export default AdminPurchaseQueuePage
