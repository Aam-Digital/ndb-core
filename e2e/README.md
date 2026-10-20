# End-to-end tests

End-to-end tests run the app in the browser using browser-local database. We use
[Playwright][] as the testing framework.

The tests expect the app on `http://localhost:4200`. Serve a build there, as CI
does, rather than the `npm start` dev server:

```bash
npx ng build --configuration=development
npx serve dist -p 4200 --single
```

Then run the tests from the terminal or start the [Playwright UI]:

```bash
npm run e2e
npm run e2e -- --ui
```

To debug test runs you can use Playwright’s [Trace Viewer]. On CI traces for
all test runs are uploaded as artifacts. On the page of a workflow run you can
find them in “Artifacts” section.

## Accessibility

The tests benefit from an [accessible][] application. An accesible app make
tests easier to write, easier to understand, and less flaky.

When implementing custom components, ensure they are accessible. The simplest
approach is to use Angular Material components and standard HTML elements, which
provide good accessibility by default. For custom needs, incorporate [ARIA][]
markup.

[accessible]: https://developer.mozilla.org/en-US/docs/Web/Accessibility
[ARIA]: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA

## Writing tests

- Review [Best Practices](https://playwright.dev/docs/best-practices) from the
  Playwright documentation.

- Keep the number of stand-alone tests to a minimum: the initial `loadApp()` is
  expensive, so prefer adding a new check as an additional step to an existing
  scenario.

- A new larger feature (a new user flow, not a small change to an existing one) gets an
  e2e scenario for its main path. Keep the number of scenarios and screenshots small: every
  one adds to the run time and to the visual review, so cover the edge cases in unit tests.

- Import from `#e2e/fixtures.js` instead of `@playwright/test` (enforced by ESLint):

  ```typescript
  import { argosScreenshot, expect, loadApp, test } from "#e2e/fixtures.js";
  ```

  This prepares the application properly and loads it in the browser. The file
  also provides helpers such as `selectFilterOption()` (entity list filters),
  `readCsvRows()` (downloaded exports) and `waitForDashboardWidgetsToLoad()`.

- Prefer actions over expectations. Instead of the following

  ```typescript
  const someButton = page.getByLabel("...");
  await expect(someButton).toBeVisible();
  await someButton.click();
  ```

  write

  ```typescript
  await page.getByLabel("...").click();
  ```

- Use accessibility-based locators, in descending preference
  - [`getByLabel("Name")`](https://playwright.dev/docs/locators#locate-by-label)
  - [`getByTitle("Edit")`](https://playwright.dev/docs/locators#locate-by-title)
  - [`getByPlaceholder("Search...")`](https://playwright.dev/docs/locators#locate-by-placeholder)
  - [`getByRole("button", { name: "Save" })`](https://playwright.dev/docs/locators#locate-by-role)
  - [`getByText("Dashboard")`](https://playwright.dev/docs/locators#locate-by-text)

  Avoid CSS-based locators. If necessary, adjust the accessibility properties in
  HTML templates so that the desired elements can be located.
  Exception: Angular Material form fields, see below.

- Avoid navigation with `page.goto()`. Instead, click on the links that lead you
  to the desired page. This avoids reloading the app which is slow.

  ```typescript
  await page.getByRole("navigation").getByText("Dashboard").click();
  ```

### Test data

`loadApp(page, entities?)` loads the app with the given entities in its
database, or with the default demo data if you omit them. Create the entities
with the standalone `generate*()` functions of the demo data generators (e.g.
`generateUsers()`, `generateChild()`, `generateNote()`, `generateTodo()`,
`generateActivity()`) and use `faker` (from `#src/app/core/demo-data/faker.js`)
for randomized fields.

The clock is mocked to a fixed date. Use `E2E_REF_DATE` from
`#e2e/fixtures.js` (`"2025-01-23"`) for date-dependent logic. Dates are
displayed as `dd.MM.yyyy`.

Give fixtures semantic names (`childToAdd`, `childToKeep`, `childToRemove`,
`userToAssign`) and use titles in angle brackets (e.g. `"<COACHING CLASS>"`)
to tell them apart from demo data.

```typescript
import { range } from "lodash-es";
import { argosScreenshot, expect, loadApp, test } from "#e2e/fixtures.js";
import { faker } from "#src/app/core/demo-data/faker.js";
import { generateUsers } from "#src/app/core/user/demo-user-generator.service.js";
import { generateChild } from "#src/app/child-dev-project/children/demo-data-generators/demo-child-generator.service.js";
import { generateNote } from "#src/app/child-dev-project/notes/demo-data/demo-note-generator.service.js";

test("Dashboard shows correct counts", async ({ page }) => {
  const users = generateUsers();
  const children = range(5).map(() => generateChild());
  const notes = range(3).map(() =>
    generateNote({
      child: faker.helpers.arrayElement(children),
      author: faker.helpers.arrayElement(users),
      date: faker.date.recent({ days: 10 }),
    }),
  );

  await loadApp(page, [...users, ...children, ...notes]);

  await page.getByRole("navigation").getByText("Dashboard").click();
  await expect(page.getByText("5 Children")).toBeVisible();
});
```

### Angular Material quirks

- **Form fields:** floating labels are _not_ found by `getByLabel()`, because
  Playwright does not resolve their `aria-labelledby` wiring. Use the
  `mat-form-field`'s id instead, which is always `entity-field__<fieldId>`
  (the field's schema key):

  ```typescript
  await page.locator("#entity-field__subject").getByRole("textbox").fill("My Task");
  await page.locator("#entity-field__relatedEntities").locator(".fa-caret-down").click();
  ```

- **Options with checkboxes** (multi-select): check them with
  `{ checked: true }`, not `{ selected: true }`:

  ```typescript
  await page.getByRole("option", { name: child.name }).getByRole("checkbox", { checked: true });
  ```

- **Dialogs:** records open in a popup when `clickMode: "popup-details"` is
  configured. Scope locators to `page.getByRole("dialog")` and close it with
  `page.locator("button.overlay-close-button")`. The list behind an open dialog
  is `aria-hidden`, so close the dialog before querying table rows or cells.
  Dialogs also close automatically when the router navigates (e.g. a click on
  a side-nav item).
- **Buttons inside a `mat-form-field`** (e.g. "Complete Task") can have their
  clicks intercepted by the form field wrapper. Use `click({ force: true })`.

## Visual regression screenshots

Screenshots are captured only when either the CI or SCREENSHOT environment
variables are set. They are uploaded to Argos for comparison only when an
`ARGOS_TOKEN` is available, which on CI happens only in the "Final Review"
label flow. Regular PR pushes run the e2e tests without uploading screenshots.

Take screenshots after completing actions and verifying expectations:

```typescript
await someButton.click();
await expect(page.getByText("Content created")).toBeVisible();
await argosScreenshot(page, "content-created");
```

This approach captures the app in a stable state rather than during transitions.

The `argosScreenshot()` function waits for page stabilization before capturing.
Use [`aria-busy=true`][aria-busy] on loading elements to help ensure screenshots
are taken only when the UI is ready. On the dashboard, call
`await waitForDashboardWidgetsToLoad(page)` before taking a screenshot.

Visual differences between test runs may occur even when no actual changes
exist. Adjust sensitivity to minor variations using the [`threshold`
option](https://argos-ci.com/docs/playwright#argosscreenshotpage-name-options)
in `argosScreenshot()`. Set a default threshold with `argos upload
--threshold=...`

[aria-busy]: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-busy
[Playwright]: https://playwright.dev/
[Playwright UI]: https://playwright.dev/docs/test-ui-mode
[Trace Viewer]: https://playwright.dev/docs/trace-viewer
