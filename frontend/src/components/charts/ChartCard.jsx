function ChartCard({ title, subtitle, tone = 'light', children }) {
  const isCyber = tone === 'cyber'

  return (
    <article
      className={
        isCyber
          ? 'rounded-4xl border border-violet-300/20 bg-white/[0.06] p-5 shadow-[0_0_42px_rgba(168,85,247,0.14)] backdrop-blur transition duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_0_55px_rgba(168,85,247,0.22)]'
          : 'rounded-4xl border border-slate-100 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.07)] transition duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_24px_65px_rgba(15,23,42,0.11)]'
      }
    >
      <div className="mb-5">
        <h3 className={isCyber ? 'text-lg font-semibold text-white' : 'text-lg font-semibold text-slate-950'}>
          {title}
        </h3>
        {subtitle && (
          <p className={isCyber ? 'mt-1 text-sm text-slate-400' : 'mt-1 text-sm text-slate-500'}>
            {subtitle}
          </p>
        )}
      </div>
      <div className="h-72 animate-[fadeSlideIn_0.35s_ease-out]">{children}</div>
    </article>
  )
}

export default ChartCard
