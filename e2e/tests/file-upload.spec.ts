import { argosScreenshot, expect, loadApp, test } from "#e2e/fixtures.js";
import { generateUsers } from "#src/app/core/user/demo-user-generator.service.js";
import { generateChild } from "#src/app/child-dev-project/children/demo-data-generators/demo-child-generator.service.js";

const CHILD_NAME = "<FILE UPLOAD CHILD>";

// Minimal valid 1x1 PNG (transparent pixel).
const TINY_PNG = Buffer.from(
  "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c63000100000005000100" +
    "0d0a2db40000000049454e44ae426082",
  "hex",
);

test("Upload a photo to a Child entity via the photo field", async ({
  page,
}) => {
  const users = generateUsers();
  const child = generateChild({ name: CHILD_NAME });

  await loadApp(page, [...users, child]);

  await page.getByRole("navigation").getByText("Children").click();
  await page.getByRole("cell", { name: CHILD_NAME }).click();

  // The Child details page renders in view mode. Enter edit mode so the
  // photo controls become enabled.
  await page.getByRole("button", { name: "Edit" }).click();

  // The photo edit component contains a hidden <input type="file"> —
  // Playwright can drive it directly with setInputFiles.
  const photoInput = page
    .locator("#entity-field__photo input[type='file']")
    .first();
  await photoInput.setInputFiles({
    name: "tiny.png",
    mimeType: "image/png",
    buffer: TINY_PNG,
  });

  await argosScreenshot(page, "child-after-photo-upload");

  // Save the entity.
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByRole("button", { name: "Edit" })).toBeVisible();

  // After save, the photo container shows an <img> with a non-empty src.
  const img = page.locator("#entity-field__photo img").first();
  await expect(img).toBeVisible();
  await expect(img).toHaveAttribute("src", /.+/);
});
