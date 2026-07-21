import { useEffect, useState } from 'react'
import { User, Bell, Shield, Sliders, Check, AlertCircle } from 'lucide-react'
import { getApiErrorMessage } from '../api/client'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import { useToast } from '../components/ui/toast'
import { getUserProfile, updateUserProfile } from '../services/userService'

const settingsStyle = {
  background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.85) 100%)',
}

const sectionHeaderClasses = 'flex items-center gap-3 pb-3 border-b border-slate-100'

function SettingsPage() {
  const toast = useToast()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState('')

  // Form states
  const [email, setEmail] = useState('')
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(true)
  const [lowStockThreshold, setLowStockThreshold] = useState(2)
  const [expiryThresholdDays, setExpiryThresholdDays] = useState(3)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const loadProfile = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await getUserProfile()
      setProfile(data)
      setEmail(data.email)
      setEmailNotificationsEnabled(data.emailNotificationsEnabled)
      setLowStockThreshold(data.lowStockThreshold)
      setExpiryThresholdDays(data.expiryThresholdDays)
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to load profile settings.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfile()
  }, [])

  const handleProfileSubmit = async (event) => {
    event.preventDefault()
    setUpdating(true)
    setError('')

    try {
      const payload = {
        email,
        emailNotificationsEnabled,
        lowStockThreshold: Number(lowStockThreshold),
        expiryThresholdDays: Number(expiryThresholdDays),
      }

      const updated = await updateUserProfile(payload)
      setProfile(updated)
      toast.success('Profile settings updated successfully.')
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Failed to update settings.'))
      toast.error('Failed to update settings.')
    } finally {
      setUpdating(false)
    }
  }

  const handlePasswordSubmit = async (event) => {
    event.preventDefault()
    
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.')
      return
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    setUpdating(true)
    setError('')

    try {
      const payload = {
        email,
        emailNotificationsEnabled,
        lowStockThreshold: Number(lowStockThreshold),
        expiryThresholdDays: Number(expiryThresholdDays),
        currentPassword,
        newPassword,
      }

      const updated = await updateUserProfile(payload)
      setProfile(updated)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      toast.success('Password changed successfully.')
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Failed to change password. Check your current password.'))
      toast.error('Failed to change password.')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm font-medium text-slate-500">
        <span className="animate-pulse">Loading settings...</span>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Account Settings</h2>
        <p className="mt-2 text-sm text-slate-500">
          Manage your profile details, customize notification thresholds, and configure password security.
        </p>
      </div>

      {error && (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-[1fr_1fr]">
        {/* Left Side: General Profile & Notification preferences */}
        <form onSubmit={handleProfileSubmit} className="space-y-6">
          <Card style={settingsStyle} className="p-6 border-white/60 shadow-[0_15px_50px_rgba(15,23,42,0.06)]">
            <div className={sectionHeaderClasses}>
              <User size={18} className="text-sky-600" />
              <h3 className="text-lg font-semibold text-slate-900">Profile Details</h3>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Username</label>
                <div className="mt-2 px-4 py-3 rounded-2xl bg-slate-100 text-slate-600 text-sm font-semibold flex justify-between">
                  <span>{profile?.username}</span>
                  <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {profile?.role}
                  </span>
                </div>
              </div>

              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                inputClassName="focus:border-sky-500 mt-2"
              />
            </div>
          </Card>

          <Card style={settingsStyle} className="p-6 border-white/60 shadow-[0_15px_50px_rgba(15,23,42,0.06)]">
            <div className={sectionHeaderClasses}>
              <Sliders size={18} className="text-emerald-600" />
              <h3 className="text-lg font-semibold text-slate-900">Smart Thresholds</h3>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Low Stock Threshold (Current: {lowStockThreshold})</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(e.target.value)}
                  className="w-full mt-2 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
                <p className="mt-1.5 text-xs text-slate-400">
                  Items with a quantity at or below this value will trigger stock alerts.
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Expiry Reminder Window (Current: {expiryThresholdDays} days)</label>
                <input
                  type="range"
                  min="1"
                  max="14"
                  value={expiryThresholdDays}
                  onChange={(e) => setExpiryThresholdDays(e.target.value)}
                  className="w-full mt-2 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
                <p className="mt-1.5 text-xs text-slate-400">
                  Items expiring within this many days will display in your kitchen alerts feed.
                </p>
              </div>
            </div>
          </Card>

          <Card style={settingsStyle} className="p-6 border-white/60 shadow-[0_15px_50px_rgba(15,23,42,0.06)]">
            <div className={sectionHeaderClasses}>
              <Bell size={18} className="text-amber-600" />
              <h3 className="text-lg font-semibold text-slate-900">Notification Channels</h3>
            </div>

            <div className="mt-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-800">Email Expiry Notifications</p>
                <p className="text-xs text-slate-500 mt-1">Receive daily email alerts for expiring inventory items.</p>
              </div>
              <button
                type="button"
                onClick={() => setEmailNotificationsEnabled(!emailNotificationsEnabled)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  emailNotificationsEnabled ? 'bg-amber-500' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    emailNotificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </Card>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            disabled={updating}
            className="rounded-2xl"
          >
            {updating ? 'Saving Settings...' : 'Save All Preferences'}
          </Button>
        </form>

        {/* Right Side: Password Reset / Security preferences */}
        <div className="space-y-6">
          <Card style={settingsStyle} className="p-6 border-white/60 shadow-[0_15px_50px_rgba(15,23,42,0.06)]">
            <div className={sectionHeaderClasses}>
              <Shield size={18} className="text-rose-600" />
              <h3 className="text-lg font-semibold text-slate-900">Security & Password</h3>
            </div>

            {profile?.provider === 'GOOGLE' ? (
              <div className="mt-6 p-4 rounded-2xl bg-sky-50 text-sky-800 text-sm border border-sky-100">
                You are currently signed in via <strong>Google Sign-In</strong>. Passwords are secure on Google, and reset actions are handled directly on Google platforms.
              </div>
            ) : (
              <form onSubmit={handlePasswordSubmit} className="mt-4 space-y-4">
                <Input
                  label="Current Password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  inputClassName="focus:border-rose-500 mt-2"
                />

                <Input
                  label="New Password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  inputClassName="focus:border-rose-500 mt-2"
                />

                <Input
                  label="Confirm New Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  inputClassName="focus:border-rose-500 mt-2"
                />

                <Button
                  type="submit"
                  variant="danger"
                  size="lg"
                  fullWidth
                  disabled={updating}
                  className="rounded-2xl mt-4"
                >
                  <Check size={16} /> {updating ? 'Updating Password...' : 'Change Password'}
                </Button>
              </form>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
