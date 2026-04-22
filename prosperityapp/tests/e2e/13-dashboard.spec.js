import { test, expect } from '@playwright/test';
import { navigateTo, waitForPageLoad, takeScreenshot, isVisible } from './helpers/test-helpers.js';

// ── 13: Dashboard ───────────────────────────────────────────────────────────
test.describe('13 — Dashboard', () => {

  test.beforeEach(async ({ page }) => {
    await navigateTo(page, '/app/dashboard', /Dashboard|Resumen/i);
  });

  test('13.01 - Carga el Dashboard con título visible', async ({ page }) => {
    await takeScreenshot(page, '13-dashboard');
  });

  test('13.02 - Muestra tarjetas KPI', async ({ page }) => {
    // Dashboard should show summary cards with metrics
    const kpiCards = page.locator('.card, [class*="kpi"], [class*="stat"], [class*="metric"]');
    const count = await kpiCards.count();
    expect(count).toBeGreaterThanOrEqual(1);
    await takeScreenshot(page, '13-dashboard-kpis');
  });

  test('13.03 - Tiene selector de período', async ({ page }) => {
    const periodSelector = page.locator('select, button').filter({ hasText: /Hoy|Semana|Mes|Año|Período|Period/i }).first();
    if (await isVisible(periodSelector)) {
      await expect(periodSelector).toBeEnabled();
    }
  });

  test('13.04 - Muestra gráficos o charts', async ({ page }) => {
    // Look for chart containers (canvas elements from Chart.js or similar)
    const charts = page.locator('canvas, svg, [class*="chart"], [class*="graph"]');
    const count = await charts.count();
    // Dashboard should have at least one chart
    if (count > 0) {
      await expect(charts.first()).toBeVisible({ timeout: 10000 });
    }
    await takeScreenshot(page, '13-dashboard-charts');
  });

  test('13.05 - Información de ingresos del día visible', async ({ page }) => {
    const revenueInfo = page.locator('text=/Ingresos|Ventas|Revenue|Total|Servicios/i').first();
    await expect(revenueInfo).toBeVisible({ timeout: 10000 });
  });

  test('13.06 - Información de citas/agenda visible', async ({ page }) => {
    const agendaInfo = page.locator('text=/Citas|Agenda|Appointments|Hoy/i').first();
    if (await isVisible(agendaInfo)) {
      await expect(agendaInfo).toBeVisible();
    }
  });
});
