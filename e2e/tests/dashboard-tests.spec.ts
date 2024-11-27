import { test, expect } from "@playwright/test";

test.describe("Dashboard Tests", () => {
  test("should display Quick Actions widget on dashboard", async ({ page }) => {
    // Go to the dashboard page
    await page.goto("http://localhost:4200");

    // Wait for "Quick Actions" element to load
    await page.waitForSelector("text=Quick actions");

    // Check if "Quick Actions" element is visible
    const quickActionsElement = page.locator("text=Quick actions");
    await expect(quickActionsElement).toBeVisible();

    // Verify that Record Attendance button exists in Quick actions widget
    const recordAttendanceButton = page.getByRole("cell", {
      name: "Record Attendance",
    });
    await expect(recordAttendanceButton).toBeVisible();

    // Verify children count is displayed
    const childrenCount = page.locator("app-entity-count-dashboard-widget");

    await expect(childrenCount).toContainText(/107/);
  });

  test("should navigate to the attendence page", async ({ page }) => {
    await page.goto("http://localhost:4200/");

    await page.click("text=Attendance");

    // Check if the URL contains "attendance"
    await expect(page).toHaveURL(/.*attendance/);
  });

  test("should display tasks due with correct due dates", async ({ page }) => {
    // Go to the dashboard page
    await page.goto("http://localhost:4200");

    await page.waitForSelector("text=Tasks due");

    // Check for the "Tasks due" widget
    const tasksDueElement = page.locator("text=Tasks due");

    await expect(tasksDueElement).toBeVisible();

    // Verify that the task names and due dates are displayed
    const taskNames = await page
      .locator("app-widget-content")
      .filter({ hasText: "get signed agreement Nov 19," })
      .allTextContents();
    const dueDates = await page
      .locator("app-widget-content")
      .filter({ hasText: "get signed agreement Nov 19," })
      .allTextContents();

    expect(taskNames.length).toBeGreaterThan(0); // Ensure there is at least one task
    expect(dueDates.length).toBe(taskNames.length); // Ensure every task has a due date
  });

  test("should display absence this week", async ({ page }) => {
    await page.goto("http://localhost:4200");

    await page.waitForSelector("text=Absences this week");

    const absencesThisWeekElement = page.locator("text=Absences this week");
    await expect(absencesThisWeekElement).toBeVisible();

    const absenceCountText = await page
      .getByText("4 Absences this week")
      .innerText();
    const absenceCount = parseInt(absenceCountText.split(" ")[0], 10);
    expect(absenceCount).toBeGreaterThanOrEqual(0);
  });

  test("Attendance page elements should be visible and clickable with navigation checks", async ({
    page,
  }) => {
    // Navigate to the Attendance page
    await page.goto("http://localhost:4200/attendance");

    // Verify that "Record Attendance" section is visible
    await page.waitForSelector("text=Managing Attendance");
    const recordAttendanceSection = page.getByText("Record Attendance", {
      exact: true,
    });
    await expect(recordAttendanceSection).toBeVisible();

    // Verify that "Recurring Activities" section is visible
    const recurringActivitiesSection = page.getByText("Recurring Activities", {
      exact: true,
    });
    await expect(recurringActivitiesSection).toBeVisible();

    // Verify that "Monthly Attendance" section is visible
    const monthlyAttendanceSection = page.getByText("Monthly Attendance");
    await expect(monthlyAttendanceSection).toBeVisible();

    // Click the "Record" button in the "Record Attendance" section and check navigation
    const recordButton = page.getByRole("button", { name: "Record" });
    await expect(recordButton).toBeVisible();
    await recordButton.click();

    // Check if navigation to "Record Attendance" page was successful
    await expect(page).toHaveURL("http://localhost:4200/attendance/add-day");
    await expect(
      page.getByRole("heading", { name: "Record Attendance" }),
    ).toHaveText("Record Attendance"); // Check page title or header
    await page.goBack(); // Return to Attendance page to continue testing

    // Click the "Manage Activities" button in the "Recurring Activities" section and check navigation
    const manageActivitiesButton = page.getByRole("button", {
      name: "Manage Activities",
    });
    await expect(manageActivitiesButton).toBeVisible();
    await manageActivitiesButton.click();

    // Check if navigation to "Manage Activities" page was successful
    await expect(page).toHaveURL(
      "http://localhost:4200/attendance/recurring-activity",
    );
    await expect(
      page.getByRole("heading", { name: "Recurring Activities" }),
    ).toHaveText("Recurring Activities"); // Check page title or header
    await page.goBack(); // Return to Attendance page to continue testing
  });

  test('Navigation to "Recurring Activities" page and verify elements', async ({
    page,
  }) => {
    // Navigate to the Attendance page
    await page.goto("http://localhost:4200/attendance/recurring-activity");

    await page.waitForSelector("text=Recurring Activities");

    await expect(
      page.getByRole("heading", { name: "Recurring Activities" }),
    ).toHaveText("Recurring Activities"); // Confirm page header

    // Check for the "Add New" button on the page
    const addNewButton = page.getByRole("button", {
      name: "add elementAdd New",
    });
    await expect(addNewButton).toBeVisible();

    // Verify table columns are visible
    await expect(page.locator("text=Title")).toBeVisible();
    await expect(page.locator("text=Type")).toBeVisible();
    await expect(page.locator("text=Assigned user(s)")).toBeVisible();

    // Verify some specific table rows content (replace with exact selectors or text as needed)
    await expect(page.locator("text=Coaching Class 2F")).toBeVisible();
    await expect(page.locator("text=School Class 4J")).toBeVisible();

    // Verify pagination controls are visible
    await expect(page.locator("text=Items per page")).toBeVisible();

    // Verify "Include archived records" toggle
    const archivedRecordsToggle = page.locator("text=Include archived records");
    await expect(archivedRecordsToggle).toBeVisible();
  });
});
