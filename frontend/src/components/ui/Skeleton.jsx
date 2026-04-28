function Skeleton({ className = '' }) {
  return <div className={['animate-pulse rounded-2xl bg-gradient-to-r from-slate-200/70 via-white to-slate-200/70 bg-[length:200%_100%]', className].filter(Boolean).join(' ')} />
}

export function SkeletonCard({ lines = 3, className = '' }) {
  return (
    <div className={['rounded-3xl border border-slate-100 bg-slate-50 p-5 transition duration-200 ease-out', className].filter(Boolean).join(' ')}>
      <Skeleton className="h-5 w-32" />
      <div className="mt-4 space-y-3">
        {Array.from({ length: lines }).map((_, index) => (
          <Skeleton key={index} className={`h-4 ${index === lines - 1 ? 'w-2/3' : 'w-full'}`} />
        ))}
      </div>
    </div>
  )
}

export default Skeleton
