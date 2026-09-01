import { addDays, daysInMonth, isoOf, weekday, type DayOffMap, type ISODate, type Streak } from '../../core/holidays'
import { flagsAt, FLAG_PTO } from '../../core/holidays'

/** One row-segment of a streak ribbon inside a month grid. */
export interface RibbonSegment {
  key: string
  streak: Streak
  /** 1-based grid row of the ribbon row in the month grid. */
  row: number
  /** 1-based grid columns (inclusive start, exclusive end). */
  colStart: number
  colEnd: number
  days: { date: ISODate; pto: boolean }[]
  isStart: boolean
  isEnd: boolean
}

/** Grid placement of one day cell. */
export interface DayPlacement {
  date: ISODate
  day: number
  row: number
  col: number
}

export const HEADER_ROWS = 1
/** Day rows and ribbon rows alternate: week w → day row 2+2w, ribbon row 3+2w. */
export const dayRow = (week: number) => HEADER_ROWS + 1 + 2 * week
export const ribbonRow = (week: number) => HEADER_ROWS + 2 + 2 * week

export function monthDays(year: number, month: number): DayPlacement[] {
  const first = isoOf(year, month, 1)
  const startWd = weekday(first)
  const n = daysInMonth(year, month)
  const out: DayPlacement[] = []
  for (let d = 1; d <= n; d++) {
    const idx = startWd + d - 1
    out.push({ date: isoOf(year, month, d), day: d, row: dayRow(Math.floor(idx / 7)), col: (idx % 7) + 1 })
  }
  return out
}

/** Split the streaks that intersect a month into per-week ribbon segments. */
export function monthSegments(year: number, month: number, streaks: Streak[], map: DayOffMap): RibbonSegment[] {
  const first = isoOf(year, month, 1)
  const last = isoOf(year, month, daysInMonth(year, month))
  const startWd = weekday(first)
  const out: RibbonSegment[] = []
  for (const s of streaks) {
    if (s.end < first || s.start > last) continue
    const from = s.start < first ? first : s.start
    const to = s.end > last ? last : s.end
    let d = from
    let current: RibbonSegment | null = null
    while (d <= to) {
      const dayNum = Number(d.slice(8, 10))
      const idx = startWd + dayNum - 1
      const week = Math.floor(idx / 7)
      const col = (idx % 7) + 1
      const pto = (flagsAt(map, d) & FLAG_PTO) !== 0
      if (!current || current.row !== ribbonRow(week)) {
        current = {
          key: `${s.start}_${s.end}_${month}_${week}`,
          streak: s,
          row: ribbonRow(week),
          colStart: col,
          colEnd: col + 1,
          days: [],
          isStart: false,
          isEnd: false,
        }
        out.push(current)
      }
      current.colEnd = col + 1
      current.days.push({ date: d, pto })
      if (d === s.start) current.isStart = true
      if (d === s.end) current.isEnd = true
      d = addDays(d, 1)
    }
  }
  return out
}

/** Key (`${month}_${week}`-like) of the longest segment of each streak across the whole year: where its label goes. */
export function labelSegmentKeys(year: number, streaks: Streak[], map: DayOffMap): Map<Streak, string> {
  const best = new Map<Streak, { key: string; len: number }>()
  for (let m = 1; m <= 12; m++) {
    for (const seg of monthSegments(year, m, streaks, map)) {
      const cur = best.get(seg.streak)
      if (!cur || seg.days.length > cur.len) best.set(seg.streak, { key: seg.key, len: seg.days.length })
    }
  }
  return new Map([...best].map(([s, v]) => [s, v.key]))
}

/** Longest runs of same-kind slots inside a segment: `main` = non-PTO (red), `pto` = PTO (yellow). Each is [startIndex, length]. */
export function labelRuns(days: { pto: boolean }[]): { main: [number, number]; pto: [number, number] } {
  let main: [number, number] = [0, 0]
  let pto: [number, number] = [0, 0]
  let i = 0
  while (i < days.length) {
    let j = i
    while (j + 1 < days.length && days[j + 1].pto === days[i].pto) j++
    const len = j - i + 1
    if (days[i].pto) {
      if (len > pto[1]) pto = [i, len]
    } else if (len > main[1]) main = [i, len]
    i = j + 1
  }
  return { main, pto }
}

/** Pick the longest label that fits in `px` pixels (≈12px per character + padding). */
export function fitLabel(candidates: string[], px: number): string {
  for (const c of candidates) if (c.length * 12 + 12 <= px) return c
  return ''
}
