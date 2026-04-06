import { useEffect, useMemo, useState } from 'react'
import api, { getApiErrorMessage } from '../api/client'

function AdminProductsPage() {
  const [products, setProducts] = useState([])
  const [catalogStock, setCatalogStock] = useState([])
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [savingProductId, setSavingProductId] = useState(null)
  const [savingCatalogKey, setSavingCatalogKey] = useState('')

  const loadProducts = async () => {
    try {
      const [{ data: productsData }, { data: catalogStockData }] = await Promise.all([
        api.get('/api/admin/products'),
        api.get('/api/admin/catalog-stock'),
      ])
      setProducts(productsData)
      setCatalogStock(catalogStockData.map((item) => ({
        ...item,
        draftQuantity: item.availableQuantity ?? 0,
      })))
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to load product data.'))
    }
  }

  useEffect(() => {
    let cancelled = false

    Promise.all([api.get('/api/admin/products'), api.get('/api/admin/catalog-stock')])
      .then(([productsResponse, catalogStockResponse]) => {
        if (!cancelled) {
          setProducts(productsResponse.data)
          setCatalogStock(catalogStockResponse.data.map((item) => ({
            ...item,
            draftQuantity: item.availableQuantity ?? 0,
          })))
        }
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(getApiErrorMessage(requestError, 'Unable to load product data.'))
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

  const handleProductQuantityChange = (id, value) => {
    setProducts((current) => current.map((product) => (
      product.id === id
        ? { ...product, quantity: value }
        : product
    )))
  }

  const handleCatalogQuantityChange = (name, category, value) => {
    setCatalogStock((current) => current.map((item) => (
      item.name === name && item.category === category
        ? { ...item, draftQuantity: value }
        : item
    )))
  }

  const handleSaveProductQuantity = async (product) => {
    setError('')
    setSavingProductId(product.id)

    try {
      await api.put(`/api/admin/products/${product.id}`, {
        ...product,
        quantity: Number(product.quantity),
      })
      await loadProducts()
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to update product quantity.'))
    } finally {
      setSavingProductId(null)
    }
  }

  const handleSaveCatalogQuantity = async (item) => {
    const stockKey = `${item.category}-${item.name}`
    setError('')
    setSavingCatalogKey(stockKey)

    try {
      await api.put('/api/admin/catalog-stock', {
        name: item.name,
        category: item.category,
        quantity: Number(item.draftQuantity),
      })
      await loadProducts()
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to update catalog stock.'))
    } finally {
      setSavingCatalogKey('')
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-4xl border border-white/70 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
        <p className="text-sm font-semibold uppercase tracking-[0.32em] text-sky-700">Manage Products</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">All grocery products</h2>
        <p className="mt-3 max-w-3xl text-sm text-slate-500">
          Admin controls store stock. Users can see stock state, but only admin can restock items
          or change catalog quantity.
        </p>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="mt-5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-500"
          placeholder="Search by product, category, or user"
        />
      </section>

      {error && <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      <section className="rounded-4xl border border-white/70 bg-white/85 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700">Catalog Stock</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Restock and set quantity</h3>
          </div>
          <p className="text-sm text-slate-500">
            Two items start out of stock. Set quantity above `0` to restock them.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {catalogStock.map((item) => {
            const stockKey = `${item.category}-${item.name}`
            const isSavingCatalog = savingCatalogKey === stockKey

            return (
              <article key={stockKey} className="rounded-3xl border border-slate-200 bg-slate-50/90 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-lg font-semibold text-slate-950">{item.name}</h4>
                    <p className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-500">{item.category}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                    item.availability === 'OUT_OF_STOCK'
                      ? 'bg-rose-50 text-rose-700'
                      : item.availability === 'LOW_STOCK'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    {item.availability.replaceAll('_', ' ')}
                  </span>
                </div>

                <p className="mt-4 text-sm text-slate-500">Current store quantity</p>
                <div className="mt-2 flex items-center gap-3">
                  <input
                    type="number"
                    min="0"
                    value={item.draftQuantity}
                    onChange={(event) => handleCatalogQuantityChange(item.name, item.category, event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveCatalogQuantity(item)}
                    disabled={isSavingCatalog}
                    className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSavingCatalog ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      </section>

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

              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="number"
                  min="0"
                  value={product.quantity}
                  onChange={(event) => handleProductQuantityChange(product.id, event.target.value)}
                  className="w-28 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none transition focus:border-sky-500"
                />
                <button
                  type="button"
                  onClick={() => handleSaveProductQuantity(product)}
                  disabled={savingProductId === product.id}
                  className="rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700 transition hover:border-sky-300 hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingProductId === product.id ? 'Saving...' : 'Set Quantity'}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(product.id)}
                  className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100"
                >
                  Delete
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

export default AdminProductsPage
