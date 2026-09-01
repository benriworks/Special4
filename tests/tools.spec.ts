import { expect, test } from '@playwright/test'

test.describe('ツール', () => {
  test('営業日計算', async ({ page }) => {
    await page.goto('/Special4/#y=2026&pto=0&mode=longest&wk=sat-sun')
    await page.getByTestId('tools-tab-bizdays').click()
    await page.getByTestId('bizdays-basis').fill('2026-09-01')
    await page.getByTestId('bizdays-count').fill('10')
    await expect(page.getByTestId('bizdays-result')).toContainText('2026年9月15日')
    await expect(page.getByTestId('bizdays-result')).toContainText('令和8年')
    await page.getByTestId('bizdays-from').fill('2026-09-01')
    await page.getByTestId('bizdays-to').fill('2026-09-30')
    await expect(page.getByTestId('bizdays-between-result')).toContainText('19')
    // to < from → text error, not colour only
    await page.getByTestId('bizdays-to').fill('2026-08-01')
    await expect(page.getByText('終了日は開始日より後の日付にしてください。')).toBeVisible()
  })

  test('和暦・年齢', async ({ page }) => {
    await page.goto('/Special4/#y=2026&pto=0&mode=longest&wk=sat-sun')
    await page.getByTestId('tools-tab-wareki').click()
    await page.getByTestId('wareki-input').fill('2019-05-01')
    await expect(page.getByTestId('wareki-result')).toContainText('令和元年5月1日')
    await page.getByTestId('seireki-era').selectOption('昭和')
    await page.getByTestId('seireki-year').fill('64')
    await page.getByTestId('seireki-month').selectOption('1')
    await page.getByTestId('seireki-day').selectOption('7')
    await expect(page.getByTestId('seireki-result')).toContainText('1989年1月7日')
    await page.getByTestId('seireki-day').selectOption('8')
    await expect(page.getByText(/昭和は64年1月7日/)).toBeVisible()
    await page.getByTestId('age-input').fill('1990-09-01')
    await expect(page.getByTestId('age-result')).toContainText('36')
    await expect(page.getByTestId('age-result')).toContainText('午')
  })

  test('休みの設定はマップと URL に反映される', async ({ page }) => {
    await page.goto('/Special4/#y=2026&pto=0&mode=longest&wk=sat-sun')
    await expect(page.getByTestId('ribbon')).toHaveCount(8)
    await page.getByTestId('tools-tab-settings').click()
    await page.getByTestId('settings-add-nenmatsu').click()
    await expect(page.getByTestId('settings-range-list')).toContainText('年末年始')
    await expect(page.getByTestId('ribbon')).toHaveCount(10)
    await expect(page.locator('[data-streak="2026-12-29_2027-01-03"]')).toBeVisible()
    expect(page.url()).toContain('off=1229-0103')
    // Sunday-only weekends: fewer days off
    const before = Number(await page.getByTestId('stat-total').getAttribute('data-value'))
    await page.getByTestId('settings-weekend').getByRole('radio', { name: '日曜のみ' }).check()
    await expect.poll(async () => Number(await page.getByTestId('stat-total').getAttribute('data-value'))).toBeLessThan(before)
    expect(page.url()).toContain('wk=sun')
    // persists across reload (localStorage + hash)
    await page.reload()
    await expect(page.getByTestId('settings-range-list')).toContainText('年末年始')
  })
})
