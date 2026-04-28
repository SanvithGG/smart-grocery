const baseClasses =
  'inline-flex items-center justify-center gap-2 rounded-full border font-semibold transition duration-200 ease-out hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0'

const variantClasses = {
  primary: 'border-slate-950 bg-slate-950 text-white hover:bg-slate-800 hover:border-slate-800',
  secondary: 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50',
  sky: 'border-sky-200 bg-sky-50 text-sky-700 hover:border-sky-300 hover:bg-sky-100',
  success:
    'border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100',
  danger: 'border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-300 hover:bg-rose-100',
  ghost: 'border-transparent bg-transparent text-slate-700 hover:border-slate-200 hover:bg-slate-50',
}

const sizeClasses = {
  sm: 'px-3 py-2 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-3 text-sm',
}

function Button({
  type = 'button',
  variant = 'secondary',
  size = 'md',
  className = '',
  fullWidth = false,
  children,
  ...props
}) {
  return (
    <button
      type={type}
      className={[
        baseClasses,
        variantClasses[variant] || variantClasses.secondary,
        sizeClasses[size] || sizeClasses.md,
        fullWidth ? 'w-full' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button
