// Capture screenshots of the built app (dist/) at mobile + desktop, light + dark.
// Usage: node scripts/screenshots.mjs [outDir] [route ...]
//   routes are appended to the base URL, e.g. "#/design" (default: "")
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync } from 'node:fs'
import { chromium } from '@playwright/test'

const [outDir = 'shots', ...routes] = process.argv.slice(2)
if (routes.length === 0) routes.push('')
mkdirSync(outDir, { recursive: true })

const PORT = 4174
const BASE = `http://127.0.0.1:${PORT}/Special4/`
const executablePath = existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined

const server = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'], {
  stdio: 'ignore',
})
const waitFor = async (url, ms = 30_000) => {
  const t0 = Date.now()
  while (Date.now() - t0 < ms) {
    try {
      const r = await fetch(url)
      if (r.ok) return
    } catch {}
    await new Promise((r) => setTimeout(r, 200))
  }
  throw new Error(`server did not start: ${url}`)
}

try {
  await waitFor(BASE)
  const browser = await chromium.launch({ executablePath })
  const viewports = [
    { name: 'desktop', width: 1280, height: 800 },
    { name: 'mobile', width: 375, height: 812 },
  ]
  for (const scheme of ['light', 'dark']) {
    for (const vp of viewports) {
      const ctx = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        colorScheme: scheme,
        deviceScaleFactor: 1,
        locale: 'ja-JP',
        reducedMotion: 'reduce',
      })
      const page = await ctx.newPage()
      const errors = []
      page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
      page.on('pageerror', (e) => errors.push(e.message))
      for (const route of routes) {
        await page.goto(BASE + route, { waitUntil: 'networkidle' })
        await page.waitForTimeout(400)
        const slug = route.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'home'
        const file = `${outDir}/${slug}-${vp.name}-${scheme}.png`
        await page.screenshot({ path: file, fullPage: true })
        console.log('saved', file)
      }
      if (errors.length) console.log(`console errors (${vp.name}/${scheme}):`, errors)
      await ctx.close()
    }
  }
  await browser.close()
} finally {
  server.kill()
}
