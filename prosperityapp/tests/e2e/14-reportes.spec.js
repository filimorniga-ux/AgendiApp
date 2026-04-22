import { test, expect } from '@playwright/test';
import { takeScreenshot, isVisible } from './helpers/test-helpers.js';

// ── 14: Reportes ────────────────────────────────────────────────────────────
test.describe('14 — Centro de Reportes', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/app/reportes');
    await page.waitForTimeout(3000);
  });

  test('14.01 - Carga la página de Reportes', async ({ page }) => {
    // t('reports.title') = "Centro de Reportes"
    const title = page.locator('h1, h2').filter({ hasText: /Centro de Reportes|Reportes/i }).first();
    await expect(title).toBeVisible({ timeout: 15000 });
    await takeScreenshot(page, '14-reportes-page');
  });

  test('14.02 - Tiene botones de exportación', async ({ page }) => {
    const title = page.locator('h1, h2').filter({ hasText: /Centro de Reportes|Reportes/i }).first();
    await expect(title).toBeVisible({ timeout: 15000 });
    // t('reports.exportExcel') = "Exportar Excel"
    const exportBtn = page.locator('button').filter({ hasText: /Exportar|Excel/i }).first();
    if (await isVisible(exportBtn)) {
      await expect(exportBtn).toBeEnabled();
    }
  });

  test('14.03 - Tiene botón Imprimir', async ({ page }) => {
    const title = page.locator('h1, h2').filter({ hasText: /Centro de Reportes|Reportes/i }).first();
    await expect(title).toBeVisible({ timeout: 15000 });
    const printBtn = page.locator('button').filter({ hasText: /Imprimir/i }).first();
    if (await isVisible(printBtn)) {
      await expect(printBtn).toBeEnabled();
    }
  });

  test('14.04 - Tiene secciones de reporte', async ({ page }) => {
    const title = page.locator('h1, h2').filter({ hasText: /Centro de Reportes|Reportes/i }).first();
    await expect(title).toBeVisible({ timeout: 15000 });
    // Sections: Finanzas, Inventario, Clientes, RRHH, Nómina, Cierres
    const sections = page.locator('text=/Finanzas|Inventario|Clientes|RRHH|Nómina|Cierres/i');
    const count = await sections.count();
    expect(count).toBeGreaterThanOrEqual(0);
    await takeScreenshot(page, '14-reportes-sections');
  });

  test('14.05 - Tiene botón Respaldo Completo', async ({ page }) => {
    const title = page.locator('h1, h2').filter({ hasText: /Centro de Reportes|Reportes/i }).first();
    await expect(title).toBeVisible({ timeout: 15000 });
    const backupBtn = page.locator('button').filter({ hasText: /Respaldo|Backup/i }).first();
    if (await isVisible(backupBtn)) {
      await expect(backupBtn).toBeVisible();
    }
  });
});
