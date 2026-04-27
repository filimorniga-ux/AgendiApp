import { chromium, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

export default async function globalSetup(config) {
  const { baseURL, storageState } = config.projects[0].use;
  
  const email = process.env.TEST_USER_EMAIL || 'test@agendiapp.app';
  const password = process.env.TEST_USER_PASSWORD || 'TestPassword123!';

  // Validate if test user credentials are provided
  if (!email || !password) {
    console.warn('⚠️  TEST_USER_EMAIL or TEST_USER_PASSWORD not found in environment.');
    console.warn('⚠️  E2E tests will likely fail due to RLS policies. Please ensure a valid test user is provided.');
  }

  const browser = await chromium.launch();
  const context = await browser.newContext({ locale: 'es-CL' });
  const page = await context.newPage();
  
  // Capturar todos los logs del navegador durante el setup
  page.on('console', msg => console.log(`[Browser Console]: ${msg.text()}`));
  page.on('requestfailed', request =>
    console.log(`[Request Failed]: ${request.url()} - ${request.failure()?.errorText}`)
  );
  
  // Create auth directory if it doesn't exist
  const authDir = path.dirname(storageState);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  try {
    const fetchStatus = await page.evaluate(async () => {
      try {
        const res = await fetch('https://mzoodzsefyaymhjpzopm.supabase.co/auth/v1/health');
        return { ok: res.ok, status: res.status };
      } catch (e) {
        return { error: e.message };
      }
    });
    console.log('[Diagnostic] Supabase fetch from browser:', fetchStatus);
  } catch (err) {
    console.log('[Diagnostic err]', err);
  }

  // Since webServer.env does not leak to the test runner process automatically,
  // we default to true here as requested, or evaluate the env var if passed.
  const bypassAuth = process.env.VITE_DEV_BYPASS_AUTH === 'true' || true;

  const maxRetries = 3;
  try {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`\n🔑 Authenticating test user: ${email} (Attempt ${attempt}/${maxRetries})...`);
      
      try {
        // Determine the login URL (assuming baseURL redirects / to /app when not logged in)
        await page.goto(baseURL + '/app');
        
        // Wait for hydration to complete
        await page.waitForTimeout(2000);

        if (bypassAuth) {
           console.log('Bypass mode active, skipping login form...');
           // If bypass is active, the app should automatically log in and show the sidebar
           await page.waitForSelector('#sidebar-nav', { timeout: 15000 });
        } else {
          // Wait for the login form to appear
          await page.waitForSelector('input[type="email"]', { timeout: 15000 });
          await page.waitForSelector('input[type="password"]', { timeout: 5000 });

          // Fill credentials
          await page.fill('input[type="email"]', email);
          await page.fill('input[type="password"]', password);

          // Click submit
          await page.click('button:has-text("Entrar")');

          // Wait for successful login by checking that the sidebar navigation appears (indicative of the dashboard/layout loading)
          await Promise.race([
            page.waitForSelector('#sidebar-nav', { timeout: 15000 }),
            page.waitForSelector('text=Correo o contraseña incorrectos', { timeout: 15000 }).then(() => {
              throw new Error('Login failed: Correo o contraseña incorrectos');
            })
          ]);
        }
        
        // Wait a brief moment to ensure Supabase session is stored in localStorage
        await page.waitForTimeout(2000);

        // Save state
        await page.context().storageState({ path: storageState });
        console.log(`✅ Authentication state saved to ${storageState}\n`);
        break; // Exit loop on success
        
      } catch (error) {
        console.error(`\n❌ Global setup failed on attempt ${attempt}: ${error.message}`);
        if (attempt === maxRetries) {
          throw error;
        }
        console.log('Retrying in 5 seconds...');
        await page.waitForTimeout(5000);
      }
    }
  } finally {
    await browser.close();
  }
}
