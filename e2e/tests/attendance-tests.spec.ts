import { times } from "lodash-es";

import { argosScreenshot, expect, loadApp, test } from "#e2e/fixtures.js";

import { generateUsers } from "#src/app/core/user/demo-user-generator.service.js";
import { generateActivity } from "#src/app/child-dev-project/attendance/demo-data/demo-activity-generator.service.js";
import { generateChild } from "#src/app/child-dev-project/children/demo-data-generators/demo-child-generator.service.js";
import { faker } from "#src/app/core/demo-data/faker.js";

test("Record attendance for one activity", async ({ page }) => {
  const users = generateUsers();
  const demoUser = users[0];
  const children = times(8, () => generateChild());
  const otherActivities = times(3, () =>
    generateActivity({
      participants: faker.helpers.arrayElements(children, { min: 2, max: 7 }),
      assignedUser: faker.helpers.arrayElement(users),
    }),
  );

  const childrenInActivity = faker.helpers.arrayElements(children, 3);
  const childWithRemarkName = (
    childrenInActivity[0] as unknown as { name: string }
  ).name;
  const activity = generateActivity({
    participants: childrenInActivity,
    assignedUser: demoUser,
  });

  await loadApp(page, [...users, ...children, ...otherActivities, activity]);

  await page.getByRole("navigation").getByText("Attendance").click();
  await page.getByRole("button", { name: "Record" }).click();

  const dateField = page.getByLabel("Date");
  await expect(dateField).toHaveValue("1/23/2025");

  await dateField.fill("12/25/2024");
  await dateField.blur();

  // FIXME: A simple .click() does not trigger the action and we don’t know why.
  await page.getByText(activity.title).dispatchEvent("click");

  await expect(
    page.getByRole("heading", { name: activity.title }),
  ).toBeVisible();

  await page.addStyleTag({ content: "* { transition: none !important }" });

  await expect(page.getByText("1 / 3")).toBeVisible();
  await page.getByRole("button", { name: "Present" }).click();

  await expect(page.getByText("2 / 3")).toBeVisible();
  await page.getByRole("button", { name: "Absent" }).click();
  await argosScreenshot(page, "record-attendance-person");

  await expect(page.getByText("3 / 3")).toBeVisible();
  await page.getByRole("button", { name: "Late" }).click();

  await page.getByRole("button", { name: "Review Details" }).click();
  await page.getByLabel("status").fill("Status");

  const row = page.getByRole("row").filter({ hasText: childWithRemarkName });
  await row.getByLabel("Present").click();
  await page.getByRole("option", { name: "Absent" }).click();
  await row.getByPlaceholder("Remarks").fill("CUSTOM REMARK");

  await page.getByRole("button", { name: "Save" }).click();

  await page.getByRole("navigation").getByText("Children").click();
  await page.getByRole("textbox", { name: "Filter" }).fill(childWithRemarkName);
  await page.getByRole("cell", { name: childWithRemarkName }).click();
  await page.getByRole("tab", { name: "Attendance" }).click();
  await page.getByRole("tab", { name: activity.title }).click();
  await page.getByRole("button", { name: "Choose month and year" }).click();
  await page.getByRole("button", { name: "2024" }).click();
  await page.getByRole("button", { name: "December" }).click();
  await page.getByRole("button", { name: "December 25," }).click();
  await expect(page.getByRole("textbox", { name: "Remarks" })).toHaveValue(
    "CUSTOM REMARK",
  );
  await expect(page.getByRole("combobox", { name: "Absent" })).toBeVisible();
});

test("View and download attendance report", async ({ page }) => {
  await loadApp(page);
  await page.getByRole("navigation").getByText("Reports").click();
  await page.getByRole("combobox", { name: "Select Report" }).click();
  await page.getByRole("option", { name: "Attendance Report" }).click();
  await page.getByRole("button", { name: "Open calendar" }).click();
  await page.getByRole("button", { name: "January 12," }).click();
  await page.getByRole("button", { name: "January 18," }).click();
  await page.getByRole("button", { name: "Calculate" }).click();

  // Verify the names , class , school , total , present , rate and late columns are visible
  await expect(page.getByRole("columnheader", { name: "Name" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Class" })).toBeVisible();
  await expect(
    page.getByRole("columnheader", { name: "School" }),
  ).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Total" })).toBeVisible();
  await expect(
    page.getByRole("columnheader", { name: "Present" }),
  ).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Rate" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Late" })).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "download csv Download" }).click();
  const filename = (await downloadPromise).suggestedFilename();
  expect(filename).toBe("Attendance Report 2025-01-12_2025-01-18.csv");
});

test("Children list displays monthly attendance percentage", async ({
  page,
}) => {
  await loadApp(page);
  await page.getByRole("navigation").getByText("Children").click();
  await page.getByRole("tab", { name: "School Info" }).click();
  await expect(page.getByRole("cell", { name: /\d+%/ })).toHaveCount(8);
  await argosScreenshot(page, "children-school-info");
});

test("Recurring activities list", async ({ page }) => {
  await loadApp(page);
  await page.getByRole("navigation").getByText("Attendance").click();
  await page
    .getByRole("button", {
      name: "Manage Activities",
    })
    .click();
  await expect(
    page.getByRole("heading", { name: "Recurring Activities" }),
  ).toBeVisible();
  await expect(page.getByRole("row")).toHaveCount(3);
  await argosScreenshot(page, "recurring-activities-list");
});

test("Edit participants of a recurring activity", async ({ page }) => {
  const [user] = generateUsers();
  const childToAdd = generateChild({
    name: "AAAA", // FIXME: This ensure that the child is listed first
  });
  const childToKeep = generateChild();
  const childToRemove = generateChild();
  const allChildren = [
    childToAdd,
    childToKeep,
    childToRemove,
    ...times(6, () => generateChild()),
  ];

  const coachingClass = generateActivity({
    title: "<COACHING CLASS>",
    participants: [childToKeep, childToRemove],
    assignedUser: user,
  });

  const otherActivities = times(3, () =>
    generateActivity({
      participants: faker.helpers.arrayElements(allChildren),
      assignedUser: user,
    }),
  );

  await loadApp(page, [
    user,
    ...allChildren,
    ...otherActivities,
    coachingClass,
  ]);

  // When I click on Attendance from the main menu
  await page.getByRole("navigation").getByText("Attendance").click();

  // And I click on "Manage Activities"
  await page.getByRole("button", { name: "Manage Activities" }).click();

  // And I Click on "<COACHING CLASS>"
  await page.getByRole("cell", { name: "<COACHING CLASS>" }).click();

  // And I click on the "Participants" tab
  await page.getByRole("tab", { name: "Participants" }).click();

  // And I click on "Edit"
  await page.getByRole("button", { name: "Edit" }).click();

  // And I click on the "Participants" field
  await page.getByLabel("Participants").click();

  // Then I see "Abhisyanta Sharma" selected.
  await expect(
    page
      .getByRole("option", { name: childToKeep.name })
      .getByRole("checkbox", { checked: true }),
  ).toBeVisible();

  // When I unselect "Abhisyanta Sharma."
  await page.getByRole("option", { name: childToRemove.name }).click();

  // And I select "Aasha Gill"
  await page.getByRole("option", { name: childToAdd.name }).click();
  await argosScreenshot(page, "edit-participants");

  // And I click "Save."
  await page.getByRole("button", { name: "Save" }).click();

  // Then the "Participants" field contains "Aasha Gill"
  await expect(page.getByText(childToAdd.name)).toBeVisible();

  // And the "Participants" field does not contain "Abhisyanta Sharma."
  await expect(page.getByText(childToRemove.name)).not.toBeVisible();

  // When I navigate to the Record Attendance screen
  await page.getByRole("navigation").getByText("Attendance").click();
  await page.getByRole("button", { name: "Record" }).click();

  // And I click "Show more"
  await page.getByRole("button", { name: "Show more" }).click();

  // And I click "Coaching Class 3M"
  await page.getByText("<COACHING CLASS>").click();

  // Then I can record attendance for "Aasha Gill"
  await expect(page.getByText(childToAdd.name)).toBeVisible();
});
