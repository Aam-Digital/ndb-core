import { argosScreenshot, expect, test } from "#e2e/fixtures.js";

test("Dashboard widgets and actions", async ({ page }) => {
  // somehow the entity-count dashboard is stuck in e2e tests and only shows numbers after navigating ...
  await page.getByRole("navigation").getByText("Help").click();
  await page.getByRole("navigation").getByText("Dashboard").click();

  await expect(page.getByText("Quick Actions")).toBeVisible();
  await expect(page.getByText("108 Children")).toBeVisible();
  await expect(page.getByText("8 Tasks due")).toBeVisible();
  await expect(page.getByText("41 Notes needing follow-up")).toBeVisible();
  await argosScreenshot(page, "dashboard");

  await page.getByText("Record attendance").click();
  await expect(
    page.getByRole("heading", { name: "Record Attendance" }),
  ).toBeVisible();
});
