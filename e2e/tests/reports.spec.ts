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
  const reportConfig = createEntityOfType(
    "ReportConfig",
    "e2e-basic-report",
  ) as any;
  reportConfig.title = "E2E Basic Report";
  reportConfig.mode = "reporting";
  reportConfig.aggregationDefinitions = [
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
