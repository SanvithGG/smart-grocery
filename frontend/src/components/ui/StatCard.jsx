function StatCard({
  label,
  value,
  icon: Icon,
  helper,
  tone = 'light',
  accent = 'sky',
}) {
  const isCyber = tone === 'cyber'
  const accentClasses = {
    sky: isCyber ? 'text-cyan-300 bg-cyan-400/10' : 'text-sky-700 bg-sky-50',
    emerald: isCyber ? 'text-emerald-300 bg-emerald-400/10' : 'text-emerald-700 bg-emerald-50',
    violet: isCyber ? 'text-violet-300 bg-violet-400/10' : 'text-violet-700 bg-violet-50',
    amber: isCyber ? 'text-amber-300 bg-amber-400/10' : 'text-amber-700 bg-amber-50',
  }

  return (
    <article
      className={
        isCyber
          ? 'group rounded-3xl border border-cyan-300/20 bg-white/[0.06] p-5 shadow-[0_0_35px_rgba(34,211,238,0.12)] backdrop-blur transition duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_0_46px_rgba(34,211,238,0.2)]'
          : 'group rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.07)] transition duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_24px_65px_rgba(15,23,42,0.12)]'
      }
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p
            className={
              isCyber
                ? 'text-xs font-semibold uppercase tracking-[0.24em] text-slate-400'
                : 'text-xs font-semibold uppercase tracking-[0.24em] text-slate-500'
            }
          >
            {label}
          </p>
          <p className={isCyber ? 'mt-3 text-4xl font-semibold text-white' : 'mt-3 text-4xl font-semibold text-slate-950'}>
            {value}
          </p>
        </div>
        {Icon && (
          <span className={`flex h-12 w-12 items-center justify-center rounded-2xl transition duration-200 ease-out group-hover:scale-105 ${accentClasses[accent] || accentClasses.sky}`}>
            <Icon className="h-5 w-5" />
          </span>
        )}
      </div>
      {helper && (
        <p className={isCyber ? 'mt-4 text-sm text-slate-400' : 'mt-4 text-sm text-slate-500'}>
          {helper}
        </p>
      )}
    </article>
  )
}

export default StatCard
