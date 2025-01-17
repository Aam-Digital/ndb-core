import { chromium, FullConfig } from '@playwright/test';

async function playwrightSetup(config: FullConfig) {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // Perform application initialization
  await page.goto('http://localhost:4200/');
//To-Do: Add Logion credentials if required

  // Save the context state for reuse in tests
  await context.storageState({ path: 'storageState.json' });

  await browser.close();
}

export default playwrightSetup;
