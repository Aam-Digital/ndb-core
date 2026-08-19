import { expect, loadApp, Page, test } from "#e2e/fixtures.js";

const LOCALE_STORAGE_KEY = "locale";

/**
 * Like `loadApp(page, [])`, but starts the app in the given locale.
 *
 * The welcome screen's button is localized, so it is located by its container
 * rather than by its text - otherwise this could only ever run in English.
 */
async function loadAppInLocale(page: Page, locale: string) {
  await page.addInitScript(
    ({ key, value }) => {
      localStorage.setItem(key, value);
      window["e2eDemoData"] = [];
    },
    { key: LOCALE_STORAGE_KEY, value: locale },
  );

  await page.goto("/?useCase=all-features");
  await page.locator(".demo-actions button").click({ timeout: 10_000 });
}

async function openChildrenList(page: Page) {
  await page.getByRole("navigation").getByText("Children").click();
  await page.waitForLoadState("networkidle");
}

test("shows a multi-lingual config label in the default language", async ({
  page,
}) => {
  await loadApp(page, []);
  await openChildrenList(page);

  await expect(
    page.getByRole("columnheader", { name: "Project Number" }),
  ).toBeVisible();
});

test("shows a multi-lingual config label in the user's own language", async ({
  page,
}) => {
  await loadAppInLocale(page, "de");
  await openChildrenList(page);

  await expect(
    page.getByRole("columnheader", { name: "Projektnummer" }),
  ).toBeVisible();
  await expect(
    page.getByRole("columnheader", { name: "Project Number" }),
  ).toHaveCount(0);
});
