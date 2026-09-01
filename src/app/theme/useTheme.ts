import { useCallback, useEffect, useState } from 'react'
import { loadTheme, saveTheme } from '../state/settingsStore'
import type { Theme } from '../state/types'

function systemTheme(): Theme {
  return typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/** Theme = stored choice, else the OS preference. Applied as <html data-theme>. */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => loadTheme() ?? systemTheme())
  const [explicit, setExplicit] = useState<boolean>(() => loadTheme() !== null)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  // follow the OS until the user picks explicitly
  useEffect(() => {
    if (explicit) return
    const mq = matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => setTheme(mq.matches ? 'dark' : 'light')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [explicit])

  const toggle = useCallback(() => {
    setTheme((t) => {
      const next: Theme = t === 'dark' ? 'light' : 'dark'
      saveTheme(next)
      return next
    })
    setExplicit(true)
  }, [])

  return { theme, toggle }
}
