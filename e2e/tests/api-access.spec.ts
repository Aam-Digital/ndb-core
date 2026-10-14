import { argosScreenshot, expect, loadApp, test } from "#e2e/fixtures.js";

const API_CLIENT = {
  clientId: "api-reporting-dashboard-x7k2pq",
  name: "Reporting dashboard",
  scopes: ["reporting_read"],
  createdBy: "manager@example.org",
  createdAt: "2025-01-20T10:00:00Z",
};

test("API Access: manage the credentials of external systems", async ({
  page,
}) => {
  // the page needs an admin who also manages user accounts, and the backend's admin module
  await page.addInitScript(() => {
    window["e2eUserRoles"] = ["account_manager"];
  });
  await page.route("**/actuator/features", (route) =>
    route.fulfill({
      json: { admin: { enabled: true, "api-client": { enabled: true } } },
    }),
  );
  await page.route("**/api/v1/admin/api-client/scope", (route) =>
    route.fulfill({
      json: [
        { name: "reporting_read", description: "Read reports" },
        { name: "reporting_write", description: "Calculate reports" },
        { name: "third_party_authentication", description: "Sign in users" },
      ],
    }),
  );
  await page.route("**/api/v1/admin/api-client", (route) =>
    route.request().method() === "POST"
      ? route.fulfill({
          status: 201,
          json: {
            clientId: "api-partner-platform",
            clientSecret: "Xq8vT2LmN4pR7sKcW9yZ1aBdE3fGhJ5u",
          },
        })
      : route.fulfill({ json: [API_CLIENT] }),
  );

  await loadApp(page, []);

  await page.getByText("Settings", { exact: true }).click();
  await page.getByText("User Management", { exact: true }).click();
  await page.getByText("API Access", { exact: true }).click();
  await expect(page.getByText(API_CLIENT.clientId)).toBeVisible();
  await argosScreenshot(page, "api-access-list");

  await page.getByRole("button", { name: "New API Client" }).click();
  await page.getByLabel("Name").fill("Partner platform");
  await page.getByLabel("Client ID (optional)").fill("partner-platform");
  await page.getByRole("option", { name: /Read reports/ }).click();
  await page.getByRole("option", { name: /single sign-on/ }).click();
  await expect(page.getByText("as any of its users")).toBeVisible();
  await argosScreenshot(page, "api-access-create-dialog");

  await page.getByRole("button", { name: "Create" }).click();
  await expect(page.getByText("api-partner-platform")).toBeVisible();
  await argosScreenshot(page, "api-access-credentials-dialog");
});
