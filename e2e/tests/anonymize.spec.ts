import { E2E_REF_DATE, expect, loadApp, Page, test } from "#e2e/fixtures.js";
import { generateChild } from "#src/app/child-dev-project/children/demo-data-generators/demo-child-generator.service.js";
import { generateNote } from "#src/app/child-dev-project/notes/demo-data/demo-note-generator.service.js";
import { generateUsers } from "#src/app/core/user/demo-user-generator.service.js";
import { createEntityOfType } from "#src/app/core/demo-data/create-entity-of-type.js";

const CHILD_NAME = "<ANONYMIZE TEST CHILD>";
const OTHER_CHILD_NAME = "<ANONYMIZE TEST OTHER CHILD>";
const SUBJECT_SOLE_LINK = "<ANONYMIZE TEST RECORD>";
const SUBJECT_SHARED_LINK = "<ANONYMIZE TEST SHARED RECORD>";
const LINKED_USER_NAME = "<ANONYMIZE TEST USER>";
const LINKED_USER_PHONE = "555-0100";

/**
 * Set the anonymize mode of the note's user reference ("Team involved")
 * through the Admin UI.
 */
async function setNoteAuthorsAnonymizeMode(page: Page, mode: string) {
  await page.getByRole("navigation").getByText("Notes").click();
  await page
    .locator("button[mat-icon-button][color='primary']")
    .first()
    .click();
  await page.getByText("Configure Data Structure").click();
  await page.getByText("Details View & Fields").click();

  const authorsField = page
    .locator(".admin-form-field")
    .filter({ hasText: "Team involved" })
    .first();
  await authorsField.scrollIntoViewIfNeeded();
  await authorsField.hover();
  await authorsField.getByRole("button", { name: "Edit Field" }).click();

  const fieldDialog = page.locator("mat-dialog-container");
  await fieldDialog.getByRole("tab", { name: "Advanced Options" }).click();
  await fieldDialog
    .locator("app-anonymize-options")
    .getByRole("combobox")
    .click();
  await page.getByRole("option", { name: mode, exact: true }).click();
  // move the pointer away so the option's tooltip does not cover the button
  await page.mouse.move(0, 0);
  await fieldDialog.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(fieldDialog).not.toBeVisible();

  await page.getByRole("button", { name: "Save" }).first().click();
  await expect(page.getByText("Configuration updated")).toBeVisible();
}

/**
 * Anonymization must never spread to a record that is only linked *from* an
 * anonymized record. It cascades to records linking *to* it through a
 * "composite" relation, and clears the record's own references according to
 * their configured anonymize mode.
 *
 * This flow covers all of that in one pass:
 * - the note belonging to the anonymized child only is cascaded into,
 * - the note shared with another child is kept and reported for manual review,
 * - both anonymize modes a user reference is realistically configured with
 *   clear the reference and leave the referenced record alone,
 * - and the linked user profile keeps all of its data throughout.
 */
test("Anonymize cascades to a record's own notes but never to a linked user profile", async ({
  page,
}) => {
  const users = generateUsers();
  const linkedUser = createEntityOfType("User", "anonymize-e2e-user");
  linkedUser.name = LINKED_USER_NAME;
  linkedUser.phone = LINKED_USER_PHONE;

  const child = generateChild({ name: CHILD_NAME });
  const otherChild = generateChild({ name: OTHER_CHILD_NAME });

  const note = generateNote({
    child,
    author: linkedUser,
    date: new Date(E2E_REF_DATE),
  });
  note.subject = SUBJECT_SOLE_LINK;

  // a note linked to another child as well is kept, so the assertions below
  // distinguish "the cascade anonymized this note" from "no note is listed"
  const sharedNote = generateNote({
    child,
    author: linkedUser,
    date: new Date(E2E_REF_DATE),
  });
  sharedNote.subject = SUBJECT_SHARED_LINK;
  // qlty-ignore: radarlint-js:typescript:S1874 - the demo config still links notes to children through this deprecated field
  sharedNote.children.push(otherChild.getId());

  await loadApp(page, [
    ...users,
    linkedUser,
    child,
    otherChild,
    note,
    sharedNote,
  ]);

  // "Remove" is what a link to a user profile is usually configured with,
  // and is stored as `anonymize: ""`
  await setNoteAuthorsAnonymizeMode(page, "Remove");

  // both notes are listed while the child they belong to is still active
  await page.getByRole("navigation").getByText("Notes").click();
  await expect(
    page.getByRole("cell", { name: SUBJECT_SOLE_LINK }),
  ).toBeVisible();
  await expect(
    page.getByRole("cell", { name: SUBJECT_SHARED_LINK }),
  ).toBeVisible();

  // anonymize the child
  await page.getByRole("navigation").getByText("Children").click();
  await page.getByRole("cell", { name: CHILD_NAME }).click();
  await page.locator("app-entity-actions-menu").getByRole("button").click();
  await page.getByRole("menuitem", { name: "Anonymize" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Yes" }).click();

  // the shared note is linked to another child as well, so it is left
  // unchanged and reported for manual review
  await page.getByRole("dialog").getByRole("button", { name: "OK" }).click();

  await expect(page.getByText("Anonymized & Archived")).toBeVisible();

  // the cascade reached the note that is linked to this child only: it is
  // archived along with being anonymized and drops out of the list, while
  // the note shared with another child stays
  await page.getByRole("navigation").getByText("Notes").click();
  await expect(
    page.getByRole("cell", { name: SUBJECT_SHARED_LINK }),
  ).toBeVisible();
  await expect(
    page.getByRole("cell", { name: SUBJECT_SOLE_LINK }),
  ).toBeHidden();

  // "Partially Anonymize" does not mark the referenced record as a part of the
  // note, so it must not reach into the user profile either - the reference is
  // removed instead
  await setNoteAuthorsAnonymizeMode(page, "Partially Anonymize");

  await page.getByRole("navigation").getByText("Notes").click();
  await page.getByRole("cell", { name: SUBJECT_SHARED_LINK }).click();
  const noteDialog = page.getByRole("dialog");
  await expect(noteDialog.getByText(LINKED_USER_NAME)).toBeVisible();

  await noteDialog
    .locator("app-entity-actions-menu")
    .getByRole("button")
    .click();
  await page.getByRole("menuitem", { name: "Anonymize" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Yes" }).click();

  await expect(noteDialog.getByText(LINKED_USER_NAME)).toBeHidden();
  await noteDialog.getByRole("button", { name: "Cancel" }).click();
  await expect(noteDialog).toBeHidden();

  // ... while the user profile itself kept all its data
  await page.getByRole("navigation").getByText("Admin").click();
  await page.getByRole("navigation").getByText("Users").click();
  await page.getByRole("cell", { name: LINKED_USER_NAME }).click();

  await expect(
    page.getByRole("heading", { name: LINKED_USER_NAME }),
  ).toBeVisible();
  await expect(
    page.locator("#entity-field__phone").getByRole("textbox"),
  ).toHaveValue(LINKED_USER_PHONE);
  await expect(page.getByText("Anonymized & Archived")).toBeHidden();
});
