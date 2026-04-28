import { useEffect } from 'react'
import { createPortal } from 'react-dom'

function Modal({
  open,
  title,
  description,
  onClose,
  size = 'md',
  footer,
  children,
}) {
  useEffect(() => {
    if (!open) {
      return undefined
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  if (!open) {
    return null
  }

  const maxWidthClass = size === 'lg' ? 'max-w-2xl' : 'max-w-lg'

  return createPortal(
    <section
      className="fixed inset-0 z-50 box-border overflow-x-hidden overflow-y-auto bg-slate-950/45 animate-[fadeIn_0.18s_ease-out] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      onClick={onClose}
    >
      <div className="flex min-h-full items-center justify-center px-4 py-6 sm:px-6 sm:py-8">
          <div
            className={`w-full ${maxWidthClass} animate-[popIn_0.22s_ease-out] rounded-4xl border border-slate-200 bg-white p-6 shadow-[0_28px_120px_rgba(15,23,42,0.18)]`}
            onClick={(event) => event.stopPropagation()}
          >
          <div className="flex items-start justify-between gap-4">
            <div>
              {title && <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{title}</h2>}
              {description && <p className="mt-2 text-sm text-slate-500">{description}</p>}
            </div>
          </div>

          {children && <div className="mt-6">{children}</div>}
          {footer && <div className="mt-6 flex flex-wrap justify-end gap-3">{footer}</div>}
          </div>
      </div>
    </section>,
    document.body,
  )
}

export default Modal
