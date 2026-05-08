import { argosScreenshot, expect, loadApp, test } from "#e2e/fixtures.js";

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

  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByRole("heading", { name: "Latest Changes" }),
  ).toBeVisible();
  await expect(dialog.getByText("Release v1.5.0")).toBeVisible();

  await argosScreenshot(page, "changelog-dialog", { fullPage: false });
});
