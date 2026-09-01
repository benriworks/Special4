import { monthDay, weekday } from './date'
import { dateAt } from './dayoff'
import { FLAG_HOLIDAY, FLAG_PTO, type DayOffMap, type Streak } from './types'

/** Short, well-known names for special streaks. */
export function nameStreak(map: DayOffMap, from: number, to: number): string | undefined {
  let newYear = false
  let gw = false
  let keiro = false
  let shubun = false
  let obon = false
  for (let i = from; i <= to; i++) {
    const d = dateAt(map, i)
    const md = monthDay(d)
    if (md === '01-01') newYear = true
    if (md >= '05-03' && md <= '05-05') gw = true
    if (md >= '08-13' && md <= '08-15') obon = true
    if (map.flags[i] & FLAG_HOLIDAY) {
      if (md >= '09-15' && md <= '09-21' && weekday(d) === 1) keiro = true
      if (md >= '09-22' && md <= '09-23') shubun = true
    }
  }
  if (newYear) return '年末年始'
  if (gw) return 'GW'
  if (keiro && shubun) return 'シルバーウィーク'
  if (obon) return 'お盆'
  return undefined
}

/**
 * Consecutive runs of non-working days (weekend / holiday / custom / PTO) of at
 * least `minLen` days that intersect the display year. Runs may start or end in
 * the margin months so New Year streaks keep their true length.
 */
export function findStreaks(map: DayOffMap, minLen = 3): Streak[] {
  const out: Streak[] = []
  const n = map.flags.length
  const ys = map.yearStartIndex
  const ye = ys + map.yearLength - 1
  let i = 0
  while (i < n) {
    if (map.flags[i] === 0) {
      i++
      continue
    }
    let j = i
    while (j + 1 < n && map.flags[j + 1] !== 0) j++
    const length = j - i + 1
    if (length >= minLen && j >= ys && i <= ye) {
      const ptoDays: string[] = []
      for (let k = i; k <= j; k++) if (map.flags[k] & FLAG_PTO) ptoDays.push(dateAt(map, k))
      out.push({
        start: dateAt(map, i),
        end: dateAt(map, j),
        length,
        name: nameStreak(map, i, j),
        ptoDays,
        boosted: ptoDays.length > 0,
      })
    }
    i = j + 1
  }
  return out
}

export function longestStreak(streaks: Streak[]): Streak | null {
  let best: Streak | null = null
  for (const s of streaks) if (!best || s.length > best.length) best = s
  return best
}

/** Display label such as 'GW 5連休' or '3連休'. */
export function streakLabel(s: Streak, withName = true): string {
  return withName && s.name ? `${s.name} ${s.length}連休` : `${s.length}連休`
}
