import { test, expect } from '@playwright/test';

test.describe('Core E2E Flow', () => {
  test('Should bypass auth and load Dashboard', async ({ page }) => {
    // La app usa bypass de auth en local (VITE_DEV_BYPASS_AUTH=true)
    await page.goto('/');

    // El ruteo debería llevarnos a /app de inmediato si estamos logueados
    await expect(page).toHaveURL(/.*\/app.*/);

    // Verificar que el Sidebar u otro elemento de navegación core carga
    // (Buscamos algún menú principal o texto como 'AgendiApp')
    const navText = page.locator('nav, aside').filter({ hasText: /Agenda|AgendiApp/i }).first();
    await expect(navText).toBeVisible({ timeout: 10000 });

    // Tomar un screenshot para la posteridad de nuestro primer test "green"
    await page.screenshot({ path: 'tests/e2e/screenshots/dashboard-loaded.png' });
  });
});
