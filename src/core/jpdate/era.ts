import { daysInMonth, isoOf, parseISO } from '../holidays/date'
import type { ISODate } from '../holidays/types'

export interface Era {
  name: string
  abbr: string
  start: ISODate
  /** Last day of the era (undefined for the current era). */
  end?: ISODate
}

export const ERAS: Era[] = [
  { name: '明治', abbr: 'M', start: '1868-10-23', end: '1912-07-29' },
  { name: '大正', abbr: 'T', start: '1912-07-30', end: '1926-12-24' },
  { name: '昭和', abbr: 'S', start: '1926-12-25', end: '1989-01-07' },
  { name: '平成', abbr: 'H', start: '1989-01-08', end: '2019-04-30' },
  { name: '令和', abbr: 'R', start: '2019-05-01' },
]

/** Japan adopted the Gregorian calendar on 明治6年1月1日; earlier dates are lunisolar and not converted. */
export const WAREKI_MIN: ISODate = '1873-01-01'
export const WAREKI_MAX: ISODate = '2099-12-31'

export interface Wareki {
  era: Era
  /** Era year (1 = 元年). */
  year: number
  month: number
  day: number
  /** e.g. 令和8年9月1日 / 令和元年5月1日 */
  text: string
  /** e.g. R8.9.1 */
  short: string
}

export function eraOf(iso: ISODate): Era | undefined {
  for (let i = ERAS.length - 1; i >= 0; i--) {
    const e = ERAS[i]
    if (iso >= e.start && (!e.end || iso <= e.end)) return e
  }
  return undefined
}

export function toWareki(iso: ISODate): Wareki | null {
  if (iso < WAREKI_MIN || iso > WAREKI_MAX) return null
  const era = eraOf(iso)
  if (!era) return null
  const { y, m, d } = parseISO(iso)
  const year = y - Number(era.start.slice(0, 4)) + 1
  const yearText = year === 1 ? '元' : String(year)
  return { era, year, month: m, day: d, text: `${era.name}${yearText}年${m}月${d}日`, short: `${era.abbr}${year}.${m}.${d}` }
}

/** Last era year of an era (e.g. 昭和 → 64, 平成 → 31). Current era → 2099-based upper bound. */
export function maxEraYear(era: Era): number {
  const endYear = era.end ? Number(era.end.slice(0, 4)) : Number(WAREKI_MAX.slice(0, 4))
  return endYear - Number(era.start.slice(0, 4)) + 1
}

export type WarekiError = 'era' | 'year' | 'date' | 'range'

export function fromWareki(eraName: string, year: number, month: number, day: number): { iso: ISODate } | { error: WarekiError } {
  const era = ERAS.find((e) => e.name === eraName)
  if (!era) return { error: 'era' }
  if (!Number.isInteger(year) || year < 1 || year > maxEraYear(era)) return { error: 'year' }
  const y = Number(era.start.slice(0, 4)) + year - 1
  if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(day) || day < 1 || day > daysInMonth(y, month)) return { error: 'date' }
  const iso = isoOf(y, month, day)
  if (iso < era.start || (era.end && iso > era.end) || iso < WAREKI_MIN) return { error: 'range' }
  return { iso }
}

/** Cross-check our era table with the runtime's Japanese calendar (Intl). */
export function verifyWithIntl(iso: ISODate): boolean {
  const w = toWareki(iso)
  if (!w) return false
  try {
    const { y, m, d } = parseISO(iso)
    const parts = new Intl.DateTimeFormat('ja-JP-u-ca-japanese', { era: 'long', year: 'numeric', timeZone: 'UTC' }).formatToParts(
      new Date(Date.UTC(y, m - 1, d)),
    )
    const era = parts.find((p) => p.type === 'era')?.value
    const year = parts.find((p) => p.type === 'year')?.value
    return era === w.era.name && (year === String(w.year) || (w.year === 1 && year === '元'))
  } catch {
    return true // Intl without the Japanese calendar: nothing to compare against
  }
}
