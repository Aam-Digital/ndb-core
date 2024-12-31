import { test, expect } from "@playwright/test";

test.describe("Dashboard Tests", () => {
  test('test', async ({ page }) => {
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

    // Verify that the "Tasks due" widget is visible and display task
    await page.waitForSelector("text=Tasks due");
  
    // Check that the "Tasks due" widget is visible
    const tasksDueElement = page.locator("text=Tasks due");
    await expect(tasksDueElement).toBeVisible();
  
    // Locate task names and due dates dynamically
    const taskElements = page.locator("app-widget-content");
    
    // Ensure at least one task is listed
    const taskCount = await taskElements.count();
      expect(taskCount).toBeGreaterThan(0);

    // Should navigate to the attendance page
    await page.locator('mat-list-item').filter({ hasText: 'Attendance' }).click();  
     // Check if the URL contains "attendance"
    await expect(page).toHaveURL(/.*attendance/);

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
    await page.goBack(); 
    
    // Navigate to "Recurring Activities" page and verify elements
    await page.getByRole('button', { name: 'Manage Activities' }).click();

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

    // Verify pagination controls are visible
    await expect(page.locator("text=Items per page")).toBeVisible();

    // Verify "Include archived records" toggle
    const archivedRecordsToggle = page.locator("text=Include archived records");
    await expect(archivedRecordsToggle).toBeVisible();
});
});

