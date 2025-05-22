// eslint-disable-next-line no-restricted-imports
import { test as base, Page } from "@playwright/test";
// eslint-disable-next-line no-restricted-imports
import {
  argosScreenshot as argosScreenshotBase,
  ArgosScreenshotOptions,
} from "@argos-ci/playwright";

// eslint-disable-next-line no-restricted-imports
export { expect } from "@playwright/test";

/** The mocked "now" date to which e2e tests are fixed. */
export const E2E_DATE_TODAY = "2025-01-23";

export const test = base.extend<{ forEachTest: void }>({
  forEachTest: [
    async ({ page }, use) => {
      await page.clock.install({ time: E2E_DATE_TODAY });
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

export async function argosScreenshot(
  page: Page,
  name: string,
  options?: ArgosScreenshotOptions,
): Promise<void> {
  if (process.env.CI || process.env.SCREENSHOT) {
    return argosScreenshotBase(page, name, {
      fullPage: true,
      ...(options || {}),
    });
  }
}
