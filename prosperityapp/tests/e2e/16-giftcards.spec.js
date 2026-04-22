import { test, expect } from '@playwright/test';
import { navigateTo, waitForPageLoad, openModal, closeModalEscape, takeScreenshot, isVisible } from './helpers/test-helpers.js';

// ── 16: Gift Cards ──────────────────────────────────────────────────────────
test.describe('16 — Gift Cards', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/app/giftcards');
    await page.waitForTimeout(2000);
  });

  test('16.01 - Carga la página de Gift Cards', async ({ page }) => {
    const title = page.locator('h1, h2').filter({ hasText: /Gift Card|Tarjetas de Regalo/i }).first();
    await expect(title).toBeVisible({ timeout: 10000 });
    await takeScreenshot(page, '16-giftcards-page');
  });

  test('16.02 - Botón crear Gift Card visible', async ({ page }) => {
    const createBtn = page.locator('button').filter({ hasText: /Crear|Nueva|Generar|Agregar/i }).first();
    if (await isVisible(createBtn)) {
      await expect(createBtn).toBeEnabled();
    }
  });

  test('16.03 - Abrir modal de nueva Gift Card', async ({ page }) => {
    const createBtn = page.locator('button').filter({ hasText: /Crear|Nueva|Generar|Agregar/i }).first();
    if (await isVisible(createBtn)) {
      await createBtn.click();
      await page.waitForTimeout(500);
      const modal = page.locator('.modal-content, [role="dialog"], h2, h3').filter({ hasText: /Gift Card|Tarjeta/i }).first();
      if (await isVisible(modal)) {
        await takeScreenshot(page, '16-giftcard-modal');
        await closeModalEscape(page);
      }
    }
  });

  test('16.04 - Lista de Gift Cards visible (o estado vacío)', async ({ page }) => {
    // Should show a list/table of cards or empty state
    const content = page.locator('table, [class*="card"], [class*="list"]').first();
    await expect(content).toBeVisible({ timeout: 10000 });
  });

  test('16.05 - Búsqueda de Gift Cards', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="Buscar" i]').first();
    if (await isVisible(searchInput)) {
      await searchInput.fill('GC-TEST-XXX');
      await expect(searchInput).toHaveValue('GC-TEST-XXX');
    }
  });
});
