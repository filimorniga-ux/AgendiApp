import { test, expect } from '@playwright/test';
import { waitForPageLoad, takeScreenshot, isVisible } from './helpers/test-helpers.js';

// ── 19: Cross-Module Smoke Tests ────────────────────────────────────────────
test.describe('19 — Cross-Module Smoke Tests', () => {

  test('19.01 - Smoke: Agenda → Dashboard → Caja (flujo usuario)', async ({ page }) => {
    await page.goto('/app');
    await page.waitForTimeout(3000);
    const sidebar = page.locator('aside, nav').first();
    await expect(sidebar).toBeVisible({ timeout: 10000 });

    await page.goto('/app/dashboard');
    await page.waitForTimeout(3000);

    await page.goto('/app/caja');
    await page.waitForTimeout(3000);

    await page.goto('/app');
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '19-smoke-flow');
  });

  test('19.02 - Rutas principales cargan sin error boundary', async ({ page }) => {
    test.setTimeout(60000); // 60 seconds timeout since there are many routes
    const routes = [
      '/app',
      '/app/dashboard',
      '/app/caja',
      '/app/precios',
      '/app/inventario',
      '/app/pedidos',
      '/app/clientes',
      '/app/colaboradores',
      '/app/nomina',
      '/app/cierres',
      '/app/reportes',
      '/app/configuracion',
      '/app/giftcards',
      '/app/suscripcion',
    ];

    for (const route of routes) {
      const response = await page.goto(route, { timeout: 15000 });
      await page.waitForTimeout(500);
      // Verify no crash/error boundary
      const errorBoundary = page.locator('text=/Algo salió mal|Something went wrong/i').first();
      const hasError = await isVisible(errorBoundary);
      expect(hasError).toBeFalsy();
    }
  });

  test('19.03 - Navegación rápida no causa crashes', async ({ page }) => {
    const routes = ['/app', '/app/dashboard', '/app/caja', '/app/precios', '/app/clientes'];

    for (const route of routes) {
      await page.goto(route, { timeout: 15000 });
      await page.waitForTimeout(800);
    }
    await expect(page.locator('body')).toBeVisible();
    await takeScreenshot(page, '19-fast-navigation');
  });

  test('19.04 - Sidebar se mantiene visible al navegar', async ({ page }) => {
    await page.goto('/app');
    await page.waitForTimeout(3000);
    const sidebar = page.locator('aside').first();
    await expect(sidebar).toBeVisible({ timeout: 10000 });

    await page.goto('/app/caja');
    await page.waitForTimeout(2000);
    await expect(sidebar).toBeVisible({ timeout: 5000 });

    await page.goto('/app/precios');
    await page.waitForTimeout(2000);
    await expect(sidebar).toBeVisible({ timeout: 5000 });
  });

  test('19.05 - Pedidos → Recepción: flujo supply chain', async ({ page }) => {
    await page.goto('/app/pedidos');
    await page.waitForTimeout(3000);
    const pedidosTitle = page.locator('h1, h2').filter({ hasText: /Pedidos|Proveedores/i }).first();
    await expect(pedidosTitle).toBeVisible({ timeout: 15000 });

    await page.goto('/app/recepcion');
    await page.waitForTimeout(3000);
    await takeScreenshot(page, '19-supply-chain-flow');
  });

  test('19.06 - Colaboradores → Nómina: flujo RRHH', async ({ page }) => {
    await page.goto('/app/colaboradores');
    await page.waitForTimeout(3000);
    const collabH2 = page.locator('h2').filter({ hasText: /Colaboradores/i }).first();
    await expect(collabH2).toBeVisible({ timeout: 15000 });

    await page.goto('/app/nomina');
    await page.waitForTimeout(5000);
    const nominaH2 = page.locator('h2').filter({ hasText: /Nóminas/i }).first();
    await expect(nominaH2).toBeVisible({ timeout: 20000 });
    await takeScreenshot(page, '19-hr-flow');
  });
});
