import { type CSSProperties } from 'react'
import { formatRangeShort, listDatesShort } from '../../core/jpdate'
import { PTO_MAX, type PtoMode, type PtoPlan } from '../../core/pto'
import { Segmented } from '../../ui/Segmented'
import { RollingNumber } from './RollingNumber'

interface Props {
  year: number
  pto: number
  mode: PtoMode
  plan: PtoPlan
  /** True when PTO is restricted to today or later (current year). */
  notBeforeApplies: boolean
  onChangePto: (n: number) => void
  onChangeMode: (m: PtoMode) => void
}

const MODE_OPTIONS: { value: PtoMode; label: string }[] = [
  { value: 'longest', label: '最長の連休をつくる' },
  { value: 'more3', label: '3連休以上を増やす' },
]

function Stat({ label, value, unit, delta, testId }: { label: string; value: number; unit: string; delta: number; testId: string }) {
  return (
    <div className="stat" data-testid={testId} data-value={value}>
      <div className="stat__value">
        <RollingNumber value={value} />
        <span className="visually-hidden">{value}</span>
        <span className="stat__unit">{unit}</span>
      </div>
      <div className="stat__label">
        <span>{label}</span>
        {delta > 0 && (
          <span className="stat__delta">
            <span aria-hidden="true">+{delta}</span>
            <span className="visually-hidden">（有休で{delta}増加）</span>
          </span>
        )}
      </div>
    </div>
  )
}

export function PtoHero({ year, pto, mode, plan, notBeforeApplies, onChangePto, onChangeMode }: Props) {
  const { summary, baseline, ptoDays } = plan
  const longest = summary.longest
  const longestLen = longest?.length ?? 0
  const baseLongestLen = baseline.longest?.length ?? 0

  let summaryText: React.ReactNode
  if (ptoDays.length === 0) {
    summaryText = (
      <>
        {year}年の休みは<strong>{summary.totalOff}日</strong>。
        {longest ? (
          <>
            最長の連休は
            <strong>
              {formatRangeShort(longest.start, longest.end)} の{longest.length}連休
            </strong>
            {longest.name ? `（${longest.name}）` : ''}です。
          </>
        ) : (
          '3日以上の連休はありません。'
        )}
      </>
    )
  } else {
    summaryText = (
      <>
        有休<strong>{ptoDays.length}日</strong>（{listDatesShort(ptoDays)}）を使うと、休みは<strong>{summary.totalOff}日</strong>、
        {longest && (
          <>
            最長の連休は
            <strong>
              {formatRangeShort(longest.start, longest.end)} の{longest.length}連休
            </strong>
            {longest.name ? `（${longest.name}）` : ''}
          </>
        )}
        になります。
      </>
    )
  }

  return (
    <div className="hero__main">
      <h2 className="hero__lead" id="hero-heading">
        有休1日で、連休はもっと伸びる。
      </h2>
      <div className="hero__stats">
        <Stat label="休み" value={summary.totalOff} unit="日" delta={summary.totalOff - baseline.totalOff} testId="stat-total" />
        <Stat label="3連休以上" value={summary.streak3plus} unit="回" delta={summary.streak3plus - baseline.streak3plus} testId="stat-streaks" />
        <Stat label="最長" value={longestLen} unit="日" delta={longestLen - baseLongestLen} testId="stat-longest" />
      </div>

      <div className="pto-control">
        <div className="pto-control__row">
          <label htmlFor="pto-slider" className="pto-control__label">
            有休を足す
          </label>
          <input
            id="pto-slider"
            className="slider"
            type="range"
            min={0}
            max={PTO_MAX}
            step={1}
            value={pto}
            onChange={(e) => onChangePto(Number(e.currentTarget.value))}
            aria-valuetext={`有休${pto}日`}
            style={{ '--pto-progress': `${(pto / PTO_MAX) * 100}%` } as CSSProperties}
            data-testid="pto-slider"
          />
          <output htmlFor="pto-slider" className="pto-value" data-testid="pto-value">
            {pto}日
          </output>
        </div>
        <Segmented label="有休の使い方" options={MODE_OPTIONS} value={mode} onChange={onChangeMode} />
      </div>

      <p className="hero__summary" aria-live="polite" data-testid="hero-summary">
        {summaryText}
      </p>
      {pto > ptoDays.length && notBeforeApplies && (
        <p className="hero__note caption">今年の残りの平日に置けるのは{ptoDays.length}日までです。</p>
      )}
      {notBeforeApplies && pto > 0 && ptoDays.length > 0 && <p className="hero__note caption">有休は今日以降の平日に配置しています。</p>}
    </div>
  )
}
