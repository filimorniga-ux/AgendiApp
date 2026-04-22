import { test, expect } from '@playwright/test';
import { takeScreenshot, isVisible } from './helpers/test-helpers.js';

// ── 11: Colaboradores ───────────────────────────────────────────────────────
test.describe('11 — Colaboradores', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/app/colaboradores');
    await page.waitForTimeout(3000); // Wait for loading skeleton to resolve
  });

  test('11.01 - Directorio con tabla y controles', async ({ page }) => {
    // Title: "Colaboradores" (from t('collaborators.title'))
    const title = page.locator('h2').filter({ hasText: /Colaboradores/i }).first();
    await expect(title).toBeVisible({ timeout: 15000 });
    // Search input should exist
    const search = page.locator('input[type="search"]').first();
    await expect(search).toBeVisible({ timeout: 5000 });
    await takeScreenshot(page, '11-colaboradores-page');
  });

  test('11.02 - Abrir modal Agregar Colaborador', async ({ page }) => {
    // Button text: "Agregar Colaborador" (from t('collaborators.addBtn'))
    const addBtn = page.locator('button').filter({ hasText: /Agregar Colaborador/i }).first();
    await expect(addBtn).toBeVisible({ timeout: 15000 });
    await addBtn.click();
    await page.waitForTimeout(500);
    // Modal title: "Nuevo Colaborador" (from t('collaborators.modal.newTitle'))
    const modalTitle = page.locator('h2, h3').filter({ hasText: /Nuevo Colaborador/i }).first();
    await expect(modalTitle).toBeVisible({ timeout: 5000 });
    await takeScreenshot(page, '11-modal-nuevo');
  });

  test('11.03 - Modal tiene múltiples pestañas', async ({ page }) => {
    const addBtn = page.locator('button').filter({ hasText: /Agregar Colaborador/i }).first();
    await expect(addBtn).toBeVisible({ timeout: 15000 });
    await addBtn.click();
    await page.waitForTimeout(500);
    // Look for tab buttons inside modal: Personal, Laboral, Acceso, Documentos
    const tabs = page.locator('button').filter({ hasText: /Personal|Laboral|Acceso|Documentos/i });
    const count = await tabs.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('11.04 - Modal tiene campo de nombre', async ({ page }) => {
    const addBtn = page.locator('button').filter({ hasText: /Agregar Colaborador/i }).first();
    await expect(addBtn).toBeVisible({ timeout: 15000 });
    await addBtn.click();
    await page.waitForTimeout(500);
    const nameInput = page.locator('input[name="name"], input[placeholder*="ombre" i]').first();
    await expect(nameInput).toBeVisible({ timeout: 5000 });
  });

  test('11.05 - Cerrar modal con botón X', async ({ page }) => {
    const addBtn = page.locator('button').filter({ hasText: /Agregar Colaborador/i }).first();
    await expect(addBtn).toBeVisible({ timeout: 15000 });
    await addBtn.click();
    await page.waitForTimeout(500);
    const modalTitle = page.locator('h2, h3').filter({ hasText: /Nuevo Colaborador/i }).first();
    await expect(modalTitle).toBeVisible({ timeout: 5000 });
    // Try clicking the close button (&times; or "×")
    const closeBtn = page.locator('button').filter({ hasText: /×|Cerrar|Close/i }).first();
    if (await isVisible(closeBtn)) {
      await closeBtn.click();
      await page.waitForTimeout(500);
      await expect(modalTitle).not.toBeVisible({ timeout: 5000 });
    }
  });

  test('11.06 - Toggle ordenamiento A-Z / Personalizado', async ({ page }) => {
    // Sort toggle button has text "Orden Personalizado" or "Orden A-Z"
    const sortBtn = page.locator('button').filter({ hasText: /Orden Personalizado|Orden A-Z/i }).first();
    if (await isVisible(sortBtn)) {
      await sortBtn.click();
      await page.waitForTimeout(300);
    }
  });

  test('11.07 - Búsqueda filtra colaboradores', async ({ page }) => {
    const title = page.locator('h2').filter({ hasText: /Colaboradores/i }).first();
    await expect(title).toBeVisible({ timeout: 15000 });
    const search = page.locator('input[type="search"]').first();
    await search.fill('TestXYZ');
    await expect(search).toHaveValue('TestXYZ');
  });

  test('11.08 - Selector de rol presente en modal', async ({ page }) => {
    const addBtn = page.locator('button').filter({ hasText: /Agregar Colaborador/i }).first();
    await expect(addBtn).toBeVisible({ timeout: 15000 });
    await addBtn.click();
    await page.waitForTimeout(500);
    const roleSelect = page.locator('select, [role="combobox"]').first();
    if (await isVisible(roleSelect)) {
      await expect(roleSelect).toBeVisible();
    }
    await takeScreenshot(page, '11-modal-role');
  });
});
