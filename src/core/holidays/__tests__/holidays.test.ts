import { describe, expect, it } from 'vitest'
import { holidayOn, holidaysOfYear } from '../holidays'
import { OFFICIAL } from './fixtures/official-2015-2026'

const REF = { referenceDate: '2026-09-01' }

describe('holidaysOfYear matches the official Cabinet Office list', () => {
  for (const [year, expected] of Object.entries(OFFICIAL)) {
    it(`${year}`, () => {
      const got = holidaysOfYear(Number(year), REF).map((h) => [h.date, h.name])
      expect(got).toEqual(expected)
    })
  }
})

describe('substitute holiday rules', () => {
  it('did not exist before 1973-04-12 (建国記念の日 1973 fell on Sunday)', () => {
    expect(holidayOn('1973-02-12', REF)).toBeUndefined()
  })
  it('first ever substitute holiday: 1973-04-30', () => {
    expect(holidayOn('1973-04-30', REF)?.kind).toBe('substitute')
  })
  it('pre-2007: Sunday holiday followed by another holiday gets no substitute (1997)', () => {
    // 1997-05-04 Sun (not a holiday then), 1997-05-05 Mon こどもの日
    expect(holidayOn('1997-05-04', REF)).toBeUndefined()
    expect(holidayOn('1997-05-06', REF)).toBeUndefined()
  })
  it('pre-2007: 1998-05-03 Sun → 1998-05-04 is 振替休日 (not 国民の休日)', () => {
    expect(holidayOn('1998-05-04', REF)?.kind).toBe('substitute')
  })
  it('2007+: chain rule moves the substitute past consecutive holidays (2009-05-06)', () => {
    expect(holidayOn('2009-05-06', REF)?.kind).toBe('substitute')
  })
})

describe('citizens holiday rules', () => {
  it('2004-05-04 is 国民の休日 (Tuesday between two holidays)', () => {
    expect(holidayOn('2004-05-04', REF)?.kind).toBe('citizens')
  })
  it('did not exist before 1985-12-27 (1984-05-04 Friday)', () => {
    expect(holidayOn('1984-05-04', REF)).toBeUndefined()
  })
  it('2019 enthronement created two citizens holidays (10連休)', () => {
    const gw = holidaysOfYear(2019, REF).filter((h) => h.date >= '2019-04-27' && h.date <= '2019-05-06')
    expect(gw.map((h) => h.date)).toEqual(['2019-04-29', '2019-04-30', '2019-05-01', '2019-05-02', '2019-05-03', '2019-05-04', '2019-05-05', '2019-05-06'])
  })
})

describe('equinox handling', () => {
  it('2027 dates (gazetted Feb 2026) are official', () => {
    const h = holidaysOfYear(2027, REF)
    expect(h.find((x) => x.name === '春分の日')).toMatchObject({ date: '2027-03-21', provisional: false })
    expect(h.find((x) => x.name === '秋分の日')).toMatchObject({ date: '2027-09-23', provisional: false })
  })
  it('2028 dates are provisional relative to 2026-09-01', () => {
    const h = holidaysOfYear(2028, REF)
    expect(h.find((x) => x.name === '春分の日')?.provisional).toBe(true)
    expect(h.find((x) => x.name === '元日')?.provisional).toBe(false)
  })
  it('next year is provisional before February', () => {
    const h = holidaysOfYear(2027, { referenceDate: '2026-01-15' })
    expect(h.find((x) => x.name === '春分の日')?.provisional).toBe(true)
  })
  it('1970s use the older constants (1976-03-20, 1979-03-21)', () => {
    expect(holidaysOfYear(1976, REF).find((x) => x.name === '春分の日')?.date).toBe('1976-03-20')
    expect(holidaysOfYear(1979, REF).find((x) => x.name === '春分の日')?.date).toBe('1979-03-21')
  })
})

describe('guards', () => {
  it('rejects unsupported years', () => {
    expect(() => holidaysOfYear(1900, REF)).toThrow(RangeError)
    expect(() => holidaysOfYear(2100, REF)).toThrow(RangeError)
  })
})
