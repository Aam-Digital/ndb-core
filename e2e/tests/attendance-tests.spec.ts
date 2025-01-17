import { test, expect } from '@playwright/test';

test.describe.configure({ timeout: 120000 });

test.use({ storageState: 'storageState.json' }); // Use shared state from global setup

test.describe('Attendance Tests', () => {
  async function navigateToAttendancePage(page) {
    await page.goto('http://localhost:4200/');
    await page.getByRole('cell', { name: 'Record Attendance' }).click();
  }

  async function verifyDateField(page) {
    const currentDate = new Date();
    const formattedDateRegex = new RegExp(
      `${currentDate.getMonth() + 1}/${currentDate.getDate()}/${currentDate.getFullYear()}|` +
      `${(currentDate.getMonth() + 1).toString().padStart(2, '0')}/${currentDate.getDate().toString().padStart(2, '0')}/${currentDate.getFullYear()}`
    );
    const dateField = page.getByLabel('Date');
    await expect(dateField).toHaveValue(formattedDateRegex);

    const backdatedDate = '12/15/2024';
    await dateField.fill(backdatedDate);
    await expect(dateField).toHaveValue(backdatedDate);
  }

  async function verifyClassList(page) {
    const classList = page.locator('mat-card-header');
    const count = await classList.count();
    expect(count).toBeGreaterThan(0);

    const firstClass = classList.first();
    await firstClass.click();
    return firstClass;
  }

  async function markAttendance(page) {
    const ReviewDetailsBtn = page.getByRole('button', { name: 'Review Details' });

    while (!(await ReviewDetailsBtn.isVisible())) {
      const randomIndex = Math.floor(Math.random() * 4); // Randomly select an option
      const attendanceButton = page.getByRole('paragraph').nth(randomIndex);
      await expect(attendanceButton).toBeVisible();
      await attendanceButton.click();
      await page.waitForTimeout(1000);
    }

    await expect(ReviewDetailsBtn).toBeVisible();
    await ReviewDetailsBtn.click();
  }

  async function verifyAndEditDetails(page) {
    const EditStatusBtn = page.locator('app-attendance-status-select > .mat-mdc-form-field').first();
    await expect(EditStatusBtn).toBeVisible();
    await EditStatusBtn.click();

    const statusOptions = page.getByText('Present Absent Late Excused');
    const randomIndex = Math.floor(Math.random() * (await statusOptions.count()));
    const selectedStatus = statusOptions.nth(randomIndex);
    await selectedStatus.click();

    const RemarksField = page.locator('td:nth-child(4) > .mat-mdc-form-field input').first();
    await RemarksField.fill('Remarks updated');

    await page.getByRole('button', { name: 'Save' }).click();
  }

  async function verifyClassHighlights(page) {
    const classCard = page.locator('mat-card');
    const classCardCount = await classCard.count();

    for (let i = 0; i < classCardCount; i++) {
      const card = classCard.nth(i);
      const borderColor = await card.evaluate((el) => getComputedStyle(el).borderLeftColor);

      if (i === 0) {
        expect(borderColor).toBe('rgb(76, 175, 80)'); // Green
      } else {
        expect(borderColor).toBe('rgb(255, 152, 0)'); // Orange
      }
    }
  }

  async function verifyAttendanceReport(page, studentName) {
    await page.locator('mat-list-item').filter({ hasText: 'Reports' }).click();
    await page.locator('div').filter({ hasText: 'Select Report' }).nth(4).click();
    await page.getByRole('option', { name: 'Attendance Report' }).click();

    await page.getByLabel('Open calendar').click();
    await page.getByLabel('January 2,').click();
    await page.getByLabel('January 15,').click();
    await page.getByRole('button', { name: 'Calculate' }).click();

    await expect(page.getByRole('columnheader', { name: 'Name' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Class' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'School' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Total' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Present' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Rate' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Late' })).toBeVisible();
  }

  async function verifyAttendancePercentageHighlights(page) {
    const CoachingAttendance = page.getByRole('columnheader', { name: 'Attendance (Coaching)' }).locator('app-entity-field-label');
    const rowCount = await CoachingAttendance.count();

    for (let i = 0; i < rowCount; i++) {
      const cell = CoachingAttendance.nth(i);
      const percentageText = await cell.textContent();
      const percentage = parseInt(percentageText?.replace('%', '').trim() || '0', 10);

      const color = await cell.evaluate((el) => window.getComputedStyle(el).backgroundColor);
      if (percentage >= 80) {
        expect(color).toBe('rgb(144, 238, 144)'); // Green
      } else if (percentage >= 60 && percentage < 80) {
        expect(color).toBe('rgb(255, 165, 0)'); // Orange
      } else {
        expect(color).toBe('rgb(255, 99, 71)'); // Red
      }
    }
  }

  test('Complete Attendance Workflow', async ({ page }) => {
    await navigateToAttendancePage(page);
    await verifyDateField(page);

    const firstClass = await verifyClassList(page);
    await markAttendance(page);
    await verifyAndEditDetails(page);
    await verifyClassHighlights(page);

    const firstStudentName = await firstClass.textContent();
    await verifyAttendanceReport(page, firstStudentName || '');
    await verifyAttendancePercentageHighlights(page);
  });
});
