import {
  argosScreenshot,
  expect,
  loadApp,
  type Page,
  test,
} from "#e2e/fixtures.js";
import { generateUsers } from "#src/app/core/user/demo-user-generator.service.js";
import { generateChild } from "#src/app/child-dev-project/children/demo-data-generators/demo-child-generator.service.js";

const LINKED_CHILD = "Asha & Co";
const OTHER_CHILD = "Other Child";
const LINK_TITLE = "Open in Accounting";

async function openActionsMenuOf(page: Page, childName: string) {
  await page.getByRole("navigation").getByText("Children").click();
  await page.getByRole("cell", { name: childName }).click();
  await page
    .locator("app-entity-actions-menu button[mat-icon-button]")
    .first()
    .click();
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

  // the admin screen of the record type lists its links and adds one for this type
  await openActionsMenuOf(page, LINKED_CHILD);
  await page
    .getByRole("menuitem", { name: "Configure Data Structure" })
    .click();
  await page.getByText("External Links", { exact: true }).click();
  await page
    .locator("app-admin-entity-linked-records")
    .getByRole("button")
    .first()
    .click();

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
    form.getByText("Shown only for records matching the condition."),
  ).toBeVisible();
  await expect(conditionDialog).toBeHidden();

  await argosScreenshot(page, "external-link-form");
  await form.getByRole("button", { name: "Save", exact: true }).click();
  await form.locator("app-dialog-close button").click();
  await expect(
    page.getByRole("cell", { name: LINK_TITLE, exact: true }),
  ).toBeVisible();

  // a record matching the condition offers the link, with its values in the address
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await openActionsMenuOf(page, LINKED_CHILD);
  const newTab = page.waitForEvent("popup");
  await page.getByRole("menuitem", { name: LINK_TITLE }).click();
  expect((await newTab).url()).toBe(
    "https://accounting.example.org/person?ref=" +
      encodeURIComponent(linkedChild.getId()) +
      "&name=Asha%20%26%20Co",
  );

  // a record not matching the condition only offers the link without condition
  await openActionsMenuOf(page, OTHER_CHILD);
  await expect(
    page.getByRole("menuitem", { name: "Open in Donor CRM (example)" }),
  ).toBeVisible();
  await expect(page.getByRole("menuitem", { name: LINK_TITLE })).toBeHidden();
});
