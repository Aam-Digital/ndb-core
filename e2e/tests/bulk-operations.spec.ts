import { range } from "lodash-es";

import { argosScreenshot, expect, loadApp, test } from "#e2e/fixtures.js";
import { generateUsers } from "#src/app/core/user/demo-user-generator.service.js";
import { generateChild } from "#src/app/child-dev-project/children/demo-data-generators/demo-child-generator.service.js";

const NEW_PROJECT_NUMBER = "BE-EDITED-001";

test("Bulk-edit a field across selected records", async ({ page }) => {
  const users = generateUsers();
  const c1 = generateChild({ name: "BulkEdit Child A" });
  const c2 = generateChild({ name: "BulkEdit Child B" });
  const c3 = generateChild({ name: "BulkEdit Child C" });

  await loadApp(page, [...users, c1, c2, c3]);

  await page.getByRole("navigation").getByText("Children").click();

  // Enter bulk-actions mode.
  await page.locator("button[mat-icon-button][color='primary']").click();
  await page
    .getByRole("menuitem", { name: "bulk actions Bulk Actions" })
    .click();

  // Select all three rows.
  for (const name of [
    "BulkEdit Child A",
    "BulkEdit Child B",
    "BulkEdit Child C",
  ]) {
    await page
      .locator("app-entities-table tbody tr")
      .filter({ hasText: name })
      .click();
  }

  // Open the bulk action dropdown and pick "Bulk Edit".
  await page
    .locator("app-entity-bulk-actions")
    .locator("input")
    .first()
    .click();
  await page.getByRole("option", { name: "Bulk Edit" }).click();

  // Bulk-edit dialog opens — pick the "Phone" property to update.
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  await dialog
    .locator("mat-form-field")
    .filter({ hasText: "Property to update" })
    .locator("input")
    .first()
    .click();
  await page.getByRole("option", { name: "Project Number" }).click();

  // The value form for the selected field appears — fill the new value.
  await dialog
    .locator("#entity-field__projectNumber")
    .getByRole("textbox")
    .fill(NEW_PROJECT_NUMBER);

  await argosScreenshot(page, "bulk-edit-dialog");

  await dialog.getByRole("button", { name: "Save" }).click();
  await expect(dialog).not.toBeVisible();

  // All three children now show the new Project Number in the list.
  await expect(page.locator("app-entities-table tbody tr")).toHaveCount(3, {
    timeout: 10_000,
  });

  // Open one of the edited children to verify the new value persisted.
  await page.getByRole("cell", { name: "BulkEdit Child A" }).click();
  await expect(
    page.locator("#entity-field__projectNumber").getByRole("textbox"),
  ).toHaveValue(NEW_PROJECT_NUMBER);
});

const CHILD_A_NAME = "<MERGE CHILD A>";
const CHILD_B_NAME = "<MERGE CHILD B>";

test("Bulk-merge two records combines them into one", async ({ page }) => {
  const users = generateUsers();
  const childA = generateChild({ name: CHILD_A_NAME });
  const childB = generateChild({ name: CHILD_B_NAME });

  await loadApp(page, [...users, childA, childB]);

  await page.getByRole("navigation").getByText("Children").click();

  // Enter bulk-actions mode via the list's "additional actions" menu.
  await page.locator("button[mat-icon-button][color='primary']").click();
  await page
    .getByRole("menuitem", { name: "bulk actions Bulk Actions" })
    .click();

  // Selection checkboxes are now visible. Click both target rows.
  await page
    .locator("app-entities-table tbody tr")
    .filter({ hasText: CHILD_A_NAME })
    .click();
  await page
    .locator("app-entities-table tbody tr")
    .filter({ hasText: CHILD_B_NAME })
    .click();

  // Open the bulk action dropdown and pick "Merge".
  await page
    .locator("app-entity-bulk-actions")
    .locator("input")
    .first()
    .click();
  await page.getByRole("option", { name: "Merge" }).click();

  // The merge preview dialog opens.
  const mergeDialog = page.getByRole("dialog");
  await expect(mergeDialog.getByText("Merge Preview")).toBeVisible();
  await argosScreenshot(page, "bulk-merge-dialog");

  // Confirm the merge.
  await mergeDialog.getByRole("button", { name: "Merge", exact: true }).click();

  // Confirmation dialog "Are you sure you want to merge this?" appears.
  const confirmDialog = page.getByRole("dialog");
  await expect(
    confirmDialog.getByRole("heading", {
      name: /Are you sure you want to merge/,
    }),
  ).toBeVisible();
  await confirmDialog.getByRole("button", { name: "Yes" }).click();

  // After merge: only one of the two source rows remains in the list.
  // The merged record keeps the id of the first entity (childA), so by default
  // the surviving row shows CHILD_A_NAME and CHILD_B_NAME is gone.
  await expect(page.getByRole("cell", { name: CHILD_B_NAME })).not.toBeVisible({
    timeout: 10_000,
  });
  await expect(page.getByRole("cell", { name: CHILD_A_NAME })).toBeVisible();
});

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
