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
    await page.click('text=New Application')

    // The page loads with a sample config by default.
    // Click Validate Config
    await page.click('text=Validate Config')

    // Wait for step 2
    await expect(page.locator('text=Review Configuration')).toBeVisible()

    // Click Create App
    await page.click('text=Deploy Application')

    // Wait for the success screen (Step 3) so the API request isn't cancelled
    await expect(page.locator('text=App Created Successfully!')).toBeVisible()

    // 4. Use App (click the button on the success page)
    await page.click('text=Open App')
    await expect(page).toHaveURL(/\/en\/dashboard\/[a-zA-Z0-9-]+\//)
  })
})
