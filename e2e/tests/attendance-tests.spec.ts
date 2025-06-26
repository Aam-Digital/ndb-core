import { expect, test } from "#e2e/fixtures.js";

test("Record attendance for one activity", async ({ page }) => {
  await page.getByRole("navigation").getByText("Attendance").click();
  await page.getByRole("button", { name: "Record" }).click();

  const dateField = page.getByLabel("Date");
  await expect(dateField).toHaveValue("1/23/2025");

  await dateField.fill("12/25/2024");
  await dateField.blur();

  // FIXME: A simple .click() does not trigger the action and we don’t know why.
  await page.getByText("Coaching Class 8E").dispatchEvent("click");

  await expect(
    page.getByRole("heading", { name: "Coaching Class 8E" }),
  ).toBeVisible();

  await page.addStyleTag({ content: "* { transition: none !important }" });

  await expect(page.getByText("1 / 3")).toBeVisible();
  await page.getByRole("button", { name: "Present" }).click();

  await expect(page.getByText("2 / 3")).toBeVisible();
  await page.getByRole("button", { name: "Absent" }).click();

  await expect(page.getByText("3 / 3")).toBeVisible();
  await page.getByRole("button", { name: "Late" }).click();

  await page.getByRole("button", { name: "Review Details" }).click();
  await page.getByLabel("status").fill("Status");

  const row = page.getByRole("row").filter({ hasText: "Atreyee Talwar" });
  await row.getByLabel("Present").click();
  await page.getByRole("option", { name: "Absent" }).click();
  await row.getByPlaceholder("Remarks").fill("CUSTOM REMARK");

  await page.getByRole("button", { name: "Save" }).click();

  await page.getByRole("navigation").getByText("Children").click();
  await page.getByRole("textbox", { name: "Filter" }).fill("Atreyee");
  await page.getByRole("cell", { name: "Atreyee Talwar" }).click();
  await page.getByRole("tab", { name: "Attendance" }).click();
  await page.getByRole("button", { name: "Choose month and year" }).click();
  await page.getByRole("button", { name: "2024" }).click();
  await page.getByRole("button", { name: "December" }).click();
  await page.getByRole("button", { name: "December 25," }).click();
  await expect(page.getByRole("textbox", { name: "Remarks" })).toHaveValue(
    "CUSTOM REMARK",
  );
  await expect(page.getByRole("combobox", { name: "Absent" })).toBeVisible();
});

test("View and download attendance report", async ({ page }) => {
  await page.getByRole("navigation").getByText("Reports").click();
  await page.getByRole("combobox", { name: "Select Report" }).click();
  await page.getByRole("option", { name: "Attendance Report" }).click();
  await page.getByRole("button", { name: "Open calendar" }).click();
  await page.getByRole("button", { name: "January 12," }).click();
  await page.getByRole("button", { name: "January 18," }).click();
  await page.getByRole("button", { name: "Calculate" }).click();

  // Verify the names , class , school , total , present , rate and late columns are visible
  await expect(page.getByRole("columnheader", { name: "Name" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Class" })).toBeVisible();
  await expect(
    page.getByRole("columnheader", { name: "School" }),
  ).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Total" })).toBeVisible();
  await expect(
    page.getByRole("columnheader", { name: "Present" }),
  ).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Rate" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Late" })).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "download csv Download" }).click();
  expect((await downloadPromise).suggestedFilename()).toMatch("report.csv");
});

test("View attendance percentage color in children list", async ({ page }) => {
  await page.getByRole("navigation").getByText("Children").click();

  await page.getByRole("tab", { name: "School Info" }).click();
  const CoachingAttendance = page
    .getByRole("columnheader", { name: "Attendance (School)" })
    .locator("app-entity-field-label");
  const rowCount = await CoachingAttendance.count();

  for (let i = 0; i < rowCount; i++) {
    const cell = CoachingAttendance.nth(i);

    // Get the percentage value as text
    const percentageText = await cell.textContent();
    const percentage = parseInt(
      percentageText?.replace("%", "").trim() || "0",
      10,
    );

    let expectedColor;
    if (percentage >= 80) {
      expectedColor = "rgb(144, 238, 144)"; // Green highlight
    } else if (percentage >= 60 && percentage < 80) {
      expectedColor = "rgb(255, 165, 0)"; // Orange highlight
    } else if (percentage < 60) {
      expectedColor = "rgb(255, 99, 71)"; // Red highlight
    }

    if (expectedColor) {
      // Verify the color of the cell
      const color = await cell.evaluate(
        (el) => window.getComputedStyle(el).backgroundColor,
      );
      expect(color).toBe(expectedColor);
    }
  }
});

test("Managing Attendance view and Recurring Activities list", async ({
  page,
}) => {
  await page.getByRole("navigation").getByText("Attendance").click();
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

  /*
      Navigate to "Manage Activities"
    */
  const manageActivitiesButton = page.getByRole("button", {
    name: "Manage Activities",
  });
  await expect(manageActivitiesButton).toBeVisible();
  await manageActivitiesButton.click();

  // Check navigation to "Manage Activities" page
  await expect(page).toHaveURL("/attendance/recurring-activity");
  await expect(
    page.getByRole("heading", { name: "Recurring Activities" }),
  ).toBeVisible();

  /*
      "Add New" button is visible for Recurring Activity
    */
  const addNewButton = page.getByRole("button", {
    name: "add elementAdd New",
  });
  await expect(addNewButton).toBeVisible();

  /*
      Verify table columns for Recurring Activities
    */
  await expect(page.locator("text=Title")).toBeVisible();
  await expect(page.locator("text=Type")).toBeVisible();
  await expect(page.locator("text=Assigned user(s)")).toBeVisible();

  // Verify pagination controls are visible
  await expect(page.locator("text=Items per page")).toBeVisible();

  // Verify "Include archived records" toggle
  const archivedRecordsToggle = page.locator("text=Include archived records");
  await expect(archivedRecordsToggle).toBeVisible();
});
