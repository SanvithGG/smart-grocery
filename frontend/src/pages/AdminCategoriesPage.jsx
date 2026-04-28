import { useEffect, useState } from 'react'
import { getApiErrorMessage } from '../api/client'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import { getAdminCategories, renameAdminCategory } from '../services/adminService'

function AdminCategoriesPage() {
  const [categories, setCategories] = useState([])
  const [drafts, setDrafts] = useState({})
  const [error, setError] = useState('')

  const loadCategories = async () => {
    try {
      const data = await getAdminCategories()
      setCategories(data)
      setDrafts(Object.fromEntries(data.map((category) => [category.name, category.name])))
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to load categories.'))
    }
  }

  useEffect(() => {
    let cancelled = false

    getAdminCategories()
      .then((data) => {
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
      await renameAdminCategory(currentName, drafts[currentName])
      await loadCategories()
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to rename category.'))
    }
  }

  return (
    <div className="space-y-6">
      <Card eyebrow="Manage Categories" title="Rename and review categories" />

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
                <Input
                  value={drafts[category.name] || ''}
                  onChange={(event) =>
                    setDrafts((current) => ({ ...current, [category.name]: event.target.value }))
                  }
                  inputClassName="py-2"
                />
                <Button
                  type="button"
                  onClick={() => handleRename(category.name)}
                  variant="secondary"
                >
                  Rename
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

export default AdminCategoriesPage
