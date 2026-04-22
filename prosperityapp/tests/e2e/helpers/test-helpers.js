import { expect } from '@playwright/test';

// ── Page helpers ────────────────────────────────────────────────────────────

/**
 * Wait until a page title/heading matching the regex is visible.
 */
export async function waitForPageLoad(page, titleRegex, timeout = 15000) {
  const heading = page.locator('h1, h2').filter({ hasText: titleRegex }).first();
  await expect(heading).toBeVisible({ timeout });
  return heading;
}

/**
 * Navigate to a route and wait for hydration.
 */
export async function navigateTo(page, path, titleRegex, timeout = 15000) {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  if (titleRegex) {
    await waitForPageLoad(page, titleRegex, timeout);
  } else {
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).toBeVisible();
  }
}

// ── Modal helpers ───────────────────────────────────────────────────────────

/**
 * Click a button by text and wait for a modal to appear.
 * Returns the modal element.
 */
export async function openModal(page, buttonText, modalTitleRegex) {
  const btn = page.locator('button').filter({ hasText: buttonText }).first();
  await expect(btn).toBeVisible({ timeout: 10000 });
  await btn.click();
  await page.waitForTimeout(500);

  if (modalTitleRegex) {
    const title = page.locator('h2, h3').filter({ hasText: modalTitleRegex }).first();
    await expect(title).toBeVisible({ timeout: 5000 });
    return title;
  }
  // Fallback: wait for any modal-like element
  const modal = page.locator('.modal-content, [role="dialog"], dialog').first();
  await expect(modal).toBeVisible({ timeout: 5000 });
  return modal;
}

/**
 * Close the currently open modal via Escape key.
 */
export async function closeModalEscape(page) {
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
}

/**
 * Close modal by clicking a cancel/close button.
 */
export async function closeModalButton(page) {
  const closeBtn = page.locator('button').filter({ hasText: /Cancelar|Cerrar|×|✕/i }).first();
  if (await closeBtn.isVisible({ timeout: 2000 })) {
    await closeBtn.click();
    await page.waitForTimeout(500);
  } else {
    await closeModalEscape(page);
  }
}

// ── Tab helpers ─────────────────────────────────────────────────────────────

/**
 * Click a tab by its label text and wait briefly.
 */
export async function selectTab(page, tabLabel) {
  const tab = page.locator('button').filter({ hasText: new RegExp(tabLabel, 'i') }).first();
  await expect(tab).toBeVisible({ timeout: 5000 });
  await tab.click();
  await page.waitForTimeout(500);
  return tab;
}

// ── Form helpers ────────────────────────────────────────────────────────────

/**
 * Fill an input identified by placeholder or label.
 */
export async function fillInput(page, placeholder, value) {
  const input = page.locator(`input[placeholder*="${placeholder}" i]`).first();
  await input.fill(value);
  return input;
}

/**
 * Select an option from a <select> element.
 */
export async function selectOption(page, selectIndex, value) {
  const select = page.locator('select').nth(selectIndex);
  await select.selectOption(value);
  return select;
}

// ── Screenshot helpers ──────────────────────────────────────────────────────

/**
 * Take a named screenshot in the screenshots directory.
 */
export async function takeScreenshot(page, name) {
  await page.screenshot({ path: `tests/e2e/screenshots/${name}.png` });
}

// ── Assertion helpers ───────────────────────────────────────────────────────

/**
 * Assert that a button with the given text exists and is visible.
 */
export async function expectButtonVisible(page, text, timeout = 5000) {
  const btn = page.locator('button').filter({ hasText: text }).first();
  await expect(btn).toBeVisible({ timeout });
  return btn;
}

/**
 * Assert element count is at least N.
 */
export async function expectMinCount(locator, minCount) {
  const count = await locator.count();
  expect(count).toBeGreaterThanOrEqual(minCount);
}

/**
 * Check if an element is visible without failing the test.
 */
export async function isVisible(locator, timeout = 2000) {
  try {
    await expect(locator).toBeVisible({ timeout });
    return true;
  } catch {
    return false;
  }
}
