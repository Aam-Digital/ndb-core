import { argosScreenshot, expect, test } from "#e2e/fixtures.js";

test("Translated and localized app versions (i18n)", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("combobox", { name: "language" }).click();
  await page.getByRole("option", { name: "Deutsch / German (de)" }).click();

  await expect(page.getByRole("heading", { name: "Willkommen" })).toBeVisible();

  await argosScreenshot(page, "i18n-de_init");

  await page.getByRole("combobox", { name: "Anwendungsfall" }).click();
  await page.getByRole("option", { name: "Bildungsprojekt" }).click();
  await page.getByRole("button", { name: "init" }).click();

  await page.getByRole("button", { name: "System erkunden" }).click();
  await expect(
    page.getByRole("button", { name: "System erkunden" }),
  ).not.toBeVisible();

  // FIXME: The dashboard may load before demo data is generated and not display
  // it. As a workaround we move to a different view and back to the dashboard
  await page.getByRole("navigation").getByText("Schüler:innen").click();
  await page.getByRole("navigation").getByText("Dashboard").click();
  await expect(page.getByText("8 Schüler:innen")).toBeVisible();

  await argosScreenshot(page, "i18n-de_dashboard");
});
