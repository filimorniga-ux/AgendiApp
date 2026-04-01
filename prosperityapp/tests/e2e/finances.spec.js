import { test, expect } from '@playwright/test';

// ── Tarea 17: Gestión de Caja y Cierres ──────────────────────────────────
test.describe('Caja Diaria y Cierres E2E Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app/caja');
    await page.waitForTimeout(2000);
    await expect(
      page.locator('h1, h2').filter({ hasText: /^Gestión de Caja y Reportes$/i }).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('T17.1 - debería renderizar la CajaDiariaPage con los 4 tabs', async ({ page }) => {
    const tabLabels = ['Caja Actual', 'Arqueos y Cierres', 'Historial de Transacciones', 'Consumo Técnico'];
    for (const label of tabLabels) {
      const tab = page.locator('button').filter({ hasText: new RegExp(`^${label}$`, 'i') }).first();
      await expect(tab).toBeVisible();
    }
    await page.screenshot({ path: 'tests/e2e/screenshots/caja-diaria-tabs.png' });
  });

  test('T17.2 - el tab Caja Actual debe cargarse por defecto y tener botón Arqueo', async ({ page }) => {
    const currentTab = page.locator('button').filter({ hasText: /Caja Actual/i }).first();
    await expect(currentTab).toBeVisible();

    // Check and test the "Arqueo Parcial" functionality that opens the CashSession modal
    const arqueoBtn = page.locator('button').filter({ hasText: /^Arqueo Parcial$/i }).first();
    await expect(arqueoBtn).toBeVisible();
    await arqueoBtn.click();

    // Assert the modal opened
    const modal = page.locator('.modal-content').first();
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Close modal
    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden({ timeout: 3000 });

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
    await page.goto('/app/cierres');
    await page.waitForTimeout(2000);
    await expect(
      page.locator('h2').filter({ hasText: /Cierres Mensuales/i }).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('T17.6 - debería renderizar con selector de mes y controles', async ({ page }) => {
    await expect(page.locator('input[type="month"]').first()).toBeVisible();
    await expect(page.locator('button.btn-golden, button').filter({ hasText: /Ingresar Registro/i }).first()).toBeVisible();
    await expect(page.locator('button[title="Imprimir"]').first()).toBeVisible();
    await expect(page.locator('button[title="Exportar a Excel"]').first()).toBeVisible();
    await page.screenshot({ path: 'tests/e2e/screenshots/cierres-mensuales-layout.png' });
  });

  test('T17.7 - debería abrir y cerrar el modal de Nuevo Registro', async ({ page }) => {
    const addBtn = page.locator('button.btn-golden, button').filter({ hasText: /Ingresar Registro/i }).first();
    await addBtn.click();
    const modal = page.locator('.modal-content').first();
    await expect(modal).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: 'tests/e2e/screenshots/cierres-new-record-modal.png' });

    const closeBtn = modal.locator('button').filter({ hasText: '×' }).first();
    await closeBtn.click();

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
    const summaryPanel = page.locator('text=/TOTAL A REPARTIR/i').first();
    await expect(summaryPanel).toBeVisible({ timeout: 5000 });
  });
});
