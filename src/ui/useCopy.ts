import { useCallback } from 'react'
import { useToast } from './toast'

async function writeClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    /* fall through to legacy path */
  }
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}

/** Copy text to the clipboard and confirm with a toast. */
export function useCopy() {
  const toast = useToast()
  return useCallback(
    async (text: string, label = 'コピーしました') => {
      const ok = await writeClipboard(text)
      toast.show(ok ? label : 'コピーできませんでした。テキストを選択して手動でコピーしてください。')
      return ok
    },
    [toast],
  )
}
