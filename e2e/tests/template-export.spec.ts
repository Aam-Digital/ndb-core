import { argosScreenshot, expect, loadApp, test } from "#e2e/fixtures.js";
import { generateUsers } from "#src/app/core/user/demo-user-generator.service.js";
import { generateChild } from "#src/app/child-dev-project/children/demo-data-generators/demo-child-generator.service.js";
import { TemplateExport } from "#src/app/features/template-export/template-export.entity.js";

const CHILD_NAME = "<TEMPLATE EXPORT CHILD>";
const TEMPLATE_TITLE = "<E2E LETTER TEMPLATE>";

test("Template-export action generates a file in the selected format", async ({
  page,
}) => {
  // Stub the export feature/availability check so the dialog reaches its
  // selection phase (and therefore renders the "Generate File from Template"
  // heading, which only shows while phase === "select").
  await page.route("**/actuator/features", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ export: { enabled: true } }),
    }),
  );
  // The backend names the generated file after the requested format.
  let renderRequest: { convertTo?: string } | undefined;
  await page.route("**/api/v1/export/render/**", (route) => {
    renderRequest = route.request().postDataJSON();
    return route.fulfill({
      status: 200,
      contentType: "application/octet-stream",
      headers: {
        "Content-Disposition": `attachment; filename="letter.${renderRequest.convertTo}"`,
        "Access-Control-Expose-Headers": "Content-Disposition",
      },
      body: "generated file",
    });
  });

  const users = generateUsers();
  const child = generateChild({ name: CHILD_NAME });
  const template = Object.assign(new TemplateExport(), {
    title: TEMPLATE_TITLE,
    applicableForEntityTypes: ["Child"],
    templateFile: "letter.docx",
    templateId: "e2e-template-id",
    targetFileName: "letter",
  });

  await loadApp(page, [...users, child, template]);

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

  // A template uploaded as .docx can be filled in as an editable .docx
  // instead of the default PDF.
  await page.getByLabel("Template").click();
  await page.getByRole("option", { name: TEMPLATE_TITLE }).click();
  await page.getByRole("radio", { name: "Editable file (.docx)" }).check();

  await argosScreenshot(page, "template-export-dialog");

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Generate File" }).click();
  const download = await downloadPromise;

  expect(renderRequest?.convertTo).toBe("docx");
  expect(download.suggestedFilename()).toBe("letter.docx");
});
