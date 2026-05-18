import { argosScreenshot, expect, loadApp, test } from "#e2e/fixtures.js";

// ---------------------------------------------------------------------------
// Helper: navigate from the Children list into the admin entity config screen
// ---------------------------------------------------------------------------
// Clicking "Configure Data Structure" from a list view always opens ?mode=list.
// This helper always clicks the target section nav item explicitly so the correct view is shown.
const navigateToChildAdminConfig = async (
  page: Parameters<typeof loadApp>[0],
  section: "details" | "list" | "general" = "details",
) => {
  await page.getByRole("navigation").getByText("Children").click();
  await page.locator("button[mat-icon-button][color='primary']").click();
  await page.getByText("Configure Data Structure").click();
  await page.waitForLoadState("networkidle");
  await expect(page.getByText("Configuring data structure for")).toBeVisible();

  if (section === "details") {
    await page.getByText("Details View & Fields").click();
  } else if (section === "list") {
    await page.getByText("List View").click();
  } else if (section === "general") {
    await page.getByText("General Settings").click();
  }
  await page.waitForLoadState("networkidle");
};

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

  await dialog.getByRole("tab", { name: "Advanced Options" }).click();

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

  await nameField.scrollIntoViewIfNeeded();
  await nameField.hover();
  await expect(editFieldButton).toBeVisible();
  await editFieldButton.click();

  await expect(dialog).toBeVisible();
  await dialog.getByRole("tab", { name: "Advanced Options" }).click();
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
  await dialog.getByRole("tab", { name: "Advanced Options" }).click();

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
      await expect(input).toHaveValue(testMappings[i]);
    }
  }

  await argosScreenshot(page, "automation-mappings-filled");

  // Click Save button to save the automation rule
  await page.getByRole("button", { name: "Save" }).first().click();

  await argosScreenshot(page, "automation-rule-saved");

  // Now back in the main field configuration dialog, click Apply button
  await page.getByRole("button", { name: "Apply" }).first().click();
  // Wait for the automation sub-dialog to close before saving.
  await expect(page.locator("mat-dialog-container").nth(1)).not.toBeVisible();

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

// ---------------------------------------------------------------------------
// List View – Filters CRUD
// Default Child list-view filters: "Center" (center) and "School" (schoolId)
// Action: add "Gender" filter, remove "School" filter
// ---------------------------------------------------------------------------
test("Admin: edit list view filters (add, remove, verify after save)", async ({
  page,
}) => {
  await loadApp(page, []);
  await navigateToChildAdminConfig(page, "list");

  // Remove the "School" filter (field id "schoolId", label "Linked School" / visible as "School" in filter bar)
  await page
    .locator(".filter-field")
    .filter({ hasText: "School" })
    .locator(".remove-icon")
    .click();
  await expect(
    page.locator(".filter-field").filter({ hasText: "School" }),
  ).not.toBeVisible();

  // Add "Gender" filter via the entity-fields-menu below the existing filters
  const filterAddArea = page
    .locator(".table-content-preview")
    .filter({ hasText: "Add Filter" });
  await filterAddArea.locator("mat-form-field").click();
  await page.getByRole("option", { name: "Gender" }).click();

  // Verify Gender filter now appears in the filter list
  await expect(
    page.locator(".filter-field").filter({ hasText: "Gender" }),
  ).toBeVisible();

  // Save
  await page.getByRole("button", { name: "Save" }).first().click();
  await expect(page.getByText("Configuration updated")).toBeVisible();

  // Re-open List View config and verify persistence
  await navigateToChildAdminConfig(page, "list");
  await expect(
    page.locator(".filter-field").filter({ hasText: "Gender" }),
  ).toBeVisible();
  await expect(
    page.locator(".filter-field").filter({ hasText: "School" }),
  ).not.toBeVisible();

  await argosScreenshot(page, "admin-list-view-filters-after-save");
});

// ---------------------------------------------------------------------------
// List View – Column-group tabs CRUD
// Default tabs: "Basic Info", "School Info", "Status", "Health"
// Action: add new tab "E2E Tab", rename "Status" → "E2E Status", remove "Health"
// ---------------------------------------------------------------------------
test("Admin: edit list view column-group tabs (add, rename, remove, verify after save)", async ({
  page,
}) => {
  await loadApp(page, []);
  await navigateToChildAdminConfig(page, "list");

  // --- ADD a new tab via the "+" button ---
  // The add-tab button uses matTooltip (not title attr); its accessible name is "add" (from fa-icon aria-label)
  await page.getByRole("button", { name: "add" }).click();
  // New tab is auto-selected; its rename input (placeholder "(no title)") is shown in the tab header
  await page
    .locator("mat-tab-header")
    .getByPlaceholder("(no title)")
    .fill("E2E Tab");

  // --- RENAME "Status" tab → "E2E Status" ---
  // Click the non-selected "Status" tab label to select it
  await page.getByRole("tab", { name: "Status" }).click();
  const renameInput = page
    .locator("mat-tab-header")
    .getByPlaceholder("(no title)");
  await renameInput.clear();
  await renameInput.fill("E2E Status");

  // --- REMOVE "Health" tab ---
  // Select the "Health" tab so that its remove button (app-admin-section-header) appears.
  // Use text-scoped locators: after many fill() calls the tab accessible-names may be
  // temporarily absent due to Angular signal re-renders, so don't rely on getByRole+name.
  await page
    .locator("mat-tab-header")
    .getByText("Health", { exact: true })
    .click();
  // Wait for admin-section-header (and its remove button) to render for the now-selected tab
  const tabRemoveBtn = page.locator(
    "app-admin-section-header button.group-remove-button",
  );
  await expect(tabRemoveBtn).toBeVisible();
  await tabRemoveBtn.click();
  // admin-section-header.removeSection() shows a ConfirmationDialog; click "Yes" to confirm
  await page.getByRole("dialog").getByRole("button", { name: "Yes" }).click();

  // Verify intermediate state using text (accessible-names may be empty after signal updates)
  await expect(
    page.locator("mat-tab-header").getByText("E2E Tab"),
  ).toBeVisible();
  await expect(
    page.locator("mat-tab-header").getByText("E2E Status"),
  ).toBeVisible();
  await expect(
    page.locator("mat-tab-header").getByText("Health", { exact: true }),
  ).not.toBeVisible();

  // Save – use CSS selector (accessible name of the button may be temporarily empty)
  await page.locator(".save-buttons button").first().click();
  await expect(page.getByText("Configuration updated")).toBeVisible();

  // Re-open and verify persistence
  await navigateToChildAdminConfig(page, "list");
  await expect(
    page.locator("mat-tab-header").getByText("E2E Tab"),
  ).toBeVisible();
  await expect(
    page.locator("mat-tab-header").getByText("E2E Status"),
  ).toBeVisible();
  await expect(
    page.locator("mat-tab-header").getByText("Health", { exact: true }),
  ).not.toBeVisible();

  await argosScreenshot(page, "admin-list-view-tabs-after-save");
});

// ---------------------------------------------------------------------------
// List View – Columns within a tab CRUD
// "Basic Info" tab columns include "Email". "Date of birth" is not in this tab.
// Action: remove "Email" column, add "Date of birth" column
// ---------------------------------------------------------------------------
test("Admin: edit list view columns (add, remove, verify after save)", async ({
  page,
}) => {
  await loadApp(page, []);
  await navigateToChildAdminConfig(page, "list");

  // "Basic Info" is the first (default-selected) tab – no click needed

  // Remove "Email" column
  await page
    .locator(".default-item")
    .filter({ hasText: "Email" })
    .locator(".remove-icon")
    .click();
  await expect(
    page.locator(".default-item").filter({ hasText: "Email" }),
  ).not.toBeVisible();

  // Add "Date of birth" column via the entity-fields-menu below the columns list
  const columnAddArea = page
    .locator(".table-content-preview")
    .filter({ hasText: "Add columns" });
  await columnAddArea.locator("mat-form-field").click();
  await page.getByRole("option", { name: "Date of birth" }).click();

  // Verify "Date of birth" now appears as a column
  await expect(
    page.locator(".default-item").filter({ hasText: "Date of birth" }),
  ).toBeVisible();

  // Save
  await page.getByRole("button", { name: "Save" }).first().click();
  await expect(page.getByText("Configuration updated")).toBeVisible();

  // Re-open, navigate to "Basic Info" tab, verify persistence
  await navigateToChildAdminConfig(page, "list");
  // "Basic Info" is selected by default
  await expect(
    page.locator(".default-item").filter({ hasText: "Date of birth" }),
  ).toBeVisible();
  await expect(
    page.locator(".default-item").filter({ hasText: "Email" }),
  ).not.toBeVisible();

  await argosScreenshot(page, "admin-list-view-columns-after-save");
});

// ---------------------------------------------------------------------------
// Details View – Panels & Sections CRUD
// Actions:
//   - Add new panel tab "E2E Panel" and add a "Form Fields Section" to it
//   - Navigate to "Education" panel and remove the "ASER Results" section
// ---------------------------------------------------------------------------
test("Admin: edit details view panels and sections (add, remove, verify after save)", async ({
  page,
}) => {
  await loadApp(page, []);
  await navigateToChildAdminConfig(page, "details");

  // --- ADD new panel tab "E2E Panel" ---
  // The add-tab button uses matTooltip (not title attr); its accessible name is "add" (from fa-icon aria-label).
  // Use exact:true to avoid matching the "Add Section" button (name: "add element Add Section") in strict mode.
  await page
    .locator("mat-tab-header")
    .getByRole("button", { name: "add" })
    .click();
  await page
    .locator("mat-tab-header")
    .getByPlaceholder("(no title)")
    .fill("E2E Panel");

  // --- ADD a "Form Fields Section" inside the new panel ---
  // With [preserveContent]="true", each panel has an "Add Section" button in the DOM.
  // E2E Panel is the last tab, so its button is last.
  await page.locator("button.section-add-button").last().click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("combobox").click(); // open the widget-type select
  await page.getByRole("option", { name: "Form Fields Section" }).click();
  // Dialog auto-closes on selection; wait for it to disappear
  await expect(dialog).not.toBeVisible();

  // Verify the new section appeared in "E2E Panel".
  // With [preserveContent]="true" multiple panels from other tabs are in DOM; use :visible to
  // target only the active tab's panels.
  await expect(page.locator("mat-expansion-panel:visible")).toBeVisible();

  // --- REMOVE "ASER Results" section from the "Education" panel ---
  // After adding E2E Panel (last tab, auto-selected), the tab header scrolls right and
  // "Education" is pushed outside the viewport. Use JS click() to bypass the overflow.
  await page.evaluate(() => {
    const tabs = Array.from(
      document.querySelectorAll("mat-tab-header .mat-mdc-tab"),
    );
    const edu = tabs.find(
      (t) => (t as HTMLElement).innerText.trim() === "Education",
    );
    if (edu) (edu as HTMLElement).click();
  });
  // The "ASER Results" panel's textContent uniquely contains "Literacy Test"
  // (the entity-type label shown in the panel body's mat-select for Aser entities).
  const aserPanel = page
    .locator("mat-expansion-panel")
    .filter({ hasText: "Literacy Test" });
  await aserPanel.locator(".group-remove-button").click();
  // admin-section-header.removeSection() shows a ConfirmationDialog; click "Yes" to confirm
  await page.getByRole("dialog").getByRole("button", { name: "Yes" }).click();
  // Verify "ASER Results" section is gone
  await expect(aserPanel).not.toBeAttached();

  // Save
  await page.getByRole("button", { name: "Save" }).first().click();
  await expect(page.getByText("Configuration updated")).toBeVisible();

  // Re-open and verify persistence
  await navigateToChildAdminConfig(page, "details");
  await expect(
    page.locator("mat-tab-header").getByText("E2E Panel"),
  ).toBeVisible();
  await page
    .locator("mat-tab-header")
    .getByText("E2E Panel", { exact: true })
    .click();
  await expect(
    page.locator("mat-expansion-panel:visible").first(),
  ).toBeVisible();

  await page.evaluate(() => {
    const tabs = Array.from(
      document.querySelectorAll("mat-tab-header .mat-mdc-tab"),
    );
    const edu = tabs.find(
      (t) => (t as HTMLElement).innerText.trim() === "Education",
    );
    if (edu) (edu as HTMLElement).click();
  });
  await expect(
    page.locator("mat-expansion-panel").filter({ hasText: "Literacy Test" }),
  ).not.toBeAttached();

  await argosScreenshot(page, "admin-details-view-panels-after-save");
});

// ---------------------------------------------------------------------------
// Details View – Field editor: change label via the Edit Field dialog
// Action: edit the "Name" field label (append " (edited)"), apply, save, verify
// ---------------------------------------------------------------------------
test("Admin: edit details view field label (apply, save, verify after save)", async ({
  page,
}) => {
  await loadApp(page, []);
  await navigateToChildAdminConfig(page, "details");

  // Hover over the "Name" field to reveal the "Edit Field" button.
  // The admin-form-field div contains "Edit Field  Name *" so we can't use exact /^Name$/ on the div.
  // Instead: find the mat-form-field whose label text is "Name", then walk up to the admin-form-field ancestor.
  const nameFormFieldLabel = page.locator("mat-form-field").getByText("Name");
  const nameField = nameFormFieldLabel.locator(
    'xpath=ancestor::div[contains(@class,"admin-form-field")]',
  );
  await nameField.scrollIntoViewIfNeeded();
  await nameField.hover();

  const editButton = nameField.getByRole("button", { name: "Edit Field" });
  await expect(editButton).toBeVisible();
  await editButton.click();

  const fieldDialog = page.locator("mat-dialog-container");
  await expect(fieldDialog).toBeVisible();

  // Change the field label.
  // getByLabel("Label") finds 3 inputs (Label, Label (short), checkbox); use getByRole + exact.
  const labelInput = fieldDialog.getByRole("textbox", {
    name: "Label",
    exact: true,
  });
  await labelInput.clear();
  await labelInput.fill("Name (edited)");

  await fieldDialog.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(fieldDialog).not.toBeVisible();

  // Verify label updated in the form preview
  await expect(
    page
      .locator('div[class*="admin-form-field"]')
      .filter({ hasText: "Name (edited)" }),
  ).toBeVisible();

  // Save
  await page.getByRole("button", { name: "Save" }).first().click();
  await expect(page.getByText("Configuration updated")).toBeVisible();

  // Re-open Details View and verify the updated label persists
  await navigateToChildAdminConfig(page);
  await expect(
    page
      .locator('div[class*="admin-form-field"]')
      .filter({ hasText: "Name (edited)" }),
  ).toBeVisible();

  await argosScreenshot(page, "admin-details-view-field-edited");
});

// ---------------------------------------------------------------------------
// General Settings – Update label, plural label, and tooltip config; verify
// ---------------------------------------------------------------------------
test("Admin: edit general settings (label, tooltip, verify after save)", async ({
  page,
}) => {
  await loadApp(page, []);
  await navigateToChildAdminConfig(page, "general");

  // Change "Label" field (first mat-form-field with an exact "Label" mat-label)
  const labelFormField = page
    .locator("mat-form-field")
    .filter({ has: page.locator("mat-label", { hasText: /^Label$/ }) })
    .first();
  await labelFormField.getByRole("textbox").clear();
  await labelFormField.getByRole("textbox").fill("Participant");

  // Change "Label (Plural)"
  const labelPluralFormField = page
    .locator("mat-form-field")
    .filter({ has: page.locator("span", { hasText: "Label (Plural)" }) })
    .first();
  await labelPluralFormField.getByRole("textbox").clear();
  await labelPluralFormField.getByRole("textbox").fill("Participants");

  // Tooltip Configuration panel: Child already has toBlockDetailsAttributes set,
  // so showTooltipDetails is true and the panel starts EXPANDED. Do NOT click the header.
  const tooltipPanel = page
    .locator("mat-expansion-panel")
    .filter({ hasText: "Tooltip Configuration" });
  await expect(tooltipPanel).toHaveClass(/mat-expanded/);
  // Select "Project Number" as the tooltip title field.
  // The first "Select Record Field" placeholder input in the tooltip panel is the Title Field.
  await tooltipPanel.getByPlaceholder("Select Record Field").first().click();
  await page.getByRole("option", { name: "Project Number" }).click();

  // Save
  await page.getByRole("button", { name: "Save" }).first().click();
  await expect(page.getByText("Configuration updated")).toBeVisible();

  // Re-open General Settings and verify persistence.
  // After saving the label change ("Child" → "Participant"), the navigation now shows "Participants"
  // instead of "Children", so we navigate directly via URL to avoid the renamed nav item.
  // Re-open General Settings and verify persistence.
  // After save(), location.back() returns to the entity LIST (now labeled "Participants"
  // since the label was changed). Navigate to admin config via the new nav label.
  await page.getByRole("navigation").getByText("Participants").click();
  await page.locator("button[mat-icon-button][color='primary']").click();
  await page.getByText("Configure Data Structure").click();
  await page.waitForLoadState("networkidle");
  await page.getByText("General Settings").click();
  await expect(page.locator("[formcontrolname='label']")).toBeVisible({
    timeout: 10000,
  });

  await expect(page.locator("[formcontrolname='label']")).toHaveValue(
    "Participant",
  );
  await expect(page.locator("[formcontrolname='labelPlural']")).toHaveValue(
    "Participants",
  );

  await argosScreenshot(page, "admin-general-settings-after-save");
});

test("Admin: mark a field as required and verify save persists the validator", async ({
  page,
}) => {
  await loadApp(page, []);

  // Navigate to Children list and open Configure Data Structure.
  await page.getByRole("navigation").getByText("Children").click();
  await page.locator("button[mat-icon-button][color='primary']").click();
  await page.getByText("Configure Data Structure").click();

  await page.waitForLoadState("networkidle");
  await expect(page.getByText("Configuring data structure for")).toBeVisible();

  await page.getByText("Details View & Fields").click();
  await page.waitForLoadState("networkidle");

  // Locate the Phone field's admin card and open the Edit Field dialog.
  // The label "Phone" matches a mat-form-field; the surrounding wrapper has
  // the Edit Field button (revealed on hover).
  const phoneTextbox = page.locator("mat-form-field").getByText("Phone");
  await expect(phoneTextbox).toBeVisible();
  const phoneField = phoneTextbox.locator(
    'xpath=ancestor::div[contains(@class,"admin-form-field")]',
  );
  await phoneField.scrollIntoViewIfNeeded();
  await phoneField.hover();

  await phoneField.getByRole("button", { name: "Edit Field" }).click();

  const dialog = page.locator("mat-dialog-container");
  await expect(dialog).toBeVisible();

  // Open the Validation tab and tick the Required Field checkbox.
  await dialog.getByRole("tab", { name: "Validation" }).click();
  const requiredCheckbox = dialog.getByRole("checkbox", {
    name: /Required Field/,
  });
  await requiredCheckbox.check();
  await expect(requiredCheckbox).toBeChecked();

  await dialog.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(dialog).not.toBeVisible();

  // Save the configuration to the backend to test true persistence.
  await page.getByRole("button", { name: "Save" }).first().click();
  await expect(page.getByText("Configuration updated")).toBeVisible();

  // Navigate away and back to prove the setting survived the full save round-trip.
  await page.getByRole("navigation").getByText("Children").click();
  await page.locator("button[mat-icon-button][color='primary']").click();
  await page.getByText("Configure Data Structure").click();
  await page.waitForLoadState("networkidle");
  await page.getByText("Details View & Fields").click();
  await page.waitForLoadState("networkidle");

  // Re-open the same field to verify the Required setting survived persistence.
  await phoneField.scrollIntoViewIfNeeded();
  await phoneField.hover();
  await phoneField.getByRole("button", { name: "Edit Field" }).click();
  await expect(dialog).toBeVisible();
  await dialog.getByRole("tab", { name: "Validation" }).click();
  await expect(
    dialog.getByRole("checkbox", { name: /Required Field/ }),
  ).toBeChecked();
});

const NEW_SITE_NAME = "E2E Site Test";

test("Admin can change the site name and the topbar reflects it", async ({
  page,
}) => {
  await loadApp(page);

  // Navigate to Admin Overview then click the Site Settings card.
  await page.getByRole("navigation").getByText("Admin").click();
  await page.getByRole("navigation").getByText("Admin Overview").click();
  await page.getByText("Site Settings", { exact: true }).click();

  // Edit mode — change the Site Name field.
  await page.getByRole("button", { name: "Edit" }).click();
  await page
    .locator("#entity-field__siteName")
    .getByRole("textbox")
    .fill(NEW_SITE_NAME);

  await argosScreenshot(page, "site-settings-edited");

  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByRole("button", { name: "Edit" })).toBeVisible();

  // Topbar logo link uses the site name as accessible text.
  await expect(
    page.getByRole("link", { name: NEW_SITE_NAME }).first(),
  ).toBeVisible({ timeout: 10_000 });
});
