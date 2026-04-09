import { test, expect } from '@playwright/test';

// ── Tarea 18: Agendamiento y Reportes Mensuales ────────────────────────────
test.describe('Agendamiento (Calendario) E2E Flow', () => {
  test('T18.1 - debería cargar la página del Calendario / Agenda', async ({ page }) => {
    await page.goto('/app');
    await page.waitForTimeout(2000);

    const title = page.locator('h1, h2').filter({ hasText: /Calendario de Citas|Agenda/i }).first();
    await expect(title).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'tests/e2e/screenshots/calendar-page.png' });
  });

  test('T18.2 - el calendario debe mostrar la vista mensual o semanal', async ({ page }) => {
    await page.goto('/app');
    await page.waitForTimeout(1500);

    const calView = page.locator('.fc, .calendar, [class*="calendar"], [class*="agenda"]').first();
    await expect(calView).toBeVisible();
    await page.screenshot({ path: 'tests/e2e/screenshots/calendar-view.png' });
  });
});

// ── Tarea 18 (parte 2): Reportes Mensuales ────────────────────────────────
test.describe('Reportes Mensuales E2E Flow', () => {
  test('T18.3 - debería cargar la página de Reportes', async ({ page }) => {
    await page.goto('/app/reportes');
    await page.waitForTimeout(2000);

    const title = page.locator('h1, h2').filter({ hasText: /Centro de Reportes/i }).first();
    await expect(title).toBeVisible({ timeout: 10000 });

    await page.screenshot({ path: 'tests/e2e/screenshots/reports-page.png' });
  });

  test('T18.4 - la página de reportes debe tener controles de período', async ({ page }) => {
    await page.goto('/app/reportes');
    await page.waitForTimeout(2000);

    const periodControl = page.locator('select').filter({ hasText: /Hoy|Esta Semana|Este Mes|Este Año|Personalizado/i }).first();
    await expect(periodControl).toBeVisible({ timeout: 8000 });
  });

  test('T18.5 - la página de reportes debe tener opción de exportar', async ({ page }) => {
    await page.goto('/app/reportes');
    await page.waitForTimeout(2000);

    const exportBtn = page.locator('button[title="Exportar a Excel"]').first();
    await expect(exportBtn).toBeVisible();
  });

  test('T18.6 - debería cargar la página de Cierres Mensuales para validación cruzada', async ({ page }) => {
    await page.goto('/app/cierres');
    await page.waitForTimeout(2000);

    const title = page.locator('h2').filter({ hasText: /Cierres Mensuales/i }).first();
    await expect(title).toBeVisible({ timeout: 10000 });

    const monthPicker = page.locator('input[type="month"]').first();
    await expect(monthPicker).toBeVisible();

    await page.screenshot({ path: 'tests/e2e/screenshots/reports-cierres-cross-check.png' });
  });

  test('T18.7 - el selector de mes en cierres permite navegar por meses anteriores', async ({ page }) => {
    await page.goto('/app/cierres');
    await page.waitForTimeout(2000);

    const monthPicker = page.locator('input[type="month"]').first();
    await monthPicker.fill('2026-01');
    await page.waitForTimeout(800);
    await expect(monthPicker).toHaveValue('2026-01');

    await monthPicker.fill('2025-12');
    await page.waitForTimeout(800);
    await expect(monthPicker).toHaveValue('2025-12');

    await page.screenshot({ path: 'tests/e2e/screenshots/reports-month-navigation.png' });
  });
});
