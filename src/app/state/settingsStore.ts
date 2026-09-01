import { DEFAULT_SETTINGS, type CustomRange, type OffSettings } from '../../core/holidays'
import { PTO_MAX, type PtoMode } from '../../core/pto'
import type { Theme } from './types'
import { isValidMD, sanitizeLabel } from './urlState'

const KEY = 'hizuke.v1'
const THEME_KEY = 'hizuke.theme'

export interface StoredPrefs {
  pto?: number
  mode?: PtoMode
  settings?: OffSettings
}

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* private mode / quota — ignore */
  }
}

/** Validate whatever was stored (possibly by an older version or by hand) into a clean StoredPrefs. */
export function sanitizePrefs(input: unknown): StoredPrefs {
  if (!input || typeof input !== 'object') return {}
  const p = input as Record<string, unknown>
  const out: StoredPrefs = {}
  if (typeof p.pto === 'number' && Number.isFinite(p.pto) && p.pto >= 0 && p.pto <= PTO_MAX) out.pto = Math.trunc(p.pto)
  if (p.mode === 'longest' || p.mode === 'more3') out.mode = p.mode
  if (p.settings && typeof p.settings === 'object') {
    const st = p.settings as Record<string, unknown>
    const wk = st.weekend
    const ranges: CustomRange[] = []
    if (Array.isArray(st.customRanges)) {
      for (const r of st.customRanges as unknown[]) {
        if (!r || typeof r !== 'object') continue
        const { from, to, label } = r as Record<string, unknown>
        if (typeof from !== 'string' || typeof to !== 'string' || !isValidMD(from) || !isValidMD(to)) continue
        ranges.push({ from, to, label: sanitizeLabel(label) })
        if (ranges.length >= 20) break
      }
    }
    out.settings = {
      weekend: wk === 'sat-sun' || wk === 'sun' || wk === 'none' ? wk : DEFAULT_SETTINGS.weekend,
      customRanges: ranges,
    }
  }
  return out
}

export function loadPrefs(): StoredPrefs {
  const raw = safeGet(KEY)
  if (!raw) return {}
  try {
    return sanitizePrefs(JSON.parse(raw))
  } catch {
    return {}
  }
}

export function savePrefs(p: StoredPrefs) {
  safeSet(KEY, JSON.stringify(p))
}

export function loadTheme(): Theme | null {
  const t = safeGet(THEME_KEY)
  return t === 'light' || t === 'dark' ? t : null
}

export function saveTheme(t: Theme) {
  safeSet(THEME_KEY, t)
}
