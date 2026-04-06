import { useState } from 'react'
import { CircleUserRound } from 'lucide-react'
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
    'linear-gradient(135deg, #082f49 0%, #0f172a 45%, #14532d 100%)',
}

const authPanelStyle = {
  background:
    'linear-gradient(145deg, rgba(15,23,42,0.82), rgba(3,105,161,0.24) 58%, rgba(22,101,52,0.22) 100%)',
}

function AuthPage({ mode }) {
  const navigate = useNavigate()
  const isLogin = mode === 'login'
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

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
        navigate(data.role === 'ADMIN' ? '/admin' : '/')
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
    <div className="min-h-screen px-4 py-10 text-white sm:px-6 lg:px-8" style={authPageStyle}>
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section
          className="rounded-[36px] border border-white/10 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.35)] backdrop-blur"
          style={authPanelStyle}
        >
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-sky-300">
            Smart Grocery
          </p>
          <h1 className="mt-4 max-w-xl text-4xl font-semibold leading-tight sm:text-5xl">
            Buy smarter, track stock, and keep your kitchen under control.
          </h1>
          <p className="mt-6 max-w-2xl text-base text-slate-200 sm:text-lg">
            Sign in to manage inventory, review what needs to be bought next, and stay ahead of
            low-stock and expiry reminders.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-black/15 p-5">
              <p className="text-3xl font-semibold">Inventory</p>
              <p className="mt-2 text-sm text-slate-300">Track what is in stock right now</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/15 p-5">
              <p className="text-3xl font-semibold">Buy Queue</p>
              <p className="mt-2 text-sm text-slate-300">See what needs to be bought next</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/15 p-5">
              <p className="text-3xl font-semibold">Reminders</p>
              <p className="mt-2 text-sm text-slate-300">Catch low stock and expiry alerts early</p>
            </div>
          </div>
        </section>

        <section className="rounded-[36px] bg-white p-8 text-slate-900 shadow-[0_24px_80px_rgba(15,23,42,0.25)] sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-sky-700">
            {isLogin ? 'Login' : 'Register'}
          </p>
          <div className="mt-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
            <CircleUserRound className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight">
            {isLogin ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="mt-3 text-sm text-slate-500">
            {isLogin
              ? 'Use your username or email with your password to access your grocery workspace.'
              : 'Create an account to start managing inventory and purchase tracking.'}
          </p>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                {isLogin ? 'Username or Email' : 'Username'}
              </span>
              <input
                name="username"
                value={form.username}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-200 bg-sky-50/40 px-4 py-3 outline-none transition focus:border-sky-500"
                placeholder={isLogin ? 'Enter username or email' : 'Enter username'}
                required
              />
            </label>

            {!isLogin && (
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Email</span>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 bg-sky-50/40 px-4 py-3 outline-none transition focus:border-sky-500"
                  placeholder="Enter email"
                  required
                />
              </label>
            )}

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Password</span>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-200 bg-sky-50/40 px-4 py-3 outline-none transition focus:border-sky-500"
                placeholder="Enter password"
                required
              />
            </label>

            {error && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {loading ? 'Please wait...' : isLogin ? 'Enter Workspace' : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-sm text-slate-500">
            {isLogin ? 'Need an account?' : 'Already have an account?'}{' '}
            <Link
              to={isLogin ? '/register' : '/login'}
              className="font-semibold text-sky-700 hover:text-sky-800"
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
