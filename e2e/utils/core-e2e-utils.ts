import { Page } from "@playwright/test";

/**
 * Open the app and wait until initial loading is complete.
 * @param page Playwright page object so that this function can use the test context
 */
export async function startApp(page: Page) {
  // Navigate to the application after the date is set
  await page.goto("/");

  // wait for initial demo data and indexing is done:
  // The sync popup should first appear and then disappear after a while when tasks are completed
  const backgroundTasksDetailsElement = "#backgroundProcessingTasksDetails";
  await page.waitForSelector(backgroundTasksDetailsElement);
  //console.log("app is preparing (background tasks & indices running)");
  await page.waitForSelector(backgroundTasksDetailsElement, {
    state: "detached", // i.e. the element has been removed again
  });
  //console.log("app ready (background tasks completed)");
}
