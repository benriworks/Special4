import { countOffInYear, dateAt, indexOf, withPto } from '../holidays/dayoff'
import { findStreaks, longestStreak } from '../holidays/streaks'
import type { DayOffMap, ISODate, Streak } from '../holidays/types'

export type PtoMode = 'longest' | 'more3'

export const PTO_MAX = 10

export interface PtoSummary {
  /** Non-working days in the year, PTO included. */
  totalOff: number
  /** Number of streaks of 3+ days. */
  streak3plus: number
  /** Sum of the lengths of all 3+ streaks. */
  daysIn3plus: number
  longest: Streak | null
}

export interface PtoPlan {
  mode: PtoMode
  requested: number
  /** Suggested paid-leave days (sorted). May be fewer than requested when nothing useful is left. */
  ptoDays: ISODate[]
  /** `base` with PTO bits applied. */
  map: DayOffMap
  streaks: Streak[]
  summary: PtoSummary
  /** Summary of `base` without any PTO, for deltas. */
  baseline: PtoSummary
}

export function summarize(map: DayOffMap): PtoSummary {
  const streaks = findStreaks(map, 3)
  return {
    totalOff: countOffInYear(map),
    streak3plus: streaks.length,
    daysIn3plus: streaks.reduce((a, s) => a + s.length, 0),
    longest: longestStreak(streaks),
  }
}

interface Window {
  i: number
  j: number
  cost: number
}

/** Index range [minIdx, maxIdx] of workdays on which PTO may be placed. */
interface Placeable {
  minIdx: number
  maxIdx: number
}

function placeable(p: Placeable, flags: Uint8Array, i: number): boolean {
  return flags[i] === 0 && i >= p.minIdx && i <= p.maxIdx
}

/**
 * Longest run of consecutive days that can be made non-working with at most
 * `budget` PTO days placed on in-year workdays. Ties → fewer PTO days → earliest.
 */
function longestWindow(map: DayOffMap, flags: Uint8Array, budget: number, p: Placeable): Window | null {
  const len = flags.length
  const ys = map.yearStartIndex
  const ye = ys + map.yearLength - 1
  let best: Window | null = null
  for (let i = 0; i < len; i++) {
    const startsOnWork = flags[i] === 0
    if (startsOnWork && (!placeable(p, flags, i) || budget < 1)) continue
    let cost = startsOnWork ? 1 : 0
    let j = i
    while (j + 1 < len) {
      const k = j + 1
      if (flags[k] === 0) {
        if (!placeable(p, flags, k) || cost + 1 > budget) break
        cost++
      }
      j = k
    }
    if (j < ys || i > ye) continue // lies entirely in the margin
    const length = j - i + 1
    if (!best || length > best.j - best.i + 1 || (length === best.j - best.i + 1 && cost < best.cost)) {
      best = { i, j, cost }
    }
  }
  return best
}

/** Score used by the "more 3-day weekends" strategy: more streaks first, then more days inside them. */
function score3(map: DayOffMap, flags: Uint8Array): [number, number] {
  const len = flags.length
  const ys = map.yearStartIndex
  const ye = ys + map.yearLength - 1
  let count = 0
  let days = 0
  let i = 0
  while (i < len) {
    if (flags[i] === 0) {
      i++
      continue
    }
    let j = i
    while (j + 1 < len && flags[j + 1] !== 0) j++
    const length = j - i + 1
    if (length >= 3 && j >= ys && i <= ye) {
      count++
      days += length
    }
    i = j + 1
  }
  return [count, days]
}

/**
 * Greedy: repeatedly place PTO on the in-year workday adjacent to an existing
 * non-working day that yields the best (streak count, streak days). When no
 * single day can create a new streak (e.g. weekend rule 'none', where an
 * isolated holiday needs two PTO days), it looks one step further and places a
 * pair. Mutates `flags`; returns the chosen indices.
 */
function greedyMore3(map: DayOffMap, flags: Uint8Array, budget: number, p: Placeable): number[] {
  const chosen: number[] = []
  const len = flags.length
  const better = (a: [number, number], b: [number, number]) => a[0] > b[0] || (a[0] === b[0] && a[1] > b[1])
  let remaining = budget
  while (remaining > 0) {
    const current = score3(map, flags)
    let bestIdx = -1
    let bestScore: [number, number] = [-1, -1]
    for (let i = 0; i < len; i++) {
      if (!placeable(p, flags, i)) continue
      const adjacent = (i > 0 && flags[i - 1] !== 0) || (i + 1 < len && flags[i + 1] !== 0)
      if (!adjacent) continue
      flags[i] = 8
      const s = score3(map, flags)
      flags[i] = 0
      if (better(s, bestScore)) {
        bestScore = s
        bestIdx = i
      }
    }
    if (bestIdx < 0) break

    if (bestScore[0] <= current[0] && remaining >= 2) {
      // No single day creates a streak: try pairs (i, i+1) and (i, i+2 with an off day between).
      let pair: [number, number] | null = null
      let pairScore: [number, number] = bestScore
      for (let i = 0; i < len; i++) {
        if (!placeable(p, flags, i)) continue
        for (const j of [i + 1, i + 2]) {
          if (j >= len || !placeable(p, flags, j)) continue
          if (j === i + 2 && flags[i + 1] === 0) continue
          const touchesOff = (i > 0 && flags[i - 1] !== 0) || (j + 1 < len && flags[j + 1] !== 0) || j === i + 2
          if (!touchesOff) continue
          flags[i] = 8
          flags[j] = 8
          const s = score3(map, flags)
          flags[i] = 0
          flags[j] = 0
          if (s[0] > pairScore[0] || (s[0] === pairScore[0] && s[1] > pairScore[1] && s[0] > current[0])) {
            pairScore = s
            pair = [i, j]
          }
        }
      }
      if (pair && pairScore[0] > current[0]) {
        flags[pair[0]] = 8
        flags[pair[1]] = 8
        chosen.push(pair[0], pair[1])
        remaining -= 2
        continue
      }
    }

    flags[bestIdx] = 8
    chosen.push(bestIdx)
    remaining--
  }
  return chosen
}

export interface PtoOptions {
  /** PTO is never suggested before this date (e.g. today, when viewing the current year). */
  notBefore?: ISODate
}

/**
 * Suggest where to put `n` paid-leave days.
 *  - 'longest': maximise the single longest streak, then spend leftovers on extra 3+ streaks.
 *  - 'more3'  : maximise the number of 3+ streaks (then the days inside them).
 * Deterministic and fast (n ≤ 10, ~430 days). Ties resolve to the earliest dates.
 */
export function suggestPto(base: DayOffMap, n: number, mode: PtoMode, opts: PtoOptions = {}): PtoPlan {
  const requested = Math.max(0, Math.min(PTO_MAX, Math.trunc(n)))
  const clean = withPto(base, [])
  const baseline = summarize(clean)
  const flags = new Uint8Array(clean.flags)
  const picked: number[] = []
  const ys = clean.yearStartIndex
  const p: Placeable = {
    minIdx: opts.notBefore ? Math.max(ys, indexOf(clean, opts.notBefore)) : ys,
    maxIdx: ys + clean.yearLength - 1,
  }

  if (requested > 0) {
    let budget = requested
    if (mode === 'longest') {
      const w = longestWindow(clean, flags, budget, p)
      if (w) {
        for (let k = w.i; k <= w.j; k++) {
          if (flags[k] === 0) {
            flags[k] = 8
            picked.push(k)
          }
        }
        budget -= w.cost
      }
    }
    if (budget > 0) picked.push(...greedyMore3(clean, flags, budget, p))
  }

  const ptoDays = picked.sort((a, b) => a - b).map((i) => dateAt(clean, i))
  const map = withPto(clean, ptoDays)
  const streaks = findStreaks(map, 3)
  return { mode, requested, ptoDays, map, streaks, summary: summarize(map), baseline }
}
