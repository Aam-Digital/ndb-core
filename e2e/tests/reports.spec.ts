import { range } from "lodash-es";
import { argosScreenshot, expect, loadApp, Page, test } from "#e2e/fixtures.js";
import { generateUsers } from "#src/app/core/user/demo-user-generator.service.js";
import { generateChild } from "#src/app/child-dev-project/children/demo-data-generators/demo-child.utils.js";
import { createEntityOfType } from "#src/app/core/demo-data/create-entity-of-type.js";
// Importing the ReportEntity module triggers its @DatabaseEntity decorator
// so createEntityOfType("ReportConfig") finds it in the entityRegistry.
import "#src/app/features/reporting/report-config.js";

const AGGREGATION_REPORT = "E2E Basic Report";
const SQL_REPORT = "E2E SQL Report";

test("Generate a report and manage the report definitions", async ({
  page,
}) => {
  const children = range(5).map((i) =>
    generateChild({ name: `Reports Child ${i}` }),
  );

  // Seed a non-SQL aggregation ReportConfig so the Reports view has something to
  // select. The query language is browser-side data aggregation; "Child:toArray"
  // yields all Child entities.
  const aggregationReport = createEntityOfType(
    "ReportConfig",
    "e2e-basic-report",
  );
  aggregationReport.title = AGGREGATION_REPORT;
  aggregationReport.mode = "reporting";
  aggregationReport.description = "This report is created for e2e testing ...";
  aggregationReport.reportDefinition = [
    {
      query: "Child:toArray[* admissionDate >= ? & admissionDate <= ?]",
      label: "All children",
    },
  ];

  const sqlReport = createEntityOfType("ReportConfig", "e2e-sql-report");
  sqlReport.title = SQL_REPORT;
  sqlReport.mode = "sql";
  sqlReport.description = "Original description";
  sqlReport.reportDefinition = [{ query: "SELECT name FROM children" }];

  await loadApp(page, [
    ...generateUsers(),
    ...children,
    aggregationReport,
    sqlReport,
  ]);

  await test.step("Generate a configured aggregation report and download CSV", () =>
    generateAggregationReport(page));
  await test.step("Reports are manageable from Admin Overview → Templates and Forms", () =>
    openReportAdminFromAdminOverview(page));
  await test.step("SQL report definition is edited in a syntax-highlighting editor", () =>
    openSqlEditorFromReportsView(page));
  await test.step("Editing a report's description via the admin view persists", () =>
    editReportDescription(page));
});

async function generateAggregationReport(page: Page) {
  await page.getByRole("navigation").getByText("Reports").click();

  // Pick the report in the Select Report dropdown.
  await page.getByRole("combobox", { name: /Select Report/i }).click();
  await page.getByRole("option", { name: AGGREGATION_REPORT }).click();

  // The aggregation report shows a date range selector and Calculate is
  // disabled until a range is set. Fill the date range.
  await page.getByRole("textbox", { name: "Start date" }).fill("01.01.2020");
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
}

async function openReportAdminFromAdminOverview(page: Page) {
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

  await expect(page.getByRole("cell", { name: SQL_REPORT })).toBeVisible({
    timeout: 10_000,
  });

  await argosScreenshot(page, "report-admin-list");
}

async function openSqlEditorFromReportsView(page: Page) {
  // Reach the report's admin details via the Reports view context menu.
  await page.getByRole("navigation").getByText("Reports").click();
  await page
    .locator("button[mat-icon-button][color='primary']")
    .first()
    .click();
  await page.getByRole("menuitem", { name: "Manage Reports" }).click();
  await page.getByRole("cell", { name: SQL_REPORT }).click();
  await page.getByRole("button", { name: "Edit" }).click();

  // Each query renders in its own CodeMirror SQL editor showing the query text.
  const editor = page.locator("app-edit-sql-query .cm-content").first();
  await expect(editor).toBeVisible({ timeout: 10_000 });
  await expect(editor).toContainText("SELECT");

  await argosScreenshot(page, "report-sql-editor");
}

/** continues in the edit mode of the report opened by {@link openSqlEditorFromReportsView} */
async function editReportDescription(page: Page) {
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
}
