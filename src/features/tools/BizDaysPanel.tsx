import { useId, useMemo, useState } from 'react'
import {
  SUPPORTED_YEAR_MAX,
  SUPPORTED_YEAR_MIN,
  addBusinessDays,
  addDays,
  countBusinessDays,
  diffDays,
  isoOf,
  type ISODate,
  type OffSettings,
} from '../../core/holidays'
import { formatJa, toWareki } from '../../core/jpdate'
import { Segmented } from '../../ui/Segmented'
import { DateField, NumberField } from './fields'
import { ResultCard } from './ResultCard'
import {
  BIZ_COUNT_DEFAULT,
  BIZ_COUNT_MAX,
  BIZ_COUNT_MIN,
  DIRECTION_OPTIONS,
  MSG_BIZ_COUNT,
  betweenCopyText,
  bizDateError,
  businessDayLabel,
  calendarDaysText,
  calendarOffsetText,
  dateWithWareki,
  holidayRangeNote,
  parseBusinessDayCount,
  rangeOrderError,
  type Direction,
} from './logic'

const DATE_MIN = isoOf(SUPPORTED_YEAR_MIN, 1, 1)
const DATE_MAX = isoOf(SUPPORTED_YEAR_MAX, 12, 31)

interface Props {
  settings: OffSettings
  today: ISODate
  referenceDate: ISODate
}

/** 営業日を数える: n business days after/before a date, and business days between two dates. */
export function BizDaysPanel({ settings, today, referenceDate }: Props) {
  const id = useId()

  // A) 営業日で数えた日付
  const [basis, setBasis] = useState<string>(today)
  const [countRaw, setCountRaw] = useState(String(BIZ_COUNT_DEFAULT))
  const [dir, setDir] = useState<Direction>('after')

  const basisError = bizDateError(basis)
  const count = parseBusinessDayCount(countRaw)
  const countError = count === null ? MSG_BIZ_COUNT : null

  const target = useMemo(() => {
    if (basisError || count === null) return null
    const date = addBusinessDays(basis, dir === 'after' ? count : -count, settings, { referenceDate })
    return { date, label: businessDayLabel(count, dir), offset: diffDays(basis, date) }
  }, [basis, basisError, count, dir, settings, referenceDate])

  // B) 2つの日付の間は？
  const [from, setFrom] = useState<string>(today)
  const [to, setTo] = useState<string>(() => addDays(today, 30))

  const fromError = bizDateError(from)
  const toError = bizDateError(to) ?? (fromError ? null : rangeOrderError(from, to))

  const between = useMemo(() => {
    if (fromError || toError) return null
    return countBusinessDays(from, to, settings, { referenceDate })
  }, [from, to, fromError, toError, settings, referenceDate])

  return (
    <>
      <div className="tools__grid">
        <section className="tool" aria-labelledby={`${id}-a-h`}>
          <h3 id={`${id}-a-h`}>営業日で数えた日付</h3>
          <div className="tool__form">
            <DateField
              id={`${id}-basis`}
              label="基準日"
              value={basis}
              onChange={setBasis}
              min={DATE_MIN}
              max={DATE_MAX}
              error={basisError}
              testid="bizdays-basis"
              trailing={
                <button type="button" className="btn btn--secondary" onClick={() => setBasis(today)} aria-label="基準日を今日にする">
                  今日
                </button>
              }
            />
            <div className="tool__row">
              <NumberField
                id={`${id}-count`}
                label="営業日数"
                value={countRaw}
                onChange={setCountRaw}
                min={BIZ_COUNT_MIN}
                max={BIZ_COUNT_MAX}
                error={countError}
                testid="bizdays-count"
              />
              <div className="field">
                <span className="field__label" aria-hidden="true">
                  後・前
                </span>
                <Segmented label="後か前か" options={DIRECTION_OPTIONS} value={dir} onChange={setDir} className="tool__segmented" />
              </div>
            </div>
          </div>
          <div className="tool__result" aria-live="polite">
            {target && (
              <ResultCard
                testid="bizdays-result"
                label={target.label}
                value={formatJa(target.date)}
                lines={[toWareki(target.date)?.text, calendarOffsetText(target.offset), holidayRangeNote(target.date)]}
                copyText={dateWithWareki(target.date)}
              />
            )}
          </div>
        </section>

        <section className="tool" aria-labelledby={`${id}-b-h`}>
          <h3 id={`${id}-b-h`}>2つの日付の間は？</h3>
          <div className="tool__form">
            <div className="tool__pair">
              <DateField
                id={`${id}-from`}
                label="開始日"
                value={from}
                onChange={setFrom}
                min={DATE_MIN}
                max={DATE_MAX}
                error={fromError}
                testid="bizdays-from"
              />
              <DateField
                id={`${id}-to`}
                label="終了日"
                value={to}
                onChange={setTo}
                min={DATE_MIN}
                max={DATE_MAX}
                error={toError}
                testid="bizdays-to"
              />
            </div>
          </div>
          <div className="tool__result" aria-live="polite">
            {between && (
              <ResultCard
                testid="bizdays-between-result"
                label="営業日数"
                value={`${between.business}日`}
                items={[
                  { term: '暦日数', value: calendarDaysText(between.calendar, between.weeks) },
                  { term: '休みの日数', value: `${between.off}日` },
                ]}
                caption="開始日と終了日を含みます"
                copyText={betweenCopyText(from, to, between)}
              />
            )}
          </div>
        </section>
      </div>
      <p className="caption">週休・休業日の設定はマップと共通です（「休みの設定」タブ）。</p>
    </>
  )
}
