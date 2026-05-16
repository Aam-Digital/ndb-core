import { argosScreenshot, expect, loadApp, test } from "#e2e/fixtures.js";
import { generateUsers } from "#src/app/core/user/demo-user-generator.service.js";
import { createEntityOfType } from "#src/app/core/demo-data/create-entity-of-type.js";

test("Import children with entity reference, date and enum column mappings", async ({
  page,
}) => {
  const users = generateUsers();

  // Create School entities that can be referenced during import
  const school1 = createEntityOfType("School", "school-1");
  school1["name"] = "Springfield Elementary";

  const school2 = createEntityOfType("School", "school-2");
  school2["name"] = "Shelbyville Academy";

  await loadApp(page, [...users, school1, school2]);

  // Navigate to the Import page
  await page.getByRole("navigation").getByText("Import").click();
  await expect(page.getByText("Select a .csv file")).toBeVisible();

  // Step 1: Upload a CSV file
  const csvContent = [
    "Name,Date of Birth,Gender,School",
    "Alice Miller,15.03.2010,Female,Springfield Elementary",
    "Bob Smith,22.07.2012,Male,Shelbyville Academy",
    "Charlie Lee,01.11.2009,Non-binary / third gender,Springfield Elementary",
  ].join("\n");

  // Upload via the hidden file input
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles({
    name: "test-children.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(csvContent),
  });

  await expect(page.getByText("3 rows detected")).toBeVisible();

  // Click Continue to proceed to Step 2
  await page.getByRole("button", { name: "Continue" }).click();

  // Step 2: Select entity type "Child"
  await expect(page.getByText("Select the import target type")).toBeVisible();
  await page.getByRole("textbox", { name: "Import as" }).fill("Child");
  await page.getByRole("option", { name: "Child" }).click();

  await argosScreenshot(page, "import-step2-entity-type-selected");

  // Click Continue to proceed to Step 3 (Column Mapping)
  await page.getByRole("button", { name: "Continue" }).click();

  // Step 3: Map columns to entity fields
  // Note: The auto-mapping service matches columns by label, so:
  //   "Name" → name, "Date of Birth" → dateOfBirth, "Gender" → gender
  //   "School" does NOT auto-map (label is "Linked School")
  await expect(
    page.getByText("Define which columns / fields will be imported"),
  ).toBeVisible();

  // --- "Name" column is auto-mapped to "Name" field ---
  // --- "Date of Birth" column is auto-mapped to "Date of birth" field ---
  // Configure date format for the Date of Birth column
  const dobRow = page
    .locator("app-edit-import-column-mapping")
    .filter({ hasText: "Date of Birth" });
  await dobRow.getByRole("button", { name: "Configure value mapping" }).click();

  const dateDialog = page.getByRole("dialog");
  await expect(dateDialog).toBeVisible();

  // Enter the date format matching our CSV data
  await dateDialog.getByLabel("Date format").fill("DD.MM.YYYY");

  // Verify the parsed preview shows correct dates
  await expect(dateDialog.getByText("15.03.2010")).toBeVisible();

  await argosScreenshot(page, "import-date-format-dialog");

  await dateDialog.getByRole("button", { name: "Save & Close" }).click();
  await expect(dateDialog).not.toBeVisible();

  // --- "Gender" column is auto-mapped to "Gender" field (configurable-enum) ---
  // Configure enum value mapping
  const genderRow = page
    .locator("app-edit-import-column-mapping")
    .filter({ hasText: "Gender" });
  await genderRow
    .getByRole("button", { name: "Configure value mapping" })
    .click();

  const enumDialog = page.getByRole("dialog");
  await expect(enumDialog).toBeVisible();
  await expect(enumDialog.getByText("Imported values")).toBeVisible();

  // Map each imported gender value to the system's enum values
  const femaleRow = enumDialog
    .locator("tr")
    .filter({ hasText: "Female" })
    .first();
  await femaleRow.locator("mat-form-field").click();
  await page.getByRole("option", { name: "Female", exact: true }).click();

  const maleRow = enumDialog.locator("tr").filter({ hasText: /^Male/ });
  await maleRow.locator("mat-form-field").click();
  await page.getByRole("option", { name: "Male", exact: true }).click();

  const nonBinaryRow = enumDialog
    .locator("tr")
    .filter({ hasText: "Non-binary" });
  await nonBinaryRow.locator("mat-form-field").click();
  await page.getByRole("option", { name: "Non-binary / third gender" }).click();

  await argosScreenshot(page, "import-enum-mapping-dialog");

  await enumDialog.getByRole("button", { name: "Save & Close" }).click();
  await expect(enumDialog).not.toBeVisible();

  // --- Map "School" column to "Linked School" field (entity reference) ---
  // This column is NOT auto-mapped, so we must select the field manually
  const schoolRow = page
    .locator("app-edit-import-column-mapping")
    .filter({ hasText: "School" });
  await schoolRow
    .getByRole("textbox", { name: "School" })
    .fill("Linked School");
  await page.getByRole("option", { name: "Linked School" }).click();

  // Configure entity reference matching - select which School property to match by
  await schoolRow.locator("mat-select").click();
  await page.getByRole("option", { name: "Name" }).click();

  await argosScreenshot(page, "import-step3-column-mapping-complete");

  // Click Continue to proceed to Step 4 (Review)
  await page.getByRole("button", { name: "Continue" }).click();

  // Step 4: Review & Import
  await expect(
    page.getByText("Review your mapped data to be imported"),
  ).toBeVisible();

  // Verify preview shows our 3 records
  await expect(page.getByText("Alice Miller")).toBeVisible();
  await expect(page.getByText("Bob Smith")).toBeVisible();
  await expect(page.getByText("Charlie Lee")).toBeVisible();

  // Verify entity references are resolved
  await expect(page.getByText("Springfield Elementary").first()).toBeVisible();

  await argosScreenshot(page, "import-step4-review-data");

  // Execute the import
  await page.getByRole("button", { name: "Start Import" }).click();

  // Confirm the import in the summary dialog
  const confirmDialog = page.getByRole("dialog");
  await expect(
    confirmDialog.getByText("3 records will be imported"),
  ).toBeVisible();
  await confirmDialog
    .getByRole("button", { name: "Confirm & Run Import" })
    .click();

  // Wait for import to complete and dialog to close
  await expect(confirmDialog).not.toBeVisible({ timeout: 15_000 });

  // After import completes, the workflow resets (re-navigates to /import)
  // Navigate to Children list to verify imported records
  await page.getByRole("navigation").getByText("Children").click();
  await expect(page.getByText("Alice Miller")).toBeVisible();
  await expect(page.getByText("Bob Smith")).toBeVisible();
  await expect(page.getByText("Charlie Lee")).toBeVisible();
});
