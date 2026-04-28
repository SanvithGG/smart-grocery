import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ArrowRight,
  CircleUserRound,
  KeyRound,
  LockKeyhole,
  Mail,
  UserRound,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { getApiErrorMessage } from '../api/client'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import {
  login,
  loginWithGoogle,
  register,
  requestPasswordReset,
  resetPassword,
} from '../services/authService'
import { normalizeRole, setSession } from '../utils/session'

const initialForm = {
  username: '',
  email: '',
  password: '',
  resetToken: '',
}

const authPageStyle = {
  background:
    'radial-gradient(circle at top left, rgba(20,184,166,0.18), transparent 32%), linear-gradient(135deg, #f8fafc 0%, #ecfeff 42%, #fefce8 100%)',
}

function getPostLoginPath(role) {
  const normalizedRole = normalizeRole(role)

  if (normalizedRole === 'SUPER_ADMIN') {
    return '/super-admin'
  }

  if (normalizedRole === 'SELLER') {
    return '/seller'
  }

  return '/home'
}

function AuthPage({ mode }) {
  const navigate = useNavigate()
  const isLogin = mode === 'login'
  const isForgotPassword = mode === 'forgot-password'
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetRequested, setResetRequested] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const googleButtonRef = useRef(null)
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleModeSwitch = () => {
    setError('')
    setSuccess('')
    setResetRequested(false)
    setForm(initialForm)
  }

  const handleGoogleCredential = useCallback(async (response) => {
    if (!response?.credential) {
      setError('Google login did not return a credential.')
      return
    }

    setError('')
    setGoogleLoading(true)

    try {
      const data = await loginWithGoogle(response.credential)
      setSession(data)
      navigate(getPostLoginPath(data.role))
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Google login failed. Check your setup and backend.'))
    } finally {
      setGoogleLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    if (!googleClientId || !googleButtonRef.current) {
      return undefined
    }

    let isMounted = true

    const initializeGoogle = () => {
      if (!isMounted || !window.google?.accounts?.id || !googleButtonRef.current) {
        return
      }

      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCredential,
      })

      googleButtonRef.current.innerHTML = ''
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        width: googleButtonRef.current.offsetWidth || 360,
      })
    }

    if (window.google?.accounts?.id) {
      initializeGoogle()
    } else {
      const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]')
      const script = existingScript || document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = initializeGoogle

      if (!existingScript) {
        document.body.appendChild(script)
      }
    }

    return () => {
      isMounted = false
    }
  }, [googleClientId, handleGoogleCredential])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (isForgotPassword && !resetRequested) {
        const data = await requestPasswordReset(form.username)
        setForm((current) => ({ ...current, resetToken: data.resetToken || '' }))
        setResetRequested(true)
        setSuccess(data.message || 'Reset token generated. Enter a new password to continue.')
      } else if (isForgotPassword) {
        const message = await resetPassword({
          token: form.resetToken,
          newPassword: form.password,
        })
        setSuccess(message || 'Password reset successfully. You can login now.')
        setTimeout(() => navigate('/login'), 900)
      } else if (isLogin) {
        const data = await login({
          username: form.username,
          password: form.password,
        })

        setSession(data)
        navigate(getPostLoginPath(data.role))
      } else {
        await register(form)
        navigate('/login')
      }
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Request failed. Check your input and backend.'))
    } finally {
      setLoading(false)
    }
  }

  const eyebrow = isForgotPassword ? 'Reset password' : isLogin ? 'Login' : 'Register'
  const title = isForgotPassword
    ? resetRequested
      ? 'Create a new password'
      : 'Recover your account'
    : isLogin
      ? 'Welcome back'
      : 'Create your account'
  const description = isForgotPassword
    ? resetRequested
      ? 'Use the reset token below and set a new password for your grocery workspace.'
      : 'Enter your username or email to generate a temporary reset token.'
    : isLogin
      ? 'Sign in to open your grocery workspace.'
      : 'Create an account to start tracking your groceries.'

  return (
    <div className="min-h-screen px-4 py-8 text-slate-900 sm:px-6 lg:px-8" style={authPageStyle}>
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl items-center justify-center">
        <Card as="section" className="w-full rounded-xl border-slate-200 bg-white p-6 text-slate-900 shadow-[0_24px_70px_rgba(15,23,42,0.16)] sm:p-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-700">
                {eyebrow}
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight">
                {title}
              </h2>
              <p className="mt-3 max-w-sm text-sm leading-6 text-slate-500">
                {description}
              </p>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <CircleUserRound className="h-6 w-6" />
            </div>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <Input
              label={isLogin || isForgotPassword ? 'Username or Email' : 'Username'}
              name="username"
              value={form.username}
              onChange={handleChange}
              required
              disabled={isForgotPassword && resetRequested}
              placeholder={isLogin || isForgotPassword ? 'Enter username or email' : 'Enter username'}
              className="block"
              inputClassName="pl-11"
            />
            <div className="pointer-events-none -mt-[66px] ml-3 flex h-11 w-5 items-center text-slate-400">
              <UserRound className="h-5 w-5" />
            </div>

            {!isLogin && !isForgotPassword && (
              <>
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="Enter email"
                  className="block"
                  inputClassName="pl-11"
                />
                <div className="pointer-events-none -mt-[66px] ml-3 flex h-11 w-5 items-center text-slate-400">
                  <Mail className="h-5 w-5" />
                </div>
              </>
            )}

            {isForgotPassword && resetRequested && (
              <>
                <Input
                  label="Reset Token"
                  name="resetToken"
                  value={form.resetToken}
                  onChange={handleChange}
                  required
                  placeholder="Paste reset token"
                  className="block"
                  inputClassName="pl-11"
                />
                <div className="pointer-events-none -mt-[66px] ml-3 flex h-11 w-5 items-center text-slate-400">
                  <KeyRound className="h-5 w-5" />
                </div>
              </>
            )}

            {(!isForgotPassword || resetRequested) && (
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  {isForgotPassword ? 'New Password' : 'Password'}
                </span>
                <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3 transition focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-100">
                  <LockKeyhole className="h-5 w-5 text-slate-400" />
                  <input
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                    className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm outline-none"
                    placeholder={isForgotPassword ? 'Enter new password' : 'Enter password'}
                    required
                    minLength={8}
                  />
                </div>
              </label>
            )}

            {error && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {success}
              </div>
            )}

            <Button type="submit" variant="primary" size="lg" fullWidth disabled={loading || googleLoading} className="rounded-lg shadow-lg shadow-slate-950/15 hover:border-emerald-700 hover:bg-emerald-700">
              <span>
                {loading
                  ? 'Please wait...'
                  : isForgotPassword
                    ? resetRequested
                      ? 'Reset Password'
                      : 'Generate Reset Token'
                    : isLogin
                      ? 'Enter Workspace'
                      : 'Create account'}
              </span>
              {!loading && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>

          {isLogin && (
            <div className="mt-5">
              <div className="mb-4 flex items-center gap-3">
                <span className="h-px flex-1 bg-slate-200" />
                <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
                  Or
                </span>
                <span className="h-px flex-1 bg-slate-200" />
              </div>

              {googleClientId ? (
                <div
                  ref={googleButtonRef}
                  className={`mx-auto flex min-h-11 w-full justify-center ${
                    googleLoading || loading ? 'pointer-events-none opacity-60' : ''
                  }`}
                />
              ) : (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Add VITE_GOOGLE_CLIENT_ID in frontend/.env to enable Google login.
                </div>
              )}
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
            <p>
              {isLogin ? 'Need an account?' : 'Already have an account?'}{' '}
              <Link
                to={isLogin ? '/register' : '/login'}
                onClick={handleModeSwitch}
                className="font-semibold text-emerald-700 hover:text-emerald-800"
              >
                {isLogin ? 'Register here' : 'Login here'}
              </Link>
            </p>

            {isLogin && (
              <Link
                to="/forgot-password"
                onClick={handleModeSwitch}
                className="font-semibold text-slate-600 hover:text-emerald-700"
              >
                Forgot password?
              </Link>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

export default AuthPage
