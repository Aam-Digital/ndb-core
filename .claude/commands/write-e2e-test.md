# Write E2E Test

You are helping write an end-to-end test for the Aam Digital project using Playwright.

## Command Usage

This command accepts an optional filename parameter:
- `/write-e2e-test` - searches for TODOs in all e2e test files
- `/write-e2e-test filename.spec.ts` - searches for TODOs only in the specified file

## TODO Implementation Mode

Search for TODO comments in e2e test files:

```bash
# If filename parameter provided, search only in that file:
grep -n "TODO" e2e/tests/[FILENAME] -A 10

# If no filename provided, search all e2e test files:
grep -r "TODO" e2e/tests/ --include="*.ts" -n -A 10
```

If TODOs are found:

1. **Implement One at a Time**: Only implement the FIRST TODO found - do not implement multiple TODOs in one run
2. **Create Test Case**: Replace the entire TODO comment block with a complete `test()` function in the specified file (or the file where the TODO was found)
3. **Expected TODO Format**: 
   ```typescript
   /*
   TODO: Test user can create a new child record
   Given I am on the children overview page
   When I click "Add Child" button
   And I fill in required fields (name, dateOfBirth)
   And I click "Save"
   Then I should see the new child in the list
   */
   ```

If no TODOs are found, point the user to
`./doc/compodoc_sources/how-to-guides/end-to-end-tests.md` for instructions on
how to use the command.

## Framework & Setup
- Use Playwright with browser-local database
- Import from `#e2e/fixtures.js` instead of `@playwright/test`
- Available imports: `{ argosScreenshot, expect, loadApp, test }` from `#e2e/fixtures.js`
- Run tests with `npx playwright test` or `npm run e2e`

## Test Structure Best Practices

### Locators (in order of preference)
1. `getByLabel()` - for form fields with labels
2. `getByRole()` - for buttons, links, checkboxes, etc.
3. `getByTitle()` - for elements with title attributes
4. `getByPlaceholder()` - for input fields with placeholders
5. `getByText()` - for text content

### Actions
- Prefer direct actions over checking visibility first
- Use `click()` directly rather than checking if clickable
- Navigate via clicks instead of `page.goto()` to avoid reloads

### Test Fixtures
- Create explicit fixtures using generator functions:
  - `generateUsers()` from `#src/app/core/user/demo-user-generator.service.js`
  - `generateChild()` from `#src/app/child-dev-project/children/demo-data-generators/demo-child-generator.service.js`
  - `generateActivity()` from `#src/app/child-dev-project/attendance/demo-data/demo-activity-generator.service.js`
- **Note**: Fixture generators are not yet implemented for all entities. If no generator exists, create dummy fixtures manually and inform the user that a generator should be created
- Use semantic names: `childToAdd`, `childToKeep`, `childToRemove`, `activityToTest`, `userToAssign`
- Load all data via `loadApp(page, [...users, ...children, ...activities])`
- Generate additional context entities for realism using `times()` from `lodash-es`
- Use descriptive titles with angle brackets for test activities (e.g., `"<COACHING CLASS>"`, `"<MATH TUTORING>"`) to distinguish them from real data
- Access faker via `faker` from `#src/app/core/demo-data/faker.js` for random selections

## Common Patterns

### Navigation
```typescript
// Main menu navigation
await page.getByRole("navigation").getByText("[Menu]").click()

// Button clicks
await page.getByRole("button", { name: "[Button]" }).click()

// Tab navigation
await page.getByRole("tab", { name: "[Tab]" }).click()

// Field clicks
await page.getByLabel("[Field]").click()
```

### Form Interactions
```typescript
// Select options
await page.getByRole("option", { name: fixture.name }).click()

// Fill forms
await page.getByLabel("[Field]").fill(fixture.value)

// For select options with checkboxes
await page.getByRole("option", { name: fixture.name }).getByRole("checkbox", { checked: true })
```

### Verification
```typescript
// Check visibility
await expect(page.getByText(fixture.name)).toBeVisible()

// Check selection state
await expect(page.getByRole("option", { name: fixture.name }).getByRole("checkbox", { checked: true })).toBeVisible()

// Check absence
await expect(page.getByText(fixture.value)).not.toBeVisible()
```

### Table/List Interactions
```typescript
// Click table cells
await page.getByRole("cell", { name: fixture.title }).click()

// Click list items
await page.getByText(fixture.name).click()
```

## Visual Regression Testing
- Use `argosScreenshot(page, "descriptive-name")` after actions complete
- Screenshots captured when CI or SCREENSHOT env vars set
- Use `aria-busy=true` on loading elements for stability

## Quirks & Special Cases
- For select options with checkboxes, use `{ checked: true }` not `{ selected: true }`
- Modal interactions: use specific button names within modal context

Now write the e2e test following these guidelines.
