import { argosScreenshot, expect, loadApp, test } from "#e2e/fixtures.js";
import { generateUsers } from "#src/app/core/user/demo-user-generator.service.js";
import { generateChild } from "#src/app/child-dev-project/children/demo-data-generators/demo-child-generator.service.js";
import { generateNote } from "#src/app/child-dev-project/notes/demo-data/demo-note-generator.service.js";
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
    renderRequest = route.request().postDataJSON() as { convertTo?: string };
    return route.fulfill({
      status: 200,
      contentType: "application/octet-stream",
      headers: {
        "Content-Disposition": `attachment; filename="letter.${renderRequest.convertTo}"`,
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
  await page.getByPlaceholder("Select a file template").first().click();
  await page.getByRole("option", { name: TEMPLATE_TITLE }).click();
  await page.getByRole("radio", { name: "Editable file (.docx)" }).check();

  await argosScreenshot(page, "template-export-dialog");

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Generate File" }).click();
  const download = await downloadPromise;

  expect(renderRequest?.convertTo).toBe("docx");
  expect(download.suggestedFilename()).toBe("letter.docx");
});

test("Related records configured for a template are sent to the export API", async ({
  page,
}) => {
  const TEMPLATE_TITLE = "<TEMPLATE WITH RELATED RECORDS>";

  await page.route("**/actuator/features", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ export: { enabled: true } }),
    }),
  );
  await page.route("**/api/v1/export/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/pdf",
      body: "%PDF-",
    }),
  );

  const users = generateUsers();
  const child = generateChild({ name: CHILD_NAME });
  const note = generateNote({ child, author: users[0] });
  const template = Object.assign(new TemplateExport(), {
    title: TEMPLATE_TITLE,
    applicableForEntityTypes: [child.getType()],
    templateFile: "template.docx",
    templateId: "template-id",
    targetFileName: "file_{d.name}",
  });

  await loadApp(page, [...users, child, note, template]);

  // Admin: include the notes linking to a child in the template
  await page
    .getByRole("navigation")
    .getByText("Admin", { exact: true })
    .click();
  await page.getByRole("navigation").getByText("Admin Overview").click();
  await page.getByRole("button", { name: /^Templates and Forms/ }).click();
  await page.getByText("Export Templates", { exact: true }).click();
  await page.getByRole("cell", { name: TEMPLATE_TITLE }).click();
  await page.getByRole("button", { name: "Edit" }).click();

  await page.getByRole("button", { name: "Add related records" }).click();
  await page.getByRole("combobox", { name: "Related records" }).click();
  await page.getByRole("option", { name: /^Notes \(linked through/ }).click();
  const placeholderName = page.getByRole("textbox", {
    name: "Placeholder name",
  });
  await placeholderName.fill("notes");
  await placeholderName.blur();
  await expect(page.getByText("{d.notes[i].subject}")).toBeVisible();

  await argosScreenshot(page, "template-export-related-records");
  await page.getByRole("button", { name: "Save" }).click();

  // User: generate a file for the child
  await page.getByRole("navigation").getByText("Children").click();
  await page.getByRole("cell", { name: CHILD_NAME }).click();
  await page
    .locator("app-entity-actions-menu button[mat-icon-button]")
    .first()
    .click();
  await page.getByRole("menuitem", { name: /Generate File/i }).click();
  await page.getByRole("dialog").locator("app-edit-entity").click();
  await page.getByRole("option", { name: TEMPLATE_TITLE }).click();

  const renderRequest = page.waitForRequest("**/api/v1/export/render/**");
  await page.getByRole("button", { name: "Generate File" }).click();

  const { data } = (await renderRequest).postDataJSON() as {
    data: { name: string; notes: { subject: string }[] };
  };
  expect(data.name).toBe(CHILD_NAME);
  expect(data.notes).toHaveLength(1);
  expect(data.notes[0].subject).toBe(note.subject);
});
