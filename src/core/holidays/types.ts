/** 'YYYY-MM-DD' (always zero-padded). Lexical order == chronological order. */
export type ISODate = string

export type HolidayKind = 'holiday' | 'substitute' | 'citizens'

export interface Holiday {
  date: ISODate
  name: string
  kind: HolidayKind
  /** Equinox-based dates that have not yet been announced in the official gazette. */
  provisional: boolean
}

/** Which weekdays are regular days off. */
export type WeekendRule = 'sat-sun' | 'sun' | 'none'

/** A recurring (every year) range of company days off, expressed as 'MM-DD'. `from > to` wraps the year end. */
export interface CustomRange {
  from: string
  to: string
  label: string
}

export interface OffSettings {
  weekend: WeekendRule
  customRanges: CustomRange[]
}

export const FLAG_WEEKEND = 1
export const FLAG_HOLIDAY = 2
export const FLAG_CUSTOM = 4
export const FLAG_PTO = 8

/**
 * Day-off bitmap for one display year, with a margin of December of the previous
 * year and January of the next year so streaks across New Year keep their true length.
 */
export interface DayOffMap {
  year: number
  /** ISO date of flags[0] (December 1st of year - 1). */
  start: ISODate
  /** One byte per day, bit flags FLAG_*. */
  flags: Uint8Array
  /** Index of January 1st of `year` inside `flags`. */
  yearStartIndex: number
  /** Number of days in `year`. */
  yearLength: number
}

export interface Streak {
  start: ISODate
  end: ISODate
  /** Total length in days, including days outside the display year. */
  length: number
  /** Short name such as 'GW', '年末年始', 'シルバーウィーク', 'お盆'. Undefined for unnamed streaks. */
  name?: string
  /** Suggested paid-leave days inside this streak. */
  ptoDays: ISODate[]
  /** True when the streak would not exist (or would be shorter) without PTO days. */
  boosted: boolean
}
