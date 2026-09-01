/**
 * Pure helpers for the ツール panel. No React / DOM here so everything can be
 * unit-tested in node (see __tests__/tools.logic.test.ts).
 */
import {
  SUPPORTED_YEAR_MAX,
  SUPPORTED_YEAR_MIN,
  daysInMonth,
  isValidISO,
  isoOf,
  parseISO,
  type CustomRange,
  type ISODate,
  type WeekendRule,
} from '../../core/holidays'
import {
  ERAS,
  WAREKI_MAX,
  WAREKI_MIN,
  etoAnimal,
  etoAnimalReading,
  formatJa,
  maxEraYear,
  relativeDaysJa,
  toWareki,
  weekdayJa,
  type AgeInfo,
  type WarekiError,
} from '../../core/jpdate'

/* ------------------------------------------------------------------ */
/* Shared messages                                                     */
/* ------------------------------------------------------------------ */

export const MSG_DATE_REQUIRED = '日付を入れてください。'
export const MSG_DATE_INVALID = '正しい日付を入れてください。'

/* ------------------------------------------------------------------ */
/* 週休                                                                */
/* ------------------------------------------------------------------ */

export const WEEKEND_OPTIONS: { value: WeekendRule; label: string }[] = [
  { value: 'sat-sun', label: '土日' },
  { value: 'sun', label: '日曜のみ' },
  { value: 'none', label: 'なし' },
]

/* ------------------------------------------------------------------ */
/* MM-DD helpers (custom ranges)                                       */
/* ------------------------------------------------------------------ */

const pad2 = (n: number) => (n < 10 ? `0${n}` : String(n))

/** 'MM-DD' from month / day numbers (no validation). */
export function toMonthDay(month: number, day: number): string {
  return `${pad2(month)}-${pad2(day)}`
}

/** Lenient parse of 'MM-DD' (no existence check). */
export function parseMonthDay(md: string): { month: number; day: number } | null {
  const m = /^(\d{1,2})-(\d{1,2})$/.exec(md)
  if (!m) return null
  return { month: Number(m[1]), day: Number(m[2]) }
}

/** Does the day exist in that month in some year? Feb 29 counts (2000 is a leap year). */
export function monthDayExists(month: number, day: number): boolean {
  if (!Number.isInteger(month) || !Number.isInteger(day) || month < 1 || month > 12 || day < 1) return false
  return day <= daysInMonth(2000, month)
}

/** '12-29' → '12/29' */
export function formatMonthDay(md: string): string {
  const p = parseMonthDay(md)
  return p ? `${p.month}/${p.day}` : md
}

/** '12/29〜1/3' */
export function formatRange(r: Pick<CustomRange, 'from' | 'to'>): string {
  return `${formatMonthDay(r.from)}〜${formatMonthDay(r.to)}`
}

/** '年末年始（12/29〜1/3）' */
export function rangeTitle(r: CustomRange): string {
  return `${r.label}（${formatRange(r)}）`
}

/** Same period (label ignored). */
export function sameRange(a: CustomRange, b: CustomRange): boolean {
  return a.from === b.from && a.to === b.to
}

export function hasRange(list: readonly CustomRange[], r: CustomRange): boolean {
  return list.some((x) => sameRange(x, r))
}

/** from > to means the range wraps over the year end (12/29〜1/3). */
export function isWrapping(from: string, to: string): boolean {
  return from > to
}

export const RANGE_LABEL_MAX = 12
export const DEFAULT_RANGE_LABEL = '休業日'
export const MSG_RANGE_WRAP_HINT = '終了が開始より前の場合は年をまたぐ期間になります。'

export interface RangeFormInput {
  label: string
  fromMonth: number
  fromDay: number
  toMonth: number
  toDay: number
  existing: readonly CustomRange[]
}
export type RangeFormField = 'label' | 'from' | 'to' | 'range'
export type RangeFormResult = { ok: true; range: CustomRange } | { ok: false; field: RangeFormField; message: string }

export function validateRangeForm(input: RangeFormInput): RangeFormResult {
  const label = input.label.trim()
  if (!label) return { ok: false, field: 'label', message: '名前を入れてください。' }
  if ([...label].length > RANGE_LABEL_MAX) {
    return { ok: false, field: 'label', message: `名前は${RANGE_LABEL_MAX}文字までにしてください。` }
  }
  if (!monthDayExists(input.fromMonth, input.fromDay)) {
    return { ok: false, field: 'from', message: `${input.fromMonth}月に${input.fromDay}日はありません。` }
  }
  if (!monthDayExists(input.toMonth, input.toDay)) {
    return { ok: false, field: 'to', message: `${input.toMonth}月に${input.toDay}日はありません。` }
  }
  const range: CustomRange = { from: toMonthDay(input.fromMonth, input.fromDay), to: toMonthDay(input.toMonth, input.toDay), label }
  if (hasRange(input.existing, range)) return { ok: false, field: 'range', message: '同じ期間の休業日がすでにあります。' }
  return { ok: true, range }
}

/* ------------------------------------------------------------------ */
/* 和暦                                                                */
/* ------------------------------------------------------------------ */

export const MSG_WAREKI_MIN = '明治6年（1873年）1月1日以降の日付のみ変換できます。'
/** 和暦→西暦 with an era year that falls before the Gregorian adoption (DESIGN_SPEC §10 example). */
export const MSG_WAREKI_MEIJI = '明治は6年（1873年1月1日）から入力できます。'
export const MSG_WAREKI_MAX = `${parseISO(WAREKI_MAX).y}年12月31日までの日付のみ変換できます。`

/** Error for the 西暦→和暦 date input, or null when convertible. */
export function seirekiDateError(value: string): string | null {
  if (!value) return MSG_DATE_REQUIRED
  if (!isValidISO(value)) return MSG_DATE_INVALID
  if (value < WAREKI_MIN) return MSG_WAREKI_MIN
  if (value > WAREKI_MAX) return MSG_WAREKI_MAX
  return null
}

/**
 * Map fromWareki() error codes to user-facing messages.
 * Pass the entered era year / month / day so a 'range' error can say precisely
 * where the era starts or ends (e.g. 「令和は1年（2019年5月1日）から入力できます。」).
 */
export function warekiErrorMessage(code: WarekiError, eraName: string, date?: { year: number; month: number; day: number }): string {
  switch (code) {
    case 'era':
      return '元号を選んでください。'
    case 'year': {
      const era = ERAS.find((e) => e.name === eraName)
      const max = era ? maxEraYear(era) : 1
      const min = era?.name === '明治' ? 6 : 1
      return `${eraName}は${min}年から${max}年まで入力できます。`
    }
    case 'date':
      return date ? `${date.month}月に${date.day}日はありません。` : 'その月にその日はありません。'
    case 'range': {
      const era = ERAS.find((e) => e.name === eraName)
      if (era && date && Number.isInteger(date.year) && date.year >= 1 && monthDayExists(date.month, date.day)) {
        const y = Number(era.start.slice(0, 4)) + date.year - 1
        const iso = isoOf(y, date.month, Math.min(date.day, daysInMonth(y, date.month)))
        if (iso < WAREKI_MIN) return MSG_WAREKI_MEIJI
        if (iso < era.start) return `${eraName}は1年（${formatJa(era.start, { weekday: false })}）から入力できます。`
        const end = era.end ? toWareki(era.end) : null
        if (era.end && end && iso > era.end) {
          return `${eraName}は${end.year}年${end.month}月${end.day}日（${formatJa(era.end, { weekday: false })}）までです。`
        }
      }
      return `${eraName}にその日付はありません。`
    }
  }
}

/** Era year typed by the user: positive integer or null. */
export function parseEraYear(raw: string): number | null {
  const s = raw.trim()
  if (!/^\d+$/.test(s)) return null
  const n = Number(s)
  return n >= 1 ? n : null
}

/** 令和8年9月1日(火) — wareki text plus weekday, for copying. */
export function warekiWithWeekday(iso: ISODate): string | null {
  const w = toWareki(iso)
  if (!w) return null
  return `${w.text}(${weekdayJa(iso)})`
}

/* ------------------------------------------------------------------ */
/* 営業日                                                              */
/* ------------------------------------------------------------------ */

export type Direction = 'after' | 'before'
export const DIRECTION_OPTIONS: { value: Direction; label: string }[] = [
  { value: 'after', label: '後' },
  { value: 'before', label: '前' },
]

export const BIZ_COUNT_MIN = 1
export const BIZ_COUNT_MAX = 365
export const BIZ_COUNT_DEFAULT = 10
export const MSG_BIZ_COUNT = `営業日数は${BIZ_COUNT_MIN}から${BIZ_COUNT_MAX}までの整数で入れてください。`
export const MSG_RANGE_ORDER = '終了日は開始日より後の日付にしてください。'
export const MSG_BIZ_YEAR_RANGE = `${SUPPORTED_YEAR_MIN}年から${SUPPORTED_YEAR_MAX}年までの日付を入れてください。`

/** Business-day count typed by the user: integer in [1, 365] or null. */
export function parseBusinessDayCount(raw: string): number | null {
  const s = raw.trim()
  if (!/^\d+$/.test(s)) return null
  const n = Number(s)
  return n >= BIZ_COUNT_MIN && n <= BIZ_COUNT_MAX ? n : null
}

/** '10営業日後' / '3営業日前' */
export function businessDayLabel(n: number, dir: Direction): string {
  return `${n}営業日${dir === 'after' ? '後' : '前'}`
}

/** Note for a computed date outside the years that have holiday data (holidays are then not counted). */
export function holidayRangeNote(iso: ISODate): string | null {
  const { y } = parseISO(iso)
  if (y > SUPPORTED_YEAR_MAX) return `${SUPPORTED_YEAR_MAX + 1}年以降の祝日は計算に含まれていません。`
  if (y < SUPPORTED_YEAR_MIN) return `${SUPPORTED_YEAR_MIN - 1}年以前の祝日は計算に含まれていません。`
  return null
}

/** Error for a date used in business-day math (must fall inside the supported holiday years). */
export function bizDateError(value: string): string | null {
  if (!value) return MSG_DATE_REQUIRED
  if (!isValidISO(value)) return MSG_DATE_INVALID
  const { y } = parseISO(value)
  if (y < SUPPORTED_YEAR_MIN || y > SUPPORTED_YEAR_MAX) return MSG_BIZ_YEAR_RANGE
  return null
}

/** to must not be before from (same day is allowed: a one-day range). */
export function rangeOrderError(from: ISODate, to: ISODate): string | null {
  return to < from ? MSG_RANGE_ORDER : null
}

/** '31日（約4週）' / '5日' */
export function calendarDaysText(calendar: number, weeks: number): string {
  return weeks >= 1 ? `${calendar}日（約${weeks}週）` : `${calendar}日`
}

/** '暦日で14日後' / '暦日で3日前' / '基準日と同じ日' */
export function calendarOffsetText(days: number): string {
  if (days === 0) return '基準日と同じ日'
  return days > 0 ? `暦日で${days}日後` : `暦日で${-days}日前`
}

/** '2026年9月15日(火)（令和8年9月15日）' — falls back to the western date alone outside the wareki range. */
export function dateWithWareki(iso: ISODate): string {
  const w = toWareki(iso)
  return w ? `${formatJa(iso)}（${w.text}）` : formatJa(iso)
}

/** Copy text for the between-two-dates tool. */
export function betweenCopyText(from: ISODate, to: ISODate, c: { business: number; calendar: number; off: number; weeks: number }): string {
  return `${formatJa(from)}〜${formatJa(to)}：営業日${c.business}日・暦日${calendarDaysText(c.calendar, c.weeks)}・休み${c.off}日`
}

/* ------------------------------------------------------------------ */
/* 年齢                                                                */
/* ------------------------------------------------------------------ */

export const MSG_BIRTH_FUTURE = '生年月日は今日以前の日付にしてください。'
export const MSG_AGE_EMPTY = '生年月日を入れると、満年齢・数え年・干支が出ます。'

/** Error for the birth-date input. Empty → null (empty state, not an error). */
export function birthDateError(birth: string, today: ISODate): string | null {
  if (!birth) return null
  if (!isValidISO(birth)) return MSG_DATE_INVALID
  if (birth > today) return MSG_BIRTH_FUTURE
  return null
}

/** '午（うま）年' */
export function etoText(year: number): string {
  return `${etoAnimal(year)}（${etoAnimalReading(year)}）年`
}

/** '2027年9月2日(木)（あと366日）' / '今日が誕生日' */
export function nextBirthdayText(info: Pick<AgeInfo, 'isBirthday' | 'nextBirthday' | 'daysToNextBirthday'>): string {
  if (info.isBirthday) return '今日が誕生日'
  return `${formatJa(info.nextBirthday)}（${relativeDaysJa(info.daysToNextBirthday)}）`
}

/** Copy text for the age tool. */
export function ageCopyText(birth: ISODate, info: Pick<AgeInfo, 'full' | 'kazoe'>): string {
  const by = parseISO(birth).y
  return `${dateWithWareki(birth)}生まれ・満${info.full}歳・数え年${info.kazoe}歳・${etoText(by)}`
}
