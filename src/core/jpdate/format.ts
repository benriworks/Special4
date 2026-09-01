import { parseISO, weekday } from '../holidays/date'
import type { ISODate } from '../holidays/types'

export const WEEKDAYS_JA = ['日', '月', '火', '水', '木', '金', '土']

export function weekdayJa(iso: ISODate): string {
  return WEEKDAYS_JA[weekday(iso)]
}

/** 2026年9月19日(土) / 9月19日(土) */
export function formatJa(iso: ISODate, opts: { year?: boolean; weekday?: boolean } = {}): string {
  const { y, m, d } = parseISO(iso)
  const year = opts.year === false ? '' : `${y}年`
  const wd = opts.weekday === false ? '' : `(${weekdayJa(iso)})`
  return `${year}${m}月${d}日${wd}`
}

/** 9/19(土) */
export function formatShort(iso: ISODate, withWeekday = true): string {
  const { m, d } = parseISO(iso)
  return `${m}/${d}${withWeekday ? `(${weekdayJa(iso)})` : ''}`
}

/** 9/18・9/24・9/25 — at most `max` dates, then 「ほか◯日」 */
export function listDatesShort(days: readonly ISODate[], max = 4): string {
  const shown = days.length > max + 1 ? days.slice(0, max) : days
  const rest = days.length - shown.length
  return shown.map((d) => formatShort(d, false)).join('・') + (rest > 0 ? ` ほか${rest}日` : '')
}

/** 9/19(土)〜9/23(水) */
export function formatRangeShort(a: ISODate, b: ISODate): string {
  return `${formatShort(a)}〜${formatShort(b)}`
}

/** あと5日 / 今日 / 3日前 */
export function relativeDaysJa(n: number): string {
  if (n === 0) return '今日'
  if (n === 1) return '明日'
  return n > 0 ? `あと${n}日` : `${-n}日前`
}

const nf = new Intl.NumberFormat('ja-JP')
export function formatNumberJa(n: number): string {
  return nf.format(n)
}
