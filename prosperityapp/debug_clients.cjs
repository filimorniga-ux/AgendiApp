const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    storageState: 'tests/e2e/.auth/user.json'
  });
  const page = await context.newPage();
  
  page.on('console', msg => console.log(`[PAGE LOG] ${msg.text()}`));
  page.on('pageerror', error => console.log(`[PAGE ERROR] ${error.message}`));
  page.on('requestfailed', request =>
    console.log(`[REQUEST FAILED] ${request.url()} - ${request.failure()?.errorText}`)
  );
  
  await page.goto('http://localhost:5173/app/clientes');
  await page.waitForTimeout(5000); 
  
  await browser.close();
})();
