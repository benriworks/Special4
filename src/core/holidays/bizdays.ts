import { addDays, diffDays } from './date'
import { baseFlags } from './dayoff'
import type { HolidayOptions } from './holidays'
import type { ISODate, OffSettings } from './types'

export function isOffDay(iso: ISODate, settings: OffSettings, opts?: HolidayOptions): boolean {
  return baseFlags(iso, settings, opts) !== 0
}

/**
 * The n-th business day after (n > 0) or before (n < 0) `from`. n = 0 returns `from`.
 */
export function addBusinessDays(from: ISODate, n: number, settings: OffSettings, opts?: HolidayOptions): ISODate {
  let d = from
  const step = n > 0 ? 1 : -1
  let remaining = Math.abs(Math.trunc(n))
  while (remaining > 0) {
    d = addDays(d, step)
    if (!isOffDay(d, settings, opts)) remaining--
  }
  return d
}

export interface BusinessDayCount {
  /** Business days in the inclusive range. */
  business: number
  /** Calendar days in the inclusive range. */
  calendar: number
  /** Non-working days in the inclusive range. */
  off: number
  /** Calendar days expressed in whole weeks (floor). */
  weeks: number
}

/** Counts over the inclusive range [from, to] (order-insensitive). */
export function countBusinessDays(from: ISODate, to: ISODate, settings: OffSettings, opts?: HolidayOptions): BusinessDayCount {
  if (from > to) [from, to] = [to, from]
  const calendar = diffDays(from, to) + 1
  let business = 0
  let d = from
  for (let i = 0; i < calendar; i++, d = addDays(d, 1)) if (!isOffDay(d, settings, opts)) business++
  return { business, calendar, off: calendar - business, weeks: Math.floor(calendar / 7) }
}
