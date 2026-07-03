import { range } from "lodash-es";
import { argosScreenshot, expect, loadApp, test } from "#e2e/fixtures.js";
import { generateUsers } from "#src/app/core/user/demo-user-generator.service.js";
import { generateChild } from "#src/app/child-dev-project/children/demo-data-generators/demo-child-generator.service.js";
import { createEntityOfType } from "#src/app/core/demo-data/create-entity-of-type.js";
// Importing the ReportEntity module triggers its @DatabaseEntity decorator
// so createEntityOfType("ReportConfig") finds it in the entityRegistry.
import "#src/app/features/reporting/report-config.js";

test("Generate a configured aggregation report and download CSV", async ({
  page,
}) => {
  const users = generateUsers();
  const children = range(5).map((i) =>
    generateChild({ name: `Reports Child ${i}` }),
  );

  // Seed a non-SQL aggregation ReportConfig so the Reports view has
  // something to select. The query language is browser-side data
  // aggregation; "Child:toArray" yields all Child entities.
  const reportConfig = createEntityOfType("ReportConfig", "e2e-basic-report");
  reportConfig.title = "E2E Basic Report";
  reportConfig.mode = "reporting";
  reportConfig.reportDefinition = [
    {
      query: "Child:toArray",
      label: "All children",
    },
  ];

  await loadApp(page, [...users, ...children, reportConfig]);

  await page.getByRole("navigation").getByText("Reports").click();

  // Pick the report in the Select Report dropdown.
  await page.getByRole("combobox", { name: /Select Report/i }).click();
  await page.getByRole("option", { name: "E2E Basic Report" }).click();

  // The aggregation report shows a date range selector and Calculate is
  // disabled until a range is set. Fill the date range.
  await page.getByRole("textbox", { name: "Start date" }).fill("01.01.2024");
  await page.getByRole("textbox", { name: "End date" }).fill("31.12.2025");
  await page.getByRole("textbox", { name: "End date" }).blur();

  await argosScreenshot(page, "reports-selected");

  // Run the report.
  await page.getByRole("button", { name: "Calculate" }).click();

  // The aggregation row should render with the configured label and a count.
  await expect(page.getByText("All children", { exact: false })).toBeVisible({
    timeout: 10_000,
  });

  // Trigger CSV download and assert the file event fires.
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /Download/i }).click();
  // Some report views open an export dialog before downloading; pick CSV if present.
  const dialog = page.getByRole("dialog");
  if (await dialog.isVisible({ timeout: 1_000 }).catch(() => false)) {
    await dialog
      .getByRole("button", { name: /Download|Export|CSV/i })
      .first()
      .click();
  }
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.csv|\.xlsx/);
});

test("Reports are manageable from Admin Overview → Templates and Forms", async ({
  page,
}) => {
  const users = generateUsers();

  const reportConfig = createEntityOfType("ReportConfig", "e2e-admin-report");
  reportConfig.title = "E2E Admin Report";
  reportConfig.mode = "sql";
  reportConfig.reportDefinition = [{ query: "SELECT name FROM children" }];

  await loadApp(page, [...users, reportConfig]);

  // Navigate to Admin Overview and open the "Templates and Forms" section.
  await page.getByRole("navigation").getByText("Admin").click();
  await page.getByRole("navigation").getByText("Admin Overview").click();

  const templatesPanel = page
    .locator("mat-expansion-panel")
    .filter({ hasText: "Templates and Forms" });
  await templatesPanel
    .getByRole("button", { name: /Templates and Forms/ })
    .click();

  // The dynamically-registered "Reports" entry opens the report admin list.
  await templatesPanel.getByText("Reports", { exact: true }).click();

  await expect(
    page.getByRole("cell", { name: "E2E Admin Report" }),
  ).toBeVisible({ timeout: 10_000 });

  await argosScreenshot(page, "report-admin-list");
});

test("Editing a report's description via the admin view persists", async ({
  page,
}) => {
  const users = generateUsers();

  const reportConfig = createEntityOfType("ReportConfig", "e2e-edit-report");
  reportConfig.title = "E2E Editable Report";
  reportConfig.mode = "sql";
  reportConfig.description = "Original description";
  reportConfig.reportDefinition = [{ query: "SELECT name FROM children" }];

  await loadApp(page, [...users, reportConfig]);

  // Reach the report admin list via the Reports view context menu ("Manage Reports").
  await page.getByRole("navigation").getByText("Reports").click();
  await page
    .locator("button[mat-icon-button][color='primary']")
    .first()
    .click();
  await page.getByRole("menuitem", { name: "Manage Reports" }).click();

  // Open the report's details and edit the description.
  await page.getByRole("cell", { name: "E2E Editable Report" }).click();
  await page.getByRole("button", { name: "Edit" }).click();

  const newDescription = "Edited by e2e test";
  const descriptionField = page
    .locator("#entity-field__description")
    .getByRole("textbox");
  await descriptionField.fill(newDescription);

  await argosScreenshot(page, "report-admin-details");

  await page.getByRole("button", { name: "Save", exact: true }).click();

  // After saving, the details view returns to read mode (disabled fields) showing the new value.
  await expect(page.getByRole("button", { name: "Edit" })).toBeVisible();
  await expect(
    page.locator("#entity-field__description").getByRole("textbox"),
  ).toHaveValue(newDescription, { timeout: 10_000 });
});

test("Report description is shown above the results on the Reports view", async ({
  page,
}) => {
  const users = generateUsers();
  const children = range(3).map((i) =>
    generateChild({ name: `Reports Child ${i}` }),
  );

  const description = "This report counts all children in the system.";
  const reportConfig = createEntityOfType(
    "ReportConfig",
    "e2e-described-report",
  );
  reportConfig.title = "E2E Described Report";
  reportConfig.mode = "reporting";
  reportConfig.description = description;
  reportConfig.aggregationDefinitions = [
    { query: "Child:toArray", label: "All children" },
  ];

  await loadApp(page, [...users, ...children, reportConfig]);

  await page.getByRole("navigation").getByText("Reports").click();

  await page.getByRole("combobox", { name: /Select Report/i }).click();
  await page.getByRole("option", { name: "E2E Described Report" }).click();

  // The new collapsible "About this report" panel appears above the results.
  await expect(
    page.getByRole("button", { name: /About this report/ }),
  ).toBeVisible({ timeout: 10_000 });
  await page.getByRole("button", { name: /About this report/ }).click();
  await expect(page.getByText(description)).toBeVisible();

  await argosScreenshot(page, "report-description");
});
