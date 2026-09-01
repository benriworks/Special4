import { addDays, daysInYear, diffDays, isoOf, monthDay, weekday } from './date'
import { holidayMap, type HolidayOptions } from './holidays'
import { SUPPORTED_YEAR_MAX, SUPPORTED_YEAR_MIN } from './rules'
import {
  FLAG_CUSTOM,
  FLAG_HOLIDAY,
  FLAG_PTO,
  FLAG_WEEKEND,
  type CustomRange,
  type DayOffMap,
  type Holiday,
  type ISODate,
  type OffSettings,
  type WeekendRule,
} from './types'

export const DEFAULT_SETTINGS: OffSettings = { weekend: 'sat-sun', customRanges: [] }

export const PRESET_RANGES: Record<'nenmatsu' | 'obon', CustomRange> = {
  nenmatsu: { from: '12-29', to: '01-03', label: '年末年始' },
  obon: { from: '08-13', to: '08-16', label: 'お盆' },
}

export function inCustomRange(md: string, r: CustomRange): boolean {
  return r.from <= r.to ? md >= r.from && md <= r.to : md >= r.from || md <= r.to
}

export function isWeekendDay(iso: ISODate, rule: WeekendRule): boolean {
  const wd = weekday(iso)
  if (rule === 'sat-sun') return wd === 0 || wd === 6
  if (rule === 'sun') return wd === 0
  return false
}

const EMPTY: Map<ISODate, Holiday> = new Map()

/** holidayMap that returns an empty map outside the supported year range instead of throwing. */
export function safeHolidayMap(year: number, opts?: HolidayOptions): Map<ISODate, Holiday> {
  if (year < SUPPORTED_YEAR_MIN || year > SUPPORTED_YEAR_MAX) return EMPTY
  return holidayMap(year, opts)
}

/** Weekend / holiday / custom flags of a single day (PTO not included). */
export function baseFlags(iso: ISODate, settings: OffSettings, opts?: HolidayOptions): number {
  let f = 0
  if (isWeekendDay(iso, settings.weekend)) f |= FLAG_WEEKEND
  if (safeHolidayMap(Number(iso.slice(0, 4)), opts).has(iso)) f |= FLAG_HOLIDAY
  const md = monthDay(iso)
  if (settings.customRanges.some((r) => inCustomRange(md, r))) f |= FLAG_CUSTOM
  return f
}

export const MARGIN_DAYS = 31

/**
 * Build the day-off bitmap for `year`, covering Dec 1 (year-1) … Jan 31 (year+1).
 */
export function buildDayOffMap(
  year: number,
  settings: OffSettings,
  opts: HolidayOptions & { pto?: ISODate[] } = {},
): DayOffMap {
  const start = isoOf(year - 1, 12, 1)
  const yearLength = daysInYear(year)
  const total = MARGIN_DAYS + yearLength + MARGIN_DAYS
  const flags = new Uint8Array(total)
  let d = start
  for (let i = 0; i < total; i++, d = addDays(d, 1)) flags[i] = baseFlags(d, settings, opts)
  const map: DayOffMap = { year, start, flags, yearStartIndex: MARGIN_DAYS, yearLength }
  if (opts.pto?.length) return withPto(map, opts.pto)
  return map
}

export function indexOf(map: DayOffMap, iso: ISODate): number {
  return diffDays(map.start, iso)
}

export function dateAt(map: DayOffMap, index: number): ISODate {
  return addDays(map.start, index)
}

export function flagsAt(map: DayOffMap, iso: ISODate): number {
  const i = indexOf(map, iso)
  return i >= 0 && i < map.flags.length ? map.flags[i] : 0
}

export function isInYear(map: DayOffMap, index: number): boolean {
  return index >= map.yearStartIndex && index < map.yearStartIndex + map.yearLength
}

/** Copy of `map` with PTO bits replaced by `ptoDays` (only days inside the display year are accepted). */
export function withPto(map: DayOffMap, ptoDays: ISODate[]): DayOffMap {
  const flags = new Uint8Array(map.flags)
  for (let i = 0; i < flags.length; i++) flags[i] &= ~FLAG_PTO
  for (const p of ptoDays) {
    const i = indexOf(map, p)
    if (isInYear(map, i)) flags[i] |= FLAG_PTO
  }
  return { ...map, flags }
}

/** Number of non-working days inside the display year (PTO included). */
export function countOffInYear(map: DayOffMap): number {
  let n = 0
  const end = map.yearStartIndex + map.yearLength
  for (let i = map.yearStartIndex; i < end; i++) if (map.flags[i] !== 0) n++
  return n
}

/** Workdays (no flags) inside the display year, in order. */
export function workdaysInYear(map: DayOffMap): number[] {
  const out: number[] = []
  const end = map.yearStartIndex + map.yearLength
  for (let i = map.yearStartIndex; i < end; i++) if (map.flags[i] === 0) out.push(i)
  return out
}
