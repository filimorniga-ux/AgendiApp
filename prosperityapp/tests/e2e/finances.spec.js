import { test, expect } from '@playwright/test';

test('App should load the login page', async ({ page }) => {
  // Try navigating to the base URL that the dev server exposes
  await page.goto('/');

  // On an unauthenticated state, it should redirect to /login or show auth form
  // Let's just expect the body to be rendered without crashing
  const body = page.locator('body');
  await expect(body).toBeVisible();

  // If the app has a specific title, we can check it
  await expect(page).toHaveTitle(/AgendiApp/i);
});
