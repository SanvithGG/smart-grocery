const toneClasses = {
  sky: 'border-sky-100 bg-sky-50/80 text-sky-800',
  emerald: 'border-emerald-100 bg-emerald-50/80 text-emerald-800',
  amber: 'border-amber-100 bg-amber-50/80 text-amber-800',
  rose: 'border-rose-100 bg-rose-50/80 text-rose-800',
  violet: 'border-violet-100 bg-violet-50/80 text-violet-800',
}

function SmartInsightCard({
  title,
  message,
  meta,
  tone = 'sky',
  actionLabel,
  onAction,
  className = '',
}) {
  return (
    <article
      className={[
        `smart-insight-card smart-insight-card-${tone}`,
        'group rounded-3xl border p-4 shadow-[0_14px_38px_rgba(15,23,42,0.05)] transition duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_20px_55px_rgba(15,23,42,0.1)]',
        toneClasses[tone] || toneClasses.sky,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="smart-insight-card-eyebrow text-xs font-semibold uppercase tracking-[0.24em] opacity-75">
            Smart suggestion
          </p>
          <h3 className="smart-insight-card-title mt-2 text-base font-semibold text-slate-950">
            {title}
          </h3>
        </div>
        {meta && (
          <span className="smart-insight-card-meta rounded-full bg-white/80 px-3 py-1 text-xs font-semibold">
            {meta}
          </span>
        )}
      </div>
      <p className="smart-insight-card-message mt-3 text-sm leading-6 text-slate-600">
        {message}
      </p>
      {actionLabel && (
        <button
          type="button"
          onClick={onAction}
          className="smart-insight-card-action mt-4 rounded-full bg-white/85 px-4 py-2 text-xs font-semibold text-slate-900 transition duration-200 hover:bg-white"
        >
          {actionLabel}
        </button>
      )}
    </article>
  )
}

export default SmartInsightCard
