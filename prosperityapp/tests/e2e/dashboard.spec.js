import { test, expect } from '@playwright/test';

test.describe('Dashboard E2E Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to local url
    await page.goto('/app/dashboard');
  });

  test('Should render dashboard charts and components', async ({ page }) => {
    // Wait for data load
    await page.waitForTimeout(2000); 

    // Look for Title of the dashboard
    const dashboardTitle = page.locator('h1').filter({ hasText: /Dashboard|Resumen/i }).first();
    await expect(dashboardTitle).toBeVisible({ timeout: 10000 });

    // Look for statistics cards (Sales, Orders, etc.)
    // SummaryCards have text-2xl class and format currency or numbers
    const statsAmount = page.locator('p.text-2xl.font-bold').first();
    await expect(statsAmount).toBeVisible({ timeout: 10000 });

    // Verify there is a ranking section 
    const rankingTitle = page.locator('h3').filter({ hasText: /Dashboard|Ranking/i }).first();
    await expect(rankingTitle).toBeVisible();
  });
});
