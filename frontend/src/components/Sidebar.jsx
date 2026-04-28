import { NavLink } from 'react-router-dom'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'

function Sidebar({
  title,
  subtitle,
  items,
  tone = 'light',
  collapsed = false,
  onToggle,
  className = '',
  children,
}) {
  const isCyber = tone === 'cyber'

  return (
    <aside
      className={
        [
          isCyber
            ? 'rounded-4xl border border-cyan-300/20 bg-white/[0.06] p-4 shadow-[0_0_45px_rgba(34,211,238,0.12)] backdrop-blur transition-[width,box-shadow] duration-200 ease-out'
            : 'rounded-4xl border border-slate-100 bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.07)] transition-[width,box-shadow] duration-200 ease-out',
          className,
        ].join(' ')
      }
    >
      <div className={`flex items-start justify-between gap-3 px-3 py-3 ${collapsed ? 'lg:px-0' : ''}`}>
        {!collapsed && (
          <div className="transition duration-200 ease-out">
            <p className={isCyber ? 'text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300' : 'text-xs font-semibold uppercase tracking-[0.28em] text-sky-700'}>
              {subtitle}
            </p>
            <h2 className={isCyber ? 'mt-2 text-xl font-semibold text-white' : 'mt-2 text-xl font-semibold text-slate-950'}>
              {title}
            </h2>
          </div>
        )}
        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={
              isCyber
                ? 'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-200 transition hover:bg-cyan-400/15'
                : 'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 text-slate-700 transition hover:bg-slate-100'
            }
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        )}
      </div>

      <nav className="mt-4 flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              [
                'flex min-w-max items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition duration-200 ease-out hover:-translate-y-0.5',
                isCyber
                  ? isActive
                    ? 'bg-cyan-400/15 text-cyan-200 shadow-[0_0_22px_rgba(34,211,238,0.18)]'
                    : 'text-slate-400 hover:bg-white/[0.07] hover:text-white'
                  : isActive
                    ? 'bg-slate-950 text-white shadow-[0_14px_28px_rgba(15,23,42,0.16)]'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950',
              ].join(' ')
            }
          >
            <item.icon className="h-4 w-4" />
            <span className={collapsed ? 'lg:sr-only' : 'transition-opacity duration-200'}>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {children}
    </aside>
  )
}

export default Sidebar
