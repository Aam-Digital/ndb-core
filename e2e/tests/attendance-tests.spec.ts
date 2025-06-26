import { argosScreenshot, expect, test } from "#e2e/fixtures.js";

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

test("Children list displays monthly attendance percentage", async ({
  page,
}) => {
  await page.getByRole("navigation").getByText("Children").click();
  await page.getByRole("tab", { name: "School Info" }).click();
  await expect(page.getByRole("cell", { name: /\d+%/ })).toHaveCount(10);
  await argosScreenshot(page, "children-school-info");
});

test("Attendance Dashboard View", async ({ page }) => {
  // Wait for the element containing "Absences this week" text to appear
  await page.waitForSelector("text=Absences this week");

  const absencesThisWeek = page.getByText("Absences this week");
  // Assert that the element is visible
  await expect(absencesThisWeek).toBeVisible();

  const absentStudent = page.locator("app-widget-content");
  // Count the number of absent students
  const absentCount = await absentStudent.count();

  if (absentCount > 0) {
    // If there are absent students, assert that the count is greater than 0
    expect(absentCount).toBeGreaterThan(0);

    // Loop through each absent student element
    for (let i = 0; i < absentCount; i++) {
      const student = absentStudent.nth(i);
      // Assert that the student element is visible
      await expect(student).toBeVisible();

      // Get all elements representing days the student was absent
      const daysAbsent = student.locator(
        "app-attendance-day-block > .mat-mdc-tooltip-trigger",
      );
      // Count the number of absent days
      const daysCount = await daysAbsent.count();

      // Loop through each absent day element
      for (let j = 0; j < daysCount; j++) {
        const day = daysAbsent.nth(j);
        // Assert that the absent day element is visible
        await expect(day).toBeVisible();
      }
    }
  } else {
    // If there are no absent students, assert that the "no current entries" message is visible
    const noEntriesMessage = page.locator('text="no current entries"');
    await expect(noEntriesMessage).toBeVisible();
  }
  //Verify for the absences last week
  await page.waitForSelector("text=Absences last week");

  // Get the element containing "Absences last week" text
  const absencesLastWeek = page.getByText("Absences last week");
  // Assert that the element is visible
  await expect(absencesLastWeek).toBeVisible();

  // Get all elements representing absent students
  const AbsentStudent = page.locator("app-widget-content");
  // Count the number of absent students
  const AbsentCount = await AbsentStudent.count();

  if (AbsentCount > 0) {
    // If there are absent students, assert that the count is greater than 0
    expect(AbsentCount).toBeGreaterThan(0);

    // Loop through each absent student element
    for (let i = 0; i < AbsentCount; i++) {
      const student = AbsentStudent.nth(i);
      // Assert that the student element is visible
      await expect(student).toBeVisible();

      // Get all elements representing days the student was absent
      const daysAbsent = student
        .locator(
          "app-attendance-week-dashboard:nth-child(8) > app-dashboard-list-widget > app-dashboard-widget > .widget-content > app-widget-content > .table-wrapper > .mat-mdc-table > .mdc-data-table__content > tr > td:nth-child(2) > .activities-record > app-attendance-day-block:nth-child(2) > .mat-mdc-tooltip-trigger",
        )
        .first();

      // Assert that the absent day element is visible
      const daysCount = await daysAbsent.count();

      // Loop through each absent day element
      for (let j = 0; j < daysCount; j++) {
        const day = daysAbsent.nth(j);
        // Assert that the absent day element is visible
        await expect(day).toBeVisible();
      }
    }
  } else {
    // If there are no absent students, assert that the "no current entries" message is visible
    const noEntriesMessage = page.locator('text="no current entries"');
    await expect(noEntriesMessage).toBeVisible();
  }
});

test("Recurring activities list", async ({ page }) => {
  await page.getByRole("navigation").getByText("Attendance").click();
  await page
    .getByRole("button", {
      name: "Manage Activities",
    })
    .click();
  await expect(
    page.getByRole("heading", { name: "Recurring Activities" }),
  ).toBeVisible();
  await expect(page.getByRole("row")).toHaveCount(10);
  await argosScreenshot(page, "recurring-activities-list");
});
