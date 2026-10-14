import { expect, test } from "#e2e/fixtures.js";

test("embedded field (e.g. attendance participants) is not offered as a bare filter, only its nested properties are", async ({
  page,
}) => {
  await page.goto("/?useCase=education");
  await page.getByText("Start Exploring").click({ timeout: 10_000 });
  await page.waitForLoadState("networkidle");

  await page.getByRole("navigation").getByText("Attendance").click();
  await page.getByRole("navigation").getByText("Events").click();
  await page.waitForLoadState("networkidle");

  await page.locator("button[mat-icon-button][color='primary']").click();
  await page.getByText("Configure Data Structure").click();
  await page.waitForLoadState("networkidle");
  await expect(page.getByText("Configuring data structure for")).toBeVisible();

  await page.getByText("List View").click();
  await page.waitForLoadState("networkidle");

  const addFilterSection = page
    .locator(".table-content-preview")
    .filter({ hasText: "Add Filter:" });
  await addFilterSection.locator("input:visible").first().click();

  const options = page.getByRole("option");
  await expect(
    options.filter({ hasText: "Participants -> Status" }),
  ).toBeVisible();
  await expect(
    options.filter({ hasText: "Participants -> Participant" }),
  ).toBeVisible();
  await expect(
    options.filter({ hasText: "Participants -> Remarks" }),
  ).toBeVisible();

  // the bare "Participants" field itself must not be offered, as filtering by equality
  // on the whole embedded array/object value does not make sense (see
  // AdminEntityListComponent.filterExcludedFields)
  await expect(options.getByText(/^Participants$/)).toHaveCount(0);
});
