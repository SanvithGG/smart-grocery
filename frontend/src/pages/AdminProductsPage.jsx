import { useEffect, useMemo, useState } from 'react'
import api, { getApiErrorMessage } from '../api/client'

function AdminProductsPage() {
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  const loadProducts = async () => {
    try {
      const { data } = await api.get('/api/admin/products')
      setProducts(data)
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to load products.'))
    }
  }

  useEffect(() => {
    let cancelled = false

    api.get('/api/admin/products')
      .then(({ data }) => {
        if (!cancelled) {
          setProducts(data)
        }
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(getApiErrorMessage(requestError, 'Unable to load products.'))
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  const handleDelete = async (id) => {
    setError('')

    try {
      await api.delete(`/api/admin/products/${id}`)
      await loadProducts()
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to delete product.'))
    }
  }

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) {
      return products
    }

    return products.filter((product) =>
      [product.name, product.category, product.username].some((value) =>
        value?.toLowerCase().includes(query),
      ),
    )
  }, [products, search])

  return (
    <div className="space-y-6">
      <section className="rounded-4xl border border-white/70 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
        <p className="text-sm font-semibold uppercase tracking-[0.32em] text-sky-700">Manage Products</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">All grocery products</h2>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="mt-5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-500"
          placeholder="Search by product, category, or user"
        />
      </section>

      {error && <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      <div className="grid gap-4">
        {filteredProducts.map((product) => (
          <article key={product.id} className="rounded-3xl border border-white/70 bg-white/85 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-lg font-semibold text-slate-950">{product.name}</h3>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                    {product.category}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  User: {product.username} | Quantity: {product.quantity} | Status: {product.purchased ? 'Purchased' : 'Pending'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleDelete(product.id)}
                className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100"
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

export default AdminProductsPage
