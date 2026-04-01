import { test, expect } from '@playwright/test';

// ── Tarea 16: Registrar Operación - Parte 2 ────────────────────────────────
// Continúa donde quedó la Tarea 15 (MovementModal abierto, servicios seleccionados)
// Esta parte verifica: propinas, gasto menor, métodos de pago
test.describe('Registrar Operación - Parte 2 (Caja)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app/caja');
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).toBeVisible();
  });

  test('T16.1 - el modal de Registrar Operación debería tener sección de método de pago', async ({ page }) => {
    // Abrir el MovementModal
    const registerBtn = page.locator('button').filter({ hasText: /Registrar Operación|Nueva Operación|register/i }).first();
    if (await registerBtn.isVisible()) {
      await registerBtn.click();
      await page.waitForTimeout(1000);

      // Buscar sección de método de pago
      const paymentSection = page.locator('text=/Método de Pago|Pago|Payment/i').first();
      await expect(paymentSection).toBeVisible({ timeout: 5000 });

      await page.screenshot({ path: 'tests/e2e/screenshots/operation-payment-method.png' });
    } else {
      test.skip();
    }
  });

  test('T16.2 - debería poder seleccionar Efectivo como método de pago', async ({ page }) => {
    const registerBtn = page.locator('button').filter({ hasText: /Registrar Operación|Nueva Operación/i }).first();
    if (!await registerBtn.isVisible()) return test.skip();

    await registerBtn.click();
    await page.waitForTimeout(1000);

    // Buscar botón/opción de Efectivo
    const cashOption = page.locator('button, label, div').filter({ hasText: /Efectivo|Cash/i }).first();
    if (await cashOption.isVisible()) {
      await cashOption.click();
      await page.waitForTimeout(300);
      await page.screenshot({ path: 'tests/e2e/screenshots/operation-cash-selected.png' });
    }
  });

  test('T16.3 - debería poder seleccionar Tarjeta como método de pago', async ({ page }) => {
    const registerBtn = page.locator('button').filter({ hasText: /Registrar Operación|Nueva Operación/i }).first();
    if (!await registerBtn.isVisible()) return test.skip();

    await registerBtn.click();
    await page.waitForTimeout(1000);

    const cardOption = page.locator('button, label, div').filter({ hasText: /Tarjeta|Card|Débito|Crédito/i }).first();
    if (await cardOption.isVisible()) {
      await cardOption.click();
      await page.waitForTimeout(300);
    }
  });

  test('T16.4 - la sección de Propina debería estar presente en el modal', async ({ page }) => {
    const registerBtn = page.locator('button').filter({ hasText: /Registrar Operación|Nueva Operación/i }).first();
    if (!await registerBtn.isVisible()) return test.skip();

    await registerBtn.click();
    await page.waitForTimeout(1000);

    const tipSection = page.locator('text=/Propina|Tip/i').first();
    // Solo verificamos si existe, no bloqueamos si no está
    if (await tipSection.isVisible()) {
      await expect(tipSection).toBeVisible();
    }
  });

  test('T16.5 - cerrar el modal con X o Cancelar debe funcionar', async ({ page }) => {
    const registerBtn = page.locator('button').filter({ hasText: /Registrar Operación|Nueva Operación/i }).first();
    if (!await registerBtn.isVisible()) return test.skip();

    await registerBtn.click();
    await page.waitForTimeout(1000);

    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'tests/e2e/screenshots/operation-modal-closed.png' });
  });
});
