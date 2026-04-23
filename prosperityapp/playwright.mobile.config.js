import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables
dotenv.config({ path: path.resolve(__dirname, '.env') });

export default defineConfig({
  testDir: './tests/mobile',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  // Re-use the existing global setup to bypass login where needed
  globalSetup: './tests/e2e/global-setup.js',
  
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    storageState: 'tests/e2e/.auth/user.json', // Re-use auth state
    locale: 'es-CL',
  },

  projects: [
    {
      name: 'Mobile Chrome (Pixel 5)',
      use: { 
        ...devices['Pixel 5'],
        hasTouch: true,
        isMobile: true
      },
    },
    {
      name: 'Mobile Safari (iPhone 13)',
      use: { 
        ...devices['iPhone 13'],
        hasTouch: true,
        isMobile: true
      },
    },
  ],

  /* Run local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    timeout: 60000,
    reuseExistingServer: !process.env.CI,
  },
});
