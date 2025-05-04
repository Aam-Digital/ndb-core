# End-to-end tests

End-to-end tests run the app in the browser using browser-local database. We use
[Playwright][] as the testing framework.

Before run the tests you need to start a local development server with `npm
start`. You can use the `playwright` CLI to run the tests from the terminal or
start the [Playwright UI].

```bash
npx playwright test
npx playwright test --ui
```

## Writing tests

* Review [Best Practices](https://playwright.dev/docs/best-practices) from the
  Playwright documentation.

* Import `test` and `expect`, `#e2e/fixtures.ts` instead of `@playwright/test`:

  ```typescript
  import { expect, test } from "#e2e/fixtures.ts";
  ```

  This prepare the application properly and loads it in the browser.

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


[Playwright]: https://playwright.dev/
[Playwright UI]: https://playwright.dev/docs/test-ui-mode
