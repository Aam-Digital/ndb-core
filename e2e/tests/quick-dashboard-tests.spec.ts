import { test, expect } from "@playwright/test";

test('Quick Dashboard Tests', async ({ page }) => {
    await page.goto('http://localhost:4200/');

    await page.getByRole('cell', { name: 'Add Child' }).click();
    await expect(page).toHaveURL("http://localhost:4200/child/new");

    // Details to be captured and save
    await page.getByLabel('Name').fill('John Doe');
    await page.getByLabel('Project Number').fill('123');
    await page.getByLabel('Date of birth').fill('1/1/2025');

    await page.getByRole('button',{name: 'Save'}).click();

    // Ensure the other tabs are enabled
    await page.getByRole('tab', { name: 'Education', exact: true }).click();
    await page.getByRole('tab', { name: 'Attendance' }).click();
});