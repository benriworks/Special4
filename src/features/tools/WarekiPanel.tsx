import { useId, useState } from 'react'
import { parseISO, type ISODate } from '../../core/holidays'
import { ERAS, WAREKI_MAX, WAREKI_MIN, ageOn, formatJa, fromWareki, maxEraYear, toWareki, weekdayJa } from '../../core/jpdate'
import { DAY_OPTIONS, DateField, MONTH_OPTIONS, NumberField, SelectField } from './fields'
import { ResultCard } from './ResultCard'
import {
  MSG_AGE_EMPTY,
  ageCopyText,
  birthDateError,
  etoText,
  nextBirthdayText,
  parseEraYear,
  seirekiDateError,
  warekiErrorMessage,
  warekiWithWeekday,
} from './logic'

const ERA_OPTIONS = ERAS.map((e) => ({ value: e.name, label: e.name }))
const CURRENT_ERA = ERAS[ERAS.length - 1]

interface Props {
  today: ISODate
}

/** 和暦・年齢: 西暦→和暦, 和暦→西暦, and age from a birth date. */
export function WarekiPanel({ today }: Props) {
  const id = useId()
  const todayParts = parseISO(today)
  const todayWareki = toWareki(today)

  // 西暦→和暦
  const [seireki, setSeireki] = useState<string>(today)
  const seirekiError = seirekiDateError(seireki)
  const wareki = seirekiError ? null : toWareki(seireki)

  // 和暦→西暦
  const [eraName, setEraName] = useState(todayWareki?.era.name ?? CURRENT_ERA.name)
  const [yearRaw, setYearRaw] = useState(String(todayWareki?.year ?? 1))
  const [month, setMonth] = useState(String(todayParts.m))
  const [day, setDay] = useState(String(todayParts.d))

  const era = ERAS.find((e) => e.name === eraName)
  const eraMax = era ? maxEraYear(era) : 1
  const eraYear = parseEraYear(yearRaw)
  const conv = eraYear === null ? { error: 'year' as const } : fromWareki(eraName, eraYear, Number(month), Number(day))
  const convError =
    'error' in conv
      ? { code: conv.error, message: warekiErrorMessage(conv.error, eraName, { year: eraYear ?? 0, month: Number(month), day: Number(day) }) }
      : null
  const converted = 'iso' in conv ? conv.iso : null
  const convErrorId = `${id}-conv-error`
  const groupError = convError && (convError.code === 'range' || convError.code === 'era') ? convError.message : null

  // 年齢
  const [birth, setBirth] = useState('')
  const birthError = birthDateError(birth, today)
  const age = birth && !birthError ? ageOn(birth, today) : null
  const birthWareki = age ? toWareki(birth) : null

  return (
    <div className="tools__grid">
      <section className="tool" aria-labelledby={`${id}-w-h`}>
        <h3 id={`${id}-w-h`}>西暦から和暦へ</h3>
        <div className="tool__form">
          <DateField
            id={`${id}-seireki`}
            label="日付（西暦）"
            value={seireki}
            onChange={setSeireki}
            min={WAREKI_MIN}
            max={WAREKI_MAX}
            error={seirekiError}
            testid="wareki-input"
          />
        </div>
        <div className="tool__result" aria-live="polite">
          {wareki && (
            <ResultCard
              testid="wareki-result"
              label="和暦"
              value={wareki.text}
              items={[
                { term: '略記', value: wareki.short },
                { term: '曜日', value: `${weekdayJa(seireki)}曜日` },
              ]}
              copyText={warekiWithWeekday(seireki) ?? wareki.text}
            />
          )}
        </div>
      </section>

      <section className="tool" aria-labelledby={`${id}-s-h`}>
        <h3 id={`${id}-s-h`}>和暦から西暦へ</h3>
        <div className="tool__form" role="group" aria-labelledby={`${id}-s-h`} aria-describedby={groupError ? convErrorId : undefined}>
          <div className="tool__pair">
            <SelectField id={`${id}-era`} label="元号" value={eraName} onChange={setEraName} options={ERA_OPTIONS} testid="seireki-era" />
            <NumberField
              id={`${id}-era-year`}
              label="年"
              value={yearRaw}
              onChange={setYearRaw}
              min={1}
              max={eraMax}
              error={convError?.code === 'year' ? convError.message : null}
              testid="seireki-year"
            />
          </div>
          <div className="tool__pair">
            <SelectField id={`${id}-month`} label="月" value={month} onChange={setMonth} options={MONTH_OPTIONS} testid="seireki-month" />
            <SelectField
              id={`${id}-day`}
              label="日"
              value={day}
              onChange={setDay}
              options={DAY_OPTIONS}
              error={convError?.code === 'date' ? convError.message : null}
              testid="seireki-day"
            />
          </div>
          {groupError && (
            <p id={convErrorId} className="field__error">
              {groupError}
            </p>
          )}
        </div>
        <div className="tool__result" aria-live="polite">
          {converted && (
            <ResultCard
              testid="seireki-result"
              label="西暦"
              value={formatJa(converted)}
              lines={[toWareki(converted)?.text]}
              copyText={formatJa(converted)}
            />
          )}
        </div>
      </section>

      <section className="tool" aria-labelledby={`${id}-age-h`}>
        <h3 id={`${id}-age-h`}>年齢</h3>
        <div className="tool__form">
          <DateField id={`${id}-birth`} label="生年月日" value={birth} onChange={setBirth} max={today} error={birthError} testid="age-input" />
        </div>
        <div className="tool__result" aria-live="polite">
          {!birth && (
            <p className="caption tool__empty" data-testid="age-result">
              {MSG_AGE_EMPTY}
            </p>
          )}
          {age && (
            <ResultCard
              testid="age-result"
              label="満年齢"
              value={`${age.full}歳`}
              items={[
                { term: '数え年', value: `${age.kazoe}歳` },
                { term: '次の誕生日', value: nextBirthdayText(age) },
                { term: '干支', value: etoText(parseISO(birth).y) },
                birthWareki ? { term: '生年月日（和暦）', value: birthWareki.text } : null,
              ]}
              copyText={ageCopyText(birth, age)}
            />
          )}
        </div>
      </section>
    </div>
  )
}
