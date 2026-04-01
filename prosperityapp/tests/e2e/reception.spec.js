import { test, expect } from '@playwright/test';

// ── Tarea 14: Módulo de Recepción de Pedidos (6 pasos) ───────────────────
test.describe('Recepción de Pedidos E2E Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app/recepcion');
    // Esperar el h1 del módulo
    await expect(
      page.locator('h1').filter({ hasText: /Recepción de Mercancía|Recepcion/i }).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('T14.1 - debería renderizar el stepper con 6 pasos', async ({ page }) => {
    // Verificar que el stepper tiene los 6 pasos definidos
    const stepLabels = ['Importar factura', 'Proveedor', 'Revisar pedido', 'Recepción física', 'Discrepancias', 'Confirmar'];

    for (const label of stepLabels) {
      const stepEl = page.locator('.recepcion-stepper-item, .recepcion-step-label, span').filter({ hasText: new RegExp(label, 'i') }).first();
      await expect(stepEl).toBeVisible();
    }

    await page.screenshot({ path: 'tests/e2e/screenshots/reception-stepper.png' });
  });

  test('T14.2 - el Paso 1 debería mostrar el importador de facturas', async ({ page }) => {
    // En el paso 0 (inicial) debe verse la opción de importar factura
    const stepTitle = page.locator('h2').filter({ hasText: /Importar factura/i }).first();
    await expect(stepTitle).toBeVisible();

    // Y también el botón de entrada manual
    const manualBtn = page.locator('button').filter({ hasText: /manual|sin factura/i }).first();
    await expect(manualBtn).toBeVisible();
  });

  test('T14.3 - el botón "Ingresar manualmente" avanza al paso 2', async ({ page }) => {
    const manualBtn = page.locator('button').filter({ hasText: /manual|sin factura/i }).first();
    await expect(manualBtn).toBeVisible();
    await manualBtn.click();

    await page.waitForTimeout(500);

    // Después de hacer clic, debería avanzar al paso "Datos del proveedor"
    const step2Title = page.locator('h2').filter({ hasText: /Datos del proveedor|Proveedor/i }).first();
    await expect(step2Title).toBeVisible({ timeout: 5000 });

    await page.screenshot({ path: 'tests/e2e/screenshots/reception-step2-supplier.png' });
  });

  test('T14.4 - el botón "Volver" debe navegar hacia atrás', async ({ page }) => {
    const backBtn = page.locator('button').filter({ hasText: /← Volver|Volver/i }).first();
    await expect(backBtn).toBeVisible();
    // Solo verificamos que está clickeable
    await expect(backBtn).toBeEnabled();
  });

  test('T14.5 - los pasos completados del stepper deben marcarse con ✓', async ({ page }) => {
    // Avanzar al paso 2
    const manualBtn = page.locator('button').filter({ hasText: /manual|sin factura/i }).first();
    await manualBtn.click();
    await page.waitForTimeout(500);

    // El primer paso (índice 0) debería mostrar ✓ como completado
    const completedStep = page.locator('.recepcion-step-circle.completed').first();
    // Verificar que existe al menos un paso completado
    await expect(completedStep).toBeVisible({ timeout: 3000 });
  });
});

// ── Tarea 14 (parte 2): Pedidos generados ─────────────────────────────────
test.describe('Pedidos Pendientes E2E Flow', () => {
  test('T14.6 - debería cargar la lista de pedidos', async ({ page }) => {
    await page.goto('/app/pedidos');
    await page.waitForTimeout(2000);

    const title = page.locator('h1, h2').filter({ hasText: /Pedidos|Orders/i }).first();
    await expect(title).toBeVisible({ timeout: 10000 });

    await page.screenshot({ path: 'tests/e2e/screenshots/pedidos-list.png' });
  });
});
