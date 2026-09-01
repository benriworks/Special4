import { expect, test, type Page } from '@playwright/test'

async function watchErrors(page: Page) {
  const errors: string[] = []
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('response', (r) => r.status() >= 400 && errors.push(`${r.status()} ${r.url()}`))
  return errors
}

test.describe('連休マップ', () => {
  test('2026: hero stats, ribbons and the Silver Week banner', async ({ page }) => {
    const errors = await watchErrors(page)
    await page.goto('/Special4/#y=2026&pto=0&mode=longest&wk=sat-sun')
    await expect(page.getByTestId('title')).toContainText('日付のミカタ')
    await expect(page.getByTestId('stat-total')).toContainText('121')
    await expect(page.getByTestId('stat-streaks')).toContainText('8')
    await expect(page.getByTestId('stat-longest')).toContainText('5')
    await expect(page.getByTestId('ribbon')).toHaveCount(8)
    await expect(page.getByTestId('ribbon').filter({ hasText: 'GW' })).toHaveCount(1)
    expect(errors).toEqual([])
  })

  test('moving the PTO slider extends ribbons and rolls the numbers', async ({ page }) => {
    await page.goto('/Special4/#y=2027&pto=0&mode=longest&wk=sat-sun')
    const before = Number(await page.getByTestId('stat-total').getAttribute('data-value'))
    const slider = page.getByTestId('pto-slider')
    await slider.focus()
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('pto-value')).toHaveText('2日')
    await expect(page.getByTestId('hero-summary')).toContainText('有休2日')
    // total off days grow by exactly the PTO placed
    await expect(page.getByTestId('stat-total')).toHaveAttribute('data-value', String(before + 2))
    // the URL now carries the state
    expect(page.url()).toContain('pto=2')
    // PTO day cells appear in the map
    await expect(page.locator('.day--pto')).toHaveCount(2)
  })

  test('URL hash restores year, PTO and weekend rule; select changes the year', async ({ page }) => {
    await page.goto('/Special4/#y=2019&pto=3&mode=more3&wk=sun')
    await expect(page.getByTestId('year-select')).toHaveValue('2019')
    await expect(page.getByTestId('pto-value')).toHaveText('3日')
    await expect(page.locator('#map-heading')).toHaveText('2019年の連休マップ')
    // 2019 Golden Week was 10 days with sat-sun; with sun-only weekends 4/29–5/6 is 8 days
    await expect(page.getByTestId('ribbon').filter({ hasText: 'GW' })).toHaveCount(1)
    await page.getByTestId('year-select').selectOption('2024')
    await expect(page.locator('#map-heading')).toHaveText('2024年の連休マップ')
    expect(page.url()).toContain('y=2024')
  })

  test('ribbon opens the streak sheet; Esc closes it', async ({ page }) => {
    await page.goto('/Special4/#y=2026&pto=0&mode=longest&wk=sat-sun')
    await page.getByTestId('ribbon').filter({ hasText: 'GW' }).click()
    const sheet = page.getByTestId('streak-sheet')
    await expect(sheet).toBeVisible()
    await expect(sheet).toContainText('GW 5連休')
    await expect(sheet.getByTestId('streak-detail')).toContainText('2026年5月2日(土)〜5月6日(水)')
    await expect(sheet.getByTestId('streak-detail')).toContainText('憲法記念日')
    await page.keyboard.press('Escape')
    await expect(sheet).toBeHidden()
  })

  test('day cells: keyboard navigation and day detail', async ({ page }) => {
    await page.goto('/Special4/#y=2026&pto=0&mode=longest&wk=sat-sun')
    const cell = page.locator('#day-2026-09-21')
    await cell.focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.locator('#day-2026-09-22')).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(page.locator('#day-2026-09-29')).toBeFocused()
    await page.keyboard.press('PageDown')
    await expect(page.locator('#day-2026-10-29')).toBeFocused()
    await page.locator('#day-2026-09-22').click()
    const sheet = page.getByTestId('day-sheet')
    await expect(sheet).toBeVisible()
    await expect(sheet).toContainText('国民の休日')
    await expect(sheet).toContainText('令和8年9月22日')
  })

  test('theme toggle switches data-theme and persists', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await page.goto('/Special4/')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    await page.getByTestId('theme-toggle').click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  })

  test('no horizontal overflow', async ({ page }) => {
    await page.goto('/Special4/#y=2026&pto=5&mode=longest&wk=sat-sun&off=1229-0103:年末年始')
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow).toBeLessThanOrEqual(0)
  })
})
