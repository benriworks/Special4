import type { ISODate } from './types'

const pad2 = (n: number) => (n < 10 ? `0${n}` : String(n))
const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/

export function isoOf(y: number, m: number, d: number): ISODate {
  return `${y}-${pad2(m)}-${pad2(d)}`
}

export function isValidISO(s: string): boolean {
  const m = ISO_RE.exec(s)
  if (!m) return false
  const y = Number(m[1]), mo = Number(m[2]), d = Number(m[3])
  return mo >= 1 && mo <= 12 && d >= 1 && d <= daysInMonth(y, mo)
}

export function parseISO(iso: ISODate): { y: number; m: number; d: number } {
  const m = ISO_RE.exec(iso)
  if (!m) throw new Error(`invalid ISO date: ${iso}`)
  return { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) }
}

export function toUTC(iso: ISODate): number {
  const { y, m, d } = parseISO(iso)
  return Date.UTC(y, m - 1, d)
}

export function fromUTC(ms: number): ISODate {
  const dt = new Date(ms)
  return isoOf(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate())
}

const DAY_MS = 86_400_000

export function addDays(iso: ISODate, n: number): ISODate {
  return fromUTC(toUTC(iso) + n * DAY_MS)
}

/** Difference in whole days: b - a. */
export function diffDays(a: ISODate, b: ISODate): number {
  return Math.round((toUTC(b) - toUTC(a)) / DAY_MS)
}

/** 0 = Sunday … 6 = Saturday */
export function weekday(iso: ISODate): number {
  return new Date(toUTC(iso)).getUTCDay()
}

export function isLeapYear(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0
}

export function daysInMonth(y: number, m: number): number {
  return [31, isLeapYear(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1]
}

export function daysInYear(y: number): number {
  return isLeapYear(y) ? 366 : 365
}

/** 1-based day of year. */
export function dayOfYear(iso: ISODate): number {
  const { y } = parseISO(iso)
  return diffDays(isoOf(y, 1, 1), iso) + 1
}

/** Day-of-month of the n-th given weekday (0=Sun) in a month. */
export function nthWeekdayOfMonth(y: number, m: number, wd: number, n: number): number {
  const first = weekday(isoOf(y, m, 1))
  const offset = (wd - first + 7) % 7
  return 1 + offset + (n - 1) * 7
}

/** 'MM-DD' of an ISO date. */
export function monthDay(iso: ISODate): string {
  return iso.slice(5)
}

/** Today's date in a given IANA time zone (default: Japan). */
export function todayISO(timeZone = 'Asia/Tokyo', now: Date = new Date()): ISODate {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')}`
}
