import { argosScreenshot, expect, loadApp, test } from "#e2e/fixtures.js";
import { generateUsers } from "#src/app/core/user/demo-user-generator.service.js";
import { generateChild } from "#src/app/child-dev-project/children/demo-data-generators/demo-child-generator.service.js";

const CHILD_NAME = "<TEMPLATE EXPORT CHILD>";

test("Template-export action opens the Generate File dialog", async ({
  page,
}) => {
  // Stub the export feature/availability check so the dialog renders its
  // selection UI instead of an error state. Returning a 200 for any call
  // to /api/v1/export/* is enough — the dialog only needs the feature
  // flag to resolve.
  await page.route("**/api/v1/export/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: "{}",
    }),
  );

  const users = generateUsers();
  const child = generateChild({ name: CHILD_NAME });

  await loadApp(page, [...users, child]);

  await page.getByRole("navigation").getByText("Children").click();
  await page.getByRole("cell", { name: CHILD_NAME }).click();

  // Open the entity actions menu on the details page and pick Generate File.
  await page
    .locator("app-entity-actions-menu button[mat-icon-button]")
    .first()
    .click();
  await page.getByRole("menuitem", { name: /Generate File/i }).click();

  // The template-export selection dialog should now be visible with its
  // header text (regardless of feature-enabled state).
  await expect(
    page.getByRole("heading", { name: "Generate File from Template" }),
  ).toBeVisible({ timeout: 10_000 });

  await argosScreenshot(page, "template-export-dialog");
});
