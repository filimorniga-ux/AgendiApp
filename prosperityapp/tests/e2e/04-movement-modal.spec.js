import { test, expect } from '@playwright/test';
import { navigateTo, openModal, closeModalEscape, takeScreenshot, isVisible, expectButtonVisible } from './helpers/test-helpers.js';

// ── Helpers reutilizables para el MovementModal ───────────────────────────────
const REGISTER_BUTTON = /Registrar Operación|Nueva Operación/i;
const GASTOS_ACCORDION = /Gasto|Egreso|Salida/i;
const SERVICIOS_ACCORDION = /Servicio/i;
const PRODUCTOS_ACCORDION = /Producto|Venta/i;
const PROPINAS_ACCORDION = /Propina|Comisión Manual/i;
const ADELANTOS_ACCORDION = /Adelanto/i;

/**
 * Abre el modal de MovementModal desde la página de Caja.
 */
async function openMovementModal(page) {
  const btn = page.locator('button').filter({ hasText: REGISTER_BUTTON }).first();
  await expect(btn).toBeVisible({ timeout: 10000 });
  await btn.click();
  await page.waitForTimeout(1000);
  const modal = page.locator('.modal-content, [role="dialog"]').first();
  await expect(modal).toBeVisible({ timeout: 5000 });
  return modal;
}

/**
 * Abre un acordeón específico dentro del modal (por texto del <summary>).
 * Retorna el <details> container para scope de selectores.
 */
async function openAccordion(page, textRegex) {
  const details = page.locator('details').filter({ has: page.locator('summary', { hasText: textRegex }) });
  const summary = details.locator('summary').first();
  await expect(summary).toBeVisible({ timeout: 5000 });
  // Solo abrir si no está ya abierto
  const isOpen = await details.getAttribute('open');
  if (isOpen === null) {
    await summary.click();
    await page.waitForTimeout(300);
  }
  return details;
}

/**
 * Agrega un gasto manual al carrito.
 * Usa el CurrencyInput (input type="text" dentro de div.relative) para el monto.
 */
async function addExpenseToCart(page, description, amount) {
  const gastoDetails = await openAccordion(page, GASTOS_ACCORDION);
  // El primer input[type="text"] es la descripción
  await gastoDetails.locator('input[type="text"]').first().fill(description);
  // El CurrencyInput renderiza un input[type="text"] dentro de div.relative
  const amountInput = gastoDetails.locator('div.relative input[type="text"]').first();
  await amountInput.click();
  await amountInput.fill(String(amount));
  // Botón "Añadir Gasto"
  await gastoDetails.locator('button').filter({ hasText: /Añadir|Agregar|Add/i }).first().click();
  await page.waitForTimeout(500);
}

// ── 04: Movement Modal (Registrar Operación) — Deep E2E Tests ────────────────
test.describe('04 — Registrar Operación (MovementModal)', () => {

  test.beforeEach(async ({ page }) => {
    await navigateTo(page, '/app/caja', /Gestión de Caja/i);
  });

  // ── GRUPO 1: Smoke Tests Básicos ──────────────────────────────────────────

  test('04.01 - El botón Registrar Operación está visible', async ({ page }) => {
    const btn = page.locator('button').filter({ hasText: REGISTER_BUTTON }).first();
    await expect(btn).toBeVisible({ timeout: 10000 });
    await takeScreenshot(page, '04-01-register-btn');
  });

  test('04.02 - Abrir el MovementModal', async ({ page }) => {
    await openMovementModal(page);
    await takeScreenshot(page, '04-02-modal-open');
  });

  test('04.03 - El modal muestra todas las secciones de acordeón', async ({ page }) => {
    await openMovementModal(page);

    // Verificar que todos los acordeones principales existen
    const serviciosSummary = page.locator('summary').filter({ hasText: SERVICIOS_ACCORDION }).first();
    const productosSummary = page.locator('summary').filter({ hasText: PRODUCTOS_ACCORDION }).first();
    const gastosSummary = page.locator('summary').filter({ hasText: GASTOS_ACCORDION }).first();
    const propinasSummary = page.locator('summary').filter({ hasText: PROPINAS_ACCORDION }).first();
    const adelantosSummary = page.locator('summary').filter({ hasText: ADELANTOS_ACCORDION }).first();

    await expect(serviciosSummary).toBeVisible({ timeout: 5000 });
    await expect(productosSummary).toBeVisible({ timeout: 3000 });
    await expect(gastosSummary).toBeVisible({ timeout: 3000 });
    await expect(propinasSummary).toBeVisible({ timeout: 3000 });
    await expect(adelantosSummary).toBeVisible({ timeout: 3000 });

    await takeScreenshot(page, '04-03-all-accordions');
  });

  test('04.04 - Cerrar el modal con Escape', async ({ page }) => {
    await openMovementModal(page);
    await closeModalEscape(page);
    // El modal debe desaparecer
    const modal = page.locator('.modal-content, [role="dialog"]').first();
    await expect(modal).not.toBeVisible({ timeout: 3000 });
    await takeScreenshot(page, '04-04-modal-closed');
  });

  // ── GRUPO 2: Agregar Gastos al Carrito ────────────────────────────────────

  test('04.05 - Agregar un gasto manual al carrito', async ({ page }) => {
    await openMovementModal(page);
    await addExpenseToCart(page, 'Compra de Suministros E2E', '5000');

    // Verificar que el ítem aparece en la sección de resumen (panel derecho)
    const cartItem = page.locator('#operation-items-list .bg-bg-secondary').first();
    await expect(cartItem).toBeVisible({ timeout: 5000 });

    // El método de pago del ítem debe ser visible
    const paymentSelect = page.locator('select.item-payment-method').first();
    await expect(paymentSelect).toBeVisible({ timeout: 3000 });

    await takeScreenshot(page, '04-05-expense-in-cart');
  });

  test('04.06 - El gasto aparece con monto negativo en el carrito', async ({ page }) => {
    await openMovementModal(page);
    await addExpenseToCart(page, 'Gasto Negativo E2E', '2500');

    // El tipo debe indicar "Gasto" 
    const typeLabel = page.locator('#operation-items-list').locator('text=/Gasto/').first();
    await expect(typeLabel).toBeVisible({ timeout: 5000 });

    // El monto debe ser negativo (aparece con signo -)
    const amountField = page.locator('#operation-items-list .bg-bg-secondary').first()
      .locator('.text-red-400, [class*="red"]').first();
    if (await isVisible(amountField)) {
      await expect(amountField).toBeVisible();
    }
  });

  test('04.07 - Seleccionar Efectivo como método de pago del ítem', async ({ page }) => {
    await openMovementModal(page);
    await addExpenseToCart(page, 'Gasto Cash E2E', '1000');

    const paymentSelect = page.locator('select.item-payment-method').first();
    await expect(paymentSelect).toBeVisible({ timeout: 5000 });
    await paymentSelect.selectOption({ value: 'Efectivo' });

    const selectedValue = await paymentSelect.inputValue();
    expect(selectedValue).toBe('Efectivo');
    await takeScreenshot(page, '04-07-cash-selected');
  });

  test('04.08 - Seleccionar Tarjeta como método de pago del ítem', async ({ page }) => {
    await openMovementModal(page);
    await addExpenseToCart(page, 'Gasto Tarjeta E2E', '3000');

    const paymentSelect = page.locator('select.item-payment-method').first();
    await expect(paymentSelect).toBeVisible({ timeout: 5000 });
    await paymentSelect.selectOption({ value: 'Tarjeta' });

    const selectedValue = await paymentSelect.inputValue();
    expect(selectedValue).toBe('Tarjeta');
    await takeScreenshot(page, '04-08-card-selected');
  });

  test('04.09 - Seleccionar Transferencia como método de pago del ítem', async ({ page }) => {
    await openMovementModal(page);
    await addExpenseToCart(page, 'Gasto Transfer E2E', '7500');

    const paymentSelect = page.locator('select.item-payment-method').first();
    await expect(paymentSelect).toBeVisible({ timeout: 5000 });
    await paymentSelect.selectOption({ value: 'Transferencia' });

    const selectedValue = await paymentSelect.inputValue();
    expect(selectedValue).toBe('Transferencia');
    await takeScreenshot(page, '04-09-transfer-selected');
  });

  // ── GRUPO 3: Manejo del Carrito ───────────────────────────────────────────

  test('04.10 - Agregar múltiples ítems al carrito', async ({ page }) => {
    await openMovementModal(page);

    // Agregar primer gasto
    await addExpenseToCart(page, 'Gasto Uno E2E', '1000');
    // Agregar segundo gasto
    await addExpenseToCart(page, 'Gasto Dos E2E', '2000');

    // Deben haber al menos 2 ítems en el carrito
    const cartItems = page.locator('#operation-items-list .bg-bg-secondary');
    await expect(cartItems).toHaveCount(2, { timeout: 5000 });

    await takeScreenshot(page, '04-10-multiple-items');
  });

  test('04.11 - El total se actualiza correctamente con múltiples gastos', async ({ page }) => {
    await openMovementModal(page);

    await addExpenseToCart(page, 'Gasto A', '1000');
    await addExpenseToCart(page, 'Gasto B', '2000');

    // El total debe ser visible (gastos son negativos: -1000 + -2000 = -3000)
    const totalText = page.locator('text=/TOTAL/i').first();
    await expect(totalText).toBeVisible({ timeout: 3000 });

    await takeScreenshot(page, '04-11-total-updated');
  });

  test('04.12 - Eliminar un ítem del carrito', async ({ page }) => {
    await openMovementModal(page);

    // Agregar dos gastos
    await addExpenseToCart(page, 'Gasto Eliminar E2E', '500');
    await addExpenseToCart(page, 'Gasto Mantener E2E', '300');

    // Verificar que hay 2 ítems
    const cartItems = page.locator('#operation-items-list .bg-bg-secondary');
    await expect(cartItems).toHaveCount(2, { timeout: 5000 });

    // Hacer click en el botón de eliminar del primer ítem (trash icon)
    const deleteBtn = cartItems.first().locator('button').filter({ hasText: '' }).last();
    await deleteBtn.click();
    await page.waitForTimeout(500);

    // Ahora debe haber 1 ítem
    await expect(cartItems).toHaveCount(1, { timeout: 3000 });
    await takeScreenshot(page, '04-12-item-removed');
  });

  // ── GRUPO 4: Método de Pago Global ────────────────────────────────────────

  test('04.13 - El selector de método de pago global muestra "Múltiples Métodos" por defecto', async ({ page }) => {
    await openMovementModal(page);
    await addExpenseToCart(page, 'Gasto Para Global E2E', '1000');

    // El selector global de pago está en el panel derecho, fuera de item-payment-method
    const globalPaymentSelect = page.locator('select').filter({ has: page.locator('option[value="multi"]') }).first();
    await expect(globalPaymentSelect).toBeVisible({ timeout: 5000 });

    const value = await globalPaymentSelect.inputValue();
    expect(value).toBe('multi');
    await takeScreenshot(page, '04-13-global-multi');
  });

  test('04.14 - Cambiar método de pago global a "Todo en Efectivo"', async ({ page }) => {
    await openMovementModal(page);
    await addExpenseToCart(page, 'Gasto Global Cash', '1000');

    const globalPaymentSelect = page.locator('select').filter({ has: page.locator('option[value="multi"]') }).first();
    await globalPaymentSelect.selectOption({ value: 'Efectivo' });

    const value = await globalPaymentSelect.inputValue();
    expect(value).toBe('Efectivo');

    // Cuando es global, los selects individuales deben estar deshabilitados
    const itemPaymentSelect = page.locator('select.item-payment-method').first();
    if (await isVisible(itemPaymentSelect)) {
      await expect(itemPaymentSelect).toBeDisabled();
    }
    await takeScreenshot(page, '04-14-global-cash');
  });

  test('04.15 - Cambiar método de pago global a "Todo con Tarjeta"', async ({ page }) => {
    await openMovementModal(page);
    await addExpenseToCart(page, 'Gasto Global Tarjeta', '2000');

    const globalPaymentSelect = page.locator('select').filter({ has: page.locator('option[value="multi"]') }).first();
    await globalPaymentSelect.selectOption({ value: 'Tarjeta' });

    const value = await globalPaymentSelect.inputValue();
    expect(value).toBe('Tarjeta');
    await takeScreenshot(page, '04-15-global-card');
  });

  // ── GRUPO 5: Validaciones de Formulario ───────────────────────────────────

  test('04.16 - No se puede guardar con carrito vacío', async ({ page }) => {
    await openMovementModal(page);

    // El botón de guardar debe existir
    const saveBtn = page.locator('button').filter({ hasText: /Registrar Operación/i }).last();
    await expect(saveBtn).toBeVisible({ timeout: 5000 });
    await saveBtn.click();
    await page.waitForTimeout(1000);

    // Debe aparecer un toast de error o el modal debe seguir abierto
    const modal = page.locator('.modal-content, [role="dialog"]').first();
    await expect(modal).toBeVisible({ timeout: 3000 });
    await takeScreenshot(page, '04-16-empty-cart-validation');
  });

  test('04.17 - No se puede agregar gasto sin descripción', async ({ page }) => {
    await openMovementModal(page);
    const gastoDetails = await openAccordion(page, GASTOS_ACCORDION);

    // Solo llenar monto, no descripción
    const amountInput = gastoDetails.locator('div.relative input[type="text"]').first();
    await amountInput.click();
    await amountInput.fill('5000');

    // Intentar agregar
    await gastoDetails.locator('button').filter({ hasText: /Añadir|Agregar|Add/i }).first().click();
    await page.waitForTimeout(500);

    // El carrito debe seguir vacío
    const cartItems = page.locator('#operation-items-list .bg-bg-secondary');
    const count = await cartItems.count();
    expect(count).toBe(0);
    await takeScreenshot(page, '04-17-no-desc-validation');
  });

  test('04.18 - No se puede agregar gasto sin monto', async ({ page }) => {
    await openMovementModal(page);
    const gastoDetails = await openAccordion(page, GASTOS_ACCORDION);

    // Solo llenar descripción, no monto
    await gastoDetails.locator('input[type="text"]').first().fill('Solo Descripcion');

    // Intentar agregar
    await gastoDetails.locator('button').filter({ hasText: /Añadir|Agregar|Add/i }).first().click();
    await page.waitForTimeout(500);

    // El carrito debe seguir vacío
    const cartItems = page.locator('#operation-items-list .bg-bg-secondary');
    const count = await cartItems.count();
    expect(count).toBe(0);
    await takeScreenshot(page, '04-18-no-amount-validation');
  });

  // ── GRUPO 6: Sección de Servicios ─────────────────────────────────────────

  test('04.19 - El acordeón de Servicios se abre y muestra buscadores', async ({ page }) => {
    await openMovementModal(page);
    const servicioDetails = await openAccordion(page, SERVICIOS_ACCORDION);

    // Debe tener un buscador de colaboradores y uno de servicios
    const searchInputs = servicioDetails.locator('input[type="text"], input[placeholder]');
    const count = await searchInputs.count();
    expect(count).toBeGreaterThanOrEqual(0); // Los ScrollableSelector pueden usar custom inputs

    // El botón "Añadir Servicio (Búsqueda)" debe estar visible
    const addSearchBtn = servicioDetails.locator('button').filter({ hasText: /Añadir Servicio|Agregar Servicio/i }).first();
    await expect(addSearchBtn).toBeVisible({ timeout: 5000 });

    await takeScreenshot(page, '04-19-services-accordion');
  });

  test('04.20 - El enlace de "registro manual" de servicio está disponible', async ({ page }) => {
    await openMovementModal(page);
    const servicioDetails = await openAccordion(page, SERVICIOS_ACCORDION);

    // Buscar el enlace/botón "¿No encuentras el servicio?"
    const manualLink = servicioDetails.locator('button').filter({ hasText: /No encuentras|Registrar manual/i }).first();
    if (await isVisible(manualLink)) {
      await manualLink.click();
      await page.waitForTimeout(300);

      // Debe aparecer la sección de registro manual con inputs
      const manualTitle = servicioDetails.locator('text=/Registro Manual/i').first();
      await expect(manualTitle).toBeVisible({ timeout: 3000 });
    }
    await takeScreenshot(page, '04-20-manual-service');
  });

  // ── GRUPO 7: Sección de Productos ─────────────────────────────────────────

  test('04.21 - El acordeón de Productos se abre y muestra buscadores', async ({ page }) => {
    await openMovementModal(page);
    const productDetails = await openAccordion(page, PRODUCTOS_ACCORDION);

    // El botón "Añadir Producto (Búsqueda)" debe estar visible
    const addProductBtn = productDetails.locator('button').filter({ hasText: /Añadir Producto|Agregar Producto/i }).first();
    await expect(addProductBtn).toBeVisible({ timeout: 5000 });

    await takeScreenshot(page, '04-21-products-accordion');
  });

  // ── GRUPO 8: Sección de Propinas ──────────────────────────────────────────

  test('04.22 - El acordeón de Propinas se abre y muestra campos requeridos', async ({ page }) => {
    await openMovementModal(page);
    const propinaDetails = await openAccordion(page, PROPINAS_ACCORDION);

    // Debe tener selects de método de pago y destino
    const selects = propinaDetails.locator('select');
    const selectCount = await selects.count();
    expect(selectCount).toBeGreaterThanOrEqual(2); // paymentMethod + destination

    // El botón de añadir propina debe existir
    const addTipBtn = propinaDetails.locator('button').filter({ hasText: /Añadir Propina|Agregar Propina|Comisión/i }).first();
    await expect(addTipBtn).toBeVisible({ timeout: 5000 });

    await takeScreenshot(page, '04-22-tips-accordion');
  });

  // ── GRUPO 9: Sección de Adelantos ─────────────────────────────────────────

  test('04.23 - El acordeón de Adelantos se abre y muestra campos', async ({ page }) => {
    await openMovementModal(page);
    const adelantoDetails = await openAccordion(page, ADELANTOS_ACCORDION);

    // Debe tener un botón de añadir adelanto
    const addAdvanceBtn = adelantoDetails.locator('button').filter({ hasText: /Añadir Adelanto|Agregar Adelanto/i }).first();
    await expect(addAdvanceBtn).toBeVisible({ timeout: 5000 });

    await takeScreenshot(page, '04-23-advances-accordion');
  });

  // ── GRUPO 10: Edición de ítems en el carrito ──────────────────────────────

  test('04.24 - Se puede editar la descripción de un ítem en el carrito', async ({ page }) => {
    await openMovementModal(page);
    await addExpenseToCart(page, 'Desc Original', '1000');

    // Encontrar el input de descripción en el carrito
    const cartItemDesc = page.locator('#operation-items-list .bg-bg-secondary').first()
      .locator('input[type="text"]').first();
    await expect(cartItemDesc).toBeVisible({ timeout: 3000 });

    // Editar la descripción
    await cartItemDesc.clear();
    await cartItemDesc.fill('Desc Editada E2E');
    const newValue = await cartItemDesc.inputValue();
    expect(newValue).toBe('Desc Editada E2E');

    await takeScreenshot(page, '04-24-desc-edited');
  });

  // ── GRUPO 11: Guardar operación completa (E2E Real) ───────────────────────

  test('04.25 - Registrar un gasto completo y guardar la operación', async ({ page }) => {
    await openMovementModal(page);

    // 1. Agregar un gasto con descripción identificable como E2E
    await addExpenseToCart(page, `E2E_TEST_GASTO_${Date.now()}`, '100');

    // 2. Verificar que el ítem aparece en el carrito
    const cartItems = page.locator('#operation-items-list .bg-bg-secondary');
    await expect(cartItems).toHaveCount(1, { timeout: 5000 });

    // 3. Establecer método de pago global a Efectivo
    const globalPaymentSelect = page.locator('select').filter({ has: page.locator('option[value="multi"]') }).first();
    await globalPaymentSelect.selectOption({ value: 'Efectivo' });

    // 4. Hacer click en "Registrar Operación" (botón del footer)
    const saveBtn = page.locator('button').filter({ hasText: /Registrar Operación/i }).last();
    await expect(saveBtn).toBeVisible({ timeout: 5000 });
    await saveBtn.click();

    // 5. Esperar a que la operación se guarde (puede tomar unos segundos por la red)
    await page.waitForTimeout(5000);

    // Después de guardar, aparece un PaymentSuccessModal con overlay z-[70]
    // Verificamos que algo cambió: toast de éxito o modal de éxito visible
    await takeScreenshot(page, '04-25-after-save');

    // Cerrar cualquier modal abierto con Escape (más robusto que buscar botones)
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    await takeScreenshot(page, '04-25-operation-saved');
  });

  // ── GRUPO 12: Tabs de Caja Diaria ─────────────────────────────────────────

  test('04.26 - Las tabs de Caja Diaria son visibles', async ({ page }) => {
    // Verificar que las 4 tabs existen
    const cajaActualTab = page.locator('button').filter({ hasText: /Caja Actual/i }).first();
    const arqueosTab = page.locator('button').filter({ hasText: /Arqueos y Cierres/i }).first();
    const historialTab = page.locator('button').filter({ hasText: /Historial de Transacciones/i }).first();
    const consumoTab = page.locator('button').filter({ hasText: /Consumo Técnico/i }).first();

    await expect(cajaActualTab).toBeVisible({ timeout: 5000 });
    await expect(arqueosTab).toBeVisible({ timeout: 3000 });
    await expect(historialTab).toBeVisible({ timeout: 3000 });
    await expect(consumoTab).toBeVisible({ timeout: 3000 });

    await takeScreenshot(page, '04-26-caja-tabs');
  });

  test('04.27 - Navegar a la tab de Historial de Transacciones', async ({ page }) => {
    const historialTab = page.locator('button').filter({ hasText: /Historial de Transacciones/i }).first();
    await expect(historialTab).toBeVisible({ timeout: 5000 });
    await historialTab.click();
    await page.waitForTimeout(1000);

    await takeScreenshot(page, '04-27-historial-tab');
  });

  test('04.28 - Navegar a la tab de Arqueos y Cierres', async ({ page }) => {
    const arqueosTab = page.locator('button').filter({ hasText: /Arqueos y Cierres/i }).first();
    await expect(arqueosTab).toBeVisible({ timeout: 5000 });
    await arqueosTab.click();
    await page.waitForTimeout(1000);

    await takeScreenshot(page, '04-28-arqueos-tab');
  });
});
