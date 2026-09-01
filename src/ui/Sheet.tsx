import { useEffect, useId, useRef, type ReactNode } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  title: ReactNode
  children: ReactNode
  testId?: string
}

/** Modal sheet built on <dialog>: centred on desktop, bottom sheet on mobile. Esc / backdrop close it; focus returns natively. */
export function Sheet({ open, onClose, title, children, testId }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) el.showModal()
    if (!open && el.open) el.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className="sheet"
      data-testid={testId}
      aria-labelledby={titleId}
      // The native close event also fires after a programmatic close (open → false).
      // Only forward user-initiated closes, otherwise a sheet that replaced this one would be closed too.
      onClose={() => {
        if (open) onClose()
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="sheet__inner">
        <div className="sheet__head">
          <h3 id={titleId} className="sheet__title">
            {title}
          </h3>
          <button type="button" className="btn btn--icon" onClick={onClose} aria-label="閉じる">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <div className="sheet__body">{children}</div>
      </div>
    </dialog>
  )
}
