import { useId, useRef, useState, type KeyboardEvent, type ReactElement } from 'react'
import type { ISODate, OffSettings } from '../../core/holidays'
import { BizDaysPanel } from './BizDaysPanel'
import { HolidaySettings } from './HolidaySettings'
import { WarekiPanel } from './WarekiPanel'
import './tools.css'

export interface ToolsPanelProps {
  settings: OffSettings
  onChangeSettings: (next: OffSettings) => void
  /** Today's date in JST, 'YYYY-MM-DD'. */
  today: ISODate
  /** Passed as { referenceDate } to core holiday functions. */
  referenceDate: ISODate
}

type TabKey = 'bizdays' | 'wareki' | 'settings'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'bizdays', label: '営業日を数える' },
  { key: 'wareki', label: '和暦・年齢' },
  { key: 'settings', label: '休みの設定' },
]

/** ツール section: tablist with business-day calculator, wareki / age, and holiday settings. */
export function ToolsPanel({ settings, onChangeSettings, today, referenceDate }: ToolsPanelProps): ReactElement {
  const base = useId()
  const [active, setActive] = useState<TabKey>('bizdays')
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  const tabId = (k: TabKey) => `${base}-tab-${k}`
  const panelId = (k: TabKey) => `${base}-panel-${k}`

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const current = TABS.findIndex((t) => t.key === active)
    let next = current
    if (e.key === 'ArrowRight') next = (current + 1) % TABS.length
    else if (e.key === 'ArrowLeft') next = (current - 1 + TABS.length) % TABS.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = TABS.length - 1
    else return
    e.preventDefault()
    setActive(TABS[next].key)
    tabRefs.current[next]?.focus()
  }

  return (
    <section className="tools" aria-labelledby={`${base}-heading`}>
      <h2 id={`${base}-heading`}>ツール</h2>
      <div className="tabs" role="tablist" aria-label="ツール" onKeyDown={onKeyDown}>
        {TABS.map((t, i) => {
          const selected = t.key === active
          return (
            <button
              key={t.key}
              ref={(el) => {
                tabRefs.current[i] = el
              }}
              type="button"
              role="tab"
              id={tabId(t.key)}
              className="tab"
              aria-selected={selected}
              aria-controls={panelId(t.key)}
              tabIndex={selected ? 0 : -1}
              data-testid={`tools-tab-${t.key}`}
              onClick={() => setActive(t.key)}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      <div role="tabpanel" id={panelId('bizdays')} aria-labelledby={tabId('bizdays')} hidden={active !== 'bizdays'} className="tools__panel card card--lg">
        <BizDaysPanel settings={settings} today={today} referenceDate={referenceDate} />
      </div>
      <div role="tabpanel" id={panelId('wareki')} aria-labelledby={tabId('wareki')} hidden={active !== 'wareki'} className="tools__panel card card--lg">
        <WarekiPanel today={today} />
      </div>
      <div role="tabpanel" id={panelId('settings')} aria-labelledby={tabId('settings')} hidden={active !== 'settings'} className="tools__panel card card--lg">
        <HolidaySettings settings={settings} onChangeSettings={onChangeSettings} today={today} />
      </div>
    </section>
  )
}
