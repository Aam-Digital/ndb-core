import { range } from "lodash-es";

import { argosScreenshot, expect, loadApp, test } from "#e2e/fixtures.js";

import { generateUsers } from "#src/app/core/user/demo-user-generator.service.js";
import { generateChild } from "#src/app/child-dev-project/children/demo-data-generators/demo-child-generator.service.js";
import { generateNote } from "#src/app/child-dev-project/notes/demo-data/demo-note-generator.service.js";
import { generateTodo } from "#src/app/features/todos/model/demo-todo-generator.service.js";
import { faker } from "#src/app/core/demo-data/faker.js";

test("Dashboard widgets and actions", async ({ page }) => {
  const users = generateUsers();
  const demoUser = users[0];
  const children = range(8).map(() => generateChild());
  const notes = range(3).map(() =>
    generateNote({
      child: faker.helpers.arrayElement(children),
      author: faker.helpers.arrayElement(users),
    }),
  );
  const notesRecent = range(3).map(() =>
    generateNote({
      child: faker.helpers.arrayElement(children),
      author: faker.helpers.arrayElement(users),
      date: faker.date.recent({ days: 10 }),
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
    ...notesRecent,
    ...todos,
  ]);

  await expect(page.getByText("Quick Actions")).toBeVisible();
  await expect(page.getByText("6 Children")).toBeVisible();
  await expect(page.getByText("2 Notes needing follow-up")).toBeVisible();
  await expect(page.getByText("5 Tasks due")).toBeVisible();
  await expect(page.getByText("2 Children with recent report")).toBeVisible();
  await expect(
    page.getByText("4 Children having no recent reports"),
  ).toBeVisible();
  await argosScreenshot(page, "dashboard");

  await page.getByText("Record attendance").click();
  await expect(
    page.getByRole("heading", { name: "Record Attendance" }),
  ).toBeVisible();
});
