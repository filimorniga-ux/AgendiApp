import { test, expect } from '@playwright/test';

test.describe('Core E2E Flow', () => {
  test('Should load Dashboard using saved Supabase auth state', async ({ page }) => {
    // The browser context uses storageState containing our Supabase session
    await page.goto('/');

    // Routing should redirect / to /app immediately
    await expect(page).toHaveURL(/.*\/app.*/);

    // Verify Sidebar or main navigation loaded
    // (Looking for main menu or text like 'AgendiApp')
    const navText = page.locator('nav, aside').filter({ hasText: /Agenda|AgendiApp/i }).first();
    await expect(navText).toBeVisible({ timeout: 10000 });

    // Take screenshot of successful authenticated load
    await page.screenshot({ path: 'tests/e2e/screenshots/dashboard-loaded.png' });
  });
});
