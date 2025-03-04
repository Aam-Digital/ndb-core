import { expect, test } from "@playwright/test";
import path from "path";
import { startApp } from "../utils/core-e2e-utils"; // Import the path module for file path operations

async function setFixedDate(page, fixedDate) {
  const fakeNow = new Date(fixedDate).valueOf(); // Convert the fixed date to a timestamp
  await page.addInitScript(`{
    Date = class extends Date {
      constructor(...args) {
        if (args.length === 0) {
          super(${fakeNow}); // Default to the fixed date
        } else {
          super(...args); // Handle explicitly provided dates
        }
      }
    }
    const __DateNowOffset = ${fakeNow} - Date.now(); // Offset for Date.now()
    const __DateNow = Date.now;
    Date.now = () => __DateNow() + __DateNowOffset; // Override Date.now()
  }`);
}

test.describe("Dashboard Page Tests", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    console.log(`Running test case - ${testInfo.title}`);

    // Set fixed date before navigating to the app
    await setFixedDate(page, "1/23/2025");

    await startApp(page);
  });

  // Verify the date field displays the current date
  test("Verify current date field displays correctly", async ({ page }) => {
    await page.getByRole("cell", { name: "Record Attendance" }).click();
    const fixedDate = new Date("1/23/2025");
    const formattedDateRegex = new RegExp(
      `${fixedDate.getMonth() + 1}/${fixedDate.getDate()}/${fixedDate.getFullYear()}|` +
        `${(fixedDate.getMonth() + 1).toString().padStart(2, "0")}/${fixedDate.getDate().toString().padStart(2, "0")}/${fixedDate.getFullYear()}`,
    );
    const dateField = page.getByLabel("Date");
    await expect(dateField).toHaveValue(formattedDateRegex);
  });

  test("Allow backdated editing for the date field", async ({ page }) => {
    await page.getByRole("cell", { name: "Record Attendance" }).click();
    const backdatedDate = "12/15/2024";
    const dateField = page.getByLabel("Date");
    await dateField.fill(backdatedDate);
    await expect(dateField).toHaveValue(backdatedDate);
  });

  test("Verify list of classes is displayed", async ({ page }) => {
    await page.getByRole("cell", { name: "Record Attendance" }).click();
    await page.waitForSelector("mat-card-header");
    const classList = page.locator("mat-card-header");
    const count = await classList.count();
    expect(count).toBeGreaterThan(0);
  });

  test("Mark attendance for participants dynamically", async ({ page }) => {
    await page.getByRole("cell", { name: "Record Attendance" }).click();
    const firstClass = page.locator("mat-card-header").first();
    await firstClass.evaluate((el: HTMLElement) => el?.click()); // Force the DOM click

    let totalParticipants = 0;

    const pageIndicator = page.locator("text=/\\d+\\s\\/\\s\\d+/"); // "1 / 5" pattern
    // Extract total participants from "x / y" format
    if (await pageIndicator.isVisible()) {
      const text = await pageIndicator.textContent();
      const match = text?.match(/(\d+)\s\/\s(\d+)/); // Extract current/total numbers
      if (match) {
        totalParticipants = parseInt(match[2]); // Total participants
      }
    }
    const ReviewDetailsBtn = page.getByRole("button", {
      name: "Review Details",
    });

    // Loop to mark attendance dynamically until the "Review Details" button is visible
    while (!(await ReviewDetailsBtn.isVisible())) {
      const randomIndex = Math.floor(Math.random() * 4); // Random index for attendance buttons
      const attendanceButton = page.getByRole("paragraph").nth(randomIndex);
      await attendanceButton.click();
      await page.waitForTimeout(1000); // Wait for the next participant to load
    }

    await expect(ReviewDetailsBtn).toBeVisible();
    await ReviewDetailsBtn.click();

    // Verify the status are editable and can be updated
    const EditStatusBtn = page
      .locator(
        "app-attendance-status-select > .mat-mdc-form-field > .mat-mdc-text-field-wrapper > .mat-mdc-form-field-flex",
      )
      .first();
    await EditStatusBtn.click();

    const statusOptions = page.getByText("Present Absent Late Excused");
    const randomIndex = Math.floor(
      Math.random() * (await statusOptions.count()),
    );
    const selectedStatus = statusOptions.nth(randomIndex);

    await selectedStatus.click();

    // Verify remarks are editable
    const RemarksField = page
      .locator("td:nth-child(4) > .mat-mdc-form-field input")
      .first();
    await RemarksField.fill("Remarks updated");

    await page.getByRole("button", { name: "Save" }).click();

    const BackOverviewBtn = page.getByRole("button", {
      name: "Back to Overview",
    });
    await expect(BackOverviewBtn).toBeVisible(); // "Back to Overview" button is visible
    await BackOverviewBtn.click(); // "Back to Overview" button is clickable

    // Verify the class just recorded attendance should be highlighted in green and all others in orange
    const classCard = page.locator("mat-card");
    const classCardCount = await classCard.count();
    for (let i = 0; i < classCardCount; i++) {
      const card = page.locator("mat-card").nth(i);

      // Extract the border color
      const borderColor = await card.evaluate(
        (el) => getComputedStyle(el).borderLeftColor,
      );

      if (i === 0) {
        expect(borderColor).toBe("rgb(76, 175, 80)"); // Green
      } else {
        expect(borderColor).toBe("rgb(255, 152, 0)"); // Orange
      }
    }
  });

  test("Verify attendance report generation", async ({ page }) => {
    await page.locator("mat-list-item").filter({ hasText: "Reports" }).click();
    await page
      .locator("div")
      .filter({ hasText: "Select Report" })
      .nth(4)
      .click();
    await page.getByRole("option", { name: "Attendance Report" }).click();
    await page.getByLabel("Open calendar").click();

    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), 2);
    const endDate = new Date(today.getFullYear(), today.getMonth(), 22);

    const formatDateLabel = (date) =>
      date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });

    const startDateLabel = formatDateLabel(startDate); // e.g., "January 2, 2025"
    const endDateLabel = formatDateLabel(endDate); // e.g., "January 22, 2025"

    // Click the start date
    // await page.locator(`[aria-label="${startDateLabel}"]`).click();

    // // Click the end date
    // await page.locator(`[aria-label="${endDateLabel}"]`).click();

    // await page.getByRole("button", { name: "Calculate" }).click();

    // Verify the names , class , school , total , present , rate and late columns are visible
    await expect(
      page.getByRole("columnheader", { name: "Name" }),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Class" }),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "School" }),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Total" }),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Present" }),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Rate" }),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Late" }),
    ).toBeVisible();

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "download csv Download" }).click(),
    ]);
    const downloadPath = path.resolve(__dirname, "downloads");
    const filePath = path.join(
      downloadPath,
      await download.suggestedFilename(),
    );
    await download.saveAs(filePath);

    // Verify the file type and name
    expect(filePath).toMatch(/\.csv$/); // Ensure the file is a .csv
  });

  test("Verify attendance percentage color coding", async ({ page }) => {
    await page.locator("mat-list-item").filter({ hasText: "Children" }).click();
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

  test("Dashboard View", async ({ page }) => {
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
      const noEntriesMessage = await page.locator('text="no current entries"');
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
      const noEntriesMessage = await page.locator('text="no current entries"');
      await expect(noEntriesMessage).toBeVisible();
    }
  });
});
