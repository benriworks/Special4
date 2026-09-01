// Simulates GitHub Pages serving the repository root unbuilt ("Deploy from a branch") and
// asserts the fallback message appears. Usage: node scripts/check-unbuilt-fallback.mjs <url>
import { existsSync } from 'node:fs'
import { chromium } from '@playwright/test'
const url = process.argv[2]
const executablePath = existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined
const browser = await chromium.launch({ executablePath })
const page = await browser.newPage()
await page.goto(url)
await page.waitForTimeout(5000)
const text = await page.locator('#root').innerText()
console.log(text.includes('アプリを読み込めませんでした') ? 'FALLBACK OK' : 'FALLBACK MISSING', '\n', text.slice(0, 200))
await browser.close()
