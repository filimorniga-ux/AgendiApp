import { test, expect } from '@playwright/test';

// ── Constants ────────────────────────────────────────────────────────────────
const CIERRES_URL = '/app/cierres';
const MODAL_CONTENT = '.modal-content';
const MAX_ATTEMPTS = 3;

// Categories rendered in the page (Spanish locale)
const CATEGORY_TITLES = [
  'Efectivo Destapado', 'Efectivo Semanal', 'Transferencias',
  'Tarjetas', 'Vales/Adelantos', 'Salidas Mensuales',
  'Ahorro Ventas', 'Ahorro Impuestos', 'Ahorro Productos'
];

// ── Resilient page loader with retry ────────────────────────────────────────
async function waitForCierresPage(page) {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      await page.goto(CIERRES_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
      // Wait for the page title
      await expect(
        page.locator('h2').filter({ hasText: /Cierres Mensuales/i }).first()
      ).toBeVisible({ timeout: 15000 });
      // Wait for the month input to confirm UI hydration
      await expect(
        page.locator('input[type="month"]').first()
      ).toBeVisible({ timeout: 10000 });
      return; // Success
    } catch {
      if (attempt < MAX_ATTEMPTS) {
        await page.waitForTimeout(2000);
        continue;
      }
      throw new Error('No se pudo cargar la página de Cierres Mensuales (título no visible)');
    }
  }
}

// ── Helper: open the MonthlyRecordModal ─────────────────────────────────────
async function openRecordModal(page) {
  const addBtn = page.locator('button').filter({ hasText: /Ingresar Registro/i }).first();
  await expect(addBtn).toBeVisible({ timeout: 5000 });
  await addBtn.click();
  await expect(page.locator(MODAL_CONTENT).first()).toBeVisible({ timeout: 5000 });
}

// ── 06: Cierres Mensuales — Deep E2E Tests ──────────────────────────────────
test.describe('06 — Cierres Mensuales', () => {

  // Retries para manejar fallas intermitentes de red Supabase
  test.describe.configure({ retries: 2 });
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    await waitForCierresPage(page);
  });

  // ── GRUPO 1: Layout y controles principales ────────────────────────────────

  test('06.01 - Renderiza el título principal y subtítulo', async ({ page }) => {
    await expect(page.locator('h2').filter({ hasText: /Cierres Mensuales/i }).first()).toBeVisible();
    await expect(page.locator('text=/Gestión contable/i').first()).toBeVisible({ timeout: 3000 });
  });

  test('06.02 - Selector de mes (input month) visible y funcional', async ({ page }) => {
    const monthInput = page.locator('input[type="month"]').first();
    await expect(monthInput).toBeVisible();
    // Verify current month is selected
    const currentMonth = new Date().toISOString().substring(0, 7);
    await expect(monthInput).toHaveValue(currentMonth);
  });

  test('06.03 - Botón Ingresar Registro visible', async ({ page }) => {
    const addBtn = page.locator('button').filter({ hasText: /Ingresar Registro/i }).first();
    await expect(addBtn).toBeVisible();
    await expect(addBtn).toBeEnabled();
  });

  test('06.04 - Botón Imprimir presente', async ({ page }) => {
    const printBtn = page.locator('button[title*="Imprimir"]').first();
    await expect(printBtn).toBeVisible({ timeout: 3000 });
    await expect(printBtn).toBeEnabled();
  });

  test('06.05 - Botón Exportar Excel presente', async ({ page }) => {
    const exportBtn = page.locator('button[title*="Exportar"]').first();
    await expect(exportBtn).toBeVisible({ timeout: 3000 });
    await expect(exportBtn).toBeEnabled();
  });

  // ── GRUPO 2: Navegación de meses ──────────────────────────────────────────

  test('06.06 - Cambiar a un mes anterior actualiza el selector', async ({ page }) => {
    const monthInput = page.locator('input[type="month"]').first();
    await monthInput.fill('2026-03');
    await page.waitForTimeout(500);
    await expect(monthInput).toHaveValue('2026-03');
  });

  test('06.07 - Navegar entre múltiples meses funciona', async ({ page }) => {
    const monthInput = page.locator('input[type="month"]').first();
    await monthInput.fill('2026-01');
    await page.waitForTimeout(500);
    await expect(monthInput).toHaveValue('2026-01');
    await monthInput.fill('2025-12');
    await page.waitForTimeout(500);
    await expect(monthInput).toHaveValue('2025-12');
  });

  // ── GRUPO 3: Columnas de categorías ───────────────────────────────────────

  test('06.08 - Las columnas de categorías están visibles', async ({ page }) => {
    // Check at least a few key category columns are rendered (9 total)
    const columns = page.locator('h3').filter({ hasText: /Efectivo|Transferencias|Tarjetas|Ahorro|Salidas|Vales/i });
    await expect(columns).toHaveCount(9, { timeout: 15000 });
  });

  test('06.09 - Cada columna muestra un total', async ({ page }) => {
    const totals = page.locator('text=/Total:/i');
    // There are 9 category columns, each with a Total
    await expect(totals).toHaveCount(9, { timeout: 15000 });
  });

  // ── GRUPO 4: Modal — Abrir, campos, cerrar ───────────────────────────────

  test('06.10 - Abrir modal de Nuevo Registro', async ({ page }) => {
    await openRecordModal(page);
    const modalTitle = page.locator(`${MODAL_CONTENT} h3`).filter({ hasText: /Nuevo Registro/i }).first();
    await expect(modalTitle).toBeVisible({ timeout: 3000 });
  });

  test('06.11 - Modal tiene campo de Fecha', async ({ page }) => {
    await openRecordModal(page);
    const dateInput = page.locator(`${MODAL_CONTENT} input[name="date"]`);
    await expect(dateInput).toBeVisible({ timeout: 3000 });
  });

  test('06.12 - Modal tiene campo de Descripción', async ({ page }) => {
    await openRecordModal(page);
    const descInput = page.locator(`${MODAL_CONTENT} input[name="description"]`);
    await expect(descInput).toBeVisible({ timeout: 3000 });
  });

  test('06.13 - Modal tiene selector de Categoría con opciones', async ({ page }) => {
    await openRecordModal(page);
    const categorySelect = page.locator(`${MODAL_CONTENT} select[name="category"]`);
    await expect(categorySelect).toBeVisible({ timeout: 3000 });
    // Verify it has multiple options (9 categories)
    const options = categorySelect.locator('option');
    const optCount = await options.count();
    expect(optCount).toBeGreaterThanOrEqual(5);
  });

  test('06.14 - Modal tiene campo de Monto', async ({ page }) => {
    await openRecordModal(page);
    const amountInput = page.locator(`${MODAL_CONTENT} input[name="amount"]`);
    await expect(amountInput).toBeVisible({ timeout: 3000 });
    await expect(amountInput).toHaveAttribute('type', 'number');
  });

  test('06.15 - Modal tiene botón Guardar Registro', async ({ page }) => {
    await openRecordModal(page);
    const saveBtn = page.locator(`${MODAL_CONTENT} button`).filter({ hasText: /Guardar Registro/i }).first();
    await expect(saveBtn).toBeVisible({ timeout: 3000 });
  });

  test('06.16 - Cerrar modal con botón ×', async ({ page }) => {
    await openRecordModal(page);
    const closeBtn = page.locator(`${MODAL_CONTENT} button`).filter({ hasText: '×' }).first();
    await closeBtn.click();
    await page.waitForTimeout(500);
    await expect(page.locator(MODAL_CONTENT).first()).not.toBeVisible({ timeout: 3000 });
  });

  test('06.17 - Cerrar modal con botón Cancelar', async ({ page }) => {
    await openRecordModal(page);
    const cancelBtn = page.locator(`${MODAL_CONTENT} button`).filter({ hasText: /Cancelar/i }).first();
    await cancelBtn.click();
    await page.waitForTimeout(500);
    await expect(page.locator(MODAL_CONTENT).first()).not.toBeVisible({ timeout: 3000 });
  });

  // ── GRUPO 5: Llenar formulario ────────────────────────────────────────────

  test('06.18 - Llenar todos los campos del formulario', async ({ page }) => {
    await openRecordModal(page);
    // Fill date
    await page.locator(`${MODAL_CONTENT} input[name="date"]`).fill('2026-04-20');
    // Fill description
    await page.locator(`${MODAL_CONTENT} input[name="description"]`).fill('Test pago proveedor E2E');
    // Select category
    await page.locator(`${MODAL_CONTENT} select[name="category"]`).selectOption('monthlyOutgoings');
    // Fill amount
    await page.locator(`${MODAL_CONTENT} input[name="amount"]`).fill('150000');
    // Verify values
    await expect(page.locator(`${MODAL_CONTENT} input[name="date"]`)).toHaveValue('2026-04-20');
    await expect(page.locator(`${MODAL_CONTENT} input[name="description"]`)).toHaveValue('Test pago proveedor E2E');
    await expect(page.locator(`${MODAL_CONTENT} select[name="category"]`)).toHaveValue('monthlyOutgoings');
    await expect(page.locator(`${MODAL_CONTENT} input[name="amount"]`)).toHaveValue('150000');
  });

  test('06.19 - Crear registro y verificar que se guarda', async ({ page }) => {
    await openRecordModal(page);
    const uniqueDesc = `E2E_Test_${Date.now()}`;
    await page.locator(`${MODAL_CONTENT} input[name="date"]`).fill('2026-04-20');
    await page.locator(`${MODAL_CONTENT} input[name="description"]`).fill(uniqueDesc);
    await page.locator(`${MODAL_CONTENT} select[name="category"]`).selectOption('cashUnsealed');
    await page.locator(`${MODAL_CONTENT} input[name="amount"]`).fill('25000');
    // Click save
    const saveBtn = page.locator(`${MODAL_CONTENT} button`).filter({ hasText: /Guardar Registro/i }).first();
    await saveBtn.click();
    // Modal should close on success
    await expect(page.locator(MODAL_CONTENT).first()).not.toBeVisible({ timeout: 10000 });
    // The new record description should appear somewhere in the page
    await page.waitForTimeout(1500);
    const recordText = page.locator(`text=${uniqueDesc}`).first();
    await expect(recordText).toBeVisible({ timeout: 10000 });
  });

  // ── GRUPO 6: Panel de Resumen Financiero ──────────────────────────────────

  test('06.20 - Panel TOTAL A REPARTIR visible', async ({ page }) => {
    const totalPanel = page.locator('text=/TOTAL A REPARTIR/i').first();
    await expect(totalPanel).toBeVisible({ timeout: 15000 });
  });

  test('06.21 - Panel muestra Total Ingresos', async ({ page }) => {
    const incomeLabel = page.locator('text=/Total Ingresos/i').first();
    await expect(incomeLabel).toBeVisible({ timeout: 15000 });
  });

  test('06.22 - Panel muestra Total Salidas', async ({ page }) => {
    const outgoingsLabel = page.locator('text=/Total Salidas/i').first();
    await expect(outgoingsLabel).toBeVisible({ timeout: 15000 });
  });

  test('06.23 - Panel muestra Total Ahorros', async ({ page }) => {
    const savingsLabel = page.locator('text=/Total Ahorros/i').first();
    await expect(savingsLabel).toBeVisible({ timeout: 15000 });
  });

  // ── GRUPO 7: Distribución de Socios ───────────────────────────────────────

  test('06.24 - Tabla de Distribución de Socios visible', async ({ page }) => {
    const partnerSection = page.locator('text=/Distribución de Socios/i').first();
    await expect(partnerSection).toBeVisible({ timeout: 15000 });
  });

  test('06.25 - Tabla de socios tiene encabezados correctos', async ({ page }) => {
    const table = page.locator('table').last();
    // Check headers: Socio, Porcentaje, Monto Calculado
    await expect(table.locator('th').filter({ hasText: /Socio/i }).first()).toBeVisible({ timeout: 15000 });
    await expect(table.locator('th').filter({ hasText: /Porcentaje/i }).first()).toBeVisible({ timeout: 3000 });
    await expect(table.locator('th').filter({ hasText: /Monto/i }).first()).toBeVisible({ timeout: 3000 });
  });
});
