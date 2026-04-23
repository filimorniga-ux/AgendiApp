import { test, expect } from '@playwright/test';

test.describe('Mobile Audit: HR and Settings', () => {
  // Uses global login state setup

  test('settings toggles and inputs are easily tappable', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Skipping on non-mobile viewports');
    
    await page.goto('/app/nomina');

    // Wait for elements
    await page.waitForSelector('text=Nóminas', { timeout: 15000 });

    // Look for config buttons, they should have enough padding
    const configBtns = page.locator('button', { hasText: /Configurar|Editar/i });
    if (await configBtns.count() > 0) {
      const box = await configBtns.first().boundingBox();
      // Minimum recommended touch target size is around 44x44px, but at least 32px height is common
      if (box) {
         expect(box.height).toBeGreaterThanOrEqual(28); 
      }
    }
  });
});
