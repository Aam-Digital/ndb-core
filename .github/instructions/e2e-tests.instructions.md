---
applyTo: "e2e/**"
---

# E2E Testing Patterns (Playwright)

## Imports

**Must** import from `#e2e/fixtures.js` — **not** from `@playwright/test` directly (ESLint enforced):

```typescript
import { test, expect, loadApp, argosScreenshot } from "#e2e/fixtures.js";
```

## Loading the App

Use `loadApp(page, entities?)` to bootstrap the app. Pass custom entities or omit for default demo data:

```typescript
test("my test", async ({ page }) => {
  const users = generateUsers();
  const children = range(5).map(() => generateChild());

  await loadApp(page, [...users, ...children]);

  // ... test interactions
});
```

## Test Data Generators

Use standalone `generate*()` functions for test data:

```typescript
import { generateUsers } from "#src/app/core/user/demo-user-generator.service.js";
import { generateChild } from "#src/app/child-dev-project/children/demo-data-generators/demo-child-generator.service.js";
import { generateNote } from "#src/app/child-dev-project/notes/demo-data/demo-note-generator.service.js";
import { generateTodo } from "#src/app/features/todos/model/demo-todo-generator.service.js";
import { generateActivity } from "#src/app/features/attendance/demo-data/demo-activity-generator.service.js";
```

Use `faker` for randomized fields:

```typescript
import { faker } from "#src/app/core/demo-data/faker.js";

const child = generateChild();
const note = generateNote({
  child: faker.helpers.arrayElement(children),
  author: faker.helpers.arrayElement(users),
  date: faker.date.recent({ days: 10 }),
});
```

## Clock and Dates

The clock is mocked to a fixed date. Use `E2E_REF_DATE` for date-dependent logic:

```typescript
import { E2E_REF_DATE } from "#e2e/fixtures.js";
// E2E_REF_DATE = "2025-01-23"
```

## Locators — Accessibility First

Use accessibility-based locators in this priority order:

1. `page.getByLabel("Name")` — form fields with labels
2. `page.getByTitle("Edit")` — elements with title attributes
3. `page.getByPlaceholder("Search...")` — input placeholders
4. `page.getByRole("button", { name: "Save" })` — ARIA roles
5. `page.getByText("Dashboard")` — visible text content

**Avoid** CSS selectors and `page.locator()` when possible.

## Navigation

**Avoid** `page.goto()` — click links and navigation elements instead:

```typescript
// Good: navigate by clicking
await page.getByRole("navigation").getByText("Dashboard").click();

// Avoid: direct URL navigation (except in loadApp)
// await page.goto("/dashboard");
```

## Visual Regression

Use `argosScreenshot()` at key visual checkpoints:

```typescript
import { argosScreenshot } from "#e2e/fixtures.js";

await argosScreenshot(page, "dashboard-with-data");
```

## Dashboard Loading

Use `waitForDashboardWidgetsToLoad()` before screenshots on dashboard:

```typescript
import { waitForDashboardWidgetsToLoad } from "#e2e/fixtures.js";

await waitForDashboardWidgetsToLoad(page);
await argosScreenshot(page, "dashboard");
```

## Full Test Example

```typescript
import { range } from "lodash-es";
import { argosScreenshot, expect, loadApp, test, waitForDashboardWidgetsToLoad } from "#e2e/fixtures.js";
import { generateUsers } from "#src/app/core/user/demo-user-generator.service.js";
import { generateChild } from "#src/app/child-dev-project/children/demo-data-generators/demo-child-generator.service.js";
import { generateNote } from "#src/app/child-dev-project/notes/demo-data/demo-note-generator.service.js";
import { faker } from "#src/app/core/demo-data/faker.js";

test("Dashboard shows correct counts", async ({ page }) => {
  const users = generateUsers();
  const children = range(5).map(() => generateChild());
  const notes = range(3).map(() =>
    generateNote({
      child: faker.helpers.arrayElement(children),
      author: faker.helpers.arrayElement(users),
    }),
  );

  await loadApp(page, [...users, ...children, ...notes]);

  await page.getByRole("navigation").getByText("Dashboard").click();
  await expect(page.getByText("5 Children")).toBeVisible();

  await waitForDashboardWidgetsToLoad(page);
  await argosScreenshot(page, "dashboard-counts");
});
```

## Running Tests

```bash
npm run e2e
```

## Common Interaction Patterns

### Actions

- Prefer direct actions over checking visibility first
- Use `click()` directly rather than checking if clickable
- Navigate via clicks instead of `page.goto()` to avoid reloads

### Form Interactions

```typescript
// Select options
await page.getByRole("option", { name: fixture.name }).click();

// Fill forms
await page.getByLabel("Field").fill(fixture.value);

// For select options with checkboxes, use { checked: true } not { selected: true }
await page.getByRole("option", { name: fixture.name }).getByRole("checkbox", { checked: true });
```

### Verification

```typescript
// Check visibility
await expect(page.getByText(fixture.name)).toBeVisible();

// Check absence
await expect(page.getByText(fixture.value)).not.toBeVisible();
```

### Table/List Interactions

```typescript
await page.getByRole("cell", { name: fixture.title }).click();
await page.getByText(fixture.name).click();
```

## Test Data Naming

Use semantic names for test fixtures: `childToAdd`, `childToKeep`, `childToRemove`, `activityToTest`, `userToAssign`.

Use descriptive titles with angle brackets for test activities (e.g., `"<COACHING CLASS>"`, `"<MATH TUTORING>"`) to distinguish them from real data.

## Angular Material Form Fields

Angular Material **floating labels** are **not** accessible via `getByLabel()` — the `aria-labelledby` wiring is not resolved by Playwright. Use the `mat-form-field`'s `id` attribute instead:

```typescript
// Fill a text field
await page.locator("#entity-field__subject").getByRole("textbox").fill("My Task");

// Open an entity-select dropdown
await page.locator("#entity-field__relatedEntities").locator(".fa-caret-down").click();
```

The `id` format is always `entity-field__<fieldId>` (matching the field's schema key).

## Dialog Interactions

Tasks and entity records open in **popup dialogs** (not full-page navigation) when `clickMode: "popup-details"` is configured:

```typescript
const dialog = page.getByRole("dialog");

// Enter edit mode
await dialog.getByRole("button", { name: "Edit" }).click();

// Save changes
await dialog.getByRole("button", { name: "Save" }).click();

// Close the dialog
await page.locator("button.overlay-close-button").click();
```

**Important:** The background table is `aria-hidden` while a dialog is open. Always close the dialog before querying table rows or cells in the list.

**closeOnNavigation:** Angular Material dialogs close automatically when the router navigates. Clicking a side-nav item while a dialog is open will close the dialog and navigate away.

### mat-form-field Pointer-Events Issue

Some buttons rendered inside a `mat-form-field` (e.g., the "Complete Task" button inside the `completed` field wrapper) may have their pointer events intercepted by the form field overlay. Use `{ force: true }` to bypass this:

```typescript
await dialog.getByRole("button", { name: "Complete Task" }).click({ force: true });
```

## Quirks & Special Cases

- For select options with checkboxes, use `{ checked: true }` not `{ selected: true }`
- Modal interactions: use specific button names within modal context
- Use `aria-busy=true` on loading elements for screenshot stability
