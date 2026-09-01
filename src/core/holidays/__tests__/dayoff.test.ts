import { describe, expect, it } from 'vitest'
import { addBusinessDays, countBusinessDays } from '../bizdays'
import { DEFAULT_SETTINGS, PRESET_RANGES, buildDayOffMap, countOffInYear, flagsAt, withPto } from '../dayoff'
import { findStreaks, longestStreak, streakLabel } from '../streaks'
import { FLAG_HOLIDAY, FLAG_PTO, FLAG_WEEKEND, type OffSettings } from '../types'

const REF = { referenceDate: '2026-09-01' }
const SATSUN: OffSettings = { weekend: 'sat-sun', customRanges: [] }

describe('day-off map 2026', () => {
  const map = buildDayOffMap(2026, SATSUN, REF)
  it('flags', () => {
    expect(flagsAt(map, '2026-05-03')).toBe(FLAG_WEEKEND | FLAG_HOLIDAY)
    expect(flagsAt(map, '2026-05-06')).toBe(FLAG_HOLIDAY)
    expect(flagsAt(map, '2026-09-01')).toBe(0)
    expect(flagsAt(map, '2025-12-31')).toBe(0) // margin day
  })
  it('total days off = 104 weekend days + 17 weekday holidays', () => {
    expect(countOffInYear(map)).toBe(121)
  })
  it('streaks include GW (5/2–5/6) and Silver Week (9/19–9/23)', () => {
    const s = findStreaks(map)
    expect(s.find((x) => x.start === '2026-05-02')).toMatchObject({ end: '2026-05-06', length: 5, name: 'GW' })
    expect(s.find((x) => x.start === '2026-09-19')).toMatchObject({ end: '2026-09-23', length: 5, name: 'シルバーウィーク' })
    expect(streakLabel(s.find((x) => x.start === '2026-09-19')!)).toBe('シルバーウィーク 5連休')
    expect(longestStreak(s)?.length).toBe(5)
    // no streak may lie entirely outside the year
    for (const x of s) expect(x.end >= '2026-01-01' && x.start <= '2026-12-31').toBe(true)
  })
  it('year-end preset creates a 6-day 年末年始 streak crossing into 2027', () => {
    const m = buildDayOffMap(2026, { weekend: 'sat-sun', customRanges: [PRESET_RANGES.nenmatsu] }, REF)
    const ny = findStreaks(m).filter((x) => x.name === '年末年始')
    // the map shows both New Year streaks of the year: the one ending in January and the one starting in December
    expect(ny.map((x) => [x.start, x.end, x.length])).toEqual([
      ['2025-12-27', '2026-01-04', 9],
      ['2026-12-29', '2027-01-03', 6],
    ])
    // and the same streak is visible from 2027's map
    const m27 = buildDayOffMap(2027, { weekend: 'sat-sun', customRanges: [PRESET_RANGES.nenmatsu] }, REF)
    expect(findStreaks(m27).find((x) => x.name === '年末年始')).toMatchObject({ start: '2026-12-29', end: '2027-01-03', length: 6 })
  })
  it('withPto marks days and extends streaks', () => {
    const m = withPto(map, ['2026-09-24', '2026-09-25'])
    expect(flagsAt(m, '2026-09-24')).toBe(FLAG_PTO)
    const sw = findStreaks(m).find((x) => x.start === '2026-09-19')
    expect(sw).toMatchObject({ end: '2026-09-27', length: 9, boosted: true, ptoDays: ['2026-09-24', '2026-09-25'] })
  })
  it('a 4/29–5/1 streak is named GW too (2022)', () => {
    const m = buildDayOffMap(2022, SATSUN, REF)
    expect(findStreaks(m).find((x) => x.start === '2022-04-29')).toMatchObject({ end: '2022-05-01', length: 3, name: 'GW' })
  })
  it('sun-only weekend rule', () => {
    const m = buildDayOffMap(2026, { weekend: 'sun', customRanges: [] }, REF)
    expect(flagsAt(m, '2026-09-19')).toBe(0)
    expect(flagsAt(m, '2026-09-20')).toBe(FLAG_WEEKEND)
  })
})

describe('business days', () => {
  it('addBusinessDays skips weekends and holidays', () => {
    expect(addBusinessDays('2026-09-01', 10, DEFAULT_SETTINGS, REF)).toBe('2026-09-15')
    expect(addBusinessDays('2026-09-18', 1, DEFAULT_SETTINGS, REF)).toBe('2026-09-24') // over Silver Week
    expect(addBusinessDays('2026-09-24', -1, DEFAULT_SETTINGS, REF)).toBe('2026-09-18')
    expect(addBusinessDays('2026-09-01', 0, DEFAULT_SETTINGS, REF)).toBe('2026-09-01')
  })
  it('countBusinessDays over September 2026', () => {
    expect(countBusinessDays('2026-09-01', '2026-09-30', DEFAULT_SETTINGS, REF)).toEqual({ business: 19, calendar: 30, off: 11, weeks: 4 })
    // order-insensitive
    expect(countBusinessDays('2026-09-30', '2026-09-01', DEFAULT_SETTINGS, REF).business).toBe(19)
  })
})
