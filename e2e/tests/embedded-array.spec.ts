import { argosScreenshot, expect, loadApp, test } from "#e2e/fixtures.js";
import { generateUsers } from "#src/app/core/user/demo-user-generator.service.js";
import { generateChild } from "#src/app/child-dev-project/children/demo-data-generators/demo-child-generator.service.js";

const CHILD_NAME = "<EMBEDDED ARRAY CHILD>";

const PASSPORT = { type: "<PASSPORT>", number: "P-1234567" };
const VOTER_ID = { type: "<VOTER ID>", number: "V-7654321" };

test("Embedded array table: add, edit and delete single entries in a popup", async ({
  page,
}) => {
  await loadApp(page, [
    ...generateUsers(),
    generateChild({ name: CHILD_NAME }),
  ]);

  await page.getByRole("navigation").getByText("Children").click();
  await page.getByRole("cell", { name: CHILD_NAME }).click();
  await page
    .getByRole("tab", { name: "Identification Documents", exact: true })
    .click();

  // Empty at first: only the header with the "add entry" button
  const table = page.getByRole("table");
  await expect(table.getByRole("row")).toHaveCount(1);

  // Add a first entry through the popup
  await page.getByRole("button", { name: "add entry" }).click();
  const dialog = page.getByRole("dialog");
  await dialog
    .locator("#entity-field__documentType")
    .getByRole("textbox")
    .fill(PASSPORT.type);
  await dialog
    .locator("#entity-field__documentNumber")
    .getByRole("textbox")
    .fill(PASSPORT.number);
  await dialog
    .locator("#entity-field__issueDate")
    .getByRole("textbox")
    .fill("15.03.2020");
  await argosScreenshot(page, "embedded-array-entry-popup");
  await dialog.getByRole("button", { name: "Save" }).click();

  // Saving closes the popup and directly shows the new entry in the table
  await expect(dialog).not.toBeVisible();
  await expect(table.getByRole("cell", { name: PASSPORT.type })).toBeVisible();
  await expect(
    table.getByRole("cell", { name: PASSPORT.number }),
  ).toBeVisible();

  // Add a second entry
  await page.getByRole("button", { name: "add entry" }).click();
  await dialog
    .locator("#entity-field__documentType")
    .getByRole("textbox")
    .fill(VOTER_ID.type);
  await dialog
    .locator("#entity-field__documentNumber")
    .getByRole("textbox")
    .fill(VOTER_ID.number);
  await dialog.getByRole("button", { name: "Save" }).click();
  await expect(dialog).not.toBeVisible();
  await expect(table.getByRole("row")).toHaveCount(3);
  await argosScreenshot(page, "embedded-array-table-with-entries");

  // Edit an existing entry: the popup is prefilled with the clicked entry
  await table.getByRole("cell", { name: PASSPORT.number }).click();
  const numberField = dialog
    .locator("#entity-field__documentNumber")
    .getByRole("textbox");
  await expect(numberField).toHaveValue(PASSPORT.number);
  await numberField.fill("P-CHANGED");
  await dialog.getByRole("button", { name: "Save" }).click();
  await expect(dialog).not.toBeVisible();
  await expect(table.getByRole("cell", { name: "P-CHANGED" })).toBeVisible();
  await expect(
    table.getByRole("cell", { name: PASSPORT.number }),
  ).not.toBeVisible();

  // The entries were saved with the entity: still there after reopening it
  await page.getByRole("navigation").getByText("Children").click();
  await page.getByRole("cell", { name: CHILD_NAME }).click();
  await page
    .getByRole("tab", { name: "Identification Documents", exact: true })
    .click();
  await expect(table.getByRole("row")).toHaveCount(3);
  await expect(table.getByRole("cell", { name: "P-CHANGED" })).toBeVisible();

  // Cancel discards changes
  await table.getByRole("cell", { name: VOTER_ID.number }).click();
  await dialog
    .locator("#entity-field__documentNumber")
    .getByRole("textbox")
    .fill("V-NOT-SAVED");
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).not.toBeVisible();
  await expect(
    table.getByRole("cell", { name: VOTER_ID.number }),
  ).toBeVisible();

  // Delete an entry through the popup's menu, after confirming
  await table.getByRole("cell", { name: VOTER_ID.number }).click();
  await dialog.getByRole("button", { name: "more actions" }).click();
  await page.getByRole("menuitem", { name: "Delete" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Yes" }).click();
  await expect(
    table.getByRole("cell", { name: VOTER_ID.number }),
  ).not.toBeVisible();
  await expect(table.getByRole("row")).toHaveCount(2);
  await expect(table.getByRole("cell", { name: "P-CHANGED" })).toBeVisible();
});

test("Embedded array form field: manage entries in a dialog", async ({
  page,
}) => {
  await loadApp(page, [
    ...generateUsers(),
    generateChild({ name: CHILD_NAME }),
  ]);

  await page.getByRole("navigation").getByText("Children").click();
  await page.getByRole("cell", { name: CHILD_NAME }).click();

  // Basic Information tab contains the same property as a form field
  await page.getByRole("button", { name: "Edit" }).click();
  const field = page.locator("app-edit-schema-embed-array");
  const manageButton = field.getByRole("button", { name: "Manage entries" });
  await expect(field).toContainText("no entries");
  await manageButton.click();

  // The dialog lists the entries; single entries are edited in a nested popup
  const fieldDialog = page.locator("app-schema-embed-array-dialog");
  const entryDialog = page.locator("app-schema-embed-array-entry-dialog");
  await fieldDialog.getByRole("button", { name: "add entry" }).click();
  await entryDialog
    .locator("#entity-field__documentType")
    .getByRole("textbox")
    .fill(PASSPORT.type);
  await entryDialog
    .locator("#entity-field__documentNumber")
    .getByRole("textbox")
    .fill(PASSPORT.number);
  await entryDialog.getByRole("button", { name: "Save" }).click();
  await expect(entryDialog).not.toBeVisible();
  await expect(
    fieldDialog.getByRole("cell", { name: PASSPORT.number }),
  ).toBeVisible();
  await argosScreenshot(page, "embedded-array-field-dialog");
  await fieldDialog.getByRole("button", { name: "Close" }).click();
  await expect(fieldDialog).not.toBeVisible();

  // Entries only get persisted by saving the whole form
  await expect(field).toContainText(PASSPORT.type);
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByRole("button", { name: "Edit" })).toBeVisible();

  // In view mode, clicking the field's summary text opens the dialog read-only
  await page.getByRole("navigation").getByText("Children").click();
  await page.getByRole("cell", { name: CHILD_NAME }).click();
  await field.getByText(PASSPORT.type).click();
  await expect(
    fieldDialog.getByRole("button", { name: "add entry" }),
  ).not.toBeVisible();
  await fieldDialog.getByRole("cell", { name: PASSPORT.number }).click();
  const numberField = entryDialog
    .locator("#entity-field__documentNumber")
    .getByRole("textbox");
  await expect(numberField).toHaveValue(PASSPORT.number);
  await expect(numberField).toBeDisabled();
  await expect(
    entryDialog.getByRole("button", { name: "Save" }),
  ).not.toBeVisible();
});
