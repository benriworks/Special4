import { describe, expect, it } from 'vitest'
import { ageOn, eto, etoAnimal } from '../age'
import { fromWareki, maxEraYear, toWareki, verifyWithIntl, ERAS } from '../era'
import { formatJa, formatRangeShort, relativeDaysJa } from '../format'

describe('toWareki', () => {
  it('era boundaries', () => {
    expect(toWareki('2026-09-01')).toMatchObject({ year: 8, text: '令和8年9月1日', short: 'R8.9.1' })
    expect(toWareki('2019-05-01')?.text).toBe('令和元年5月1日')
    expect(toWareki('2019-04-30')?.text).toBe('平成31年4月30日')
    expect(toWareki('1989-01-08')?.text).toBe('平成元年1月8日')
    expect(toWareki('1989-01-07')?.text).toBe('昭和64年1月7日')
    expect(toWareki('1926-12-25')?.text).toBe('昭和元年12月25日')
    expect(toWareki('1926-12-24')?.text).toBe('大正15年12月24日')
    expect(toWareki('1912-07-30')?.text).toBe('大正元年7月30日')
    expect(toWareki('1873-01-01')?.text).toBe('明治6年1月1日')
  })
  it('refuses pre-Gregorian dates', () => {
    expect(toWareki('1872-12-31')).toBeNull()
  })
  it('agrees with Intl japanese calendar', () => {
    for (const d of ['2026-09-01', '2019-05-01', '2019-04-30', '1989-01-08', '1989-01-07', '1950-06-15', '1920-03-03']) {
      expect(verifyWithIntl(d), d).toBe(true)
    }
  })
})

describe('fromWareki', () => {
  it('round trips', () => {
    expect(fromWareki('令和', 8, 9, 1)).toEqual({ iso: '2026-09-01' })
    expect(fromWareki('昭和', 64, 1, 7)).toEqual({ iso: '1989-01-07' })
    expect(fromWareki('平成', 1, 1, 8)).toEqual({ iso: '1989-01-08' })
  })
  it('rejects out-of-era and invalid dates with a reason', () => {
    expect(fromWareki('昭和', 64, 1, 8)).toEqual({ error: 'range' })
    expect(fromWareki('平成', 31, 5, 1)).toEqual({ error: 'range' })
    expect(fromWareki('平成', 32, 1, 1)).toEqual({ error: 'year' })
    expect(fromWareki('令和', 0, 1, 1)).toEqual({ error: 'year' })
    expect(fromWareki('令和', 8, 2, 30)).toEqual({ error: 'date' })
    expect(fromWareki('明治', 5, 1, 1)).toEqual({ error: 'range' })
    expect(fromWareki('慶応', 1, 1, 1)).toEqual({ error: 'era' })
  })
  it('maxEraYear', () => {
    expect(maxEraYear(ERAS[2])).toBe(64)
    expect(maxEraYear(ERAS[3])).toBe(31)
    expect(maxEraYear(ERAS[1])).toBe(15)
  })
})

describe('age & eto', () => {
  it('full / kazoe age', () => {
    expect(ageOn('1990-09-01', '2026-09-01')).toMatchObject({ full: 36, kazoe: 37, isBirthday: true, daysToNextBirthday: 0 })
    expect(ageOn('1990-09-02', '2026-09-01')).toMatchObject({ full: 35, kazoe: 37, daysToNextBirthday: 1, nextBirthday: '2026-09-02' })
    expect(ageOn('1990-08-31', '2026-09-01')).toMatchObject({ full: 36, nextBirthday: '2027-08-31' })
    expect(ageOn('2027-01-01', '2026-09-01')).toBeNull()
  })
  it('Feb 29 birthdays age up on Mar 1 in common years', () => {
    expect(ageOn('2000-02-29', '2026-02-28')?.full).toBe(25)
    expect(ageOn('2000-02-29', '2026-03-01')?.full).toBe(26)
    expect(ageOn('2000-02-29', '2028-02-29')?.full).toBe(28)
  })
  it('eto', () => {
    expect(eto(2026)).toBe('丙午')
    expect(eto(2024)).toBe('甲辰')
    expect(etoAnimal(2020)).toBe('子')
    expect(etoAnimal(1990)).toBe('午')
  })
})

describe('format', () => {
  it('formats', () => {
    expect(formatJa('2026-09-19')).toBe('2026年9月19日(土)')
    expect(formatJa('2026-09-19', { year: false })).toBe('9月19日(土)')
    expect(formatRangeShort('2026-09-19', '2026-09-23')).toBe('9/19(土)〜9/23(水)')
    expect(relativeDaysJa(0)).toBe('今日')
    expect(relativeDaysJa(18)).toBe('あと18日')
    expect(relativeDaysJa(-3)).toBe('3日前')
  })
})
