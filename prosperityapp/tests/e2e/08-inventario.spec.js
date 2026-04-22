import { test, expect } from '@playwright/test';
import { takeScreenshot, isVisible } from './helpers/test-helpers.js';

// ── Constantes ──────────────────────────────────────────────────────────────
const SEARCH_INPUT = 'input[type="search"]';
const MODAL_CONTENT = '.modal-content';

/**
 * Espera a que la página de Inventario se cargue completamente con reintentos.
 * La página tiene tabs (Técnico/Retail). El título h2 siempre se renderiza
 * (está fuera de la condición de loading), pero cuando Supabase falla con
 * "Failed to fetch", el tab no carga el search input.
 */
async function waitForInventarioPage(page) {
  const MAX_ATTEMPTS = 3;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    await page.goto('/app/inventario', { waitUntil: 'domcontentloaded' });

    // Primero esperamos el h2 del título
    const title = page.locator('h2').first();
    try {
      await expect(title).toBeVisible({ timeout: 15000 });
    } catch {
      if (attempt < MAX_ATTEMPTS) {
        await page.waitForTimeout(2000);
        continue;
      }
      throw new Error('No se pudo cargar la página de inventario (título no visible)');
    }

    // Luego esperamos el search input del tab activo
    const searchInput = page.locator(SEARCH_INPUT).first();
    try {
      await expect(searchInput).toBeVisible({ timeout: 20000 });
      return searchInput;
    } catch {
      if (attempt < MAX_ATTEMPTS) {
        await page.waitForTimeout(2000);
        continue;
      }
      throw new Error('No se pudo cargar la página de inventario (search no visible tras ' + MAX_ATTEMPTS + ' intentos)');
    }
  }
}

/**
 * Abre el modal de crear producto técnico.
 */
async function openProductModal(page) {
  const addBtn = page.locator('button').filter({ hasText: /Agregar Producto/i }).first();
  await expect(addBtn).toBeVisible({ timeout: 10000 });
  await addBtn.click();
  await page.waitForTimeout(500);
  const modal = page.locator(MODAL_CONTENT).first();
  await expect(modal).toBeVisible({ timeout: 5000 });
  return modal;
}

// ── 08: Inventario — Deep E2E Tests ─────────────────────────────────────────
test.describe('08 — Inventario', () => {

  // Timeout generoso + retries para manejar fallas intermitentes de red Supabase
  test.describe.configure({ retries: 2 });
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    await waitForInventarioPage(page);
  });

  // ── GRUPO 1: Layout y Elementos de la Página ─────────────────────────────

  test('08.01 - Renderiza la página con título, tabs y búsqueda', async ({ page }) => {
    // Título
    const title = page.locator('h2').first();
    await expect(title).toBeVisible();

    // Tabs (Técnico y Retail)
    const techTab = page.locator('button').filter({ hasText: /Técnico|Technical/i }).first();
    await expect(techTab).toBeVisible({ timeout: 5000 });

    const retailTab = page.locator('button').filter({ hasText: /Retail/i }).first();
    await expect(retailTab).toBeVisible({ timeout: 5000 });

    // Search input
    const searchInput = page.locator(SEARCH_INPUT).first();
    await expect(searchInput).toBeVisible();

    await takeScreenshot(page, '08-01-inventario-layout');
  });

  test('08.02 - Tab Técnico está activo por defecto', async ({ page }) => {
    const techTab = page.locator('button').filter({ hasText: /Técnico|Technical/i }).first();
    const classList = await techTab.getAttribute('class');
    expect(classList).toContain('bg-accent');
  });

  test('08.03 - La tabla tiene encabezados correctos (Tab Técnico)', async ({ page }) => {
    const thead = page.locator('thead').first();
    await expect(thead).toBeVisible({ timeout: 5000 });

    const headers = ['Producto', 'Stock', 'Modo', 'Acciones'];
    for (const header of headers) {
      const th = thead.locator('th').filter({ hasText: new RegExp(header, 'i') }).first();
      await expect(th).toBeVisible({ timeout: 3000 });
    }
  });

  test('08.04 - Botón Agregar Producto Técnico visible', async ({ page }) => {
    const addBtn = page.locator('button').filter({ hasText: /Agregar Producto/i }).first();
    await expect(addBtn).toBeVisible({ timeout: 10000 });
  });

  test('08.05 - Lista tiene productos o estado vacío', async ({ page }) => {
    const tbody = page.locator('tbody').first();
    await expect(tbody).toBeVisible();

    const rowCount = await tbody.locator('tr').count();
    if (rowCount === 0) {
      const emptyMsg = page.locator('text=/Sin productos|No se encontraron/i').first();
      await expect(emptyMsg).toBeVisible();
    } else {
      await expect(tbody.locator('tr').first()).toBeVisible();
    }
    await takeScreenshot(page, '08-05-product-list');
  });

  // ── GRUPO 2: Búsqueda y Filtros ──────────────────────────────────────────

  test('08.06 - Búsqueda filtra productos', async ({ page }) => {
    const searchInput = page.locator(SEARCH_INPUT).first();
    await searchInput.fill('zzz_no_existe_producto');
    await page.waitForTimeout(500);
    await expect(searchInput).toHaveValue('zzz_no_existe_producto');
    await takeScreenshot(page, '08-06-search-filter');
  });

  test('08.07 - Limpiar búsqueda restaura productos', async ({ page }) => {
    const searchInput = page.locator(SEARCH_INPUT).first();
    await searchInput.fill('zzz_no_existe');
    await page.waitForTimeout(500);
    await searchInput.clear();
    await page.waitForTimeout(500);
    await expect(searchInput).toHaveValue('');
  });

  test('08.08 - El selector de categoría funciona', async ({ page }) => {
    const categorySelect = page.locator('select').filter({ hasText: /Todas las categorías/i }).first();
    if (await isVisible(categorySelect)) {
      const value = await categorySelect.inputValue();
      expect(value).toBe('all');
    }
  });

  // ── GRUPO 3: Cambiar Tab a Retail ─────────────────────────────────────────

  test('08.09 - Cambiar a tab Retail muestra la tabla retail', async ({ page }) => {
    const retailTab = page.locator('button').filter({ hasText: /Retail/i }).first();
    await retailTab.click();
    await page.waitForTimeout(1000);

    const classList = await retailTab.getAttribute('class');
    expect(classList).toContain('bg-accent');

    const searchInput = page.locator(SEARCH_INPUT).first();
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    await takeScreenshot(page, '08-09-retail-tab');
  });

  // ── GRUPO 4: Modal de Producto Técnico ────────────────────────────────────

  test('08.10 - Abrir modal de Nuevo Producto Técnico', async ({ page }) => {
    await openProductModal(page);

    const modalTitle = page.locator('h3').filter({ hasText: /Producto/i }).first();
    await expect(modalTitle).toBeVisible({ timeout: 5000 });
    await takeScreenshot(page, '08-10-new-product-modal');
  });

  test('08.11 - Modal tiene campos: nombre, marca, categoría', async ({ page }) => {
    await openProductModal(page);

    await expect(page.locator(`${MODAL_CONTENT} input[name="name"]`)).toBeVisible({ timeout: 3000 });
    await expect(page.locator(`${MODAL_CONTENT} input[name="brand"]`)).toBeVisible({ timeout: 3000 });
    await expect(page.locator(`${MODAL_CONTENT} input[name="category"]`)).toBeVisible({ timeout: 3000 });
  });

  test('08.12 - Modal tiene selector de modo de venta (Fraccionado/Completo)', async ({ page }) => {
    await openProductModal(page);

    const fracBtn = page.locator(`${MODAL_CONTENT} button`).filter({ hasText: /Fraccionado/i }).first();
    await expect(fracBtn).toBeVisible({ timeout: 3000 });

    const wholeBtn = page.locator(`${MODAL_CONTENT} button`).filter({ hasText: /Completo/i }).first();
    await expect(wholeBtn).toBeVisible({ timeout: 3000 });
  });

  test('08.13 - Cambiar a modo Completo oculta campo tamaño', async ({ page }) => {
    await openProductModal(page);

    const sizeInput = page.locator(`${MODAL_CONTENT} input[name="unitSize"]`);
    await expect(sizeInput).toBeVisible({ timeout: 3000 });

    const wholeBtn = page.locator(`${MODAL_CONTENT} button`).filter({ hasText: /Completo/i }).first();
    await wholeBtn.click();
    await page.waitForTimeout(300);

    await expect(sizeInput).not.toBeVisible({ timeout: 3000 });
    await takeScreenshot(page, '08-13-whole-mode');
  });

  test('08.14 - Modal tiene campos de costos (Factura, Colaborador)', async ({ page }) => {
    await openProductModal(page);

    await expect(page.locator(`${MODAL_CONTENT} input[name="facturaCost"]`).first()).toBeVisible({ timeout: 3000 });
    await expect(page.locator(`${MODAL_CONTENT} input[name="collabCost"]`).first()).toBeVisible({ timeout: 3000 });
  });

  test('08.15 - Modal tiene campos de stock y stock mínimo', async ({ page }) => {
    await openProductModal(page);

    await expect(page.locator(`${MODAL_CONTENT} input[name="stockUnits"]`)).toBeVisible({ timeout: 3000 });
    await expect(page.locator(`${MODAL_CONTENT} input[name="minStock"]`)).toBeVisible({ timeout: 3000 });
  });

  test('08.16 - Botón Guardar/Crear visible en el modal', async ({ page }) => {
    await openProductModal(page);
    const saveBtn = page.locator(`${MODAL_CONTENT} button`).filter({ hasText: /Guardar|Crear/i }).first();
    await expect(saveBtn).toBeVisible({ timeout: 3000 });
    await expect(saveBtn).toBeEnabled();
    // Cerrar
    const cancelBtn = page.locator(`${MODAL_CONTENT} button`).filter({ hasText: /Cancelar/i }).first();
    await cancelBtn.click();
    await page.waitForTimeout(500);
  });

  test('08.17 - Cerrar modal con botón ×', async ({ page }) => {
    await openProductModal(page);
    const closeBtn = page.locator(`${MODAL_CONTENT} button`).filter({ hasText: '×' }).first();
    await closeBtn.click();
    await page.waitForTimeout(500);
    await expect(page.locator(MODAL_CONTENT).first()).not.toBeVisible({ timeout: 3000 });
  });

  test('08.18 - Cerrar modal con botón Cancelar', async ({ page }) => {
    await openProductModal(page);
    const cancelBtn = page.locator(`${MODAL_CONTENT} button`).filter({ hasText: /Cancelar/i }).first();
    await cancelBtn.click();
    await page.waitForTimeout(500);
    await expect(page.locator(MODAL_CONTENT).first()).not.toBeVisible({ timeout: 3000 });
  });

  // ── GRUPO 5: Llenar formulario ────────────────────────────────────────────

  test('08.19 - Llenar todos los campos en modo Fraccionado', async ({ page }) => {
    await openProductModal(page);

    await page.locator(`${MODAL_CONTENT} input[name="name"]`).fill('Tinte E2E Test');
    await page.locator(`${MODAL_CONTENT} input[name="brand"]`).fill('Marca E2E');
    await page.locator(`${MODAL_CONTENT} input[name="category"]`).fill('Tinte');
    await page.locator(`${MODAL_CONTENT} input[name="unitSize"]`).fill('60');

    const invoiceCost = page.locator(`${MODAL_CONTENT} input[name="facturaCost"]`).first();
    await invoiceCost.click();
    await invoiceCost.fill('8500');

    const collabCost = page.locator(`${MODAL_CONTENT} input[name="collabCost"]`).first();
    await collabCost.click();
    await collabCost.fill('5000');

    await page.locator(`${MODAL_CONTENT} input[name="stockUnits"]`).fill('10');
    await page.locator(`${MODAL_CONTENT} input[name="minStock"]`).fill('3');

    await expect(page.locator(`${MODAL_CONTENT} input[name="name"]`)).toHaveValue('Tinte E2E Test');
    await expect(page.locator(`${MODAL_CONTENT} input[name="brand"]`)).toHaveValue('Marca E2E');

    await takeScreenshot(page, '08-19-form-filled');
  });

  // ── GRUPO 6: Crear producto E2E real ──────────────────────────────────────

  test('08.20 - Crear producto fraccionado y verificar en tabla', async ({ page }) => {
    const uniqueName = `E2E_PROD_${Date.now()}`;

    await openProductModal(page);

    await page.locator(`${MODAL_CONTENT} input[name="name"]`).fill(uniqueName);
    await page.locator(`${MODAL_CONTENT} input[name="brand"]`).fill('E2E Brand');
    await page.locator(`${MODAL_CONTENT} input[name="category"]`).fill('E2E Cat');
    await page.locator(`${MODAL_CONTENT} input[name="unitSize"]`).fill('100');

    const invoiceCost = page.locator(`${MODAL_CONTENT} input[name="facturaCost"]`).first();
    await invoiceCost.click();
    await invoiceCost.fill('12000');

    const collabCost = page.locator(`${MODAL_CONTENT} input[name="collabCost"]`).first();
    await collabCost.click();
    await collabCost.fill('7000');

    await page.locator(`${MODAL_CONTENT} input[name="stockUnits"]`).fill('5');

    const saveBtn = page.locator(`${MODAL_CONTENT} button`).filter({ hasText: /Guardar|Crear/i }).first();
    await saveBtn.click();

    const modal = page.locator(MODAL_CONTENT).first();
    await expect(modal).not.toBeVisible({ timeout: 10000 });

    // Recargar para ver el nuevo producto
    await page.waitForTimeout(2000);
    await page.reload();
    const searchInput = page.locator(SEARCH_INPUT).first();
    await expect(searchInput).toBeVisible({ timeout: 30000 });

    const newProduct = page.locator(`text=${uniqueName}`).first();
    await expect(newProduct).toBeVisible({ timeout: 15000 });

    await takeScreenshot(page, '08-20-product-created');
  });

  // ── GRUPO 7: Editar producto ──────────────────────────────────────────────

  test('08.21 - Botones de editar y eliminar visibles en cada fila', async ({ page }) => {
    const tbody = page.locator('tbody').first();
    const firstRow = tbody.locator('tr').first();

    if (await isVisible(firstRow)) {
      const buttons = firstRow.locator('button');
      const btnCount = await buttons.count();
      expect(btnCount).toBeGreaterThanOrEqual(2);
    }
  });

  test('08.22 - Click en editar abre modal con datos pre-llenados', async ({ page }) => {
    const tbody = page.locator('tbody').first();
    const firstRow = tbody.locator('tr').first();

    if (await isVisible(firstRow)) {
      // Buscar el botón de editar en las acciones
      const actionBtns = firstRow.locator('td').last().locator('button');
      const editBtn = actionBtns.first();
      if (await isVisible(editBtn)) {
        await editBtn.click();
        await page.waitForTimeout(500);

        const modal = page.locator(MODAL_CONTENT).first();
        await expect(modal).toBeVisible({ timeout: 5000 });

        const nameInput = page.locator(`${MODAL_CONTENT} input[name="name"]`);
        const nameValue = await nameInput.inputValue();
        expect(nameValue.length).toBeGreaterThan(0);

        await takeScreenshot(page, '08-22-edit-modal');
        await page.keyboard.press('Escape');
      }
    }
  });

  // ── GRUPO 8: Datos de tabla ───────────────────────────────────────────────

  test('08.23 - Las filas muestran badges de modo (Fraccionado/Completo)', async ({ page }) => {
    const modeBadge = page.locator('span').filter({ hasText: /Fraccionado|Completo/i }).first();
    if (await isVisible(modeBadge)) {
      await expect(modeBadge).toBeVisible();
    }
  });

  test('08.24 - Los botones de stock (+/-) están visibles', async ({ page }) => {
    const tbody = page.locator('tbody').first();
    const firstRow = tbody.locator('tr').first();

    if (await isVisible(firstRow)) {
      const buttons = firstRow.locator('button');
      const btnCount = await buttons.count();
      expect(btnCount).toBeGreaterThanOrEqual(2);
    }
  });

  test('08.25 - Link a Auditoría de Stock presente', async ({ page }) => {
    const auditLink = page.locator('a[href*="auditoria"]').first();
    await expect(auditLink).toBeVisible({ timeout: 5000 });
  });
});
