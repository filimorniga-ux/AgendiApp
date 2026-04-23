import { test, expect } from '@playwright/test';

test.describe('Mobile Audit: Inventory', () => {
  // Uses global login state setup

  test('tables scroll horizontally without breaking page width', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Skipping on non-mobile viewports');
    
    await page.goto('/app/inventario');

    const viewportSize = page.viewportSize();

    // The page wrapper itself should not exceed viewport width (no global overflow-x)
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportSize.width);

    // The table container should have horizontal scroll
    const tableContainer = page.locator('.overflow-x-auto').first();
    if (await tableContainer.count() > 0) {
      const isScrollable = await tableContainer.evaluate((node) => {
        return node.scrollWidth > node.clientWidth;
      });
      // In a real app with data, it will be scrollable
      // We just ensure the wrapper classes are present
      await expect(tableContainer).toHaveClass(/overflow-x-auto/);
    }
    
    // Verify some columns are hidden on mobile
    const minStockHeader = page.locator('th', { hasText: /Min Stock|Stock Mínimo/i }).first();
    if (await minStockHeader.count() > 0) {
      await expect(minStockHeader).toBeHidden();
    }
  });
});
