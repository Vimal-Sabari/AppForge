import { test, expect } from '@playwright/test'

test.describe('App Creation Flow', () => {
  test('should register and create a new app', async ({ page }) => {
    // Debug: Log browser console messages
    page.on('console', (msg) => console.log('BROWSER:', msg.text()))
    page.on('pageerror', (err) => console.log('BROWSER ERROR:', err.message))

    // 1. Registration
    await page.goto('/en/register')
    await page.fill('input[name="email"]', `test-${Date.now()}@example.com`)
    await page.fill('input[name="password"]', 'Password123!')
    await page.click('button[type="submit"]')

    // Wait for redirect to dashboard
    await expect(page).toHaveURL(/\/en\/dashboard/)

    // 2. Create App
    await page.click('text=New App')

    // The page loads with a sample config by default.
    // Click Validate Config
    await page.click('text=Validate Config')

    // Wait for step 2
    await expect(page.locator('text=Review Configuration')).toBeVisible()

    // Click Create App
    await page.click('text=Looks good — Create App')

    // 3. Verify App listed
    // The sample app name is "Employee Directory"
    await page.goto('/en/dashboard')
    await expect(page.locator('text=Employee Directory').first()).toBeVisible()

    // 4. Use App
    await page.click('text=Open App')
    await expect(page).toHaveURL(/\/en\/dashboard\/[a-zA-Z0-9-]+\//)
  })
})
