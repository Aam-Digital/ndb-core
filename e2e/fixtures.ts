import { test as base } from "@playwright/test";

export { expect } from "@playwright/test";

export const test = base.extend<{ forEachTest: void }>({
  forEachTest: [
    async ({ page }, use) => {
      await page.clock.install({ time: "2025-01-23" });
      await page.addInitScript(() => {
        // @ts-expect-error Because we install a mock clock, `Data.name` is
        // `ClockDate` and not `Date`. This would break the Entity Schema
        // service.
        Date.DATA_TYPE = "date";
      });
      await page.goto("/");
      // Give the app time to load
      await page.getByText("Aam Digital - Demo").waitFor({ timeout: 10_000 });
      await use();
    },
    { auto: true },
  ],
});
