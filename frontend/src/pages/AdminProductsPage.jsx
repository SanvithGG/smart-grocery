import { useEffect, useMemo, useState } from 'react'
import { getApiErrorMessage } from '../api/client'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import Input from '../components/ui/Input'
import { useToast } from '../components/ui/toast'
import {
  deleteAdminProduct,
  getAdminCatalogStock,
  getAdminProducts,
  updateAdminCatalogStock,
  updateAdminProduct,
} from '../services/adminService'

function AdminProductsPage({ workspace = 'admin' }) {
  const toast = useToast()
  const isSeller = workspace === 'seller'
  const [products, setProducts] = useState([])
  const [catalogStock, setCatalogStock] = useState([])
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [savingProductId, setSavingProductId] = useState(null)
  const [savingCatalogKey, setSavingCatalogKey] = useState('')
  const [confirmDeleteProduct, setConfirmDeleteProduct] = useState(null)

  const loadProducts = async () => {
    try {
      const [productsData, catalogStockData] = await Promise.all([
        getAdminProducts(),
        getAdminCatalogStock(),
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

    Promise.all([getAdminProducts(), getAdminCatalogStock()])
      .then(([productsResponse, catalogStockResponse]) => {
        if (!cancelled) {
          setProducts(productsResponse)
          setCatalogStock(catalogStockResponse.map((item) => ({
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

  const handleDelete = async () => {
    if (!confirmDeleteProduct) {
      return
    }

    setError('')
    setSavingProductId(confirmDeleteProduct.id)

    try {
      await deleteAdminProduct(confirmDeleteProduct.id)
      await loadProducts()
      setConfirmDeleteProduct(null)
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to delete product.'))
    } finally {
      setSavingProductId(null)
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
      await updateAdminProduct(product.id, {
        ...product,
        quantity: Number(product.quantity),
      })
      await loadProducts()
      toast.success(`${product.name} quantity saved.`)
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
      await updateAdminCatalogStock({
        name: item.name,
        category: item.category,
        quantity: Number(item.draftQuantity),
      })
      await loadProducts()
      toast.success(`${item.name} stock saved.`)
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to update catalog stock.'))
    } finally {
      setSavingCatalogKey('')
    }
  }

  return (
    <div className="space-y-6">
      <ConfirmDialog
        open={Boolean(confirmDeleteProduct)}
        title="Delete product?"
        description={
          confirmDeleteProduct
            ? `${confirmDeleteProduct.name} will be removed from the product list.`
            : 'Delete the selected product.'
        }
        confirmLabel="Delete Product"
        busy={savingProductId === confirmDeleteProduct?.id}
        onConfirm={handleDelete}
        onClose={() => setConfirmDeleteProduct(null)}
      />

      <Card
        eyebrow={isSeller ? 'Seller Products' : 'Manage Products'}
        title="All grocery products"
        description={
          isSeller
            ? 'Manage store stock, product quantities, and user purchase requests.'
            : 'Super admin controls store stock. Users can see stock state, but only seller or super admin can restock items or change catalog quantity.'
        }
      >
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="mt-5"
          placeholder="Search by product, category, or user"
        />
      </Card>

      {error && <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      <Card className="border-white/70 bg-white/85 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
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
                  <Input
                    type="number"
                    min="0"
                    value={item.draftQuantity}
                    onChange={(event) => handleCatalogQuantityChange(item.name, item.category, event.target.value)}
                    className="w-full"
                  />
                  <Button
                    type="button"
                    onClick={() => handleSaveCatalogQuantity(item)}
                    disabled={isSavingCatalog}
                    variant="success"
                    className="py-3"
                  >
                    {isSavingCatalog ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </article>
            )
          })}
        </div>
      </Card>

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
                <Input
                  type="number"
                  min="0"
                  value={product.quantity}
                  onChange={(event) => handleProductQuantityChange(product.id, event.target.value)}
                  className="w-28"
                  inputClassName="py-2"
                />
                <Button
                  type="button"
                  onClick={() => handleSaveProductQuantity(product)}
                  disabled={savingProductId === product.id}
                  variant="sky"
                >
                  {savingProductId === product.id ? 'Saving...' : 'Set Quantity'}
                </Button>
                <Button
                  type="button"
                  onClick={() => setConfirmDeleteProduct(product)}
                  variant="danger"
                >
                  Delete
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

export default AdminProductsPage
