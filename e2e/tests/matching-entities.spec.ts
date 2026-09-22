import { argosScreenshot, expect, loadApp, test } from "#e2e/fixtures.js";
import { generateUsers } from "#src/app/core/user/demo-user-generator.service.js";
import { generateChild } from "#src/app/child-dev-project/children/demo-data-generators/demo-child-generator.service.js";
import { createEntityOfType } from "#src/app/core/demo-data/create-entity-of-type.js";

const CHILD_NAME = "<MATCHING TEST CHILD>";

test("Matching entities widget renders and supports selecting a candidate", async ({
  page,
}) => {
  const users = generateUsers();
  const child = generateChild({ name: CHILD_NAME });

  // Create two schools so the right-side table has selectable rows.
  // Both get near-identical coordinates so the map groups them into a cluster.
  const school1 = createEntityOfType("School", "match-school-1");
  school1["name"] = "Match Test School One";
  school1["locationField"] = {
    lat: 52.4791,
    lon: 13.432,
    display_name: "Match Test Street 1",
  };
  const school2 = createEntityOfType("School", "match-school-2");
  school2["name"] = "Match Test School Two";
  school2["locationField"] = {
    lat: 52.4792,
    lon: 13.4321,
    display_name: "Match Test Street 2",
  };

  await loadApp(page, [...users, child, school1, school2]);

  // Navigate to child details → Education tab where the "Find a suitable new
  // school" MatchingEntities widget is configured.
  await page.getByRole("navigation").getByText("Children").click();
  await page.getByRole("cell", { name: CHILD_NAME }).click();
  await page.getByRole("tab", { name: "Education", exact: true }).click();

  // The matching widget renders a comparison header and a "Select School"
  // table of candidates.
  await expect(
    page.getByRole("heading", { name: "Select School" }),
  ).toBeVisible();
  await expect(
    page.getByRole("cell", { name: "Match Test School One" }),
  ).toBeVisible();

  await argosScreenshot(page, "matching-entities-loaded");

  // Default label from resolvedMatchActionLabel() is "create matching".
  const createMatchButton = page.getByRole("button", {
    name: "create matching",
  });

  // Initially disabled — no school selected yet on the right side.
  await expect(createMatchButton).toBeDisabled();

  // Click the candidate school's row in the selection table inside the
  // matching widget. The matching component's selection table sits below
  // the comparison header inside `<app-matching-entities>`, so scope to it
  // to avoid clicking a duplicate cell elsewhere on the page (e.g. School
  // History overview).
  const matching = page.locator("app-matching-entities");
  await matching.getByRole("row", { name: /Match Test School One/ }).click();

  // Once a candidate is picked, the create-match action enables.
  await expect(createMatchButton).toBeEnabled();

  // The matching config includes location columns, so the widget also renders
  // the map. Cluster icons are created by the leaflet.markercluster
  // side-effect plugin, which patches leaflet's live exports object. This
  // breaks silently if the plugin's additions are not visible on the imported
  // leaflet object (the map then throws during initialization and renders no
  // markers), so assert the plugin-generated cluster element itself.
  await expect(page.locator(".leaflet-container")).toBeVisible();
  await expect(page.locator(".marker-cluster").first()).toBeVisible({
    timeout: 10_000,
  });
});
