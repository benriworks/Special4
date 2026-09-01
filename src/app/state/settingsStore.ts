import { DEFAULT_SETTINGS, type OffSettings } from '../../core/holidays'
import { PTO_MAX, type PtoMode } from '../../core/pto'
import type { Theme } from './types'

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

export function loadPrefs(): StoredPrefs {
  const raw = safeGet(KEY)
  if (!raw) return {}
  try {
    const p = JSON.parse(raw) as StoredPrefs
    const out: StoredPrefs = {}
    if (typeof p.pto === 'number' && p.pto >= 0 && p.pto <= PTO_MAX) out.pto = Math.trunc(p.pto)
    if (p.mode === 'longest' || p.mode === 'more3') out.mode = p.mode
    if (p.settings && typeof p.settings === 'object') {
      const wk = p.settings.weekend
      out.settings = {
        weekend: wk === 'sat-sun' || wk === 'sun' || wk === 'none' ? wk : DEFAULT_SETTINGS.weekend,
        customRanges: Array.isArray(p.settings.customRanges)
          ? p.settings.customRanges.filter(
              (r) => r && typeof r.from === 'string' && typeof r.to === 'string' && typeof r.label === 'string',
            )
          : [],
      }
    }
    return out
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
