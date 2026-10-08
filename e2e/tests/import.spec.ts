import { argosScreenshot, expect, loadApp, test } from "#e2e/fixtures.js";
import { generateUsers } from "#src/app/core/user/demo-user-generator.service.js";
import { createEntityOfType } from "#src/app/core/demo-data/create-entity-of-type.js";
import { UpdateMetadata } from "#src/app/core/entity/model/update-metadata.js";

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
  await expect(page.getByText("Select a .xlsx or .csv file")).toBeVisible();

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
  // Automatically mapped columns keep their dialog closed and are only marked as
  // unconfigured, so the date format has to be opened from the row itself.
  const dobRow = page
    .locator("app-edit-import-column-mapping")
    .filter({ hasText: "Date of Birth" });
  await dobRow.getByRole("button", { name: "Configure value mapping" }).click();

  const dateDialog = page.getByRole("dialog");
  await expect(dateDialog.getByLabel("Date format")).toBeVisible();

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

  // The import status column shows that every row creates a new record
  await expect(
    page.getByRole("columnheader", { name: "Import Status" }),
  ).toBeVisible();
  await expect(page.getByRole("cell", { name: "Creating" })).toHaveCount(3);

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

test("Import a multi-value entity reference from a single comma-separated column", async ({
  page,
}) => {
  const users = generateUsers();

  // Two schools to be referenced by name from one comma-separated cell
  const school1 = createEntityOfType("School", "school-1");
  school1["name"] = "Springfield Elementary";
  const school2 = createEntityOfType("School", "school-2");
  school2["name"] = "Shelbyville Academy";

  await loadApp(page, [...users, school1, school2]);

  await page.getByRole("navigation").getByText("Import").click();
  await expect(page.getByText("Select a .xlsx or .csv file")).toBeVisible();

  // "Related Records" holds comma-separated school names; "RecordIds" a second
  // condition mapped to the same field (multi-column matching) holding the internal ids
  const csvContent = [
    "Subject,Related Records,RecordIds",
    'Joint school meeting,"Springfield Elementary, Shelbyville Academy","School:school-1, School:school-2"',
  ].join("\n");

  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles({
    name: "multi-value-note.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(csvContent),
  });

  await expect(page.getByText("1 rows detected")).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();

  // Step 2: import as Note (its "Related Records" field is a multi-value entity
  // reference, linking Child and School records)
  await expect(page.getByText("Select the import target type")).toBeVisible();
  await page.getByRole("textbox", { name: "Import as" }).fill("Note");
  await page.getByRole("option", { name: "Note", exact: true }).click();
  await page.getByRole("button", { name: "Continue" }).click();

  // Step 3: "Subject" and "Related Records" auto-map by label; match the records
  // by name, and map a second "RecordIds" column onto the same field matched by id
  // (multi-column matching)
  await expect(
    page.getByText("Define which columns / fields will be imported"),
  ).toBeVisible();

  const relatedRow = page
    .locator("app-edit-import-column-mapping")
    .filter({ hasText: /^Related Records/ });
  await relatedRow.locator("mat-select").click();
  // a property shared by the linkable types is offered once, hinting at both types
  await page.getByRole("option", { name: /^Name\s+Child, School$/ }).click();

  const recordIdsRow = page
    .locator("app-edit-import-column-mapping")
    .filter({ hasText: "RecordIds" });
  await recordIdsRow
    .getByRole("textbox", { name: "RecordIds" })
    .fill("Related Records");
  await page
    .getByRole("option", { name: "Related Records", exact: true })
    .click();
  await recordIdsRow.locator("mat-select").click();
  await page.getByRole("option", { name: /internal unique/i }).click();

  // multi-column matching indicator is shown on the mapping step

  await page.getByRole("button", { name: "Continue" }).click();

  // Step 4: both comma-separated names resolve to their records
  await expect(
    page.getByText("Review your mapped data to be imported"),
  ).toBeVisible();
  await expect(page.getByText("Springfield Elementary")).toBeVisible();
  await expect(page.getByText("Shelbyville Academy")).toBeVisible();

  await page.getByRole("button", { name: "Start Import" }).click();
  const confirmDialog = page.getByRole("dialog");
  await expect(
    confirmDialog.getByText("1 records will be imported"),
  ).toBeVisible();
  await confirmDialog
    .getByRole("button", { name: "Confirm & Run Import" })
    .click();

  // import runs to completion
  await expect(page.getByText("Import completed")).toBeVisible({
    timeout: 15_000,
  });

  // open the created note and confirm both schools are linked on the saved record.
  // the imported note has no date, so clear the list's default date-range filter first.
  await page.getByRole("navigation").getByText("Notes").click();
  await page.getByRole("button", { name: "Reset date filter" }).click();
  await page.getByRole("cell", { name: "Joint school meeting" }).click();
  const noteDetails = page.getByRole("dialog");
  await expect(noteDetails).toBeVisible();
  await expect(noteDetails.getByText("Springfield Elementary")).toBeVisible();
  await expect(noteDetails.getByText("Shelbyville Academy")).toBeVisible();
});

test("Import updates an existing record matched by a field and creates the others", async ({
  page,
}) => {
  const users = generateUsers();

  const existingChild = createEntityOfType("Child", "existing-child");
  existingChild["name"] = "Alice Miller";
  existingChild["projectNumber"] = "101";
  existingChild["phone"] = "555-0000";
  // like real records, the existing one has a creation date (new import rows don't)
  existingChild.created = new UpdateMetadata("demo", new Date("2024-06-01"));

  await loadApp(page, [...users, existingChild]);

  await page.getByRole("navigation").getByText("Import").click();
  await expect(page.getByText("Select a .xlsx or .csv file")).toBeVisible();

  // "101" matches the existing record, "102" is new
  const csvContent = [
    "Project Number,Name,Phone Number",
    "101,Alice Miller,555-0101",
    "102,Dave Brown,555-0102",
  ].join("\n");

  await page.locator('input[type="file"]').setInputFiles({
    name: "update-children.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(csvContent),
  });
  await expect(page.getByText("2 rows detected")).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();

  // Step 2: import as Child, matching existing records by their project number
  await expect(page.getByText("Select the import target type")).toBeVisible();
  await page.getByRole("textbox", { name: "Import as" }).fill("Child");
  await page.getByRole("option", { name: "Child" }).click();

  await page
    .getByText("Check/Update existing instead of creating new records")
    .click();
  await page
    .getByRole("textbox", { name: "Fields that identify a unique record" })
    .click();
  await page.getByRole("option", { name: "Project Number" }).click();
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: "Continue" }).click();

  // Step 3: all columns are auto-mapped by their label
  await expect(
    page.getByText("Define which columns / fields will be imported"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();

  // Step 4: the import status column shows which rows update an existing record
  await expect(
    page.getByText("Review your mapped data to be imported"),
  ).toBeVisible();
  await expect(
    page.getByRole("columnheader", { name: "Import Status" }),
  ).toBeVisible();
  // rows updating existing records are listed first (row 0 is the header row)
  const reviewRows = page.getByRole("row");
  await expect(reviewRows.nth(1)).toContainText("555-0101");
  await expect(reviewRows.nth(1).getByText("Updating")).toBeVisible();
  await expect(reviewRows.nth(2)).toContainText("555-0102");
  await expect(reviewRows.nth(2).getByText("Creating")).toBeVisible();

  await argosScreenshot(page, "import-review-update-existing");

  await page.getByRole("button", { name: "Start Import" }).click();
  const confirmDialog = page.getByRole("dialog");
  await expect(
    confirmDialog.getByText("2 records will be imported"),
  ).toBeVisible();
  await confirmDialog
    .getByRole("button", { name: "Confirm & Run Import" })
    .click();
  await expect(confirmDialog).not.toBeVisible({ timeout: 15_000 });

  // The existing record was updated instead of duplicated
  await page.getByRole("navigation").getByText("Children").click();
  await expect(page.getByRole("row", { name: /Dave Brown/ })).toBeVisible();
  await expect(page.getByRole("row", { name: /Alice Miller/ })).toHaveCount(1);
});
