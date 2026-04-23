import { test, expect } from '@playwright/test';

test.describe('Mobile Audit: Sales and Agenda Modals', () => {
  // Uses global login state setup

  test('agenda modal is a bottom-sheet on mobile', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Skipping on non-mobile viewports');
    
    await page.goto('/app'); // Root of app is Agenda Calendario

    // Wait for the calendar to load
    await page.waitForSelector('.react-calendar', { timeout: 15000 });

    // Click on a day/slot to open modal (this might depend on the specific calendar implementation)
    // Let's just click the "Nueva Cita" button if it exists or trigger the modal
    const newAppointmentBtn = page.locator('button', { hasText: /Nueva Cita|Agendar/i }).first();
    if (await newAppointmentBtn.isVisible()) {
        await newAppointmentBtn.click();
        
        // Modal content
        const modal = page.locator('.modal-content').first();
        await expect(modal).toBeVisible();

        // Check if it snaps to bottom by evaluating its position or classes
        // It should have max-h-[90dvh] or similar to avoid overflowing top
        const box = await modal.boundingBox();
        const viewportSize = page.viewportSize();
        
        // Bottom sheet usually touches the bottom
        // Distance from bottom of modal to bottom of viewport should be minimal
        expect(box.y + box.height).toBeGreaterThanOrEqual(viewportSize.height - 20);
    }
  });
});
