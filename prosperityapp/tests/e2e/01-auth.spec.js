import { test, expect } from '@playwright/test';
import { takeScreenshot } from './helpers/test-helpers.js';

// ── 01: Autenticación E2E ───────────────────────────────────────────────────
test.describe('01 — Autenticación', () => {

  test('01.01 - La landing page (/) carga correctamente', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
    // Should show website content (not redirect to /app without session for public visitors)
    await takeScreenshot(page, '01-landing-page');
  });

  test('01.02 - /app redirige a login si no hay sesión (o carga si hay)', async ({ page }) => {
    await page.goto('/app');
    await page.waitForTimeout(3000);
    // With valid storageState it should show the sidebar/layout
    // Without session it would show login form
    const hasSidebar = await page.locator('#sidebar-nav, nav').first().isVisible().catch(() => false);
    const hasLoginForm = await page.locator('input[type="email"]').first().isVisible().catch(() => false);
    expect(hasSidebar || hasLoginForm).toBeTruthy();
    await takeScreenshot(page, '01-app-entry');
  });

  test('01.03 - El sidebar/layout principal es visible tras autenticación', async ({ page }) => {
    await page.goto('/app');
    await page.waitForTimeout(2000);
    const sidebar = page.locator('#sidebar-nav, aside, nav').first();
    await expect(sidebar).toBeVisible({ timeout: 10000 });
  });

  test('01.04 - La ruta /auth/callback existe y no da error 404', async ({ page }) => {
    await page.goto('/auth/callback');
    await page.waitForTimeout(2000);
    // Should show the callback page content (processing/error/redirect)
    await expect(page.locator('body')).toBeVisible();
    // Should NOT show "Página no encontrada"
    const notFound = page.locator('text=404');
    const is404 = await notFound.isVisible().catch(() => false);
    expect(is404).toBeFalsy();
  });

  test('01.05 - La ruta /auth/update-password existe', async ({ page }) => {
    await page.goto('/auth/update-password');
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).toBeVisible();
  });
});
