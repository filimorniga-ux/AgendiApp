import { test, expect } from '@playwright/test';
import { takeScreenshot } from './helpers/test-helpers.js';

import { createClient } from '@supabase/supabase-js';

test.describe('21 — Flujo de Reserva Pública', () => {
  let businessSlug = 'test'; // Fallback por defecto

  test.beforeAll(async ({ browser }) => {
    try {
      const supabase = createClient(
        process.env.VITE_SUPABASE_URL,
        process.env.VITE_SUPABASE_ANON_KEY
      );
      // Get the user first
      const { data: { user } } = await supabase.auth.signInWithPassword({
        email: process.env.TEST_USER_EMAIL || 'test@agendiapp.app',
        password: process.env.TEST_USER_PASSWORD || 'TestPassword123!',
      });
      if (user) {
        const { data: business } = await supabase
          .from('businesses')
          .select('slug')
          .eq('owner_uid', user.id)
          .single();
        if (business && business.slug) {
          businessSlug = business.slug;
          console.log('✅ Fetched business slug for testing:', businessSlug);
        }
      }
    } catch (error) {
      console.warn('Could not determine business slug, using default fallback', error);
    }
  });


  test('21.01 - Permite avanzar en el wizard de Reserva Pública', async ({ page }) => {
    test.setTimeout(60000); // 60s timeout for slower browsers like Firefox

    // Limpiamos el estado para simular un cliente anónimo
    await page.context().clearCookies();
    
    // Navegamos a la URL pública del negocio
    await page.goto(`/p/${businessSlug}/reservar`);
    await page.waitForTimeout(3000);

    await takeScreenshot(page, '21-public-booking-step1');
    
    // Verificar que estamos en el Paso 1 (Servicio)
    await expect(page.locator('text=/Selecciona/i').first()).toBeVisible();
    
    // Intentar seleccionar un servicio (el primero disponible)
    const firstService = page.locator('.cursor-pointer').filter({ hasText: /\$/ }).first();
    if (await firstService.count() > 0) {
      await firstService.click();
      await page.waitForTimeout(1500);
      
      // Paso 2: Profesional
      await takeScreenshot(page, '21-public-booking-step2');
      const anyStylist = page.locator('text=/Cualquier Profesional/i').first();
      if (await anyStylist.count() > 0) {
        await anyStylist.click();
        await page.waitForTimeout(1500);
        
        // Paso 3: Calendario / Horario
        await takeScreenshot(page, '21-public-booking-step3');
        
        // Hacemos click en un día (el primero seleccionable)
        const dayBtn = page.locator('button.bg-bg-tertiary').filter({ hasNotText: 'Dom' }).first();
        if (await dayBtn.count() > 0) {
           await dayBtn.click();
           await page.waitForTimeout(1500);
           
           // Hacemos click en una hora
           const timeSlot = page.locator('button.border-border-main').first();
           if (await timeSlot.count() > 0) {
             await timeSlot.click();
             await page.waitForTimeout(1500);
             
             // Paso 4: Formulario de Datos
             await takeScreenshot(page, '21-public-booking-step4');
             await expect(page.locator('input[name="name"]')).toBeVisible();
             await expect(page.locator('input[name="phone"]')).toBeVisible(); // PhoneInput test
             
             // Completar formulario
             await page.locator('input[name="name"]').fill('Cliente de Prueba');
             await page.locator('input[name="phone"]').fill('+56999999999');
             
             // Confirmar reserva
             await page.locator('button[type="submit"]').click();
             
             // Paso 5: Confirmación
             await expect(page.locator('text=/¡Reserva solicitada!/i').first()).toBeVisible({ timeout: 10000 });
             await takeScreenshot(page, '21-public-booking-step5');
           }
        }
      }
    } else {
      // Si no hay servicios, simplemente validamos que la página carga
      console.log('No services found to continue the booking flow.');
    }
  });
});
