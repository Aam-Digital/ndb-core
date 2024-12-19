import { test, expect } from '@playwright/test';

test.describe.configure({ timeout: 120000 });

test('test', async ({ page }) => {
  await page.goto('http://localhost:4200/');
  await page.getByRole('cell', { name: 'Record Attendance' }).click();

  // Verify the date field displays the current date
  const currentDate = new Date();
  const formattedDate = `${(currentDate.getMonth() + 1).toString().padStart(2, '0')}/` +
                      `${currentDate.getDate().toString().padStart(2, '0')}/` +
                      `${currentDate.getFullYear()}`;
  const dateField = page.getByLabel('Date')
  await expect(dateField).toHaveValue(formattedDate);
  
  // Verify backdated editing is allowed
  const backdatedDate = '12/15/2024';
  await dateField.fill(backdatedDate);
  await expect(dateField).toHaveValue(backdatedDate);

  // Verify list of classes is displayed
  const classList = page.locator('mat-card-header'); 
  const count = await classList.count(); 

  expect(count).toBeGreaterThan(0);

  const firstClass = page.locator('mat-card-header').first();
  await firstClass.evaluate((el: HTMLElement) => el?.click()); // Force the DOM click
  
  let totalParticipants = 0;

  const pageIndicator = page.locator('text=/\\d+\\s\\/\\s\\d+/'); // "1 / 5" pattern
  // Extract total participants from "x / y" format
  if (await pageIndicator.isVisible()) {
    const text = await pageIndicator.textContent();
    const match = text?.match(/(\d+)\s\/\s(\d+)/); // Extract current/total numbers
    if (match) {
      totalParticipants = parseInt(match[2]); // Total participants
    }
  }

  // Iterate through participants and mark attendance till the "Review Details" button is visible
  const ReviewDetailsBtn = page.getByRole('button', { name: 'Review Details' });

  // Loop to mark attendance dynamically until the "Review Details" button is visible
  while (!(await ReviewDetailsBtn.isVisible())) {
    // Randomly select an attendance option using the respective locators
    const randomIndex = Math.floor(Math.random() * 4); // Randomly select index 0 to 3
    const attendanceButton = page.getByRole('paragraph').nth(randomIndex);

    // Ensure the selected button is visible and enabled
    await expect(attendanceButton).toBeVisible();
    await expect(attendanceButton).toBeEnabled();

    // Click the selected attendance button
    await attendanceButton.click();

    // Wait for the next participant to load
    await page.waitForTimeout(1000); 
  }

  // Verify the "Review Details" button is visible and click it
  await expect(ReviewDetailsBtn).toBeVisible();
  await ReviewDetailsBtn.click();
  
  // Verify the status are editable and can be updated
  const EditStatusBtn = page.locator('app-attendance-status-select > .mat-mdc-form-field > .mat-mdc-text-field-wrapper > .mat-mdc-form-field-flex').first();
  await expect(EditStatusBtn).toBeVisible();
  await EditStatusBtn.click();

  const UpdateStatus = page.getByRole('option', { name: 'Present' });
  await expect(UpdateStatus).toBeVisible();
  await UpdateStatus.click();

  // Verify remarks are editable
  const RemarksField = page.locator('td:nth-child(4) > .mat-mdc-form-field input').first();
  await expect(RemarksField).toBeVisible();
  await RemarksField.click();
  await RemarksField.fill('Remarks updated');
  
  // Verify the details are saved
  await page.getByRole('button', { name: 'Save' }).click();

  const BackOverviewBtn = page.getByRole('button', { name: 'Back to Overview' });
  await expect(BackOverviewBtn).toBeVisible(); // "Back to Overview" button is visible 
  await BackOverviewBtn.click(); // "Back to Overview" button is clickable

  await page.getByRole('button', { name: 'Show more' }).click();

  // Verify the class just recorded attendance should be highlighted in green and all others in orange
  const classCard = page.locator('mat-card');
  const classCardCount = await classCard.count();
  for (let i = 0; i < classCardCount; i++) {
    const card = page.locator('mat-card').nth(i);
  
    // Extract the border color
    const borderColor = await card.evaluate((el) => getComputedStyle(el).borderLeftColor);
  
    if (i === 0) {
      expect(borderColor).toBe('rgb(76, 175, 80)'); // Green
    } else {
      expect(borderColor).toBe('rgb(255, 152, 0)'); // Orange
    }
  }
});
