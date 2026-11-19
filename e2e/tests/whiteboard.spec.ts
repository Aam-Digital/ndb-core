import { argosScreenshot, expect, loadApp, test } from "#e2e/fixtures.js";
import { generateUsers } from "#src/app/core/user/demo-user-generator.service.js";
import { generateChild } from "#src/app/child-dev-project/children/demo-data-generators/demo-child-generator.service.js";
import { generateNote } from "#src/app/child-dev-project/notes/demo-data/demo-note-generator.service.js";
import { generateWhiteboard } from "#src/app/features/whiteboard/model/demo-whiteboard-generator.service.js";

const BOARD_TITLE = "<CASE OVERVIEW BOARD>";
const CHILD_NAME = "<WHITEBOARD TEST CHILD>";
const NEW_BOARD_TITLE = "<NEW BOARD>";

test("Whiteboard shows records with their references and saves added annotations", async ({
  page,
}) => {
  const users = generateUsers();
  const child = generateChild({ name: CHILD_NAME });
  const note = generateNote({ child, author: users[0] });
  const board = generateWhiteboard({
    title: BOARD_TITLE,
    centerEntityId: child.getId(),
    noteIds: [note.getId()],
  });

  await loadApp(page, [...users, child, note, board]);

  // The board is listed with the other whiteboards
  await page.getByRole("navigation").getByText("Whiteboards").click();
  await page.getByRole("cell", { name: BOARD_TITLE }).click();

  // The cards of the child and its note are shown, connected by the note's reference line
  const canvas = page.locator("app-whiteboard-canvas");
  await expect(canvas.getByText(CHILD_NAME)).toBeVisible();
  await expect(canvas.getByRole("img", { name: /^Reference/ })).toHaveCount(1);
  await expect(canvas.getByRole("img", { name: /^Connection/ })).toHaveCount(1);

  await argosScreenshot(page, "whiteboard-with-records");

  // Adding a sticky note saves the board automatically
  await page.getByRole("button", { name: "Note", exact: true }).click();
  await expect(canvas.getByText("(empty note)")).toBeVisible();
  await expect(page.getByText("All changes saved")).toBeVisible();

  // Removing a record card keeps the record but drops the card and its connections
  await canvas
    .getByRole("group", { name: CHILD_NAME })
    .getByRole("button", { name: "Item actions" })
    .click();
  await page.getByRole("menuitem", { name: "Remove from board" }).click();
  await expect(canvas.getByText(CHILD_NAME)).toHaveCount(0);
  await expect(
    canvas.getByRole("img", { name: /^(Reference|Connection)/ }),
  ).toHaveCount(0);
  await expect(page.getByText("All changes saved")).toBeVisible();

  // The changes are persisted: reopening the board shows the note and no longer the removed card
  await page.getByRole("navigation").getByText("Whiteboards").click();
  await page.getByRole("cell", { name: BOARD_TITLE }).click();
  await expect(canvas.getByText("(empty note)")).toBeVisible();
  await expect(canvas.getByText(CHILD_NAME)).toHaveCount(0);

  // A new board from the list asks for a title and opens empty
  await page.getByRole("navigation").getByText("Whiteboards").click();
  await page.getByRole("button", { name: "Add New", exact: true }).click();
  await page.getByRole("dialog").getByRole("textbox").fill(NEW_BOARD_TITLE);
  await page.getByRole("button", { name: "Save" }).click();
  await expect(
    page.getByRole("heading", { name: NEW_BOARD_TITLE }),
  ).toBeVisible();
  await expect(canvas.getByRole("group")).toHaveCount(0);

  await page.getByRole("navigation").getByText("Whiteboards").click();
  await expect(page.getByRole("cell", { name: NEW_BOARD_TITLE })).toBeVisible();
});
