import { expect, test } from "#e2e/fixtures.ts";

test("has title", async ({ page }) => {
  await expect(page).toHaveTitle(/Aam Digital - Demo/);
});
