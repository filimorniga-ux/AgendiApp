import { test, expect } from '@playwright/test';
import { navigateTo, waitForPageLoad, openModal, closeModalEscape, takeScreenshot, isVisible } from './helpers/test-helpers.js';

// ── 10: CRM - Clientes ──────────────────────────────────────────────────────
test.describe('10 — CRM Clientes', () => {

  test.beforeEach(async ({ page }) => {
    const MAX_ATTEMPTS = 3;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      await page.goto('/app/clientes', { waitUntil: 'domcontentloaded' });
      try {
        await expect(page.locator('#client-cards-container')).toBeVisible({ timeout: 15000 });
        break; // Éxito
      } catch (error) {
        if (attempt < MAX_ATTEMPTS) {
          await page.waitForTimeout(2000);
          continue;
        }
        throw error;
      }
    }
  });

  test('10.01 - Renderiza el directorio con controles', async ({ page }) => {
    const searchInput = page.locator('input[type="search"]').first();
    await expect(searchInput).toBeVisible();

    const addBtn = page.locator('button').filter({ hasText: /Agregar Cliente|Nuevo Cliente/i }).first();
    await expect(addBtn).toBeVisible();

    const importBtn = page.locator('button').filter({ hasText: /Importar/i }).first();
    await expect(importBtn).toBeVisible();

    const container = page.locator('#client-cards-container');
    await expect(container).toBeVisible();
    await takeScreenshot(page, '10-crm-layout');
  });

  test('10.02 - Abrir modal Nuevo Cliente', async ({ page }) => {
    const addBtn = page.locator('button').filter({ hasText: /Agregar Cliente|Nuevo Cliente/i }).first();
    await addBtn.click();

    const modalTitle = page.locator('h2, h3').filter({ hasText: /^Añadir Cliente$|^Nuevo Cliente$|^Crear Cliente$/i }).first();
    await expect(modalTitle).toBeVisible({ timeout: 5000 });
    await takeScreenshot(page, '10-new-client-modal');
  });

  test('10.03 - Modal tiene campos de formulario', async ({ page }) => {
    const addBtn = page.locator('button').filter({ hasText: /Agregar Cliente|Nuevo Cliente/i }).first();
    await addBtn.click();
    await page.waitForTimeout(500);

    // Should have name field at minimum
    const nameInput = page.locator('input').first();
    await expect(nameInput).toBeVisible();
  });

  test('10.04 - Cerrar modal con Escape', async ({ page }) => {
    const addBtn = page.locator('button').filter({ hasText: /Agregar Cliente|Nuevo Cliente/i }).first();
    await addBtn.click();

    const modalTitle = page.locator('h2, h3').filter({ hasText: /^Añadir Cliente$|^Nuevo Cliente$|^Crear Cliente$/i }).first();
    await expect(modalTitle).toBeVisible({ timeout: 5000 });

    await closeModalEscape(page);
    await expect(modalTitle).toBeHidden({ timeout: 3000 });
  });

  test('10.05 - Cerrar modal con botón Cancelar', async ({ page }) => {
    const addBtn = page.locator('button').filter({ hasText: /Agregar Cliente|Nuevo Cliente/i }).first();
    await addBtn.click();

    const modalTitle = page.locator('h2, h3').filter({ hasText: /^Añadir Cliente$|^Nuevo Cliente$|^Crear Cliente$/i }).first();
    await expect(modalTitle).toBeVisible({ timeout: 5000 });

    const cancelBtn = page.locator('button').filter({ hasText: /Cancelar|Cerrar|cancel/i }).first();
    // Force click in case it's in a scrolling container
    await cancelBtn.click({ force: true });
    
    await expect(modalTitle).toBeHidden({ timeout: 5000 });
  });

  test('10.06 - Crear un nuevo cliente E2E', async ({ page }) => {
    const addBtn = page.locator('button').filter({ hasText: /Agregar Cliente|Nuevo Cliente/i }).first();
    await addBtn.click();

    const testName = `E2E Client ${Date.now()}`;
    await page.fill('input[name="name"]', testName);
    await page.fill('input[name="lastName"]', 'TestLastName');
    await page.fill('input[name="docNumber"]', '123456789');
    await page.fill('input[name="phone"]', '+1234567890');
    await page.fill('input[name="email"]', 'e2eclient@test.com');
    await page.fill('input[name="birthday"]', '1990-01-01');

    const saveBtn = page.locator('button[type="submit"]').first();
    await saveBtn.click();

    // Verify modal closes to indicate successful save
    const modalTitle = page.locator('h2, h3').filter({ hasText: /^Añadir Cliente$|^Nuevo Cliente$|^Crear Cliente$/i }).first();
    await expect(modalTitle).toBeHidden({ timeout: 10000 });

    // Verify it was added to the list (Wait for Realtime update)
    const clientCard = page.locator('#client-cards-container div.bg-bg-secondary').filter({ hasText: testName }).first();
    await expect(clientCard).toBeVisible({ timeout: 10000 });
  });

  test('10.07 - Búsqueda filtra al cliente creado', async ({ page }) => {
    // We create a specific client to search
    const uniqueSearch = `SearchTest_${Date.now()}`;
    const addBtn = page.locator('button').filter({ hasText: /Agregar Cliente|Nuevo Cliente/i }).first();
    await addBtn.click();
    await page.fill('input[name="name"]', uniqueSearch);
    const saveBtn = page.locator('button[type="submit"]').first();
    await saveBtn.click();
    
    // Wait for modal to close
    await expect(page.locator('h2, h3').filter({ hasText: /^Añadir Cliente$|^Nuevo Cliente$|^Crear Cliente$/i })).toBeHidden({ timeout: 10000 });
    
    // Wait for Realtime update
    await expect(page.locator('#client-cards-container div.bg-bg-secondary').filter({ hasText: uniqueSearch }).first()).toBeVisible({ timeout: 15000 });

    const searchInput = page.locator('input[type="search"]').first();
    await searchInput.fill(uniqueSearch);
    await page.waitForTimeout(500);

    // Should be visible
    const filteredCard = page.locator('#client-cards-container div.bg-bg-secondary').filter({ hasText: uniqueSearch }).first();
    await expect(filteredCard).toBeVisible();

    // Clear search
    await searchInput.fill('');
    await page.waitForTimeout(500);
  });

  test('10.08 - Editar cliente existente', async ({ page }) => {
    // Create a client to edit
    const createName = `EditTest_${Date.now()}`;
    const addBtn = page.locator('button').filter({ hasText: /Agregar Cliente|Nuevo Cliente/i }).first();
    await addBtn.click();
    await page.fill('input[name="name"]', createName);
    const saveBtn = page.locator('button[type="submit"]').first();
    await saveBtn.click();

    // Wait for modal to close
    await expect(page.locator('h2, h3').filter({ hasText: /^Añadir Cliente$|^Nuevo Cliente$|^Crear Cliente$/i })).toBeHidden({ timeout: 10000 });

    // Wait for it to appear (Realtime update)
    const card = page.locator('#client-cards-container').locator('div.bg-bg-secondary').filter({ hasText: createName }).first();
    await expect(card).toBeVisible({ timeout: 15000 });

    // Click edit button within that card
    const editBtn = card.locator('button[title*="Edit"], button[title*="edit"]').first();
    await editBtn.click();

    const modalTitle = page.locator('h2, h3').filter({ hasText: /Editar Cliente|Edit Client/i }).first();
    await expect(modalTitle).toBeVisible({ timeout: 5000 });

    const newLastName = `Updated_${Date.now()}`;
    await page.fill('input[name="lastName"]', newLastName);

    const updateBtn = page.locator('button[type="submit"]').first();
    await updateBtn.click();

    // Verify modal closes
    await expect(modalTitle).toBeHidden({ timeout: 10000 });

    // Check if updated in the list (Wait for Realtime update)
    const updatedCard = page.locator('#client-cards-container div.bg-bg-secondary').filter({ hasText: newLastName }).first();
    await expect(updatedCard).toBeVisible({ timeout: 15000 });
  });

  test('10.09 - Eliminar un cliente', async ({ page }) => {
    // Create a client to delete
    const deleteName = `DeleteTest_${Date.now()}`;
    const addBtn = page.locator('button').filter({ hasText: /Agregar Cliente|Nuevo Cliente/i }).first();
    await addBtn.click();
    await page.fill('input[name="name"]', deleteName);
    const saveBtn = page.locator('button[type="submit"]').first();
    await saveBtn.click();

    // Wait for modal to close
    await expect(page.locator('h2, h3').filter({ hasText: /^Añadir Cliente$|^Nuevo Cliente$|^Crear Cliente$/i })).toBeHidden({ timeout: 10000 });

    const card = page.locator('#client-cards-container').locator('div.bg-bg-secondary').filter({ hasText: deleteName }).first();
    await expect(card).toBeVisible({ timeout: 15000 });

    // Setup dialog handler before interacting
    page.once('dialog', async dialog => {
      await dialog.accept();
    });

    // Click delete
    const deleteBtn = card.locator('button[title*="Elimin"], button[title*="Delete"], button[title*="borrar"]').first();
    await deleteBtn.click();

    // Verify it's gone (Wait for Realtime update)
    const cardAfterDelete = page.locator('#client-cards-container').locator('div.bg-bg-secondary').filter({ hasText: deleteName }).first();
    await expect(cardAfterDelete).toBeHidden({ timeout: 15000 });
  });

  test('10.10 - Abrir modal de Importar Contactos', async ({ page }) => {
    const importBtn = page.locator('button').filter({ hasText: /Importar/i }).first();
    await importBtn.click();

    const importTitle = page.locator('h2, h3').filter({ hasText: /Importar|Import/i }).first();
    await expect(importTitle).toBeVisible({ timeout: 5000 });
    await takeScreenshot(page, '10-import-modal');
  });
});
