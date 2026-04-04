import { useEffect, useState } from 'react'
import api, { getApiErrorMessage } from '../api/client'

function AdminCategoriesPage() {
  const [categories, setCategories] = useState([])
  const [drafts, setDrafts] = useState({})
  const [error, setError] = useState('')

  const loadCategories = async () => {
    try {
      const { data } = await api.get('/api/admin/categories')
      setCategories(data)
      setDrafts(Object.fromEntries(data.map((category) => [category.name, category.name])))
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to load categories.'))
    }
  }

  useEffect(() => {
    let cancelled = false

    api.get('/api/admin/categories')
      .then(({ data }) => {
        if (cancelled) {
          return
        }

        setCategories(data)
        setDrafts(Object.fromEntries(data.map((category) => [category.name, category.name])))
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(getApiErrorMessage(requestError, 'Unable to load categories.'))
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  const handleRename = async (currentName) => {
    setError('')

    try {
      await api.put('/api/admin/categories/rename', {
        currentName,
        nextName: drafts[currentName],
      })
      await loadCategories()
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to rename category.'))
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-4xl border border-white/70 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
        <p className="text-sm font-semibold uppercase tracking-[0.32em] text-sky-700">Manage Categories</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Rename and review categories</h2>
      </section>

      {error && <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      <div className="grid gap-4">
        {categories.map((category) => (
          <article key={category.name} className="rounded-3xl border border-white/70 bg-white/85 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-950">{category.name}</h3>
                <p className="mt-2 text-sm text-slate-500">
                  Total: {category.totalProducts} | Purchased: {category.purchasedProducts} | Pending: {category.pendingProducts}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  value={drafts[category.name] || ''}
                  onChange={(event) =>
                    setDrafts((current) => ({ ...current, [category.name]: event.target.value }))
                  }
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none transition focus:border-sky-500"
                />
                <button
                  type="button"
                  onClick={() => handleRename(category.name)}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Rename
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

export default AdminCategoriesPage
