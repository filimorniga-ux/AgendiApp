import { test, expect } from '@playwright/test';
import { navigateTo, waitForPageLoad, takeScreenshot } from './helpers/test-helpers.js';

// ── 02: Navegación y Layout ─────────────────────────────────────────────────
test.describe('02 — Navegación y Layout', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/app');
    await page.waitForTimeout(2000);
  });

  // ── Sidebar links ──
  const sidebarRoutes = [
    { name: 'Agenda',         path: '/app',                   title: /Calendario|Agenda/i },
    { name: 'Dashboard',      path: '/app/dashboard',         title: /Dashboard|Resumen/i },
    { name: 'Caja',           path: '/app/caja',              title: /Gestión de Caja/i },
    { name: 'Precios',        path: '/app/precios',           title: /Catálogo|Servicios|Precios/i },
    { name: 'Inventario',     path: '/app/inventario',        title: /Inventario|Stock/i },
    { name: 'Pedidos',        path: '/app/pedidos',           title: /Pedidos|Proveedores/i },
    { name: 'Clientes',       path: '/app/clientes',          title: /Clientes/i },
    { name: 'Colaboradores',  path: '/app/colaboradores',     title: /Colaboradores|Equipo/i },
    { name: 'Nóminas',        path: '/app/nomina',            title: /Nóminas|Nominas/i },
    { name: 'Cierres',        path: '/app/cierres',           title: /Cierres Mensuales/i },
    { name: 'Reportes',       path: '/app/reportes',          title: /Reportes|Centro/i },
    { name: 'Configuración',  path: '/app/configuracion',     title: /Configuracion|Configuración|Configuraciones|Settings/i },
  ];

  for (const route of sidebarRoutes) {
    test(`02.R - Ruta ${route.name} (${route.path}) carga correctamente`, async ({ page }) => {
      await page.goto(route.path);
      await waitForPageLoad(page, route.title, 15000);
      await takeScreenshot(page, `02-nav-${route.name.toLowerCase()}`);
    });
  }

  test('02.13 - Ruta 404 muestra mensaje de error', async ({ page }) => {
    await page.goto('/app/ruta-inexistente-xyz');
    await page.waitForTimeout(2000);
    const notFound = page.locator('h1').filter({ hasText: /404|no encontrada/i }).first();
    await expect(notFound).toBeVisible({ timeout: 5000 });
  });

  test('02.14 - El layout tiene sidebar con logo/branding', async ({ page }) => {
    const sidebar = page.locator('#sidebar-nav, aside').first();
    await expect(sidebar).toBeVisible({ timeout: 10000 });
  });
});
