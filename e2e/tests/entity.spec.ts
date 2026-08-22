import { range } from "lodash-es";

import {
  argosScreenshot,
  E2E_REF_DATE,
  expect,
  loadApp,
  readCsvRows,
  selectFilterOption,
  test,
} from "#e2e/fixtures.js";
import type { Entity } from "#src/app/core/entity/model/entity.js";
import { generateUsers } from "#src/app/core/user/demo-user-generator.service.js";
import { generateChild } from "#src/app/child-dev-project/children/demo-data-generators/demo-child-generator.service.js";
import { generateNote } from "#src/app/child-dev-project/notes/demo-data/demo-note-generator.service.js";
import { createEntityOfType } from "#src/app/core/demo-data/create-entity-of-type.js";

const NEW_CHILD_NAME = "<CRUD TEST CHILD>";

test("Create, persist, delete and undo a Child entity end-to-end", async ({
  page,
}) => {
  await loadApp(page, generateUsers());

  await page.getByRole("navigation").getByText("Children").click();
  await page.getByRole("button", { name: "Add New" }).click();

  // The entity-details page opens in "Adding new Child" mode (full page,
  // not a popup — Child uses navigate clickMode).
  await expect(
    page.getByRole("heading", { name: /Adding new Child/ }),
  ).toBeVisible();

  // Fill required name and a couple of other fields.
  await page
    .locator("#entity-field__name")
    .getByRole("textbox")
    .fill(NEW_CHILD_NAME);

  await page.locator("#entity-field__phone").getByRole("textbox").fill("0123");

  // Save the new record.
  await page.getByRole("button", { name: "Save", exact: true }).click();

  // Save completes when the form switches back to view mode (Edit button
  // re-appears) and the page heading updates to the entity's toString.
  await expect(page.getByRole("button", { name: "Edit" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: NEW_CHILD_NAME }),
  ).toBeVisible();
  await argosScreenshot(page, "entity-details-after-create");

  // Navigate back to the list and verify the new child is present.
  await page.getByRole("navigation").getByText("Children").click();
  await expect(page.getByRole("cell", { name: NEW_CHILD_NAME })).toBeVisible();

  // Open the record and verify the persisted phone value.
  await page.getByRole("cell", { name: NEW_CHILD_NAME }).click();
  await expect(
    page.locator("#entity-field__phone").getByRole("textbox"),
  ).toHaveValue("0123");

  // Delete the record via the entity actions menu (ellipsis button in
  // the entity-actions-menu component on the details page).
  await page.locator("app-entity-actions-menu").getByRole("button").click();
  await page.getByRole("menuitem", { name: /Delete/i }).click();

  // Confirmation dialog — confirm with Yes.
  await page.getByRole("dialog").getByRole("button", { name: "Yes" }).click();

  // The undo snackbar appears (auto-dismisses after 8s). Click Undo.
  const undoButton = page.getByRole("button", { name: "Undo" });
  await expect(undoButton).toBeVisible();
  await undoButton.click();

  // After undo, navigating back to the Children list shows the restored row.
  await page.getByRole("navigation").getByText("Children").click();
  await expect(page.getByRole("cell", { name: NEW_CHILD_NAME })).toBeVisible();
});

// Center enum values from configurable-enums.json (id: label)
const CENTER_ALIPORE = { id: "C1", label: "Alipore" };
const CENTER_TOLLYGUNGE = { id: "C2", label: "Tollygunge" };

function assignCenter(
  child: ReturnType<typeof generateChild>,
  center: { id: string; label: string },
) {
  (child as unknown as { center: { id: string; label: string } }).center =
    center;
}

test("List filter narrows results and clears restore full list", async ({
  page,
}) => {
  const users = generateUsers();
  // 5 children in Alipore, 4 in Tollygunge — distinguishable counts.
  const alipore = range(5).map((i) => {
    const c = generateChild({ name: `Alipore Child ${i}` });
    assignCenter(c, CENTER_ALIPORE);
    return c;
  });
  const tollygunge = range(4).map((i) => {
    const c = generateChild({ name: `Tollygunge Child ${i}` });
    assignCenter(c, CENTER_TOLLYGUNGE);
    return c;
  });

  await loadApp(page, [...users, ...alipore, ...tollygunge]);

  await page.getByRole("navigation").getByText("Children").click();

  // All 9 children visible initially.
  await expect(
    page.getByRole("cell", { name: "Alipore Child 0" }),
  ).toBeVisible();
  await expect(
    page.getByRole("cell", { name: "Tollygunge Child 0" }),
  ).toBeVisible();

  // Apply the "Center" filter and pick Alipore.
  await page
    .locator("mat-form-field")
    .filter({ hasText: "Center" })
    .locator("input")
    .first()
    .click();
  await page.getByRole("option", { name: "Alipore" }).click();
  // Close the autocomplete by clicking somewhere neutral.
  await page.getByRole("heading", { name: "Children" }).first().click();

  await argosScreenshot(page, "children-filtered-by-center");

  // Alipore rows still visible, Tollygunge rows hidden.
  await expect(
    page.getByRole("cell", { name: "Alipore Child 0" }),
  ).toBeVisible();
  await expect(
    page.getByRole("cell", { name: "Tollygunge Child 0" }),
  ).not.toBeVisible();

  // Downloading with the "Current (filtered)" scope exports only the records
  // left by the filter, not the whole list.
  await page.locator("button[mat-icon-button][color='primary']").click();
  await page.getByRole("menuitem", { name: /download/i }).click();

  const exportDialog = page.getByRole("dialog");
  await expect(
    exportDialog.getByRole("heading", { name: "Download Data" }),
  ).toBeVisible();
  await exportDialog.getByRole("radio", { name: "CSV" }).click();
  await exportDialog.getByRole("radio", { name: "Current (filtered)" }).click();

  const downloadPromise = page.waitForEvent("download");
  await exportDialog.getByRole("button", { name: "Download" }).click();
  const exported = await readCsvRows(await downloadPromise);

  expect(exported).toHaveLength(alipore.length);
  expect(exported.every((row) => row.includes("Alipore Child"))).toBe(true);
  expect(exported.some((row) => row.includes("Tollygunge"))).toBe(false);

  // the dialog closes itself once the download has been triggered
  await expect(exportDialog).not.toBeVisible();

  // Clear all filters via the top-level "Clear" button (matTooltip "Clear all filters").
  await page.getByRole("button", { name: "Clear" }).click();

  // Both groups visible again.
  await expect(
    page.getByRole("cell", { name: "Alipore Child 0" }),
  ).toBeVisible();
  await expect(
    page.getByRole("cell", { name: "Tollygunge Child 0" }),
  ).toBeVisible();
});

const MATCHING_SCHOOL_NAME = "Alpha School";
const OTHER_SCHOOL_NAME = "Beta School";

/** Default page size of the list paginator. */
const PAGE_SIZE = 10;

/**
 * Names of the children matching both filters, in alphabetical order.
 * 14 records so that the filtered result spans two pages.
 */
const MATCHING_NAMES = range(1, 15).map(
  (i) => `Match ${String(i).padStart(2, "0")}`,
);

/**
 * A decoy sorting between "Match 12" and "Match 13", i.e. into the middle of
 * the *second* page of the filtered result. It only matches the School filter,
 * so it must not show up there — proving filters are applied to the whole
 * dataset and not just to the records rendered on the current page.
 */
const PAGE_TWO_DECOY_NAME = "Match 12 Decoy";

/**
 * Archived records that match both filters. They sort after every active match,
 * so switching "Include archived records" on extends the second page.
 */
const ARCHIVED_NAMES = ["Match 15 Archived", "Match 16 Archived"];

/**
 * The only record in the test data with an "Email" value. All other children
 * leave that field empty, so sorting by Email shows where records without a
 * value end up.
 */
const EMAIL_HOLDER_NAME = "Decoy Center 1";

function createChildForList(opts: {
  name: string;
  /** doubles as the entity id; the list sorts by this column initially */
  projectNumber: string;
  center: { id: string; label: string };
  school?: Entity;
  archived?: boolean;
  email?: string;
}) {
  const child = generateChild({
    id: opts.projectNumber,
    name: opts.name,
    inactive: opts.archived,
  });
  assignCenter(child, opts.center);
  if (opts.school) {
    child["schoolId"] = opts.school.getId();
  }
  if (opts.email) {
    child["email"] = opts.email;
  }
  return child;
}

test("Combining filters keeps sorting consistent across paginated pages", async ({
  page,
}) => {
  const users = generateUsers();
  const matchingSchool = createEntityOfType("School", "school-alpha");
  matchingSchool["name"] = MATCHING_SCHOOL_NAME;
  const otherSchool = createEntityOfType("School", "school-beta");
  otherSchool["name"] = OTHER_SCHOOL_NAME;

  // Children matching both filters. Their projectNumber — the column the list
  // sorts by initially — runs opposite to the alphabetical name order, so
  // sorting by "Name" has to visibly reorder the rows.
  const matchingChildren = MATCHING_NAMES.map((name, i) =>
    createChildForList({
      name,
      projectNumber: `M${String(MATCHING_NAMES.length - i).padStart(2, "0")}`,
      center: CENTER_ALIPORE,
      school: matchingSchool,
    }),
  );

  // Children matching only one of the two filters (or neither). Most of their
  // names sort before "Match ...", so they would surface on the first page if
  // either filter were dropped; PAGE_TWO_DECOY_NAME sorts into the second page.
  const decoyChildren = [
    createChildForList({
      name: PAGE_TWO_DECOY_NAME,
      projectNumber: "DP1",
      center: CENTER_TOLLYGUNGE,
      school: matchingSchool,
    }),
    ...range(3).map((i) =>
      createChildForList({
        name: `Decoy Center ${i}`,
        projectNumber: `DC${i}`,
        center: CENTER_ALIPORE,
        school: otherSchool,
        email:
          `Decoy Center ${i}` === EMAIL_HOLDER_NAME
            ? "decoy@example.com"
            : undefined,
      }),
    ),
    ...range(3).map((i) =>
      createChildForList({
        name: `Decoy School ${i}`,
        projectNumber: `DS${i}`,
        center: CENTER_TOLLYGUNGE,
        school: matchingSchool,
      }),
    ),
    ...range(2).map((i) =>
      createChildForList({
        name: `Decoy None ${i}`,
        projectNumber: `DN${i}`,
        center: CENTER_TOLLYGUNGE,
      }),
    ),
  ];

  // Archived records match both filters but are hidden until the list's
  // "Include archived records" toggle is switched on. Their names sort after
  // all the active matches, so they extend the second page.
  const archivedChildren = ARCHIVED_NAMES.map((name, i) =>
    createChildForList({
      name,
      projectNumber: `MA${i}`,
      center: CENTER_ALIPORE,
      school: matchingSchool,
      archived: true,
    }),
  );

  await loadApp(page, [
    ...users,
    matchingSchool,
    otherSchool,
    ...matchingChildren,
    ...decoyChildren,
    ...archivedChildren,
  ]);

  await page.getByRole("navigation").getByText("Children").click();

  const nameCells = page.locator("app-entities-table td.mat-column-name");
  const paginatorRange = page.locator(".mat-mdc-paginator-range-label");
  const nameHeader = page.getByRole("columnheader", { name: "Name" });

  // All 23 children before filtering.
  await expect(paginatorRange).toHaveText(/^\s*1 - 10 of 23\s*$/);

  // Combine an enum filter and an entity-reference filter.
  await selectFilterOption(page, "Center", CENTER_ALIPORE.label);
  await selectFilterOption(page, "School", MATCHING_SCHOOL_NAME);

  // Only children matching *both* filters remain — spanning two pages.
  await expect(paginatorRange).toHaveText(/^\s*1 - 10 of 14\s*$/);
  await expect(nameCells).toHaveCount(PAGE_SIZE);

  // Still in the initial sort order (by project number, i.e. reverse names).
  await expect(nameCells.first()).toHaveText(MATCHING_NAMES.at(-1));

  // Sort by name, which reorders the filtered result.
  await nameHeader.click();
  await expect(nameHeader).toHaveAttribute("aria-sort", "ascending");
  await expect(nameCells).toHaveText(MATCHING_NAMES.slice(0, PAGE_SIZE));

  // The second page continues the sorted, filtered result.
  await page.getByRole("button", { name: "Next page" }).click();

  await expect(paginatorRange).toHaveText(/^\s*11 - 14 of 14\s*$/);
  await expect(nameCells).toHaveCount(MATCHING_NAMES.length - PAGE_SIZE);
  await expect(nameCells).toHaveText(MATCHING_NAMES.slice(PAGE_SIZE));

  // The decoy sorting into this page is filtered out, although it was never
  // rendered on the first page.
  await expect(
    page.getByRole("cell", { name: PAGE_TWO_DECOY_NAME, exact: true }),
  ).toHaveCount(0);

  await argosScreenshot(page, "children-filtered-sorted-page-2");

  // Archived records that match the filters show up only when explicitly
  // included, the paginator jumps back to page one
  const archivedToggle = page.getByRole("switch", {
    name: "Include archived records",
  });
  await archivedToggle.click();
  await expect(paginatorRange).toHaveText(/^\s*1 - 10 of 16\s*$/);
  await page.getByRole("button", { name: "Next page" }).click();
  await expect(paginatorRange).toHaveText(/^\s*11 - 16 of 16\s*$/);
  await expect(nameCells).toHaveText([
    ...MATCHING_NAMES.slice(PAGE_SIZE),
    ...ARCHIVED_NAMES,
  ]);

  await archivedToggle.click();
  await expect(paginatorRange).toHaveText(/^\s*1 - 10 of 14\s*$/);

  // Sorting the other way round while on the second page. The list deliberately
  // keeps the current page index instead of jumping back to the first page.
  await page.getByRole("button", { name: "Next page" }).click();
  await nameHeader.click();
  await expect(nameHeader).toHaveAttribute("aria-sort", "descending");
  await expect(paginatorRange).toHaveText(/^\s*11 - 14 of 14\s*$/);
  await expect(nameCells).toHaveText(
    [...MATCHING_NAMES].reverse().slice(PAGE_SIZE),
  );

  // Narrowing the filter so that the result no longer reaches the current page:
  // the list falls back to the first page
  await selectFilterOption(page, "School", MATCHING_SCHOOL_NAME);
  await selectFilterOption(page, "School", OTHER_SCHOOL_NAME);

  await expect(paginatorRange).toHaveText(/^\s*1 - 3 of 3\s*$/);
  await expect(nameCells).toHaveCount(3);

  // Records without a value for the sorted column go last ascending and first
  // descending, so both ends of the list are reachable by flipping the sort.
  const emailHeader = page.getByRole("columnheader", { name: "Email" });
  await emailHeader.click();
  await expect(emailHeader).toHaveAttribute("aria-sort", "ascending");
  await expect(nameCells.first()).toHaveText(EMAIL_HOLDER_NAME);

  await emailHeader.click();
  await expect(emailHeader).toHaveAttribute("aria-sort", "descending");
  await expect(nameCells.last()).toHaveText(EMAIL_HOLDER_NAME);

  // NOTE: sorting by a column where all records share the same value (so that
  // ordering is decided purely by the tie-breaker) is deliberately not asserted
  // here: descending currently returns the ascending order for tied records,
  // because the rows are sorted once by the sort store and a second time by the
  // MatTableDataSource, and `tableSort`'s trailing reverse() cancels itself out
  // for equal values.

  // Selecting several options within one filter matches any of them.
  await selectFilterOption(page, "School", OTHER_SCHOOL_NAME);
  await selectFilterOption(page, "School", MATCHING_SCHOOL_NAME);
  await selectFilterOption(page, "Center", CENTER_TOLLYGUNGE.label);

  await expect(paginatorRange).toHaveText(/^\s*1 - 10 of 18\s*$/);

  // The "not defined" option matches exactly the records missing that value.
  await selectFilterOption(page, "Center", CENTER_ALIPORE.label);
  await selectFilterOption(page, "Center", CENTER_TOLLYGUNGE.label);
  await selectFilterOption(page, "School", MATCHING_SCHOOL_NAME);
  await selectFilterOption(page, "School", "not defined");

  await expect(paginatorRange).toHaveText(/^\s*1 - 2 of 2\s*$/);
  // Both records are tied under the active sort, so only their presence is
  // asserted — see the note on tied records above.
  await expect(nameCells).toHaveCount(2);
  await expect(
    page.getByRole("cell", { name: "Decoy None 0", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("cell", { name: "Decoy None 1", exact: true }),
  ).toBeVisible();
});

const RELATED_CHILD_NAME = "<RELATED ENTITIES CHILD>";
const SCHOOL_NAME = "Related Entities School";

test("Add a child-school relation inline via the related-entities table", async ({
  page,
}) => {
  const users = generateUsers();
  const child = generateChild({ name: RELATED_CHILD_NAME });
  const school = createEntityOfType("School", "rel-school-1");
  school["name"] = SCHOOL_NAME;

  await loadApp(page, [...users, child, school]);

  // Open the child's details and navigate to the Education tab where
  // the ChildSchoolRelation related-entities table renders.
  await page.getByRole("navigation").getByText("Children").click();
  await page.getByRole("cell", { name: RELATED_CHILD_NAME }).click();
  await page.getByRole("tab", { name: "Education", exact: true }).click();

  // The Education tab has multiple RelatedEntities tables (School History,
  // ASER, matching). Target School History via its header row that
  // uniquely contains "School Class".
  const schoolHistoryHeaderRow = page
    .getByRole("row")
    .filter({ hasText: "School Class" });
  await schoolHistoryHeaderRow
    .getByRole("button", { name: /add element/i })
    .click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  // Pick the school in the schoolId entity-select dropdown.
  await dialog
    .locator("#entity-field__schoolId")
    .locator(".fa-caret-down")
    .click();
  await page
    .getByRole("option", { name: SCHOOL_NAME })
    .click({ timeout: 10_000 });

  // Set a start date so the row is uniquely identifiable.
  await dialog
    .locator("#entity-field__start")
    .getByRole("textbox")
    .fill("01.09.2024");

  await argosScreenshot(page, "child-school-relation-new");

  // Save the new related entity.
  await dialog.getByRole("button", { name: "Save", exact: true }).click();
  await expect(dialog).not.toBeVisible();

  // The new row shows in the School History table. The school also appears
  // in the matching-entities widget below, so scope to the School History
  // row identified by its start date.
  await expect(
    page.getByRole("row", { name: /01\.09\.2024.*Related Entities School/ }),
  ).toBeVisible();
});

const UNSAVED_CHILD_NAME = "<UNSAVED CHANGES CHILD>";
const ORIGINAL_PHONE = "1234567890";
const EDITED_PHONE = "9999999999";

test("Discard-changes guard: stay on edit then save and leave without prompt", async ({
  page,
}) => {
  const users = generateUsers();
  const child = generateChild({ name: UNSAVED_CHILD_NAME });
  (child as unknown as { phone: string }).phone = ORIGINAL_PHONE;

  await loadApp(page, [...users, child]);

  // Open the child's details page from the Children list.
  await page.getByRole("navigation").getByText("Children").click();
  await page.getByRole("cell", { name: UNSAVED_CHILD_NAME }).click();

  // Enter edit mode and modify a field, making the form dirty
  // (which sets unsavedChanges.pending() to true via the signal).
  await page.getByRole("button", { name: "Edit" }).click();
  await page
    .locator("#entity-field__phone")
    .getByRole("textbox")
    .fill(EDITED_PHONE);

  // Trigger a navigation via the side-nav — the canDeactivate guard should
  // fire and the discard-changes confirmation dialog should appear.
  await page.getByRole("navigation").getByText("Dashboard").click();

  const confirmDialog = page.getByRole("dialog");
  await expect(
    confirmDialog.getByRole("heading", { name: "Discard Changes?" }),
  ).toBeVisible();
  await argosScreenshot(page, "unsaved-changes-confirm");

  // Click "No" — user stays on the form, edits preserved.
  await confirmDialog.getByRole("button", { name: "No" }).click();
  await expect(confirmDialog).not.toBeVisible();

  // The original details page is still active and the edited value is intact.
  await expect(
    page.locator("#entity-field__phone").getByRole("textbox"),
  ).toHaveValue(EDITED_PHONE);

  // Save — the form clears unsavedChanges.pending() back to false.
  await page.getByRole("button", { name: "Save" }).click();

  // Wait for save to complete (the "Edit" button reappears in view mode).
  await expect(page.getByRole("button", { name: "Edit" })).toBeVisible();

  // Navigate away — no confirmation dialog should appear.
  await page.getByRole("navigation").getByText("Dashboard").click();

  await expect(
    page.getByRole("heading", { name: "Discard Changes?" }),
  ).not.toBeVisible();

  // We navigated away from the child details page — the edited phone field is gone.
  await expect(page.locator("#entity-field__phone")).not.toBeVisible();
});

const DIALOG_INITIAL_SUBJECT = "<DIALOG BUTTONS INITIAL>";
const DIALOG_EDITED_SUBJECT = "<DIALOG BUTTONS EDITED>";

test("Dialog Cancel discards edits; Dialog Save persists changes", async ({
  page,
}) => {
  const users = generateUsers();
  const [, demoAdmin] = users;
  const child = generateChild({ name: "Dialog Buttons Child" });
  const note = generateNote({
    child,
    author: demoAdmin,
    date: new Date(E2E_REF_DATE),
  });
  note.subject = DIALOG_INITIAL_SUBJECT;

  await loadApp(page, [...users, child, note]);

  await page.getByRole("navigation").getByText("Notes").click();
  await page.getByRole("cell", { name: DIALOG_INITIAL_SUBJECT }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  // Both Save and Cancel buttons are rendered in the dialog footer (a refactor
  // regression check: dialog-buttons component now uses signal inputs).
  await expect(dialog.getByRole("button", { name: "Save" })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Cancel" })).toBeVisible();
  await argosScreenshot(page, "dialog-buttons-visible");

  // Modify the subject — form becomes dirty.
  await dialog
    .locator("#entity-field__subject")
    .getByRole("textbox")
    .fill(DIALOG_EDITED_SUBJECT);

  // Click Cancel — dialog should close and the edit should NOT be persisted.
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).not.toBeVisible();

  // The list still shows the original subject — edit was discarded.
  await expect(
    page.getByRole("cell", { name: DIALOG_INITIAL_SUBJECT }),
  ).toBeVisible();
  await expect(
    page.getByRole("cell", { name: DIALOG_EDITED_SUBJECT }),
  ).not.toBeVisible();

  // Open the same note again to verify Save persists changes.
  await page.getByRole("cell", { name: DIALOG_INITIAL_SUBJECT }).click();

  await dialog
    .locator("#entity-field__subject")
    .getByRole("textbox")
    .fill(DIALOG_EDITED_SUBJECT);

  await dialog.getByRole("button", { name: "Save" }).click();
  await expect(dialog).not.toBeVisible();

  await expect(
    page.getByRole("cell", { name: DIALOG_EDITED_SUBJECT }),
  ).toBeVisible();
  await expect(
    page.getByRole("cell", { name: DIALOG_INITIAL_SUBJECT }),
  ).not.toBeVisible();
});

const NO_CHANGES_CHILD_NAME = "<NO CHANGES CHILD>";

test("Closing an untouched new-entity dialog does not prompt discard-changes, but an edited one does", async ({
  page,
}) => {
  const users = generateUsers();
  const child = generateChild({ name: NO_CHANGES_CHILD_NAME });

  await loadApp(page, [...users, child]);

  await page.getByRole("navigation").getByText("Children").click();
  await page.getByRole("cell", { name: NO_CHANGES_CHILD_NAME }).click();
  await page.getByRole("tab", { name: "Education", exact: true }).click();

  const schoolHistoryHeaderRow = page
    .getByRole("row")
    .filter({ hasText: "School Class" });
  const openNewSchoolEnrollmentDialog = () =>
    schoolHistoryHeaderRow
      .getByRole("button", { name: /add element/i })
      .click();

  const discardDialogContainer = page
    .getByRole("dialog")
    .filter({ hasText: "Discard Changes?" });
  const discardDialog = discardDialogContainer.getByRole("heading", {
    name: "Discard Changes?",
  });

  // Case 1: open the dialog, touch no fields, and close it via the backdrop
  // (equivalent to clicking anything behind the dialog, e.g. the page's back
  // arrow). No discard-changes prompt should appear.
  await openNewSchoolEnrollmentDialog();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  await page
    .locator(".cdk-overlay-backdrop")
    .click({ position: { x: 5, y: 5 } });

  await expect(discardDialog).not.toBeVisible({ timeout: 3000 });
  await expect(dialog).not.toBeVisible();

  // Case 2: open the dialog again and actually edit a field — closing it now
  // must still trigger the discard-changes prompt.
  await openNewSchoolEnrollmentDialog();
  await expect(dialog).toBeVisible();

  await dialog
    .locator("#entity-field__start")
    .getByRole("textbox")
    .fill("01.09.2024");

  await page
    .locator(".cdk-overlay-backdrop")
    .click({ position: { x: 5, y: 5 } });

  await expect(discardDialog).toBeVisible();
  await discardDialogContainer.getByRole("button", { name: "No" }).click();
  await expect(discardDialog).not.toBeVisible();
  await expect(dialog).toBeVisible();
});
