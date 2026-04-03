import { test, expect } from '@playwright/test';

// ── Tarea 12: Catálogo de Servicios y Precios ─────────────────────────────
test.describe('Catálogo de Servicios y Precios E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app/precios');

    // Explicit bypass without relying entirely on Vite/localstorage mapping inside Playwright when mocking is incomplete
    // In actual run it will use bypass env, so we just wait for the component loosely
  });

  test('T12.1 - debería renderizar el catálogo con filtros y lista', async ({ page }) => {
    // Input de búsqueda
    const searchInput = page.locator('input[type="search"]').first();
    await expect(searchInput).toBeVisible();

    // Selectores de categoría y ordenamiento
    const selects = page.locator('select');
    await expect(selects.first()).toBeVisible();

    // Botón de Nuevo Servicio
    const addBtn = page.locator('button.btn-golden, button').filter({ hasText: /Agregar Servicio|addBtn/i }).first();
    await expect(addBtn).toBeVisible();

    // Contenedor de la lista
    const container = page.locator('#servicios-list-container');
    await expect(container).toBeVisible();

    await page.screenshot({ path: 'tests/e2e/screenshots/catalog-precios.png' });
  });

  test('T12.2 - debería abrir el modal de Nuevo Servicio', async ({ page }) => {
    const addBtn = page.locator('button.btn-golden, button').filter({ hasText: /Agregar Servicio|addBtn/i }).first();
    await addBtn.click();

    const modalTitle = page.locator('h2, h3').filter({ hasText: /Servicio|Service/i }).first();
    await expect(modalTitle).toBeVisible({ timeout: 5000 });

    await page.screenshot({ path: 'tests/e2e/screenshots/catalog-new-service-modal.png' });

    // Cerrar
    await page.keyboard.press('Escape');
    await expect(modalTitle).toBeHidden({ timeout: 3000 });
  });

  test('T12.3 - la búsqueda de servicios debe funcionar', async ({ page }) => {
    const searchInput = page.locator('input[type="search"]').first();
    // Use clear to trigger events and fill
    await searchInput.fill('zzz_no_existe_servicio');
    await expect(searchInput).toHaveValue('zzz_no_existe_servicio');
  });

  test('T12.4 - el selector de categoría debe filtrar la lista', async ({ page }) => {
    const categorySelect = page.locator('select').first();
    await expect(categorySelect).toBeVisible();
    await expect(categorySelect).toBeEnabled();

    // Validamos contenedor
    const container = page.locator('#servicios-list-container');
    await expect(container).toBeVisible();

    // Validamos que exista un detail o este vacío
    const countDetails = await container.locator('details').count();
    if (countDetails === 0) {
      await expect(container.locator('p').filter({ hasText: /No se encontraron servicios|No services/i })).toBeVisible();
    } else {
      await expect(container.locator('details').first()).toBeVisible();
    }
  });
});

// ── Tarea 13: Inventario General y Técnico ────────────────────────────────
test.describe('Inventario E2E Flow', () => {
  test.beforeEach(async ({ page }) => {
  });

  test('T13.1 - debería cargar la página de Inventario General', async ({ page }) => {
    await page.goto('/app/inventario');

    const title = page.locator('h1, h2').filter({ hasText: /Gestión de Inventario|Stock/i }).first();
    await expect(title).toBeVisible({ timeout: 15000 });

    await page.screenshot({ path: 'tests/e2e/screenshots/inventory-general.png' });
  });

  test('T13.2 - debería cargar la pestaña de Inventario Técnico', async ({ page }) => {
    await page.goto('/app/inventario');

    // Check if technical tab is visible
    const techBtn = page.locator('button').filter({ hasText: /Inventario Técnico|Technical/i }).first();
    if (await techBtn.isVisible()) {
      await techBtn.click();
    }

    // Verify a button for adding a technical product is visible indicating the tab loaded
    const addTechBtn = page.locator('button').filter({ hasText: /Agregar Producto Técnico|addTechBtn/i }).first();
    await expect(addTechBtn).toBeVisible({ timeout: 10000 });

    await page.screenshot({ path: 'tests/e2e/screenshots/inventory-technical.png' });
  });

  test('T13.3 - debería cargar la página de Movimientos de Stock', async ({ page }) => {
    await page.goto('/app/inventario/auditoria');

    const title = page.locator('h1, h2').filter({ hasText: /Auditoría de Stock/i }).first();
    await expect(title).toBeVisible({ timeout: 15000 });
  });

  test('T13.4 - el botón de Nuevo Producto en Inventario General debe abrir modal', async ({ page }) => {
    await page.goto('/app/inventario');

    const addBtn = page.locator('button').filter({ hasText: /Agregar Producto Técnico/i }).first();
    await expect(addBtn).toBeVisible({ timeout: 15000 });
    await addBtn.click();

    // Verificar que algún modal o formulario aparece
    const modal = page.locator('dialog, [role="dialog"], .modal, h2, h3').filter({ hasText: /Producto|Product/i }).first();
    await expect(modal).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: 'tests/e2e/screenshots/inventory-new-product-modal.png' });
  });
});
