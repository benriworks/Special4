import { describe, expect, it } from 'vitest'
import type { Streak } from '../../../core/holidays'
import { shareLines, shareText } from '../shareText'

const URL = 'https://example.github.io/Special4/#y=2026&pto=2'

const silverWeek: Streak = {
  start: '2026-09-19',
  end: '2026-09-27',
  length: 9,
  name: 'シルバーウィーク',
  ptoDays: ['2026-09-24', '2026-09-25'],
  boosted: true,
}

describe('shareText', () => {
  it('formats a named, PTO-boosted streak in three lines', () => {
    expect(shareText({ year: 2026, streak: silverWeek, appUrl: URL })).toBe(
      `【2026年】9/19(土)〜9/27(日) 9連休（シルバーウィーク）\n有休 9/24(木)・9/25(金)（2日）\n日付のミカタ ${URL}`,
    )
  })

  it('says 有休なし when there is no PTO', () => {
    const s: Streak = { ...silverWeek, end: '2026-09-23', length: 5, ptoDays: [], boosted: false }
    const lines = shareText({ year: 2026, streak: s, appUrl: URL }).split('\n')
    expect(lines[0]).toBe('【2026年】9/19(土)〜9/23(水) 5連休（シルバーウィーク）')
    expect(lines[1]).toBe('有休なし')
  })

  it('omits the parenthesis when the streak has no name', () => {
    const s: Streak = { start: '2026-10-10', end: '2026-10-12', length: 3, ptoDays: [], boosted: false }
    const [head] = shareLines({ year: 2026, streak: s, appUrl: URL })
    expect(head).toBe('【2026年】10/10(土)〜10/12(月) 3連休')
    expect(head).not.toContain('（')
  })

  it('never exceeds three lines, even with many PTO days', () => {
    const s: Streak = {
      start: '2026-04-25',
      end: '2026-05-10',
      length: 16,
      name: 'GW',
      ptoDays: ['2026-04-27', '2026-04-28', '2026-04-30', '2026-05-01', '2026-05-07', '2026-05-08'],
      boosted: true,
    }
    const text = shareText({ year: 2026, streak: s, appUrl: URL })
    expect(text.split('\n')).toHaveLength(3)
    expect(text).toContain('（6日）')
    expect(text.endsWith(URL)).toBe(true)
  })

  it('keeps the app name when the URL is empty', () => {
    const [, , footer] = shareLines({ year: 2026, streak: silverWeek, appUrl: '' })
    expect(footer).toBe('日付のミカタ')
  })

  it('uses the display year even when the streak crosses New Year', () => {
    const s: Streak = { start: '2025-12-27', end: '2026-01-04', length: 9, name: '年末年始', ptoDays: [], boosted: false }
    expect(shareLines({ year: 2026, streak: s, appUrl: URL })[0]).toBe('【2026年】12/27(土)〜1/4(日) 9連休（年末年始）')
  })
})
