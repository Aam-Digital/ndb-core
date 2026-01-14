import { argosScreenshot, expect, loadApp, test } from "#e2e/fixtures.js";

test("Edit existing Name field to set and reset default value", async ({
  page,
}) => {
  await loadApp(page, []);

  // Navigate to Children list and access admin configuration
  await page.getByRole("navigation").getByText("Children").click();
  await page.locator("button[mat-icon-button][color='primary']").click();
  await page.getByText("Configure Data Structure").click();

  await page.waitForLoadState("networkidle");
  await expect(page.getByText("Configuring data structure for")).toBeVisible();

  await page.getByText("Details View & Fields").click();
  await page.waitForLoadState("networkidle");
  await expect(page.getByText("Details View & Fields")).toBeVisible();

  await argosScreenshot(page, "admin-details");

  const nameTextbox = page.locator("mat-form-field").getByText("Name");
  await expect(nameTextbox).toBeVisible();

  const nameField = nameTextbox.locator(
    'xpath=ancestor::div[contains(@class,"admin-form-field")]',
  );
  await nameField.scrollIntoViewIfNeeded();
  await nameField.hover();

  const editFieldButton = nameField.getByRole("button", { name: "Edit Field" });
  await expect(editFieldButton).toBeVisible();
  await editFieldButton.click();

  const dialog = page.locator("mat-dialog-container");
  await expect(dialog).toBeVisible();

  await argosScreenshot(page, "admin-details-edit-field");

  await dialog
    .getByRole("tab", { name: "Advanced Options & Validation" })
    .click();

  const defaultValueSection = dialog.locator("app-admin-default-value");
  const staticModeToggle = defaultValueSection
    .locator("mat-button-toggle-group mat-button-toggle")
    .first();
  await staticModeToggle.click();

  const defaultValueControl = defaultValueSection
    .locator("input, textarea")
    .first();
  await expect(defaultValueControl).toBeVisible();

  const newDefaultValue = "E2E Default Name";

  await defaultValueControl.fill(newDefaultValue);

  await argosScreenshot(page, "admin-details-edit-field-advanced-options");

  await dialog.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(dialog).not.toBeVisible();

  await page.waitForTimeout(500);
  await nameField.scrollIntoViewIfNeeded();
  await nameField.hover();
  await editFieldButton.click();

  await expect(dialog).toBeVisible();
  await dialog
    .getByRole("tab", { name: "Advanced Options & Validation" })
    .click();
  await expect(defaultValueControl).toHaveValue(newDefaultValue);

  const clearDefaultButton = defaultValueSection.locator(
    "button[mat-icon-button][matIconSuffix]",
  );
  await clearDefaultButton.click();
  await expect(defaultValueControl).toHaveValue("");
  await dialog.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(dialog).not.toBeVisible();

  await page.getByRole("button", { name: "Save" }).first().click();
  await expect(page.getByText("Configuration updated")).toBeVisible();
});

test("Configure automated status update and verify UI", async ({ page }) => {
  await loadApp(page, []);

  // Navigate to Children list and access admin configuration
  await page.getByRole("navigation").getByText("Children").click();
  await page.locator("button[mat-icon-button][color='primary']").click();
  await page.getByText("Configure Data Structure").click();

  await page.waitForLoadState("networkidle");
  await expect(page.getByText("Configuring data structure for")).toBeVisible();

  // Navigate to Details View & Fields
  await page.getByText("Details View & Fields").click();
  await page.waitForLoadState("networkidle");

  // Look for the Name field specifically
  const nameTextbox = page.locator("mat-form-field").getByText("Name");
  await expect(nameTextbox).toBeVisible();

  const nameField = nameTextbox.locator(
    'xpath=ancestor::div[contains(@class,"admin-form-field")]',
  );
  await nameField.scrollIntoViewIfNeeded();
  await nameField.hover();

  // Click edit button for Name field
  const editFieldButton = nameField.getByRole("button", { name: "Edit Field" });
  await expect(editFieldButton).toBeVisible();
  await editFieldButton.click();

  const dialog = page.locator("mat-dialog-container");
  await expect(dialog).toBeVisible();

  // Navigate to Advanced Options tab
  await dialog
    .getByRole("tab", { name: "Advanced Options & Validation" })
    .click();

  // Look for default value configuration
  const defaultValueSection = dialog.locator("app-admin-default-value");
  await expect(defaultValueSection).toBeVisible();

  const automatedModeSection = defaultValueSection.locator(
    "mat-button-toggle-group",
  );
  await expect(automatedModeSection).toBeVisible();

  // Click the automated rule option (
  const automatedRuleToggle = automatedModeSection
    .locator("mat-button-toggle")
    .nth(2);
  await expect(automatedRuleToggle).toBeVisible();
  await automatedRuleToggle.click();

  // Look for entity dropdown that should appear after selecting automated rule
  const entityDropdown = dialog.locator("mat-select").first();
  await expect(entityDropdown).toBeVisible();

  // Click the dropdown to see entity options
  await entityDropdown.click();
  await argosScreenshot(page, "entity-dropdown-options");

  // Select Note > field option from the dropdown
  const noteOption = page
    .locator("mat-option")
    .filter({ hasText: /Note/i })
    .first();
  await expect(noteOption).toBeVisible();
  await noteOption.click();

  // Check if automation configuration dialog appears
  const automationDialog = page.locator("mat-dialog-container").nth(1);

  // Look for the source value field selector
  const sourceValueFieldDropdown =
    automationDialog.getByText(/Source value field/);
  await expect(sourceValueFieldDropdown).toBeVisible();

  // Click the field select to open dropdown
  await sourceValueFieldDropdown.click();

  // Look for "status" option in the source value field
  const statusOption = page
    .locator("mat-option")
    .filter({
      hasText: /status/i,
    })
    .first();

  await statusOption.click();

  // enable the value mapping toggle
  const mappingToggle = automationDialog.locator("mat-slide-toggle");
  await mappingToggle.click();

  // Fill in the name mappings for each status value
  const mappingSection = automationDialog.locator(".mapping-grid");
  await expect(mappingSection).toBeVisible();

  const entityFieldEdits = mappingSection.locator("app-entity-field-edit");
  const nameInputs = entityFieldEdits.locator("input");

  // Fill in test values for each status mapping
  const testMappings = [
    "Solved Case Name",
    "Follow-up Case Name",
    "Urgent Case Name",
  ];

  const inputCount = await nameInputs.count();
  for (let i = 0; i < Math.min(inputCount, testMappings.length); i++) {
    const input = nameInputs.nth(i);
    if (await input.isVisible()) {
      await input.fill(testMappings[i]);
      await page.waitForTimeout(500);
    }
  }

  await argosScreenshot(page, "automation-mappings-filled");

  // Click Save button to save the automation rule
  await page.getByRole("button", { name: "Save" }).first().click();

  await argosScreenshot(page, "automation-rule-saved");

  // Now back in the main field configuration dialog, click Apply button
  await page.getByRole("button", { name: "Apply" }).first().click();

  await page.waitForTimeout(1000);

  // Save the overall configuration changes
  await page.getByRole("button", { name: "Save" }).first().click();
  await expect(page.getByText("Configuration updated")).toBeVisible();
});

/*
 * todo: somehow drag and drop does not work in the e2e - investigate
 */

// test("Add new field through Admin UI with default value", async ({ page }) => {
//   const users = generateUsers();
//   const children = range(3).map(() => generateChild());

//   await loadApp(page, [...users, ...children]);

//   // Navigate to Children list
//   await page.getByRole("navigation").getByText("Children").click();

//   // Check if we can see the 3-dot menu at all
//   await expect(
//     page.locator("button[mat-icon-button][color='primary']"),
//   ).toBeVisible();

//   // Click on the 3-dot menu (more options) button
//   await page.locator("button[mat-icon-button][color='primary']").click();

//   // Check if "Configure Data Structure" option is available
//   await expect(page.getByText("Configure Data Structure")).toBeVisible();

//   // Click on "Configure Data Structure" option from the dropdown menu
//   await page.getByText("Configure Data Structure").click();

//   // Wait for the admin configuration page to load
//   await page.waitForLoadState("networkidle");
//   await expect(page.getByText("Configuring data structure for")).toBeVisible();

//   // Take a screenshot to see the current state
//   await argosScreenshot(page, "admin-config-page-loaded");

//   // Verify we're on the correct page
//   await expect(page.getByText("Details View & Fields")).toBeVisible();

//   await argosScreenshot(page, "admin-field-configuration-accessible");

// });
