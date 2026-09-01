import { DEFAULT_SETTINGS, daysInMonth, type CustomRange, type OffSettings, type WeekendRule } from '../../core/holidays'
import { PTO_MAX, type PtoMode } from '../../core/pto'
import { YEAR_MAX, YEAR_MIN, type AppState } from './types'

/**
 * URL hash ⇄ state. Format: #y=2026&pto=3&mode=longest&wk=sat-sun&off=1229-0103:年末年始,0813-0816:お盆
 * Every field is optional; invalid values are ignored.
 */
const WEEKENDS: WeekendRule[] = ['sat-sun', 'sun', 'none']
const MODES: PtoMode[] = ['longest', 'more3']

function isValidMD(md: string): boolean {
  const m = Number(md.slice(0, 2))
  const d = Number(md.slice(3, 5))
  return /^\d{2}-\d{2}$/.test(md) && m >= 1 && m <= 12 && d >= 1 && d <= daysInMonth(2024, m)
}

export function encodeRanges(ranges: CustomRange[]): string {
  return ranges.map((r) => `${r.from.replace('-', '')}-${r.to.replace('-', '')}:${r.label}`).join(',')
}

export function decodeRanges(s: string): CustomRange[] {
  const out: CustomRange[] = []
  for (const part of s.split(',')) {
    if (!part) continue
    const m = /^(\d{4})-(\d{4})(?::(.{1,12}))?$/.exec(part)
    if (!m) continue
    const from = `${m[1].slice(0, 2)}-${m[1].slice(2)}`
    const to = `${m[2].slice(0, 2)}-${m[2].slice(2)}`
    if (!isValidMD(from) || !isValidMD(to)) continue
    out.push({ from, to, label: m[3] ?? '休業日' })
  }
  return out
}

export function parseHash(hash: string): Partial<AppState> {
  const q = new URLSearchParams(hash.replace(/^#/, ''))
  const out: Partial<AppState> = {}
  const y = Number(q.get('y'))
  if (Number.isInteger(y) && y >= YEAR_MIN && y <= YEAR_MAX) out.year = y
  const pto = Number(q.get('pto'))
  if (q.has('pto') && Number.isInteger(pto) && pto >= 0 && pto <= PTO_MAX) out.pto = pto
  const mode = q.get('mode') as PtoMode | null
  if (mode && MODES.includes(mode)) out.mode = mode
  const wk = q.get('wk') as WeekendRule | null
  const off = q.get('off')
  if ((wk && WEEKENDS.includes(wk)) || off !== null) {
    const settings: OffSettings = {
      weekend: wk && WEEKENDS.includes(wk) ? wk : DEFAULT_SETTINGS.weekend,
      customRanges: off !== null ? decodeRanges(off) : [],
    }
    out.settings = settings
  }
  return out
}

export function buildHash(state: AppState): string {
  const q = new URLSearchParams()
  q.set('y', String(state.year))
  q.set('pto', String(state.pto))
  q.set('mode', state.mode)
  q.set('wk', state.settings.weekend)
  if (state.settings.customRanges.length) q.set('off', encodeRanges(state.settings.customRanges))
  return `#${q.toString()}`
}
