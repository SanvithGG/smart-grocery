import { useEffect, useState } from 'react'
import api, { getApiErrorMessage } from '../api/client'

function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [error, setError] = useState('')
  const [savingId, setSavingId] = useState(null)

  const loadUsers = async () => {
    try {
      const { data } = await api.get('/api/admin/users')
      setUsers(data)
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to load users.'))
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleRoleToggle = async (user) => {
    setSavingId(user.id)
    setError('')

    try {
      await api.put(`/api/admin/users/${user.id}/role`, {
        role: user.role === 'ADMIN' ? 'USER' : 'ADMIN',
      })
      await loadUsers()
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to update user role.'))
    } finally {
      setSavingId(null)
    }
  }

  const handleDeleteUser = async (user) => {
    setSavingId(user.id)
    setError('')

    try {
      await api.delete(`/api/admin/users/${user.id}`)
      await loadUsers()
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to delete user.'))
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-4xl border border-white/70 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
        <p className="text-sm font-semibold uppercase tracking-[0.32em] text-sky-700">Manage Users</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Users and roles</h2>
      </section>

      {error && <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      <div className="grid gap-4">
        {users.map((user) => (
          <article key={user.id} className="rounded-3xl border border-white/70 bg-white/85 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-lg font-semibold text-slate-950">{user.username}</h3>
                  <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
                    {user.role}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-500">{user.email}</p>
                <p className="mt-2 text-sm text-slate-500">
                  Items: {user.totalItems} | Purchased: {user.purchasedItems} | Pending: {user.pendingItems}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => handleRoleToggle(user)}
                  disabled={savingId === user.id}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60"
                >
                  {savingId === user.id
                    ? 'Saving...'
                    : user.role === 'ADMIN'
                      ? 'Set As User'
                      : 'Set As Admin'}
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteUser(user)}
                  disabled={savingId === user.id}
                  className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100 disabled:opacity-60"
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

export default AdminUsersPage
