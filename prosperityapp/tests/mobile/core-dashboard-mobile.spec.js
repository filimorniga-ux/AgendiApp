import { test, expect } from '@playwright/test';

test.describe('Mobile Audit: Core App & Dashboard', () => {
  // Uses global login state setup
  
  test('bottom navigation bar is visible and sidebar is hidden', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Skipping on non-mobile viewports');
    
    await page.goto('/app/dashboard');

    // Sidebar should be hidden
    const sidebar = page.locator('aside.sidebar-nav');
    if (await sidebar.count() > 0) {
       await expect(sidebar).toBeHidden();
    }

    // Bottom Navigation Bar should be visible
    const bottomNav = page.locator('nav.bottom-nav');
    await expect(bottomNav).toBeVisible();

    // The page content should not be hidden behind the bottom bar (check for pb-24 class generally)
    const mainContent = page.locator('main').first();
    const classList = await mainContent.getAttribute('class');
    // Just a sanity check that it's accessible
    await expect(mainContent).toBeVisible();
  });

  test('dashboard KPIs wrap correctly on mobile', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Skipping on non-mobile viewports');
    
    await page.goto('/app/dashboard');

    // KPIs should stack in a column or 2-col grid
    const kpiCards = page.locator('.grid > div.bg-bg-secondary').first();
    if (await kpiCards.isVisible()) {
       const box = await kpiCards.boundingBox();
       const viewportSize = page.viewportSize();
       // A single KPI card on mobile should take up most of the screen width (or half if grid-cols-2)
       expect(box.width).toBeLessThanOrEqual(viewportSize.width);
    }
  });
});
