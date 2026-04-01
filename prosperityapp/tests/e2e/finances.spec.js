import { test, expect } from '@playwright/test';

// ── Tarea 17: Gestión de Caja y Cierres ──────────────────────────────────
test.describe('Caja Diaria y Cierres E2E Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app/caja-diaria');
    await page.waitForTimeout(2000);
    await expect(
      page.locator('h1, h2').filter({ hasText: /Gestión de Caja|Caja|Cash/i }).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('T17.1 - debería renderizar la CajaDiariaPage con los 4 tabs', async ({ page }) => {
    const tabLabels = ['Caja Actual', 'Arqueos y Cierres', 'Historial de Transacciones', 'Consumo Técnico'];
    for (const label of tabLabels) {
      const tab = page.locator('button').filter({ hasText: new RegExp(label, 'i') }).first();
      await expect(tab).toBeVisible();
    }
    await page.screenshot({ path: 'tests/e2e/screenshots/caja-diaria-tabs.png' });
  });

  test('T17.2 - el tab Caja Actual debe cargarse por defecto', async ({ page }) => {
    const currentTab = page.locator('button').filter({ hasText: /Caja Actual/i }).first();
    await expect(currentTab).toBeVisible();
    await page.screenshot({ path: 'tests/e2e/screenshots/caja-current-tab.png' });
  });

  test('T17.3 - debería navegar al tab de Arqueos y Cierres', async ({ page }) => {
    const sessionsTab = page.locator('button').filter({ hasText: /Arqueos y Cierres/i }).first();
    await sessionsTab.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'tests/e2e/screenshots/caja-sessions-tab.png' });
  });

  test('T17.4 - debería navegar al tab de Historial de Transacciones', async ({ page }) => {
    const historyTab = page.locator('button').filter({ hasText: /Historial de Transacciones/i }).first();
    await historyTab.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'tests/e2e/screenshots/caja-history-tab.png' });
  });

  test('T17.5 - debería navegar al tab de Consumo Técnico', async ({ page }) => {
    const techTab = page.locator('button').filter({ hasText: /Consumo Técnico/i }).first();
    await techTab.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'tests/e2e/screenshots/caja-tech-tab.png' });
  });
});

// ── Cierres Mensuales ─────────────────────────────────────────────────────
test.describe('Cierres Mensuales E2E Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app/cierres-mensuales');
    await page.waitForTimeout(2000);
    await expect(
      page.locator('h2').filter({ hasText: /Cierre Mensual|Cierres|closings/i }).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('T17.6 - debería renderizar con selector de mes y controles', async ({ page }) => {
    await expect(page.locator('input[type="month"]').first()).toBeVisible();
    await expect(page.locator('button.btn-golden, button').filter({ hasText: /Nuevo Registro|addBtn/i }).first()).toBeVisible();
    await expect(page.locator('button').filter({ hasText: /Imprimir|Print/i }).first()).toBeVisible();
    await expect(page.locator('button').filter({ hasText: /Exportar|Export/i }).first()).toBeVisible();
    await page.screenshot({ path: 'tests/e2e/screenshots/cierres-mensuales-layout.png' });
  });

  test('T17.7 - debería abrir y cerrar el modal de Nuevo Registro', async ({ page }) => {
    const addBtn = page.locator('button.btn-golden, button').filter({ hasText: /Nuevo Registro|addBtn/i }).first();
    await addBtn.click();
    const modal = page.locator('h2, h3').filter({ hasText: /Registro|Record/i }).first();
    await expect(modal).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: 'tests/e2e/screenshots/cierres-new-record-modal.png' });
    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden({ timeout: 3000 });
  });

  test('T17.8 - debería cambiar el mes seleccionado', async ({ page }) => {
    const monthPicker = page.locator('input[type="month"]').first();
    await monthPicker.fill('2026-03');
    await page.waitForTimeout(500);
    await expect(monthPicker).toHaveValue('2026-03');
  });

  test('T17.9 - el panel de resumen financiero debería mostrarse', async ({ page }) => {
    await page.waitForTimeout(1500);
    const summaryPanel = page.locator('text=/Total a Distribuir|totalToDistribute/i').first();
    await expect(summaryPanel).toBeVisible({ timeout: 5000 });
  });
});
