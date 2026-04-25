import {
  ArrowRight,
  CalendarClock,
  PackageCheck,
  ShieldCheck,
  ShoppingBasket,
} from 'lucide-react'
import { Link } from 'react-router-dom'

const landingStyle = {
  background:
    'radial-gradient(circle at top left, rgba(20,184,166,0.18), transparent 34%), linear-gradient(135deg, #dff7f4 0%, #eef8f2 55%, #fbf7df 100%)',
}

const panelStyle = {
  background: 'linear-gradient(145deg, #0f172a 0%, #164e63 54%, #166534 100%)',
}

const featureCards = [
  {
    title: 'Inventory',
    value: '42',
    label: 'items tracked',
    icon: PackageCheck,
    color: 'bg-cyan-400/15 text-cyan-100',
  },
  {
    title: 'Buy Queue',
    value: '8',
    label: 'to restock',
    icon: ShoppingBasket,
    color: 'bg-emerald-400/15 text-emerald-100',
  },
  {
    title: 'Expiry',
    value: '3',
    label: 'alerts today',
    icon: CalendarClock,
    color: 'bg-amber-300/15 text-amber-100',
  },
]

const previewItems = [
  { name: 'Milk', status: 'Low stock', tone: 'bg-amber-100 text-amber-700' },
  { name: 'Rice', status: 'Available', tone: 'bg-emerald-100 text-emerald-700' },
  { name: 'Spinach', status: 'Use soon', tone: 'bg-rose-100 text-rose-700' },
]

function LandingPage() {
  return (
    <main className="min-h-screen px-4 py-6 text-white sm:px-6 lg:px-8" style={landingStyle}>
      <section
        className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-5xl flex-col overflow-hidden rounded-xl border border-white/50 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.22)] sm:p-10"
        style={panelStyle}
      >
        <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-white text-emerald-700 shadow-lg shadow-black/10">
              <ShoppingBasket className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-100">
                Smart Grocery
              </p>
              <p className="text-base text-white/80">Kitchen stock workspace</p>
            </div>
          </div>

          <nav className="flex gap-3">
            <Link
              to="/login"
              className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-50"
            >
              Sign up
            </Link>
          </nav>
        </header>

        <div className="mt-16 max-w-4xl">
          <h1 className="text-5xl font-semibold leading-tight tracking-normal sm:text-6xl">
            Keep every grocery decision in one calm place.
          </h1>
          <p className="mt-7 max-w-3xl text-xl leading-9 text-slate-100">
            Review stock, purchase needs, and expiry alerts before the next shopping run.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/login"
              className="flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-50"
            >
              Open Workspace
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/register"
              className="rounded-lg border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Create Account
            </Link>
          </div>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {featureCards.map((card) => {
            const Icon = card.icon
            return (
              <article key={card.title} className="rounded-lg border border-white/10 bg-white/10 p-5 backdrop-blur">
                <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${card.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-8 text-4xl font-semibold">{card.value}</p>
                <p className="mt-1 text-base font-semibold">{card.title}</p>
                <p className="text-sm text-slate-300">{card.label}</p>
              </article>
            )
          })}
        </div>

        <div className="mt-8 rounded-lg bg-white p-5 text-slate-950 shadow-2xl shadow-black/20">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <p className="text-base font-semibold">Today&apos;s stock</p>
              <p className="text-sm text-slate-500">Quick view</p>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
              <ShieldCheck className="h-4 w-4" />
              Synced
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {previewItems.map((item) => (
              <div key={item.name} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-3">
                <span className="text-sm font-medium text-slate-700">{item.name}</span>
                <span className={`rounded-md px-2.5 py-1 text-xs font-semibold ${item.tone}`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

export default LandingPage
