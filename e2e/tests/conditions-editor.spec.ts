import { argosScreenshot, loadApp, test } from "#e2e/fixtures.js";
import { generateUsers } from "#src/app/core/user/demo-user-generator.service.js";
import { generateChild } from "#src/app/child-dev-project/children/demo-data-generators/demo-child-generator.service.js";

const CHILD_NAME = "<CONDITIONS TEST CHILD>";

test("Conditional colour sections use the shared conditions editor", async ({
  page,
}) => {
  await loadApp(page, generateUsers());

  await page.getByRole("navigation").getByText("Schools").click();
  await page.locator("button[mat-icon-button][color='primary']").click();
  await page.getByText("Configure Data Structure").click();
  await page.getByText("General Settings").click();
  await page.getByRole("button", { name: "Add Conditional Color" }).click();

  await page.getByRole("textbox", { name: "Field", exact: true }).click();
  await page.getByRole("option", { name: "Name", exact: true }).click();
  await page.getByRole("combobox", { name: "Condition", exact: true }).click();
  await page.getByRole("option", { name: "is not" }).click();

  await argosScreenshot(page, "conditional-colour-condition-row");
});

test("The conditions editor combines rows with Any or All", async ({
  page,
}) => {
  await loadApp(page, generateUsers());

  await page.getByRole("navigation").getByText("Schools").click();
  await page.locator("button[mat-icon-button][color='primary']").click();
  await page.getByText("Configure Data Structure").click();
  await page.getByText("General Settings").click();
  await page.getByRole("button", { name: "Add Conditional Color" }).click();

  await page.getByRole("textbox", { name: "Field", exact: true }).click();
  await page.getByRole("option", { name: "Name", exact: true }).click();
  await page
    .getByRole("button", { name: "Add Condition", exact: true })
    .click();
  await page.getByRole("radio", { name: "Any", exact: true }).click();

  await argosScreenshot(page, "conditions-editor-any-combinator");
});

test("Matching prefilters use the shared conditions editor", async ({
  page,
}) => {
  await loadApp(page, [
    ...generateUsers(),
    generateChild({ name: CHILD_NAME }),
  ]);

  await page.getByRole("navigation").getByText("Children").click();
  await page.getByRole("cell", { name: CHILD_NAME }).click();
  await page.getByRole("tab", { name: "Education", exact: true }).click();
  await page
    .locator("app-matching-entities button[mat-icon-button]")
    .first()
    .click();
  await page.getByRole("menuitem", { name: "Edit Matching Entities" }).click();

  await page
    .getByRole("button", { name: "Add Condition", exact: true })
    .first()
    .click();

  await argosScreenshot(page, "matching-prefilter-condition-row");
});

test("Permission conditions use the shared conditions editor dialog", async ({
  page,
}) => {
  await loadApp(page, generateUsers());

  await page.getByRole("navigation").getByText("Admin").click();
  await page.getByRole("navigation").getByText("Admin Overview").click();
  await page.getByText("User Management", { exact: true }).click();
  await page.getByText("User Roles & Permissions").click();
  await page.getByRole("cell", { name: "_default" }).click();
  await page.getByRole("button", { name: "Edit" }).click();

  // the demo role already restricts reading the site settings to a condition
  await page
    .getByRole("row", { name: /^Site Settings/ })
    .getByRole("button", { name: "only where…" })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByRole("button", { name: "Add Condition", exact: true })
    .click();
  await dialog.getByRole("textbox", { name: "Field", exact: true }).click();
  await page.getByRole("option").first().click();
  await dialog
    .getByRole("combobox", { name: "Condition", exact: true })
    .click();
  await page.getByRole("option", { name: "is not" }).click();

  await argosScreenshot(page, "permission-matrix-condition-dialog");
});
