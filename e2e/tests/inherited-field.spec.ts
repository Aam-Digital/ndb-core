import {
  argosScreenshot,
  E2E_REF_DATE,
  expect,
  loadApp,
  test,
} from "#e2e/fixtures.js";
import { generateChild } from "#src/app/child-dev-project/children/demo-data-generators/demo-child-generator.service.js";
import { createEntityOfType } from "#src/app/core/demo-data/create-entity-of-type.js";
import { generateUsers } from "#src/app/core/user/demo-user-generator.service.js";

// Center enum values from configurable-enums.json (id: label)
const CENTER_ALIPORE = { id: "C1", label: "Alipore" };
const CENTER_BARABAZAR = { id: "C3", label: "Barabazar" };

const CHILD_NAME = "<LEVELS CHILD>";
const SCHOOL_NAME = "<LEVELS SCHOOL>";
const PARENT_SCHOOL_NAME = "<LEVELS PARENT SCHOOL>";

test("Update related records over several levels: child, school and parent school", async ({
  page,
}) => {
  // In the all-features config, the school collects the centers of its children ("enum multi")
  // and its parent school collects the centers of its schools ("All centers").
  // A school's "Date Range Field" is checked against the one of its parent school.
  const parentSchool = createEntityOfType("School", "levels-parent-school");
  Object.assign(parentSchool, {
    name: PARENT_SCHOOL_NAME,
    allCenters: [CENTER_ALIPORE],
    dateRangeField: { start: new Date(2026, 2, 1), end: new Date(2026, 4, 31) },
  });
  const school = createEntityOfType("School", "levels-school");
  Object.assign(school, {
    name: SCHOOL_NAME,
    parentSchool: parentSchool.getId(),
    enumMulti: [CENTER_ALIPORE],
    dateRangeField: {
      start: new Date(2026, 4, 20),
      end: new Date(2026, 5, 15),
    },
  });
  const child = generateChild({ name: CHILD_NAME });
  Object.assign(child, {
    linkedSchool: school.getId(),
    center: CENTER_ALIPORE,
  });

  await loadApp(page, [...generateUsers(), child, school, parentSchool]);

  // change the center of the child
  await page.getByRole("navigation").getByText("Children").click();
  await page.getByRole("cell", { name: CHILD_NAME }).click();
  await page.getByRole("button", { name: "Edit" }).click();
  await page.locator("#entity-field__center").locator(".fa-caret-down").click();
  await page.getByRole("option", { name: CENTER_BARABAZAR.label }).click();
  await page.getByRole("button", { name: "Save", exact: true }).click();

  // the dialog lists the school and the parent school above it, both with the new center
  const dialog = page.getByRole("dialog", { name: /Update related records/ });
  const schoolRow = dialog
    .getByRole("row")
    .filter({ has: page.locator("#entity-field__enumMulti") });
  const parentSchoolRow = dialog
    .getByRole("row")
    .filter({ has: page.locator("#entity-field__allCenters") });
  const schoolValue = schoolRow.locator("#entity-field__enumMulti");
  const parentSchoolValue = parentSchoolRow.locator(
    "#entity-field__allCenters",
  );
  await expect(schoolRow).toContainText(SCHOOL_NAME);
  await expect(parentSchoolRow).toContainText(PARENT_SCHOOL_NAME);
  await expect(parentSchoolRow).toContainText(`via ${SCHOOL_NAME}`);
  await expect(schoolValue).toContainText(CENTER_BARABAZAR.label);
  await expect(parentSchoolValue).toContainText(CENTER_BARABAZAR.label);
  // only the dialog, as the record behind it has random values
  await argosScreenshot(page, "update-related-records-several-levels", {
    element: dialog,
    fullPage: false,
  });

  // adding another center for the school is passed on to the parent school
  // (after a short delay, which needs the time to run: the clock of the tests stands still)
  await page.clock.setSystemTime(E2E_REF_DATE);
  await schoolValue.locator(".fa-caret-down").click();
  await page.getByRole("option", { name: "Tollygunge" }).click();
  await expect(parentSchoolValue).toContainText("Tollygunge");

  await dialog
    .getByRole("button", { name: "Update related records", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();

  // both levels were saved
  await page.getByRole("navigation").getByText("Schools").click();
  await page.getByRole("cell", { name: PARENT_SCHOOL_NAME }).click();
  await expect(page.locator("#entity-field__allCenters")).toContainText(
    "Tollygunge",
  );
  await expect(page.locator("#entity-field__allCenters")).toContainText(
    CENTER_BARABAZAR.label,
  );
  await page.getByRole("navigation").getByText("Schools").click();
  await page.getByRole("cell", { name: SCHOOL_NAME }).click();
  await expect(page.locator("#entity-field__enumMulti")).toContainText(
    "Tollygunge",
  );

  // the school's period goes beyond the one of its parent school (hovering shows why)
  const periodWarning = page
    .locator("#entity-field__dateRangeField")
    .locator("app-fa-dynamic-icon");
  await periodWarning.hover();
  await expect(periodWarning).toHaveAccessibleDescription(
    `Outside the period of ${PARENT_SCHOOL_NAME}`,
  );
});

const DOCS_CHILD_NAME = "<DOCS CHILD>";
const DOCS_SCHOOL_NAME = "<DOCS SCHOOL>";

test("Collect the embedded entries of sub-records in their parent record", async ({
  page,
}) => {
  // In the all-features config, a school collects the "Identification Documents" of its children
  // ("Identification Documents of Children": a schema-embed-array with aggregation "add").
  const school = createEntityOfType("School", "docs-school");
  Object.assign(school, { name: DOCS_SCHOOL_NAME });
  const child = generateChild({ name: DOCS_CHILD_NAME });
  Object.assign(child, {
    linkedSchool: school.getId(),
    identificationDocuments: [],
  });

  await loadApp(page, [...generateUsers(), child, school]);

  const updateDialog = page.getByRole("dialog", {
    name: /Update related records/,
  });
  const schoolDocsInDialog = updateDialog.locator(
    "#entity-field__childrenIdDocuments",
  );

  // an entry added in the child's form is passed on to the school when the form is saved
  await page.getByRole("navigation").getByText("Children").click();
  await page.getByRole("cell", { name: DOCS_CHILD_NAME }).click();
  await page.getByRole("button", { name: "Edit" }).click();
  await page.getByRole("button", { name: "Manage entries" }).click();
  const entriesDialog = page.getByRole("dialog", {
    name: "Identification Documents",
  });
  await entriesDialog.getByRole("button", { name: "add entry" }).click();
  const entryDialog = page.getByRole("dialog").last();
  await entryDialog
    .locator("#entity-field__documentNumber")
    .getByRole("textbox")
    .fill("<FORM-DOC>");
  await entryDialog.getByRole("button", { name: "Apply" }).click();
  await entriesDialog.getByRole("button", { name: "Close" }).click();
  await page.getByRole("button", { name: "Save", exact: true }).click();

  await expect(schoolDocsInDialog).toContainText("1 entry");
  await updateDialog
    .getByRole("button", { name: "Update related records", exact: true })
    .click();
  await expect(updateDialog).not.toBeVisible();

  // an entry added in the child's "Identification Documents" panel is passed on as well
  await page
    .getByRole("tab", { name: "Identification Documents", exact: true })
    .click();
  await page.getByRole("button", { name: "add entry" }).click();
  const panelEntryDialog = page.getByRole("dialog");
  await panelEntryDialog
    .locator("#entity-field__documentNumber")
    .getByRole("textbox")
    .fill("<PANEL-DOC>");
  await panelEntryDialog
    .getByRole("button", { name: "Save", exact: true })
    .click();

  await expect(schoolDocsInDialog).toContainText("2 entries");
  await updateDialog
    .getByRole("button", { name: "Update related records", exact: true })
    .click();
  await expect(updateDialog).not.toBeVisible();

  // the school holds the entries of its child
  await page.getByRole("navigation").getByText("Schools").click();
  await page.getByRole("cell", { name: DOCS_SCHOOL_NAME }).click();
  await page
    .locator("#entity-field__childrenIdDocuments")
    .getByRole("button", { name: "View entries" })
    .click();
  const schoolDocs = page.getByRole("dialog", {
    name: "Identification Documents of Children",
  });
  await expect(
    schoolDocs.getByRole("cell", { name: "<FORM-DOC>" }),
  ).toBeVisible();
  await expect(
    schoolDocs.getByRole("cell", { name: "<PANEL-DOC>" }),
  ).toBeVisible();
});
