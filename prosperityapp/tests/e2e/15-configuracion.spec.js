import { test, expect } from '@playwright/test';
import { takeScreenshot, isVisible } from './helpers/test-helpers.js';

// ── 15: Configuración ───────────────────────────────────────────────────────
test.describe('15 — Configuración', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/app/configuracion');
    await page.waitForTimeout(3000);
  });

  test('15.01 - Carga la página de Configuración', async ({ page }) => {
    // t('settings.title') = "Configuraciones"
    const title = page.locator('h2').filter({ hasText: /Configuraci/i }).first();
    await expect(title).toBeVisible({ timeout: 15000 });
    await takeScreenshot(page, '15-config-page');
  });

  test('15.02 - Tiene tabs de configuración', async ({ page }) => {
    const title = page.locator('h2').filter({ hasText: /Configuraci/i }).first();
    await expect(title).toBeVisible({ timeout: 15000 });
    // Real tabs: Apariencia, Ticket de Venta, Contabilidad, Información de Empresa, Integraciones, Seguridad
    const tabLabels = ['Apariencia', 'Contabilidad', 'Seguridad', 'Ticket'];
    let foundTabs = 0;
    for (const label of tabLabels) {
      // Find the visible button containing the text
      const tab = page.locator('button').filter({ hasText: new RegExp(label, 'i') }).locator('visible=true').first();
      if (await isVisible(tab)) foundTabs++;
    }
    expect(foundTabs).toBeGreaterThanOrEqual(2);
  });

  test('15.03 - Tab de Contabilidad funciona', async ({ page }) => {
    const title = page.locator('h2').filter({ hasText: /Configuraci/i }).first();
    await expect(title).toBeVisible({ timeout: 15000 });
    const accountingTab = page.locator('button').filter({ hasText: /Contabilidad/i }).locator('visible=true').first();
    await expect(accountingTab).toBeVisible({ timeout: 5000 });
    await accountingTab.click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, '15-config-accounting');
  });

  test('15.04 - Tab de Apariencia funciona', async ({ page }) => {
    const title = page.locator('h2').filter({ hasText: /Configuraci/i }).first();
    await expect(title).toBeVisible({ timeout: 15000 });
    const themeTab = page.locator('button').filter({ hasText: /Apariencia/i }).locator('visible=true').first();
    await expect(themeTab).toBeVisible({ timeout: 5000 });
    await themeTab.click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, '15-config-appearance');
  });

  test('15.05 - Tab de Seguridad funciona', async ({ page }) => {
    const title = page.locator('h2').filter({ hasText: /Configuraci/i }).first();
    await expect(title).toBeVisible({ timeout: 15000 });
    const secTab = page.locator('button').filter({ hasText: /Seguridad/i }).locator('visible=true').first();
    await expect(secTab).toBeVisible({ timeout: 5000 });
    await secTab.click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, '15-config-security');
  });

  test('15.06 - Tab de Empresa funciona', async ({ page }) => {
    const title = page.locator('h2').filter({ hasText: /Configuraci/i }).first();
    await expect(title).toBeVisible({ timeout: 15000 });
    const companyTab = page.locator('button').filter({ hasText: /Empresa|Company/i }).locator('visible=true').first();
    await expect(companyTab).toBeVisible({ timeout: 5000 });
    await companyTab.click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, '15-config-company');
  });

  test('15.07 - Formulario tiene botón guardar', async ({ page }) => {
    const title = page.locator('h2').filter({ hasText: /Configuraci/i }).first();
    await expect(title).toBeVisible({ timeout: 15000 });
    const saveBtn = page.locator('button').filter({ hasText: /Guardar/i }).locator('visible=true').first();
    await expect(saveBtn).toBeVisible({ timeout: 5000 });
    await expect(saveBtn).toBeEnabled();
  });
});
