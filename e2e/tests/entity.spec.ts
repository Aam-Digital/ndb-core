import { range } from "lodash-es";

import {
  argosScreenshot,
  E2E_REF_DATE,
  expect,
  loadApp,
  test,
} from "#e2e/fixtures.js";
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
  await page.locator("app-entity-actions-menu [matMenuTriggerFor]").click();
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
