import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ storageState: 'tests/e2e/.auth/user.json' });
  const page = await context.newPage();
  
  await page.goto('http://localhost:5173/app/clientes');
  
  // Wait a bit to let it load or redirect
  await page.waitForTimeout(3000);
  
  // Get the current URL
  console.log("Current URL after navigating to /app/clientes: " + page.url());
  
  // Get the page title and body content
  const title = await page.title();
  console.log("Page Title: " + title);
  
  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log("Body text limited to 500 chars: " + bodyText.substring(0, 500));
  
  await browser.close();
})();
