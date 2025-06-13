import { expect, test, argosScreenshot } from "#e2e/fixtures.js";

test("Dashboard widgets and actions", async ({ page }) => {
  await expect(page.getByText("Quick Actions")).toBeVisible();
  await expect(page.getByText("108 Children")).toBeVisible();
  await expect(page.getByText("12 Tasks due")).toBeVisible();
  await expect(page.getByText("58 Notes needing follow-up")).toBeVisible();
  await argosScreenshot(page, "dashboard");

  await page.getByText("Record attendance").click();
  await expect(
    page.getByRole("heading", { name: "Record Attendance" }),
  ).toBeVisible();
});
