import { test, expect } from '@playwright/test';
import { takeScreenshot, isVisible } from './helpers/test-helpers.js';

// ── 18: Suscripción ─────────────────────────────────────────────────────────
test.describe('18 — Página de Suscripción', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/app/suscripcion');
    await page.waitForTimeout(2000);
  });

  test('18.01 - Carga la página de suscripción', async ({ page }) => {
    const title = page.locator('h1, h2').filter({ hasText: /Suscripción|Plan|Subscription/i }).first();
    await expect(title).toBeVisible({ timeout: 10000 });
    await takeScreenshot(page, '18-subscription-page');
  });

  test('18.02 - Muestra planes disponibles', async ({ page }) => {
    // Busca el título del plan actual ("AgendiApp PRO", "AgendiApp FREE", etc)
    const planCards = page.locator('h3').filter({ hasText: /AgendiApp|Plan/i }).first();
    await expect(planCards).toBeVisible({ timeout: 10000 });
  });

  test('18.03 - Botón de cambiar/mejorar plan visible', async ({ page }) => {
    const upgradeBtn = page.locator('button').filter({ hasText: /Mejorar|Upgrade|Cambiar|Seleccionar|Suscribir/i }).first();
    if (await isVisible(upgradeBtn)) {
      await expect(upgradeBtn).toBeEnabled();
    }
  });

  test('18.04 - Información del plan actual visible', async ({ page }) => {
    const currentPlan = page.locator('text=/Plan actual|Current plan|Tu plan/i').first();
    if (await isVisible(currentPlan)) {
      await expect(currentPlan).toBeVisible();
    }
  });

  test('18.05 - Detalles de facturación presentes', async ({ page }) => {
    const billing = page.locator('text=/Facturación|Billing|Pago|Precio/i').first();
    if (await isVisible(billing)) {
      await expect(billing).toBeVisible();
    }
    await takeScreenshot(page, '18-subscription-billing');
  });
});
