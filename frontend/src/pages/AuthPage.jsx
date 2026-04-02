import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api, { getApiErrorMessage } from '../api/client'

const initialForm = {
  username: '',
  email: '',
  password: '',
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

        localStorage.setItem('token', data.token)
        navigate('/')
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
    <div className="min-h-screen bg-[linear-gradient(135deg,_#082f49,_#0f172a_45%,_#14532d)] px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[36px] border border-white/10 bg-white/8 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.35)] backdrop-blur">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-emerald-300">
            Sprint 4
          </p>
          <h1 className="mt-4 max-w-xl text-4xl font-semibold leading-tight sm:text-5xl">
            Plan groceries with a smarter, calmer workflow.
          </h1>
          <p className="mt-6 max-w-2xl text-base text-slate-200 sm:text-lg">
            Track stock, review purchase history, and surface what matters next with
            low-stock alerts and recommendation signals.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-slate-950/25 p-5">
              <p className="text-3xl font-semibold">JWT</p>
              <p className="mt-2 text-sm text-slate-300">Protected session flow</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-950/25 p-5">
              <p className="text-3xl font-semibold">AI-lite</p>
              <p className="mt-2 text-sm text-slate-300">Restock recommendations</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-950/25 p-5">
              <p className="text-3xl font-semibold">Dashboard</p>
              <p className="mt-2 text-sm text-slate-300">Summary-first UI</p>
            </div>
          </div>
        </section>

        <section className="rounded-[36px] bg-white p-8 text-slate-900 shadow-[0_24px_80px_rgba(15,23,42,0.25)] sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-sky-700">
            {isLogin ? 'Login' : 'Register'}
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight">
            {isLogin ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="mt-3 text-sm text-slate-500">
            {isLogin
              ? 'Use your credentials to access the grocery dashboard.'
              : 'Start with a secure account before managing your items.'}
          </p>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Username</span>
              <input
                name="username"
                value={form.username}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-500"
                placeholder="Enter username"
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
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-500"
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
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-500"
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
              {loading ? 'Please wait...' : isLogin ? 'Login' : 'Create account'}
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
