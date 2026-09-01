import { FLAG_CUSTOM, FLAG_PTO, FLAG_WEEKEND, flagsAt, streakLabel, type DayOffMap, type Holiday, type ISODate, type Streak } from '../../core/holidays'
import { formatRangeShort, toWareki } from '../../core/jpdate'

interface Props {
  date: ISODate
  map: DayOffMap
  holidays: Map<ISODate, Holiday>
  streaks: Streak[]
  onOpenStreak: (s: Streak) => void
}

export function DayDetail({ date, map, holidays, streaks, onOpenStreak }: Props) {
  const f = flagsAt(map, date)
  const holiday = holidays.get(date)
  const wareki = toWareki(date)
  const streak = streaks.find((s) => s.start <= date && date <= s.end)
  const kinds: string[] = []
  if (holiday) kinds.push(holiday.name)
  if (f & FLAG_WEEKEND) kinds.push('週休')
  if (f & FLAG_CUSTOM) kinds.push('休業日')
  if (f & FLAG_PTO) kinds.push('有休（提案）')
  return (
    <div className="day-detail" data-testid="day-detail">
      {wareki && <p className="day-detail__wareki">{wareki.text}（{wareki.short}）</p>}
      <p>
        {kinds.length ? kinds.join('・') : '平日'}
        {holiday?.provisional && (
          <>
            {' '}
            <span className="badge badge--provisional" title="官報で公示される前の年は、天文計算による予定値です">
              予定
            </span>
          </>
        )}
      </p>
      {streak && (
        <button type="button" className="btn btn--secondary" onClick={() => onOpenStreak(streak)}>
          {formatRangeShort(streak.start, streak.end)} の{streakLabel(streak)}を見る
        </button>
      )}
    </div>
  )
}
