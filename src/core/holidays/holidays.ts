import { addDays, isoOf, nthWeekdayOfMonth, todayISO, weekday, daysInYear } from './date'
import { autumnalEquinoxDay, isEquinoxProvisional, vernalEquinoxDay } from './equinox'
import {
  CITIZENS_MODERN_FROM_YEAR,
  CITIZENS_SINCE,
  HOLIDAY_RULES,
  SUBSTITUTE_CHAIN_FROM_YEAR,
  SUBSTITUTE_SINCE,
  SUPPORTED_YEAR_MAX,
  SUPPORTED_YEAR_MIN,
  YEAR_OVERRIDES,
  type DayRule,
} from './rules'
import type { Holiday, ISODate } from './types'

export interface HolidayOptions {
  /** Reference date used to decide whether equinox dates are provisional. Defaults to today (JST). */
  referenceDate?: ISODate
}

function resolveRule(rule: DayRule, year: number): { date: ISODate; equinox: boolean } {
  switch (rule.kind) {
    case 'fixed':
      return { date: isoOf(year, rule.month, rule.day), equinox: false }
    case 'monday':
      return { date: isoOf(year, rule.month, nthWeekdayOfMonth(year, rule.month, 1, rule.nth)), equinox: false }
    case 'equinox':
      return {
        date: isoOf(year, rule.which === 'spring' ? 3 : 9, rule.which === 'spring' ? vernalEquinoxDay(year) : autumnalEquinoxDay(year)),
        equinox: true,
      }
  }
}

const cache = new Map<string, Holiday[]>()

/**
 * All non-working public holidays of a year: statutory holidays, substitute
 * holidays (振替休日) and citizens' holidays (国民の休日), sorted by date.
 */
export function holidaysOfYear(year: number, opts: HolidayOptions = {}): Holiday[] {
  if (!Number.isInteger(year) || year < SUPPORTED_YEAR_MIN || year > SUPPORTED_YEAR_MAX) {
    throw new RangeError(`year out of supported range (${SUPPORTED_YEAR_MIN}–${SUPPORTED_YEAR_MAX}): ${year}`)
  }
  const reference = opts.referenceDate ?? todayISO()
  const provisional = isEquinoxProvisional(year, reference)
  const key = `${year}:${provisional ? 'p' : 'o'}`
  const hit = cache.get(key)
  if (hit) return hit

  // 1. statutory holidays from rules
  const statutory = new Map<ISODate, { name: string; provisional: boolean }>()
  for (const r of HOLIDAY_RULES) {
    if (year < r.from || (r.to !== undefined && year > r.to)) continue
    const { date, equinox } = resolveRule(r.rule, year)
    statutory.set(date, { name: r.name, provisional: equinox && provisional })
  }
  // 2. year-specific overrides
  const ov = YEAR_OVERRIDES.find((o) => o.year === year)
  if (ov) {
    for (const name of ov.remove ?? []) {
      for (const [d, h] of statutory) if (h.name === name) statutory.delete(d)
    }
    for (const a of ov.add ?? []) statutory.set(`${year}-${a.date}`, { name: a.name, provisional: false })
  }

  // 3. substitute holidays
  const substitutes = new Map<ISODate, string>()
  const sortedStatutory = [...statutory.keys()].sort()
  for (const d of sortedStatutory) {
    if (weekday(d) !== 0 || d < SUBSTITUTE_SINCE) continue
    let nd = addDays(d, 1)
    if (year >= SUBSTITUTE_CHAIN_FROM_YEAR) {
      while (statutory.has(nd) || substitutes.has(nd)) nd = addDays(nd, 1)
      substitutes.set(nd, '振替休日')
    } else if (!statutory.has(nd)) {
      substitutes.set(nd, '振替休日')
    }
  }

  // 4. citizens' holidays (sandwiched between two statutory holidays)
  const citizens = new Set<ISODate>()
  const total = daysInYear(year)
  let d = isoOf(year, 1, 1)
  for (let i = 0; i < total; i++, d = addDays(d, 1)) {
    if (d < CITIZENS_SINCE) continue
    if (statutory.has(d) || substitutes.has(d)) continue
    if (!statutory.has(addDays(d, -1)) || !statutory.has(addDays(d, 1))) continue
    if (year < CITIZENS_MODERN_FROM_YEAR && weekday(d) === 0) continue
    citizens.add(d)
  }

  const out: Holiday[] = []
  for (const [date, h] of statutory) out.push({ date, name: h.name, kind: 'holiday', provisional: h.provisional })
  for (const [date, name] of substitutes) out.push({ date, name, kind: 'substitute', provisional: false })
  for (const date of citizens) out.push({ date, name: '国民の休日', kind: 'citizens', provisional: false })
  out.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
  cache.set(key, out)
  return out
}

/** Map of date → holiday for quick lookup. */
export function holidayMap(year: number, opts?: HolidayOptions): Map<ISODate, Holiday> {
  return new Map(holidaysOfYear(year, opts).map((h) => [h.date, h]))
}

export function holidayOn(date: ISODate, opts?: HolidayOptions): Holiday | undefined {
  const year = Number(date.slice(0, 4))
  if (year < SUPPORTED_YEAR_MIN || year > SUPPORTED_YEAR_MAX) return undefined
  return holidayMap(year, opts).get(date)
}
