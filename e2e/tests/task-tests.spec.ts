import { argosScreenshot, expect, loadApp, test } from "#e2e/fixtures.js";
import { generateUsers } from "#src/app/core/user/demo-user-generator.service.js";
import { generateChild } from "#src/app/child-dev-project/children/demo-data-generators/demo-child-generator.service.js";
import { Todo } from "#src/app/features/todos/model/todo.js";

const TASK_SUBJECT = "PLAN CAREER COUNSELLING";

test("Add a new task record to the list", async ({ page }) => {
  const users = generateUsers();
  const childAnandTrivedi = generateChild({ name: "Anand Trivedi" });
  const childAnandNehru = generateChild({ name: "Anand Nehru" });
  const childArunKapoor = generateChild({ name: "Arun Kapoor" });

  await loadApp(page, [
    ...users,
    childAnandTrivedi,
    childAnandNehru,
    childArunKapoor,
  ]);

  // When I click on Tasks from the Main Menu
  await page.getByRole("navigation").getByText("Tasks").click();

  // And I click on "Add New"
  await page.getByRole("button", { name: "Add New" }).click();

  const dialog = page.getByRole("dialog");

  // Then a new form is opened with the heading "Adding new Task"
  await expect(dialog.getByRole("heading", { name: "Adding new Task" })).toBeVisible();

  // Note: Angular Material floating labels do not expose an accessible name via
  // aria-labelledby in a way Playwright resolves with getByLabel(), so fields
  // are located by their mat-form-field element IDs (id="entity-field__<fieldId>").

  // Then I add the subject
  await page.locator("#entity-field__subject").getByRole("textbox").fill(TASK_SUBJECT);

  // Then I capture the deadline date (31.03.2026)
  await page.locator("#entity-field__deadline").getByRole("textbox").fill("31.03.2026");

  // And I capture the start date (20.02.2026)
  const startDateInput = page.locator("#entity-field__startDate").getByRole("textbox");
  await startDateInput.fill("20.02.2026");
  await startDateInput.blur();

  // And I capture the description
  await page
    .locator("#entity-field__description")
    .getByRole("textbox")
    .fill("Plan Career Counselling for class 4");

  // And the task is auto-assigned to the logged-in user "demo-admin"
  await expect(dialog.getByRole("row", { name: "demo-admin" })).toBeVisible();

  // And I add related records: Anand Trivedi, Anand Nehru, Arun Kapoor
  await page
    .locator("#entity-field__relatedEntities")
    .locator(".fa-caret-down")
    .click();
  await page.getByRole("option", { name: "Anand Trivedi" }).click();
  await page.getByRole("option", { name: "Anand Nehru" }).click();
  await page.getByRole("option", { name: "Arun Kapoor" }).click();
  await page.keyboard.press("Escape");

  // The repeat interval defaults to "does not repeat" (no interval),
  // which is already the correct state — no selection needed.

  // [screenshot] before saving
  await argosScreenshot(page, "task-form-before-save");

  // Then I click on "Save"
  await dialog.getByRole("button", { name: "Save" }).click();

  // The heading now changes from "Adding new Task" to <SUBJECT>
  await expect(dialog.getByRole("heading", { name: TASK_SUBJECT })).toBeVisible();

  // And the form is displayed with the details filled
  await expect(
    page.locator("#entity-field__description").getByRole("textbox"),
  ).toHaveValue("Plan Career Counselling for class 4");

  // Then I click on the close icon "X"
  await page.locator("button.overlay-close-button").click();

  // Clear all filters so the newly added task (with future dates relative to the
  // mocked E2E_REF_DATE) becomes visible — the default "Currently Active" filter
  // would hide it since both start date (20.02.2026) and deadline (31.03.2026)
  // are after the mocked reference date (2025-01-23).
  await page.getByRole("button", { name: "Clear" }).click();

  // And the Task is in the list of all tasks
  await expect(page.getByRole("cell", { name: TASK_SUBJECT })).toBeVisible();

  // [screenshot]
  await argosScreenshot(page, "task-list-after-add");
});

test("Edit the related records assigned to the task", async ({ page }) => {
  const users = generateUsers();
  const [, demoAdmin] = users;

  const childToRemove = generateChild({ name: "Anand Trivedi" });
  const childToAdd = generateChild({ name: "Amrita Nayar" });
  const childOther = generateChild({ name: "Arun Kapoor" });

  // Pre-existing task with "Anand Trivedi" as a related record.
  // No startDate so the task appears under the default "Currently Active" filter
  // (filter includes tasks where startDate does not exist).
  const taskToEdit = Todo.create({
    subject: TASK_SUBJECT,
    deadline: new Date("2025-02-28"),
    assignedTo: [demoAdmin.getId()],
    relatedEntities: [childToRemove.getId()],
  });

  await loadApp(page, [
    ...users,
    childToRemove,
    childToAdd,
    childOther,
    taskToEdit,
  ]);

  // When I click on Tasks from the Main Menu
  await page.getByRole("navigation").getByText("Tasks").click();

  // And I click on the record with the subject "<PLAN CAREER COUNSELLING>"
  await page.getByRole("cell", { name: TASK_SUBJECT }).click();

  const dialog = page.getByRole("dialog");

  // Then the form is displayed; I click "Edit" and the fields become editable
  await dialog.getByRole("button", { name: "Edit" }).click();

  // Open the Related Records dropdown
  await page
    .locator("#entity-field__relatedEntities")
    .locator(".fa-caret-down")
    .click();

  // Then I see "Anand Trivedi" already selected
  await expect(
    page
      .getByRole("option", { name: "Anand Trivedi" })
      .getByRole("checkbox", { checked: true }),
  ).toBeVisible();

  // When I unselect "Anand Trivedi"
  await page.getByRole("option", { name: "Anand Trivedi" }).click();

  // And I select "Amrita Nayar"
  await page.getByRole("option", { name: "Amrita Nayar" }).click();
  await page.keyboard.press("Escape");

  // And I click on "Save"
  await dialog.getByRole("button", { name: "Save" }).click();

  // Then the "Related Records" field contains "Amrita Nayar" (dialog stays open in view mode)
  await expect(dialog.getByText("Amrita Nayar")).toBeVisible();

  // And the "Related Records" field does not contain "Anand Trivedi"
  await expect(dialog.getByText("Anand Trivedi")).not.toBeVisible();

  // Close the dialog to return to the list view
  // (background table is aria-hidden while dialog is open, so we must close first)
  await page.locator("button.overlay-close-button").click();

  // When I view the list of Tasks, the updated related records are visible in the list view
  const taskRow = page.getByRole("row").filter({ hasText: TASK_SUBJECT });
  await expect(taskRow.getByText("Amrita Nayar")).toBeVisible();
  await expect(taskRow.getByText("Anand Trivedi")).not.toBeVisible();
});
