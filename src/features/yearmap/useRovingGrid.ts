import { useCallback, useEffect, useState, type KeyboardEvent } from 'react'
import { addDays, daysInMonth, isoOf, parseISO, type ISODate } from '../../core/holidays'

/**
 * Roving tabindex across all day cells of the year: one cell is tabbable, arrow
 * keys move focus (←→ ±1 day, ↑↓ ±7, Home/End month bounds, PageUp/PageDown ±1 month).
 */
export function useRovingGrid(year: number, initial: ISODate) {
  const [focusDate, setFocusDate] = useState<ISODate>(initial)

  useEffect(() => {
    setFocusDate(initial)
  }, [initial, year])

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLElement>, date: ISODate) => {
      const { y, m, d } = parseISO(date)
      let next: ISODate | null = null
      switch (e.key) {
        case 'ArrowRight':
          next = addDays(date, 1)
          break
        case 'ArrowLeft':
          next = addDays(date, -1)
          break
        case 'ArrowDown':
          next = addDays(date, 7)
          break
        case 'ArrowUp':
          next = addDays(date, -7)
          break
        case 'Home':
          next = isoOf(y, m, 1)
          break
        case 'End':
          next = isoOf(y, m, daysInMonth(y, m))
          break
        case 'PageUp':
          if (m > 1) next = isoOf(y, m - 1, Math.min(d, daysInMonth(y, m - 1)))
          break
        case 'PageDown':
          if (m < 12) next = isoOf(y, m + 1, Math.min(d, daysInMonth(y, m + 1)))
          break
        default:
          return
      }
      e.preventDefault()
      if (!next || !next.startsWith(`${year}-`)) return
      setFocusDate(next)
      requestAnimationFrame(() => document.getElementById(`day-${next}`)?.focus())
    },
    [year],
  )

  return { focusDate, setFocusDate, onKeyDown }
}
