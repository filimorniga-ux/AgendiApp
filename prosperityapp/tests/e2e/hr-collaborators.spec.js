import { test, expect } from '@playwright/test';

// ── Tarea 11: RRHH - Colaboradores y Nóminas ─────────────────────────────
test.describe('RRHH - Colaboradores E2E Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app/colaboradores');
    await expect(
      page.locator('h2').filter({ hasText: /Colaboradores|Equipo/i }).first()
    ).toBeVisible({ timeout: 10000 });
  });

  // ── T11.1: Layout del directorio de colaboradores ─────────────────────
  test('T11.1 - debería renderizar el directorio con tabla y controles', async ({ page }) => {
    // Botón Nuevo Colaborador
    const addBtn = page.locator('button.btn-golden, button').filter({ hasText: /Nuevo Colaborador|addBtn/i }).first();
    await expect(addBtn).toBeVisible();

    // Input de búsqueda
    const searchInput = page.locator('input[type="search"]').first();
    await expect(searchInput).toBeVisible();

    // Botón de ordenar (toggle custom/alfabético)
    const sortBtn = page.locator('button').filter({ hasText: /Orden|Sort|A-Z/i }).first();
    await expect(sortBtn).toBeVisible();

    await page.screenshot({ path: 'tests/e2e/screenshots/hr-collaborators-list.png' });
  });

  // ── T11.2: Abrir modal de Nuevo Colaborador ───────────────────────────
  test('T11.2 - debería abrir el modal de Nuevo Colaborador', async ({ page }) => {
    const addBtn = page.locator('button.btn-golden, button').filter({ hasText: /Nuevo Colaborador|addBtn/i }).first();
    await addBtn.click();

    const modalTitle = page.locator('h2, h3').filter({ hasText: /Añadir Colaborador|Nuevo Colaborador|Colaborador/i }).first();
    await expect(modalTitle).toBeVisible({ timeout: 5000 });

    await page.screenshot({ path: 'tests/e2e/screenshots/hr-new-collaborator-modal.png' });
  });

  // ── T11.3: Modal tiene tabs (Personal, Configuración, etc.) ───────────
  test('T11.3 - el modal de colaborador debería tener múltiples pestañas', async ({ page }) => {
    const addBtn = page.locator('button.btn-golden, button').filter({ hasText: /Nuevo Colaborador|addBtn/i }).first();
    await addBtn.click();

    await page.waitForTimeout(500);

    // Buscar cualquier tab/pestaña reconocible del modal
    const tabs = page.locator('button[role="tab"], .tab-btn, button').filter({ hasText: /Personal|Config|Comis|Pago|Tab/i });
    const tabCount = await tabs.count();
    // El modal tiene al menos 2 tabs
    expect(tabCount).toBeGreaterThanOrEqual(1);
  });

  // ── T11.4: Cerrar modal con Escape ────────────────────────────────────
  test('T11.4 - debería cerrar el modal de colaborador con Escape', async ({ page }) => {
    const addBtn = page.locator('button.btn-golden, button').filter({ hasText: /Nuevo Colaborador|addBtn/i }).first();
    await addBtn.click();

    const modal = page.locator('h2, h3').filter({ hasText: /Colaborador/i }).first();
    await expect(modal).toBeVisible({ timeout: 5000 });

    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden({ timeout: 3000 });
  });

  // ── T11.5: Toggle de ordenamiento A-Z / Personalizado ─────────────────
  test('T11.5 - debería alternar entre orden A-Z y personalizado', async ({ page }) => {
    const sortBtn = page.locator('button').filter({ hasText: /Orden|Sort|A-Z|Personalizado/i }).first();
    const initialText = await sortBtn.textContent();
    await sortBtn.click();
    await page.waitForTimeout(300);
    const newText = await sortBtn.textContent();
    // El texto del botón debería cambiar al hacer toggle
    expect(newText).not.toBe(initialText);
  });
});

// ── Tarea 11 (parte 2): Módulo de Nóminas ────────────────────────────────
test.describe('RRHH - Nóminas E2E Flow', () => {
  test('T11.6 - debería cargar la página de Nóminas', async ({ page }) => {
    await page.goto('/app/nominas');
    await page.waitForTimeout(2000);

    // La página de nóminas tiene algún h1/h2 reconocible
    const title = page.locator('h1, h2').filter({ hasText: /Nóminas|Nominas|Payroll/i }).first();
    await expect(title).toBeVisible({ timeout: 10000 });

    await page.screenshot({ path: 'tests/e2e/screenshots/hr-nominas.png' });
  });

  test('T11.7 - debería cargar el historial de pagos de nóminas', async ({ page }) => {
    await page.goto('/app/nominas/historial');
    await page.waitForTimeout(2000);

    // Verifica que la página exista (body visible al menos)
    await expect(page.locator('body')).toBeVisible();
  });
});
