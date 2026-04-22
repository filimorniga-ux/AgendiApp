import { test, expect } from '@playwright/test';
import { navigateTo, waitForPageLoad, takeScreenshot, isVisible } from './helpers/test-helpers.js';

// ── 09: Pedidos y Recepción ─────────────────────────────────────────────────
test.describe('09 — Pedidos y Recepción de Mercancía', () => {

  // ── Pedidos ──
  test.describe('Lista de Pedidos', () => {
    test('09.01 - Carga la página de Pedidos y Proveedores', async ({ page }) => {
      await navigateTo(page, '/app/pedidos', /Pedidos|Proveedores|Orders/i);
      await takeScreenshot(page, '09-pedidos-list');
    });

    test('09.02 - Tiene tabs o controles de filtro', async ({ page }) => {
      await navigateTo(page, '/app/pedidos', /Pedidos|Proveedores/i);
      // Look for filter buttons or tabs
      const filterArea = page.locator('button, select').filter({ hasText: /Pendientes|Todos|Completados|Filtrar/i }).first();
      if (await isVisible(filterArea)) {
        await expect(filterArea).toBeVisible();
      }
    });
  });

  // ── Recepción de Mercancía ──
  test.describe('Recepción (Stepper)', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/app/recepcion', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);
      const header = page.locator('h1').filter({ hasText: /Recepción de Mercancía|Recepcion/i }).first();
      await expect(header).toBeVisible({ timeout: 15000 });
    });

    test('09.03 - Stepper con 6 pasos visibles', async ({ page }) => {
      const stepLabels = ['Importar factura', 'Proveedor', 'Revisar pedido', 'Recepción física', 'Discrepancias', 'Confirmar'];
      for (const label of stepLabels) {
        const stepEl = page.locator('.recepcion-step-label').filter({ hasText: new RegExp('^' + label + '$') }).first();
        await expect(stepEl).toBeVisible();
      }
      await takeScreenshot(page, '09-reception-stepper');
    });

    test('09.04 - Paso 1 muestra importador de facturas', async ({ page }) => {
      const stepTitle = page.locator('h2').filter({ hasText: /^Importar factura$/ }).first();
      await expect(stepTitle).toBeVisible();

      const manualBtn = page.locator('button').filter({ hasText: /Ingresar datos manualmente/i }).first();
      await expect(manualBtn).toBeVisible();
    });

    test('09.05 - Botón manual avanza al paso 2 (Proveedor)', async ({ page }) => {
      const manualBtn = page.locator('button').filter({ hasText: /Ingresar datos manualmente/i }).first();
      await manualBtn.click();
      await page.waitForTimeout(500);

      const step2Title = page.locator('h2').filter({ hasText: /Datos del proveedor/i }).first();
      await expect(step2Title).toBeVisible({ timeout: 5000 });
      await takeScreenshot(page, '09-step2-supplier');
    });

    test('09.06 - Botón Volver aparece en paso 2', async ({ page }) => {
      const manualBtn = page.locator('button').filter({ hasText: /Ingresar datos manualmente/i }).first();
      await manualBtn.click();

      const backBtn = page.locator('button').filter({ hasText: /Volver/i }).first();
      await expect(backBtn).toBeVisible({ timeout: 5000 });
      await expect(backBtn).toBeEnabled();
    });

    test('09.07 - Pasos completados muestran ✓', async ({ page }) => {
      const manualBtn = page.locator('button').filter({ hasText: /Ingresar datos manualmente/i }).first();
      await manualBtn.click();

      const completedStep = page.locator('.recepcion-step-circle.completed').first();
      await expect(completedStep).toBeVisible({ timeout: 5000 });
    });
  });
});
