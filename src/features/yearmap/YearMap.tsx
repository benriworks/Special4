import { useMemo, useState, type ReactNode } from 'react'
import { buildDayOffMap, holidayMap, streakLabel, type ISODate, type OffSettings, type Streak } from '../../core/holidays'
import { formatJa } from '../../core/jpdate'
import { suggestPto, type PtoMode } from '../../core/pto'
import { Sheet } from '../../ui/Sheet'
import { DayDetail } from './DayDetail'
import { labelSegmentKeys } from './layout'
import { Legend } from './Legend'
import { MonthGrid } from './MonthGrid'
import { NextStreakBanner } from './NextStreakBanner'
import { PtoHero } from './PtoHero'
import { StreakDetail } from './StreakDetail'
import { useRovingGrid } from './useRovingGrid'
import './yearmap.css'

export interface YearMapProps {
  year: number
  pto: number
  mode: PtoMode
  settings: OffSettings
  today: ISODate
  onChangePto: (n: number) => void
  onChangeMode: (m: PtoMode) => void
  onChangeYear: (y: number) => void
  /** Renders share actions for a streak inside the detail sheet. */
  renderShare?: (streak: Streak) => ReactNode
}

type Selection = { kind: 'streak'; streak: Streak } | { kind: 'day'; date: ISODate } | null

export function YearMap({ year, pto, mode, settings, today, onChangePto, onChangeMode, onChangeYear, renderShare }: YearMapProps) {
  const referenceDate = today
  const base = useMemo(() => buildDayOffMap(year, settings, { referenceDate }), [year, settings, referenceDate])
  const notBeforeApplies = today.startsWith(`${year}-`)
  const plan = useMemo(
    () => suggestPto(base, pto, mode, notBeforeApplies ? { notBefore: today } : {}),
    [base, pto, mode, notBeforeApplies, today],
  )
  const holidays = useMemo(() => holidayMap(year, { referenceDate }), [year, referenceDate])
  const labelKeys = useMemo(() => labelSegmentKeys(year, plan.streaks, plan.map), [year, plan])
  const hasProvisional = useMemo(() => [...holidays.values()].some((h) => h.provisional), [holidays])

  const initialFocus = notBeforeApplies ? today : `${year}-01-01`
  const { focusDate, setFocusDate, onKeyDown } = useRovingGrid(year, initialFocus)
  const [selection, setSelection] = useState<Selection>(null)
  const close = () => setSelection(null)

  return (
    <>
      <section className="hero container" aria-label="有休ブースト">
        <PtoHero year={year} pto={pto} mode={mode} plan={plan} notBeforeApplies={notBeforeApplies} onChangePto={onChangePto} onChangeMode={onChangeMode} />
        <NextStreakBanner year={year} today={today} streaks={plan.streaks} onOpen={(s) => setSelection({ kind: 'streak', streak: s })} onChangeYear={onChangeYear} />
      </section>

      <section className="map container" aria-labelledby="map-heading">
        <div className="map__head">
          <h2 id="map-heading">{year}年の連休マップ</h2>
          <Legend />
        </div>
        {hasProvisional && (
          <p className="map__provisional caption">
            <span className="badge badge--provisional">予定</span>
            春分の日・秋分の日は官報で公示される前のため、天文計算による予定値です。
          </p>
        )}
        <MonthGrid
          year={year}
          map={plan.map}
          streaks={plan.streaks}
          labelKeys={labelKeys}
          holidays={holidays}
          today={today}
          focusDate={focusDate}
          onFocusDate={setFocusDate}
          onKeyDown={onKeyDown}
          onSelectDay={(date) => setSelection({ kind: 'day', date })}
          onSelectStreak={(streak) => setSelection({ kind: 'streak', streak })}
        />
      </section>

      <Sheet open={selection?.kind === 'streak'} onClose={close} title={selection?.kind === 'streak' ? streakLabel(selection.streak) : ''} testId="streak-sheet">
        {selection?.kind === 'streak' && (
          <StreakDetail streak={selection.streak} map={plan.map} holidays={holidays} share={renderShare?.(selection.streak)} />
        )}
      </Sheet>
      <Sheet open={selection?.kind === 'day'} onClose={close} title={selection?.kind === 'day' ? formatJa(selection.date) : ''} testId="day-sheet">
        {selection?.kind === 'day' && (
          <DayDetail date={selection.date} map={plan.map} holidays={holidays} streaks={plan.streaks} onOpenStreak={(s) => setSelection({ kind: 'streak', streak: s })} />
        )}
      </Sheet>
    </>
  )
}
