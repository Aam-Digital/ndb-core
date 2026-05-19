import {
  argosScreenshot,
  expect,
  loadApp,
  test,
  waitForDashboardWidgetsToLoad,
} from "#e2e/fixtures.js";

test("Changelog dialog shows latest release when version is clicked", async ({
  page,
}) => {
  await page.route("**/api.github.com/repos/**/releases**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {
          tag_name: "v1.5.0",
          name: "Release v1.5.0",
          body: "### Features\n* new dashboard widgets\n* improved reporting\n\n### Bug Fixes\n* fixed date display on small screens",
          published_at: "2025-01-15T10:00:00Z",
          prerelease: false,
          draft: false,
        },
      ]),
    }),
  );

  await loadApp(page, []);

  await page.locator("app-version").click();

  const changelogDialog = page.getByRole("dialog");
  await expect(
    changelogDialog.getByRole("heading", { name: "Latest Changes" }),
  ).toBeVisible();
  await expect(changelogDialog.getByText("Release v1.5.0")).toBeVisible();

  await argosScreenshot(page, "changelog-dialog", { fullPage: false });
});

test("Translated and localized app versions (i18n)", async ({ page }) => {
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
