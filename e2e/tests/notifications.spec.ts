import { argosScreenshot, expect, loadApp, test } from "#e2e/fixtures.js";

test("Notifications panel opens from the topbar bell icon", async ({
  page,
}) => {
  // Stub the notification backend (otherwise the service errors in the
  // console and may show error UI). Returning empty events / no rules is
  // enough for the panel to render.
  await page.route("**/api/v1/notification/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: "[]",
    }),
  );

  await loadApp(page);

  // The notification component renders the bell icon in the topbar
  // (only when logged-in). matTooltip does not yield an aria-label, so
  // scope by the component selector.
  const bellButton = page.locator("app-notification button").first();
  await expect(bellButton).toBeVisible();

  await bellButton.click();

  // The panel's heading should be visible.
  await expect(
    page.getByRole("heading", { name: "Notifications" }),
  ).toBeVisible();

  await argosScreenshot(page, "notifications-panel-open");
});
