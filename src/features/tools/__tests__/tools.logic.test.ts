import { describe, expect, it } from 'vitest'
import { PRESET_RANGES } from '../../../core/holidays'
import { ageOn, formatJa } from '../../../core/jpdate'
import {
  BIZ_COUNT_MAX,
  DIRECTION_OPTIONS,
  MSG_BIRTH_FUTURE,
  MSG_BIZ_COUNT,
  MSG_BIZ_YEAR_RANGE,
  MSG_DATE_INVALID,
  MSG_DATE_REQUIRED,
  MSG_RANGE_ORDER,
  MSG_WAREKI_MAX,
  MSG_WAREKI_MEIJI,
  MSG_WAREKI_MIN,
  RANGE_LABEL_MAX,
  WEEKEND_OPTIONS,
  ageCopyText,
  betweenCopyText,
  birthDateError,
  bizDateError,
  businessDayLabel,
  calendarDaysText,
  calendarOffsetText,
  dateWithWareki,
  etoText,
  formatMonthDay,
  formatRange,
  hasRange,
  holidayRangeNote,
  isWrapping,
  monthDayExists,
  nextBirthdayText,
  parseBusinessDayCount,
  parseEraYear,
  parseMonthDay,
  rangeOrderError,
  rangeTitle,
  sameRange,
  seirekiDateError,
  toMonthDay,
  validateRangeForm,
  warekiErrorMessage,
  warekiWithWeekday,
} from '../logic'

const TODAY = '2026-09-01'

describe('option constants', () => {
  it('weekend / direction labels', () => {
    expect(WEEKEND_OPTIONS.map((o) => `${o.value}:${o.label}`)).toEqual(['sat-sun:土日', 'sun:日曜のみ', 'none:なし'])
    expect(DIRECTION_OPTIONS.map((o) => o.label)).toEqual(['後', '前'])
  })
})

describe('MM-DD helpers', () => {
  it('builds zero-padded MM-DD', () => {
    expect(toMonthDay(12, 29)).toBe('12-29')
    expect(toMonthDay(1, 3)).toBe('01-03')
  })
  it('parses leniently', () => {
    expect(parseMonthDay('01-03')).toEqual({ month: 1, day: 3 })
    expect(parseMonthDay('12-29')).toEqual({ month: 12, day: 29 })
    expect(parseMonthDay('2026-01-03')).toBeNull()
    expect(parseMonthDay('')).toBeNull()
  })
  it('checks day existence (Feb 29 allowed)', () => {
    expect(monthDayExists(2, 29)).toBe(true)
    expect(monthDayExists(2, 30)).toBe(false)
    expect(monthDayExists(4, 31)).toBe(false)
    expect(monthDayExists(12, 31)).toBe(true)
    expect(monthDayExists(13, 1)).toBe(false)
    expect(monthDayExists(0, 1)).toBe(false)
    expect(monthDayExists(1, 0)).toBe(false)
    expect(monthDayExists(1.5, 1)).toBe(false)
  })
  it('formats for display', () => {
    expect(formatMonthDay('12-29')).toBe('12/29')
    expect(formatMonthDay('01-03')).toBe('1/3')
    expect(formatMonthDay('oops')).toBe('oops')
    expect(formatRange(PRESET_RANGES.nenmatsu)).toBe('12/29〜1/3')
    expect(rangeTitle(PRESET_RANGES.nenmatsu)).toBe('年末年始（12/29〜1/3）')
    expect(rangeTitle(PRESET_RANGES.obon)).toBe('お盆（8/13〜8/16）')
  })
  it('range equality ignores the label', () => {
    expect(sameRange(PRESET_RANGES.obon, { from: '08-13', to: '08-16', label: '夏休み' })).toBe(true)
    expect(sameRange(PRESET_RANGES.obon, { from: '08-13', to: '08-17', label: 'お盆' })).toBe(false)
    expect(hasRange([PRESET_RANGES.nenmatsu], PRESET_RANGES.nenmatsu)).toBe(true)
    expect(hasRange([PRESET_RANGES.nenmatsu], PRESET_RANGES.obon)).toBe(false)
    expect(hasRange([], PRESET_RANGES.obon)).toBe(false)
  })
  it('detects year-end wrap', () => {
    expect(isWrapping('12-29', '01-03')).toBe(true)
    expect(isWrapping('08-13', '08-16')).toBe(false)
    expect(isWrapping('08-13', '08-13')).toBe(false)
  })
})

describe('validateRangeForm', () => {
  const base = { label: 'お盆', fromMonth: 8, fromDay: 13, toMonth: 8, toDay: 16, existing: [] }
  it('accepts a valid form and trims the label', () => {
    expect(validateRangeForm({ ...base, label: '  お盆 ' })).toEqual({ ok: true, range: { from: '08-13', to: '08-16', label: 'お盆' } })
  })
  it('accepts wrapping ranges and Feb 29', () => {
    expect(validateRangeForm({ ...base, fromMonth: 12, fromDay: 29, toMonth: 1, toDay: 3 })).toMatchObject({ ok: true, range: { from: '12-29', to: '01-03' } })
    expect(validateRangeForm({ ...base, fromMonth: 2, fromDay: 29, toMonth: 2, toDay: 29 })).toMatchObject({ ok: true })
  })
  it('rejects an empty or too-long label', () => {
    expect(validateRangeForm({ ...base, label: '   ' })).toEqual({ ok: false, field: 'label', message: '名前を入れてください。' })
    expect(validateRangeForm({ ...base, label: 'あ'.repeat(RANGE_LABEL_MAX) })).toMatchObject({ ok: true })
    expect(validateRangeForm({ ...base, label: 'あ'.repeat(RANGE_LABEL_MAX + 1) })).toMatchObject({ ok: false, field: 'label' })
  })
  it('rejects days that do not exist in the month', () => {
    expect(validateRangeForm({ ...base, fromMonth: 2, fromDay: 30 })).toEqual({ ok: false, field: 'from', message: '2月に30日はありません。' })
    expect(validateRangeForm({ ...base, toMonth: 4, toDay: 31 })).toEqual({ ok: false, field: 'to', message: '4月に31日はありません。' })
  })
  it('rejects a duplicate period regardless of label', () => {
    expect(validateRangeForm({ ...base, label: '夏季休業', existing: [PRESET_RANGES.obon] })).toEqual({
      ok: false,
      field: 'range',
      message: '同じ期間の休業日がすでにあります。',
    })
  })
})

describe('wareki helpers', () => {
  it('maps fromWareki error codes to messages', () => {
    expect(warekiErrorMessage('year', '令和')).toBe('令和は1年から81年まで入力できます。')
    expect(warekiErrorMessage('year', '昭和')).toBe('昭和は1年から64年まで入力できます。')
    expect(warekiErrorMessage('year', '平成')).toBe('平成は1年から31年まで入力できます。')
    expect(warekiErrorMessage('date', '令和')).toBe('その月にその日は存在しません。')
    expect(warekiErrorMessage('range', '昭和')).toBe('昭和にその日付はありません。')
    expect(warekiErrorMessage('era', '慶応')).toBe('元号を選んでください。')
  })
  it('range errors name the era boundary when the entered date is known (DESIGN_SPEC §10 examples)', () => {
    expect(warekiErrorMessage('range', '令和', { year: 1, month: 4, day: 30 })).toBe('令和は1年（2019年5月1日）から入力できます。')
    expect(warekiErrorMessage('range', '平成', { year: 1, month: 1, day: 7 })).toBe('平成は1年（1989年1月8日）から入力できます。')
    expect(warekiErrorMessage('range', '昭和', { year: 64, month: 1, day: 8 })).toBe('昭和は64年1月7日（1989年1月7日）までです。')
    expect(warekiErrorMessage('range', '明治', { year: 45, month: 8, day: 1 })).toBe('明治は45年7月29日（1912年7月29日）までです。')
    expect(warekiErrorMessage('range', '明治', { year: 5, month: 12, day: 31 })).toBe(MSG_WAREKI_MEIJI)
    expect(MSG_WAREKI_MEIJI).toBe('明治は6年（1873年）以降の日付のみ変換できます。')
    // unknown era / nonsense input falls back to the generic message
    expect(warekiErrorMessage('range', '慶応', { year: 1, month: 1, day: 1 })).toBe('慶応にその日付はありません。')
    expect(warekiErrorMessage('range', '令和', { year: 0, month: 13, day: 40 })).toBe('令和にその日付はありません。')
  })
  it('parses the era year input', () => {
    expect(parseEraYear('8')).toBe(8)
    expect(parseEraYear(' 12 ')).toBe(12)
    expect(parseEraYear('0')).toBeNull()
    expect(parseEraYear('')).toBeNull()
    expect(parseEraYear('1.5')).toBeNull()
    expect(parseEraYear('-3')).toBeNull()
  })
  it('validates the 西暦→和暦 date input', () => {
    expect(seirekiDateError('')).toBe(MSG_DATE_REQUIRED)
    expect(seirekiDateError('2026-02-30')).toBe(MSG_DATE_INVALID)
    expect(seirekiDateError('1872-12-31')).toBe(MSG_WAREKI_MIN)
    expect(MSG_WAREKI_MIN).toBe('明治6年（1873年）1月1日以降の日付のみ変換できます。')
    expect(seirekiDateError('1873-01-01')).toBeNull()
    expect(seirekiDateError('2099-12-31')).toBeNull()
    expect(seirekiDateError('2100-01-01')).toBe(MSG_WAREKI_MAX)
    expect(seirekiDateError(TODAY)).toBeNull()
  })
  it('wareki with weekday for copying', () => {
    expect(warekiWithWeekday('2026-09-01')).toBe('令和8年9月1日(火)')
    expect(warekiWithWeekday('2019-05-01')).toBe('令和元年5月1日(水)')
    expect(warekiWithWeekday('1800-01-01')).toBeNull()
  })
})

describe('business-day helpers', () => {
  it('parses the count (1–365 integers only)', () => {
    expect(parseBusinessDayCount('10')).toBe(10)
    expect(parseBusinessDayCount(' 7 ')).toBe(7)
    expect(parseBusinessDayCount(String(BIZ_COUNT_MAX))).toBe(365)
    expect(parseBusinessDayCount('366')).toBeNull()
    expect(parseBusinessDayCount('0')).toBeNull()
    expect(parseBusinessDayCount('-3')).toBeNull()
    expect(parseBusinessDayCount('1.5')).toBeNull()
    expect(parseBusinessDayCount('')).toBeNull()
    expect(MSG_BIZ_COUNT).toBe('営業日数は1から365までの整数で入れてください。')
  })
  it('labels', () => {
    expect(businessDayLabel(10, 'after')).toBe('10営業日後')
    expect(businessDayLabel(3, 'before')).toBe('3営業日前')
  })
  it('validates dates against the supported holiday years', () => {
    expect(bizDateError('')).toBe(MSG_DATE_REQUIRED)
    expect(bizDateError('abc')).toBe(MSG_DATE_INVALID)
    expect(bizDateError('2026-13-01')).toBe(MSG_DATE_INVALID)
    expect(bizDateError('1954-12-31')).toBe(MSG_BIZ_YEAR_RANGE)
    expect(bizDateError('2100-01-01')).toBe(MSG_BIZ_YEAR_RANGE)
    expect(bizDateError('1955-01-01')).toBeNull()
    expect(bizDateError(TODAY)).toBeNull()
  })
  it('notes when a computed date is outside the holiday data years', () => {
    expect(holidayRangeNote('2026-09-15')).toBeNull()
    expect(holidayRangeNote('2099-12-31')).toBeNull()
    expect(holidayRangeNote('2100-01-07')).toBe('2100年以降の祝日は計算に含まれていません。')
    expect(holidayRangeNote('1953-07-30')).toBe('1954年以前の祝日は計算に含まれていません。')
  })
  it('range order (same day allowed)', () => {
    expect(rangeOrderError('2026-09-01', '2026-08-31')).toBe(MSG_RANGE_ORDER)
    expect(MSG_RANGE_ORDER).toBe('終了日は開始日より後の日付にしてください。')
    expect(rangeOrderError('2026-09-01', '2026-09-01')).toBeNull()
    expect(rangeOrderError('2026-09-01', '2026-10-01')).toBeNull()
  })
  it('calendar texts', () => {
    expect(calendarDaysText(31, 4)).toBe('31日（約4週）')
    expect(calendarDaysText(5, 0)).toBe('5日')
    expect(calendarOffsetText(14)).toBe('暦日で14日後')
    expect(calendarOffsetText(-3)).toBe('暦日で3日前')
    expect(calendarOffsetText(0)).toBe('基準日と同じ日')
  })
  it('copy texts', () => {
    expect(dateWithWareki('2026-09-15')).toBe('2026年9月15日(火)（令和8年9月15日）')
    expect(dateWithWareki('1800-01-01')).toBe(formatJa('1800-01-01'))
    expect(betweenCopyText('2026-09-01', '2026-10-01', { business: 22, calendar: 31, off: 9, weeks: 4 })).toBe(
      '2026年9月1日(火)〜2026年10月1日(木)：営業日22日・暦日31日（約4週）・休み9日',
    )
  })
})

describe('age helpers', () => {
  it('validates the birth date (empty is the empty state, not an error)', () => {
    expect(birthDateError('', TODAY)).toBeNull()
    expect(birthDateError('bad', TODAY)).toBe(MSG_DATE_INVALID)
    expect(birthDateError('2026-09-02', TODAY)).toBe(MSG_BIRTH_FUTURE)
    expect(MSG_BIRTH_FUTURE).toBe('生年月日は今日以前の日付にしてください。')
    expect(birthDateError(TODAY, TODAY)).toBeNull()
    expect(birthDateError('1990-09-02', TODAY)).toBeNull()
  })
  it('eto text', () => {
    expect(etoText(2026)).toBe('午（うま）年')
    expect(etoText(1990)).toBe('午（うま）年')
    expect(etoText(2000)).toBe('辰（たつ）年')
  })
  it('next birthday text', () => {
    expect(nextBirthdayText({ isBirthday: true, nextBirthday: TODAY, daysToNextBirthday: 0 })).toBe('今日が誕生日')
    expect(nextBirthdayText({ isBirthday: false, nextBirthday: '2027-09-02', daysToNextBirthday: 366 })).toBe('2027年9月2日(木)（あと366日）')
    expect(nextBirthdayText({ isBirthday: false, nextBirthday: '2026-09-02', daysToNextBirthday: 1 })).toBe('2026年9月2日(水)（明日）')
  })
  it('age copy text', () => {
    const info = ageOn('1990-09-02', TODAY)
    expect(info).not.toBeNull()
    expect(ageCopyText('1990-09-02', info!)).toBe(`${dateWithWareki('1990-09-02')}生まれ・満35歳・数え年37歳・午（うま）年`)
  })
})
