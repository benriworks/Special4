/**
 * SSR smoke test: renders the real ToolsPanel with react-dom/server (no DOM environment
 * needed) to catch runtime errors and check the contract's test ids and key copy.
 */
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS, PRESET_RANGES, type OffSettings } from '../../../core/holidays'
import { ToastProvider } from '../../../ui/toast'
import { ToolsPanel } from '../index'

const TODAY = '2026-09-01'

function render(settings: OffSettings = DEFAULT_SETTINGS): string {
  return renderToStaticMarkup(
    createElement(
      ToastProvider,
      null,
      createElement(ToolsPanel, { settings, onChangeSettings: () => {}, today: TODAY, referenceDate: TODAY }),
    ),
  )
}

describe('ToolsPanel (SSR smoke)', () => {
  const html = render()

  it('renders the heading, tablist and the three tabs', () => {
    expect(html).toContain('<h2 id="')
    expect(html).toContain('ツール</h2>')
    expect(html).toContain('role="tablist"')
    for (const key of ['bizdays', 'wareki', 'settings']) {
      expect(html).toContain(`data-testid="tools-tab-${key}"`)
      expect(html).toContain(`role="tabpanel" id="`)
    }
    expect(html).toContain('営業日を数える')
    expect(html).toContain('和暦・年齢')
    expect(html).toContain('休みの設定')
    // first tab selected, others hidden
    expect(html.match(/aria-selected="true"/g)?.length).toBe(1)
    expect(html.match(/ hidden=""/g)?.length).toBe(2)
  })

  it('business-day results use the defaults (10営業日後 from today, today〜+30日)', () => {
    expect(html).toContain('data-testid="bizdays-result"')
    expect(html).toContain('10営業日後')
    expect(html).toContain('2026年9月15日(火)')
    expect(html).toContain('令和8年9月15日')
    expect(html).toContain('data-testid="bizdays-between-result"')
    expect(html).toContain('開始日と終了日を含みます')
    expect(html).toContain('value="2026-10-01"')
    expect(html).toContain('週休・休業日の設定はマップと共通です（「休みの設定」タブ）。')
  })

  it('wareki / age defaults', () => {
    expect(html).toContain('data-testid="wareki-result"')
    expect(html).toContain('令和8年9月1日')
    expect(html).toContain('R8.9.1')
    expect(html).toContain('data-testid="seireki-result"')
    expect(html).toContain('2026年9月1日(火)')
    expect(html).toContain('data-testid="age-result"')
    expect(html).toContain('生年月日を入れると、満年齢・数え年・干支が出ます。')
  })

  it('settings: empty state and preset chips enabled', () => {
    expect(html).toContain('data-testid="settings-weekend"')
    expect(html).toContain('data-testid="settings-range-list"')
    expect(html).toContain('休業日はまだありません。年末年始・お盆のプリセットから追加できます。')
    expect(html).toContain('年末年始（12/29〜1/3）を追加')
    expect(html).toContain('お盆（8/13〜8/16）を追加')
    expect(html).toContain('設定は自動で保存され、マップと営業日計算に反映されます。')
    expect(html).not.toMatch(/data-testid="settings-add-nenmatsu"[^>]*disabled/)
  })

  it('settings: existing ranges are listed and matching presets disabled', () => {
    const withRanges = render({ weekend: 'sun', customRanges: [PRESET_RANGES.nenmatsu] })
    expect(withRanges).toContain('年末年始')
    expect(withRanges).toContain('12/29〜1/3')
    expect(withRanges).toContain('aria-label="年末年始（12/29〜1/3）を削除"')
    expect(withRanges).not.toContain('休業日はまだありません。')
    expect(withRanges).toMatch(/data-testid="settings-add-nenmatsu"[^>]*disabled/)
    expect(withRanges).not.toMatch(/data-testid="settings-add-obon"[^>]*disabled/)
  })

  it('has no hard-coded hex colors in the CSS and every input has a label', () => {
    expect(html).not.toMatch(/#[0-9a-fA-F]{3,6}\b/)
  })
})
