import type { Streak } from '../../core/holidays'
import { formatRangeShort } from '../../core/jpdate'
import { ptoLine, streakTitle } from './layout'

export const APP_NAME = '日付のミカタ'

export interface ShareTextInput {
  year: number
  streak: Streak
  appUrl: string
}

/**
 * The three lines of the share text, kept separate so the Web Share API can
 * receive the URL as its own field without duplicating it inside `text`.
 */
export function shareLines(input: ShareTextInput): [headline: string, pto: string, footer: string] {
  const { year, streak, appUrl } = input
  return [
    `【${year}年】${formatRangeShort(streak.start, streak.end)} ${streakTitle(streak)}`,
    ptoLine(streak.ptoDays, true),
    appUrl ? `${APP_NAME} ${appUrl}` : APP_NAME,
  ]
}

/**
 * Plain text for chat apps (≤ 3 lines), e.g.
 * 【2026年】9/19(土)〜9/27(日) 9連休（シルバーウィーク）
 * 有休 9/24(木)・9/25(金)（2日）
 * 日付のミカタ https://…
 */
export function shareText(input: ShareTextInput): string {
  return shareLines(input).join('\n')
}
