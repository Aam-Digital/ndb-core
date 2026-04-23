import { expect, loadApp, test } from "#e2e/fixtures.js";
import { generateUsers } from "#src/app/core/user/demo-user-generator.service.js";
import { generateChild } from "#src/app/child-dev-project/children/demo-data-generators/demo-child-generator.service.js";
import { Note } from "#src/app/child-dev-project/notes/model/note.js";

const INITIAL_SUBJECT = "<NOTE DIALOG INITIAL>";
const UPDATED_SUBJECT = "<NOTE DIALOG UPDATED>";
const INITIAL_TEXT = "Initial note text for e2e.";
const UPDATED_TEXT = "Updated note text for e2e.";

test("Edit note details in popup dialog and persist changes", async ({
  page,
}) => {
  const users = generateUsers();
  const [, demoAdmin] = users;
  const child = generateChild({ name: "Nila Rao" });

  const note = Note.create(
    new Date("2025-01-23T00:00:00.000Z"),
    INITIAL_SUBJECT,
    [child.getId()],
  );
  note.text = INITIAL_TEXT;
  note.authors = [demoAdmin.getId()];

  await loadApp(page, [...users, child, note]);

  await page.getByRole("navigation").getByText("Notes").click();

  await page.getByRole("cell", { name: INITIAL_SUBJECT }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  await expect(dialog.getByRole("button", { name: "Save" })).toBeVisible();

  await dialog
    .locator("#entity-field__subject")
    .getByRole("textbox")
    .fill(UPDATED_SUBJECT);
  await dialog
    .locator("#entity-field__text")
    .getByRole("textbox")
    .fill(UPDATED_TEXT);

  await dialog.getByRole("button", { name: "Save" }).click();
  await expect(dialog).not.toBeVisible();

  await expect(page.getByRole("cell", { name: UPDATED_SUBJECT })).toBeVisible();
  await expect(
    page.getByRole("cell", { name: INITIAL_SUBJECT }),
  ).not.toBeVisible();
});
