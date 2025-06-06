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
export const E2E_REF_DATE = "2025-01-23";

export const test = base.extend<{ forEachTest: void }>({
  forEachTest: [
    async ({ page }, use) => {
      await page.clock.install();
      await page.clock.setFixedTime(E2E_REF_DATE);
      await page.addInitScript((E2E_REF_DATE) => {
        // @ts-expect-error Because we install a mock clock, `Data.name` is
        // `ClockDate` and not `Date`. This would break the Entity Schema
        // service.
        Date.DATA_TYPE = "date";
        // @ts-expect-error global state
        globalThis.NDB_E2E_REF_DATE = new Date(E2E_REF_DATE);
      }, E2E_REF_DATE);
      await page.goto("/");
      // Give the app time to load
      await page.getByText("Aam Digital - Demo").waitFor({ timeout: 10_000 });

      // Ensure the system is initialized before running tests.
      await initSystemWithBaseConfig(page);

      await use();
    },
    { auto: true },
  ],
});

async function initSystemWithBaseConfig(page: Page) {
  page.getByRole("heading", { name: "Welcome to Aam Digital!" });
  await page.locator("app-choose-use-case mat-select").click();

  await page.locator("mat-option").nth(1).click();

  const initButton = page.locator('button:has-text("Initialize System")');
  await initButton.click();

  await page.locator("h1.mat-dialog-title").waitFor({ state: "detached" });
}

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
