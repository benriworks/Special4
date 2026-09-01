import { diffDays, streakLabel, type ISODate, type Streak } from '../../core/holidays'
import { formatRangeShort, formatShort, relativeDaysJa, toWareki } from '../../core/jpdate'

interface Props {
  year: number
  today: ISODate
  streaks: Streak[]
  onOpen: (s: Streak) => void
  onChangeYear: (y: number) => void
}

export function NextStreakBanner({ year, today, streaks, onOpen, onChangeYear }: Props) {
  const todayYear = Number(today.slice(0, 4))
  let title = '次の連休'
  let streak: Streak | undefined
  let relative = ''

  if (year === todayYear) {
    streak = streaks.find((s) => s.end >= today)
    if (streak) {
      if (streak.start <= today) {
        title = 'いまの連休'
        relative = `${formatShort(streak.end)}まで`
      } else {
        relative = relativeDaysJa(diffDays(today, streak.start))
      }
    }
  } else if (year > todayYear) {
    streak = streaks[0]
    title = `${year}年 最初の連休`
    if (streak) relative = relativeDaysJa(diffDays(today, streak.start))
  } else {
    streak = streaks.reduce<Streak | undefined>((a, s) => (!a || s.length > a.length ? s : a), undefined)
    title = `${year}年 最長の連休`
  }

  if (!streak) {
    return (
      <aside className="card card--lg banner banner--empty" aria-label={title} data-testid="next-streak">
        <p className="banner__title">{title}</p>
        <p>{year === todayYear ? '今年の3日以上の連休は終わりました。' : 'この年に3日以上の連休はありません。'}</p>
        {year === todayYear && (
          <div className="banner__actions">
            <button type="button" className="btn btn--secondary" onClick={() => onChangeYear(year + 1)}>
              {year + 1}年のマップを見る
            </button>
          </div>
        )}
      </aside>
    )
  }

  const wareki = toWareki(streak.start)
  const ptoText = streak.ptoDays.length
    ? `有休 ${streak.ptoDays.map((d) => formatShort(d, false)).join('・')} の${streak.ptoDays.length}日で`
    : '有休なしで'

  return (
    <aside className="card card--lg banner" aria-label={title} data-testid="next-streak">
      <p className="banner__title">{title}</p>
      <h3 className="banner__range">{formatRangeShort(streak.start, streak.end)}</h3>
      <div className="banner__meta">
        <span className="banner__count">{streakLabel(streak)}</span>
        {relative && <span>{relative}</span>}
        <span className="caption">{ptoText}</span>
        {wareki && <span className="caption">{wareki.era.name}{wareki.year === 1 ? '元' : wareki.year}年</span>}
      </div>
      <div className="banner__actions">
        <button type="button" className="btn btn--secondary" onClick={() => onOpen(streak)} data-testid="next-streak-open">
          詳細・カードにする
        </button>
      </div>
    </aside>
  )
}
