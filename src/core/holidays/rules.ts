/**
 * Declarative rules of 国民の祝日に関する法律 (Act on National Holidays), 1948– .
 * Each rule is valid for the inclusive year range [from, to].
 */
export type DayRule =
  | { kind: 'fixed'; month: number; day: number }
  | { kind: 'monday'; month: number; nth: number }
  | { kind: 'equinox'; which: 'spring' | 'autumn' }

export interface HolidayRule {
  name: string
  rule: DayRule
  from: number
  to?: number
}

const fixed = (month: number, day: number): DayRule => ({ kind: 'fixed', month, day })
const monday = (month: number, nth: number): DayRule => ({ kind: 'monday', month, nth })

export const HOLIDAY_RULES: HolidayRule[] = [
  { name: '元日', rule: fixed(1, 1), from: 1949 },
  { name: '成人の日', rule: fixed(1, 15), from: 1949, to: 1999 },
  { name: '成人の日', rule: monday(1, 2), from: 2000 },
  { name: '建国記念の日', rule: fixed(2, 11), from: 1967 },
  { name: '天皇誕生日', rule: fixed(4, 29), from: 1949, to: 1988 },
  { name: '天皇誕生日', rule: fixed(12, 23), from: 1989, to: 2018 },
  { name: '天皇誕生日', rule: fixed(2, 23), from: 2020 },
  { name: '春分の日', rule: { kind: 'equinox', which: 'spring' }, from: 1949 },
  { name: '昭和の日', rule: fixed(4, 29), from: 2007 },
  { name: 'みどりの日', rule: fixed(4, 29), from: 1989, to: 2006 },
  { name: 'みどりの日', rule: fixed(5, 4), from: 2007 },
  { name: '憲法記念日', rule: fixed(5, 3), from: 1949 },
  { name: 'こどもの日', rule: fixed(5, 5), from: 1949 },
  { name: '海の日', rule: fixed(7, 20), from: 1996, to: 2002 },
  { name: '海の日', rule: monday(7, 3), from: 2003 },
  { name: '山の日', rule: fixed(8, 11), from: 2016 },
  { name: '敬老の日', rule: fixed(9, 15), from: 1966, to: 2002 },
  { name: '敬老の日', rule: monday(9, 3), from: 2003 },
  { name: '秋分の日', rule: { kind: 'equinox', which: 'autumn' }, from: 1948 },
  { name: '体育の日', rule: fixed(10, 10), from: 1966, to: 1999 },
  { name: '体育の日', rule: monday(10, 2), from: 2000, to: 2019 },
  { name: 'スポーツの日', rule: monday(10, 2), from: 2020 },
  { name: '文化の日', rule: fixed(11, 3), from: 1948 },
  { name: '勤労感謝の日', rule: fixed(11, 23), from: 1948 },
]

/** Year-specific exceptions: one-off holidays and the 2020/2021 Olympic relocations. */
export interface YearOverride {
  year: number
  /** Names of rule-generated holidays to drop for this year. */
  remove?: string[]
  /** Extra holidays for this year ('MM-DD'). */
  add?: { date: string; name: string }[]
}

export const YEAR_OVERRIDES: YearOverride[] = [
  { year: 1959, add: [{ date: '04-10', name: '皇太子明仁親王の結婚の儀' }] },
  { year: 1989, add: [{ date: '02-24', name: '昭和天皇の大喪の礼' }] },
  { year: 1990, add: [{ date: '11-12', name: '即位礼正殿の儀' }] },
  { year: 1993, add: [{ date: '06-09', name: '皇太子徳仁親王の結婚の儀' }] },
  {
    year: 2019,
    add: [
      { date: '05-01', name: '天皇の即位の日' },
      { date: '10-22', name: '即位礼正殿の儀' },
    ],
  },
  {
    year: 2020,
    remove: ['海の日', 'スポーツの日', '山の日'],
    add: [
      { date: '07-23', name: '海の日' },
      { date: '07-24', name: 'スポーツの日' },
      { date: '08-10', name: '山の日' },
    ],
  },
  {
    year: 2021,
    remove: ['海の日', 'スポーツの日', '山の日'],
    add: [
      { date: '07-22', name: '海の日' },
      { date: '07-23', name: 'スポーツの日' },
      { date: '08-08', name: '山の日' },
    ],
  },
]

/** 振替休日 (substitute holiday) exists for holidays on/after this date. */
export const SUBSTITUTE_SINCE = '1973-04-12'
/** From 2007 the substitute moves to the nearest following non-holiday (chain rule). */
export const SUBSTITUTE_CHAIN_FROM_YEAR = 2007
/** 国民の休日 (citizens' holiday, the "sandwich" rule) exists on/after this date. */
export const CITIZENS_SINCE = '1985-12-27'
/** From 2007 the sandwich rule no longer excludes Sundays. */
export const CITIZENS_MODERN_FROM_YEAR = 2007

export const SUPPORTED_YEAR_MIN = 1955
export const SUPPORTED_YEAR_MAX = 2099
