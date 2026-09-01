import { describe, expect, it } from 'vitest'
import { addDays, dayOfYear, diffDays, isValidISO, nthWeekdayOfMonth, todayISO, weekday } from '../date'

describe('date utils', () => {
  it('weekday', () => {
    expect(weekday('2026-01-01')).toBe(4) // Thu
    expect(weekday('2026-05-03')).toBe(0) // Sun
    expect(weekday('2024-02-29')).toBe(4) // Thu
  })
  it('addDays across leap day and year end', () => {
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29')
    expect(addDays('2023-02-28', 1)).toBe('2023-03-01')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2027-01-01', -1)).toBe('2026-12-31')
  })
  it('diffDays / dayOfYear', () => {
    expect(diffDays('2026-01-01', '2026-12-31')).toBe(364)
    expect(dayOfYear('2026-09-21')).toBe(264)
  })
  it('nthWeekdayOfMonth', () => {
    expect(nthWeekdayOfMonth(2026, 1, 1, 2)).toBe(12) // 2nd Monday Jan 2026
    expect(nthWeekdayOfMonth(2026, 7, 1, 3)).toBe(20) // 3rd Monday Jul 2026
    expect(nthWeekdayOfMonth(2026, 10, 1, 2)).toBe(12)
  })
  it('isValidISO', () => {
    expect(isValidISO('2026-02-29')).toBe(false)
    expect(isValidISO('2024-02-29')).toBe(true)
    expect(isValidISO('2026-13-01')).toBe(false)
    expect(isValidISO('2026-9-1')).toBe(false)
  })
  it('todayISO uses the given time zone', () => {
    // 2026-09-01T20:00:00Z is already Sept 2 in Tokyo
    expect(todayISO('Asia/Tokyo', new Date('2026-09-01T20:00:00Z'))).toBe('2026-09-02')
    expect(todayISO('UTC', new Date('2026-09-01T20:00:00Z'))).toBe('2026-09-01')
  })
})
