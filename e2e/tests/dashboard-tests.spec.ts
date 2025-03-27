import { expect, test } from "@playwright/test";
import { startApp } from "../utils/core-e2e-utils";
import { setFixedDate } from "../utils/fixed-date";

test.describe("Dashboard Module", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    console.log(`Running test case - ${testInfo.title}`);

    // Set fixed date before navigating to the app
    await setFixedDate(page, "1/1/2025");

    await startApp(page);

    await page.goto("/");
  });

  test("Dashboard widgets and actions", async ({ page }) => {
    /*
      Verify Quick Actions widget
    */
    const quickActionsElement = page.locator("text=Quick actions");
    await expect(quickActionsElement).toBeVisible();

    // Verify "Record Attendance" button in Quick Actions
    const recordAttendanceButton = page.getByRole("cell", {
      name: "Record Attendance",
    });
    await expect(recordAttendanceButton).toBeVisible();

    await recordAttendanceButton.click();
    // Check navigation to "Record Attendance" page
    await expect(page).toHaveURL("/attendance/add-day");
    await page.goBack();

    /*
      Verify children count is displayed
    */
    const childrenCount = page.locator("app-entity-count-dashboard-widget");
    await expect(childrenCount).toContainText(/107/);

    /*
      Verify Tasks Due widget and tasks
    */
    const tasksDueElement = page.getByText("Tasks due");
    await expect(tasksDueElement).toBeVisible();

    // Verify at least one task is listed
    const taskElements = page.locator("app-widget-content");
    const taskCount = await taskElements.count();
    expect(taskCount).toBeGreaterThan(0);
  });

  test("Attendance navigation menu entry", async ({ page }) => {
    await page
      .locator("mat-list-item")
      .filter({ hasText: "Attendance" })
      .click();
    const recordButton = page.getByRole("button", { name: "Record" });
    await expect(recordButton).toBeVisible();
    await recordButton.click();

    // Check navigation to "Record Attendance" page
    await expect(page).toHaveURL("/attendance/add-day");
    await expect(
      page.getByRole("heading", { name: "Record Attendance" }),
    ).toBeVisible();
  });
});
