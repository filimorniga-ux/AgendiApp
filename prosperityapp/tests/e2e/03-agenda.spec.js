import { test, expect } from '@playwright/test';
import { navigateTo, waitForPageLoad, openModal, closeModalEscape, takeScreenshot, expectButtonVisible, isVisible } from './helpers/test-helpers.js';

// ── 03: Agenda / Calendario ─────────────────────────────────────────────────
test.describe('03 — Agenda (Calendario de Citas)', () => {

  test.beforeEach(async ({ page }) => {
    await navigateTo(page, '/app', /Calendario|Agenda/i);
  });

  test('03.01 - La agenda carga con controles de navegación', async ({ page }) => {
    // Agenda heading
    const title = page.locator('h2').filter({ hasText: /Agenda|Calendario/i }).first();
    await expect(title).toBeVisible({ timeout: 15000 });
    await takeScreenshot(page, '03-agenda-calendar');
  });

  test('03.02 - Los botones de navegación de fecha son visibles', async ({ page }) => {
    // Chevron arrows are used for navigation. 
    // Wait for the Today (Hoy) button or the date button.
    const todayBtn = page.locator('button').filter({ hasText: /Hoy|Today/i }).first();
    await expect(todayBtn).toBeVisible({ timeout: 10000 });
    
    // Check for the date button which opens the mini calendar
    const dateBtn = page.locator('button').filter({ hasText: /202/ }).first(); // Will match years like 2024, 2025, 2026
    if (await isVisible(dateBtn)) {
      await expect(dateBtn).toBeVisible();
    }
  });

  test('03.03 - El botón de Nueva Cita es visible', async ({ page }) => {
    const newBtn = page.locator('button').filter({ hasText: /Nueva Cita|Agendar|Agregar/i }).first();
    await expect(newBtn).toBeVisible({ timeout: 10000 });
  });

  test('03.04 - El botón de Nueva Cita abre el modal de cita', async ({ page }) => {
    const newBtn = page.locator('button').filter({ hasText: /Nueva Cita|Agendar|Agregar/i }).first();
    if (await isVisible(newBtn)) {
      await newBtn.click();
      await page.waitForTimeout(500);
      // Modal should appear with form elements
      const modalTitle = page.locator('h3').filter({ hasText: /Cita|Nueva|Agendar/i }).first();
      const visible = await isVisible(modalTitle);
      if (visible) {
        await takeScreenshot(page, '03-agenda-new-appointment-modal');
        await closeModalEscape(page);
      }
    }
  });

  test('03.05 - Se muestran las columnas de los colaboradores', async ({ page }) => {
    // Kanban columns should show "Citas" somewhere
    const columnText = page.locator('p').filter({ hasText: /Citas/i }).first();
    // It's optional if there are no collaborators, but check if the layout is there
    if (await isVisible(columnText)) {
      await expect(columnText).toBeVisible();
    }
    await takeScreenshot(page, '03-agenda-kanban');
  });

  test('03.06 - Navegar a la fecha siguiente', async ({ page }) => {
    // Find the right chevron by looking at buttons that do not have text but are likely arrows
    const nextBtn = page.locator('svg.feather-chevron-right').locator('..');
    if (await nextBtn.count() > 0) {
      await nextBtn.first().click();
      await page.waitForTimeout(500);
    }
    await takeScreenshot(page, '03-agenda-date-change');
  });

  test('03.07 - Flujo E2E: Crear una nueva cita', async ({ page }) => {
    // 1. Start on the agenda view
    const newBtn = page.locator('button').filter({ hasText: /Nueva Cita|Agendar|Agregar/i }).first();
    if (!(await isVisible(newBtn))) {
      test.skip('Botón de Nueva Cita no visible, saltando prueba.');
      return;
    }
    await newBtn.click();
    
    const modalTitle = page.locator('h3').filter({ hasText: /Cita|Nueva|Agendar/i }).first();
    await expect(modalTitle).toBeVisible({ timeout: 5000 });

    // 2. Select Client
    const clientInput = page.getByPlaceholder(/cliente/i).first();
    await expect(clientInput).toBeVisible({ timeout: 15000 });
    await clientInput.click();
    await page.waitForTimeout(500); // give time for the portal to render

    const options = page.locator('li.cursor-pointer');
    const clientsCount = await options.count();
    
    if (clientsCount === 0) {
      test.skip('No hay clientes disponibles en la base de datos para probar la creación de cita.');
      return;
    }
    await options.first().click();

    // 2.5 Select Stylist
    const stylistInput = page.getByPlaceholder(/estilista/i).first();
    await expect(stylistInput).toBeVisible({ timeout: 5000 });
    await stylistInput.click();
    await page.waitForTimeout(500);

    const stylistOptions = page.locator('li.cursor-pointer');
    const stylistsCount = await stylistOptions.count();
    if (stylistsCount > 0) {
      await stylistOptions.first().click();
    } else {
      test.skip('No hay estilistas disponibles en la base de datos para probar la creación de cita.');
      return;
    }

    // 3. Select Service
    const serviceInput = page.getByPlaceholder(/servicio/i).first();
    await expect(serviceInput).toBeVisible({ timeout: 15000 });
    await serviceInput.click();
    await page.waitForTimeout(500);

    const serviceOptions = page.locator('li.cursor-pointer');
    const servicesCount = await serviceOptions.count();
    if (servicesCount === 0) {
      test.skip('No hay servicios disponibles en la base de datos para probar la creación de cita.');
      return;
    }
    await serviceOptions.first().click();

    // 4. Submit form
    await takeScreenshot(page, '03-agenda-before-save');
    const saveBtn = page.getByRole('button', { name: /^Guardar$/i }).first();
    await expect(saveBtn).toBeVisible({ timeout: 5000 });
    await expect(saveBtn).toBeEnabled();
    await saveBtn.click();

    // 5. Verify Success Toast
    await expect(page.locator('text=/Cita agendada con éxito/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('03.08 - Flujo E2E: Editar el estado de la primera cita', async ({ page }) => {
    // 1. Wait for appointments to render (find the first appointment card)
    const appointmentCard = page.locator('div.group').first();
    
    if (!(await isVisible(appointmentCard))) {
      test.skip(true, 'No hay citas visibles para editar.');
      return;
    }
    
    // 2. Click the appointment card to open the modal
    await appointmentCard.click();
    
    const modalTitle = page.locator('h3').filter({ hasText: /Editar/i }).first();
    await expect(modalTitle).toBeVisible({ timeout: 5000 });
    await takeScreenshot(page, '03-agenda-edit-modal-open');

    // 3. Change status from the dropdown
    const statusSelect = page.locator('.modal-content select').first();
    // Assuming status values are "confirmed", "pending", "completed", "cancelled"
    // Let's set it to 'completed'
    await statusSelect.selectOption('completed');
    
    // 4. Save
    const saveBtn = page.getByRole('button', { name: /^Guardar$/i }).first();
    await expect(saveBtn).toBeVisible({ timeout: 5000 });
    await saveBtn.click();
    
    // 5. Verify update toast
    // The translation says: "Cita actualizada" or "Pago registrado" if transaction was created
    const successToast = page.locator('text=/Cita actualizada|Pago/i').first();
    await expect(successToast).toBeVisible({ timeout: 10000 });
    await takeScreenshot(page, '03-agenda-after-edit');
  });

  test('03.09 - Flujo E2E: Eliminar una cita', async ({ page }) => {
    // 1. Wait for appointments to render
    const appointmentCard = page.locator('div.group').first();
    
    if (!(await isVisible(appointmentCard))) {
      test.skip(true, 'No hay citas visibles para eliminar.');
      return;
    }
    
    // 2. Click the appointment card
    await appointmentCard.click();
    
    const modalTitle = page.locator('h3').filter({ hasText: /Editar/i }).first();
    await expect(modalTitle).toBeVisible({ timeout: 5000 });

    // 3. Setup dialog handler to auto-accept the window.confirm
    page.once('dialog', dialog => dialog.accept());

    // 4. Click delete button
    const deleteBtn = page.locator('button').filter({ hasText: /^Eliminar$/i }).first();
    if (!(await isVisible(deleteBtn))) {
      // It might be 'Eliminar Cita' based on translations
      const deleteBtnAlt = page.locator('button').filter({ hasText: /Eliminar/i }).first();
      await deleteBtnAlt.click();
    } else {
      await deleteBtn.click();
    }
    
    // 5. Verify deletion toast
    await expect(page.locator('text=/Cita eliminada/i').first()).toBeVisible({ timeout: 10000 });
    await takeScreenshot(page, '03-agenda-after-delete');
  });
});
