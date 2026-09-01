// Detailed screenshots for visual review / README: hero with PTO, each tools tab, the streak sheet and the generated share card.
// Usage: node scripts/screenshots-detail.mjs [outDir]
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { chromium } from '@playwright/test'
const out = process.argv[2] ?? 'shots'; mkdirSync(out, { recursive: true })
const PORT = 4175, BASE = `http://127.0.0.1:${PORT}/Special4/`
const server = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' })
const wait = async () => { for (let i = 0; i < 100; i++) { try { if ((await fetch(BASE)).ok) return } catch {} await new Promise(r => setTimeout(r, 200)) } throw new Error('no server') }
try {
  await wait()
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
  for (const [vp, w, h] of [['desktop', 1280, 900], ['mobile', 375, 812]]) {
    for (const scheme of ['light', 'dark']) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: scheme, locale: 'ja-JP', reducedMotion: 'reduce' })
      const page = await ctx.newPage()
      const errors = []
      page.on('console', m => m.type() === 'error' && errors.push(m.text())); page.on('pageerror', e => errors.push(e.message))
      await page.goto(BASE + '#y=2026&pto=3&mode=longest&wk=sat-sun&off=1229-0103:年末年始', { waitUntil: 'networkidle' })
      await page.waitForTimeout(300)
      await page.screenshot({ path: `${out}/hero-pto3-${vp}-${scheme}.png`, clip: { x: 0, y: 0, width: w, height: Math.min(h, 900) } })
      // tools tabs
      for (const tab of ['bizdays', 'wareki', 'settings']) {
        await page.getByTestId(`tools-tab-${tab}`).click()
        const sec = page.locator('section.tools')
        await sec.scrollIntoViewIfNeeded()
        await page.waitForTimeout(150)
        await sec.screenshot({ path: `${out}/tools-${tab}-${vp}-${scheme}.png` })
      }
      // share sheet
      await page.getByTestId('ribbon').filter({ hasText: 'GW' }).first().click()
      const sheet = page.getByTestId('streak-sheet')
      await sheet.getByTestId('share-preview').waitFor({ timeout: 15000 }).catch(() => {})
      await page.waitForTimeout(300)
      await page.screenshot({ path: `${out}/sheet-${vp}-${scheme}.png` })
      // save the generated card itself
      const src = await sheet.getByTestId('share-preview').getAttribute('src').catch(() => null)
      if (src) {
        const data = await page.evaluate(async (u) => { const b = await (await fetch(u)).blob(); return await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(b) }) }, src)
        const { writeFileSync } = await import('node:fs')
        writeFileSync(`${out}/card-${vp}-${scheme}.png`, Buffer.from(String(data).split(',')[1], 'base64'))
      }
      if (errors.length) console.log(vp, scheme, 'console errors:', errors)
      await ctx.close()
    }
  }
  await browser.close()
} finally { server.kill() }
console.log('done')
