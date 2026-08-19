import {
  argosScreenshot,
  expect,
  loadApp,
  Page,
  test,
  waitForDashboardWidgetsToLoad,
} from "#e2e/fixtures.js";

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

test("shows a multi-lingual config label in the default language, then in the user's own language after switching locale", async ({
  page,
}) => {
  // --- default (English) locale ---

  await loadApp(page, []);
  await openChildrenList(page);

  await expect(
    page.getByRole("columnheader", { name: "Project Number" }),
  ).toBeVisible();

  // --- user's own (German) locale ---

  await loadAppInLocale(page, "de");
  await openChildrenList(page);

  await expect(
    page.getByRole("columnheader", { name: "Projektnummer" }),
  ).toBeVisible();
  await expect(
    page.getByRole("columnheader", { name: "Project Number" }),
  ).toHaveCount(0);
});

test("translates the whole app when the user picks a language on the welcome screen", async ({
  page,
}) => {
  await page.goto("/");

  // Wait for dialog to be fully interactive before clicking mat-select
  await expect(
    page.getByRole("heading", { name: "Welcome to Aam Digital!" }),
  ).toBeVisible();

  await page.getByText("Choose your language").click();
  await page.getByRole("option", { name: "Deutsch / German (de)" }).click();

  await expect(
    page.getByRole("heading", { name: "Willkommen bei Aam Digital!" }),
  ).toBeVisible();

  await page.getByRole("combobox", { name: "Anwendungsfall" }).click();
  await page.getByRole("option", { name: "Bildungsprojekt" }).click();

  // we're in a using mat-dialog, we need to scroll within the dialog container
  await page
    .getByRole("button", { name: "System erstellen" })
    .scrollIntoViewIfNeeded();

  await argosScreenshot(page, "i18n-de_init");

  await page.getByRole("button", { name: "System erstellen" }).click();

  await page
    .getByRole("button", { name: "System erkunden" })
    .click({ timeout: 10_000 });

  await expect(
    page.getByRole("button", { name: "System erkunden" }),
  ).not.toBeVisible();

  // FIXME: The dashboard may load before demo data is generated and not display
  // it. As a workaround we move to a different view and back to the dashboard
  await page.getByRole("navigation").getByText("Schüler:innen").click();

  // Extract the count from the paginator (e.g., "1 – 10 von 99" in German)
  // Wait for the paginator to load
  await page.locator(".mat-mdc-paginator-range-label").waitFor();
  const paginatorText = await page
    .locator(".mat-mdc-paginator-range-label")
    .textContent();
  const countMatch = paginatorText?.match(/von (\d+)/);
  const studentCount = countMatch ? countMatch[1] : "0";

  await page.getByRole("navigation").getByText("Dashboard").click();
  await expect(page.getByText(`${studentCount} Schüler:innen`)).toBeVisible({
    timeout: 10_000,
  });

  // Wait for all dashboard widgets to finish loading before taking screenshot
  await waitForDashboardWidgetsToLoad(page);

  await argosScreenshot(page, "i18n-de_dashboard");
});
