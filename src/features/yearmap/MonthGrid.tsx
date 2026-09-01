import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import {
  FLAG_CUSTOM,
  FLAG_HOLIDAY,
  FLAG_PTO,
  FLAG_WEEKEND,
  flagsAt,
  streakLabel,
  weekday,
  type DayOffMap,
  type Holiday,
  type ISODate,
  type Streak,
} from '../../core/holidays'
import { formatJa, WEEKDAYS_JA } from '../../core/jpdate'
import { dayRow, fitLabel, labelRuns, monthDays, monthSegments, type DayPlacement, type RibbonSegment } from './layout'

const MONTH_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

interface MonthGridProps {
  year: number
  map: DayOffMap
  streaks: Streak[]
  labelKeys: Map<Streak, string>
  holidays: Map<ISODate, Holiday>
  today: ISODate
  /** Saturday is a regular day off (colours the 土 column blue). */
  satOff: boolean
  focusDate: ISODate
  onFocusDate: (d: ISODate) => void
  onKeyDown: (e: KeyboardEvent<HTMLElement>, date: ISODate) => void
  onSelectDay: (date: ISODate) => void
  onSelectStreak: (s: Streak) => void
}

/**
 * Width of one day cell. Measured from whichever month grid is live; the
 * observer sits on the stable container so year changes (which remount the
 * grids) never leave it watching a detached element.
 */
function useCellWidth(ref: React.RefObject<HTMLElement | null>): number {
  const [w, setW] = useState(36)
  useEffect(() => {
    const host = ref.current
    if (!host) return
    const update = () => {
      const grid = host.querySelector<HTMLElement>('.month__grid')
      if (grid && grid.clientWidth > 0) setW(Math.max(16, grid.clientWidth / 7 - 2))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(host)
    return () => ro.disconnect()
  }, [ref])
  return w
}

function Ribbon({ seg, labelled, cellWidth, onSelect }: { seg: RibbonSegment; labelled: boolean; cellWidth: number; onSelect: () => void }) {
  const s = seg.streak
  const n = seg.days.length
  const full = streakLabel(s)
  const candidates = [full, streakLabel(s, false)]
  // Prefer labelling the red (non-PTO) run; fall back to the PTO run when the red one is too short.
  const runs = labelRuns(seg.days)
  let run = runs.main
  let label = labelled ? fitLabel(candidates, run[1] * cellWidth) : ''
  if (labelled && !label && runs.pto[1] > 0) {
    run = runs.pto
    label = fitLabel(candidates, run[1] * cellWidth)
  }
  const [runStart, runLen] = run
  const onPto = seg.days[runStart]?.pto ?? false
  const cls = `ribbon${seg.isStart ? ' ribbon--start' : ''}${seg.isEnd ? ' ribbon--end' : ''}`
  const style = {
    gridRow: seg.row,
    gridColumn: `${seg.colStart} / ${seg.colEnd}`,
    gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`,
  }
  const inner = (
    <>
      {seg.days.map((d) => (
        <span key={d.date} className={`ribbon__day${d.pto ? ' ribbon__day--pto' : ''}`} />
      ))}
      {label && (
        <span
          className={`ribbon__label${onPto ? ' ribbon__label--on-pto' : ''}`}
          style={{ left: `${(runStart / n) * 100}%`, width: `${(runLen / n) * 100}%` }}
        >
          {label}
        </span>
      )}
    </>
  )
  if (!labelled) {
    return (
      <div className={cls} style={style} aria-hidden="true" onClick={onSelect}>
        {inner}
      </div>
    )
  }
  const aria = `${formatJa(s.start)}から${formatJa(s.end, { year: false })}まで、${full}。${s.ptoDays.length ? `有休${s.ptoDays.length}日を含む。` : ''}詳細を開く`
  return (
    <button type="button" className={cls} style={style} aria-label={aria} onClick={onSelect} data-testid="ribbon" data-streak={`${s.start}_${s.end}`}>
      {inner}
    </button>
  )
}

/** Group day placements into week rows (index = week within the month). */
function byWeek(days: DayPlacement[]): DayPlacement[][] {
  const weeks: DayPlacement[][] = []
  for (const d of days) {
    const w = (d.row - dayRow(0)) / 2
    ;(weeks[w] ??= []).push(d)
  }
  return weeks
}

function MonthCard(props: MonthGridProps & { month: number; cellWidth: number }) {
  const { year, month, map, streaks, labelKeys, holidays, today, satOff, focusDate, onFocusDate, onKeyDown, onSelectDay, onSelectStreak, cellWidth } = props
  const weeks = byWeek(monthDays(year, month))
  const segments = monthSegments(year, month, streaks, map)
  const isCurrentYear = today.startsWith(`${year}-`)
  return (
    <div className="month">
      <div className="month__title">
        <h3>{month}月</h3>
        <span className="month__en">{MONTH_EN[month - 1]}</span>
      </div>
      <div className="month__grid">
        <div role="grid" aria-label={`${year}年${month}月のカレンダー`} className="contents">
          <div role="row" className="contents">
            {WEEKDAYS_JA.map((w, i) => (
              <div key={w} className={`wd${i === 0 ? ' wd--sun' : i === 6 && satOff ? ' wd--sat' : ''}`} role="columnheader" style={{ gridColumn: i + 1 }}>
                {w}
              </div>
            ))}
          </div>
          {weeks.map((week, wi) => (
            <div role="row" className="contents" key={wi}>
              {week.map((d) => {
                const f = flagsAt(map, d.date)
                const wd = weekday(d.date)
                const holiday = holidays.get(d.date)
                const isToday = d.date === today
                const classes = ['day']
                if (f & FLAG_HOLIDAY) classes.push('day--holiday')
                else if (wd === 0) classes.push('day--sun')
                else if (wd === 6 && f & FLAG_WEEKEND) classes.push('day--sat')
                if (f & FLAG_CUSTOM) classes.push('day--custom')
                if (f & FLAG_PTO) classes.push('day--pto')
                if (isToday) classes.push('day--today')
                if (isCurrentYear && d.date < today) classes.push('day--past')
                const parts = [formatJa(d.date)]
                if (holiday) parts.push(holiday.name + (holiday.provisional ? '（予定）' : ''))
                if (f & FLAG_CUSTOM && !(f & FLAG_HOLIDAY)) parts.push('休業日')
                if (f & FLAG_PTO) parts.push('有休（提案）')
                if (isToday) parts.push('今日')
                return (
                  <button
                    key={d.date}
                    type="button"
                    id={`day-${d.date}`}
                    role="gridcell"
                    className={classes.join(' ')}
                    style={{ gridRow: d.row, gridColumn: d.col }}
                    tabIndex={d.date === focusDate ? 0 : -1}
                    aria-label={parts.join(' ')}
                    aria-current={isToday ? 'date' : undefined}
                    onFocus={() => onFocusDate(d.date)}
                    onKeyDown={(e) => onKeyDown(e, d.date)}
                    onClick={() => onSelectDay(d.date)}
                    data-testid={isToday ? 'day-today' : undefined}
                  >
                    <span className="day__num">{d.day}</span>
                  </button>
                )
              })}
            </div>
          ))}
        </div>
        {segments.map((seg) => (
          <Ribbon key={seg.key} seg={seg} labelled={labelKeys.get(seg.streak) === seg.key} cellWidth={cellWidth} onSelect={() => onSelectStreak(seg.streak)} />
        ))}
      </div>
    </div>
  )
}

export function MonthGrid(props: MonthGridProps) {
  const ref = useRef<HTMLDivElement>(null)
  const cellWidth = useCellWidth(ref)
  return (
    <div className="months" ref={ref} data-testid="months">
      {Array.from({ length: 12 }, (_, i) => (
        <MonthCard key={`${props.year}-${i + 1}`} {...props} month={i + 1} cellWidth={cellWidth} />
      ))}
    </div>
  )
}
