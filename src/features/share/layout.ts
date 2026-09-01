import { addDays, diffDays, isValidISO, monthDay, type ISODate, type Streak } from '../../core/holidays'
import { formatShort } from '../../core/jpdate'

/*
 * Pure layout / text helpers for the share card. No DOM access here so they
 * can be unit-tested; renderCard.ts does the actual Canvas drawing.
 */

/** Every day of a streak, in order (start … end inclusive). */
export function streakDays(streak: Pick<Streak, 'start' | 'end'>): ISODate[] {
  if (!isValidISO(streak.start) || !isValidISO(streak.end)) return []
  const n = diffDays(streak.start, streak.end) + 1
  if (!Number.isFinite(n) || n <= 0) return []
  const out: ISODate[] = []
  for (let i = 0; i < n; i++) out.push(addDays(streak.start, i))
  return out
}

export type ChipPlan<T> = { kind: 'item'; value: T } | { kind: 'ellipsis' }

/**
 * Which chips to show: everything when it fits (≤ `max`), otherwise the first
 * `keep` items followed by an ellipsis marker.
 */
export function planChips<T>(items: readonly T[], max = 16, keep = 14): ChipPlan<T>[] {
  if (items.length <= max) return items.map((value) => ({ kind: 'item', value }))
  const out: ChipPlan<T>[] = items.slice(0, keep).map((value) => ({ kind: 'item', value }))
  out.push({ kind: 'ellipsis' })
  return out
}

/** Left x coordinate of each of `count` chips laid out in a row. */
export function chipPositions(count: number, x0: number, size: number, gap: number): number[] {
  const out: number[] = []
  for (let i = 0; i < count; i++) out.push(x0 + i * (size + gap))
  return out
}

export interface Segment {
  x1: number
  y1: number
  x2: number
  y2: number
}

/**
 * 45° hatch lines (x + y = c) covering a w×h box anchored at (0,0), spaced by
 * `step`. Each segment is clipped to the box; the caller offsets by the box origin.
 */
export function hatchSegments(w: number, h: number, step: number): Segment[] {
  const out: Segment[] = []
  if (w <= 0 || h <= 0 || step <= 0) return out
  for (let c = step; c < w + h; c += step) {
    const x1 = c <= w ? c : w
    const y1 = c <= w ? 0 : c - w
    const x2 = c <= h ? 0 : c - h
    const y2 = c <= h ? c : h
    out.push({ x1, y1, x2, y2 })
  }
  return out
}

/**
 * Shorten `text` so that `measure(result) <= maxWidth`, appending an ellipsis
 * when something was cut. `measure` is injected so the function stays pure.
 */
export function fitText(text: string, maxWidth: number, measure: (s: string) => number, ellipsis = '…'): string {
  if (measure(text) <= maxWidth) return text
  const chars = Array.from(text)
  let lo = 0
  let hi = chars.length
  // Largest k such that chars[0..k) + ellipsis fits.
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1
    if (measure(chars.slice(0, mid).join('') + ellipsis) <= maxWidth) lo = mid
    else hi = mid - 1
  }
  if (lo === 0) return measure(ellipsis) <= maxWidth ? ellipsis : ''
  return chars.slice(0, lo).join('').trimEnd() + ellipsis
}

/** 「有休 9/24(木)・9/25(金) の2日で」 / 「有休 9/24・9/25 の2日で」 / 「有休なしで」 */
export function ptoLine(ptoDays: readonly ISODate[], withWeekday: boolean): string {
  if (ptoDays.length === 0) return '有休なしで'
  const list = ptoDays.map((d) => formatShort(d, withWeekday)).join('・')
  return `有休 ${list} の${ptoDays.length}日で`
}

/** Compact form for narrow spaces: 「有休 2日で」 / 「有休なしで」 */
export function ptoLineShort(count: number): string {
  return count === 0 ? '有休なしで' : `有休 ${count}日で`
}

/** 「9連休（シルバーウィーク）」 / 「3連休」 */
export function streakTitle(streak: Pick<Streak, 'length' | 'name'>): string {
  return `${streak.length}連休${streak.name ? `（${streak.name}）` : ''}`
}

/** hizuke-2026-0919-0927.png */
export function cardFileName(year: number, streak: Pick<Streak, 'start' | 'end'>): string {
  const md = (iso: ISODate) => monthDay(iso).replace('-', '')
  return `hizuke-${year}-${md(streak.start)}-${md(streak.end)}.png`
}

/**
 * Merge computed CSS custom-property values over a fallback palette. Empty or
 * whitespace-only values (token missing) keep the fallback.
 */
export function resolvePalette<K extends string>(
  fallback: Record<K, string>,
  tokens: Record<K, string>,
  read: (token: string) => string,
): Record<K, string> {
  const out = { ...fallback }
  for (const key of Object.keys(tokens) as K[]) {
    let v = ''
    try {
      v = read(tokens[key]).trim()
    } catch {
      v = ''
    }
    if (v) out[key] = v
  }
  return out
}
