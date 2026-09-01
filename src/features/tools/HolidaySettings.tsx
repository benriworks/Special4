import { useId, useState, type FormEvent } from 'react'
import { PRESET_RANGES, parseISO, type CustomRange, type ISODate, type OffSettings, type WeekendRule } from '../../core/holidays'
import { Segmented } from '../../ui/Segmented'
import { useToast } from '../../ui/toast'
import { MonthDayFields, TextField } from './fields'
import {
  DEFAULT_RANGE_LABEL,
  MSG_RANGE_WRAP_HINT,
  RANGE_LABEL_MAX,
  WEEKEND_OPTIONS,
  formatRange,
  hasRange,
  rangeTitle,
  validateRangeForm,
  type RangeFormField,
} from './logic'

const PRESETS: { key: 'nenmatsu' | 'obon'; range: CustomRange }[] = [
  { key: 'nenmatsu', range: PRESET_RANGES.nenmatsu },
  { key: 'obon', range: PRESET_RANGES.obon },
]

interface Props {
  settings: OffSettings
  onChangeSettings: (next: OffSettings) => void
  today: ISODate
}

/** 休みの設定: weekend rule and recurring company holidays (shared with the map). */
export function HolidaySettings({ settings, onChangeSettings, today }: Props) {
  const id = useId()
  const toast = useToast()
  const t = parseISO(today)

  const [label, setLabel] = useState(DEFAULT_RANGE_LABEL)
  const [fromMonth, setFromMonth] = useState(t.m)
  const [fromDay, setFromDay] = useState(t.d)
  const [toMonth, setToMonth] = useState(t.m)
  const [toDay, setToDay] = useState(t.d)
  /** Label errors are only shown after the user tried to add (typing an empty name is normal). */
  const [attempted, setAttempted] = useState(false)

  const validation = validateRangeForm({ label, fromMonth, fromDay, toMonth, toDay, existing: settings.customRanges })
  const errorFor = (field: RangeFormField): string | null => {
    if (validation.ok || validation.field !== field) return null
    if (field === 'label' && !attempted) return null
    return validation.message
  }
  const rangeError = errorFor('range')
  const rangeErrorId = `${id}-range-error`

  const setWeekend = (weekend: WeekendRule) => onChangeSettings({ ...settings, weekend })

  const addRange = (r: CustomRange) => {
    onChangeSettings({ ...settings, customRanges: [...settings.customRanges, r] })
    toast.show(`${r.label}を追加しました`)
  }

  const removeAt = (index: number) => {
    const r = settings.customRanges[index]
    onChangeSettings({ ...settings, customRanges: settings.customRanges.filter((_, i) => i !== index) })
    if (r) toast.show(`${r.label}を削除しました`)
  }

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!validation.ok) {
      setAttempted(true)
      return
    }
    addRange(validation.range)
    setLabel(DEFAULT_RANGE_LABEL)
    setAttempted(false)
  }

  const isEmpty = settings.customRanges.length === 0

  return (
    <>
      <div className="tools__grid">
        <div className="tool">
          <section className="tool__section" aria-labelledby={`${id}-week-h`}>
            <h3 id={`${id}-week-h`}>週休</h3>
            <div className="field" data-testid="settings-weekend">
              <Segmented label="週休" options={WEEKEND_OPTIONS} value={settings.weekend} onChange={setWeekend} className="tool__segmented" />
              <p className="field__hint">毎週の休みとして数える曜日です。</p>
            </div>
          </section>

          <section className="tool__section" aria-labelledby={`${id}-range-h`}>
            <h3 id={`${id}-range-h`}>休業日（毎年）</h3>
            {isEmpty && <p className="caption tool__empty">休業日はまだありません。年末年始・お盆のプリセットから追加できます。</p>}
            <ul className="range-list" data-testid="settings-range-list" aria-label="休業日の一覧">
              {settings.customRanges.map((r, i) => (
                <li key={`${r.from}-${r.to}-${i}`} className="range-row">
                  <span className="range-row__label">{r.label}</span>
                  <span className="range-row__dates">{formatRange(r)}</span>
                  <button type="button" className="btn btn--text" aria-label={`${rangeTitle(r)}を削除`} onClick={() => removeAt(i)}>
                    削除
                  </button>
                </li>
              ))}
            </ul>
            <div className="row tools__presets">
              {PRESETS.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  className="btn btn--secondary btn--sm"
                  data-testid={`settings-add-${p.key}`}
                  disabled={hasRange(settings.customRanges, p.range)}
                  onClick={() => addRange(p.range)}
                >
                  {rangeTitle(p.range)}を追加
                </button>
              ))}
            </div>
          </section>
        </div>

        <form className="tool" onSubmit={submit} noValidate aria-labelledby={`${id}-add-h`} aria-describedby={rangeError ? rangeErrorId : undefined}>
          <h3 id={`${id}-add-h`}>休業日を追加</h3>
          <div className="tool__form">
            <TextField
              id={`${id}-label`}
              label="名前"
              value={label}
              onChange={setLabel}
              maxLength={RANGE_LABEL_MAX}
              hint={`${RANGE_LABEL_MAX}文字まで`}
              error={errorFor('label')}
              testid="settings-label"
            />
            <div className="tool__pair">
              <MonthDayFields
                idBase={`${id}-from`}
                legend="開始"
                month={fromMonth}
                day={fromDay}
                onChange={(m, d) => {
                  setFromMonth(m)
                  setFromDay(d)
                }}
                error={errorFor('from')}
              />
              <MonthDayFields
                idBase={`${id}-to`}
                legend="終了"
                month={toMonth}
                day={toDay}
                onChange={(m, d) => {
                  setToMonth(m)
                  setToDay(d)
                }}
                error={errorFor('to')}
              />
            </div>
            <p className="field__hint">{MSG_RANGE_WRAP_HINT}</p>
            {rangeError && (
              <p id={rangeErrorId} className="field__error">
                {rangeError}
              </p>
            )}
            <div className="tool__actions">
              <button type="submit" className="btn btn--primary" data-testid="settings-add-custom">
                追加
              </button>
            </div>
          </div>
        </form>
      </div>
      <p className="caption">設定は自動で保存され、マップと営業日計算に反映されます。</p>
    </>
  )
}
