import { range } from "lodash-es";
import {
  argosScreenshot,
  expect,
  loadApp,
  Page,
  test,
  waitForDashboardWidgetsToLoad,
} from "#e2e/fixtures.js";
import { generateChild } from "#src/app/child-dev-project/children/demo-data-generators/demo-child-generator.service.js";
import { generateUsers } from "#src/app/core/user/demo-user-generator.service.js";
import { Entity } from "#src/app/core/entity/model/entity.js";
import { generateActivity } from "#src/app/features/attendance/demo-data/demo-activity-generator.service.js";
import { createEntityOfType } from "#src/app/core/demo-data/create-entity-of-type.js";
import "#src/app/features/public-form/public-form-config.js";

/**
 * Visual regression coverage for right-to-left layouts.
 *
 * RTL bugs are invisible to a reviewer who does not read the language, so the
 * high-risk views are pinned here rather than eyeballed. Deliberately a focused
 * set: Argos namespaces screenshots by Playwright project, so a second full RTL
 * project would rename every existing baseline as well as doubling CI time.
 */

// `loadAppInRtl` aborts the translations request on purpose, which the browser
// reports as a failed resource. Everything else must still fail the test.
test.use({ allowedConsoleErrors: [/messages.ar.json/] });

const CHILD_NAME = "RTL Test Child";
const FORM_TITLE = "RTL Registration Form";

/** matches the configured enum, so the dashboard groups them instead of showing "[invalid option]" */
const CENTER = { id: "C1", label: "Alipore" };

function makeChild(name: string) {
  const child = generateChild({ name });
  (child as unknown as { center: typeof CENTER }).center = CENTER;
  return child;
}

/**
 * Like `loadApp`, but boots the app in Arabic so the whole UI renders right-to-left.
 *
 * The locale has to be in place before the app boots: the CDK reads the document
 * direction once, when `Directionality` is constructed, and Material takes it
 * from there.
 *
 * Translations are blocked so the text stays English: these screenshots check
 * layout and direction, every locator below matches English text, and `loadApp`
 * dismisses the welcome screen by its English label.
 */
async function loadAppInRtl(page: Page, entities: Entity[]) {
  // init scripts accumulate and run in order, so this lands before the app boots
  await page.addInitScript(() => localStorage.setItem("locale", "ar"));

  // the app fetches translations from the live CDN, so without this the spec would
  // break the day Arabic is published there - on a PR that changed nothing here.
  // Aborting takes the same path as an unreachable CDN, which logs at debug level.
  await page.route("**/messages.ar.json", (route) => route.abort());

  await loadApp(page, entities);

  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");

  // ripples and transitions drift a few antialiased pixels between runs
  await page.addStyleTag({
    content: "* { transition: none !important; animation: none !important }",
  });
}

test("renders the main views right-to-left", async ({ page }) => {
  const child = makeChild(CHILD_NAME);
  await loadAppInRtl(page, [
    ...generateUsers(),
    child,
    ...range(4).map((i) => makeChild(`RTL Child ${i}`)),
  ]);

  await waitForDashboardWidgetsToLoad(page);
  // spinners clear before the rows paint, so pin a value from each widget
  // whose contents this screenshot is actually here to check
  await expect(page.getByText("Alipore")).toBeVisible();
  await expect(page.getByText("12 / 25")).toBeVisible();

  // Argos injects styles before capturing, which kicks a change-detection cycle;
  // this widget re-runs its query and briefly lists every child before settling
  // back to empty, so the capture lands on either state at random. Hidden rather
  // than masked because a mask rectangle lands on fractional pixels and leaves a
  // two-pixel seam that differs between runs. Its twin renders the same component.
  await page
    .locator("app-no-recent-notes-dashboard")
    .filter({ hasText: "Children having no recent reports" })
    .evaluate((widget: HTMLElement) => (widget.style.visibility = "hidden"));

  await argosScreenshot(page, "rtl-dashboard");

  // positioned from TypeScript rather than CSS, so it does not mirror on its own
  await page.locator(".demo-assistant-btn").click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await argosScreenshot(page, "rtl-assistant-panel", { fullPage: false });
  await page.keyboard.press("Escape");

  await page.getByRole("navigation").getByText("Children").click();
  await expect(page.getByRole("cell", { name: CHILD_NAME })).toBeVisible();
  await argosScreenshot(page, "rtl-entity-list");

  // phone, address and email are bidi-isolated on this form
  await page.getByRole("cell", { name: CHILD_NAME }).click();
  await expect(
    page.getByRole("tab", { name: "Basic Information" }),
  ).toBeVisible();
  await argosScreenshot(page, "rtl-entity-details");
});

test("renders the tree and wizard views right-to-left", async ({ page }) => {
  await loadAppInRtl(page, [
    ...generateUsers(),
    ...range(5).map((i) => makeChild(`RTL Child ${i}`)),
  ]);

  // indentation here is set from TypeScript, which no stylesheet sweep would catch
  await page.getByRole("navigation").getByText("Reports").click();
  await page.getByRole("combobox", { name: "Select Report" }).click();
  await page.getByRole("option", { name: "Basic Report" }).click();
  await page.getByRole("button", { name: "Calculate" }).click();
  await expect(page.getByRole("table")).toBeVisible();
  await argosScreenshot(page, "rtl-reporting-tree");

  // the stepper steps should run right-to-left
  await page.getByRole("navigation").getByText("Import").click();
  await expect(page.getByRole("tab", { name: "Select File" })).toBeVisible();
  await argosScreenshot(page, "rtl-import-wizard");

  await page.getByRole("navigation").getByText("Attendance").click();
  await expect(page.getByText("Record Attendance").first()).toBeVisible();
  await argosScreenshot(page, "rtl-attendance");
});

test("renders the data-entry flows right-to-left", async ({ page }) => {
  const users = generateUsers();
  const children = range(3).map((i) => makeChild(`RTL Child ${i}`));
  const activity = generateActivity({
    participants: children,
    assignedUser: users[0],
  });

  // the dashboard shortcut is hard-coded to this route, and we navigate by click
  const formConfig = createEntityOfType("PublicFormConfig", "rtl-public-form");
  formConfig.title = FORM_TITLE;
  formConfig.route = "test";
  formConfig.entity = "Child";
  formConfig.columns = [{ fields: ["name"] }];

  await loadAppInRtl(page, [...users, ...children, activity, formConfig]);

  // the roll-call swipe animation hardcodes its slide direction
  await page.getByRole("navigation").getByText("Attendance").click();
  await page.getByRole("button", { name: "Record" }).click();
  await page.getByText(activity.title).dispatchEvent("click");
  await expect(
    page.getByRole("heading", { name: activity.title }),
  ).toBeVisible();
  await argosScreenshot(page, "rtl-roll-call", { fullPage: false });

  // the only view a member of the public sees
  await page.getByRole("navigation").getByText("Dashboard").click();
  await page.getByRole("cell", { name: "Public Registration Form" }).click();
  await expect(page.getByText(FORM_TITLE)).toBeVisible({ timeout: 10_000 });
  await argosScreenshot(page, "rtl-public-form");
});

test("renders the bulk-merge dialog right-to-left", async ({ page }) => {
  // side-by-side comparison columns inside a CDK overlay
  await loadAppInRtl(page, [
    ...generateUsers(),
    ...range(2).map((i) => makeChild(`RTL Child ${i}`)),
  ]);

  await page.getByRole("navigation").getByText("Children").click();
  await page.locator("button[mat-icon-button][color='primary']").click();
  await page.getByRole("menuitem", { name: "Bulk Actions" }).click();

  for (const i of range(2)) {
    await page
      .locator("app-entities-table tbody tr")
      .filter({ hasText: `RTL Child ${i}` })
      .click();
  }

  await page
    .locator("app-entity-bulk-actions")
    .locator("input")
    .first()
    .click();
  await page.getByRole("option", { name: "Merge" }).click();
  await expect(
    page.getByRole("dialog").getByText("Merge Preview"),
  ).toBeVisible();
  await argosScreenshot(page, "rtl-bulk-merge", { fullPage: false });
});

test("renders the admin entity config right-to-left", async ({ page }) => {
  // a drag-and-drop grid: handles and panel order sit on a direction-dependent edge
  await loadAppInRtl(page, [...generateUsers(), makeChild(CHILD_NAME)]);

  await page.getByRole("navigation").getByText("Children").click();
  await page.locator("button[mat-icon-button][color='primary']").click();
  await page.getByText("Configure Data Structure").click();
  await expect(page.getByText("Configuring data structure for")).toBeVisible();

  await page.getByText("Details View & Fields").click();
  await page.waitForLoadState("networkidle");
  await argosScreenshot(page, "rtl-admin-entity-config");
});
