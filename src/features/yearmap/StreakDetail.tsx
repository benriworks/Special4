import type { ReactNode } from 'react'
import { addDays, FLAG_CUSTOM, FLAG_HOLIDAY, FLAG_PTO, FLAG_WEEKEND, flagsAt, type DayOffMap, type Holiday, type ISODate, type Streak } from '../../core/holidays'
import { formatJa, formatShort, toWareki, weekdayJa } from '../../core/jpdate'

interface Props {
  streak: Streak
  map: DayOffMap
  holidays: Map<ISODate, Holiday>
  /** Slot for the share actions (injected by the app). */
  share?: ReactNode
}

export function StreakDetail({ streak, map, holidays, share }: Props) {
  const days: { date: ISODate; flags: number; holiday?: Holiday }[] = []
  for (let d = streak.start; d <= streak.end; d = addDays(d, 1)) {
    days.push({ date: d, flags: flagsAt(map, d), holiday: holidays.get(d) })
  }
  const holidayDays = days.filter((d) => d.flags & FLAG_HOLIDAY)
  const weekendDays = days.filter((d) => d.flags & FLAG_WEEKEND && !(d.flags & FLAG_HOLIDAY))
  const customDays = days.filter((d) => d.flags & FLAG_CUSTOM && !(d.flags & (FLAG_HOLIDAY | FLAG_WEEKEND)))
  const ptoDays = days.filter((d) => d.flags & FLAG_PTO)
  const wareki = toWareki(streak.start)
  const names = holidayDays.map((d) => d.holiday?.name).filter((n): n is string => !!n)

  return (
    <div className="streak-detail" data-testid="streak-detail">
      <p className="streak-detail__range">
        {formatJa(streak.start)}〜{formatJa(streak.end, { year: streak.end.slice(0, 4) !== streak.start.slice(0, 4) })}
        {wareki && <span className="caption">（{wareki.era.name}{wareki.year === 1 ? '元' : wareki.year}年）</span>}
      </p>
      <div className="streak-detail__days" aria-hidden="true">
        {days.map((d) => (
          <span key={d.date} className={`daychip${d.flags & FLAG_PTO ? ' daychip--pto' : ''}`}>
            <span>{Number(d.date.slice(8, 10))}</span>
            <small>{weekdayJa(d.date)}</small>
          </span>
        ))}
      </div>
      <dl>
        {holidayDays.length > 0 && (
          <>
            <dt>祝日</dt>
            <dd>
              {holidayDays.length}日{names.length ? `（${[...new Set(names)].join('・')}）` : ''}
            </dd>
          </>
        )}
        {weekendDays.length > 0 && (
          <>
            <dt>週休</dt>
            <dd>{weekendDays.length}日</dd>
          </>
        )}
        {customDays.length > 0 && (
          <>
            <dt>休業日</dt>
            <dd>{customDays.length}日</dd>
          </>
        )}
        <dt>有休</dt>
        <dd>{ptoDays.length ? `${ptoDays.length}日（${ptoDays.map((d) => formatShort(d.date, false)).join('・')}）` : 'なし'}</dd>
      </dl>
      {share}
    </div>
  )
}
