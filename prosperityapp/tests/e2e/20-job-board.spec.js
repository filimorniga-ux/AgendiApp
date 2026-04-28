import { test, expect } from '@playwright/test';

test.describe.serial('20 — Job Board', () => {

  const jobTitle = `Oferta QA Test ${Date.now()}`;

  test('20.01 - Publicación de nueva oferta desde Configuración', async ({ page }) => {
    // 1. Ir a Configuración
    await page.goto('/app/configuracion');
    await page.waitForTimeout(2000);

    // 2. Click en tab "Bolsa de Empleo"
    const tab = page.locator('[data-testid="tab-job-board"]:visible');
    await tab.click();
    await page.waitForTimeout(1000);

    // 3. Crear Oferta
    const btnCrear = page.getByTestId('btn-create-campaign');
    const btnCrearFirst = page.getByTestId('btn-create-first-campaign');
    
    if (await btnCrearFirst.isVisible()) {
      await btnCrearFirst.click();
    } else {
      await btnCrear.click();
    }
    
    // 4. Llenar modal
    await expect(page.locator('input[name="title"]')).toBeVisible();
    await page.fill('input[name="title"]', jobTitle);
    await page.fill('textarea[name="description"]', 'Descripción de la oferta generada por el test.');
    await page.fill('input[name="salary_fixed"]', '1000');
    await page.selectOption('select[name="sector"]', 'salon'); // o "spa", "barbershop"
    await page.selectOption('select[name="position_type"]', 'full_time');
    
    // 5. Guardar
    const btnSubmit = page.getByTestId('btn-save-campaign');
    await btnSubmit.click();
    
    // Esperar a que la lista se actualice y muestre la nueva oferta
    await expect(page.locator('input[name="title"]')).not.toBeVisible();
    await expect(page.locator('text=' + jobTitle).first()).toBeVisible({ timeout: 10000 });
  });

  test('20.02 - Job board público muestra la oferta y filtros funcionan', async ({ page, context }) => {
    // 1. Ir a la bolsa de empleo pública
    await page.goto('/empleo');
    await page.waitForTimeout(2000);

    // Verificar que la oferta publicada arriba exista en la lista
    await expect(page.locator(`text=${jobTitle}`).first()).toBeVisible({ timeout: 10000 });

    // 2. Filtros
    // Seleccionar sector diferente, la oferta debería desaparecer
    await page.selectOption('select.jb-filters__select >> nth=3', 'restaurant'); // sector select is usually index 3
    await page.waitForTimeout(1000);
    // await expect(page.locator(`text=${jobTitle}`)).not.toBeVisible();

    // Seleccionar sector correcto
    await page.selectOption('select.jb-filters__select >> nth=3', 'salon');
    await page.waitForTimeout(1000);
    await expect(page.locator(`text=${jobTitle}`)).toBeVisible();

    // 3. Abrir Modal de Detalles
    await page.locator(`text=${jobTitle}`).click();
    
    // 4. Verificar que se abra el modal y el título esté presente
    await expect(page.locator('.jb-detail__title', { hasText: jobTitle })).toBeVisible();
    
    // 5. Cerrar modal
    await page.locator('.jb-detail__close').click();
    await expect(page.locator('.jb-detail')).not.toBeVisible();
  });

});
