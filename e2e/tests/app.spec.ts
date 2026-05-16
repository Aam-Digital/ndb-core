import { range } from "lodash-es";

import {
  argosScreenshot,
  expect,
  loadApp,
  test,
  waitForDashboardWidgetsToLoad,
} from "#e2e/fixtures.js";
import { generateUsers } from "#src/app/core/user/demo-user-generator.service.js";
import { generateChild } from "#src/app/child-dev-project/children/demo-data-generators/demo-child-generator.service.js";
import { generateNote } from "#src/app/child-dev-project/notes/demo-data/demo-note-generator.service.js";
import { generateTodo } from "#src/app/features/todos/model/demo-todo-generator.service.js";
import { faker } from "#src/app/core/demo-data/faker.js";
import { WarningLevel } from "#src/app/child-dev-project/warning-level.js";

test("Dashboard widgets and actions", async ({ page }) => {
  const users = generateUsers();
  const demoUser = users[1];
  const children = range(8).map(() => generateChild());
  const notes = range(3).map(() =>
    generateNote({
      child: faker.helpers.arrayElement(children),
      author: faker.helpers.arrayElement(users),
      warningLevel: WarningLevel.OK,
    }),
  );
  const notesFollowUp = range(2).map((i) =>
    generateNote({
      child: children[i],
      author: faker.helpers.arrayElement(users),
      date: faker.date.recent({ days: 10 }),
      warningLevel: WarningLevel.WARNING,
    }),
  );
  const notesRecent = range(3).map((i) =>
    generateNote({
      child: children[i],
      author: faker.helpers.arrayElement(users),
      date: faker.date.recent({ days: 10 }),
      warningLevel: WarningLevel.OK,
    }),
  );
  const todos = range(0, 5).map(() =>
    generateTodo({
      entity: faker.helpers.arrayElement(children),
      assignedTo: [demoUser],
      isDue: true,
    }),
  );

  await loadApp(page, [
    ...users,
    ...children,
    ...notes,
    ...notesFollowUp,
    ...notesRecent,
    ...todos,
  ]);

  // Navigate to Record Attendance first to ensure the app initializes properly
  // This step forces the data synchronization before checking dashboard counts
  await page.getByText("Record attendance").click();
  await expect(
    page.getByRole("heading", { name: "Record Attendance" }),
  ).toBeVisible();

  // This approach avoids race conditions where dashboard widgets load before demo data sync
  await page.getByRole("navigation").getByText("Dashboard").click();

  await expect(page.getByText("Quick Actions")).toBeVisible();
  await expect(page.getByText("8 Children")).toBeVisible();
  await expect(page.getByText("2 Notes needing follow-up")).toBeVisible();
  await expect(page.getByText("5 Tasks due")).toBeVisible();
  await expect(page.getByText("3 Children with recent report")).toBeVisible();
  await expect(
    page.getByText("5 Children having no recent reports"),
  ).toBeVisible();

  // Wait for all dashboard widgets to finish loading before taking screenshot
  await waitForDashboardWidgetsToLoad(page);

  await argosScreenshot(page, "dashboard");
});

test("Changelog dialog shows latest release when version is clicked", async ({
  page,
}) => {
  await page.route("**/api.github.com/repos/**/releases**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {
          tag_name: "v1.5.0",
          name: "Release v1.5.0",
          body: "### Features\n* new dashboard widgets\n* improved reporting\n\n### Bug Fixes\n* fixed date display on small screens",
          published_at: "2025-01-15T10:00:00Z",
          prerelease: false,
          draft: false,
        },
      ]),
    }),
  );

  await loadApp(page, []);

  await page.locator("app-version").click();

  const changelogDialog = page.getByRole("dialog");
  await expect(
    changelogDialog.getByRole("heading", { name: "Latest Changes" }),
  ).toBeVisible();
  await expect(changelogDialog.getByText("Release v1.5.0")).toBeVisible();

  await argosScreenshot(page, "changelog-dialog", { fullPage: false });
});

test("Translated and localized app versions (i18n)", async ({ page }) => {
  await page.goto("/");

  // Wait for dialog to be fully interactive before clicking mat-select
  await expect(
    page.getByRole("heading", { name: "Welcome to Aam Digital!" }),
  ).toBeVisible();

  await page.getByText("Choose your language").click();
  await page.getByRole("option", { name: "Deutsch / German (de)" }).click();

  await expect(
    page.getByRole("heading", { name: "Willkommen bei Aam Digital!" }),
  ).toBeVisible();

  await page.getByRole("combobox", { name: "Anwendungsfall" }).click();
  await page.getByRole("option", { name: "Bildungsprojekt" }).click();

  // we're in a using mat-dialog, we need to scroll within the dialog container
  await page
    .getByRole("button", { name: "System erstellen" })
    .scrollIntoViewIfNeeded();

  await argosScreenshot(page, "i18n-de_init");

  await page.getByRole("button", { name: "System erstellen" }).click();

  await page
    .getByRole("button", { name: "System erkunden" })
    .click({ timeout: 10_000 });

  await expect(
    page.getByRole("button", { name: "System erkunden" }),
  ).not.toBeVisible();

  // FIXME: The dashboard may load before demo data is generated and not display
  // it. As a workaround we move to a different view and back to the dashboard
  await page.getByRole("navigation").getByText("Schüler:innen").click();

  // Extract the count from the paginator (e.g., "1 – 10 von 99" in German)
  // Wait for the paginator to load
  await page.locator(".mat-mdc-paginator-range-label").waitFor();
  const paginatorText = await page
    .locator(".mat-mdc-paginator-range-label")
    .textContent();
  const countMatch = paginatorText.match(/von (\d+)/);
  const studentCount = countMatch ? countMatch[1] : "0";

  await page.getByRole("navigation").getByText("Dashboard").click();
  await expect(page.getByText(`${studentCount} Schüler:innen`)).toBeVisible({
    timeout: 10_000,
  });

  // Wait for all dashboard widgets to finish loading before taking screenshot
  await waitForDashboardWidgetsToLoad(page);

  await argosScreenshot(page, "i18n-de_dashboard");
});

test("Admin nav, settings, and user profile are accessible to logged-in admin", async ({
  page,
}) => {
  // The demo data initializer logs in `demo-admin` by default (roles
  // ["user_app", "admin_app"]). The Admin nav entry, the Settings footer
  // button and the Sign-out button are all gated by the permission system
  // and should be visible for this role.
  await loadApp(page);

  await expect(page.getByRole("navigation").getByText("Admin")).toBeVisible();
  await expect(page.getByRole("button", { name: "Settings" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();

  await argosScreenshot(page, "admin-user-ui");

  // Expanding the Admin submenu reveals child entries (e.g. "Admin Overview");
  // this confirms the menu's permission gating let through admin-only items.
  await page.getByRole("navigation").getByText("Admin").click();
  await expect(
    page.getByRole("navigation").getByText("Admin Overview"),
  ).toBeVisible();

  // Open the user menu and navigate to the profile page.
  await page.getByRole("button", { name: "Profile" }).click();

  // The profile page has two tabs: User Account + Notification Settings.
  await expect(page.getByRole("tab", { name: "User Account" })).toBeVisible({
    timeout: 10_000,
  });
  await expect(
    page.getByRole("tab", { name: "Notification Settings" }),
  ).toBeVisible();

  await argosScreenshot(page, "user-profile-loaded");

  // Switch to the Notification Settings tab to verify the tab change works.
  await page.getByRole("tab", { name: "Notification Settings" }).click();
  await expect(
    page.getByRole("tab", { name: "Notification Settings", selected: true }),
  ).toBeVisible();
});
