import { expect, test } from "#e2e/fixtures.ts";

test("Dashboard widgets and actions", async ({ page }) => {
  await expect(page.getByText("Quick Actions")).toBeVisible();
  await page.getByRole("button", { name: "Record attendance" }).click();

  await expect(
    page.getByRole("heading", { name: "Record Attendance" }),
  ).toBeVisible();
  await page.goBack();

  await expect(page.getByText("108 Children")).toBeVisible();
  await expect(page.getByText("Tasks due")).toBeVisible();
  await expect(page.getByText("52 Notes needing follow-up")).toBeVisible();
});
