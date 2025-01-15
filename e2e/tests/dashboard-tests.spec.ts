import { test, expect } from "@playwright/test";

test.describe.configure({ timeout: 120000 });

test.describe('Attendance Page Tests', () => {
  test.beforeAll(async ({ page }) => {
    await page.goto('http://localhost:4200/');
    await page.waitForSelector("text=Database up-to-date");

  });

  test("Verify Quick Actions widget", async ({ page }) => {
    // Check "Quick Actions" widget is visible
     await page.waitForSelector("text=Quick actions");
    const quickActionsElement = page.locator("text=Quick actions");
    await expect(quickActionsElement).toBeVisible();

    // Verify "Record Attendance" button in Quick Actions
    const recordAttendanceButton = page.getByRole("cell", {
      name: "Record Attendance",
    });
    await expect(recordAttendanceButton).toBeVisible();
  });

  test("Verify children count is displayed", async ({ page }) => {
    const childrenCount = page.locator("app-entity-count-dashboard-widget");
    await expect(childrenCount).toContainText(/107/);
  });

  test("Verify Tasks Due widget and tasks", async ({ page }) => {
    // Check "Tasks Due" widget is visible
    const tasksDueElement = page.locator("text=Tasks due");
    await expect(tasksDueElement).toBeVisible();

    // Verify at least one task is listed
    const taskElements = page.locator("app-widget-content");
    const taskCount = await taskElements.count();
    expect(taskCount).toBeGreaterThan(0);
  });

  test("Navigate to Attendance page and verify sections", async ({ page }) => {
    // Navigate to the Attendance page
    await page.locator("mat-list-item").filter({ hasText: "Attendance" }).click();
    await expect(page).toHaveURL(/.*attendance/);

    // Verify "Record Attendance" section
    const recordAttendanceSection = page.getByText("Record Attendance", {
      exact: true,
    });
    await expect(recordAttendanceSection).toBeVisible();

    // Verify "Recurring Activities" section
    const recurringActivitiesSection = page.getByText("Recurring Activities", {
      exact: true,
    });
    await expect(recurringActivitiesSection).toBeVisible();

    // Verify "Monthly Attendance" section
    const monthlyAttendanceSection = page.getByText("Monthly Attendance");
    await expect(monthlyAttendanceSection).toBeVisible();
  });

  test("Record Attendance button navigation", async ({ page }) => {
    const recordButton = page.getByRole("button", { name: "Record" });
    await expect(recordButton).toBeVisible();
    await recordButton.click();

    // Check navigation to "Record Attendance" page
    await expect(page).toHaveURL("http://localhost:4200/attendance/add-day");
    await expect(page.getByRole("heading", { name: "Record Attendance" })).toBeVisible();
    await page.goBack();
  });

  test("Manage Activities button navigation", async ({ page }) => {
    const manageActivitiesButton = page.getByRole("button", { name: "Manage Activities" });
    await expect(manageActivitiesButton).toBeVisible();
    await manageActivitiesButton.click();

    // Check navigation to "Manage Activities" page
    await expect(page).toHaveURL("http://localhost:4200/attendance/recurring-activity");
    await expect(page.getByRole("heading", { name: "Recurring Activities" })).toBeVisible();
    await page.goBack();
  });

  test("Recurring Activities page elements", async ({ page }) => {
    // Navigate to Recurring Activities page
    await page.getByRole("button", { name: "Manage Activities" }).click();
    await expect(page.getByRole("heading", { name: "Recurring Activities" })).toBeVisible();

    // Verify "Add New" button is visible
    const addNewButton = page.getByRole("button", {
      name: "add elementAdd New",
    });
    await expect(addNewButton).toBeVisible();

    // Verify table columns are visible
    await expect(page.locator("text=Title")).toBeVisible();
    await expect(page.locator("text=Type")).toBeVisible();
    await expect(page.locator("text=Assigned user(s)")).toBeVisible();

    // Verify pagination controls are visible
    await expect(page.locator("text=Items per page")).toBeVisible();

    // Verify "Include archived records" toggle
    const archivedRecordsToggle = page.locator("text=Include archived records");
    await expect(archivedRecordsToggle).toBeVisible();
  });
});
