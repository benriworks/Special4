import { useEffect, useRef, useState } from 'react'

/** Number that rolls from its previous value to the new one (300ms, ease-out). Instant under prefers-reduced-motion. */
export function RollingNumber({ value, className }: { value: number; className?: string }) {
  const [display, setDisplay] = useState(value)
  const prev = useRef(value)

  useEffect(() => {
    const from = prev.current
    prev.current = value
    if (from === value) return
    if (typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(value)
      return
    }
    const duration = 300
    const start = performance.now()
    let raf = 0
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplay(Math.round(from + (value - from) * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value])

  return (
    <span className={`tabular${className ? ` ${className}` : ''}`} aria-hidden="true">
      {display}
    </span>
  )
}
