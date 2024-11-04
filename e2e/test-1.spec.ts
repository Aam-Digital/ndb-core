import { test, expect } from "@playwright/test";

test("test", async ({ page }) => {
  await page.goto("about:blank");
});
