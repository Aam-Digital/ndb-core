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
  await expect(
    dialog.getByRole("heading", { name: "Adding new Task" }),
  ).toBeVisible();

  // Note: Angular Material floating labels do not expose an accessible name via
  // aria-labelledby in a way Playwright resolves with getByLabel(), so fields
  // are located by their mat-form-field element IDs (id="entity-field__<fieldId>").

  // Then I add the subject
  await page
    .locator("#entity-field__subject")
    .getByRole("textbox")
    .fill(TASK_SUBJECT);

  // Then I capture the deadline date (31.03.2026)
  await page
    .locator("#entity-field__deadline")
    .getByRole("textbox")
    .fill("31.03.2026");

  // And I capture the start date (20.02.2026)
  const startDateInput = page
    .locator("#entity-field__startDate")
    .getByRole("textbox");
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

  await expect(dialog.getByText("Anand Trivedi")).toBeVisible();
  await expect(dialog.getByText("Anand Nehru")).toBeVisible();
  await expect(dialog.getByText("Arun Kapoor")).toBeVisible();

  // The repeat interval defaults to "does not repeat" (no interval),
  // which is already the correct state — no selection needed.

  // [screenshot] before saving
  await argosScreenshot(page, "task-form-before-save");

  // Then I click on "Save"
  await dialog.getByRole("button", { name: "Save" }).click();

  // The heading now changes from "Adding new Task" to <SUBJECT>
  await expect(
    dialog.getByRole("heading", { name: TASK_SUBJECT }),
  ).toBeVisible();

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
  Object.assign(childToAdd, { phone: "+63 98163115" });
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

  // Wait for the entity chip to render before clicking Save
  await expect(dialog.getByText("Amrita Nayar")).toBeVisible();

  // And I click on "Save"
  await dialog.getByRole("button", { name: "Save" }).click();

  // Wait for the dialog to return to view mode — the "Edit" button reappearing
  // confirms the save is complete and the form has re-rendered
  await expect(dialog.getByRole("button", { name: "Edit" })).toBeVisible();

  // Then the "Related Records" field contains "Amrita Nayar" (entity chip loads async)
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

  // Reopen the task to verify the tooltip on the linked participant chip
  await page.getByRole("cell", { name: TASK_SUBJECT }).click();

  // Hover over "Amrita Nayar" chip to trigger the tooltip
  const amritaChip = dialog.locator("span[title='Amrita Nayar']");
  await amritaChip.hover();

  // The tooltip shows the participant's name and configured block detail (phone)
  await expect(page.getByText("+63 98163115")).toBeVisible();

  // Click the chip to trigger navigation to the participant's profile
  await amritaChip.click();

  // Close the dialog first to reveal the child profile page behind it
  await page.locator("button.overlay-close-button").click();

  // Then the "Basic Information" tab of the participant is displayed by default
  await expect(
    page.getByRole("tab", { name: "Basic Information" }),
  ).toBeVisible();

  // When I click on the "Notes & Tasks" tab
  await page.getByRole("tab", { name: "Notes & Tasks" }).click();

  // Then the related task is listed under Tasks
  await expect(page.getByRole("cell", { name: TASK_SUBJECT })).toBeVisible();
});

test("Logged-in users Tasks list displayed in the Dashboard", async ({
  page,
}) => {
  const users = generateUsers();
  const [, demoAdmin] = users;

  // Task assigned to demo-admin with deadline 08.03.2026; no startDate so it
  // passes the dashboard filter (moment(undefined) == today <= today).
  const taskForAdmin = Todo.create({
    subject: TASK_SUBJECT,
    deadline: new Date("2026-03-08"),
    assignedTo: [demoAdmin.getId()],
  });

  await loadApp(page, [...users, taskForAdmin]);

  // The Dashboard is the default landing page after login.
  // The "Tasks due" widget shows only tasks assigned to the logged-in user.
  const tasksDueWidget = page.locator("app-todos-dashboard");
  await expect(tasksDueWidget.getByText(TASK_SUBJECT)).toBeVisible();

  // The deadline "08.03.2026" (dd.MM.yyyy format) is displayed next to the task
  await expect(tasksDueWidget.getByText("08.03.2026")).toBeVisible();

  // When I click on the task name in the widget
  await tasksDueWidget.getByText(TASK_SUBJECT).click();

  // Then the overview of the task is displayed in a dialog
  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByRole("heading", { name: TASK_SUBJECT }),
  ).toBeVisible();
});

test("Archive a task hides it from the list", async ({ page }) => {
  const users = generateUsers();
  const [, demoAdmin] = users;

  // Pre-existing task with no startDate so it is visible under the default filter
  const taskToArchive = Todo.create({
    subject: TASK_SUBJECT,
    deadline: new Date("2025-02-28"),
    assignedTo: [demoAdmin.getId()],
  });

  await loadApp(page, [...users, taskToArchive]);

  // When I click on Tasks from the Main Menu
  await page.getByRole("navigation").getByText("Tasks").click();

  // And I click on the record with the subject
  await page.getByRole("cell", { name: TASK_SUBJECT }).click();

  const dialog = page.getByRole("dialog");

  // Then the form is displayed and the "Archive" button is shown as a primary
  // action in the dialog header (primaryAction: true, showExpanded: true)
  await dialog.getByRole("button", { name: "Archive" }).click();

  // A snackbar confirmation message is shown
  await expect(page.getByText(`"${TASK_SUBJECT}" archived`)).toBeVisible();

  // The dialog shows the archived info card below the task header
  await expect(
    dialog.getByText(
      "This record is archived and will be hidden from lists and select options by default.",
    ),
  ).toBeVisible();

  // A "Reactivate" button is shown to undo the archive
  await expect(
    dialog.getByRole("button", { name: "Reactivate" }),
  ).toBeVisible();

  // Close the dialog and return to the task list
  await page.locator("button.overlay-close-button").click();

  // The archived task is no longer visible under the default "Currently Active" filter
  await expect(
    page.getByRole("cell", { name: TASK_SUBJECT }),
  ).not.toBeVisible();
});

test("Complete a task that is related to a child", async ({ page }) => {
  const users = generateUsers();
  const [, demoAdmin] = users;

  const child1 = generateChild({ name: "Anand Trivedi" });
  const child2 = generateChild({ name: "Anand Nehru" });
  const child3 = generateChild({ name: "Arun Kapoor" });

  // Pre-existing task with three related children; no startDate so it is
  // visible under the default "Currently Active" filter
  const taskToComplete = Todo.create({
    subject: TASK_SUBJECT,
    deadline: new Date("2025-02-28"),
    assignedTo: [demoAdmin.getId()],
    relatedEntities: [child1.getId(), child2.getId(), child3.getId()],
  });

  await loadApp(page, [...users, child1, child2, child3, taskToComplete]);

  // When I click on Tasks from the Main Menu
  await page.getByRole("navigation").getByText("Tasks").click();

  // And I click on the record with the subject
  await page.getByRole("cell", { name: TASK_SUBJECT }).click();

  const dialog = page.getByRole("dialog");

  // Click "Edit" to enter edit mode — the "Complete Task" button requires the
  // form to be in edit mode before it can be activated
  await dialog.getByRole("button", { name: "Edit" }).click();

  // Then a "Complete Task" button is displayed at the bottom of the form
  await expect(
    dialog.getByRole("button", { name: "Complete Task" }),
  ).toBeVisible();

  // When I click "Complete Task"
  // force: true bypasses the mat-form-field wrapper that intercepts pointer events
  await dialog
    .getByRole("button", { name: "Complete Task" })
    .click({ force: true });

  // The dialog closes after completing the task
  await expect(page.getByRole("dialog")).not.toBeVisible();

  // The completed task is removed from the default "Currently Active" task list
  await expect(
    page.getByRole("cell", { name: TASK_SUBJECT }),
  ).not.toBeVisible();
});
