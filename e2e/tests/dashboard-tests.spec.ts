import { expect, test } from "#e2e/fixtures.ts";

test.describe("Dashboard Module", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("Dashboard widgets and actions", async ({ page }) => {
    /*
      Verify Quick Actions widget
    */
    await expect(page.getByText("Quick Actions")).toBeVisible();

    // Verify "Record Attendance" button in Quick Actions
    const recordAttendanceButton = page.getByRole("cell", {
      name: "Record Attendance",
    });
    await expect(recordAttendanceButton).toBeVisible();

    await recordAttendanceButton.click();
    // Check navigation to "Record Attendance" page
    await expect(page).toHaveURL("/attendance/add-day");
    await expect(
      page.getByRole("heading", { name: "Record Attendance" }),
    ).toBeVisible();
    await page.goBack();

    await expect(page.getByText("108 Children")).toBeVisible();

    const tasksDueElement = page.getByText("Tasks due");
    await expect(tasksDueElement).toBeVisible();

    await expect(page.getByText("52 Notes needing follow-up")).toBeVisible();
  });
});
