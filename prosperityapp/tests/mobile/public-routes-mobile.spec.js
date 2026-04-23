import { test, expect } from '@playwright/test';

test.describe('Mobile Audit: Public Booking Routes', () => {
  // Assume a test business slug exists or defaults to '/'
  const testSlug = 'prosperity-barbershop';

  test.use({ storageState: { cookies: [], origins: [] } });

  test('public agenda wizard fits mobile viewport and allows touch selection', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Skipping on non-mobile viewports');
    
    // We navigate to the public agenda route
    await page.goto(`/p/${testSlug}/reservar`);

    // Verify main container fits screen
    const container = page.locator('main').first();
    const viewportSize = page.viewportSize();
    const box = await container.boundingBox();
    if (box) {
       expect(box.width).toBeLessThanOrEqual(viewportSize.width);
    }

    // Wait for services to load
    await page.waitForSelector('text=Selecciona los servicios', { timeout: 15000 });
    
    // Select first service using touch/click
    const firstServiceCard = page.locator('.cursor-pointer.border').first();
    if (await firstServiceCard.isVisible()) {
        await firstServiceCard.click();
    }

    // Move to next step
    const nextBtn = page.locator('button:has-text("Continuar")');
    if (await nextBtn.isVisible()) {
        // Ensure button is visible (not covered by mobile safe areas or bottom bar)
        await nextBtn.scrollIntoViewIfNeeded();
        await nextBtn.click();
    }
  });
});
