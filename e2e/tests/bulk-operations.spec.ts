import { range } from "lodash-es";

import {
  argosScreenshot,
  expect,
  loadApp,
  selectFilterOption,
  test,
} from "#e2e/fixtures.js";
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

// Center enum values from configurable-enums.json (id: label)
const CENTER_ALIPORE = { id: "C1", label: "Alipore" };
const CENTER_TOLLYGUNGE = { id: "C2", label: "Tollygunge" };

/**
 * 14 children in Alipore, so filtering by that center still leaves two pages
 * (page size 10). Their names run opposite to their projectNumber — the column
 * the list sorts by initially — so sorting by "Name" visibly reorders them.
 */
const BULK_NAMES = range(1, 15).map(
  (i) => `Bulk ${String(i).padStart(2, "0")}`,
);

/** Default page size of the list paginator. */
const PAGE_SIZE = 10;

function assignCenter(
  child: ReturnType<typeof generateChild>,
  center: { id: string; label: string },
) {
  (child as unknown as { center: { id: string; label: string } }).center =
    center;
}

test("Bulk selection follows the rendered order through sorting, filtering and pagination", async ({
  page,
}) => {
  const users = generateUsers();
  const children = BULK_NAMES.map((name, i) => {
    const child = generateChild({
      name,
      id: `B${String(BULK_NAMES.length - i).padStart(2, "0")}`,
    });
    assignCenter(child, CENTER_ALIPORE);
    return child;
  });
  // Records excluded by the Center filter used below.
  const otherCenterChildren = range(4).map((i) => {
    const child = generateChild({ name: `Other Center ${i}`, id: `O${i}` });
    assignCenter(child, CENTER_TOLLYGUNGE);
    return child;
  });

  await loadApp(page, [...users, ...children, ...otherCenterChildren]);

  await page.getByRole("navigation").getByText("Children").click();
  await expect(page.locator("app-entities-table")).toBeVisible();

  const rows = page.locator("app-entities-table tbody tr");
  const nameCells = page.locator("app-entities-table td.mat-column-name");
  const paginatorRange = page.locator(".mat-mdc-paginator-range-label");
  const headerCheckbox = page
    .locator("app-entities-table mat-checkbox")
    .first();
  const nameHeader = page.getByRole("columnheader", { name: "Name" });

  /** Select the first three rows of the current page by shift-clicking. */
  async function shiftSelectFirstThreeRows() {
    await rows.nth(0).click();
    await expect(rows.nth(0).locator("mat-checkbox input")).toBeChecked();
    await rows.nth(2).click({ modifiers: ["Shift"] });

    for (const index of [0, 1, 2]) {
      await expect(rows.nth(index).locator("mat-checkbox input")).toBeChecked();
    }
  }

  /**
   * Unselect everything, from any starting state. The header checkbox only
   * clears when it is fully checked, so a partial selection has to be turned
   * into a complete one first.
   */
  async function clearSelection() {
    const headerInput = headerCheckbox.locator("input");
    if (!(await headerInput.isChecked())) {
      await headerCheckbox.click();
      await expect(headerInput).toBeChecked();
    }

    await headerCheckbox.click();
    await expect(rows.nth(0).locator("mat-checkbox input")).not.toBeChecked();
  }

  await page.locator("button[mat-icon-button][color='primary']").click();
  await page
    .getByRole("menuitem", { name: "bulk actions Bulk Actions" })
    .click();
  await expect(headerCheckbox).toBeVisible();

  // 1. In the list's initial order.
  await shiftSelectFirstThreeRows();
  await clearSelection();

  // 2. After sorting, where the rendered order differs from the order the
  //    records were loaded in.
  await nameHeader.click();
  await expect(nameHeader).toHaveAttribute("aria-sort", "ascending");

  await shiftSelectFirstThreeRows();
  await argosScreenshot(page, "bulk-selection-range-sorted");
  await clearSelection();

  // 3. On a second page of a filtered result, where the rows are neither the
  //    first ones nor in the order the records were loaded in.
  await selectFilterOption(page, "Center", CENTER_ALIPORE.label);
  await expect(paginatorRange).toHaveText(/^\s*1 - 10 of 14\s*$/);

  await page.getByRole("button", { name: "Next page" }).click();
  await expect(nameCells).toHaveText(BULK_NAMES.slice(PAGE_SIZE));

  await shiftSelectFirstThreeRows();
  await expect(rows.nth(3).locator("mat-checkbox input")).not.toBeChecked();

  await clearSelection();

  // "Select all" covers the whole filtered result, not just the visible page.
  await headerCheckbox.click();
  await expect(rows).toHaveCount(BULK_NAMES.length - PAGE_SIZE);
  for (let index = 0; index < BULK_NAMES.length - PAGE_SIZE; index++) {
    await expect(rows.nth(index).locator("mat-checkbox input")).toBeChecked();
  }

  await page.getByRole("button", { name: "Prev page" }).click();
  await expect(rows).toHaveCount(PAGE_SIZE);
  for (let index = 0; index < PAGE_SIZE; index++) {
    await expect(rows.nth(index).locator("mat-checkbox input")).toBeChecked();
  }

  // Clear the selection and pick just the first two records of page 2.
  await clearSelection();
  await page.getByRole("button", { name: "Next page" }).click();
  await rows.nth(0).click();
  await rows.nth(1).click();

  // Bulk-editing them out of the active filter must update the filtered result
  // and the paginator while we are on the second page.
  await page
    .locator("app-entity-bulk-actions")
    .locator("input")
    .first()
    .click();
  await page.getByRole("option", { name: "Bulk Edit" }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog
    .locator("mat-form-field")
    .filter({ hasText: "Property to update" })
    .locator("input")
    .first()
    .click();
  await page.getByRole("option", { name: "Center", exact: true }).click();

  // the enum field renders as chips; its dropdown opens via the caret suffix
  await dialog.locator("#entity-field__center .fa-caret-down").click();
  await page
    .getByRole("option", { name: CENTER_TOLLYGUNGE.label, exact: true })
    .click();

  await dialog.getByRole("button", { name: "Save" }).click();
  await expect(dialog).not.toBeVisible();

  await expect(paginatorRange).toHaveText(/^\s*11 - 12 of 12\s*$/, {
    timeout: 10_000,
  });
  await expect(nameCells).toHaveText(BULK_NAMES.slice(PAGE_SIZE + 2));
});
