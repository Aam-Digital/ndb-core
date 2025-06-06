import { expect, test, argosScreenshot, loadApp } from "#e2e/fixtures.js";

import { DemoChildGenerator } from "#src/app/child-dev-project/children/demo-data-generators/demo-child-generator.service.js";
import { DemoNoteGeneratorService } from "#src/app/child-dev-project/notes/demo-data/demo-note-generator.service.js";
import { DemoUserGeneratorService } from "#src/app/core/user/demo-user-generator.service.js";
import { DemoTodoGeneratorService } from "#src/app/features/todos/model/demo-todo-generator.service.js";

test("Dashboard widgets and actions", async ({ page }) => {
  const userGen = new DemoUserGeneratorService();
  const childGen = new DemoChildGenerator({ count: 9 });
  const noteGen = new DemoNoteGeneratorService(
    {
      minNotesPerChild: 2,
      maxNotesPerChild: 6,
      groupNotes: 3,
    },
    childGen,
    userGen,
  );
  const todoGen = new DemoTodoGeneratorService(
    {
      minPerChild: 1,
      maxPerChild: 2,
    },
    childGen,
    userGen,
  );
  await loadApp(page, [
    ...childGen.entities,
    ...noteGen.entities,
    ...todoGen.entities,
  ]);

  await expect(page.getByText("Quick Actions")).toBeVisible();
  await expect(page.getByText("8 Children")).toBeVisible();
  await expect(page.getByText("0 Tasks due")).toBeVisible();
  await expect(page.getByText("0 Notes needing follow-up")).toBeVisible();
  await expect(page.getByText("5 Children with recent report")).toBeVisible();
  await expect(
    page.getByText("3 Children having no recent reports"),
  ).toBeVisible();
  await argosScreenshot(page, "dashboard");

  await page.getByText("Record attendance").click();
  await expect(
    page.getByRole("heading", { name: "Record Attendance" }),
  ).toBeVisible();
});
