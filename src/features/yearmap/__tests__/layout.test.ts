import { describe, expect, it } from 'vitest'
import { buildDayOffMap, findStreaks, withPto } from '../../../core/holidays'
import { fitLabel, labelRuns, labelSegmentKeys, monthDays, monthSegments } from '../layout'

const REF = { referenceDate: '2026-09-01' }

describe('month layout', () => {
  it('September 2026 starts on Tuesday, 30 days over 5 weeks', () => {
    const days = monthDays(2026, 9)
    expect(days[0]).toEqual({ date: '2026-09-01', day: 1, row: 2, col: 3 })
    expect(days.at(-1)).toEqual({ date: '2026-09-30', day: 30, row: 10, col: 4 })
  })
  it('segments split a streak across week rows and mark PTO slots', () => {
    const map = withPto(buildDayOffMap(2026, { weekend: 'sat-sun', customRanges: [] }, REF), ['2026-09-24', '2026-09-25'])
    const streaks = findStreaks(map)
    const segs = monthSegments(2026, 9, streaks, map).filter((s) => s.streak.start === '2026-09-19')
    // Sat 9/19 | Sun 9/20 – Sat 9/26 | Sun 9/27
    expect(segs).toHaveLength(3)
    expect(segs[0]).toMatchObject({ row: 7, colStart: 7, colEnd: 8, isStart: true, isEnd: false })
    expect(segs[1]).toMatchObject({ row: 9, colStart: 1, colEnd: 8, isStart: false, isEnd: false })
    expect(segs[2]).toMatchObject({ row: 11, colStart: 1, colEnd: 2, isStart: false, isEnd: true })
    expect(segs[1].days.map((d) => d.pto)).toEqual([false, false, false, false, true, true, false])
    expect(labelSegmentKeys(2026, streaks, map).get(segs[1].streak)).toBe(segs[1].key)
  })
  it('New Year streak from the previous year is clipped to January', () => {
    const map = buildDayOffMap(2026, { weekend: 'sat-sun', customRanges: [{ from: '12-29', to: '01-03', label: '年末年始' }] }, REF)
    const segs = monthSegments(2026, 1, findStreaks(map), map)
    expect(segs[0]).toMatchObject({ colStart: 5, colEnd: 8, isStart: false, isEnd: false }) // Thu 1/1 – Sat 1/3
    expect(segs[1]).toMatchObject({ colStart: 1, colEnd: 2, isEnd: true }) // Sun 1/4
  })
})

describe('labels', () => {
  it('labelRuns returns the longest non-PTO and PTO runs', () => {
    expect(labelRuns([{ pto: false }, { pto: false }, { pto: true }, { pto: true }, { pto: true }])).toEqual({ main: [0, 2], pto: [2, 3] })
    expect(labelRuns([{ pto: true }, { pto: true }])).toEqual({ main: [0, 0], pto: [0, 2] })
  })
  it('fitLabel picks the longest that fits', () => {
    expect(fitLabel(['シルバーウィーク 5連休', '5連休'], 200)).toBe('シルバーウィーク 5連休')
    expect(fitLabel(['シルバーウィーク 5連休', '5連休'], 100)).toBe('5連休')
    expect(fitLabel(['5連休'], 20)).toBe('')
  })
})
