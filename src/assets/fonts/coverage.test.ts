import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/** Every non-ASCII character in the source must exist in the subset font glyph list. */
function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) {
      if (!p.includes('assets/fonts')) walk(p, out)
    } else if (/\.(tsx?|html)$/.test(name) && !name.endsWith('.test.ts')) out.push(p)
  }
  return out
}

describe('subset font coverage', () => {
  it('covers every character used in the UI source', () => {
    const glyphs = new Set(readFileSync(join(process.cwd(), 'src/assets/fonts/glyphs.txt'), 'utf8'))
    const missing = new Set<string>()
    for (const f of [...walk(join(process.cwd(), 'src')), join(process.cwd(), 'index.html')]) {
      for (const ch of readFileSync(f, 'utf8')) {
        if (ch.charCodeAt(0) > 0x7e && !/\s/.test(ch) && !glyphs.has(ch)) missing.add(ch)
      }
    }
    expect([...missing].join(''), 'run: python3 scripts/subset-fonts.py').toBe('')
  })
})
