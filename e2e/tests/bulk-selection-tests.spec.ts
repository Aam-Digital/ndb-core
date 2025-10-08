import { range } from "lodash-es";
import { expect, loadApp, test } from "#e2e/fixtures.js";
import { generateUsers } from "#src/app/core/user/demo-user-generator.service.js";
import { generateChild } from "#src/app/child-dev-project/children/demo-data-generators/demo-child-generator.service.js";

test.describe("Bulk selection with sorting", () => {
  test.beforeEach(async ({ page }) => {
    // Generate demo data
    const users = generateUsers();
    const children = range(10).map(() => generateChild());

    // Load the app with demo data
    await loadApp(page, [...users, ...children]);

    // Navigate to the children list page
    await page.getByRole("navigation").getByText("Children").click();
    await page.waitForLoadState("networkidle");
  });

  test("Bulk selection range with sorting by shift-click rows", async ({
    page,
  }) => {
    await expect(page.locator("app-entities-table")).toBeVisible();

    await page.locator("button[mat-icon-button][color='primary']").click();
    await page
      .getByRole("menuitem", { name: "bulk actions Bulk Actions" })
      .click();
    await expect(
      page.locator("app-entities-table mat-checkbox").first(),
    ).toBeVisible();

    // First, test with default sort order (should work)
    const firstRow = page.locator("app-entities-table tbody tr").first();
    const thirdRow = page.locator("app-entities-table tbody tr").nth(2);

    // Click first row to select it
    await firstRow.click();
    await expect(firstRow.locator("mat-checkbox input")).toBeChecked();

    // Shift-click third row to select range
    await thirdRow.click({ modifiers: ["Shift"] });

    // Verify that first three rows are selected
    for (let i = 0; i < 3; i++) {
      await expect(
        page
          .locator("app-entities-table tbody tr")
          .nth(i)
          .locator("mat-checkbox input"),
      ).toBeChecked();
    }

    // Clear selected rows
    await page.locator("app-entities-table mat-checkbox").first().click();
    await page.locator("app-entities-table mat-checkbox").first().click();

    // Now test with changed sort order
    // Click on a sortable column header (like "name")
    await page
      .locator("app-entities-table th")
      .filter({ hasText: "Name" })
      .click();

    // Wait for sort to apply
    await page.waitForTimeout(500);

    // Try the same selection pattern after sorting
    await firstRow.click();
    await expect(firstRow.locator("mat-checkbox input")).toBeChecked();

    // Shift-click third row to select range
    await thirdRow.click({ modifiers: ["Shift"] });

    // Verify that first three rows are selected (this should work after our fix)
    for (let i = 0; i < 3; i++) {
      await expect(
        page
          .locator("app-entities-table tbody tr")
          .nth(i)
          .locator("mat-checkbox input"),
      ).toBeChecked();
    }
  });
});
