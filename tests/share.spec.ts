import { expect, test } from '@playwright/test'

test.describe('連休カード', () => {
  test('sheet renders a 1200×630 PNG preview, share text and a download link', async ({ page }) => {
    await page.goto('/Special4/#y=2026&pto=2&mode=longest&wk=sat-sun')
    await page.getByTestId('ribbon').filter({ hasText: '5連休' }).first().click()
    const sheet = page.getByTestId('streak-sheet')
    await expect(sheet).toBeVisible()
    const img = sheet.getByTestId('share-preview')
    await expect(img).toBeVisible({ timeout: 15_000 })
    await expect.poll(() => img.evaluate((el) => (el as HTMLImageElement).naturalWidth)).toBe(1200)
    await expect(sheet.getByTestId('share-text')).toContainText('日付のミカタ')
    await expect(sheet.getByTestId('share-text')).toContainText('連休')
    const save = sheet.getByTestId('share-save')
    await expect(save).toHaveAttribute('download', /^hizuke-2026-\d{4}-\d{4}\.png$/)
    await expect(save).toHaveAttribute('href', /^blob:/)
    await sheet.getByTestId('share-copy').click()
    await expect(page.locator('.toast-region')).toContainText(/コピー/)
  })
})
