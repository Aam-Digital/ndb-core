import { expect, test, argosScreenshot } from "#e2e/fixtures.js";

test("Dashboard widgets and actions", async ({ page }) => {
  await expect(page.getByText("Quick Actions")).toBeVisible();
  await argosScreenshot(page, "dashboard");
  await page.getByText("Record attendance").click();

  await expect(
    page.getByRole("heading", { name: "Record Attendance" }),
  ).toBeVisible();
  await page.goBack();

  await expect(page.getByText("108 Children")).toBeVisible();
  await expect(page.getByText("6 Tasks due")).toBeVisible();
  await expect(page.getByText("47 Notes needing follow-up")).toBeVisible();
});
