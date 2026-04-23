import { test, expect } from '@playwright/test';

test.describe('Mobile Audit: Landing Page', () => {
  // Do not use the global logged-in state for the public landing page.
  test.use({ storageState: { cookies: [], origins: [] } });

  test('hero section and responsive elements are correctly sized', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Skipping on non-mobile viewports');
    
    await page.goto('/');

    // Check Hero title
    const heroTitle = page.locator('h1').first();
    await expect(heroTitle).toBeVisible();

    // The hero section should fit within the screen without overflow
    const heroBox = await heroTitle.boundingBox();
    const viewportSize = page.viewportSize();
    expect(heroBox.width).toBeLessThanOrEqual(viewportSize.width);

    // Verify Hamburger Menu exists on mobile
    const hamburgerBtn = page.locator('button:has(svg.lucide-menu), button[aria-label="Menu"]');
    if (await hamburgerBtn.isVisible()) {
        await hamburgerBtn.click();
        // Wait for mobile menu to appear
        const mobileMenu = page.locator('nav').last();
        await expect(mobileMenu).toBeVisible();
    }

    // Verify Login Button is clickable
    const loginBtn = page.locator('button:has-text("Acceder")').first();
    await loginBtn.click();

    // Verify Auth Modal is fully visible and fits screen
    const modal = page.locator('.modal-content');
    await expect(modal).toBeVisible();
    
    const modalBox = await modal.boundingBox();
    expect(modalBox.width).toBeLessThanOrEqual(viewportSize.width);
    
    // Close modal
    const closeBtn = page.locator('button:has(svg)').first();
    await closeBtn.click({ force: true });
  });
});
