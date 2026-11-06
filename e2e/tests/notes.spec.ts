import {
  argosScreenshot,
  E2E_REF_DATE,
  expect,
  loadApp,
  test,
} from "#e2e/fixtures.js";
import { generateUsers } from "#src/app/core/user/demo-user-generator.service.js";
import { generateChild } from "#src/app/child-dev-project/children/demo-data-generators/demo-child-generator.service.js";
import { generateNote } from "#src/app/child-dev-project/notes/demo-data/demo-note-generator.service.js";

const INITIAL_SUBJECT = "<NOTE DIALOG INITIAL>";
const UPDATED_SUBJECT = "<NOTE DIALOG UPDATED>";
const INITIAL_TEXT = "Initial note text for e2e.";
const UPDATED_TEXT = "Updated note text for e2e.";
const OLD_SUBJECT = "<OUTSIDE DEFAULT FILTER>";

test("Edit note details in popup dialog and persist changes", async ({
  page,
}) => {
  const users = generateUsers();
  const [, demoAdmin] = users;
  const child = generateChild({ name: "Nila Rao" });

  const note = generateNote({
    child,
    author: demoAdmin,
    date: new Date(E2E_REF_DATE),
  });
  note.subject = INITIAL_SUBJECT;
  note.text = INITIAL_TEXT;

  // hidden by the list's default date filter ("This week")
  const oldNote = generateNote({
    child,
    author: demoAdmin,
    date: new Date("2024-06-01"),
  });
  oldNote.subject = OLD_SUBJECT;

  await loadApp(page, [...users, child, note, oldNote]);

  await page.getByRole("navigation").getByText("Notes").click();
  await expect(page.getByRole("group", { name: "Date" })).toBeVisible(); // wait for filter to be loaded
  await argosScreenshot(page, "notes-list");

  await page.getByRole("cell", { name: INITIAL_SUBJECT }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await argosScreenshot(page, "note-dialog-open");

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

  // The default filter still applies when coming back to the list
  // with another column-group tab selected (kept in the URL).
  const mobileTab = page.getByRole("tab", { name: "Mobile" });
  await mobileTab.click();
  await page.getByRole("navigation").getByText("Children").click();
  await page.goBack();
  await expect(mobileTab).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("cell", { name: UPDATED_SUBJECT })).toBeVisible();
  await expect(page.getByRole("cell", { name: OLD_SUBJECT })).toHaveCount(0);
});
