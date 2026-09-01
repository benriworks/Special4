import { describe, expect, it } from 'vitest'
import {
  cardFileName,
  chipPositions,
  fitText,
  hatchSegments,
  planChips,
  ptoLine,
  ptoLineShort,
  resolvePalette,
  streakDays,
  streakTitle,
} from '../layout'

describe('streakDays', () => {
  it('lists every day from start to end inclusive', () => {
    expect(streakDays({ start: '2026-09-19', end: '2026-09-23' })).toEqual([
      '2026-09-19',
      '2026-09-20',
      '2026-09-21',
      '2026-09-22',
      '2026-09-23',
    ])
  })
  it('crosses month and year boundaries', () => {
    const days = streakDays({ start: '2025-12-30', end: '2026-01-02' })
    expect(days).toEqual(['2025-12-30', '2025-12-31', '2026-01-01', '2026-01-02'])
  })
  it('returns [] for an inverted range', () => {
    expect(streakDays({ start: '2026-01-05', end: '2026-01-01' })).toEqual([])
  })
  it('returns [] instead of throwing for malformed dates', () => {
    expect(streakDays({ start: '', end: '2026-01-01' })).toEqual([])
    expect(streakDays({ start: '2026-02-30', end: '2026-03-01' })).toEqual([])
  })
  it('includes a leap day', () => {
    expect(streakDays({ start: '2028-02-27', end: '2028-03-01' })).toEqual([
      '2028-02-27',
      '2028-02-28',
      '2028-02-29',
      '2028-03-01',
    ])
  })
})

describe('planChips', () => {
  const range = (n: number) => Array.from({ length: n }, (_, i) => i + 1)
  it('shows everything up to the maximum', () => {
    expect(planChips(range(16))).toHaveLength(16)
    expect(planChips(range(16)).every((c) => c.kind === 'item')).toBe(true)
    expect(planChips(range(3))).toEqual([
      { kind: 'item', value: 1 },
      { kind: 'item', value: 2 },
      { kind: 'item', value: 3 },
    ])
  })
  it('keeps the first 14 and appends an ellipsis when longer than 16', () => {
    const plan = planChips(range(17))
    expect(plan).toHaveLength(15)
    expect(plan.slice(0, 14).map((c) => (c.kind === 'item' ? c.value : -1))).toEqual(range(14))
    expect(plan[14]).toEqual({ kind: 'ellipsis' })
  })
})

describe('chipPositions', () => {
  it('spaces chips by size + gap from the origin', () => {
    expect(chipPositions(3, 72, 56, 8)).toEqual([72, 136, 200])
    expect(chipPositions(0, 72, 56, 8)).toEqual([])
  })
  it('fits the widest strip inside the 1200px card margins', () => {
    const xs = chipPositions(16, 72, 56, 8)
    expect(xs[15] + 56).toBeLessThanOrEqual(1200 - 72)
  })
})

describe('hatchSegments', () => {
  it('produces 45° lines that stay inside the box', () => {
    const segs = hatchSegments(56, 56, 8)
    expect(segs.length).toBe(13)
    for (const s of segs) {
      for (const v of [s.x1, s.x2]) expect(v).toBeGreaterThanOrEqual(0), expect(v).toBeLessThanOrEqual(56)
      for (const v of [s.y1, s.y2]) expect(v).toBeGreaterThanOrEqual(0), expect(v).toBeLessThanOrEqual(56)
      // Both ends lie on the same x + y = c diagonal.
      expect(s.x1 + s.y1).toBe(s.x2 + s.y2)
      expect(s.x1).not.toBe(s.x2)
    }
  })
  it('handles non-square boxes and degenerate input', () => {
    const segs = hatchSegments(20, 10, 5)
    expect(segs.map((s) => s.x1 + s.y1)).toEqual([5, 10, 15, 20, 25])
    expect(segs.every((s) => s.y1 <= 10 && s.x2 <= 20)).toBe(true)
    expect(hatchSegments(0, 10, 5)).toEqual([])
    expect(hatchSegments(10, 10, 0)).toEqual([])
  })
})

describe('fitText', () => {
  const measure = (s: string) => Array.from(s).length * 10
  it('returns the text unchanged when it fits', () => {
    expect(fitText('シルバーウィーク', 80, measure)).toBe('シルバーウィーク')
  })
  it('truncates with an ellipsis so the result fits', () => {
    const out = fitText('シルバーウィーク', 50, measure)
    expect(out).toBe('シルバー…')
    expect(measure(out)).toBeLessThanOrEqual(50)
  })
  it('degrades to the ellipsis alone or nothing when the space is tiny', () => {
    expect(fitText('abc', 10, measure)).toBe('…')
    expect(fitText('abc', 5, measure)).toBe('')
  })
  it('does not leave a trailing space before the ellipsis', () => {
    expect(fitText('有休 9/24 の1日で', 90, measure)).toBe('有休 9/24…')
  })
})

describe('ptoLine / ptoLineShort / streakTitle', () => {
  it('lists PTO days with or without weekdays', () => {
    expect(ptoLine(['2026-09-24', '2026-09-25'], true)).toBe('有休 9/24(木)・9/25(金) の2日で')
    expect(ptoLine(['2026-09-24', '2026-09-25'], false)).toBe('有休 9/24・9/25 の2日で')
    expect(ptoLine([], true)).toBe('有休なしで')
  })
  it('has a compact form', () => {
    expect(ptoLineShort(0)).toBe('有休なしで')
    expect(ptoLineShort(3)).toBe('有休 3日で')
  })
  it('builds the streak title', () => {
    expect(streakTitle({ length: 9, name: 'シルバーウィーク' })).toBe('9連休（シルバーウィーク）')
    expect(streakTitle({ length: 3 })).toBe('3連休')
  })
})

describe('cardFileName', () => {
  it('encodes year and MMDD range', () => {
    expect(cardFileName(2026, { start: '2026-09-19', end: '2026-09-27' })).toBe('hizuke-2026-0919-0927.png')
    expect(cardFileName(2026, { start: '2025-12-27', end: '2026-01-04' })).toBe('hizuke-2026-1227-0104.png')
  })
})

describe('resolvePalette', () => {
  const fallback = { bg: '#000', text: '#fff' }
  const tokens = { bg: '--color-bg', text: '--color-text' }
  it('prefers computed values and trims them', () => {
    const read = (t: string) => (t === '--color-bg' ? ' #FBFBF9 ' : '')
    expect(resolvePalette(fallback, tokens, read)).toEqual({ bg: '#FBFBF9', text: '#fff' })
  })
  it('keeps every fallback when reading fails', () => {
    const read = () => {
      throw new Error('no style')
    }
    expect(resolvePalette(fallback, tokens, read)).toEqual(fallback)
  })
})
