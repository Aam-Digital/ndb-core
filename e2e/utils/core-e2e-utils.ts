import { Page } from "@playwright/test";

/**
 * Open the app and wait until initial loading is complete.
 * @param page Playwright page object so that this function can use the test context
 */
export async function startApp(page: Page) {
  // Navigate to the application after the date is set
  await page.goto("/help");

  // wait for initial demo data and indexing:
  // The sync popup should first appear and then disappear after a while when tasks are completed
  const backgroundTasksDetailsElement = "#backgroundProcessingTasksDetails";
  await page.waitForSelector(backgroundTasksDetailsElement);
  //console.log("app is preparing (background tasks & indices running)");

  await page
    .locator("#backgroundProcessingTasksDetails path")
    .first()
    .isVisible();

  // [option] all indexing done, drawer disappeared:
  //await page.waitForSelector(backgroundTasksDetailsElement, { state: "detached" });
  //console.log("app ready (background tasks completed)");
}
