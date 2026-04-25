import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ArrowRight,
  CircleUserRound,
  LockKeyhole,
  Mail,
  UserRound,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import api, { getApiErrorMessage } from '../api/client'
import { setSession } from '../utils/session'

const initialForm = {
  username: '',
  email: '',
  password: '',
}

const authPageStyle = {
  background:
    'radial-gradient(circle at top left, rgba(20,184,166,0.18), transparent 32%), linear-gradient(135deg, #f8fafc 0%, #ecfeff 42%, #fefce8 100%)',
}

function AuthPage({ mode }) {
  const navigate = useNavigate()
  const isLogin = mode === 'login'
  const googleButtonRef = useRef(null)
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleGoogleCredential = useCallback(async (response) => {
    if (!response?.credential) {
      setError('Google login did not return a credential.')
      return
    }

    setError('')
    setGoogleLoading(true)

    try {
      const { data } = await api.post('/auth/google', {
        credential: response.credential,
      })

      setSession(data)
      navigate(data.role === 'ADMIN' ? '/admin' : '/home')
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

    const renderGoogleButton = () => {
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
        shape: 'pill',
        width: googleButtonRef.current.offsetWidth || 320,
      })
    }

    if (window.google?.accounts?.id) {
      renderGoogleButton()
    } else {
      const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]')
      const script = existingScript || document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = renderGoogleButton

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
    setLoading(true)

    try {
      if (isLogin) {
        const { data } = await api.post('/auth/login', {
          username: form.username,
          password: form.password,
        })

        setSession(data)
        navigate(data.role === 'ADMIN' ? '/admin' : '/home')
      } else {
        await api.post('/auth/register', form)
        navigate('/login')
      }
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Request failed. Check your input and backend.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen px-4 py-8 text-slate-900 sm:px-6 lg:px-8" style={authPageStyle}>
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl items-center justify-center">
        <section className="w-full rounded-xl border border-slate-200 bg-white p-6 text-slate-900 shadow-[0_24px_70px_rgba(15,23,42,0.16)] sm:p-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-700">
                {isLogin ? 'Login' : 'Register'}
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight">
                {isLogin ? 'Welcome back' : 'Create your account'}
              </h2>
              <p className="mt-3 max-w-sm text-sm leading-6 text-slate-500">
                {isLogin
                  ? 'Sign in to open your grocery workspace.'
                  : 'Create an account to start tracking your groceries.'}
              </p>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <CircleUserRound className="h-6 w-6" />
            </div>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                {isLogin ? 'Username or Email' : 'Username'}
              </span>
              <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3 transition focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-100">
                <UserRound className="h-5 w-5 text-slate-400" />
                <input
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm outline-none"
              placeholder={isLogin ? 'Enter username or email' : 'Enter username'}
                  required
                />
              </div>
            </label>

            {!isLogin && (
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Email</span>
                <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3 transition focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-100">
                  <Mail className="h-5 w-5 text-slate-400" />
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm outline-none"
                    placeholder="Enter email"
                    required
                  />
                </div>
              </label>
            )}

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Password</span>
              <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3 transition focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-100">
                <LockKeyhole className="h-5 w-5 text-slate-400" />
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm outline-none"
                  placeholder="Enter password"
                  required
                />
              </div>
            </label>

            {error && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-950/15 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              <span>{loading ? 'Please wait...' : isLogin ? 'Enter Workspace' : 'Create account'}</span>
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
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
                  className={`mx-auto flex w-full max-w-[500px] justify-center ${
                    googleLoading ? 'pointer-events-none opacity-60' : ''
                  }`}
                />
              ) : (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Add VITE_GOOGLE_CLIENT_ID in frontend/.env to enable Google login.
                </div>
              )}
            </div>
          )}

          <p className="mt-6 text-sm text-slate-500">
            {isLogin ? 'Need an account?' : 'Already have an account?'}{' '}
            <Link
              to={isLogin ? '/register' : '/login'}
              className="font-semibold text-emerald-700 hover:text-emerald-800"
            >
              {isLogin ? 'Register here' : 'Login here'}
            </Link>
          </p>
        </section>
      </div>
    </div>
  )
}

export default AuthPage
