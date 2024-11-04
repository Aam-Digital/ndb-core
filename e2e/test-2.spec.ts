import { test, expect } from "@playwright/test";

test("test", async ({ page }) => {
  await page.goto("https://demo.playwright.dev/todomvc/#/");
  await page.getByPlaceholder("What needs to be done?").click();
  await page.getByPlaceholder("What needs to be done?").press("CapsLock");
  await page.getByPlaceholder("What needs to be done?").fill("D");
  await page.getByPlaceholder("What needs to be done?").press("CapsLock");
  await page
    .getByPlaceholder("What needs to be done?")
    .fill("Do the breakfast");
  await page.getByPlaceholder("What needs to be done?").press("Enter");
  await page.getByPlaceholder("What needs to be done?").press("CapsLock");
  await page.getByPlaceholder("What needs to be done?").fill("P");
  await page.getByPlaceholder("What needs to be done?").press("CapsLock");
  await page.getByPlaceholder("What needs to be done?").fill("Plant the water");
  await page.getByPlaceholder("What needs to be done?").press("Enter");
  await page.getByPlaceholder("What needs to be done?").fill("");
  await page.getByPlaceholder("What needs to be done?").press("CapsLock");
  await page.getByPlaceholder("What needs to be done?").fill("D");
  await page.getByPlaceholder("What needs to be done?").press("CapsLock");
  await page.getByPlaceholder("What needs to be done?").fill("Do some ");
  await page.getByPlaceholder("What needs to be done?").press("CapsLock");
  await page.getByPlaceholder("What needs to be done?").fill("Do some U");
  await page.getByPlaceholder("What needs to be done?").press("CapsLock");
  await page
    .getByPlaceholder("What needs to be done?")
    .fill("Do some University task");
  await page.getByPlaceholder("What needs to be done?").press("Enter");
  await page.getByPlaceholder("What needs to be done?").press("CapsLock");
  await page.getByPlaceholder("What needs to be done?").fill("P");
  await page.getByPlaceholder("What needs to be done?").press("CapsLock");
  await page.getByPlaceholder("What needs to be done?").fill("");
  await page.getByPlaceholder("What needs to be done?").press("CapsLock");
  await page.getByPlaceholder("What needs to be done?").fill("F");
  await page.getByPlaceholder("What needs to be done?").press("CapsLock");
  await page.getByPlaceholder("What needs to be done?").fill("Feed the pets");
  await page.getByPlaceholder("What needs to be done?").press("Enter");
  await page.goto("https://demo.playwright.dev/todomvc/#/");

  await page
    .locator("li")
    .filter({ hasText: "Do the breakfast" })
    .getByLabel("Toggle Todo")
    .check();
  await page
    .locator("li")
    .filter({ hasText: "Plant the water" })
    .getByLabel("Toggle Todo")
    .check();
  await page.getByRole("link", { name: "Active" }).click();
  await expect(page.getByText("Do the breakfast")).toHaveCount(0);
  await page.getByRole("link", { name: "Completed" }).click();
  await expect(page.getByText("Plant the water")).toHaveCount(1);
});
