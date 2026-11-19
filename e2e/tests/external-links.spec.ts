import {
  argosScreenshot,
  expect,
  loadApp,
  type Page,
  test,
} from "#e2e/fixtures.js";
import { generateUsers } from "#src/app/core/user/demo-user-generator.service.js";
import type { Entity } from "#src/app/core/entity/model/entity.js";
import { generateChild } from "#src/app/child-dev-project/children/demo-data-generators/demo-child-generator.service.js";

const LINKED_CHILD = "<MATCHING CHILD & CO>";
const OTHER_CHILD = "<OTHER CHILD>";
const LINK_TITLE = "<OPEN IN ACCOUNTING>";

async function openActionsMenuOf(page: Page, childName: string) {
  await page.getByRole("navigation").getByText("Children").click();
  await page.getByRole("cell", { name: childName }).click();
  await page.getByRole("button", { name: "More actions" }).click();
}

test("Admin adds an external link for a record type and users open it from matching records", async ({
  page,
  context,
}) => {
  // the external site does not exist: answer for it, so the new tab loads
  await context.route("https://accounting.example.org/**", (route) =>
    route.fulfill({ contentType: "text/html", body: "<html></html>" }),
  );
  const linkedChild = generateChild({ name: LINKED_CHILD });
  await loadApp(page, [
    ...generateUsers(),
    linkedChild,
    generateChild({ name: OTHER_CHILD }),
  ]);

  await test.step("Admin adds an external link for the record type with a condition", () =>
    addExternalLink(page));
  await test.step("A record matching the condition offers the link with its values in the address", () =>
    openLinkFromMatchingRecord(page, linkedChild));
  await test.step("A record not matching the condition only offers the unconditional link", () =>
    checkLinkHiddenForOtherRecord(page));
});

async function addExternalLink(page: Page) {
  // the admin screen of the record type lists its links and adds one for this type
  await openActionsMenuOf(page, LINKED_CHILD);
  await page
    .getByRole("menuitem", { name: "Configure Data Structure" })
    .click();
  await page.getByText("External Links", { exact: true }).click();
  await page.getByRole("button", { name: "add element" }).click();

  const form = page.getByRole("dialog").filter({ hasText: "Record Type" });
  await form
    .locator("#entity-field__title")
    .getByRole("textbox")
    .first()
    .fill(LINK_TITLE);
  await form
    .locator("#entity-field__url")
    .getByRole("textbox")
    .fill("https://accounting.example.org/person?ref={d._id}&name={d.name}");
  await expect(form.locator("#entity-field__entity input").first()).toHaveValue(
    "Child",
  );

  await form.getByRole("button", { name: "Add Condition" }).click();
  const conditionDialog = page
    .getByRole("dialog")
    .filter({ hasText: "This link is shown only for records matching" });
  await conditionDialog
    .getByRole("button", { name: "Add Condition", exact: true })
    .click();
  await conditionDialog
    .getByRole("textbox", { name: "Field", exact: true })
    .click();
  await page.getByRole("option", { name: "Name", exact: true }).click();
  await conditionDialog.getByRole("textbox").last().fill(LINKED_CHILD);
  await conditionDialog
    .getByRole("button", { name: "Apply Condition" })
    .click();

  await expect(
    form.getByText("Only records matching a condition on: Name"),
  ).toBeVisible();
  await expect(conditionDialog).toBeHidden();

  await argosScreenshot(page, "external-link-form");
  await form.getByRole("button", { name: "Save", exact: true }).click();
  await page.locator("button.overlay-close-button").click();
  await expect(
    page.getByRole("cell", { name: LINK_TITLE, exact: true }),
  ).toBeVisible();
}

async function openLinkFromMatchingRecord(page: Page, linkedChild: Entity) {
  // a record matching the condition offers the link, with its values in the address
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await openActionsMenuOf(page, LINKED_CHILD);
  const newTab = page.waitForEvent("popup");
  await page.getByRole("menuitem", { name: LINK_TITLE }).click();
  expect((await newTab).url()).toBe(
    "https://accounting.example.org/person?ref=" +
      encodeURIComponent(linkedChild.getId()) +
      "&name=" +
      encodeURIComponent(LINKED_CHILD),
  );
}

async function checkLinkHiddenForOtherRecord(page: Page) {
  // a record not matching the condition only offers the link without condition
  await openActionsMenuOf(page, OTHER_CHILD);
  await expect(
    page.getByRole("menuitem", { name: "Open in Donor CRM (example)" }),
  ).toBeVisible();
  await expect(page.getByRole("menuitem", { name: LINK_TITLE })).toBeHidden();
}
