// Render PWA icons + OG image from SVG/HTML with the bundled Chromium (no image libraries needed).
// Usage: node scripts/gen-icons.mjs
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { chromium } from '@playwright/test'

const executablePath = existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined
const svg = readFileSync('public/favicon.svg', 'utf8')
mkdirSync('public/icons', { recursive: true })

const browser = await chromium.launch({ executablePath })
const page = await browser.newPage()

async function shotSvg(size, file, { pad = 0, bg = 'transparent' } = {}) {
  await page.setViewportSize({ width: size, height: size })
  const inner = size - pad * 2
  await page.setContent(
    `<html><body style="margin:0;background:${bg};width:${size}px;height:${size}px;display:grid;place-items:center">
       <div style="width:${inner}px;height:${inner}px">${svg.replace('<svg ', `<svg width="${inner}" height="${inner}" `)}</div>
     </body></html>`,
  )
  const buf = await page.screenshot({ omitBackground: bg === 'transparent', clip: { x: 0, y: 0, width: size, height: size } })
  writeFileSync(file, buf)
  console.log('saved', file, buf.length, 'bytes')
}

await shotSvg(192, 'public/icons/icon-192.png')
await shotSvg(512, 'public/icons/icon-512.png')
await shotSvg(512, 'public/icons/maskable-512.png', { pad: 64, bg: '#FBFBF9' })
await shotSvg(180, 'public/icons/apple-touch-icon.png', { pad: 14, bg: '#FBFBF9' })

// OG image 1200×630
await page.setViewportSize({ width: 1200, height: 630 })
const fontCss = readFileSync('src/assets/fonts/fonts.css', 'utf8').replace(/url\(\.\//g, 'url(file://' + process.cwd() + '/src/assets/fonts/')
await page.setContent(`<html><head><style>
${fontCss}
body{margin:0;width:1200px;height:630px;background:#FBFBF9;color:#1B1F2A;font-family:'Zen Kaku Gothic New',sans-serif;position:relative;overflow:hidden}
.wrap{position:absolute;inset:0;padding:72px 80px;display:flex;flex-direction:column;justify-content:space-between}
.brand{display:flex;align-items:center;gap:18px;font-size:30px;font-weight:700}
.brand svg{width:56px;height:56px}
h1{margin:0;font-size:76px;line-height:1.15;font-weight:700;letter-spacing:-.01em}
p{margin:0;font-size:30px;color:#5C6370}
.grid{display:grid;grid-template-columns:repeat(14,1fr);gap:8px;margin-top:28px}
.d{height:52px;border-radius:8px;background:#fff;border:1px solid rgba(27,31,42,.14);display:flex;align-items:center;justify-content:center;font-size:22px;font-variant-numeric:tabular-nums}
.d.h{color:#C8102E;font-weight:700}.d.s{color:#3558A2}
.rib{position:absolute;left:0;right:0;bottom:-14px;height:18px;border-radius:4px;background:#C8102E}
.pto{background:#F2B01E;background-image:repeating-linear-gradient(135deg,transparent 0 4px,rgba(27,31,42,.4) 4px 5px);color:#1B1F2A;font-weight:700;box-shadow:inset 0 0 0 1px rgba(27,31,42,.4)}
.row{position:relative}
</style></head><body><div class="wrap">
 <div class="brand">${svg}<span>日付のミカタ</span></div>
 <div>
  <h1>有休1日で、<br>連休はもっと伸びる。</h1>
  <p style="margin-top:18px">日本の祝日法を端末内で計算する、年間連休マップ</p>
 </div>
 <div class="row">
  <div class="grid">
   <div class="d">14</div><div class="d">15</div><div class="d">16</div><div class="d">17</div><div class="d">18</div><div class="d s">19</div><div class="d h">20</div>
   <div class="d h">21</div><div class="d h">22</div><div class="d h">23</div><div class="d pto">24</div><div class="d pto">25</div><div class="d s">26</div><div class="d h">27</div>
  </div>
 </div>
</div></body></html>`)
await page.waitForTimeout(300)
const og = await page.screenshot({ clip: { x: 0, y: 0, width: 1200, height: 630 } })
writeFileSync('public/og.png', og)
console.log('saved public/og.png', og.length, 'bytes')
await browser.close()
