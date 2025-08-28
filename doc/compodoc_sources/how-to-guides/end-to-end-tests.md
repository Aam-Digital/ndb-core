# End-to-end tests

End-to-end tests run the app in the browser using browser-local database. We use
[Playwright][] as the testing framework.

Before you run the tests you need to start a local development server with `npm
start`. You can use the `playwright` CLI to run the tests from the terminal or
start the [Playwright UI].

```bash
npx playwright test
npx playwright test --ui
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

* Review [Best Practices](https://playwright.dev/docs/best-practices) from the
  Playwright documentation.

* Import `test` and `expect`, `#e2e/fixtures.ts` instead of `@playwright/test`:

  ```typescript
  import { expect, test } from "#e2e/fixtures.ts";
  ```

  This prepare the application properly and loads it in the browser.

* Prefer actions over expectations. Instead of the following

  ```typescript
  const someButton = page.getByLabel("...")
  await expect(someButton).toBeVisible();
  await someButton.click();
  ```

  write

  ```typescript
  await page.getByLabel("...").click();
  ```

* Use accesibility-based locator, in descending preference
  * [`getByLabel()`](https://playwright.dev/docs/locators#locate-by-label)
  * [`getByTitle()`](https://playwright.dev/docs/locators#locate-by-title)
  * [`getByPlaceholder()`](https://playwright.dev/docs/locators#locate-by-placeholder)
  * [`getByRole()`](https://playwright.dev/docs/locators#locate-by-role)
  * [`getByText()`](https://playwright.dev/docs/locators#locate-by-text)

  Avoid CSS-based locators. If necessary, adjust the accessibility properties in
  HTML templates so that the desired elements can be located.

* Avoid navigation with `page.goto()`. Instead, click on the links that lead you
  to the desired page. This avoid reloading the app which is slow.

## Visual regression screenshots

Screenshots are captured only when either the CI or SCREENSHOT environment
variables are set.

Take screenshots after completing actions and verifying expectations:

```typescript
await someButton.click()
await expect(page.getByText("Content created")).toBeVisible()
await argosScreenshot(page, "content-created")
```

This approach captures the app in a stable state rather than during transitions.

The `argosScreenshot()` function waits for page stabilization before capturing.
Use [`aria-busy=true`][aria-busy] on loading elements to help ensure screenshots
are taken only when the UI is ready.

Visual differences between test runs may occur even when no actual changes
exist. Adjust sensitivity to minor variations using the [`threshold`
option](https://argos-ci.com/docs/playwright#argosscreenshotpage-name-options)
in `argosScreenshot()`. Set a default threshold with `argos upload
--threshold=...`

## AI-Assisted Test Development

You can use [Claude Code][] to write tests based on Gherkin-style scenario steps.
This requires a Claude account (the "Free" plan may be sufficient for occasional use).

Start by adding the steps to a test file, e.g. `e2e/tests/attendance-tests.spec.ts`:

```typescript
/*
TODO: Add a child
When I navigate to "Children"
And I click on "Add New"
Then the heading "Adding new child" is displayed
When I fill in "<NAME>" in the field "Name"
And then I click on "Save".
Then the heading changes to "<NAME>"
*/
```

Then, start `claude` and run the command `/write-e2e-tests
e2e/tests/attendance-test.spec.ts`. This will create a new test case "Add a
child". You can then work with the initial draft and fix it until it passes.

[aria-busy]: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-busy
[Playwright]: https://playwright.dev/
[Playwright UI]: https://playwright.dev/docs/test-ui-mode
[Trace Viewer]: https://playwright.dev/docs/trace-viewer
[Claude Code]: https://docs.anthropic.com/en/docs/claude-code/common-workflows#create-custom-slash-commands
