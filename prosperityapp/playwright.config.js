import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables
dotenv.config({ path: path.resolve(__dirname, '.env') });

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  // Script that runs before any tests start
  globalSetup: './tests/e2e/global-setup.js',
  
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    // Use the saved state from globalSetup so tests start logged in
    storageState: 'tests/e2e/.auth/user.json',
    // Force Spanish locale globally so texts like 'Cerrar Sesión' are not translated to 'Log Out'
    locale: 'es-CL',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    timeout: 60000,
    reuseExistingServer: !process.env.CI,
    env: {
      VITE_DEV_BYPASS_AUTH: 'true',
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || 'https://mzoodzsefyaymhjpzopm.supabase.co',
      VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16b29kenNlZnlheW1oanB6b3BtIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzQxNjk1MTEsImV4cCI6MTk4OTczMzUxMX0.xyz',
    },
  },
});
