import { test, expect } from '@playwright/test'

/**
 * Smoke test: with no active session the app boots to the login screen.
 * (The refresh-token call fails with no API up, which lands on the login view.)
 */
test('boots to the login screen', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'TableFlight' })).toBeVisible()
})
