import { createElement } from 'react'

function Card({
  as = 'section',
  title,
  eyebrow,
  description,
  actions,
  className = '',
  children,
  ...props
}) {
  return createElement(
    as,
    {
      className: [
        'rounded-4xl border border-white/70 bg-white/85 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] transition duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_24px_75px_rgba(15,23,42,0.11)]',
        className,
      ]
        .filter(Boolean)
        .join(' '),
      ...props,
    },
    <>
      {(eyebrow || title || description || actions) && (
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            {eyebrow && (
              <p className="text-sm font-semibold uppercase tracking-[0.32em] text-sky-700">
                {eyebrow}
              </p>
            )}
            {title && <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{title}</h2>}
            {description && <p className="mt-3 max-w-3xl text-sm text-slate-600">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      {children && <div className={eyebrow || title || description || actions ? 'mt-6' : ''}>{children}</div>}
    </>,
  )
}

export default Card
