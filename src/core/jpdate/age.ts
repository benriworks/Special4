import { diffDays, isLeapYear, isoOf, monthDay, parseISO } from '../holidays/date'
import type { ISODate } from '../holidays/types'

export const ETO_ANIMALS = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
export const ETO_STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
const ANIMAL_READING = ['ね', 'うし', 'とら', 'う', 'たつ', 'み', 'うま', 'ひつじ', 'さる', 'とり', 'いぬ', 'い']

const mod = (a: number, b: number) => ((a % b) + b) % b

/** 十二支 of a year (2026 → 午). */
export function etoAnimal(year: number): string {
  return ETO_ANIMALS[mod(year - 4, 12)]
}

export function etoAnimalReading(year: number): string {
  return ANIMAL_READING[mod(year - 4, 12)]
}

/** 干支 (十干十二支) of a year (2026 → 丙午). */
export function eto(year: number): string {
  return ETO_STEMS[mod(year - 4, 10)] + ETO_ANIMALS[mod(year - 4, 12)]
}

export interface AgeInfo {
  /** 満年齢 */
  full: number
  /** 数え年 */
  kazoe: number
  isBirthday: boolean
  nextBirthday: ISODate
  daysToNextBirthday: number
  /** 干支 of the birth year */
  eto: string
  etoAnimal: string
}

/** Birthday observed in a given year (Feb 29 → Mar 1 in non-leap years, matching how age legally increments). */
function birthdayIn(year: number, birth: ISODate): ISODate {
  const { m, d } = parseISO(birth)
  if (m === 2 && d === 29 && !isLeapYear(year)) return isoOf(year, 3, 1)
  return isoOf(year, m, d)
}

export function ageOn(birth: ISODate, on: ISODate): AgeInfo | null {
  if (on < birth) return null
  const by = parseISO(birth).y
  const oy = parseISO(on).y
  let full = oy - by
  if (monthDay(on) < monthDay(birthdayIn(oy, birth))) full--
  const isBirthday = monthDay(on) === monthDay(birthdayIn(oy, birth))
  let next = birthdayIn(oy, birth)
  if (next < on) next = birthdayIn(oy + 1, birth)
  return {
    full,
    kazoe: oy - by + 1,
    isBirthday,
    nextBirthday: next,
    daysToNextBirthday: diffDays(on, next),
    eto: eto(by),
    etoAnimal: etoAnimal(by),
  }
}
