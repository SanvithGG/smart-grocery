const shellClasses =
  'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition duration-200 ease-out focus:border-sky-500 focus:ring-2 focus:ring-sky-100'

function Input({
  as = 'input',
  label,
  error,
  className = '',
  inputClassName = '',
  children,
  ...props
}) {
  const Field = as

  return (
    <label className={['block', className].filter(Boolean).join(' ')}>
      {label && <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>}
      <Field className={[shellClasses, inputClassName].filter(Boolean).join(' ')} {...props}>
        {children}
      </Field>
      {error && <span className="mt-2 block animate-[fadeSlideIn_0.2s_ease-out] text-xs text-rose-600">{error}</span>}
    </label>
  )
}

export default Input
