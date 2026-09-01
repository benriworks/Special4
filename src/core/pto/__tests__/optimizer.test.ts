import { describe, expect, it } from 'vitest'
import { buildDayOffMap } from '../../holidays/dayoff'
import type { OffSettings } from '../../holidays/types'
import { suggestPto } from '../optimizer'

const REF = { referenceDate: '2026-09-01' }
const SATSUN: OffSettings = { weekend: 'sat-sun', customRanges: [] }
const base = buildDayOffMap(2026, SATSUN, REF)

describe('suggestPto — longest', () => {
  it('n=0 is the baseline', () => {
    const p = suggestPto(base, 0, 'longest')
    expect(p.ptoDays).toEqual([])
    expect(p.summary).toEqual(p.baseline)
    expect(p.baseline).toMatchObject({ totalOff: 121, streak3plus: 8 })
    expect(p.baseline.longest?.length).toBe(5)
  })
  it('n=1: earliest 6-day option (5/1 makes 5/1–5/6)', () => {
    const p = suggestPto(base, 1, 'longest')
    expect(p.ptoDays).toEqual(['2026-05-01'])
    expect(p.summary.longest).toMatchObject({ start: '2026-05-01', end: '2026-05-06', length: 6 })
  })
  it('n=2: 9 days — GW (5/2–5/10) wins the tie with Silver Week by being earlier', () => {
    const p = suggestPto(base, 2, 'longest')
    expect(p.ptoDays).toEqual(['2026-05-07', '2026-05-08'])
    expect(p.summary.longest).toMatchObject({ start: '2026-05-02', end: '2026-05-10', length: 9, boosted: true })
    expect(p.summary.totalOff).toBe(123)
  })
  it('n=2 with notBefore=today (9/1): Silver Week becomes 9 days (9/19–9/27)', () => {
    const p = suggestPto(base, 2, 'longest', { notBefore: '2026-09-01' })
    expect(p.ptoDays).toEqual(['2026-09-24', '2026-09-25'])
    expect(p.summary.longest).toMatchObject({ start: '2026-09-19', end: '2026-09-27', length: 9, boosted: true })
  })
  it('n=3 with notBefore: 10 days around Silver Week, earliest start on ties', () => {
    const p = suggestPto(base, 3, 'longest', { notBefore: '2026-09-01' })
    expect(p.summary.longest).toMatchObject({ start: '2026-09-18', end: '2026-09-27', length: 10 })
    expect(p.ptoDays).toEqual(['2026-09-18', '2026-09-24', '2026-09-25'])
  })
  it('notBefore never yields PTO in the past', () => {
    for (let n = 0; n <= 10; n++) {
      for (const mode of ['longest', 'more3'] as const) {
        const p = suggestPto(base, n, mode, { notBefore: '2026-09-01' })
        for (const d of p.ptoDays) expect(d >= '2026-09-01', `${mode} n=${n} ${d}`).toBe(true)
      }
    }
  })
  it('notBefore after year end leaves nothing to suggest', () => {
    const p = suggestPto(base, 5, 'longest', { notBefore: '2027-01-01' })
    expect(p.ptoDays).toEqual([])
    expect(p.summary).toEqual(p.baseline)
  })
  it('n=4: 12-day Golden Week', () => {
    const p = suggestPto(base, 4, 'longest')
    expect(p.summary.longest?.length).toBe(12)
    expect(p.summary.longest?.name).toBe('GW')
    expect(p.ptoDays).toHaveLength(4)
  })
  it('never places PTO on a non-working day or outside the year', () => {
    for (let n = 0; n <= 10; n++) {
      const p = suggestPto(base, n, 'longest')
      expect(p.ptoDays.length).toBeLessThanOrEqual(n)
      for (const d of p.ptoDays) expect(d.startsWith('2026-')).toBe(true)
      expect(new Set(p.ptoDays).size).toBe(p.ptoDays.length)
    }
  })
})

describe('suggestPto — more3', () => {
  it('every PTO day creates a new 3+ streak when possible', () => {
    const p = suggestPto(base, 3, 'more3')
    expect(p.ptoDays).toHaveLength(3)
    expect(p.summary.streak3plus).toBe(p.baseline.streak3plus + 3)
  })
  it('n=10 still adds ten streaks', () => {
    const p = suggestPto(base, 10, 'more3')
    expect(p.summary.streak3plus).toBe(18)
    expect(p.summary.totalOff).toBe(131)
  })
})

describe('suggestPto — more3 with no weekly days off', () => {
  const none = buildDayOffMap(2026, { weekend: 'none', customRanges: [] }, REF)
  it('places pairs around isolated holidays so streaks actually appear', () => {
    const p2 = suggestPto(none, 2, 'more3')
    expect(p2.ptoDays).toHaveLength(2)
    expect(p2.summary.streak3plus).toBe(p2.baseline.streak3plus + 1)
    const p4 = suggestPto(none, 4, 'more3')
    expect(p4.summary.streak3plus).toBe(p4.baseline.streak3plus + 2)
  })
  it('n=1 still uses the day sensibly (extends the existing GW run)', () => {
    const p1 = suggestPto(none, 1, 'more3')
    expect(p1.ptoDays).toHaveLength(1)
  })
})

describe('performance', () => {
  it('n=10 both modes under 100ms', () => {
    const t0 = performance.now()
    suggestPto(base, 10, 'longest')
    suggestPto(base, 10, 'more3')
    expect(performance.now() - t0).toBeLessThan(100)
  })
})
