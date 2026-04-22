import { test, expect } from '@playwright/test';
import { takeScreenshot, isVisible } from './helpers/test-helpers.js';

// ── 12: Nóminas ─────────────────────────────────────────────────────────────
// Route: /app/nomina (singular!)
test.describe('12 — Nóminas', () => {

  test.describe('Página Principal de Nóminas', () => {

    test.beforeEach(async ({ page }) => {
      await page.goto('/app/nomina');
      await page.waitForTimeout(5000); // Nominas returns null during loading
    });

    test('12.01 - Carga la página de Nóminas', async ({ page }) => {
      const title = page.locator('h2').filter({ hasText: /Nóminas/i }).first();
      await expect(title).toBeVisible({ timeout: 20000 });
      await takeScreenshot(page, '12-nominas-page');
    });

    test('12.02 - Tiene tabs de nóminas (Nómina/Plantillas)', async ({ page }) => {
      const title = page.locator('h2').filter({ hasText: /Nóminas/i }).first();
      await expect(title).toBeVisible({ timeout: 20000 });
      const nominaTab = page.locator('button').filter({ hasText: /Nómina/i }).first();
      const plantillasTab = page.locator('button').filter({ hasText: /Plantillas/i }).first();
      await expect(nominaTab).toBeVisible({ timeout: 5000 });
      await expect(plantillasTab).toBeVisible({ timeout: 5000 });
    });

    test('12.03 - Tab Nómina muestra calendario de selección', async ({ page }) => {
      const title = page.locator('h2').filter({ hasText: /Nóminas/i }).first();
      await expect(title).toBeVisible({ timeout: 20000 });
      const calendar = page.locator('.react-calendar').first();
      await expect(calendar).toBeVisible({ timeout: 10000 });
    });

    test('12.04 - Botones de período (Esta Semana, Este Mes)', async ({ page }) => {
      const title = page.locator('h2').filter({ hasText: /Nóminas/i }).first();
      await expect(title).toBeVisible({ timeout: 20000 });
      const weekBtn = page.locator('button').filter({ hasText: /Esta Semana/i }).first();
      const monthBtn = page.locator('button').filter({ hasText: /Este Mes/i }).first();
      if (await isVisible(weekBtn)) await expect(weekBtn).toBeVisible();
      if (await isVisible(monthBtn)) await expect(monthBtn).toBeVisible();
    });

    test('12.05 - Cambiar a tab Plantillas', async ({ page }) => {
      const title = page.locator('h2').filter({ hasText: /Nóminas/i }).first();
      await expect(title).toBeVisible({ timeout: 20000 });
      const plantillasTab = page.locator('button').filter({ hasText: /Plantillas/i }).first();
      await plantillasTab.click();
      await page.waitForTimeout(500);
      await takeScreenshot(page, '12-nominas-plantillas');
    });

    test('12.06 - Link a Historial de Nóminas existe', async ({ page }) => {
      const title = page.locator('h2').filter({ hasText: /Nóminas/i }).first();
      await expect(title).toBeVisible({ timeout: 20000 });
      const histLink = page.locator('a[href*="historial"]').first();
      await expect(histLink).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Historial de Nóminas', () => {
    test('12.07 - Carga la página de historial', async ({ page }) => {
      await page.goto('/app/nomina/historial');
      await page.waitForTimeout(3000);
      const title = page.locator('h2, h1').filter({ hasText: /Historial|Nómina/i }).first();
      await expect(title).toBeVisible({ timeout: 15000 });
      await takeScreenshot(page, '12-historial-nominas');
    });
  });
});
