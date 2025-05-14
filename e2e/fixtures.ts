import { test as base } from "@playwright/test";

export { expect } from "@playwright/test";

export const test = base.extend<{ forEachTest: void }>({
  forEachTest: [
    async ({ page }, use) => {
      await page.goto("/");
      // Give the app time to load
      await page.getByText("Aam Digital - Demo").waitFor({ timeout: 10_000 });
      await use();
    },
    { auto: true },
  ],
});
