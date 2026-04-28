import { useEffect, useState } from 'react'
import { getApiErrorMessage } from '../api/client'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import {
  deleteAdminUser,
  getAdminUsers,
  updateAdminUserRole,
} from '../services/adminService'

const roleOptions = [
  { value: 'USER', label: 'Set As User' },
  { value: 'SELLER', label: 'Set As Seller' },
  { value: 'SUPER_ADMIN', label: 'Set As Super Admin' },
]

function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [error, setError] = useState('')
  const [savingId, setSavingId] = useState(null)
  const [confirmDeleteUser, setConfirmDeleteUser] = useState(null)

  const loadUsers = async () => {
    try {
      setUsers(await getAdminUsers())
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to load users.'))
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleRoleChange = async (user, role) => {
    setSavingId(user.id)
    setError('')

    try {
      await updateAdminUserRole(user.id, role)
      await loadUsers()
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to update user role.'))
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
      setError(getApiErrorMessage(requestError, 'Unable to delete user.'))
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <ConfirmDialog
        open={Boolean(confirmDeleteUser)}
        title="Delete user account?"
        description={
          confirmDeleteUser
            ? `${confirmDeleteUser.username} and their related grocery items will be removed.`
            : 'Delete the selected user account.'
        }
        confirmLabel="Delete User"
        busy={savingId === confirmDeleteUser?.id}
        onConfirm={handleDeleteUser}
        onClose={() => setConfirmDeleteUser(null)}
      />

      <Card eyebrow="Manage Users" title="Users and roles" />

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
                {roleOptions
                  .filter((roleOption) => roleOption.value !== user.role)
                  .map((roleOption) => (
                    <Button
                      key={`${user.id}-${roleOption.value}`}
                      type="button"
                      onClick={() => handleRoleChange(user, roleOption.value)}
                      disabled={savingId === user.id}
                      variant="secondary"
                    >
                      {savingId === user.id ? 'Saving...' : roleOption.label}
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

export default AdminUsersPage
