import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react'
import { DEFAULT_SETTINGS, todayISO, type OffSettings } from '../../core/holidays'
import { PTO_MAX, type PtoMode } from '../../core/pto'
import { loadPrefs, savePrefs } from './settingsStore'
import { buildHash, parseHash } from './urlState'
import { YEAR_MAX, YEAR_MIN, type AppState } from './types'

type Action =
  | { type: 'year'; year: number }
  | { type: 'pto'; pto: number }
  | { type: 'mode'; mode: PtoMode }
  | { type: 'settings'; settings: OffSettings }
  | { type: 'hash'; patch: Partial<AppState> }

const clampYear = (y: number) => Math.min(YEAR_MAX, Math.max(YEAR_MIN, Math.trunc(y)))
const clampPto = (n: number) => Math.min(PTO_MAX, Math.max(0, Math.trunc(n)))

function reducer(state: AppState, a: Action): AppState {
  switch (a.type) {
    case 'year':
      return { ...state, year: clampYear(a.year) }
    case 'pto':
      return { ...state, pto: clampPto(a.pto) }
    case 'mode':
      return { ...state, mode: a.mode }
    case 'settings':
      return { ...state, settings: a.settings }
    case 'hash':
      return { ...state, ...a.patch }
  }
}

function initialState(today: string): AppState {
  const prefs = loadPrefs()
  const fromHash = typeof location !== 'undefined' ? parseHash(location.hash) : {}
  return {
    year: fromHash.year ?? Number(today.slice(0, 4)),
    pto: fromHash.pto ?? prefs.pto ?? 0,
    mode: fromHash.mode ?? prefs.mode ?? 'longest',
    settings: fromHash.settings ?? prefs.settings ?? DEFAULT_SETTINGS,
  }
}

export function useAppState() {
  const today = useMemo(() => todayISO(), [])
  const [state, dispatch] = useReducer(reducer, today, initialState)
  const lastHash = useRef('')

  // state → URL hash (replaceState: no history spam) + localStorage
  useEffect(() => {
    const hash = buildHash(state)
    if (hash !== location.hash) {
      lastHash.current = hash
      history.replaceState(null, '', hash)
    }
    savePrefs({ pto: state.pto, mode: state.mode, settings: state.settings })
  }, [state])

  // URL hash → state (pasted link, back/forward)
  useEffect(() => {
    const onHash = () => {
      if (location.hash === lastHash.current) return
      dispatch({ type: 'hash', patch: parseHash(location.hash) })
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const setYear = useCallback((year: number) => dispatch({ type: 'year', year }), [])
  const setPto = useCallback((pto: number) => dispatch({ type: 'pto', pto }), [])
  const setMode = useCallback((mode: PtoMode) => dispatch({ type: 'mode', mode }), [])
  const setSettings = useCallback((settings: OffSettings) => dispatch({ type: 'settings', settings }), [])

  return { state, today, setYear, setPto, setMode, setSettings }
}
