import { test, expect } from '@playwright/test';
import { navigateTo, waitForPageLoad, selectTab, openModal, closeModalEscape, takeScreenshot, isVisible } from './helpers/test-helpers.js';

// ── 05: Caja Diaria ─────────────────────────────────────────────────────────
test.describe('05 — Caja Diaria', () => {

  test.beforeEach(async ({ page }) => {
    await navigateTo(page, '/app/caja', /Gestión de Caja/i);
  });

  test('05.01 - Renderiza con los 4 tabs', async ({ page }) => {
    const tabLabels = ['Caja Actual', 'Arqueos y Cierres', 'Historial de Transacciones', 'Consumo Técnico'];
    for (const label of tabLabels) {
      const tab = page.locator('button').filter({ hasText: new RegExp(`^${label}$`, 'i') }).first();
      await expect(tab).toBeVisible({ timeout: 5000 });
    }
    await takeScreenshot(page, '05-caja-4-tabs');
  });

  test('05.02 - Tab Caja Actual cargado por defecto', async ({ page }) => {
    // Caja Actual should have balance cards or summary
    const currentContent = page.locator('text=/Efectivo|Tarjeta|Transferencia|Saldo/i').first();
    await expect(currentContent).toBeVisible({ timeout: 10000 });
    await takeScreenshot(page, '05-caja-actual');
  });

  test('05.03 - Botón Arqueo Parcial abre modal', async ({ page }) => {
    const arqueoBtn = page.locator('button').filter({ hasText: /Arqueo Parcial/i }).first();
    await expect(arqueoBtn).toBeVisible({ timeout: 10000 });
    await arqueoBtn.click();

    const modal = page.locator('.modal-content, [role="dialog"]').first();
    await expect(modal).toBeVisible({ timeout: 5000 });
    await takeScreenshot(page, '05-arqueo-modal');
    await closeModalEscape(page);
  });

  test('05.04 - Botón Registrar Operación visible', async ({ page }) => {
    const registerBtn = page.locator('button').filter({ hasText: /Registrar Operación|Nueva Operación/i }).first();
    await expect(registerBtn).toBeVisible({ timeout: 10000 });
  });

  test('05.05 - Tab Arqueos y Cierres navega correctamente', async ({ page }) => {
    await selectTab(page, 'Arqueos y Cierres');
    await page.waitForTimeout(500);
    await takeScreenshot(page, '05-arqueos-tab');
  });

  test('05.06 - Tab Historial de Transacciones navega correctamente', async ({ page }) => {
    await selectTab(page, 'Historial de Transacciones');
    await page.waitForTimeout(500);
    // Should show transaction list or empty state
    await takeScreenshot(page, '05-historial-tab');
  });

  test('05.07 - Tab Consumo Técnico navega correctamente', async ({ page }) => {
    await selectTab(page, 'Consumo Técnico');
    await page.waitForTimeout(500);
    await takeScreenshot(page, '05-consumo-tecnico-tab');
  });

  test('05.08 - El tab Caja Actual muestra resumen de ingresos del día', async ({ page }) => {
    // Look for income/expense summary
    const summary = page.locator('text=/Total|Ingresos|Egresos|Balance/i').first();
    await expect(summary).toBeVisible({ timeout: 10000 });
  });
});
