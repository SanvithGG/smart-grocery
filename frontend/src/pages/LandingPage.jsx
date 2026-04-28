import {
  ArrowRight,
  BarChart3,
  Bell,
  CheckCircle2,
  ChevronDown,
  Leaf,
  PackageCheck,
  PlayCircle,
  Search,
  ShieldCheck,
  ShoppingBasket,
  Star,
  Users,
} from 'lucide-react'
import { Link } from 'react-router-dom'

const featureCards = [
  {
    title: 'Smart Inventory',
    description: 'Track stock, quantity, purchase status, and expiry from one simple grocery workspace.',
    icon: PackageCheck,
    color: 'bg-sky-50 text-sky-700',
  },
  {
    title: 'Seller Marketplace',
    description: 'Order low-stock products directly from sellers and keep every request visible.',
    icon: ShoppingBasket,
    color: 'bg-orange-50 text-orange-600',
  },
  {
    title: 'Live Analytics',
    description: 'See stock pressure, seller orders, revenue signals, and platform activity clearly.',
    icon: BarChart3,
    color: 'bg-emerald-50 text-emerald-700',
  },
]

const dashboardRows = [
  { name: 'Milk', status: 'Low stock', tone: 'bg-amber-100 text-amber-700', value: '2 left' },
  { name: 'Bread', status: 'Seller match', tone: 'bg-sky-100 text-sky-700', value: 'Rs 28' },
  { name: 'Spinach', status: 'Expires soon', tone: 'bg-rose-100 text-rose-700', value: 'Today' },
]

const testimonials = [
  {
    quote: 'Smart Grocery made my project feel like a real SaaS dashboard, not just CRUD screens.',
    name: 'Student Builder',
  },
  {
    quote: 'The seller dashboard and stock alerts make the whole flow easier to explain in review.',
    name: 'Project Reviewer',
  },
  {
    quote: 'Inventory, buying, and role control now feel connected inside one system.',
    name: 'Smart Grocery User',
  },
]

function MiniChart() {
  return (
    <div className="flex h-24 items-end gap-2 rounded-2xl bg-sky-50/70 p-3">
      {[44, 62, 52, 74, 58, 86, 70].map((height, index) => (
        <span
          key={index}
          className="flex-1 rounded-t-lg bg-sky-500 transition duration-200 hover:bg-orange-400"
          style={{ height: `${height}%` }}
        />
      ))}
    </div>
  )
}

function BrowserMockup() {
  return (
    <div className="relative mx-auto max-w-xl">
      <div className="absolute -left-16 top-10 h-28 w-28 rounded-full bg-sky-200/60" />
      <div className="absolute -right-10 bottom-2 h-44 w-44 rounded-full bg-sky-500/20" />
      <div className="absolute -right-4 top-28 h-7 w-7 rotate-45 rounded-lg bg-orange-500 shadow-[0_12px_30px_rgba(249,115,22,0.35)]" />

      <div className="relative rounded-[28px] border-[10px] border-slate-950 bg-slate-950 shadow-[0_28px_90px_rgba(15,23,42,0.26)]">
        <div className="absolute left-1/2 top-0 z-10 h-5 w-28 -translate-x-1/2 rounded-b-2xl bg-slate-950" />
        <div className="overflow-hidden rounded-[18px] bg-white">
          <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3">
            <span className="h-3 w-3 rounded-full bg-rose-400" />
            <span className="h-3 w-3 rounded-full bg-amber-400" />
            <span className="h-3 w-3 rounded-full bg-emerald-400" />
            <div className="ml-3 flex-1 rounded-full bg-white px-3 py-1 text-[10px] font-semibold text-slate-400">
              www.smartgrocery.local
            </div>
          </div>

          <div className="grid min-h-[300px] grid-cols-[5.5rem_1fr] bg-white">
            <aside className="bg-sky-700 px-3 py-4 text-white">
              <div className="mb-5 flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/15">
                  <Leaf className="h-4 w-4" />
                </span>
              </div>
              {['Home', 'Stock', 'Orders', 'Stats'].map((item, index) => (
                <div
                  key={item}
                  className={`mb-2 rounded-xl px-2 py-2 text-[10px] font-semibold ${
                    index === 0 ? 'bg-white text-sky-700' : 'text-sky-100'
                  }`}
                >
                  {item}
                </div>
              ))}
            </aside>

            <section className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-sky-700">
                    Dashboard
                  </p>
                  <h3 className="mt-1 text-lg font-bold text-slate-950">Grocery Control</h3>
                </div>
                <div className="flex h-8 w-32 items-center gap-2 rounded-full bg-slate-50 px-3 text-[10px] text-slate-400">
                  <Search className="h-3 w-3" />
                  Search stock
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                {[
                  ['Items', '42'],
                  ['Orders', '12'],
                  ['Alerts', '3'],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">{label}</p>
                    <p className="mt-1 text-2xl font-bold text-slate-950">{value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-[1fr_0.9fr]">
                <MiniChart />
                <div className="space-y-2">
                  {dashboardRows.map((row) => (
                    <div key={row.name} className="rounded-2xl border border-slate-100 bg-white px-3 py-2 shadow-sm">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-900">{row.name}</p>
                        <span className={`rounded-full px-2 py-1 text-[9px] font-bold ${row.tone}`}>
                          {row.status}
                        </span>
                      </div>
                      <p className="mt-1 text-[10px] text-slate-400">{row.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-8 -right-4 w-32 rounded-[24px] border-[7px] border-slate-950 bg-slate-950 shadow-[0_20px_55px_rgba(15,23,42,0.25)] sm:w-36">
        <div className="rounded-[17px] bg-white p-3">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-200" />
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-700">Today</p>
          <p className="mt-1 text-lg font-bold text-slate-950">Rs 420</p>
          <MiniChart />
          <div className="mt-3 rounded-xl bg-emerald-50 px-2 py-2 text-[10px] font-semibold text-emerald-700">
            4 smart picks
          </div>
        </div>
      </div>
    </div>
  )
}

function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-white text-slate-950">
      <section className="relative mx-auto min-h-screen max-w-[1180px] px-5 py-5 sm:px-8">
        <div className="pointer-events-none absolute -left-28 top-24 h-48 w-48 rounded-full bg-sky-100" />
        <div className="pointer-events-none absolute -right-20 top-28 h-72 w-72 rounded-full bg-sky-100" />
        <div className="pointer-events-none absolute right-16 top-44 h-56 w-56 rounded-full bg-sky-500/10" />
        <div className="pointer-events-none absolute right-0 top-28 hidden h-60 w-80 bg-[linear-gradient(90deg,rgba(14,165,233,0.12)_1px,transparent_1px),linear-gradient(180deg,rgba(14,165,233,0.12)_1px,transparent_1px)] bg-[size:22px_22px] lg:block" />

        <header className="relative z-10 flex items-center justify-between rounded-full bg-white/90 px-4 py-3 shadow-[0_12px_38px_rgba(15,23,42,0.08)] backdrop-blur">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
              <ShoppingBasket className="h-5 w-5" />
            </span>
            <span className="text-lg font-bold tracking-tight">Smart Grocery</span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-semibold text-slate-700 lg:flex">
            <a href="#features" className="flex items-center gap-1 transition hover:text-sky-700">
              Product <ChevronDown className="h-3.5 w-3.5" />
            </a>
            <a href="#features" className="transition hover:text-sky-700">Features</a>
            <a href="#workflow" className="flex items-center gap-1 transition hover:text-sky-700">
              Solutions <ChevronDown className="h-3.5 w-3.5" />
            </a>
            <a href="#testimonials" className="transition hover:text-sky-700">Reviews</a>
            <a href="#contact" className="transition hover:text-sky-700">Contact</a>
          </nav>

          <div className="flex items-center gap-2">
            <Link to="/login" className="hidden px-3 py-2 text-sm font-semibold text-slate-700 transition hover:text-sky-700 sm:inline-flex">
              Log In
            </Link>
            <Link
              to="/register"
              className="rounded-full bg-orange-500 px-5 py-2.5 text-sm font-bold text-white shadow-[0_12px_28px_rgba(249,115,22,0.28)] transition hover:-translate-y-0.5 hover:bg-orange-600"
            >
              Get Started
            </Link>
          </div>
        </header>

        <section className="relative z-10 grid min-h-[620px] gap-10 pt-14 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:pt-10">
          <div className="max-w-xl">
            <p className="mb-5 inline-flex rounded-full bg-sky-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-sky-700">
              Smart Grocery SaaS Platform
            </p>
            <h1 className="text-4xl font-black leading-[1.05] tracking-tight text-slate-950 sm:text-5xl lg:text-[3.55rem]">
              Simplify Your Grocery Flow, Amplify Your Store Success.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-600">
              The all-in-one workspace to plan purchases, track inventory, manage sellers,
              and monitor smart grocery analytics from one polished dashboard.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-6 py-3 text-sm font-bold text-white shadow-[0_16px_35px_rgba(249,115,22,0.3)] transition hover:-translate-y-0.5 hover:bg-orange-600"
              >
                Start Free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-bold text-sky-700 transition hover:bg-sky-50"
              >
                <PlayCircle className="h-5 w-5" />
                Watch Demo
              </Link>
            </div>
          </div>

          <BrowserMockup />
        </section>

        <section id="features" className="relative z-10 -mt-4 pb-10">
          <h2 className="text-2xl font-black tracking-tight text-slate-950">Transform Your Grocery Workflow</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-3">
            {featureCards.map((feature) => {
              const Icon = feature.icon

              return (
                <article
                  key={feature.title}
                  className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_26px_65px_rgba(15,23,42,0.12)]"
                >
                  <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${feature.color}`}>
                    <Icon className="h-6 w-6" />
                  </span>
                  <h3 className="mt-4 text-lg font-black text-slate-950">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{feature.description}</p>
                </article>
              )
            })}
          </div>
        </section>

        <section id="workflow" className="relative z-10 grid gap-5 py-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl bg-slate-950 p-7 text-white shadow-[0_22px_70px_rgba(15,23,42,0.2)]">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-orange-300">Role Based System</p>
            <h2 className="mt-4 text-3xl font-black tracking-tight">User, Seller, and Super Admin in one flow.</h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              Smart Grocery keeps everyday buying simple while giving sellers and admins a proper dashboard view.
            </p>
            <div className="mt-6 grid gap-3">
              {[
                ['Users', 'Buy queue, reminders, inventory and marketplace.'],
                ['Sellers', 'Products, stock, orders, revenue and smart alerts.'],
                ['Super Admin', 'Global users, sellers, analytics and platform insights.'],
              ].map(([title, text]) => (
                <div key={title} className="flex gap-3 rounded-2xl bg-white/8 p-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
                  <div>
                    <p className="font-bold">{title}</p>
                    <p className="text-sm text-slate-300">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {[
              { label: 'Smart Alerts', value: 'Low stock + expiry', icon: Bell },
              { label: 'Secure Roles', value: 'USER / SELLER / SUPERADMIN', icon: ShieldCheck },
              { label: 'Seller Orders', value: 'Pending to delivered', icon: Users },
              { label: 'Insights', value: 'Live dashboard signals', icon: Star },
            ].map((item) => {
              const Icon = item.icon

              return (
                <article key={item.label} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.07)]">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
                    <Icon className="h-6 w-6" />
                  </span>
                  <p className="mt-5 text-sm font-bold uppercase tracking-[0.2em] text-slate-400">{item.label}</p>
                  <p className="mt-2 text-2xl font-black text-slate-950">{item.value}</p>
                </article>
              )
            })}
          </div>
        </section>

        <section id="testimonials" className="relative z-10 py-8">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-black tracking-tight text-slate-950">Testimonials</h2>
            <div className="flex gap-2">
              <button type="button" className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50">
                ‹
              </button>
              <button type="button" className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 text-white transition hover:bg-slate-800">
                ›
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <article key={testimonial.name} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
                <div className="flex gap-1 text-orange-400">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-600">“{testimonial.quote}”</p>
                <p className="mt-4 font-bold text-slate-950">{testimonial.name}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="contact" className="relative z-10 pb-10">
          <div className="flex flex-col gap-4 rounded-3xl bg-sky-50 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.24em] text-sky-700">Ready to start?</p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">Open your Smart Grocery workspace.</h2>
            </div>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
            >
              Login Now
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </section>
    </main>
  )
}

export default LandingPage
