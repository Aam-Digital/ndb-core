import { argosScreenshot, expect, loadApp, test } from "#e2e/fixtures.js";
import { generateUsers } from "#src/app/core/user/demo-user-generator.service.js";
import { createEntityOfType } from "#src/app/core/demo-data/create-entity-of-type.js";
// Trigger registration of the PublicFormConfig entity type.
import "#src/app/features/public-form/public-form-config.js";

const FORM_TITLE = "E2E Registration Form";
const NEW_CHILD_NAME = "<PUBLIC FORM CHILD>";

test("Public form: anonymous submission creates a new entity", async ({
  page,
}) => {
  const users = generateUsers();

  // Seed a PublicFormConfig (deprecated single-form schema, but still
  // supported and exposed in the UI). It exposes a Child creation form
  // at /public-form/form/e2e-test with just the Name field configured.
  const formConfig = createEntityOfType(
    "PublicFormConfig",
    "e2e-public-form",
  ) as any;
  formConfig.title = FORM_TITLE;
  // The dashboard's "Public Registration Form" nav link is hard-coded to
  // /public-form/form/test in the all-features config — keep this route id
  // so we can navigate via click (per project convention "do not use goto").
  formConfig.route = "test";
  formConfig.entity = "Child";
  formConfig.columns = [{ fields: ["name"] }];

  await loadApp(page, [...users, formConfig]);

  // Navigate from the dashboard's "Public Registration Form" shortcut row.
  await page.getByRole("cell", { name: "Public Registration Form" }).click();

  // mat-card-title isn't exposed as a heading role — assert by visible text.
  await expect(page.getByText(FORM_TITLE)).toBeVisible({ timeout: 10_000 });

  // Fill the Name field — the public form renders an entity-form with
  // the configured columns. The single field doesn't get the
  // entity-field__ id wrapper here; use the visible "Name" label instead.
  await page.getByRole("textbox").first().fill(NEW_CHILD_NAME);

  await argosScreenshot(page, "public-form-filled");

  await page.getByRole("button", { name: "Submit Form" }).click();

  // After a successful submission the routes redirect to /submission-success.
  await expect(page).toHaveURL(/submission-success/, { timeout: 10_000 });
});
