import { argosScreenshot, expect, loadApp, test } from "#e2e/fixtures.js";
import { generateUsers } from "#src/app/core/user/demo-user-generator.service.js";
import { generateActionPlan } from "#src/app/features/hierarchy/demo-data/demo-action-generator.service.js";

test("Actions list shows sub-actions indented below their parent", async ({
  page,
}) => {
  await loadApp(page, [...generateUsers(), ...generateActionPlan()]);
  await page.getByRole("navigation").getByText("Actions").click();

  const row = (title: string) =>
    page.getByRole("row").filter({ hasText: title });
  // the width of the tree cell before the title: indentation, lines and expand button
  const indentOf = (title: string) =>
    row(title)
      .locator("app-hierarchy-tree-cell")
      .evaluate((cell) => cell.getBoundingClientRect().width);

  // sub-actions are indented one step per level, all levels expanded
  await expect(row("Meeting in Sonpur")).toBeVisible();
  expect(await indentOf("Clean Water 2027")).toBeLessThan(
    await indentOf("Village meetings"),
  );
  expect(await indentOf("Village meetings")).toBeLessThan(
    await indentOf("Meeting in Sonpur"),
  );
  await argosScreenshot(page, "hierarchy-actions-list");

  // collapsing a row hides its sub-actions and shows how many there are
  await row("Village meetings")
    .getByRole("button", { name: "3 sub-records" })
    .click();
  await expect(row("Meeting in Sonpur")).toBeHidden();
  await expect(row("Village meetings")).toContainText(
    /Village meetings\s*\(3\)/,
  );
  await expect(
    row("Village meetings").getByRole("button", { name: "3 sub-records" }),
  ).toHaveAttribute("aria-expanded", "false");

  await page.getByRole("button", { name: "Collapse all" }).click();
  await expect(row("Community mobilisation")).toBeHidden();
  await page.getByRole("button", { name: "Expand all" }).click();
  await expect(row("Meeting in Sonpur")).toBeVisible();

  // a search keeps the parents of matches, greyed out
  await page.getByPlaceholder("e.g. name, age").fill("Sonpur");
  await expect(page.getByRole("row")).toHaveCount(5); // header + 3 parents + match
  await expect(row("Village meetings")).toContainText(
    "Not matching the filters",
  );
  await expect(row("Meeting in Sonpur")).not.toContainText(
    "Not matching the filters",
  );
  await page.getByPlaceholder("e.g. name, age").fill("");

  // "Depends on" arranges the actions by another link field, "None" shows a flat list with pages
  await page.getByRole("combobox", { name: "Hierarchy" }).click();
  await page.getByRole("option", { name: "Depends on" }).click();
  await expect(page).toHaveURL(/[?&]_hierarchy=dependsOn/);
  await expect(page.getByRole("listbox")).toBeHidden();
  expect(await indentOf("Site survey")).toBeLessThan(
    await indentOf("Well in Rampur"),
  );

  await page.getByRole("combobox", { name: "Hierarchy" }).click();
  await page.getByRole("option", { name: "None (flat list)" }).click();
  await expect(page).toHaveURL(/[?&]_hierarchy=none/);
  await expect(page.locator("app-hierarchy-tree-cell")).toHaveCount(0);
  await expect(page.getByText("1 - 10 of 18")).toBeVisible();
});
