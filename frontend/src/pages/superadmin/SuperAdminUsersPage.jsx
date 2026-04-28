import { useEffect, useMemo, useState } from 'react'
import { getApiErrorMessage } from '../../api/client'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import {
  deleteAdminUser,
  getAdminUsers,
  updateAdminUserRole,
} from '../../services/adminService'

const roleOptions = [
  { value: 'USER', label: 'User' },
  { value: 'SELLER', label: 'Seller' },
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
]

const filterOptions = [
  { value: 'ALL', label: 'All Accounts' },
  { value: 'USER', label: 'Users' },
  { value: 'SELLER', label: 'Sellers' },
  { value: 'SUPER_ADMIN', label: 'Super Admins' },
]

function SuperAdminUsersPage() {
  const [users, setUsers] = useState([])
  const [activeFilter, setActiveFilter] = useState('ALL')
  const [error, setError] = useState('')
  const [savingId, setSavingId] = useState(null)
  const [confirmDeleteUser, setConfirmDeleteUser] = useState(null)

  const loadUsers = async () => {
    try {
      setUsers(await getAdminUsers())
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to load superadmin users.'))
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const roleCounts = useMemo(
    () =>
      users.reduce(
        (counts, user) => ({
          ...counts,
          [user.role]: (counts[user.role] || 0) + 1,
        }),
        { USER: 0, SELLER: 0, SUPER_ADMIN: 0 },
      ),
    [users],
  )

  const filteredUsers =
    activeFilter === 'ALL' ? users : users.filter((user) => user.role === activeFilter)

  const handleRoleChange = async (user, role) => {
    setSavingId(user.id)
    setError('')

    try {
      await updateAdminUserRole(user.id, role)
      await loadUsers()
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to update account role.'))
    } finally {
      setSavingId(null)
    }
  }

  const handleDeleteUser = async () => {
    if (!confirmDeleteUser) {
      return
    }

    setSavingId(confirmDeleteUser.id)
    setError('')

    try {
      await deleteAdminUser(confirmDeleteUser.id)
      await loadUsers()
      setConfirmDeleteUser(null)
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to delete account.'))
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <ConfirmDialog
        open={Boolean(confirmDeleteUser)}
        title="Delete account?"
        description={
          confirmDeleteUser
            ? `${confirmDeleteUser.username} and their related grocery data will be removed.`
            : 'Delete the selected account.'
        }
        confirmLabel="Delete Account"
        busy={savingId === confirmDeleteUser?.id}
        onConfirm={handleDeleteUser}
        onClose={() => setConfirmDeleteUser(null)}
      />

      <Card
        eyebrow="Super Admin Users"
        title="Users, sellers, and role control"
        description="Promote users into sellers, demote sellers, assign superadmin access, and manage platform accounts globally."
      />

      {error && (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-4">
        {[
          ['All', users.length, 'text-slate-500'],
          ['Users', roleCounts.USER, 'text-sky-700'],
          ['Sellers', roleCounts.SELLER, 'text-emerald-700'],
          ['Admins', roleCounts.SUPER_ADMIN, 'text-indigo-700'],
        ].map(([label, value, tone]) => (
          <article key={label} className="rounded-3xl border border-white/70 bg-white/85 p-5">
            <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${tone}`}>{label}</p>
            <p className="mt-3 text-3xl font-semibold text-slate-950">{value}</p>
          </article>
        ))}
      </section>

      <div className="flex flex-wrap gap-2 rounded-4xl border border-white/70 bg-white/80 p-2">
        {filterOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setActiveFilter(option.value)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeFilter === option.value
                ? 'bg-slate-950 text-white'
                : 'text-slate-600 hover:bg-white hover:text-slate-950'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4">
        {filteredUsers.length === 0 && (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white/85 px-5 py-8 text-sm text-slate-500">
            No accounts found for this filter.
          </div>
        )}

        {filteredUsers.map((user) => (
          <article key={user.id} className="rounded-3xl border border-white/70 bg-white/85 p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-lg font-semibold text-slate-950">{user.username}</h3>
                  <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                    {user.role}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-500">{user.email}</p>
                <p className="mt-2 text-sm text-slate-500">
                  Items: {user.totalItems} | Purchased: {user.purchasedItems} | Pending: {user.pendingItems}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {roleOptions
                  .filter((roleOption) => roleOption.value !== user.role)
                  .map((roleOption) => (
                    <Button
                      key={`${user.id}-${roleOption.value}`}
                      type="button"
                      onClick={() => handleRoleChange(user, roleOption.value)}
                      disabled={savingId === user.id}
                      variant={roleOption.value === 'SELLER' ? 'success' : 'secondary'}
                    >
                      {savingId === user.id ? 'Saving...' : `Make ${roleOption.label}`}
                    </Button>
                  ))}
                <Button
                  type="button"
                  onClick={() => setConfirmDeleteUser(user)}
                  disabled={savingId === user.id}
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

export default SuperAdminUsersPage
