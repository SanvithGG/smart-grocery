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
        'rounded-lg border border-slate-200 bg-white p-5 shadow-sm',
        className,
      ]
        .filter(Boolean)
        .join(' '),
      ...props,
    },
    <>
      {(eyebrow || title || description || actions) && (
        <div className='flex flex-wrap items-start justify-between gap-4'>
          <div>
            {eyebrow && (
              <p className='text-xs font-semibold uppercase text-sky-700'>
                {eyebrow}
              </p>
            )}
            {title && <h2 className='mt-1 text-2xl font-semibold text-slate-950'>{title}</h2>}
            {description && <p className='mt-2 max-w-3xl text-sm text-slate-600'>{description}</p>}
          </div>
          {actions}
        </div>
      )}
      {children && <div className={eyebrow || title || description || actions ? 'mt-5' : ''}>{children}</div>}
    </>,
  )
}

export default Card