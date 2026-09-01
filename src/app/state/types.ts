import type { OffSettings } from '../../core/holidays'
import type { PtoMode } from '../../core/pto'

export interface AppState {
  year: number
  /** Paid-leave days to place, 0–10. */
  pto: number
  mode: PtoMode
  settings: OffSettings
}

export type Theme = 'light' | 'dark'

export const YEAR_MIN = 1970
export const YEAR_MAX = 2050
