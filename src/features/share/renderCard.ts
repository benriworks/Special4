import { parseISO, type ISODate, type Streak } from '../../core/holidays'
import { formatRangeShort, weekdayJa } from '../../core/jpdate'
import {
  chipPositions,
  fitText,
  hatchSegments,
  planChips,
  ptoLine,
  ptoLineShort,
  resolvePalette,
  streakDays,
} from './layout'
import { APP_NAME } from './shareText'

export interface ShareCardInput {
  year: number
  streak: Streak
  /** Absolute URL that reproduces this view (hash included). */
  appUrl: string
  theme: 'light' | 'dark'
}

export const CARD_WIDTH = 1200
export const CARD_HEIGHT = 630

type PaletteKey =
  | 'bg'
  | 'surface'
  | 'text'
  | 'textMuted'
  | 'ribbon'
  | 'onRibbon'
  | 'pto'
  | 'onPto'
  | 'ptoBorder'
  | 'secondary'
  | 'border'
type Palette = Record<PaletteKey, string>

const TOKENS: Palette = {
  bg: '--color-bg',
  surface: '--color-surface',
  text: '--color-text',
  textMuted: '--color-text-muted',
  ribbon: '--color-holiday-ribbon',
  onRibbon: '--color-on-holiday',
  pto: '--color-pto',
  onPto: '--color-on-pto',
  ptoBorder: '--color-pto-border',
  secondary: '--color-secondary',
  border: '--color-border',
}

/* Fallback values from DESIGN_SPEC §7 — used only when the CSS tokens are not
 * available (e.g. the stylesheet failed to load). This is the only file in the
 * app allowed to contain color literals. */
const FALLBACK: Record<'light' | 'dark', Palette> = {
  light: {
    bg: '#FBFBF9',
    surface: '#FFFFFF',
    text: '#1B1F2A',
    textMuted: '#5C6370',
    ribbon: '#C8102E',
    onRibbon: '#FFFFFF',
    pto: '#F2B01E',
    onPto: '#1B1F2A',
    ptoBorder: 'rgba(27, 31, 42, 0.4)',
    secondary: '#3558A2',
    border: 'rgba(27, 31, 42, 0.14)',
  },
  dark: {
    bg: '#101826',
    surface: '#172033',
    text: '#ECEEF2',
    textMuted: '#A3ACBA',
    ribbon: '#D42A45',
    onRibbon: '#FFFFFF',
    pto: '#F2B01E',
    onPto: '#1B1F2A',
    ptoBorder: 'rgba(236, 238, 242, 0.5)',
    secondary: '#8FB3F0',
    border: 'rgba(236, 238, 242, 0.14)',
  },
}

/** DESIGN_SPEC §8 font stack (self-hosted Zen Kaku Gothic New + system fallbacks). */
const FONT_FAMILY =
  '"Zen Kaku Gothic New", "Hiragino Sans", "Yu Gothic UI", "Noto Sans JP", system-ui, sans-serif'
const PRIMARY_FONT = 'Zen Kaku Gothic New'

// Layout constants (px on the 1200×630 canvas)
const MARGIN = 72
const YEAR_SIZE = 28
const YEAR_BASELINE = 104
const BADGE_TOP = 72
const BADGE_HEIGHT = 36
const BADGE_PAD_X = 14
const BADGE_FONT_SIZE = 20
const RULE_Y = 128
const HEADLINE_SIZE = 160
const HEADLINE_BASELINE = 300
const NAME_SIZE = 40
const NAME_GAP = 24
const RANGE_SIZE = 44
const RANGE_BASELINE = 372
const CHIP_TOP = 420
const CHIP_SIZE = 56
const CHIP_GAP = 8
const CHIP_RADIUS = 8
const CHIP_MAX = 16
const CHIP_KEEP = 14
const CHIP_DAY_SIZE = 24
const CHIP_WEEKDAY_SIZE = 15
const HATCH_STEP = 8
const HATCH_ALPHA = 0.18
const BOTTOM_BASELINE = 558
const PTO_SIZE = 28
const URL_SIZE = 22
const URL_MAX_WIDTH = 480
const BOTTOM_GAP = 32
const FONT_TIMEOUT_MS = 3000

function font(weight: 400 | 700, size: number): string {
  return `${weight} ${size}px ${FONT_FAMILY}`
}

function readPalette(theme: 'light' | 'dark'): Palette {
  const fallback = FALLBACK[theme]
  if (typeof document === 'undefined' || typeof getComputedStyle !== 'function') return fallback
  const root = document.documentElement
  // Tokens are defined per data-theme on <html>; when the requested theme is not
  // the one currently applied, the computed values would be the wrong theme.
  const rootTheme = root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'
  if (rootTheme !== theme) return fallback
  try {
    const cs = getComputedStyle(root)
    return resolvePalette(fallback, TOKENS, (t) => cs.getPropertyValue(t))
  } catch {
    return fallback
  }
}

/** Ask for the weights we draw with, then wait for fonts — but never longer than FONT_TIMEOUT_MS, and never throw. */
async function ensureFonts(): Promise<void> {
  try {
    if (typeof document === 'undefined' || !document.fonts) return
    const fonts = document.fonts
    const loads = [font(400, 16), font(700, 16)].map((f) =>
      fonts.load(f.replace(FONT_FAMILY, `"${PRIMARY_FONT}"`)).catch(() => []),
    )
    const timeout = new Promise<void>((resolve) => setTimeout(resolve, FONT_TIMEOUT_MS))
    await Promise.race([Promise.all(loads).then(() => fonts.ready).then(() => undefined), timeout])
  } catch {
    /* draw with whatever font is available */
  }
}

function roundedRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2))
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.lineTo(x + w - rr, y)
  ctx.arcTo(x + w, y, x + w, y + rr, rr)
  ctx.lineTo(x + w, y + h - rr)
  ctx.arcTo(x + w, y + h, x + w - rr, y + h, rr)
  ctx.lineTo(x + rr, y + h)
  ctx.arcTo(x, y + h, x, y + h - rr, rr)
  ctx.lineTo(x, y + rr)
  ctx.arcTo(x, y, x + rr, y, rr)
  ctx.closePath()
}

function measure(ctx: CanvasRenderingContext2D, text: string): number {
  try {
    return ctx.measureText(text).width
  } catch {
    return 0
  }
}

function drawTopRow(ctx: CanvasRenderingContext2D, p: Palette, year: number): void {
  // Year, top-left
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = p.textMuted
  ctx.font = font(400, YEAR_SIZE)
  ctx.fillText(`${year}年`, MARGIN, YEAR_BASELINE)

  // App name badge, top-right
  ctx.font = font(700, BADGE_FONT_SIZE)
  const w = measure(ctx, APP_NAME) + BADGE_PAD_X * 2
  const x = CARD_WIDTH - MARGIN - w
  roundedRectPath(ctx, x + 0.5, BADGE_TOP + 0.5, w - 1, BADGE_HEIGHT - 1, BADGE_HEIGHT / 2)
  ctx.fillStyle = p.surface
  ctx.fill()
  ctx.strokeStyle = p.secondary
  ctx.lineWidth = 1
  ctx.stroke()
  ctx.fillStyle = p.secondary
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(APP_NAME, x + w / 2, BADGE_TOP + BADGE_HEIGHT / 2)

  // Hairline rule
  ctx.strokeStyle = p.border
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(MARGIN, RULE_Y + 0.5)
  ctx.lineTo(CARD_WIDTH - MARGIN, RULE_Y + 0.5)
  ctx.stroke()
}

function drawHeadline(ctx: CanvasRenderingContext2D, p: Palette, streak: Streak): void {
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = p.text
  ctx.font = font(700, HEADLINE_SIZE)
  const headline = `${streak.length}連休`
  ctx.fillText(headline, MARGIN, HEADLINE_BASELINE)

  if (streak.name) {
    const x = MARGIN + measure(ctx, headline) + NAME_GAP
    const maxW = CARD_WIDTH - MARGIN - x
    if (maxW > NAME_SIZE) {
      ctx.font = font(700, NAME_SIZE)
      ctx.fillStyle = p.textMuted
      ctx.fillText(fitText(streak.name, maxW, (s) => measure(ctx, s)), x, HEADLINE_BASELINE)
    }
  }

  ctx.font = font(400, RANGE_SIZE)
  ctx.fillStyle = p.text
  const range = formatRangeShort(streak.start, streak.end)
  ctx.fillText(fitText(range, CARD_WIDTH - MARGIN * 2, (s) => measure(ctx, s)), MARGIN, RANGE_BASELINE)
}

function drawChip(ctx: CanvasRenderingContext2D, p: Palette, x: number, date: ISODate, isPto: boolean): void {
  const y = CHIP_TOP
  const s = CHIP_SIZE
  roundedRectPath(ctx, x, y, s, s, CHIP_RADIUS)
  ctx.fillStyle = isPto ? p.pto : p.ribbon
  ctx.fill()

  if (isPto) {
    // Diagonal hatch (meaning is not carried by color alone) …
    ctx.save()
    roundedRectPath(ctx, x, y, s, s, CHIP_RADIUS)
    ctx.clip()
    ctx.globalAlpha = HATCH_ALPHA
    ctx.strokeStyle = p.onPto
    ctx.lineWidth = 2
    ctx.beginPath()
    for (const seg of hatchSegments(s, s, HATCH_STEP)) {
      ctx.moveTo(x + seg.x1, y + seg.y1)
      ctx.lineTo(x + seg.x2, y + seg.y2)
    }
    ctx.stroke()
    ctx.restore()
    // … plus the 1px ink border DESIGN_SPEC §7 requires on PTO fills.
    roundedRectPath(ctx, x + 0.5, y + 0.5, s - 1, s - 1, CHIP_RADIUS)
    ctx.strokeStyle = p.ptoBorder
    ctx.lineWidth = 1
    ctx.stroke()
  }

  ctx.fillStyle = isPto ? p.onPto : p.onRibbon
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = font(700, CHIP_DAY_SIZE)
  ctx.fillText(String(parseISO(date).d), x + s / 2, y + 22)
  ctx.font = font(400, CHIP_WEEKDAY_SIZE)
  ctx.fillText(weekdayJa(date), x + s / 2, y + 43)
}

function drawChips(ctx: CanvasRenderingContext2D, p: Palette, streak: Streak): void {
  const pto = new Set(streak.ptoDays)
  const plan = planChips(streakDays(streak), CHIP_MAX, CHIP_KEEP)
  const xs = chipPositions(plan.length, MARGIN, CHIP_SIZE, CHIP_GAP)
  plan.forEach((item, i) => {
    const x = xs[i]
    if (item.kind === 'item') {
      drawChip(ctx, p, x, item.value, pto.has(item.value))
    } else {
      ctx.fillStyle = p.textMuted
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = font(700, CHIP_DAY_SIZE)
      ctx.fillText('…', x + CHIP_SIZE / 2, CHIP_TOP + CHIP_SIZE / 2)
    }
  })
}

function drawBottomRow(ctx: CanvasRenderingContext2D, p: Palette, streak: Streak, appUrl: string): void {
  ctx.textBaseline = 'alphabetic'

  // URL, right-aligned, muted
  ctx.font = font(400, URL_SIZE)
  ctx.fillStyle = p.textMuted
  ctx.textAlign = 'right'
  const url = appUrl ? fitText(appUrl, URL_MAX_WIDTH, (s) => measure(ctx, s)) : ''
  const urlW = url ? measure(ctx, url) : 0
  if (url) ctx.fillText(url, CARD_WIDTH - MARGIN, BOTTOM_BASELINE)

  // PTO summary, left. Prefer the full list, fall back to the compact form, then truncate.
  ctx.font = font(400, PTO_SIZE)
  ctx.fillStyle = p.text
  ctx.textAlign = 'left'
  const maxW = CARD_WIDTH - MARGIN * 2 - urlW - (url ? BOTTOM_GAP : 0)
  const m = (s: string) => measure(ctx, s)
  let line = ptoLine(streak.ptoDays, false)
  if (m(line) > maxW) line = ptoLineShort(streak.ptoDays.length)
  ctx.fillText(fitText(line, maxW, m), MARGIN, BOTTOM_BASELINE)
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  const maybeOffscreen = canvas as HTMLCanvasElement & {
    convertToBlob?: (options?: { type?: string }) => Promise<Blob>
  }
  if (typeof maybeOffscreen.convertToBlob === 'function') {
    return maybeOffscreen.convertToBlob({ type: 'image/png' })
  }
  return new Promise<Blob>((resolve, reject) => {
    try {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob)
        else reject(new Error('canvas.toBlob returned null'))
      }, 'image/png')
    } catch (e) {
      reject(e instanceof Error ? e : new Error(String(e)))
    }
  })
}

/**
 * Render the 1200×630 share card as a PNG blob. Colors come from the live CSS
 * tokens (falling back to DESIGN_SPEC values); fonts are awaited but a missing
 * web font never makes this reject — only a missing Canvas 2D context does.
 */
export async function renderShareCard(input: ShareCardInput): Promise<Blob> {
  if (typeof document === 'undefined') throw new Error('renderShareCard needs a DOM')
  await ensureFonts()

  const canvas = document.createElement('canvas')
  canvas.width = CARD_WIDTH
  canvas.height = CARD_HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D is not available')

  const p = readPalette(input.theme)
  ctx.fillStyle = p.bg
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT)

  drawTopRow(ctx, p, input.year)
  drawHeadline(ctx, p, input.streak)
  drawChips(ctx, p, input.streak)
  drawBottomRow(ctx, p, input.streak, input.appUrl)

  return canvasToBlob(canvas)
}
