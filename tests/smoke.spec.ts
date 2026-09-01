import { expect, test } from '@playwright/test'

test('loads under the /Special4/ base path without console errors', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('response', (r) => {
    if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`)
  })

  const res = await page.goto('/Special4/')
  expect(res?.ok()).toBeTruthy()
  await expect(page.getByTestId('title')).toBeVisible()
  expect(errors).toEqual([])
})
