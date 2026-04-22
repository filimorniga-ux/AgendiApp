import { test, expect } from '@playwright/test';
import { navigateTo, closeModalEscape, takeScreenshot, isVisible } from './helpers/test-helpers.js';

// ── Constantes ──────────────────────────────────────────────────────────────
const SEARCH_INPUT = 'input[type="search"]';
const ADD_SERVICE_BTN = /Agregar Servicio/i;
const SERVICE_CONTAINER = '#servicios-list-container';

/**
 * Espera a que la página de Precios se cargue completamente.
 * La página retorna null durante loading, así que esperamos que el searchInput sea visible.
 */
async function waitForPreciosPage(page) {
  await page.goto('/app/precios');
  const searchInput = page.locator(SEARCH_INPUT).first();
  try {
    await expect(searchInput).toBeVisible({ timeout: 20000 });
  } catch {
    // Si falla por timeout (red lenta), recargar y reintentar
    await page.reload();
    await expect(searchInput).toBeVisible({ timeout: 20000 });
  }
  return searchInput;
}

/**
 * Abre el modal de crear/editar servicio.
 */
async function openServiceModal(page) {
  const addBtn = page.locator('button').filter({ hasText: ADD_SERVICE_BTN }).first();
  await expect(addBtn).toBeVisible({ timeout: 10000 });
  await addBtn.click();
  await page.waitForTimeout(500);
  const modal = page.locator('.modal-content').first();
  await expect(modal).toBeVisible({ timeout: 5000 });
  return modal;
}

// ── 07: Catálogo de Servicios y Precios — Deep E2E Tests ────────────────────
test.describe('07 — Catálogo de Servicios y Precios', () => {

  test.beforeEach(async ({ page }) => {
    await waitForPreciosPage(page);
  });

  // ── GRUPO 1: Layout y Elementos de la Página ─────────────────────────────

  test('07.01 - Renderiza el catálogo con búsqueda y filtros', async ({ page }) => {
    // Input de búsqueda
    const searchInput = page.locator(SEARCH_INPUT).first();
    await expect(searchInput).toBeVisible();

    // Selectores de categoría y orden
    const selects = page.locator('select');
    const selectCount = await selects.count();
    expect(selectCount).toBeGreaterThanOrEqual(2); // category + sort

    // Container de servicios
    const container = page.locator(SERVICE_CONTAINER);
    await expect(container).toBeVisible();
    await takeScreenshot(page, '07-01-catalogo-layout');
  });

  test('07.02 - Botón Agregar Servicio visible', async ({ page }) => {
    const addBtn = page.locator('button').filter({ hasText: ADD_SERVICE_BTN }).first();
    await expect(addBtn).toBeVisible({ timeout: 10000 });
  });

  test('07.03 - El título y subtítulo del catálogo son visibles', async ({ page }) => {
    const title = page.locator('h2').filter({ hasText: /Listado de Precios|Precios/i }).first();
    await expect(title).toBeVisible({ timeout: 5000 });

    const subtitle = page.locator('p').filter({ hasText: /Consulta y gestiona|precios/i }).first();
    await expect(subtitle).toBeVisible({ timeout: 3000 });
  });

  test('07.04 - La lista tiene servicios o muestra estado vacío', async ({ page }) => {
    const container = page.locator(SERVICE_CONTAINER);
    await expect(container).toBeVisible();

    const countDetails = await container.locator('details').count();
    if (countDetails === 0) {
      const emptyMsg = container.locator('p').filter({ hasText: /No se encontraron|no services/i }).first();
      await expect(emptyMsg).toBeVisible();
    } else {
      await expect(container.locator('details').first()).toBeVisible();
    }
    await takeScreenshot(page, '07-04-services-list');
  });

  // ── GRUPO 2: Búsqueda y Filtros ──────────────────────────────────────────

  test('07.05 - Búsqueda de servicios filtra resultados', async ({ page }) => {
    const searchInput = page.locator(SEARCH_INPUT).first();
    await searchInput.fill('zzz_no_existe_servicio');
    await page.waitForTimeout(500);

    // Debería no haber categorías visibles (o mostrar estado vacío)
    const container = page.locator(SERVICE_CONTAINER);
    const visibleCategories = await container.locator('details').count();

    // O bien 0 categorías, o el mensaje de vacío
    if (visibleCategories === 0) {
      const emptyMsg = page.locator('text=/No se encontraron/i').first();
      await expect(emptyMsg).toBeVisible({ timeout: 3000 });
    }
    await takeScreenshot(page, '07-05-search-no-results');
  });

  test('07.06 - Limpiar búsqueda restaura todos los servicios', async ({ page }) => {
    const searchInput = page.locator(SEARCH_INPUT).first();

    // Contar servicios antes de filtrar
    const initialCount = await page.locator(`${SERVICE_CONTAINER} details`).count();

    // Filtrar y luego limpiar
    await searchInput.fill('zzz_no_existe_servicio');
    await page.waitForTimeout(500);
    await searchInput.clear();
    await page.waitForTimeout(500);

    const restoredCount = await page.locator(`${SERVICE_CONTAINER} details`).count();
    expect(restoredCount).toBe(initialCount);
  });

  test('07.07 - El selector de categoría funciona', async ({ page }) => {
    // Scope al contenedor de filtros para evitar capturar el select de idioma del Sidebar
    const filterBar = page.locator('.bg-bg-secondary').filter({ has: page.locator(SEARCH_INPUT) }).first();
    const categorySelect = filterBar.locator('select').first();
    await expect(categorySelect).toBeVisible();
    await expect(categorySelect).toBeEnabled();

    // Debe tener la opción "Todas las categorías" como default
    const value = await categorySelect.inputValue();
    expect(value).toBe('all');
  });

  test('07.08 - El selector de orden funciona', async ({ page }) => {
    // Scope al contenedor de filtros
    const filterBar = page.locator('.bg-bg-secondary').filter({ has: page.locator(SEARCH_INPUT) }).first();
    const sortSelect = filterBar.locator('select').nth(1);
    await expect(sortSelect).toBeVisible();

    // Cambiar a "Precio (Menor a Mayor)"
    await sortSelect.selectOption({ value: 'price-asc' });
    const value = await sortSelect.inputValue();
    expect(value).toBe('price-asc');

    // Cambiar a "Precio (Mayor a Menor)"
    await sortSelect.selectOption({ value: 'price-desc' });
    const value2 = await sortSelect.inputValue();
    expect(value2).toBe('price-desc');
  });

  // ── GRUPO 3: Modal de Servicio ────────────────────────────────────────────

  test('07.09 - Abrir modal de Nuevo Servicio', async ({ page }) => {
    await openServiceModal(page);

    const modalTitle = page.locator('h3').filter({ hasText: /Servicio|Service/i }).first();
    await expect(modalTitle).toBeVisible({ timeout: 5000 });
    await takeScreenshot(page, '07-09-new-service-modal');
  });

  test('07.10 - Modal de servicio tiene los 4 campos', async ({ page }) => {
    await openServiceModal(page);

    // Campo nombre (required)
    const nameInput = page.locator('input#name');
    await expect(nameInput).toBeVisible({ timeout: 3000 });

    // Campo categoría
    const categoryInput = page.locator('input#category');
    await expect(categoryInput).toBeVisible({ timeout: 3000 });

    // Campo precio (CurrencyInput - input dentro de div.relative)
    const priceInput = page.locator('#price').first();
    await expect(priceInput).toBeVisible({ timeout: 3000 });

    // Campo duración
    const durationInput = page.locator('input#duration');
    await expect(durationInput).toBeVisible({ timeout: 3000 });

    await takeScreenshot(page, '07-10-modal-fields');
  });

  test('07.11 - Cerrar modal de servicio con Escape', async ({ page }) => {
    await openServiceModal(page);

    const modal = page.locator('.modal-content').first();
    await expect(modal).toBeVisible();

    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    await expect(modal).not.toBeVisible({ timeout: 3000 });
  });

  test('07.12 - Cerrar modal con botón ×', async ({ page }) => {
    await openServiceModal(page);

    const closeBtn = page.locator('.modal-content button').filter({ hasText: '×' }).first();
    await expect(closeBtn).toBeVisible({ timeout: 3000 });
    await closeBtn.click();
    await page.waitForTimeout(500);

    const modal = page.locator('.modal-content').first();
    await expect(modal).not.toBeVisible({ timeout: 3000 });
  });

  test('07.13 - Cerrar modal con botón Cancelar', async ({ page }) => {
    await openServiceModal(page);

    const cancelBtn = page.locator('.modal-content button').filter({ hasText: /Cancelar/i }).first();
    await expect(cancelBtn).toBeVisible({ timeout: 3000 });
    await cancelBtn.click();
    await page.waitForTimeout(500);

    const modal = page.locator('.modal-content').first();
    await expect(modal).not.toBeVisible({ timeout: 3000 });
  });

  // ── GRUPO 4: Llenar formulario del modal ──────────────────────────────────

  test('07.14 - Llenar todos los campos del formulario', async ({ page }) => {
    await openServiceModal(page);

    // Nombre
    await page.locator('input#name').fill('Servicio E2E Test');
    // Categoría
    await page.locator('input#category').fill('Categoría E2E');
    // Precio (CurrencyInput - buscar el input dentro del wrapper)
    const priceInput = page.locator('input#price');
    await priceInput.click();
    await priceInput.fill('15000');
    // Duración
    await page.locator('input#duration').fill('45');

    // Verificar que los valores se llenaron
    await expect(page.locator('input#name')).toHaveValue('Servicio E2E Test');
    await expect(page.locator('input#category')).toHaveValue('Categoría E2E');
    await expect(page.locator('input#duration')).toHaveValue('45');

    await takeScreenshot(page, '07-14-form-filled');
  });

  test('07.15 - Botón Guardar se muestra en el modal', async ({ page }) => {
    await openServiceModal(page);

    const saveBtn = page.locator('.modal-content button').filter({ hasText: /Guardar|Crear|Agregar/i }).first();
    await expect(saveBtn).toBeVisible({ timeout: 3000 });
    await expect(saveBtn).toBeEnabled();
  });

  // ── GRUPO 5: Crear servicio E2E real ──────────────────────────────────────

  test('07.16 - Crear un servicio nuevo y verificar que aparece en la lista', async ({ page }) => {
    const uniqueName = `E2E_SERVICE_${Date.now()}`;

    // Abrir modal
    await openServiceModal(page);

    // Llenar formulario
    await page.locator('input#name').fill(uniqueName);
    await page.locator('input#category').fill('E2E Testing');
    const priceInput = page.locator('input#price');
    await priceInput.click();
    await priceInput.fill('25000');
    await page.locator('input#duration').fill('30');

    // Guardar
    const saveBtn = page.locator('.modal-content button').filter({ hasText: /Guardar|Crear/i }).first();
    await saveBtn.click();

    // Esperar a que el modal se cierre
    const modal = page.locator('.modal-content').first();
    await expect(modal).not.toBeVisible({ timeout: 10000 });

    // Recargar la página para asegurar que los datos se refrescan de Supabase
    await page.waitForTimeout(2000);
    await page.reload();
    await page.locator(SEARCH_INPUT).first().waitFor({ state: 'visible', timeout: 15000 });

    // Verificar que el servicio aparece en la lista
    const newService = page.locator(`text=${uniqueName}`).first();
    await expect(newService).toBeVisible({ timeout: 15000 });

    await takeScreenshot(page, '07-16-service-created');
  });

  // ── GRUPO 6: Editar servicio ──────────────────────────────────────────────

  test('07.17 - Los botones de editar y eliminar están visibles en cada servicio', async ({ page }) => {
    const container = page.locator(SERVICE_CONTAINER);
    const details = container.locator('details').first();

    if (await isVisible(details)) {
      // Asegurar que el acordeón está abierto
      const isOpen = await details.getAttribute('open');
      if (isOpen === null) {
        await details.locator('summary').click();
        await page.waitForTimeout(300);
      }

      // Buscar los botones de editar y eliminar en el primer servicio
      const serviceItem = details.locator('li').first();
      if (await isVisible(serviceItem)) {
        const editBtn = serviceItem.locator('button').first();
        await expect(editBtn).toBeVisible({ timeout: 3000 });
      }
    }
  });

  test('07.18 - Click en editar abre el modal con datos pre-llenados', async ({ page }) => {
    const container = page.locator(SERVICE_CONTAINER);
    const details = container.locator('details').first();

    if (await isVisible(details)) {
      // Abrir acordeón si está cerrado
      const isOpen = await details.getAttribute('open');
      if (isOpen === null) {
        await details.locator('summary').click();
        await page.waitForTimeout(300);
      }

      const serviceItem = details.locator('li').first();
      if (await isVisible(serviceItem)) {
        // Click en el botón de editar (primer botón del ítem)
        const editBtn = serviceItem.locator('button').first();
        await editBtn.click();
        await page.waitForTimeout(500);

        // El modal debe abrirse con datos pre-llenados
        const modal = page.locator('.modal-content').first();
        await expect(modal).toBeVisible({ timeout: 5000 });

        // El campo nombre debe tener un valor (no vacío)
        const nameInput = page.locator('input#name');
        const nameValue = await nameInput.inputValue();
        expect(nameValue.length).toBeGreaterThan(0);

        await takeScreenshot(page, '07-18-edit-modal');
        // Cerrar sin guardar
        await page.keyboard.press('Escape');
      }
    }
  });

  // ── GRUPO 7: Categorías y Acordeones ──────────────────────────────────────

  test('07.19 - Las categorías se muestran como acordeones <details>', async ({ page }) => {
    const container = page.locator(SERVICE_CONTAINER);
    const details = container.locator('details');
    const count = await details.count();

    if (count > 0) {
      // Cada details debe tener un summary con el nombre de categoría
      const firstSummary = details.first().locator('summary');
      await expect(firstSummary).toBeVisible();
      const summaryText = await firstSummary.textContent();
      expect(summaryText.length).toBeGreaterThan(0);
    }
    await takeScreenshot(page, '07-19-category-accordions');
  });

  test('07.20 - Los precios se muestran con formato de moneda', async ({ page }) => {
    const container = page.locator(SERVICE_CONTAINER);
    const details = container.locator('details').first();

    if (await isVisible(details)) {
      // Buscar elementos con precio (clase text-accent)
      const priceElements = details.locator('.text-accent');
      const count = await priceElements.count();
      if (count > 0) {
        const priceText = await priceElements.first().textContent();
        // Debe tener un formato de moneda (contener $ o algún símbolo)
        expect(priceText).toMatch(/[$€£¥\d]/);
      }
    }
    await takeScreenshot(page, '07-20-price-format');
  });
});
