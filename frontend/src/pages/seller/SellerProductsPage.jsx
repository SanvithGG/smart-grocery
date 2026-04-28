import { useEffect, useState } from 'react'
import { getApiErrorMessage } from '../../api/client'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Input from '../../components/ui/Input'
import { useToast } from '../../components/ui/toast'
import { sellerNavigationItems } from '../../data/sellerNavigation'
import RoleDashboardLayout from '../../layouts/RoleDashboardLayout'
import { getCategorySuggestions, getPriceSuggestion } from '../../utils/smartSuggestions'
import { getNaturalExpiryDate } from '../../utils/expiry'
import {
  createSellerProduct,
  deleteSellerProduct,
  getSellerProducts,
  updateSellerProduct,
} from '../../services/sellerService'

const emptyForm = {
  name: '',
  category: '',
  price: '',
  stock: '',
  expiryDate: '',
  active: true,
}

function SellerProductsPage() {
  const toast = useToast()
  const [products, setProducts] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [confirmDeleteProduct, setConfirmDeleteProduct] = useState(null)
  const categorySuggestions = getCategorySuggestions(form.name)
  const topCategorySuggestion = categorySuggestions[0]
  const aiExpirySuggestion = getNaturalExpiryDate(form.name, form.category)
  const aiPriceSuggestion = getPriceSuggestion(form.name, form.category)

  const loadProducts = async () => {
    try {
      setProducts(await getSellerProducts())
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to load seller products.'))
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    setForm((current) => {
      const nextForm = {
        ...current,
        [name]: type === 'checkbox' ? checked : value,
      }

      if (name === 'name' && !current.category) {
        nextForm.category = getCategorySuggestions(value)[0]
      }

      if ((name === 'name' || name === 'category') && !current.expiryDate) {
        nextForm.expiryDate = getNaturalExpiryDate(nextForm.name, nextForm.category) || ''
      }

      if ((name === 'name' || name === 'category') && !current.price) {
        nextForm.price = getPriceSuggestion(nextForm.name, nextForm.category)
      }

      return nextForm
    })
  }

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
  }

  const handleEdit = (product) => {
    setEditingId(product.id)
    setForm({
      name: product.name,
      category: product.category,
      price: String(product.price || getPriceSuggestion(product.name, product.category)),
      stock: String(product.stock),
      expiryDate: product.expiryDate || getNaturalExpiryDate(product.name, product.category) || '',
      active: product.active,
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')

    const payload = {
      ...form,
      price: Number(form.price),
      stock: Number(form.stock),
    }

    try {
      if (editingId) {
        await updateSellerProduct(editingId, payload)
        toast.success('Product updated.')
      } else {
        await createSellerProduct(payload)
        toast.success('Product added.')
      }
      await loadProducts()
      resetForm()
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to save seller product.'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirmDeleteProduct) {
      return
    }

    setSaving(true)
    setError('')

    try {
      await deleteSellerProduct(confirmDeleteProduct.id)
      await loadProducts()
      setConfirmDeleteProduct(null)
      toast.success('Product deleted.')
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to delete seller product.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <ConfirmDialog
        open={Boolean(confirmDeleteProduct)}
        title="Delete seller product?"
        description={
          confirmDeleteProduct
            ? `${confirmDeleteProduct.name} will be removed from your product list.`
            : 'Delete this product.'
        }
        confirmLabel="Delete Product"
        busy={saving}
        onConfirm={handleDelete}
        onClose={() => setConfirmDeleteProduct(null)}
      />

      <RoleDashboardLayout
        tone="light"
        collapsibleSidebar
        sidebarTitle="Seller Center"
        sidebarSubtitle="E-commerce"
        navItems={sellerNavigationItems}
        eyebrow="Seller Products"
        title="Manage your products"
        description="Add products, update pricing, and keep stock levels current for your seller account."
      >
        {error && (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <Card>
          <form className="grid gap-4 xl:grid-cols-[1fr_1fr_0.75fr_0.75fr_0.9fr_auto]" onSubmit={handleSubmit}>
            <Input name="name" value={form.name} onChange={handleChange} placeholder="Product name" required />
            <div>
              <Input as="select" name="category" value={form.category} onChange={handleChange} required>
                <option value="">Select category</option>
                {categorySuggestions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </Input>
              {form.name && topCategorySuggestion && (
                <p className="mt-2 animate-[fadeSlideIn_0.2s_ease-out] text-xs font-medium text-sky-700">
                  Smart suggestion: {topCategorySuggestion}
                </p>
              )}
            </div>
            <div>
              <Input name="price" type="number" min="0" value={form.price} onChange={handleChange} placeholder="Price" required />
              {aiPriceSuggestion && (
                <div className="mt-2 flex animate-[fadeSlideIn_0.2s_ease-out] flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-medium text-emerald-700">
                    Smart price: Rs {aiPriceSuggestion}
                  </p>
                  <button
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, price: aiPriceSuggestion }))}
                    className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 transition duration-200 hover:-translate-y-0.5 hover:bg-emerald-100"
                  >
                    Use smart price
                  </button>
                </div>
              )}
            </div>
            <Input name="stock" type="number" min="0" value={form.stock} onChange={handleChange} placeholder="Stock" required />
            <div>
              <Input
                name="expiryDate"
                type="date"
                value={form.expiryDate}
                onChange={handleChange}
                required
              />
              {aiExpirySuggestion && (
                <div className="mt-2 flex animate-[fadeSlideIn_0.2s_ease-out] flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-medium text-emerald-700">
                    Smart expiry: {aiExpirySuggestion}
                  </p>
                  <button
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, expiryDate: aiExpirySuggestion }))}
                    className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 transition duration-200 hover:-translate-y-0.5 hover:bg-emerald-100"
                  >
                    Use smart date
                  </button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <input name="active" type="checkbox" checked={form.active} onChange={handleChange} />
                Active
              </label>
              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? 'Saving...' : editingId ? 'Update' : 'Add'}
              </Button>
            </div>
          </form>
          {editingId && (
            <Button type="button" onClick={resetForm} variant="ghost" className="mt-3">
              Cancel edit
            </Button>
          )}
        </Card>

        <div className="grid gap-4">
          {products.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-5 py-8 text-sm text-slate-500 shadow-[0_18px_50px_rgba(15,23,42,0.07)]">
              No seller products yet. Add your first product above.
            </div>
          )}

          {products.map((product) => (
            <article key={product.id} className="rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.07)] transition duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_24px_65px_rgba(15,23,42,0.11)]">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-semibold text-slate-950">{product.name}</h3>
                    <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
                      {product.category}
                    </span>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
                      product.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {product.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    Price: Rs {product.price} | Stock: {product.stock} | Expires: {product.expiryDate || 'Not set'}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button type="button" onClick={() => handleEdit(product)} variant="secondary">
                    Edit
                  </Button>
                  <Button type="button" onClick={() => setConfirmDeleteProduct(product)} variant="danger">
                    Delete
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </RoleDashboardLayout>
    </>
  )
}

export default SellerProductsPage
