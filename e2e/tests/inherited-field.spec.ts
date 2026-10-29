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
  const parentSchool = createEntityOfType("School", "levels-parent-school");
  Object.assign(parentSchool, {
    name: PARENT_SCHOOL_NAME,
    allCenters: [CENTER_ALIPORE],
  });
  const school = createEntityOfType("School", "levels-school");
  Object.assign(school, {
    name: SCHOOL_NAME,
    parentSchool: parentSchool.getId(),
    enumMulti: [CENTER_ALIPORE],
  });
  const child = generateChild({ name: CHILD_NAME });
  Object.assign(child, { schoolId: school.getId(), center: CENTER_ALIPORE });

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
});
