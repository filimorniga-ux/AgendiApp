import { test, expect } from '@playwright/test';

test.describe('Registro Completo de Operación (Venta/Servicio)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app/caja');
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).toBeVisible();
  });

  // Tarea: Registrar Venta/Gasto para comprobar autenticación y funcionalidad E2E
  test('Debe poder registrar un Gasto en la caja (Validación RLS)', async ({ page }) => {
    // 1. Abrir Modal de Nueva Operación
    const registerBtn = page.locator('button').filter({ hasText: /Registrar|Nueva|Register|New/i }).first();
    await expect(registerBtn).toBeVisible({ timeout: 15000 });
    await registerBtn.click();
    await page.waitForTimeout(1000); // Esperar animación del modal
    
    // 2. Cambiar a pestaña de Gasto (Accordion)
    // El componente MovementModal usa `<summary>` con un emoji 💸 para los Gastos
    const expenseTab = page.locator('summary').filter({ hasText: /💸|Gastos|Gasto|Expense/i }).first();
    await expect(expenseTab).toBeVisible({ timeout: 5000 });
    await expenseTab.click();
    await page.waitForTimeout(500);
    
    // 3. Rellenar detalles del Gasto
    // Buscamos los inputs que están dentro del mismo `<details>` del tab de Gasto
    const expenseContainer = page.locator('details').filter({ has: page.locator('summary', { hasText: /💸|Gastos|Gasto|Expense/i }) });
    const inputs = expenseContainer.locator('input');
    const count = await inputs.count();
    
    if (count >= 2) {
      await inputs.nth(0).fill('Gasto de prueba E2E (RLS)');
      await inputs.nth(1).fill('5000');
      
      // 4. Hacer clic en "Agregar" (botón de añadir gasto)
      const addBtns = expenseContainer.locator('button');
      if (await addBtns.count() > 0) {
        await addBtns.first().click();
        await page.waitForTimeout(500);
      }
      
      // 5. Seleccionar Efectivo como método de pago (si no está por defecto y existe en general)
      const cashOption = page.locator('button, label, div').filter({ hasText: /^Efectivo|Cash$/i }).first();
      if (await cashOption.isVisible()) {
         await cashOption.click();
         await page.waitForTimeout(300);
      }
      
      // 6. Finalmente, Guardar la Operación
      // El botón de guardar está al final del modal
      const saveBtn = page.locator('button').filter({ hasText: /Guardar|Confirmar|Save|Confirm/i }).first();
      await expect(saveBtn).toBeVisible();
      await saveBtn.click();
      await page.waitForTimeout(3000); // Esperar inserción en base de datos
      
      // 7. Verificar que se cerró el modal o que aparece el gasto en la UI principal
      const modalVisible = await page.locator('text=/Guardar|Confirmar|Save|Confirm/i').isVisible();
      expect(modalVisible).toBe(false); // Modal debe haberse cerrado si todo fue bien
    } else {
      throw new Error(`No se encontraron los inputs de gasto, encontrados: ${count}`);
    }
  });
});
